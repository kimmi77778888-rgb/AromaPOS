import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CambodiaFlag, UKFlag } from './FlagIcons';
import { Type, Check, ChevronDown, Sparkles } from 'lucide-react';

/**
 * Reusable, clean bilingual Language & Clean Khmer Font Switcher component
 * Displays crisp SVG national flags for Khmer (🇰🇭) and English (🇬🇧)
 * With an instant clean Cambodian font selector (Kantumruy Pro, Noto Sans Khmer, etc.)
 */
export const LanguageSwitcher = ({ 
  size = 'md', 
  showLabels = true, 
  className = '',
  buttonClassName = ''
}) => {
  const { language, setLanguage, isKhmer, khmerFont, setKhmerFont, availableKhmerFonts } = useLanguage();
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isSmall = size === 'sm';
  const flagSize = isSmall ? 'w-4 h-2.5' : 'w-5 h-3.5';
  const padding = isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  // Close font menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsFontMenuOpen(false);
      }
    };
    if (isFontMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFontMenuOpen]);

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`} ref={menuRef}>
      <div 
        className="inline-flex items-center bg-stone-950/90 p-0.5 rounded-xl border border-stone-800 shadow-inner backdrop-blur-xs select-none"
        role="group"
        aria-label="Language selection"
      >
        {/* English Option */}
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`${padding} rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
            language === 'en'
              ? 'bg-amber-600 text-stone-950 font-bold shadow-sm shadow-amber-950/50'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
          } ${buttonClassName}`}
          aria-pressed={language === 'en'}
          title="Switch to English"
        >
          <UKFlag className={flagSize} />
          {showLabels && <span className="tracking-wide">EN</span>}
        </button>

        {/* Khmer Option */}
        <button
          type="button"
          onClick={() => setLanguage('km')}
          className={`${padding} rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
            language === 'km'
              ? 'bg-amber-600 text-stone-950 font-bold shadow-sm shadow-amber-950/50'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
          } ${buttonClassName}`}
          aria-pressed={language === 'km'}
          title="ប្តូរទៅជាភាសាខ្មែរ (Switch to Khmer)"
        >
          <CambodiaFlag className={flagSize} />
          {showLabels && <span className="font-medium font-khmer">ខ្មែរ</span>}
        </button>
      </div>

      {/* Font Customizer Button (Active when Khmer is enabled) */}
      {isKhmer && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsFontMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-stone-900/90 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/50 text-[11px] text-stone-300 hover:text-amber-300 font-bold transition shadow-xs cursor-pointer"
            title="ជ្រើសរើសពុម្ពអក្សរខ្មែរស្អាតៗ (Select Clean Khmer Font)"
          >
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline text-[10px] font-khmer max-w-[85px] truncate">
              {khmerFont}
            </span>
            <ChevronDown className={`w-3 h-3 text-stone-500 transition-transform ${isFontMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Clean Khmer Font Picker Dropdown */}
          {isFontMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-md">
              <div className="px-2.5 py-1.5 border-b border-stone-800 mb-1 flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ពុម្ពអក្សរខ្មែរស្អាត (Clean Khmer Fonts)</span>
                </span>
              </div>

              <div className="space-y-1">
                {availableKhmerFonts?.map((font) => {
                  const isSelected = khmerFont === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => {
                        setKhmerFont(font.id);
                        setIsFontMenuOpen(false);
                      }}
                      style={{ fontFamily: `'${font.id}', sans-serif` }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600/20 border border-amber-500/40 text-amber-300 font-bold'
                          : 'hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-transparent'
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-semibold">{font.name}</span>
                        <span className="text-[11px] text-stone-400 block mt-0.5">
                          {font.labelKm}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="px-2.5 pt-2 mt-1.5 border-t border-stone-800/80 text-[10px] text-stone-500">
                <span>ស្តង់ដារប្រើប្រាស់ក្នុងកម្មវិធីធនាគារ & POS នៅកម្ពុជា</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
