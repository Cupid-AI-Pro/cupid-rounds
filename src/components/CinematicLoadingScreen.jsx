import React, { useState, useEffect } from 'react';
import CupidLogo from './CupidLogo';

// Curated high-res authentic candid couple lifestyle photography
const COUPLE_EDITORIAL_PHOTOS = [
  {
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1080&auto=format&fit=crop&q=85',
    tagline: 'Designed for meaningful connections'
  },
  {
    image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1080&auto=format&fit=crop&q=85',
    tagline: 'Where chemistry meets intention'
  },
  {
    image: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=1080&auto=format&fit=crop&q=85',
    tagline: 'Blind matchmaking rounds live today'
  },
  {
    image: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=1080&auto=format&fit=crop&q=85',
    tagline: 'Find your person in Delhi NCR'
  }
];

export default function CinematicLoadingScreen({ onComplete, activeState = 'Delhi NCR', duration = 3200 }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  // 1. Smooth Progress Loader
  useEffect(() => {
    const startTime = Date.now();
    let animFrame;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed < duration) {
        animFrame = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 250);
      }
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [duration, onComplete]);

  // 2. Slow couple photo slideshow transition
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % COUPLE_EDITORIAL_PHOTOS.length);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] min-h-screen flex flex-col justify-between p-8 select-none overflow-hidden bg-slate-950 text-white font-sans z-50">
      
      {/* 1. Couple Photos with Slow Ken-Burns Cinematic Movement */}
      {COUPLE_EDITORIAL_PHOTOS.map((slide, idx) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIdx ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <img
            src={slide.image}
            alt="Couple portrait"
            className="w-full h-full object-cover filter brightness-[0.78] contrast-[1.08]"
            style={{
              animation: idx === currentIdx ? 'kenBurnsSlow 7s ease-out forwards' : 'none'
            }}
          />
        </div>
      ))}

      {/* 2. Luxury Dark Gradient Overlay (Hinge/Raya Editorial Style) */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `
            linear-gradient(to top, rgba(11, 17, 32, 0.96) 0%, rgba(11, 17, 32, 0.45) 50%, rgba(11, 17, 32, 0.75) 100%)
          `
        }}
      ></div>

      {/* 3. Top Minimal Location Header */}
      <div className="relative z-10 flex justify-center pt-4">
        <span className="text-[10px] font-bold tracking-[0.25em] text-white/70 uppercase">
          {activeState} • ROUND 01
        </span>
      </div>

      {/* 4. Center Brand Identity (Hinge-Inspired Minimalist Typography) */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4 my-auto">
        <CupidLogo size="2xl" showText={true} textColor="white" />
        <p className="text-xs font-medium text-white/75 tracking-wide max-w-[240px]">
          {COUPLE_EDITORIAL_PHOTOS[currentIdx].tagline}
        </p>
      </div>

      {/* 5. Bottom Sleek Minimal Line */}
      <div className="relative z-10 flex flex-col items-center space-y-3 pb-8">
        {/* Hairline 1.5px Progress Line */}
        <div className="w-40 h-[2px] bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF2D55] rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Minimal Subtext */}
        <span className="text-[10px] font-semibold text-white/50 tracking-[0.2em] uppercase">
          Entering Cupid
        </span>
      </div>

    </div>
  );
}
