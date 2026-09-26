import React, { useState, useEffect } from 'react';
import { Bell, X, Heart } from 'lucide-react';

export default function InAppNotificationToast({ onOpenNotifications }) {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleNewNotice = (e) => {
      const { title, message, type } = e.detail || {};
      if (title || message) {
        setToast({
          id: `toast_${Date.now()}`,
          title: title || 'Cupid Rounds Alert',
          message: message || 'You have a new update in Cupid Rounds!',
          type: type || 'system'
        });

        // Trigger subtle haptic vibration if supported on phone
        if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
          try {
            navigator.vibrate([150, 80, 150]);
          } catch (err) {
            // Ignore vibration error
          }
        }
      }
    };

    window.addEventListener('cupid_new_notification', handleNewNotice);
    return () => {
      window.removeEventListener('cupid_new_notification', handleNewNotice);
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-sm animate-bounce-in select-none">
      <div 
        onClick={() => {
          setToast(null);
          if (onOpenNotifications) onOpenNotifications();
        }}
        className="bg-white/98 backdrop-blur-2xl border border-pink-200 shadow-[0_15px_40px_rgba(255,46,121,0.22)] rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-all duration-200"
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5C93] to-[#FF2E79] flex items-center justify-center text-white shadow-md shrink-0">
          <Heart className="w-5.5 h-5.5 fill-white text-white drop-shadow-sm" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-[#FF2E79] bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-md">
              LIVE ALERT
            </span>
            <span className="text-[10px] font-semibold text-slate-400">Just now</span>
          </div>
          <h4 className="text-xs font-black text-slate-900 truncate leading-snug">
            {toast.title}
          </h4>
          <p className="text-[11px] font-medium text-slate-600 truncate leading-snug mt-0.5">
            {toast.message}
          </p>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            setToast(null);
          }}
          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
