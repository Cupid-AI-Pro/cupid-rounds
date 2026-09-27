import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, ArrowRight, X, Sparkles, Flame, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MatchCelebrationModal({
  user,
  partner,
  onClose,
  onStartChat
}) {
  const [hasCollided, setHasCollided] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // 1. Double confetti cannon at the moment of collision (~700ms)
    const collisionTimer = setTimeout(() => {
      setHasCollided(true);
      
      // Trigger haptic vibration if supported on phone
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate([40, 50, 90]); } catch (e) {}
      }

      // Left confetti cannon
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 65,
        origin: { x: 0.15, y: 0.55 },
        colors: ['#FF2E79', '#FF6B8B', '#FFD166', '#FFFFFF', '#FF85A1']
      });

      // Right confetti cannon
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 65,
        origin: { x: 0.85, y: 0.55 },
        colors: ['#FF2E79', '#FF6B8B', '#FFD166', '#FFFFFF', '#FF85A1']
      });
    }, 700);

    // 2. Smoothly reveal the match text and buttons (~950ms)
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 950);

    return () => {
      clearTimeout(collisionTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  if (!partner) return null;

  const partnerFirstName = (partner.name || 'Your Match').split(' ')[0];
  const userFirstName = (user?.name || 'You').split(' ')[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none overflow-hidden">
        
        {/* Dark luxury frosted glass backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl"
        />

        {/* Ambient radial lighting glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-pink-500/25 via-rose-500/35 to-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Modal Card Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative w-full max-w-sm rounded-[36px] bg-gradient-to-b from-white/95 via-white/90 to-pink-50/90 backdrop-blur-2xl border border-white/60 shadow-[0_25px_60px_-15px_rgba(255,46,121,0.4)] p-6 sm:p-7 text-center overflow-hidden z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors z-20 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Live Alert Tag */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-rose-500/15 via-pink-500/15 to-rose-500/15 border border-pink-200/80 mb-5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF2E79] animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FF2E79] to-rose-600 bg-clip-text text-transparent">
              Mutual Match Confirmed
            </span>
          </motion.div>

          {/* ------------------------------------------------------------- */}
          {/* ROLLING AVATARS COLLISION PHYSICS ARENA                      */}
          {/* ------------------------------------------------------------- */}
          <div className="relative h-28 flex items-center justify-center my-2">
            
            {/* Impact Shockwave Ring (Triggers at exact moment of collision) */}
            {hasCollided && (
              <motion.div
                initial={{ scale: 0.2, opacity: 1 }}
                animate={{ scale: 2.4, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute w-24 h-24 rounded-full border-4 border-[#FF2E79]/80 pointer-events-none"
              />
            )}

            {/* User Avatar: Rolls in from Left (Negative X + Negative Rotation) */}
            <motion.div
              initial={{ x: -160, rotate: -420, scale: 0.6, opacity: 0 }}
              animate={{ 
                x: hasCollided ? -26 : -18, 
                rotate: 0, 
                scale: 1, 
                opacity: 1 
              }}
              transition={{
                type: "spring",
                stiffness: 170,
                damping: 14,
                duration: 0.75
              }}
              className="relative z-10 w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#FF2E79] via-pink-400 to-rose-300 shadow-[0_10px_25px_rgba(255,46,121,0.35)] shrink-0"
            >
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'}
                alt={userFirstName}
                className="w-full h-full object-cover rounded-full border-2 border-white bg-slate-100"
              />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/90 text-white text-[9px] font-bold shadow-xs whitespace-nowrap">
                {userFirstName}
              </span>
            </motion.div>

            {/* Center Exploding Heart Badge (Pops out when avatars collide) */}
            <motion.div
              initial={{ scale: 0, rotate: -30, opacity: 0 }}
              animate={hasCollided ? { scale: [0, 1.35, 1], rotate: [0, 12, 0], opacity: 1 } : {}}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="relative z-20 w-11 h-11 rounded-full bg-gradient-to-tr from-[#FF2E79] via-rose-500 to-pink-500 flex items-center justify-center shadow-[0_0_20px_#FF2E79] border-2 border-white shrink-0 -mx-3"
            >
              <Heart className="w-5 h-5 text-white fill-white animate-bounce" style={{ animationDuration: '1.2s' }} />
            </motion.div>

            {/* Partner Avatar: Rolls in from Right (Positive X + Positive Rotation) */}
            <motion.div
              initial={{ x: 160, rotate: 420, scale: 0.6, opacity: 0 }}
              animate={{ 
                x: hasCollided ? 26 : 18, 
                rotate: 0, 
                scale: 1, 
                opacity: 1 
              }}
              transition={{
                type: "spring",
                stiffness: 170,
                damping: 14,
                duration: 0.75
              }}
              className="relative z-10 w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#FF2E79] via-pink-400 to-rose-300 shadow-[0_10px_25px_rgba(255,46,121,0.35)] shrink-0"
            >
              <img
                src={partner.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'}
                alt={partnerFirstName}
                className="w-full h-full object-cover rounded-full border-2 border-white bg-slate-100"
              />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/90 text-white text-[9px] font-bold shadow-xs whitespace-nowrap">
                {partnerFirstName}
              </span>
            </motion.div>

          </div>

          {/* ------------------------------------------------------------- */}
          {/* SMOOTH ANNOUNCEMENT REVEAL                                   */}
          {/* ------------------------------------------------------------- */}
          <div className="space-y-2 mt-4 mb-6">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45 }}
              className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display"
            >
              It's a <span className="bg-gradient-to-r from-[#FF2E79] via-pink-600 to-rose-500 bg-clip-text text-transparent">Match!</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed max-w-[270px] mx-auto"
            >
              You and <span className="text-slate-900 font-extrabold">{partner.name}</span> liked each other!
            </motion.p>

            {/* Compatibility pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={showContent ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.28, duration: 0.4 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100/70 text-slate-700 text-[11px] font-bold border border-pink-200/60"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{partner.matchScore || 94}% Compatibility</span>
              <span className="text-slate-300">•</span>
              <span>{partner.university ? partner.university.split(' ')[0] : 'Bennett'}</span>
            </motion.div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* ACTION BUTTONS (IMMEDIATE DIRECT CHAT ACCESS)                 */}
          {/* ------------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={showContent ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.45 }}
            className="flex flex-col gap-2.5"
          >
            {/* Primary CTA: Directly open chat with this matched partner */}
            <button
              onClick={() => onStartChat(partner)}
              className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-[#FF2E79] via-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black text-sm shadow-[0_10px_25px_-5px_rgba(255,46,121,0.5)] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Chat with {partnerFirstName} Now</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Secondary CTA: Keep browsing other candidate profiles */}
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-full bg-white/80 hover:bg-white text-slate-600 font-bold text-xs border border-pink-100/80 hover:text-slate-900 transition-all cursor-pointer"
            >
              Keep Swiping
            </button>
          </motion.div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
