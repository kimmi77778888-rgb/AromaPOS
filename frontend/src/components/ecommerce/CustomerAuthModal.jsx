import React, { useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  User, 
  Phone, 
  Lock, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Coffee,
  LogIn,
  UserPlus,
  Camera,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ShieldCheck,
  Gift
} from 'lucide-react';

const PHNOM_PENH_DISTRICTS = [
  'Khan Boeng Keng Kang (BKK)',
  'Khan Daun Penh (Riverside)',
  'Khan Tuol Kork (TK)',
  'Khan Chamkarmon',
  'Khan Sen Sok',
  'Khan Chbar Ampov',
  'Khan Russey Keo',
  'Khan Meanchey',
  'Khan Chroy Changvar'
];

/**
 * Detect Cambodia mobile carrier
 */
const detectCarrier = (phone = '') => {
  const clean = phone.replace(/[^0-9]/g, '');
  if (/^(855|0)(10|15|16|69|70|86|87|93|96|98)/.test(clean)) {
    return { name: 'Smart 5G', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
  }
  if (/^(855|0)(11|12|14|17|61|76|77|78|85|89|92|95|99)/.test(clean)) {
    return { name: 'Cellcard 4G', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
  }
  if (/^(855|0)(88|97|71|66|67|68|90|31)/.test(clean)) {
    return { name: 'Metfone 4G', badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
  }
  return null;
};

export const CustomerAuthModal = ({
  isOpen,
  onClose,
  initialMode = 'REGISTER', // 'REGISTER' | 'LOGIN'
  onAuthSuccess,
  messagePrompt = ''
}) => {
  const { isKhmer } = useLanguage();
  const { registerCustomer, loginCustomer } = useApp();

  const [authMode, setAuthMode] = useState(initialMode); // 'REGISTER' | 'LOGIN'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [district, setDistrict] = useState(PHNOM_PENH_DISTRICTS[0]);
  const [address, setAddress] = useState('');
  const [regAvatar, setRegAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const regFileInputRef = useRef(null);

  if (!isOpen) return null;

  const carrier = detectCarrier(phone);

  const handleRegImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg(isKhmer ? 'សូមជ្រើសរើសឯកសារជារូបភាព (JPG, PNG, WebP)!' : 'Please choose an image file (JPG, PNG, WebP)!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 360;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        setRegAvatar(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (authMode === 'REGISTER') {
      if (!name.trim()) {
        setErrorMsg(isKhmer ? 'សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក' : 'Please enter your full name');
        return;
      }
      if (!phone.trim()) {
        setErrorMsg(isKhmer ? 'សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក' : 'Please enter your phone number');
        return;
      }
      if (!password.trim() || password.length < 4) {
        setErrorMsg(isKhmer ? 'សូមបង្កើតពាក្យសម្ងាត់យ៉ាងតិច ៤ ខ្ទង់' : 'Password must be at least 4 characters');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        const newCust = registerCustomer({
          name: name.trim(),
          phone: phone.trim(),
          password: password.trim(),
          address: address.trim(),
          district,
          avatar: regAvatar
        });
        setIsLoading(false);
        if (onAuthSuccess) onAuthSuccess(newCust);
        onClose();
      }, 450);

    } else {
      // LOGIN MODE
      if (!phone.trim()) {
        setErrorMsg(isKhmer ? 'សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក' : 'Please enter your phone number');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        const loggedUser = loginCustomer(phone.trim(), password.trim());
        setIsLoading(false);
        if (onAuthSuccess) onAuthSuccess(loggedUser);
        onClose();
      }, 400);
    }
  };

  const handleQuickDemoLogin = (demoName, demoPhone) => {
    setIsLoading(true);
    setTimeout(() => {
      const u = loginCustomer(demoPhone, '123456', demoName);
      setIsLoading(false);
      if (onAuthSuccess) onAuthSuccess(u);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-[480px] bg-stone-900/95 border border-stone-800/80 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-stone-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Brand Glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl" />

        {/* Modal Top Header */}
        <div className="relative px-6 pt-6 pb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-950/40">
              <Coffee className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl text-white tracking-tight">
                  {authMode === 'REGISTER' 
                    ? (isKhmer ? 'ចុះឈ្មោះសមាជិកកាហ្វេ' : 'Create Coffee Account')
                    : (isKhmer ? 'ចូលគណនីអតិថិជន' : 'Welcome Back')}
                </h3>
              </div>
              <p className="text-xs text-stone-400">
                Aroma Coffee Club • Phnom Penh
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimalist Segmented Mode Tabs (Apple-style pill) */}
        <div className="px-6 pb-3">
          <div className="p-1 rounded-2xl bg-stone-950/80 border border-stone-800/60 grid grid-cols-2 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setAuthMode('REGISTER'); setErrorMsg(''); }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === 'REGISTER'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ចុះឈ្មោះថ្មី' : 'New Member'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('LOGIN'); setErrorMsg(''); }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === 'LOGIN'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ចូលគណនី' : 'Sign In'}</span>
            </button>
          </div>
        </div>

        {/* Member Perk Micro-Banner */}
        <div className="mx-6 mb-3 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-300">
          <Gift className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-[11px] leading-tight font-medium">
            {messagePrompt || (isKhmer 
              ? '🎁 ទទួលបាន ១០០ ពិន្ទុស្វាគមន៍ & សន្សំត្រាកាហ្វេ ៩ ថែម ១ ឥតគិតថ្លៃ!' 
              : '🎁 Earn 100 welcome points & 1 free coffee reward for every 9 stamps!')}
          </span>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 text-stone-200 scrollbar-thin">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
              <span className="text-base">⚠️</span>
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* REGISTER HERO: Clean Modern Real Avatar Upload */}
            {authMode === 'REGISTER' && (
              <div className="flex flex-col items-center justify-center pb-2 pt-1">
                <input
                  type="file"
                  ref={regFileInputRef}
                  accept="image/*"
                  onChange={handleRegImageUpload}
                  className="hidden"
                />

                <div className="relative group cursor-pointer" onClick={() => regFileInputRef.current?.click()}>
                  {regAvatar ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-amber-500 shadow-xl group-hover:scale-105 transition-all">
                      <img src={regAvatar} alt="Profile Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-b from-stone-950 to-stone-900 border-2 border-dashed border-stone-700 hover:border-amber-500 flex flex-col items-center justify-center text-stone-400 hover:text-amber-400 transition-all shadow-inner group-hover:scale-105">
                      <Camera className="w-6 h-6 stroke-[1.8]" />
                      <span className="text-[9px] font-bold mt-1 text-stone-400 group-hover:text-amber-400">
                        {isKhmer ? '+ រូបថត' : '+ Photo'}
                      </span>
                    </div>
                  )}

                  {/* Camera overlay pill */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-md border-2 border-stone-900">
                    <Camera className="w-3 h-3 stroke-[2.5]" />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <p className="text-[11px] text-stone-400 font-medium">
                    {regAvatar 
                      ? (isKhmer ? 'រូបថតផ្ទាល់ខ្លួនត្រូវបានជ្រើសរើស' : 'Real photo selected') 
                      : (isKhmer ? 'បង្ហោះរូបថតពិត (ស្រេចចិត្ត)' : 'Upload real photo (Optional)')}
                  </p>
                  {regAvatar && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRegAvatar('');
                      }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-0.5"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>{isKhmer ? 'លុប' : 'Remove'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* REGISTER: Full Name Field */}
            {authMode === 'REGISTER' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                  <span>{isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'}</span>
                  <span className="text-amber-400 font-bold">*</span>
                </label>
                <div className="relative flex items-center rounded-2xl bg-stone-950/80 border border-stone-800/80 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/15 transition-all">
                  <User className="w-4 h-4 text-stone-500 ml-3.5 shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isKhmer ? 'ឧ. សុខា មាន (Sokha Mean)' : 'e.g. Sokha Mean'}
                    required
                    className="w-full bg-transparent px-3 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Mobile Phone Field with Clean In-Field Carrier Detection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>{isKhmer ? 'លេខទូរស័ព្ទ' : 'Mobile Phone Number'}</span>
                  <span className="text-amber-400 font-bold">*</span>
                </span>
                {carrier && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${carrier.badge}`}>
                    {carrier.name}
                  </span>
                )}
              </label>
              <div className="relative flex items-center rounded-2xl bg-stone-950/80 border border-stone-800/80 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/15 transition-all">
                <Phone className="w-4 h-4 text-stone-500 ml-3.5 shrink-0" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="012 888 999 / 096 927 6538"
                  required
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <span>{isKhmer ? 'ពាក្យសម្ងាត់' : 'Password'}</span>
                <span className="text-amber-400 font-bold">*</span>
              </label>
              <div className="relative flex items-center rounded-2xl bg-stone-950/80 border border-stone-800/80 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/15 transition-all">
                <Lock className="w-4 h-4 text-stone-500 ml-3.5 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 mr-1 text-stone-500 hover:text-stone-300 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* REGISTER: Phnom Penh District & Delivery Address */}
            {authMode === 'REGISTER' && (
              <div className="space-y-3 pt-1">
                {/* District Select */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{isKhmer ? 'ខណ្ឌ / តំបន់នៅភ្នំពេញ' : 'Phnom Penh District'}</span>
                  </label>
                  <div className="relative rounded-2xl bg-stone-950/80 border border-stone-800/80 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/15 transition-all">
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-transparent appearance-none pl-3.5 pr-8 py-2.5 text-xs text-stone-200 focus:outline-none cursor-pointer"
                    >
                      {PHNOM_PENH_DISTRICTS.map((d) => (
                        <option key={d} value={d} className="bg-stone-900 text-stone-200">{d}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Street Address Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">
                    {isKhmer ? 'ផ្ទះលេខ & ផ្លូវ (សម្រាប់ដឹកជញ្ជូនដល់កន្លែង)' : 'Delivery Address (Street / Building)'}
                  </label>
                  <div className="relative flex items-center rounded-2xl bg-stone-950/80 border border-stone-800/80 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/15 transition-all">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={isKhmer ? 'ឧ. ផ្ទះលេខ ៤៥, ផ្លូវ ២៨៨, សង្កាត់ បឹងកេងកង ១' : 'e.g. #45, Street 288, Sangkat BKK1'}
                      className="w-full bg-transparent px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/25"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>{isKhmer ? 'កំពុងដំណើរការ...' : 'Connecting...'}</span>
                  </>
                ) : authMode === 'REGISTER' ? (
                  <>
                    <Sparkles className="w-4 h-4 fill-stone-950" />
                    <span>{isKhmer ? 'បង្កើតគណនី & បន្តទៅទិញកាហ្វេ' : 'Complete Registration & Continue'}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{isKhmer ? 'ចូលគណនី & បន្តទៅទិញកាហ្វេ' : 'Sign In & Continue'}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Minimalist 1-Click Fast Demo Pill Row */}
          <div className="pt-3 pb-1 border-t border-stone-800/60">
            <div className="flex items-center justify-between text-[11px] text-stone-500 mb-2">
              <span>{isKhmer ? 'សាកល្បងរហ័ស (Demo Accounts):' : 'Quick demo accounts:'}</span>
              <span className="text-[10px] text-amber-500/70 font-mono">1-Click Fill</span>
            </div>
            <div className="flex items-center gap-2">
              {[
                { name: 'Phara', phone: '096 927 6538' },
                { name: 'Sophea', phone: '012 888 999' },
                { name: 'David', phone: '017 333 444' }
              ].map((acc) => (
                <button
                  key={acc.phone}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc.name, acc.phone)}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-stone-950/70 hover:bg-stone-800/80 border border-stone-800 text-stone-300 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer text-center truncate"
                >
                  <span className="font-bold">{acc.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
