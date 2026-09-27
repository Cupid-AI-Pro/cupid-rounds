/**
 * notificationManager.js
 * In-App & Native Device Notification System for Cupid Rounds
 * Handles Likes, Mutual Matches, Broadcasts, 1-Day Prior Round Reminders, Round Day Live Alerts, and Refund Updates.
 * Automatically dispatches system OS notification bar popups on user phones (notification shade / scroll-down).
 */

import { getUsers, saveUsers } from '../utils/storage.js';
import { getStateRoundSchedule } from '../utils/roundManager.js';

const NOTIFICATIONS_KEY_PREFIX = 'cupid_notifications_';
const GLOBAL_BROADCASTS_KEY = 'cupid_global_broadcasts';
const RECEIVED_BROADCASTS_PREFIX = 'cupid_received_broadcasts_';

/**
 * Get current device notification permission status
 */
export const getDeviceNotificationStatus = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission; // 'granted' | 'denied' | 'default'
};

/**
 * Play a pleasant synthesized modern notification chime and trigger haptic vibration
 */
export const playNotificationChime = () => {
  try {
    if (typeof window === 'undefined') return;

    // Haptic vibration for mobile phones
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch (e) {}
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
};

/**
 * Explicit user-gesture driven notification permission request (Required by mobile Chrome & Safari)
 */
export const requestNotificationPermissionUserGesture = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, status: 'unsupported' };
  }

  try {
    // Ensure service worker is registered
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (swErr) {
        console.warn('[SW] Registration warning:', swErr);
      }
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      setTimeout(() => {
        sendDeviceNotification(
          'Phone Notifications Enabled!',
          'You will now receive Cupid Rounds live updates and matches in your phone status bar.'
        );
      }, 400);
      return { granted: true, status: 'granted' };
    }

    return { granted: false, status: permission };
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return { granted: false, status: 'error' };
  }
};

/**
 * Legacy permission requester (registers SW and checks existing permission)
 */
export const requestDeviceNotificationPermission = async () => {
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

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      return true;
    }
  }
  return false;
};

const recentSentNotices = new Map();

/**
 * Dispatch system OS / Phone notification bar alert (appears in phone's notification scroll-down shade)
 */
