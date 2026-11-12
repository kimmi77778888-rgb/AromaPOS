import React from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Sun, Moon } from 'lucide-react';
import { soundService } from '../../services/soundService';

/**
 * Reusable Theme Switcher Component
 * Allows seamless switching between:
 *  - 'black': Current rich espresso / luxury dark coffee theme
 *  - 'white': Crisp, elegant artisan light cafe theme
 *
 * Supports two presentation variants:
 *  - 'pill': Dual segmented toggle [ 🌙 Black | ☀️ White ]
 *  - 'button': Single compact toggle button with icon & tooltip
 */
export const ThemeSwitcher = ({
  size = 'sm',
  variant = 'pill',
  showLabels = true,
  className = ''
}) => {
  const { theme, setTheme, toggleTheme } = useApp();
  const { isKhmer } = useLanguage();

  const isWhite = theme === 'white';
  const isSmall = size === 'sm';

  const handleSelect = (newTheme) => {
    if (newTheme !== theme) {
      if (setTheme) {
        setTheme(newTheme);
      } else if (toggleTheme) {
        toggleTheme();
      }
      try {
        soundService.playBeepSound();
      } catch (e) {}
    }
  };

  const handleToggle = () => {
    if (toggleTheme) {
      toggleTheme();
    } else if (setTheme) {
      setTheme(isWhite ? 'black' : 'white');
    }
    try {
      soundService.playBeepSound();
    } catch (e) {}
  };

  // Compact Single Button Variant
  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-1.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs ${
          isSmall ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
        } ${
          isWhite
            ? 'bg-amber-100/80 hover:bg-amber-200/80 border-amber-300 text-amber-900'
            : 'bg-stone-900 hover:bg-stone-850 border-stone-800 text-stone-300 hover:text-amber-400'
        } ${className}`}
        title={
          isWhite
            ? (isKhmer ? 'ប្ដូរទៅម៉ូដពណ៌ខ្មៅ (Switch to Black Theme)' : 'Switch to Black Theme')
            : (isKhmer ? 'ប្ដូរទៅម៉ូដពណ៌ស (Switch to White Theme)' : 'Switch to White Theme')
        }
        aria-label="Toggle Black and White Color Theme"
      >
        {isWhite ? (
          <>
            <Sun className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-amber-600 animate-spin-slow`} />
            {showLabels && (
              <span className="font-bold text-[11px]">
                {isKhmer ? 'ពណ៌ស' : 'White'}
              </span>
            )}
          </>
        ) : (
          <>
            <Moon className={`${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-amber-400`} />
            {showLabels && (
              <span className="font-bold text-[11px]">
                {isKhmer ? 'ពណ៌ខ្មៅ' : 'Black'}
              </span>
            )}
          </>
        )}
      </button>
    );
  }

  // Segmented Pill Variant (Default)
  const padding = isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const iconSize = isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div
      className={`inline-flex items-center bg-stone-950/90 p-0.5 rounded-xl border border-stone-800 shadow-inner backdrop-blur-xs select-none ${className}`}
      role="group"
      aria-label="Color theme selection"
    >
      {/* Black / Dark Mode Button */}
      <button
        type="button"
        onClick={() => handleSelect('black')}
        className={`${padding} rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
          !isWhite
            ? 'bg-amber-600 text-stone-950 font-bold shadow-sm shadow-amber-950/50'
            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
        }`}
        aria-pressed={!isWhite}
        title={isKhmer ? 'ម៉ូដពណ៌ខ្មៅ (Current Luxury Black Theme)' : 'Black Theme'}
      >
        <Moon className={iconSize} />
        {showLabels && (
          <span className="tracking-wide">
            {isKhmer ? 'ខ្មៅ' : 'Black'}
          </span>
        )}
      </button>

      {/* White / Light Mode Button */}
      <button
        type="button"
        onClick={() => handleSelect('white')}
        className={`${padding} rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
          isWhite
            ? 'bg-amber-600 text-stone-950 font-bold shadow-sm shadow-amber-950/50'
            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
        }`}
        aria-pressed={isWhite}
        title={isKhmer ? 'ម៉ូដពណ៌ស (Crisp White / Light Cafe Theme)' : 'White Theme'}
      >
        <Sun className={iconSize} />
        {showLabels && (
          <span className="tracking-wide">
            {isKhmer ? 'ស' : 'White'}
          </span>
        )}
      </button>
    </div>
  );
};
