import React, { useRef, useEffect } from 'react';

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
            <div className="w-11 h-11 rounded-full bg-pink-50 border border-rose-100 flex items-center justify-center text-[#FF2E79] shadow-xs mb-2">
              <Icon className="w-5 h-5 stroke-[2]" />
            </div>
          )}
          {label && (
            <span className="text-sm font-extrabold text-slate-900 tracking-tight">
              {label}
            </span>
          )}
          {sublabel && (
            <span className="text-[11px] font-medium text-slate-400 mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      )}

      {/* 3D Drum Shell Outer Frame */}
      <div className="relative w-full overflow-hidden rounded-[26px] bg-gradient-to-b from-slate-100/95 via-white to-slate-100/95 border border-slate-200/90 shadow-[inset_0_2px_8px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.03)] p-1">
        
        {/* Metallic side bevel gradients for 3D cylinder effect */}
        <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-slate-300/40 via-slate-100/20 to-transparent pointer-events-none z-20 rounded-l-[26px]" />
        <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l from-slate-300/40 via-slate-100/20 to-transparent pointer-events-none z-20 rounded-r-[26px]" />

        {/* Active Selection Highlight Bar */}
        <div
          className="absolute left-1.5 right-1.5 rounded-2xl bg-gradient-to-r from-rose-100/90 via-pink-100/95 to-rose-100/90 border-y border-pink-200/90 pointer-events-none shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_8px_rgba(255,45,85,0.12)] z-0"
          style={{
            top: `${halfVisible * itemHeight + 4}px`,
            height: `${itemHeight}px`
          }}
        />

        {/* 3D Glass Cylinder Mask (Soft Top & Bottom Fade) */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-20" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-20" />

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
            const rotateX = distance * 22; // 3D cylinder rotation
            const scale = Math.max(0.82, 1 - absDistance * 0.06);

            return (
              <div
                key={item}
                onClick={() => {
                  onChange(item);
                  if (containerRef.current) {
                    containerRef.current.scrollTo({ top: idx * itemHeight, behavior: 'smooth' });
                  }
                }}
                className={`flex items-center justify-center font-display transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'text-[#FF2E79] font-black text-2xl tracking-tight'
                    : 'text-slate-400 font-semibold text-base'
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
                  <span className="text-xs font-black text-[#FF2E79] ml-1.5 uppercase tracking-wider">
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
