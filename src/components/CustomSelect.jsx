import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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

  // Close on outside click safely
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    let timer;
    if (isOpen) {
      timer = setTimeout(() => {
        document.addEventListener('pointerdown', handleClickOutside);
        document.addEventListener('click', handleClickOutside);
      }, 50);
    }
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
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
    <div ref={dropdownRef} className={`relative select-none ${isOpen ? 'z-[100]' : 'z-20'} ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[54px] min-h-[54px] px-4 bg-white rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer group shadow-2xs ${
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
                <span className="text-base font-bold text-slate-900 truncate">
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
              <span className="text-base font-semibold text-slate-400 truncate">
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

      {/* Dropdown Menu Popup - Floating above with z-[9999] */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-[calc(100%+8px)] bg-white border-2 border-rose-200 rounded-2xl shadow-[0_20px_50px_rgba(255,46,121,0.18)] z-[9999] animate-step-transition max-h-64 overflow-y-auto overscroll-contain p-2.5 space-y-1 ${dropdownClassName}`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(opt.value);
                }}
                className={`w-full px-5 py-3.5 pl-4 rounded-xl flex items-center justify-between text-left text-sm sm:text-base font-bold transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-rose-50 text-[#FF2E79] font-black shadow-2xs ring-1 ring-[#FF2E79]/30'
                    : 'text-slate-700 hover:bg-rose-50/60 hover:text-[#FF2E79]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <span className="truncate">{opt.label}</span>
                  {opt.isLive && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        isSelected
                          ? 'bg-[#FF2E79] text-white border border-[#FF2E79]'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                      <span>{activeBadgeText}</span>
                    </span>
                  )}
                </div>

                {isSelected && (
                  <Check className="w-5 h-5 text-[#FF2E79] stroke-[3] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
