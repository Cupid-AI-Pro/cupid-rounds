import React, { useRef, useEffect } from 'react';

// Web Audio API mechanical tick sound generator (plays crisp tick on scroll)
let audioCtx = null;
const playTickSound = () => {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx) {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.014);

      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.014);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.014);
    }
  } catch (err) {
    // Ignore audio policy errors
  }
};

export default function ScrollWheelPicker({
  items = [],
  value,
  onChange,
  itemHeight = 44,
  visibleCount = 5,
  unit = '',
  label = '',
  sublabel = '',
  icon: Icon = null
}) {
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const scrollStartRef = useRef(0);

  const selectedIndex = Math.max(0, items.indexOf(value));
  const containerHeight = itemHeight * visibleCount;
  const halfVisible = Math.floor(visibleCount / 2);

  // Sync scroll position when value changes externally
  useEffect(() => {
    if (containerRef.current && !isDraggingRef.current) {
      containerRef.current.scrollTop = selectedIndex * itemHeight;
    }
  }, [selectedIndex, itemHeight]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    if (items[clampedIndex] !== undefined && items[clampedIndex] !== value) {
      playTickSound();
      onChange(items[clampedIndex]);
    }
  };

  // Drag handlers for desktop mouse interaction
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    scrollStartRef.current = containerRef.current.scrollTop;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const deltaY = e.clientY - startYRef.current;
    containerRef.current.scrollTop = scrollStartRef.current - deltaY;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (containerRef.current) {
      const targetScroll = Math.round(containerRef.current.scrollTop / itemHeight) * itemHeight;
      containerRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full select-none flex flex-col items-center">
      {/* Optional Column Header (Icon + Label + Sublabel) */}
      {(Icon || label) && (
        <div className="flex flex-col items-center text-center mb-3">
          {Icon && (
            <div className="w-12 h-12 rounded-full bg-pink-100/70 border border-pink-200/60 flex items-center justify-center text-[#FF2E79] shadow-xs mb-2">
              <Icon className="w-5 h-5 stroke-[2.2]" />
            </div>
          )}
          {label && (
            <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              {label}
            </span>
          )}
          {sublabel && (
            <span className="text-xs font-normal text-slate-400 mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      )}

      {/* 3D Drum Shell Outer Frame */}
      <div className="relative w-full overflow-hidden rounded-[36px] bg-gradient-to-b from-slate-100/90 via-white to-slate-100/90 border border-slate-200/90 shadow-[inset_0_4px_12px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)] p-1.5">
        
        {/* Metallic side bevel cap gradients for realistic 3D cylinder shape */}
        <div className="absolute top-0 bottom-0 left-0 w-3.5 bg-gradient-to-r from-slate-300/60 via-slate-100/30 to-transparent pointer-events-none z-20 rounded-l-[36px]" />
        <div className="absolute top-0 bottom-0 right-0 w-3.5 bg-gradient-to-l from-slate-300/60 via-slate-100/30 to-transparent pointer-events-none z-20 rounded-r-[36px]" />

        {/* Active Selection Highlight Bar */}
        <div
          className="absolute left-2 right-2 rounded-2xl bg-gradient-to-r from-rose-100/90 via-pink-100/95 to-rose-100/90 border-y border-pink-200/90 pointer-events-none shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),0_2px_10px_rgba(255,45,85,0.15)] z-0"
          style={{
            top: `${halfVisible * itemHeight + 6}px`,
            height: `${itemHeight}px`
          }}
        />

        {/* 3D Glass Cylinder Mask (Soft Top & Bottom Fade) */}
        <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-white via-white/85 to-transparent pointer-events-none z-20" />
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-white via-white/85 to-transparent pointer-events-none z-20" />

        {/* 3D Drum Scroll Container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="overflow-y-auto no-scrollbar scroll-smooth relative z-10 cursor-grab active:cursor-grabbing"
          style={{
            height: `${containerHeight}px`,
            scrollSnapType: 'y mandatory',
            perspective: '600px'
          }}
        >
          {/* Top Padding */}
          <div style={{ height: `${halfVisible * itemHeight}px` }} />

          {/* Wheel Items with 3D Drum Curvature */}
          {items.map((item, idx) => {
            const isSelected = item === value;
            const distance = idx - selectedIndex;
            const absDistance = Math.abs(distance);
            const opacity = Math.max(0.2, 1 - absDistance * 0.35);
            const rotateX = distance * 24; // 3D cylinder rotation
            const scale = Math.max(0.8, 1 - absDistance * 0.07);

            return (
              <div
                key={item}
                onClick={() => {
                  if (item !== value) {
                    playTickSound();
                    onChange(item);
                  }
                  if (containerRef.current) {
                    containerRef.current.scrollTo({ top: idx * itemHeight, behavior: 'smooth' });
                  }
                }}
                className={`flex items-center justify-center font-display transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'text-[#FF2E79] font-black text-2xl sm:text-3xl tracking-tight'
                    : 'text-slate-400 font-semibold text-base sm:text-lg'
                }`}
                style={{
                  height: `${itemHeight}px`,
                  scrollSnapAlign: 'center',
                  opacity,
                  transform: `perspective(400px) rotateX(${rotateX}deg) scale(${scale})`,
                  transformOrigin: 'center center'
                }}
              >
                <span>{item}</span>
                {unit && isSelected && (
                  <span className="text-xs sm:text-sm font-black text-[#FF2E79] ml-1.5 uppercase tracking-wider flex items-baseline">
                    {unit}
                  </span>
                )}
              </div>
            );
          })}

          {/* Bottom Padding */}
          <div style={{ height: `${halfVisible * itemHeight}px` }} />
        </div>
      </div>
    </div>
  );
}
