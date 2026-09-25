/**
 * notificationManager.js
 * In-App & Native Device Notification System for Cupid Rounds
 * Handles Likes, Mutual Matches, 1-Day Prior Round Reminders, Round Day Live Alerts, and Refund Updates.
 * Automatically dispatches system notification bar popups without emojis.
 */

import { getUsers, saveUsers } from '../utils/storage';
import { getStateRoundSchedule } from '../utils/roundManager';

const NOTIFICATIONS_KEY_PREFIX = 'cupid_notifications_';

/**
 * Request device notification permission for system notification bar alerts
 */
export const requestDeviceNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.warn('Device notification permission request failed:', e);
      }
    }
  }
};

/**
 * Dispatch system OS / Phone notification bar alert
 */
export const sendDeviceNotification = (title, message) => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'cupid_round_alert'
      });
    } catch (e) {
      console.warn('Device notification bar popup error:', e);
    }
  }
};

export const getNotifications = (userId) => {
  if (!userId) return [];
  const key = `${NOTIFICATIONS_KEY_PREFIX}${userId}`;
  const json = localStorage.getItem(key);
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch (e) {
    return [];
  }
};

export const saveNotifications = (userId, notifications) => {
  if (!userId) return;
  const key = `${NOTIFICATIONS_KEY_PREFIX}${userId}`;
  localStorage.setItem(key, JSON.stringify(notifications));

  // Async sync to Supabase if configured
  if (typeof window !== 'undefined') {
    import('./supabaseClient').then(({ supabase, isSupabaseConfigured }) => {
      if (isSupabaseConfigured()) {
        const unreadList = notifications.filter(n => !n.read);
        unreadList.forEach(n => {
          supabase
            .from('notifications')
            .upsert({
              id: n.id,
              user_id: userId,
              type: n.type,
              title: n.title,
              message: n.message,
              read: n.read,
              created_at: n.timestamp || new Date().toISOString()
            }, { onConflict: 'id' })
            .then(({ error }) => {
              if (error) console.warn('Supabase notification sync notice:', error.message);
            });
        });
      }
    });
  }
};

export const addNotification = (userId, { type, title, message, actionUrl }) => {
  if (!userId) return;

  // Clean title & message from any emojis
  const cleanTitle = (title || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  const cleanMessage = (message || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

  const list = getNotifications(userId);

  // Avoid duplicate round alerts on same day
  const todayStr = new Date().toISOString().split('T')[0];
  if (type === 'round_1day' || type === 'round_today') {
    const exists = list.some(n => n.type === type && n.timestamp?.startsWith(todayStr));
    if (exists) return;
  }

  const newNotice = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type, // 'like' | 'match' | 'round_1day' | 'round_today' | 'payment' | 'refund'
    title: cleanTitle || title,
    message: cleanMessage || message,
    actionUrl: actionUrl || null,
    timestamp: new Date().toISOString(),
    read: false
  };

  const updated = [newNotice, ...list];
  saveNotifications(userId, updated);

  // Trigger system device notification bar alert automatically
  sendDeviceNotification(cleanTitle || title, cleanMessage || message);

  return newNotice;
};

export const markNotificationAsRead = (userId, notificationId) => {
  const list = getNotifications(userId);
  const updated = list.map(n => n.id === notificationId ? { ...n, read: true } : n);
  saveNotifications(userId, updated);
  return updated;
};

export const markAllNotificationsAsRead = (userId) => {
  const list = getNotifications(userId);
  const updated = list.map(n => ({ ...n, read: true }));
  saveNotifications(userId, updated);
  return updated;
};

export const getUnreadCount = (userId) => {
  const list = getNotifications(userId);
  return list.filter(n => !n.read).length;
};

/**
 * Check and issue 1-day prior and round day notifications for a user automatically
 */
export const checkAndTriggerRoundNotifications = (user) => {
  if (!user || !user.id || !user.state) return;

  const schedule = getStateRoundSchedule(user.state);
  if (!schedule) return;

  if (schedule.daysLeft === 1) {
    addNotification(user.id, {
      type: 'round_1day',
      title: 'Round Starts Tomorrow',
      message: `Matchmaking Round for ${user.state} starts tomorrow (${schedule.nextRoundDate}). Make sure your profile photos & preferences are updated!`,
      actionUrl: 'profile'
    });
  } else if (schedule.isToday) {
    addNotification(user.id, {
      type: 'round_today',
      title: 'Match Round is LIVE Today',
      message: `Round #${schedule.roundNumber} is active for ${user.state} today! Participate now to get matched with your top compatible candidates.`,
      actionUrl: 'explore'
    });
  }
};

