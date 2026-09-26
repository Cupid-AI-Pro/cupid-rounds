/**
 * notificationManager.js
 * In-App & Native Device Notification System for Cupid Rounds
 * Handles Likes, Mutual Matches, Broadcasts, 1-Day Prior Round Reminders, Round Day Live Alerts, and Refund Updates.
 * Automatically dispatches system OS notification bar popups on user phones.
 */

import { getUsers, saveUsers } from '../utils/storage.js';
import { getStateRoundSchedule } from '../utils/roundManager.js';

const NOTIFICATIONS_KEY_PREFIX = 'cupid_notifications_';
const GLOBAL_BROADCASTS_KEY = 'cupid_global_broadcasts';
const RECEIVED_BROADCASTS_PREFIX = 'cupid_received_broadcasts_';

/**
 * Request device notification permission for system notification bar alerts & register service worker
 */
export const requestDeviceNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          sendDeviceNotification('Notifications Enabled', 'You will now receive live match and round updates on your phone!');
        }
      } catch (e) {
        console.warn('Device notification permission request failed:', e);
      }
    }
  }

  // Ensure Service Worker is active for mobile phone status bar notifications
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        await navigator.serviceWorker.register('/sw.js');
      }
    } catch (e) {
      console.warn('Service worker registration notice:', e);
    }
  }
};

const recentSentNotices = new Map();

/**
 * Dispatch system OS / Phone notification bar alert
 */
export const sendDeviceNotification = (title, message) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  const cleanTitle = (title || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  const cleanMessage = (message || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

  // Deduplication guard: ignore exact duplicate title+message sent within 4 seconds
  const key = `${cleanTitle}___${cleanMessage}`;
  const now = Date.now();
  if (recentSentNotices.has(key) && (now - recentSentNotices.get(key)) < 4000) {
    return;
  }
  recentSentNotices.set(key, now);
  if (recentSentNotices.size > 20) {
    recentSentNotices.clear();
  }

  if (Notification.permission === 'granted') {
    try {
      const stableTag = `cupid_alert_${(cleanTitle || 'notice').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          if (reg && typeof reg.showNotification === 'function') {
            reg.showNotification(cleanTitle || title, {
              body: cleanMessage || message,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              vibrate: [200, 100, 200],
              tag: stableTag
            });
          } else {
            new Notification(cleanTitle || title, {
              body: cleanMessage || message,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              tag: stableTag
            });
          }
        }).catch(() => {
          new Notification(cleanTitle || title, {
            body: cleanMessage || message,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: stableTag
          });
        });
      } else {
        new Notification(cleanTitle || title, {
          body: cleanMessage || message,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: stableTag
        });
      }
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
    import('./supabaseClient.js').then(({ supabase, isSupabaseConfigured }) => {
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
    type, 
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

  // Dispatch custom event for in-app floating notification toast banner
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cupid_new_notification', { detail: newNotice }));
  }

  return newNotice;
};

/**
 * Send a broadcast notification from Admin to all users
 */
export const broadcastNotification = ({ title, message }) => {
  const cleanTitle = (title || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  const cleanMessage = (message || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

  const broadcastItem = {
    id: `broadcast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: cleanTitle || title,
    message: cleanMessage || message,
    timestamp: new Date().toISOString()
  };

  // 1. Save locally in global broadcasts storage
  try {
    const existing = JSON.parse(localStorage.getItem(GLOBAL_BROADCASTS_KEY) || '[]');
    const updated = [broadcastItem, ...existing].slice(0, 50);
    localStorage.setItem(GLOBAL_BROADCASTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save global broadcast:', e);
  }

  // 2. Sync to Supabase if configured
  if (typeof window !== 'undefined') {
    import('./supabaseClient.js').then(({ supabase, isSupabaseConfigured }) => {
      if (isSupabaseConfigured()) {
        supabase
          .from('notifications')
          .insert({
            id: broadcastItem.id,
            user_id: 'BROADCAST_ALL',
            type: 'system',
            title: broadcastItem.title,
            message: broadcastItem.message,
            read: false,
            created_at: broadcastItem.timestamp
          })
          .then(({ error }) => {
            if (error) console.warn('Supabase broadcast sync notice:', error.message);
          });
      }
    });
  }

  // 3. Deliver to all registered users on current device immediately
  const allUsers = getUsers();
  allUsers.forEach(u => {
    addNotification(u.id, {
      type: 'system',
      title: broadcastItem.title,
      message: broadcastItem.message,
      actionUrl: 'explore'
    });
  });

  return broadcastItem;
};

/**
 * Sync global & Supabase broadcasts to a specific user's notification list and trigger phone status bar notification popups
 */
export const syncBroadcastNotifications = async (userId) => {
  if (!userId) return;

  const receivedKey = `${RECEIVED_BROADCASTS_PREFIX}${userId}`;
  let receivedIds = [];
  try {
    receivedIds = JSON.parse(localStorage.getItem(receivedKey) || '[]');
  } catch (e) {
    receivedIds = [];
  }

  let broadcasts = [];
  try {
    broadcasts = JSON.parse(localStorage.getItem(GLOBAL_BROADCASTS_KEY) || '[]');
  } catch (e) {
    broadcasts = [];
  }

  // Check Supabase for remote broadcasts
  if (typeof window !== 'undefined') {
    try {
      const { supabase, isSupabaseConfigured } = await import('./supabaseClient.js');
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', 'BROADCAST_ALL')
          .order('created_at', { ascending: false })
          .limit(20);
        if (!error && data) {
          const supabaseBroadcasts = data.map(d => ({
            id: d.id,
            title: d.title,
            message: d.message,
            timestamp: d.created_at
          }));
          const merged = [...broadcasts];
          supabaseBroadcasts.forEach(sb => {
            if (!merged.some(m => m.id === sb.id)) {
              merged.push(sb);
            }
          });
          broadcasts = merged;
          localStorage.setItem(GLOBAL_BROADCASTS_KEY, JSON.stringify(broadcasts));
        }
      }
    } catch (e) {
      // Graceful fallback to local broadcasts
    }
  }

  const unreceived = broadcasts.filter(b => !receivedIds.includes(b.id));

  unreceived.forEach(b => {
    addNotification(userId, {
      type: 'system',
      title: b.title,
      message: b.message,
      actionUrl: 'explore'
    });
    receivedIds.push(b.id);
  });

  if (unreceived.length > 0) {
    localStorage.setItem(receivedKey, JSON.stringify(receivedIds));
  }
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
