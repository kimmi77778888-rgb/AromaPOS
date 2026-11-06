import React from 'react';
import { useApp } from '../../context/AppContext';
import { Coffee, Award, Sparkles, Crown, Flame } from 'lucide-react';

export const PRESET_LOGOS = [
  {
    id: 'artisan-cup',
    name: 'Artisan Cup & Steam',
    nameKm: 'ពែងកាហ្វេ & ផ្សែងឈ្ងុយ',
    description: 'Warm glowing golden cup with artisan steam swirls',
    render: ({ sizeClass = 'w-6 h-6', monochrome = false }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={sizeClass}>
        {!monochrome ? (
          <>
            <circle cx="50" cy="50" r="48" fill="url(#grad-cup-bg)" stroke="#f59e0b" strokeWidth="2.5" />
            <defs>
              <linearGradient id="grad-cup-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="50%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#1c1917" />
              </linearGradient>
              <linearGradient id="grad-cup-gold" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            {/* Steam Swirls */}
            <path d="M40 32C37 25 43 20 40 14" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
            <path d="M50 30C47 21 53 16 50 10" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M60 32C57 25 63 20 60 14" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
            {/* Cup Body */}
            <path d="M26 40H74V60C74 72 63 78 50 78C37 78 26 72 26 60V40Z" fill="url(#grad-cup-gold)" />
            {/* Cup Rim */}
            <rect x="23" y="37" width="54" height="6" rx="3" fill="#fef3c7" />
            {/* Cup Handle */}
            <path d="M72 44C81 44 85 50 85 56C85 62 80 66 72 66" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" />
            {/* Coffee Saucer */}
            <path d="M20 83C32 87 68 87 80 83" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
            {/* Coffee Bean Accent */}
            <ellipse cx="50" cy="56" rx="5" ry="7" fill="#78350f" />
            <path d="M50 49C48 53 52 59 50 63" stroke="#fef3c7" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="50" cy="50" r="46" stroke="#000000" strokeWidth="3.5" fill="none" />
            <path d="M42 28C39 22 45 18 42 14" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M50 26C47 20 53 16 50 12" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            <path d="M58 28C55 22 61 18 58 14" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M28 38H72V58C72 70 62 76 50 76C38 76 28 70 28 58V38Z" fill="#000000" />
            <rect x="25" y="35" width="50" height="5" rx="2.5" fill="#000000" />
            <path d="M70 42C79 42 83 48 83 54C83 60 78 64 70 64" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
            <path d="M22 82C34 86 66 86 78 82" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
          </>
        )}
      </svg>
    )
  },
  {
    id: 'coffee-bean',
    name: 'Roasted Bean Emblem',
    nameKm: 'គ្រាប់កាហ្វេលីងសិល្បៈ',
    description: 'Sleek roasted coffee beans with espresso droplets',
    render: ({ sizeClass = 'w-6 h-6', monochrome = false }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={sizeClass}>
        {!monochrome ? (
          <>
            <circle cx="50" cy="50" r="48" fill="url(#grad-bean-bg)" stroke="#ea580c" strokeWidth="2.5" />
            <defs>
              <linearGradient id="grad-bean-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1c1917" />
                <stop offset="50%" stopColor="#431407" />
                <stop offset="100%" stopColor="#292524" />
              </linearGradient>
              <linearGradient id="grad-bean" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="50%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
            </defs>
            {/* Outer Laurel Ring */}
            <circle cx="50" cy="50" r="42" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
            {/* Big Main Bean tilted */}
            <g transform="rotate(-30 50 50)">
              <ellipse cx="50" cy="50" rx="20" ry="28" fill="url(#grad-bean)" stroke="#fbbf24" strokeWidth="2.5" />
              <path d="M50 24C45 34 56 46 47 58C43 64 52 72 50 76" stroke="#fef3c7" strokeWidth="3" strokeLinecap="round" />
            </g>
            {/* Espresso Drop */}
            <path d="M72 32C72 36 68 39 65 39C62 39 58 36 65 26C72 36 72 32 72 32Z" fill="#fbbf24" />
          </>
        ) : (
          <>
            <circle cx="50" cy="50" r="46" stroke="#000000" strokeWidth="3" fill="none" />
            <circle cx="50" cy="50" r="41" stroke="#000000" strokeWidth="1" strokeDasharray="3 2" fill="none" />
            <g transform="rotate(-30 50 50)">
              <ellipse cx="50" cy="50" rx="18" ry="26" fill="#000000" />
              <path d="M50 26C45 35 55 46 47 57C44 63 52 70 50 74" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            </g>
          </>
        )}
      </svg>
    )
  },
  {
    id: 'vintage-roaster',
    name: 'Artisan Roaster Badge',
    nameKm: 'ត្រាស្លាកសញ្ញា Vintage Roastery',
    description: 'Circular heritage seal with stars and roast year',
    render: ({ sizeClass = 'w-6 h-6', monochrome = false }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={sizeClass}>
        {!monochrome ? (
          <>
            <circle cx="50" cy="50" r="48" fill="#1c1917" stroke="#f59e0b" strokeWidth="3" />
            <circle cx="50" cy="50" r="42" stroke="#d97706" strokeWidth="1.5" />
            {/* Stars */}
            <path d="M50 16L51.5 20L55.5 20.5L52.5 23L53.5 27L50 25L46.5 27L47.5 23L44.5 20.5L48.5 20L50 16Z" fill="#f59e0b" />
            <path d="M30 22L31 24.5L34 25L31.5 27L32 30L30 28.5L28 30L28.5 27L26 25L29 24.5L30 22Z" fill="#f59e0b" opacity="0.8" />
            <path d="M70 22L71 24.5L74 25L71.5 27L72 30L70 28.5L68 30L68.5 27L66 25L69 24.5L70 22Z" fill="#f59e0b" opacity="0.8" />
            {/* Center Coffee Cup with Heart */}
            <path d="M32 46H68V58C68 68 59 73 50 73C41 73 32 68 32 58V46Z" fill="#f59e0b" />
            <rect x="30" y="43" width="40" height="4" rx="2" fill="#fef3c7" />
            <path d="M66 48C73 48 77 53 77 58C77 63 72 66 66 66" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
            {/* Heart on Cup */}
            <path d="M50 56C49 53 45 52 44 54C43 56 45 58 50 62C55 58 57 56 56 54C55 52 51 53 50 56Z" fill="#78350f" />
            {/* Banner Text "AROMA" */}
            <path d="M24 78L50 82L76 78L72 87L50 91L28 87L24 78Z" fill="#b45309" stroke="#fcd34d" strokeWidth="1" />
            <text x="50" y="87" fill="#fef3c7" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="2">COFFEE</text>
          </>
        ) : (
          <>
            <circle cx="50" cy="50" r="46" stroke="#000000" strokeWidth="3" fill="none" />
            <circle cx="50" cy="50" r="41" stroke="#000000" strokeWidth="1" fill="none" />
            <path d="M34 44H66V56C66 66 58 71 50 71C42 71 34 66 34 56V44Z" fill="#000000" />
            <path d="M64 47C71 47 75 52 75 56C75 60 70 63 64 63" stroke="#000000" strokeWidth="3" fill="none" />
            <text x="50" y="85" fill="#000000" fontSize="9" fontWeight="bold" textAnchor="middle" letterSpacing="1">COFFEE</text>
          </>
        )}
      </svg>
    )
  },
  {
    id: 'botanical-leaf',
    name: 'Organic Botanical Branch',
    nameKm: 'មែកកាហ្វេធម្មជាតិ Organic',
    description: 'Fresh coffee cherries and botanical espresso leaves',
    render: ({ sizeClass = 'w-6 h-6', monochrome = false }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={sizeClass}>
        {!monochrome ? (
          <>
            <circle cx="50" cy="50" r="48" fill="url(#grad-botanical-bg)" stroke="#10b981" strokeWidth="2.5" />
            <defs>
              <linearGradient id="grad-botanical-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#064e3b" />
                <stop offset="50%" stopColor="#022c22" />
                <stop offset="100%" stopColor="#1c1917" />
              </linearGradient>
            </defs>
            {/* Coffee Branch */}
            <path d="M25 78C35 68 45 52 65 24" stroke="#a7f3d0" strokeWidth="3" strokeLinecap="round" />
            {/* Green Leaves */}
            <path d="M42 56C30 54 28 42 38 40C46 38 48 48 42 56Z" fill="#34d399" stroke="#059669" strokeWidth="1.5" />
            <path d="M52 44C62 38 72 44 68 54C62 60 52 54 52 44Z" fill="#10b981" stroke="#047857" strokeWidth="1.5" />
            <path d="M30 68C22 64 22 54 30 52C36 52 38 60 30 68Z" fill="#6ee7b7" />
            {/* Red Coffee Cherries */}
            <circle cx="48" cy="54" r="6" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
            <circle cx="58" cy="48" r="5.5" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
            <circle cx="43" cy="62" r="5" fill="#f87171" stroke="#b91c1c" strokeWidth="1.5" />
            <ellipse cx="46" cy="52" rx="1.5" ry="1" fill="#fef2f2" opacity="0.8" />
          </>
        ) : (
          <>
            <circle cx="50" cy="50" r="46" stroke="#000000" strokeWidth="3" fill="none" />
            <path d="M26 76C36 66 46 50 64 26" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            <path d="M42 56C30 54 28 42 38 40C46 38 48 48 42 56Z" fill="#000000" />
            <circle cx="48" cy="54" r="6" fill="#000000" />
            <circle cx="58" cy="48" r="5.5" fill="#000000" />
          </>
        )}
      </svg>
    )
  },
  {
    id: 'crown-espresso',
    name: 'Royal Crown Espresso',
    nameKm: 'មកុដរាជវង្ស Espresso',
    description: 'Majestic golden crown and twin portafilter crest',
    render: ({ sizeClass = 'w-6 h-6', monochrome = false }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={sizeClass}>
        {!monochrome ? (
          <>
            <circle cx="50" cy="50" r="48" fill="url(#grad-crown-bg)" stroke="#fbbf24" strokeWidth="2.5" />
            <defs>
              <linearGradient id="grad-crown-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#701a75" />
                <stop offset="50%" stopColor="#4a044e" />
                <stop offset="100%" stopColor="#1c1917" />
              </linearGradient>
            </defs>
            {/* Crown */}
            <path d="M30 38L36 50L50 34L64 50L70 38L68 56H32L30 38Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="30" cy="36" r="2.5" fill="#fef08a" />
            <circle cx="50" cy="32" r="3" fill="#fef08a" />
            <circle cx="70" cy="36" r="2.5" fill="#fef08a" />
            {/* Cup */}
            <path d="M34 58H66V68C66 76 59 80 50 80C41 80 34 76 34 68V58Z" fill="#f59e0b" />
            <path d="M64 61C71 61 74 65 74 69C74 73 70 76 64 76" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="50" cy="62" rx="4" ry="5.5" fill="#4a044e" />
          </>
        ) : (
          <>
            <circle cx="50" cy="50" r="46" stroke="#000000" strokeWidth="3" fill="none" />
            <path d="M30 38L36 50L50 34L64 50L70 38L68 56H32L30 38Z" fill="#000000" />
            <path d="M34 58H66V68C66 76 59 80 50 80C41 80 34 76 34 68V58Z" fill="#000000" />
          </>
        )}
      </svg>
    )
  }
];

