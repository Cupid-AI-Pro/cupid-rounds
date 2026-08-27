import React, { useState } from 'react';
import { 
  MapPin, 
  Bell, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Compass, 
  ArrowRight,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PermissionModal({ onComplete }) {
  const [locationAllowed, setLocationAllowed] = useState(true);
  const [notificationAllowed, setNotificationAllowed] = useState(true);
  const [isGranting, setIsGranting] = useState(false);

  const handleGrant = () => {
    setIsGranting(true);
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF2D55', '#10B981', '#EC4899']
      });
      onComplete({ location: locationAllowed, notifications: notificationAllowed });
    }, 600);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-3 animate-fade-in select-none">
      <div className="bg-white rounded-3xl p-5 max-w-[340px] w-full text-center shadow-2xl border border-rose-100 relative animate-slide-up">
        
        {/* Animated Icon Ring */}
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-rose-200">
          <Compass className="w-8 h-8 animate-spin-slow" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </span>
        </div>

        <h3 className="text-lg font-black text-slate-900 font-display">
          Personalize Your Cupid Experience
        </h3>
        <p className="text-[11px] text-slate-500 mt-1 mb-4 leading-relaxed">
          Allow access to discover campus singles nearby and receive instant mutual match alerts.
        </p>

        {/* Permission Cards */}
        <div className="space-y-2.5 text-left mb-4">
          
          {/* Location Services */}
          <div 
            onClick={() => setLocationAllowed(!locationAllowed)}
            className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
              locationAllowed 
                ? 'bg-pink-50/60 border-[#FF2D55]' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-[#FF2D55] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block">Campus Radar Location</span>
                <span className="text-[9.5px] text-slate-500 font-medium block">
                  Find candidates near your college
                </span>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
              locationAllowed ? 'bg-[#FF2D55] border-[#FF2D55] text-white' : 'border-slate-300'
            }`}>
              {locationAllowed && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Push Notifications */}
          <div 
            onClick={() => setNotificationAllowed(!notificationAllowed)}
            className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
              notificationAllowed 
                ? 'bg-pink-50/60 border-[#FF2D55]' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-[#FF2D55] flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block">Instant Match Alerts</span>
                <span className="text-[9.5px] text-slate-500 font-medium block">
                  Get notified when someone likes you
                </span>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
              notificationAllowed ? 'bg-[#FF2D55] border-[#FF2D55] text-white' : 'border-slate-300'
            }`}>
              {notificationAllowed && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleGrant}
            disabled={isGranting}
            className="w-full h-11 bg-[#FF2D55] hover:bg-[#e02447] text-white font-extrabold text-xs rounded-full flex items-center justify-center gap-1.5 shadow-md shadow-rose-200 transition-all active:scale-98 cursor-pointer"
          >
            {isGranting ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
            ) : (
              <>
                <span>Enable & Continue to Radar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
