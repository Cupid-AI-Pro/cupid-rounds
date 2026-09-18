import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Star, Quote, ShieldCheck } from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(' ');

export function TestimonialsCard({
  items = [],
  className = "",
  width = 750,
  showNavigation = true,
  showCounter = true,
  autoPlay = true,
  autoPlayInterval = 4000,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const activeItem = items[activeIndex];

  // Auto-play effect
  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;

    const interval = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, items.length]);

  const handleNext = () => {
    if (activeIndex < items.length - 1) {
      setDirection(1);
      setActiveIndex(activeIndex + 1);
    } else {
      setDirection(1);
      setActiveIndex(0);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setDirection(-1);
      setActiveIndex(activeIndex - 1);
    } else {
      setDirection(-1);
      setActiveIndex(items.length - 1);
    }
  };

  // Pre-calculate rotations for visual card stack variety
  const rotations = useMemo(() => [4, -3, -7, 6, -4], []);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col items-center justify-center p-4 sm:p-8 w-full", className)}>
      
      {/* Container Card Stack */}
      <div
        className="relative grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_1fr_auto] gap-x-8 gap-y-4 w-full bg-white/90 backdrop-blur-xl border border-rose-100 p-6 sm:p-8 rounded-3xl shadow-xl shadow-rose-950/5"
        style={{ perspective: "1400px", maxWidth: `${width}px` }}
      >
        {/* Counter & Header */}
        {showCounter && (
          <div className="row-start-1 col-start-1 md:col-start-2 md:row-start-1 flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-[#FF2E79] font-black uppercase tracking-wider text-[10px] bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              <ShieldCheck className="w-3 h-3 text-[#FF2E79]" /> Verified Student Reviews
            </span>
            <span className="font-mono text-sm text-slate-500 font-extrabold">
              {activeIndex + 1} / {items.length}
            </span>
          </div>
        )}

        {/* Image Card Stack */}
        <div className="row-start-2 col-start-1 md:row-start-1 md:row-span-3 relative w-full aspect-[4/3] sm:aspect-square max-h-[320px] md:max-h-[360px] my-auto">
          <AnimatePresence custom={direction}>
            {items.map((item, index) => {
              const isActive = index === activeIndex;
              const offset = index - activeIndex;

              return (
                <motion.div
                  key={item.id}
                  className="absolute inset-0 w-full h-full overflow-hidden border-4 bg-white border-white shadow-2xl rounded-2xl cursor-pointer"
                  initial={{
                    x: offset * 14,
                    y: Math.abs(offset) * 6,
                    z: -140 * Math.abs(offset),
                    scale: 0.88 - Math.abs(offset) * 0.04,
                    rotateZ: rotations[index % rotations.length],
                    opacity: isActive ? 1 : 0.5,
                    zIndex: 10 - Math.abs(offset),
                  }}
                  animate={
                    isActive
                      ? {
                          x: [offset * 14, direction === 1 ? -180 : 180, 0],
                          y: [Math.abs(offset) * 6, 0, 0],
                          z: [-180, 140, 240],
                          scale: [0.88, 1.04, 1],
                          rotateZ: [rotations[index % rotations.length], -4, 0],
                          opacity: 1,
                          zIndex: 100,
                        }
                      : {
                          x: offset * 14,
                          y: Math.abs(offset) * 6,
                          z: -140 * Math.abs(offset),
                          rotateZ: rotations[index % rotations.length],
                          scale: 0.88 - Math.abs(offset) * 0.04,
                          opacity: 0.55,
                          zIndex: 10 - Math.abs(offset),
                        }
                  }
                  exit={{
                    x: direction === 1 ? -220 : 220,
                    z: -240,
                    scale: 0.75,
                    rotateZ: direction === 1 ? -10 : 10,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.65,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onClick={() => {
                    setDirection(index > activeIndex ? 1 : -1);
                    setActiveIndex(index);
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                    <span className="text-xs font-black drop-shadow">{item.author || item.name}</span>
                    <span className="text-[10px] text-rose-200 font-medium">{item.college || item.subtitle}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Text Area */}
        <div className="col-start-1 md:col-start-2 md:row-start-2 flex flex-col justify-center min-h-[140px] py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Rating Stars */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-xs font-black text-slate-700 ml-1.5">5.0 Star Experience</span>
              </div>

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-black font-serif text-slate-900 leading-snug">
                "{activeItem.title}"
              </h3>

              {/* Description / Review */}
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed italic">
                "{activeItem.description}"
              </p>

              {/* Author Badge */}
              <div className="pt-1 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-rose-200 shadow-sm shrink-0">
                  <img src={activeItem.image} alt={activeItem.author} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-none">{activeItem.author}</h4>
                  <span className="text-[10px] text-[#FF2E79] font-bold">{activeItem.college}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        {showNavigation && items.length > 1 && (
          <div className="col-start-1 md:col-start-2 md:row-start-3 flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Swipe or click to view
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all active:scale-95 cursor-pointer",
                  "hover:bg-rose-50 hover:text-[#FF2E79] hover:border-rose-200"
                )}
                aria-label="Previous review"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all active:scale-95 cursor-pointer",
                  "hover:bg-rose-50 hover:text-[#FF2E79] hover:border-rose-200"
                )}
                aria-label="Next review"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestimonialsCard;
