import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Sparkles, 
  Heart,
  X,
  Send,
  Check,
  GraduationCap,
  Navigation
} from 'lucide-react';

export default function SwipeableDeck({ 
  candidates = [], 
  onLike, 
  onDecline, 
  onOpenDetail,
  user
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setCurrentIndex(0);
  }, [candidates.length]);

  const currentCandidate = candidates[currentIndex];
  const nextCandidate = candidates[currentIndex + 1];

  const handleTouchStart = (e) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    startPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.touches[0].clientX - startPosRef.current.x;
    const dy = e.touches[0].clientY - startPosRef.current.y;
    setDragOffset({ x: dx, y: dy });
    if (dx > 40) setSwipeDirection('like');
    else if (dx < -40) setSwipeDirection('pass');
    else setSwipeDirection(null);
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    if (dragOffset.x > 90) triggerSwipe('like');
    else if (dragOffset.x < -90) triggerSwipe('pass');
    else { setDragOffset({ x: 0, y: 0 }); setSwipeDirection(null); }
  };

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      setDragOffset({ x: dx, y: dy });
      if (dx > 40) setSwipeDirection('like');
      else if (dx < -40) setSwipeDirection('pass');
      else setSwipeDirection(null);
    };
    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      if (dragOffset.x > 90) triggerSwipe('like');
      else if (dragOffset.x < -90) triggerSwipe('pass');
      else { setDragOffset({ x: 0, y: 0 }); setSwipeDirection(null); }
    };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset.x]);

  const triggerSwipe = (dir) => {
    if (!currentCandidate) return;
    if (dir === 'like') onLike(currentCandidate);
    else onDecline(currentCandidate);
    setDragOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
    setCurrentIndex(prev => prev + 1);
  };

  if (!currentCandidate) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center text-center p-6 bg-white/80 backdrop-blur-md border border-white rounded-[36px] select-none shadow-sm">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-[#FF2E79] flex items-center justify-center mb-3">
          <Sparkles className="w-7 h-7" />
        </div>
        <h4 className="text-base font-black text-slate-900 font-display">You're All Caught Up!</h4>
        <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
          You've reviewed all active candidates. Check back later for more matches!
        </p>
      </div>
    );
  }

  const rotateDeg = dragOffset.x * 0.06;
  const isDraggingCard = isDragging && (dragOffset.x !== 0 || dragOffset.y !== 0);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 select-none overflow-visible"
    >
      {/* ---------------------------------------------------------------- */}
      {/* 3RD CARD STACK LAYER — peeks deepest on right side               */}
      {/* ---------------------------------------------------------------- */}
      {candidates[currentIndex + 2] && (
        <div
          className="absolute rounded-[36px] overflow-hidden pointer-events-none shadow-md border border-white/30"
          style={{
            top: 8,
            bottom: 8,
            left: 10,
            right: -20,
            background: 'linear-gradient(135deg, #4A1525 0%, #2A0815 100%)',
            transform: 'rotate(6.5deg) translateY(4px)',
            transformOrigin: 'bottom right',
            zIndex: 1,
            opacity: 0.8,
          }}
        >
          <img
            src={candidates[currentIndex + 2].avatar}
            alt=""
            className="w-full h-full object-cover opacity-50 brightness-75"
          />
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 2ND CARD STACK LAYER — peeks right behind front main card        */}
      {/* ---------------------------------------------------------------- */}
      {nextCandidate && (
        <div
          className="absolute rounded-[36px] overflow-hidden pointer-events-none shadow-xl border border-white/40"
          style={{
            top: 4,
            bottom: 4,
            left: 5,
            right: -12,
            background: 'linear-gradient(135deg, #1E1B2E 0%, #0F172A 100%)',
            transform: 'rotate(4deg) translateY(2px)',
            transformOrigin: 'bottom right',
            zIndex: 2,
            opacity: 0.95,
          }}
        >
          <img
            src={nextCandidate.avatar}
            alt=""
            className="w-full h-full object-cover opacity-75 brightness-90"
          />
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* FRONT MAIN SWIPEABLE CARD — full size, matching reference image  */}
      {/* ---------------------------------------------------------------- */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => onOpenDetail(currentCandidate)}
        className="absolute rounded-[36px] overflow-hidden cursor-grab active:cursor-grabbing bg-slate-900 shadow-[0_22px_60px_rgba(255,46,121,0.28)] border border-white/40"
        style={{
          top: 0,
          bottom: 0,
          left: 0,
          right: 14,
          zIndex: 10,
          transform: isDraggingCard
            ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotateDeg}deg)`
            : 'translate3d(0,0,0) rotate(0deg)',
          transition: isDraggingCard
            ? 'none'
            : 'transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
        }}
      >
        {/* Full-bleed portrait photo */}
        <img
          src={currentCandidate.avatar}
          alt={currentCandidate.name}
          className="w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: 'center top' }}
        />

        {/* Top Left Badge: Location Tag */}
        <div className="absolute top-4 left-4 pointer-events-none z-20">
          <span className="bg-black/35 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 border border-white/20 shadow-md">
            <MapPin className="w-3.5 h-3.5 text-white/90" />
            <span>
              {currentCandidate.hometown || currentCandidate.university?.split(' ')[0] || 'Bennett'}, Delhi
            </span>
          </span>
        </div>

        {/* Top Right Badge: 3 Dots Menu Button */}
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(currentCandidate);
            }}
            className="bg-black/35 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold border border-white/20 shadow-md hover:bg-black/50 transition-all cursor-pointer"
          >
            •••
          </button>
        </div>

        {/* Middle Right Cursive Overlay: "Maybe you? ♡" */}
        <div className="absolute top-1/2 right-5 -translate-y-1/2 pointer-events-none z-20 text-right select-none">
          <span className="font-cursive text-white/90 text-2xl sm:text-3xl rotate-[-6deg] block drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] tracking-wide">
            Maybe<br />you? ♡
          </span>
        </div>

        {/* LIKE badge on drag right */}
        {swipeDirection === 'like' && (
          <div className="absolute top-10 left-6 border-4 border-emerald-400 bg-emerald-500/40 backdrop-blur-md text-emerald-200 font-black text-2xl px-5 py-2 rounded-2xl -rotate-12 tracking-widest shadow-2xl pointer-events-none z-30">
            LIKE ❤️
          </div>
        )}
        {/* PASS badge on drag left */}
        {swipeDirection === 'pass' && (
          <div className="absolute top-10 right-6 border-4 border-rose-500 bg-rose-500/40 backdrop-blur-md text-rose-200 font-black text-2xl px-5 py-2 rounded-2xl rotate-12 tracking-widest shadow-2xl pointer-events-none z-30">
            PASS ✕
          </div>
        )}

        {/* Bottom Dark Gradient & Profile Details Overlay */}
        <div className="absolute inset-x-0 bottom-0 pt-28 pb-5 px-5 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none z-20">
          <div className="space-y-1">
            {/* Candidate Name & Verified Checkmark */}
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight leading-tight drop-shadow-md">
                {currentCandidate.name}
              </h2>
              <div className="w-5 h-5 rounded-full bg-[#FF2E79] flex items-center justify-center text-white shrink-0 shadow-sm border border-white/40">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            {/* Age & University */}
            <p className="text-xs sm:text-sm font-semibold text-white/90 drop-shadow-xs pb-1">
              {currentCandidate.age || 22} • {currentCandidate.university || 'Bennett University'}
            </p>

            {/* Trait Pills Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-3">
              <span className="bg-white/20 backdrop-blur-md border border-white/25 px-3.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1.5 shadow-2xs">
                <GraduationCap className="w-3.5 h-3.5 text-white/90" />
                <span>{currentCandidate.branch?.split(' ')[0] || 'Design'}</span>
              </span>
              <span className="bg-white/20 backdrop-blur-md border border-white/25 px-3.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1.5 shadow-2xs">
                <Navigation className="w-3.5 h-3.5 text-white/90" />
                <span>{currentCandidate.hometown || 'Delhi'}</span>
              </span>
              <span className="bg-white/20 backdrop-blur-md border border-white/25 px-3.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-white/90" />
                <span>{currentCandidate.zodiac || 'Leo'}</span>
              </span>
            </div>

            {/* Floating Action Buttons Overlay (3 Circle Buttons) */}
            <div className="flex items-center justify-center gap-5 pointer-events-auto pt-1">
              {/* Dislike / Pass Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerSwipe('pass');
                }}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Pass"
              >
                <X className="w-6 h-6 stroke-[2.8]" />
              </button>

              {/* Big Glowing Heart Like Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerSwipe('like');
                }}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-[#FF2E79] via-pink-500 to-[#FF2E79] text-white flex items-center justify-center border-2 border-white/50 shadow-[0_10px_30px_rgba(255,46,121,0.6)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Like"
              >
                <Heart className="w-8 h-8 fill-white text-white" />
              </button>

              {/* Direct Message / Instant Match Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail(currentCandidate);
                }}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="View Profile / Message"
              >
                <Send className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
