import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
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
      <div className="w-full h-full flex flex-col justify-center items-center text-center p-6 bg-white border border-slate-200 rounded-2xl select-none shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#FF2E79] flex items-center justify-center mb-3">
          <Heart className="w-6 h-6" />
        </div>
        <h4 className="text-base font-extrabold text-slate-900">All Caught Up</h4>
        <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
          You have reviewed all active candidates for this round. Check back later for new profiles.
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
      {/* 2nd Stack card behind */}
      {nextCandidate && (
        <div
          className="absolute rounded-2xl overflow-hidden pointer-events-none shadow-sm border border-slate-200"
          style={{
            top: 4,
            bottom: 4,
            left: 4,
            right: -6,
            transform: 'scale(0.98)',
            zIndex: 2,
            opacity: 0.9,
          }}
        >
          <img
            src={nextCandidate.avatar}
            alt=""
            className="w-full h-full object-cover brightness-90"
          />
        </div>
      )}

      {/* Front card */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => onOpenDetail(currentCandidate)}
        className="absolute rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing bg-slate-900 shadow-md border border-slate-200"
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
            : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <img
          src={currentCandidate.avatar}
          alt={currentCandidate.name}
          className="w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: 'center top' }}
        />

        {/* Location Tag */}
        <div className="absolute top-4 left-4 pointer-events-none z-20">
          <span className="bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 border border-white/20">
            <MapPin className="w-3.5 h-3.5 text-white" />
            <span>
              {currentCandidate.hometown || currentCandidate.university?.split(' ')[0] || 'University'}, {currentCandidate.state || 'Delhi NCR'}
            </span>
          </span>
        </div>

        {/* Swiping Indicator Badges */}
        {swipeDirection === 'like' && (
          <div className="absolute top-8 left-6 border-2 border-emerald-400 bg-emerald-600/80 backdrop-blur-md text-white font-black text-xl px-4 py-1.5 rounded-xl -rotate-12 tracking-wider shadow-lg pointer-events-none z-30">
            LIKE
          </div>
        )}
        {swipeDirection === 'pass' && (
          <div className="absolute top-8 right-6 border-2 border-red-400 bg-red-600/80 backdrop-blur-md text-white font-black text-xl px-4 py-1.5 rounded-xl rotate-12 tracking-wider shadow-lg pointer-events-none z-30">
            PASS
          </div>
        )}

        {/* Bottom Details Overlay */}
        <div className="absolute inset-x-0 bottom-0 pt-24 pb-5 px-5 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent pointer-events-none z-20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white font-display tracking-tight leading-tight">
                {currentCandidate.name}
              </h2>
              <div className="w-4 h-4 rounded-full bg-[#FF2E79] flex items-center justify-center text-white shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-200 pb-1">
              {currentCandidate.age || 22} • {currentCandidate.university || 'University'}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-3">
              <span className="bg-slate-900/50 backdrop-blur-md border border-white/20 px-3 py-0.5 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-300" />
                <span>{currentCandidate.branch?.split(' ')[0] || 'Academic'}</span>
              </span>
              <span className="bg-slate-900/50 backdrop-blur-md border border-white/20 px-3 py-0.5 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-slate-300" />
                <span>{currentCandidate.hometown || 'City'}</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 pointer-events-auto pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerSwipe('pass');
                }}
                className="w-12 h-12 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-md hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
                title="Pass"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerSwipe('like');
                }}
                className="w-14 h-14 rounded-xl bg-[#FF2E79] hover:bg-rose-600 text-white flex items-center justify-center border border-white/30 shadow-md active:scale-95 transition-all cursor-pointer"
                title="Like"
              >
                <Heart className="w-7 h-7 fill-white text-white" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail(currentCandidate);
                }}
                className="w-12 h-12 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-md hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
                title="View Profile"
              >
                <Send className="w-5 h-5 stroke-[2]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
