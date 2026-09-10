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
    // Fills parent wrapper via absolute inset-0 — parent must be position:relative with overflow:hidden
    <div
      ref={containerRef}
      className="absolute inset-0 select-none"
    >
      
      {/* ---------------------------------------------------------------- */}
      {/* BACKGROUND CARD — tilted, peeks behind main card                 */}
      {/* ---------------------------------------------------------------- */}
      {nextCandidate && (
        <div
          className="absolute rounded-[28px] overflow-hidden pointer-events-none"
          style={{
            top: 6,
            bottom: 6,
            left: 8,
            right: 8,
            background: 'linear-gradient(135deg, #F2E3F7 0%, #E3D2F2 100%)',
            border: '1px solid rgba(220, 200, 245, 0.6)',
            transform: 'rotate(4.5deg) translateX(6px) translateY(4px)',
            transformOrigin: 'bottom center',
            zIndex: 1,
            boxShadow: '0 12px 28px rgba(0,0,0,0.07)',
          }}
        >
          <img
            src={nextCandidate.avatar}
            alt=""
            className="w-full h-full object-cover opacity-50"
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
        onClick={() => onOpenDetail(currentCandidate)}
        className="absolute rounded-[28px] overflow-hidden cursor-grab active:cursor-grabbing bg-slate-900"
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
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.22), 0 8px 16px -5px rgba(0,0,0,0.08)',
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
        <div className="absolute top-3.5 right-3.5 pointer-events-none z-20">
          <span className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-semibold text-white flex items-center gap-1.5 border border-white/20 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-white/90" />
            <span>
              {currentCandidate.university?.includes(',') ? currentCandidate.university : `${currentCandidate.university?.split(' ')[0] || 'Campus'}, ${currentCandidate.state?.split(' ')[0] || 'NCR'}`}
            </span>
          </span>
        </div>

        {/* LIKE badge on drag right */}
        {swipeDirection === 'like' && (
          <div className="absolute top-8 left-5 border-4 border-emerald-400 bg-emerald-500/30 backdrop-blur-md text-emerald-300 font-black text-xl px-4 py-1.5 rounded-2xl -rotate-12 tracking-wider shadow-lg pointer-events-none z-30">
            LIKE ❤️
          </div>
        )}
        {/* PASS badge on drag left */}
        {swipeDirection === 'pass' && (
          <div className="absolute top-8 right-5 border-4 border-rose-500 bg-rose-500/30 backdrop-blur-md text-rose-300 font-black text-xl px-4 py-1.5 rounded-2xl rotate-12 tracking-wider shadow-lg pointer-events-none z-30">
            PASS ✕
          </div>
        )}

        {/* Bottom dark gradient & frosted glass card */}
        <div className="absolute inset-x-0 bottom-0 pt-20 pb-3.5 px-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-20">
          <div
            className="rounded-[22px] px-4 py-3 flex items-center justify-between text-white"
            style={{
              background: 'rgba(255, 255, 255, 0.14)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.28)',
            }}
          >
            <div className="space-y-0.5">
              {/* Active status row */}
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                <span className="text-[11px] font-bold text-white tracking-wider">Active</span>
                <div className="w-3.5 h-3.5 bg-[#FF2E79] rounded-full flex items-center justify-center text-[8px] font-black text-white">✓</div>
              </div>
              {/* Name */}
              <h2
                className="text-[23px] font-black tracking-tight text-white leading-tight"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
              >
                {currentCandidate.name}
              </h2>
            </div>

            {/* Hot-pink circular arrow FAB */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(currentCandidate);
              }}
              className="w-11 h-11 rounded-full bg-[#FF2E79] hover:bg-[#E02469] text-white flex items-center justify-center pointer-events-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95 shrink-0 shadow-lg shadow-pink-500/40"
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
