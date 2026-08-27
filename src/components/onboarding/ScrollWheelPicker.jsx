import React, { useRef, useEffect } from 'react';

export default function ScrollWheelPicker({
  items = [],
  value,
  onChange,
  itemHeight = 38,
  visibleCount = 3,
  unit = '',
  label = ''
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
      {label && (
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
          {label}
        </span>
      )}

      <div className="relative w-full overflow-hidden rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm p-1">
        {/* Active Selection Highlight Bar */}
        <div
          className="absolute left-1.5 right-1.5 rounded-xl bg-pink-50/90 border border-rose-200/90 pointer-events-none shadow-[0_2px_10px_rgba(255,45,85,0.08)] z-0"
          style={{
            top: `${halfVisible * itemHeight + 4}px`,
            height: `${itemHeight}px`
          }}
        ></div>

        {/* Soft Glass Cylinder Mask (No harsh solid white cutoffs) */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white/90 to-transparent pointer-events-none z-20"></div>
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white/90 to-transparent pointer-events-none z-20"></div>

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
            perspective: '500px'
          }}
        >
          {/* Top Padding */}
          <div style={{ height: `${halfVisible * itemHeight}px` }} />

          {/* Wheel Items with 3D Drum Curvature */}
          {items.map((item, idx) => {
            const isSelected = item === value;
            const distance = idx - selectedIndex;
            const absDistance = Math.abs(distance);
            const opacity = Math.max(0.2, 1 - absDistance * 0.45);
            const rotateX = distance * 26; // 3D cylinder rotation
            const scale = Math.max(0.85, 1 - absDistance * 0.08);

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
                    ? 'text-[#FF2D55] font-black text-lg'
                    : 'text-slate-400 font-semibold text-sm'
                }`}
                style={{
                  height: `${itemHeight}px`,
                  scrollSnapAlign: 'center',
                  opacity,
                  transform: `perspective(300px) rotateX(${rotateX}deg) scale(${scale})`,
                  transformOrigin: 'center center'
                }}
              >
                <span>{item}</span>
                {unit && isSelected && (
                  <span className="text-[10px] text-rose-400 font-extrabold ml-1 uppercase">{unit}</span>
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
