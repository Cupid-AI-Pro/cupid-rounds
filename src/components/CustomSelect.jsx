import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  icon: Icon,
  iconColor = 'text-[#FF2D55]',
  className = '',
  dropdownClassName = '',
  disabled = false,
  activeMatchValue = null, // e.g. activeState string
  activeBadgeText = 'Live Round'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Normalize options to { value, label, isLive }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      const isLive = activeMatchValue && opt.toLowerCase() === activeMatchValue.toLowerCase();
      return { value: opt, label: opt, isLive };
    }
    const isLive = opt.isLive || (activeMatchValue && opt.value && opt.value.toLowerCase() === activeMatchValue.toLowerCase());
    return { ...opt, isLive };
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value) || (value ? { value, label: value } : null);

  const handleSelect = (optVal) => {
    onChange(optVal);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 px-3.5 bg-white rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer group ${
          isOpen
            ? 'border-[#FF2D55] ring-3 ring-[#FF2D55]/15 shadow-md shadow-pink-500/5 bg-white'
            : 'border-slate-200/90 hover:border-pink-300 hover:bg-[#FFF9FA]/60 shadow-xs'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          {Icon && (
            <div className="shrink-0 flex items-center justify-center">
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
          )}
          
          <div className="flex items-center gap-2 min-w-0 truncate">
            {selectedOption ? (
              <>
                <span className="text-xs font-bold text-slate-800 truncate">
                  {selectedOption.label}
                </span>
                {selectedOption.isLive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-black shrink-0 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{activeBadgeText}</span>
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs font-semibold text-slate-400 truncate">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        {/* Custom Chevron Indicator */}
        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 shrink-0 ${
          isOpen ? 'bg-pink-50 text-[#FF2D55] rotate-180' : 'text-slate-400 group-hover:text-pink-500'
        }`}>
          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </button>

      {/* Dropdown Menu Popup (Custom Cupid Theme) */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-xl border border-pink-100 rounded-2xl shadow-[0_18px_40px_-10px_rgba(255,45,85,0.18),0_4px_16px_rgba(0,0,0,0.06)] z-50 overflow-hidden animate-slide-up max-h-56 overflow-y-auto no-scrollbar py-1.5 ${dropdownClassName}`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-[#FF2D55] text-white font-bold shadow-xs'
                    : 'text-slate-700 font-semibold hover:bg-pink-50/80 hover:text-[#FF2D55]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                  <span className="truncate">{opt.label}</span>
                  {opt.isLive && (
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}
                    >
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                      <span>{activeBadgeText}</span>
                    </span>
                  )}
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-white stroke-[3] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
