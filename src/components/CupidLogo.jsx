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
    <img
      src="/logo/cupid-logo.png"
      alt="Cupid Logo"
      style={{ width: currentSize.icon, height: currentSize.icon }}
      className="shrink-0 object-contain rounded-md"
    />
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
