import React, { useState } from 'react';
import { User } from 'lucide-react';
import { isRealAvatar } from '../../services/api';

const ROLE_GRADIENTS = {
  ADMIN: 'bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 border-amber-400/50 shadow-amber-950/40',
  MANAGER: 'bg-gradient-to-br from-indigo-500 to-purple-700 text-white border-indigo-400/50 shadow-indigo-950/40',
  CASHIER: 'bg-gradient-to-br from-cyan-400 to-teal-600 text-stone-950 border-cyan-300/50 shadow-cyan-950/40',
  BARISTA: 'bg-gradient-to-br from-emerald-400 to-emerald-700 text-stone-950 border-emerald-300/50 shadow-emerald-950/40',
  SECURITY: 'bg-gradient-to-br from-blue-500 to-indigo-800 text-white border-blue-400/50 shadow-blue-950/40'
};

const DEFAULT_GRADIENT = 'bg-gradient-to-br from-stone-700 to-stone-900 text-stone-200 border-stone-600';

const SIZE_STYLES = {
  xs: {
    container: 'w-6 h-6 rounded-lg text-[9px] font-extrabold',
    icon: 'w-3.5 h-3.5',
    badge: 'w-2 h-2 -bottom-0.5 -right-0.5'
  },
  sm: {
    container: 'w-8 h-8 rounded-xl text-xs font-extrabold',
    icon: 'w-4 h-4',
    badge: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5'
  },
  md: {
    container: 'w-10 h-10 rounded-xl text-sm font-extrabold',
    icon: 'w-5 h-5',
    badge: 'w-3 h-3 -bottom-1 -right-1 text-[8px]'
  },
  lg: {
    container: 'w-14 h-14 rounded-2xl text-base font-extrabold',
    icon: 'w-7 h-7',
    badge: 'w-4 h-4 -bottom-1 -right-1 text-[9px]'
  },
  xl: {
    container: 'w-20 h-20 rounded-3xl text-xl font-extrabold',
    icon: 'w-10 h-10',
    badge: 'w-5 h-5 -bottom-1.5 -right-1.5 text-[10px]'
  }
};

/**
 * Returns initials from a full name (e.g., "Liam Vance" -> "LV", "Sophia" -> "SB" or "S")
 */
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const UserAvatar = ({
  user = null,
  src = '',
  name = '',
  role = '',
  size = 'md',
  className = '',
  imgClassName = '',
  shape = 'rounded-xl',
  showBadge = false,
  showFaceIdBadge = false,
  onClick = undefined,
  alt = ''
}) => {
  const [imageError, setImageError] = useState(false);

  const effectiveName = name || user?.name || '';
  const effectiveRole = (role || user?.role || 'CASHIER').toUpperCase();
  const rawPhoto = src || user?.avatar || user?.facePhoto || '';
  const isReal = isRealAvatar(rawPhoto);
  const sizeConfig = SIZE_STYLES[size] || SIZE_STYLES.md;
  const gradientClass = ROLE_GRADIENTS[effectiveRole] || DEFAULT_GRADIENT;
  const initials = getInitials(effectiveName);
  const hasFaceEnrolled = showFaceIdBadge || !!(user?.faceEnrolled && isReal);

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-95 transition' : ''
      } ${className}`}
    >
      {isReal && !imageError ? (
        <img
          src={rawPhoto}
          alt={alt || effectiveName || 'User profile'}
          onError={() => setImageError(true)}
          className={`${sizeConfig.container} ${shape} object-cover ring-1 ring-white/10 shadow-md ${imgClassName}`}
        />
      ) : (
        <div
          className={`${sizeConfig.container} ${shape} border shadow-md flex items-center justify-center tracking-wider ${gradientClass} ${imgClassName}`}
          title={effectiveName}
        >
          {initials ? initials : <User className={sizeConfig.icon} />}
        </div>
      )}

      {/* Online / Active Badge */}
      {showBadge && (
        <span
          className={`absolute ${sizeConfig.badge} rounded-full bg-emerald-500 ring-2 ring-stone-950 shadow`}
          title="Online Station Operator"
        />
      )}
    </div>
  );
};

export default UserAvatar;
