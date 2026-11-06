import React from 'react';

/**
 * Clean, high-fidelity SVG Flag of Cambodia (ព្រះរាជាណាចក្រកម្ពុជា)
 * Precision 3-tier Angkor Wat temple with iconic lotus spires and royal blue / crimson red bands.
 */
export const CambodiaFlag = ({ className = 'w-5 h-3.5', rounded = 'rounded-xs' }) => (
  <svg
    viewBox="0 0 600 400"
    className={`${className} ${rounded} overflow-hidden shadow-xs flex-shrink-0 inline-block align-middle ring-1 ring-black/10`}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Flag of Cambodia"
  >
    {/* Blue top and bottom stripes (1/4 each) */}
    <rect width="600" height="400" fill="#032EA1" />
    
    {/* Red center stripe (1/2 height) */}
    <rect y="100" width="600" height="200" fill="#ED1B24" />

    {/* Angkor Wat Temple Silhouette */}
    <g fill="#FFFFFF">
      {/* Lower Terraces / Plinth Base */}
      <rect x="150" y="278" width="300" height="12" rx="1" />
      <rect x="170" y="264" width="260" height="14" rx="1" />
      <rect x="190" y="250" width="220" height="14" rx="1" />
      
      {/* Central Tallest Lotus Tower */}
      <path d="M300 132 C297 148, 292 165, 290 185 L285 220 L283 250 L317 250 L315 220 L310 185 C308 165, 303 148, 300 132 Z" />
      {/* Central Spire Pinnacle Finial */}
      <circle cx="300" cy="128" r="3.5" />
      <path d="M300 120 L300 128" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

      {/* Left Intermediate Tower */}
      <path d="M242 165 C240 178, 235 192, 234 208 L230 228 L228 250 L256 250 L254 228 L250 208 C249 192, 244 178, 242 165 Z" />
      <circle cx="242" cy="162" r="3" />
      <path d="M242 155 L242 162" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

      {/* Right Intermediate Tower */}
      <path d="M358 165 C356 178, 360 192, 362 208 L366 228 L368 250 L340 250 L342 228 L346 208 C347 192, 352 178, 358 165 Z" />
      <circle cx="358" cy="162" r="3" />
      <path d="M358 155 L358 162" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

      {/* Left Outer Spire / Pavilion */}
      <path d="M198 198 C196 208, 193 218, 192 230 L190 250 L208 250 L206 230 C205 218, 202 208, 198 198 Z" />
      <circle cx="198" cy="196" r="2.5" />

      {/* Right Outer Spire / Pavilion */}
      <path d="M402 198 C400 208, 403 218, 404 230 L406 250 L388 250 L390 230 C391 218, 394 208, 402 198 Z" />
      <circle cx="402" cy="196" r="2.5" />

      {/* Gallery Roof Structure connecting towers */}
      <polygon points="186,250 198,240 242,240 256,250" />
      <polygon points="256,250 268,235 332,235 344,250" />
      <polygon points="344,250 358,240 402,240 414,250" />
    </g>

    {/* Architectural Portals & Details in Red (Angkor Wat Insets) */}
    <g fill="#ED1B24">
      {/* Central Grand Archway / Gateway */}
      <path d="M294 252 H306 V278 H294 Z" rx="1.5" />
      <path d="M294 252 C294 246, 306 246, 306 252" />
      
      {/* Left Sub-portal */}
      <rect x="238" y="255" width="8" height="21" rx="1" />
      
      {/* Right Sub-portal */}
      <rect x="354" y="255" width="8" height="21" rx="1" />

      {/* Base Foundation Pier Openings */}
      <rect x="175" y="280" width="10" height="8" rx="0.5" />
      <rect x="210" y="280" width="10" height="8" rx="0.5" />
      <rect x="250" y="280" width="10" height="8" rx="0.5" />
      <rect x="340" y="280" width="10" height="8" rx="0.5" />
      <rect x="380" y="280" width="10" height="8" rx="0.5" />
      <rect x="415" y="280" width="10" height="8" rx="0.5" />

      {/* Tower Horizontal Tier Lines */}
      <line x1="290" y1="185" x2="310" y2="185" stroke="#ED1B24" strokeWidth="2.5" />
      <line x1="287" y1="205" x2="313" y2="205" stroke="#ED1B24" strokeWidth="2.5" />
      <line x1="285" y1="225" x2="315" y2="225" stroke="#ED1B24" strokeWidth="2.5" />
      
      <line x1="234" y1="208" x2="250" y2="208" stroke="#ED1B24" strokeWidth="2" />
      <line x1="231" y1="226" x2="253" y2="226" stroke="#ED1B24" strokeWidth="2" />

      <line x1="346" y1="208" x2="362" y2="208" stroke="#ED1B24" strokeWidth="2" />
      <line x1="343" y1="226" x2="365" y2="226" stroke="#ED1B24" strokeWidth="2" />
    </g>
  </svg>
);

