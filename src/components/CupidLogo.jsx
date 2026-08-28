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

  // Luxury Editorial Monogram Mark (Inspired by Hinge / Modern High-End Editorial Brands)
  // Geometric Minimalist Monogram: Intertwined 'C' + Hairline Heart Silhouette
  const EditorialIcon = () => (
    <svg
      width={currentSize.icon}
      height={currentSize.icon}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Outer refined architectural C curve */}
      <path
        d="M23 8C20.5 5.5 16.5 4.5 12.5 6C7.5 7.8 4 12.6 4 18C4 23.8 8.2 28.5 14 28.5C18.5 28.5 22 26 24 22.5"
        stroke="#FF2D55"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Delicate inner heart apex */}
      <path
        d="M17 11.5C17 11.5 19.5 9 22 10.5C24.5 12 24.5 15.5 21.5 18.5L17 23L12.5 18.5C9.5 15.5 9.5 12 12 10.5C14.5 9 17 11.5 17 11.5Z"
        fill="#FF2D55"
      />
    </svg>
  );

  return (
    <div className={`inline-flex items-center ${currentSize.spacing} select-none ${className}`}>
      {/* Minimal Icon Mark */}
      <EditorialIcon />

      {/* Editorial Wordmark "cupid." */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline">
            <span
              className={`font-display font-extrabold tracking-[-0.03em] ${currentSize.font} ${
                textColor === 'white'
                  ? 'text-white'
                  : textColor === 'rose'
                  ? 'text-[#FF2D55]'
                  : 'text-slate-900'
              }`}
            >
              cupid
            </span>
            <span className="text-[#FF2D55] font-black text-[1.2em] leading-none">.</span>
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
