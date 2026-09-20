import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  icon: Icon,
  iconColor = 'text-[#FF2E79]',
  className = '',
  dropdownClassName = '',
  disabled = false,
  activeMatchValue = null,
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
        className={`w-full h-14 sm:h-15 px-4 bg-white/95 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer group shadow-2xs ${
          isOpen
            ? 'border-[#FF2E79] ring-4 ring-[#FF2E79]/15 shadow-md bg-white'
            : 'border-slate-200 hover:border-pink-300 hover:bg-[#FFF9FA]/80'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
          {Icon && (
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-[#FF2E79] border border-rose-100">
              <Icon className="w-4 h-4 stroke-[2.2]" />
            </div>
          )}
          
          <div className="flex items-center gap-2 min-w-0 truncate">
            {selectedOption ? (
              <>
                <span className="text-sm sm:text-base font-bold text-slate-900 truncate">
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
              <span className="text-sm sm:text-base font-semibold text-slate-400 truncate">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        {/* Custom Chevron Indicator */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200 shrink-0 ${
          isOpen ? 'bg-[#FF2E79] text-white rotate-180 shadow-xs' : 'bg-rose-50 text-[#FF2E79] group-hover:bg-rose-100'
        }`}>
          <ChevronDown className="w-4 h-4 stroke-[2.5]" />
        </div>
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl border-2 border-pink-200 rounded-2xl shadow-[0_20px_48px_-10px_rgba(255,45,85,0.22),0_6px_20px_rgba(0,0,0,0.08)] z-50 overflow-hidden animate-slide-up max-h-64 overflow-y-auto no-scrollbar py-2 ${dropdownClassName}`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-4 py-3.5 flex items-center justify-between text-left text-sm sm:text-base transition-all cursor-pointer group border-b border-slate-100/60 last:border-b-0 ${
                  isSelected
                    ? 'bg-[#FF2E79] text-white font-extrabold shadow-xs'
                    : 'text-slate-800 font-bold hover:bg-rose-50/80 hover:text-[#FF2E79]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                  <span className="truncate">{opt.label}</span>
                  {opt.isLive && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                      <span>{activeBadgeText}</span>
                    </span>
                  )}
                </div>

                {isSelected && (
                  <Check className="w-5 h-5 text-white stroke-[3] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
