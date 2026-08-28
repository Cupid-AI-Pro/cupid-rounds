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
    xs: { icon: 20, font: 'text-base', dot: 'w-1.5 h-1.5', spacing: 'gap-1.5' },
    sm: { icon: 24, font: 'text-lg', dot: 'w-2 h-2', spacing: 'gap-2' },
    md: { icon: 30, font: 'text-2xl', dot: 'w-2 h-2', spacing: 'gap-2' },
    lg: { icon: 38, font: 'text-3xl', dot: 'w-2.5 h-2.5', spacing: 'gap-2.5' },
    xl: { icon: 50, font: 'text-4xl', dot: 'w-3 h-3', spacing: 'gap-3' },
    '2xl': { icon: 68, font: 'text-5xl', dot: 'w-3.5 h-3.5', spacing: 'gap-3.5' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Exact Official Cupid Logo: Bold Circular 'C' with Centered Solid Heart Inside
  const CupidIcon = () => (
    <svg
      width={currentSize.icon}
      height={currentSize.icon}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Outer Bold Circular 'C' */}
      <path
        d="M 24 8.5 A 12 12 0 1 0 24 23.5"
        stroke="#FF2D55"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      {/* Inner Centered Solid Heart */}
      <path
        d="M 16 21.2 C 15.5 20.7 11.2 16.8 11.2 13.8 C 11.2 11.6 13 10 15.1 10 C 15.8 10 16 10.3 16 10.6 C 16 10.3 16.2 10 16.9 10 C 19 10 20.8 11.6 20.8 13.8 C 20.8 16.8 16.5 20.7 16 21.2 Z"
        fill="#FF2D55"
      />
    </svg>
  );

  return (
    <div className={`inline-flex items-center ${currentSize.spacing} select-none ${className}`}>
      {/* Exact Official Cupid Icon */}
      <CupidIcon />

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
