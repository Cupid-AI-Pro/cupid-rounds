import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  ArrowUpRight, 
  Sparkles, 
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
      <div className="w-full h-full flex flex-col justify-center items-center text-center p-6 bg-white/80 backdrop-blur-md border border-white rounded-[28px] select-none shadow-sm">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-[#FF2D55] flex items-center justify-center mb-3">
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
    // Fills parent wrapper via absolute inset-0 — parent must be position:relative with overflow:hidden
    <div
      ref={containerRef}
      className="absolute inset-0 select-none"
    >
      
      {/* ---------------------------------------------------------------- */}
      {/* BACKGROUND CARD — tilted purple/lavender, peeks behind main card  */}
      {/* ---------------------------------------------------------------- */}
      {nextCandidate && (
        <div
          className="absolute rounded-[24px] overflow-hidden pointer-events-none"
          style={{
            top: 8,
            bottom: 8,
            left: 10,
            right: 10,
            background: 'linear-gradient(135deg, #E8D5F7 0%, #D4C0F0 100%)',
            border: '1px solid rgba(196, 168, 237, 0.5)',
            transform: 'rotate(4deg) translateY(6px)',
            transformOrigin: 'bottom center',
            zIndex: 1,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
        >
          <img
            src={nextCandidate.avatar}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.45 }}
          />
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MAIN SWIPEABLE CARD — full size, sits on top                      */}
      {/* ---------------------------------------------------------------- */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="absolute rounded-[24px] overflow-hidden cursor-grab active:cursor-grabbing bg-slate-900"
        style={{
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          transform: isDraggingCard
            ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotateDeg}deg)`
            : 'translate3d(0,0,0) rotate(0deg)',
          transition: isDraggingCard
            ? 'none'
            : 'transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
          boxShadow: '0 24px 48px -10px rgba(0,0,0,0.28), 0 8px 20px -5px rgba(0,0,0,0.1)',
        }}
      >
        {/* Full-bleed portrait photo */}
        <img
          src={currentCandidate.avatar}
          alt={currentCandidate.name}
          className="w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: 'center top' }}
        />

        {/* Location pill — top right */}
        <div className="absolute top-4 right-4 pointer-events-none">
          <span className="bg-black/45 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-bold text-white flex items-center gap-1.5 border border-white/20 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-white" />
            <span>
              {currentCandidate.university?.split(' ')[0] || 'Campus'},&nbsp;
              {currentCandidate.state?.split(' ')[0] || 'NCR'}
            </span>
          </span>
        </div>

        {/* LIKE badge on drag right */}
        {swipeDirection === 'like' && (
          <div className="absolute top-8 left-5 border-4 border-emerald-400 bg-emerald-500/25 backdrop-blur-md text-emerald-300 font-black text-xl px-4 py-1.5 rounded-2xl -rotate-12 tracking-wider shadow-lg pointer-events-none">
            LIKE ❤️
          </div>
        )}
        {/* PASS badge on drag left */}
        {swipeDirection === 'pass' && (
          <div className="absolute top-8 right-5 border-4 border-rose-500 bg-rose-500/25 backdrop-blur-md text-rose-300 font-black text-xl px-4 py-1.5 rounded-2xl rotate-12 tracking-wider shadow-lg pointer-events-none">
            PASS ✕
          </div>
        )}

        {/* Bottom glassmorphism name/action strip */}
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
          <div
            className="rounded-[20px] px-4 py-3.5 flex items-center justify-between text-white"
            style={{
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.45)',
              boxShadow: '0 10px 35px rgba(0,0,0,0.28)',
            }}
          >
            <div className="space-y-0.5">
              {/* Active status row */}
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                <span className="text-[11px] font-black text-white tracking-wider uppercase">Active</span>
                <div className="w-3.5 h-3.5 bg-[#FF2D55] rounded-full flex items-center justify-center text-[8px] font-black text-white">✓</div>
              </div>
              {/* Name */}
              <h2
                className="text-[22px] font-black tracking-tight text-white"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
              >
                {currentCandidate.name.split(' ')[0]}&nbsp;
                {currentCandidate.name.split(' ')[1]?.[0] || ''}
              </h2>
            </div>

            {/* Hot-pink circular arrow FAB */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(currentCandidate);
              }}
              className="w-12 h-12 rounded-full bg-[#FF2D55] hover:bg-[#E02447] text-white flex items-center justify-center pointer-events-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95 shrink-0"
              style={{ boxShadow: '0 6px 20px rgba(255,45,85,0.55)', border: '1.5px solid rgba(255,255,255,0.3)' }}
              title="View profile"
            >
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