export const sendDeviceNotification = async (title, message, extraOptions = {}) => {
  if (typeof window === 'undefined') return false;

  playNotificationChime();

  const cleanTitle = (title || 'Cupid Rounds Alert')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim() || 'Cupid Rounds Alert';

  const cleanMessage = (message || '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim() || message || 'New alert from Cupid Rounds';

  // Deduplication guard: ignore exact duplicate title+message sent within 3 seconds
  const key = `${cleanTitle}___${cleanMessage}`;
  const now = Date.now();
  if (recentSentNotices.has(key) && (now - recentSentNotices.get(key)) < 3000) {
    return false;
  }
  recentSentNotices.set(key, now);
  if (recentSentNotices.size > 20) {
    recentSentNotices.clear();
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions = {
    body: cleanMessage,
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [200, 100, 200],
    tag: `cupid_alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: {
      url: extraOptions?.actionUrl || '/',
      timestamp: Date.now()
    }
  };

  // Primary method for mobile phones: ServiceWorker showNotification
  if ('serviceWorker' in navigator) {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }

      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(cleanTitle, notificationOptions);
        return true;
      }

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: cleanTitle,
          options: notificationOptions
        });
        return true;
      }
    } catch (swErr) {
      console.warn('Service Worker notification dispatch notice:', swErr);
    }
  }

  // Desktop fallback constructor (Allowed on desktop Chrome/Safari/Firefox)
  try {
    new Notification(cleanTitle, notificationOptions);
    return true;
  } catch (nErr) {
    // Expected on Android Chrome if SW showNotification was needed
  }

  return false;
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
  if (!userId) return null;

  const cleanTitle = (title || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || title;
  const cleanMessage = (message || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || message;

  const list = getNotifications(userId);

  // Avoid duplicate round alerts on same day
  const todayStr = new Date().toISOString().split('T')[0];
  if (type === 'round_1day' || type === 'round_today') {
    const exists = list.some(n => n.type === type && n.timestamp?.startsWith(todayStr));
    if (exists) return null;
  }

  const newNotice = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: type || 'system', 
    title: cleanTitle,
    message: cleanMessage,
    actionUrl: actionUrl || null,
    timestamp: new Date().toISOString(),
    read: false
  };

  const updated = [newNotice, ...list];
  saveNotifications(userId, updated);

  // Trigger phone system status bar notification
  sendDeviceNotification(cleanTitle, cleanMessage, { actionUrl });

  // Dispatch custom event for in-app floating notification shade
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cupid_new_notification', { detail: newNotice }));
  }

  return newNotice;
};

/**
 * Send a broadcast notification from Admin to all users across cloud & connected phones
 */
export const broadcastNotification = async ({ title, message }) => {
  const cleanTitle = (title || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || title;
  const cleanMessage = (message || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || message;

  const broadcastItem = {
    id: `broadcast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: cleanTitle,
    message: cleanMessage,
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

  // 2. Deliver to local storage users on current device
  try {
    const allUsers = getUsers();
    allUsers.forEach(u => {
      addNotification(u.id, {
        type: 'system',
        title: broadcastItem.title,
        message: broadcastItem.message,
        actionUrl: 'explore'
      });
    });
  } catch (e) {}

  // 3. Sync to Supabase & broadcast in realtime to all connected user phones
  if (typeof window !== 'undefined') {
    try {
      const { supabase, isSupabaseConfigured } = await import('./supabaseClient.js');
      if (isSupabaseConfigured()) {
        // Write to Supabase notifications table
        await supabase
          .from('notifications')
          .insert({
            id: broadcastItem.id,
            user_id: 'BROADCAST_ALL',
            type: 'system',
            title: broadcastItem.title,
            message: broadcastItem.message,
            read: false,
            created_at: broadcastItem.timestamp
          });

        // Instant push to all connected phones via Supabase Realtime WebSocket
        const channel = supabase.channel('cupid_global_alerts');
        await channel.send({
          type: 'broadcast',
          event: 'admin_broadcast',
          payload: broadcastItem
        });
      }
    } catch (err) {
      console.warn('Supabase broadcast sync error:', err);
    }
  }

  return broadcastItem;
};

/**
 * Setup Supabase Realtime broadcast listener & phone visibility change sync
 */
export const setupRealtimeBroadcastListener = (userId, onNotificationReceived) => {
  if (typeof window === 'undefined' || !userId) return () => {};

  let activeChannel = null;

  const handleIncomingPayload = (payload) => {
    if (!payload || !payload.id) return;
    const receivedKey = `${RECEIVED_BROADCASTS_PREFIX}${userId}`;
    let receivedIds = [];
    try {
      receivedIds = JSON.parse(localStorage.getItem(receivedKey) || '[]');
    } catch (e) {
      receivedIds = [];
    }

    if (receivedIds.includes(payload.id)) return; // Already received

    // Mark as received
    receivedIds.push(payload.id);
    localStorage.setItem(receivedKey, JSON.stringify(receivedIds));

    // Save into user notifications & trigger status bar alert
    const added = addNotification(userId, {
      type: 'system',
      title: payload.title,
      message: payload.message,
      actionUrl: 'explore'
    });

    if (onNotificationReceived) {
      onNotificationReceived(added);
    }
  };

  // Connect to Supabase Realtime channel for instant cross-device push
  import('./supabaseClient.js').then(({ supabase, isSupabaseConfigured }) => {
    if (isSupabaseConfigured()) {
      activeChannel = supabase.channel('cupid_global_alerts', {
        config: { broadcast: { ack: false } }
      });

      activeChannel
        .on('broadcast', { event: 'admin_broadcast' }, ({ payload }) => {
          handleIncomingPayload(payload);
        })
        .subscribe();
    }
  }).catch(() => {});

  // Instant sync when user opens phone or switches back to Cupid tab
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      syncBroadcastNotifications(userId).then(() => {
        if (onNotificationReceived) onNotificationReceived();
      });
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleVisibilityChange);
    if (activeChannel) {
      import('./supabaseClient.js').then(({ supabase }) => {
        supabase.removeChannel(activeChannel);
      }).catch(() => {});
    }
  };
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
