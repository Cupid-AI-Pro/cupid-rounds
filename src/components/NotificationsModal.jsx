import React from 'react';
import { 
  Bell, 
  X, 
  Heart, 
  Calendar, 
  Flame, 
  CheckCheck, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationManager';

export default function NotificationsModal({ user, notifications, onClose, onRefresh, onNavigateTab }) {
  const handleItemClick = (notif) => {
    markNotificationAsRead(user.id, notif.id);
    onRefresh();
    if (notif.actionUrl && onNavigateTab) {
      onNavigateTab(notif.actionUrl);
      onClose();
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(user.id);
    onRefresh();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-white rounded-[28px] max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#FFF0F4] via-[#FFEBEF] to-[#FFF5F8] border-b border-rose-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#FF2E79] text-white flex items-center justify-center shadow-md shadow-rose-200 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 font-display flex items-center gap-2">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FF2E79] text-white">
                    {unreadCount} NEW
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Likes, round alerts & mutual match updates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-600 border border-slate-200 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toolbar */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="px-4 py-2 bg-pink-50/50 border-b border-rose-100/50 flex justify-end shrink-0">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-bold text-[#FF2E79] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          </div>
        )}

        {/* Notifications List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
          {notifications.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-pink-50 text-pink-300 flex items-center justify-center mx-auto">
                <Bell className="w-7 h-7" />
              </div>
              <p className="text-xs font-bold text-slate-400">No notifications yet.</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                When someone likes your profile or your state round goes live, you'll get instant alerts here!
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const getIcon = () => {
                if (notif.type === 'like') return <Heart className="w-4 h-4 text-[#FF2E79] fill-current" />;
                if (notif.type === 'match') return <Heart className="w-4 h-4 text-emerald-600 fill-current" />;
                if (notif.type === 'round_1day') return <Calendar className="w-4 h-4 text-amber-600" />;
                if (notif.type === 'round_today') return <Flame className="w-4 h-4 text-[#FF2E79] fill-current" />;
                return <ShieldCheck className="w-4 h-4 text-blue-600" />;
              };

              const getBg = () => {
                if (!notif.read) return 'bg-rose-50/70 border-rose-200/90 shadow-2xs';
                return 'bg-white border-slate-100/90 hover:bg-slate-50/80';
              };

              const timeFormatted = notif.timestamp 
                ? new Date(notif.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : 'Just now';

              return (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${getBg()}`}
                >
                  <div className="w-9 h-9 rounded-full bg-white shadow-2xs border border-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-extrabold text-slate-900 truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {timeFormatted}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      {notif.message}
                    </p>

                    {notif.actionUrl && (
                      <span className="text-[10px] font-bold text-[#FF2E79] flex items-center gap-0.5 mt-1.5 hover:underline">
                        <span>Tap to view</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-[#FF2E79] shrink-0 mt-1.5"></span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Cupid Notification System • Live Alerts
          </span>
        </div>

      </div>
    </div>
  );
}