/**
 * Clean, high-fidelity SVG Flag of the United Kingdom / English (Union Jack)
 * Correctly proportioned 60:30 geometry with counterchanged St Patrick and St Andrew saltires.
 */
export const UKFlag = ({ className = 'w-5 h-3.5', rounded = 'rounded-xs' }) => (
  <svg
    viewBox="0 0 60 30"
    className={`${className} ${rounded} overflow-hidden shadow-xs flex-shrink-0 inline-block align-middle ring-1 ring-black/10`}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Flag of the United Kingdom (English)"
  >
    <clipPath id="uk-clip-border">
      <rect width="60" height="30" />
    </clipPath>
    <g clipPath="url(#uk-clip-border)">
      {/* Royal Navy Blue Field */}
      <rect width="60" height="30" fill="#012169" />

      {/* White Saltire (St Andrew's Cross) */}
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#FFFFFF" strokeWidth="6" />

      {/* Red Saltire (St Patrick's Cross) - Counterchanged quadrants */}
      {/* Top Left Quadrant */}
      <path d="M0 0 L30 15" stroke="#C8102E" strokeWidth="2" strokeDasharray="33.54" strokeDashoffset="0" />
      {/* Bottom Right Quadrant */}
      <path d="M30 15 L60 30" stroke="#C8102E" strokeWidth="2" />
      {/* Top Right Quadrant (counterchanged: shifted) */}
      <path d="M60 0 L30 15" stroke="#C8102E" strokeWidth="2" transform="translate(0, -1)" />
      {/* Bottom Left Quadrant (counterchanged: shifted) */}
      <path d="M0 30 L30 15" stroke="#C8102E" strokeWidth="2" transform="translate(0, 1)" />

      {/* White Cross of St George fimbriation */}
      <path d="M30 0 V30 M0 15 H60" stroke="#FFFFFF" strokeWidth="10" />

      {/* Red Cross of St George */}
      <path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6" />
    </g>
  </svg>
);

/**
 * Optional Clean US Flag for English (Alternative representation)
 */
export const USFlag = ({ className = 'w-5 h-3.5', rounded = 'rounded-xs' }) => (
  <svg
    viewBox="0 0 741 390"
    className={`${className} ${rounded} overflow-hidden shadow-xs flex-shrink-0 inline-block align-middle ring-1 ring-black/10`}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Flag of the United States"
  >
    <rect width="741" height="390" fill="#B22234" />
    <path d="M0 30h741M0 90h741M0 150h741M0 210h741M0 270h741M0 330h741" stroke="#FFFFFF" strokeWidth="30" />
    <rect width="296.4" height="210" fill="#3C3B6E" />
    {/* Clean star matrix indication */}
    <g fill="#FFFFFF">
      <circle cx="30" cy="25" r="7" />
      <circle cx="75" cy="25" r="7" />
      <circle cx="120" cy="25" r="7" />
      <circle cx="165" cy="25" r="7" />
      <circle cx="210" cy="25" r="7" />
      <circle cx="255" cy="25" r="7" />
      
      <circle cx="52" cy="55" r="7" />
      <circle cx="97" cy="55" r="7" />
      <circle cx="142" cy="55" r="7" />
      <circle cx="187" cy="55" r="7" />
      <circle cx="232" cy="55" r="7" />

      <circle cx="30" cy="85" r="7" />
      <circle cx="75" cy="85" r="7" />
      <circle cx="120" cy="85" r="7" />
      <circle cx="165" cy="85" r="7" />
      <circle cx="210" cy="85" r="7" />
      <circle cx="255" cy="85" r="7" />

      <circle cx="52" cy="115" r="7" />
      <circle cx="97" cy="115" r="7" />
      <circle cx="142" cy="115" r="7" />
      <circle cx="187" cy="115" r="7" />
      <circle cx="232" cy="115" r="7" />

      <circle cx="30" cy="145" r="7" />
      <circle cx="75" cy="145" r="7" />
      <circle cx="120" cy="145" r="7" />
      <circle cx="165" cy="145" r="7" />
      <circle cx="210" cy="145" r="7" />
      <circle cx="255" cy="145" r="7" />

      <circle cx="52" cy="175" r="7" />
      <circle cx="97" cy="175" r="7" />
      <circle cx="142" cy="175" r="7" />
      <circle cx="187" cy="175" r="7" />
      <circle cx="232" cy="175" r="7" />
    </g>
  </svg>
);