export const StoreLogo = ({ 
  size = 'md', // 'xs', 'sm', 'md', 'lg', 'xl', 'receipt'
  className = '', 
  showName = false,
  showTagline = false,
  variant = 'color', // 'color' | 'monochrome'
  customStore = null,
  onClick = null
}) => {
  const { storeInfo: contextStore } = useApp() || {};
  const store = customStore || contextStore || {
    name: 'Aroma Coffee',
    nameKhmer: 'អាហ្រូម៉ា កាហ្វេ',
    tagline: 'Artisan Roastery',
    logo: '',
    presetLogoId: 'artisan-cup'
  };

  const isReceipt = size === 'receipt' || variant === 'monochrome';

  // Dimension classes based on size prop
  const sizeMap = {
    xs: { box: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-xs', subtext: 'text-[9px]' },
    sm: { box: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-sm', subtext: 'text-[10px]' },
    md: { box: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-base', subtext: 'text-xs' },
    lg: { box: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-lg', subtext: 'text-xs' },
    xl: { box: 'w-16 h-16', icon: 'w-8 h-8', text: 'text-xl', subtext: 'text-sm' },
    receipt: { box: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-sm', subtext: 'text-[10px]' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Selected preset renderer
  const selectedPreset = PRESET_LOGOS.find(p => p.id === (store.presetLogoId || 'artisan-cup')) || PRESET_LOGOS[0];

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {/* Logo Graphic Container */}
      <div className={`relative ${currentSize.box} shrink-0 flex items-center justify-center rounded-xl overflow-hidden transition duration-200 ${
        onClick ? 'group-hover:scale-105 group-hover:shadow-lg' : ''
      } ${
        isReceipt 
          ? 'bg-transparent text-black' 
          : 'bg-stone-900 border border-stone-800 shadow-sm'
      }`}>
        {store.logo ? (
          <img 
            src={store.logo} 
            alt={store.name || 'Store Logo'}
            className={`w-full h-full object-cover rounded-xl ${
              isReceipt ? 'filter grayscale contrast-150' : ''
            }`}
            onError={(e) => {
              // Graceful fallback to preset SVG if custom image fails to load
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-svg');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
        ) : null}

        {/* Preset SVG Icon Renderer */}
        <div className={`w-full h-full flex items-center justify-center fallback-svg ${store.logo ? 'hidden' : ''}`}>
          {selectedPreset.render({ 
            sizeClass: 'w-full h-full p-1', 
            monochrome: isReceipt 
          })}
        </div>
      </div>

      {/* Optional Store Name & Tagline */}
      {(showName || showTagline) && (
        <div className="overflow-hidden text-left">
          {showName && (
            <div className={`font-extrabold tracking-tight truncate ${currentSize.text} ${
              isReceipt ? 'text-black' : 'text-stone-100 group-hover:text-amber-400'
            }`}>
              {store.name || 'Aroma Coffee'}
            </div>
          )}
          {showTagline && (
            <p className={`font-medium tracking-wider uppercase truncate ${currentSize.subtext} ${
              isReceipt ? 'text-stone-700' : 'text-stone-400'
            }`}>
              {store.tagline || 'Artisan Roastery'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
