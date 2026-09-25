import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Heart, 
  X, 
  Send, 
  Check, 
  GraduationCap, 
  Navigation, 
  Sun,
  MoreHorizontal
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
  const startPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setCurrentIndex(0);
  }, [candidates.length]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      setDragOffset({ x: dx, y: dy });
    };
    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      if (Math.abs(dragOffset.x) > 60) {
        setDragOffset({ x: 0, y: 0 });
        setCurrentIndex(prev => (candidates.length > 0 ? (prev + 1) % candidates.length : 0));
      } else {
        setDragOffset({ x: 0, y: 0 });
      }
    };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset.x, candidates.length]);

  if (!candidates || candidates.length === 0) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center text-center p-6 bg-white/90 backdrop-blur-xl border border-rose-100 rounded-[32px] select-none shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#FF2E79] flex items-center justify-center mb-3 border border-rose-100">
          <Heart className="w-7 h-7 fill-[#FF2E79]/20" />
        </div>
        <h4 className="text-lg font-black text-slate-900 font-display">All Caught Up!</h4>
        <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
          You have reviewed all active candidates for this round. Check back later for new profiles.
        </p>
      </div>
    );
  }

  // Safe index in loop
  const validIndex = currentIndex % candidates.length;
  const currentCandidate = candidates[validIndex];
  const nextCandidate = candidates.length > 1 ? candidates[(validIndex + 1) % candidates.length] : null;

  const handleNextCard = () => {
    setDragOffset({ x: 0, y: 0 });
    setCurrentIndex(prev => (prev + 1) % candidates.length);
  };

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
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    if (Math.abs(dragOffset.x) > 60) {
      handleNextCard();
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleHeartClick = (e) => {
    e.stopPropagation();
    if (!currentCandidate) return;
    onLike(currentCandidate);
    setDragOffset({ x: 0, y: 0 });
    setCurrentIndex(prev => (candidates.length > 1 ? prev % (candidates.length - 1) : 0));
  };

  const rotateDeg = dragOffset.x * 0.05;
  const isDraggingCard = isDragging && (dragOffset.x !== 0 || dragOffset.y !== 0);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none"
    >
      {/* 2nd Stack Card (peek behind on the right) */}
      {nextCandidate && (
        <div
          className="absolute rounded-[28px] overflow-hidden pointer-events-none shadow-md border border-white/40 bg-slate-800"
          style={{
            top: 10,
            bottom: 10,
            left: 20,
            right: -12,
            transform: 'scale(0.96) rotate(3deg)',
            zIndex: 1,
            opacity: 0.85,
          }}
        >
          <img
            src={nextCandidate.avatar}
            alt=""
            className="w-full h-full object-cover brightness-75"
          />
        </div>
      )}

      {/* Main Active Card */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="absolute inset-0 rounded-[32px] overflow-hidden cursor-grab active:cursor-grabbing bg-slate-950 shadow-[0_20px_50px_rgba(255,46,121,0.2)] border border-white/60"
        style={{
          zIndex: 10,
          transform: isDraggingCard
            ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotateDeg}deg)`
            : 'translate3d(0,0,0) rotate(0deg)',
          transition: isDraggingCard
            ? 'none'
            : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Background Profile Photo (Positioned to highlight face at top) */}
        <img
          src={currentCandidate.avatar}
          alt={currentCandidate.name}
          className="w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: 'center 10%' }}
        />

        {/* Top Header Overlays: Location Pill & Three-Dots Menu */}
        <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
          <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-white/90 flex items-center gap-1.5 border border-white/20 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-white/90" />
            <span>
              {currentCandidate.university?.split(' ')[0] || 'Bennett'}, {currentCandidate.state?.split(' ')[0] || 'Delhi'}
            </span>
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(currentCandidate);
            }}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 border border-white/20 pointer-events-auto hover:bg-black/60 transition-colors cursor-pointer shadow-sm"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Cursive Decorative Overlay Text on Right */}
        <div className="absolute top-1/4 right-5 z-20 pointer-events-none -rotate-6 text-right">
          <p className="font-cursive text-2xl text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] font-bold tracking-wide">
            Maybe you?
          </p>
        </div>

        {/* Bottom Details Overlay & Action Buttons */}
        <div className="absolute inset-x-0 bottom-0 pt-16 pb-4 px-4 bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none z-20">
          <div className="space-y-1.5">
            {/* Name */}
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm">
                {currentCandidate.name}
              </h2>
            </div>

            {/* Subtitle Details */}
            <p className="text-xs font-semibold text-white/80">
              {currentCandidate.age || 22} • {currentCandidate.university || 'Bennett University'}
            </p>

            {/* Dark Frosted Attribute Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 pb-2">
              <span className="bg-black/50 backdrop-blur-md border border-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white/90 flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-white/80" />
                <span>{currentCandidate.branch?.split(' ')[0] || 'Design'}</span>
              </span>
              <span className="bg-black/50 backdrop-blur-md border border-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white/90 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-white/80" />
                <span>{currentCandidate.hometown || currentCandidate.state || 'Delhi'}</span>
              </span>
              <span className="bg-black/50 backdrop-blur-md border border-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white/90 flex items-center gap-1">
                <Sun className="w-3 h-3 text-white/80" />
                <span>Leo</span>
              </span>
            </div>

            {/* Circular Action Buttons (Cross, Hot Pink Heart, Send) */}
            <div className="flex items-center justify-center gap-4 pointer-events-auto pt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextCard();
                }}
                className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer"
                title="Next Profile"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleHeartClick}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-[#FF2E79] to-[#FF4B93] text-white flex items-center justify-center shadow-[0_6px_25px_rgba(255,46,121,0.6)] border border-white/40 active:scale-90 transition-all cursor-pointer"
                title="Select Match / Like Profile"
              >
                <Heart className="w-7 h-7 fill-white text-white" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail(currentCandidate);
                }}
                className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer"
                title="View Full Profile"
              >
                <Send className="w-4.5 h-4.5 stroke-[2] -rotate-12 translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

