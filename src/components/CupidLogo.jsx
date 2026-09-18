import React from 'react';

export default function CupidLogo({
  size = 'md',
  showText = true,
  textColor = 'dark', // 'dark', 'white', 'rose'
  textSubtitle = '',
  className = ''
}) {
  // Balanced size presets
  const sizeMap = {
    xs: { icon: 18, font: 'text-base', dot: 'w-1.5 h-1.5', spacing: 'gap-1.5' },
    sm: { icon: 22, font: 'text-lg', dot: 'w-2 h-2', spacing: 'gap-2' },
    md: { icon: 28, font: 'text-2xl', dot: 'w-2 h-2', spacing: 'gap-2' },
    lg: { icon: 36, font: 'text-3xl', dot: 'w-2.5 h-2.5', spacing: 'gap-2.5' },
    xl: { icon: 48, font: 'text-4xl', dot: 'w-3 h-3', spacing: 'gap-3' },
    '2xl': { icon: 64, font: 'text-5xl', dot: 'w-3.5 h-3.5', spacing: 'gap-3.5' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Refined Brand Mark: Pink Circle with White Heart (exact reference match)
  const BrandIcon = () => (
    <div 
      className="shrink-0 bg-[#FF2E79] rounded-full flex items-center justify-center shadow-xs"
      style={{ width: currentSize.icon, height: currentSize.icon }}
    >
      <svg
        width={currentSize.icon * 0.52}
        height={currentSize.icon * 0.52}
        viewBox="0 0 24 24"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </div>
  );

  return (
    <div className={`inline-flex items-center ${currentSize.spacing} select-none ${className}`}>
      {/* Minimal Icon Mark */}
      <BrandIcon />

      {/* Editorial Wordmark "cupid." */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline">
            <span
              className={`font-display font-extrabold tracking-[-0.03em] ${currentSize.font} ${
                textColor === 'white'
                  ? 'text-white'
                  : textColor === 'rose'
                  ? 'text-[#FF2E79]'
                  : 'text-slate-900'
              }`}
            >
              cupid
            </span>
            <span className="text-[#FF2E79] font-black text-[1.2em] leading-none">.</span>
          </div>

          {textSubtitle && (
            <span
              className={`text-[9px] font-bold tracking-[0.16em] uppercase mt-0.5 ${
                textColor === 'white' ? 'text-white/60' : 'text-slate-400'
              }`}
            >
              {textSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
