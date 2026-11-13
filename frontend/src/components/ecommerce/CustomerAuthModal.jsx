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
  ShieldCheck,
  Coffee,
  LogIn,
  UserPlus,
  Camera,
  Upload,
  Trash2
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
    return { name: 'Smart Axiata 5G', color: 'bg-emerald-950 text-emerald-300 border-emerald-700/80', icon: '🟢' };
  }
  if (/^(855|0)(11|12|14|17|61|76|77|78|85|89|92|95|99)/.test(clean)) {
    return { name: 'Cellcard 4G LTE', color: 'bg-orange-950 text-orange-300 border-orange-700/80', icon: '🟠' };
  }
  if (/^(855|0)(88|97|71|66|67|68|90|31)/.test(clean)) {
    return { name: 'Metfone 4G', color: 'bg-rose-950 text-rose-300 border-rose-700/80', icon: '🔴' };
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
        setErrorMsg(isKhmer ? 'សូមបញ្ចូលឈ្មោះរបស់អ្នក' : 'Please enter your full name');
        return;
      }
      if (!phone.trim()) {
        setErrorMsg(isKhmer ? 'សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក' : 'Please enter your phone number');
        return;
      }
      if (!password.trim()) {
        setErrorMsg(isKhmer ? 'សូមបង្កើតពាក្យសម្ងាត់' : 'Please create a password');
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
      }, 500);

    } else {
      // LOGIN MODE
      if (!phone.trim()) {
        setErrorMsg(isKhmer ? 'សូមបញ្ចូលលេខទូរស័ព្ទ' : 'Please enter your phone number');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">
                {authMode === 'REGISTER' 
                  ? (isKhmer ? 'ចុះឈ្មោះសមាជិក Aroma Club' : 'Create Coffee Account')
                  : (isKhmer ? 'ចូលគណនីអតិថិជន' : 'Customer Sign In')}
              </h3>
              <p className="text-xs text-stone-400">
                Aroma Coffee Club • Earn Stamps & Fast Reordering
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-900 border border-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Perks & Notification Banner */}
        <div className="px-5 py-3 bg-gradient-to-r from-amber-950/60 via-stone-900 to-amber-950/60 border-b border-amber-800/30 flex items-center gap-2.5 text-xs text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {messagePrompt || (isKhmer
              ? '🎁 ចុះឈ្មោះឥឡូវនេះដើម្បីទទួលបាន ១០០ ពិន្ទុ & ត្រាកាហ្វេឥតគិតថ្លៃ!'
              : '🎁 Sign in or create an account to checkout and earn rewards on every cup!')}
          </span>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-stone-200">
          {/* Mode Switcher Tabs */}
          <div className="p-1 rounded-2xl bg-stone-950 border border-stone-850 grid grid-cols-2 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setAuthMode('REGISTER'); setErrorMsg(''); }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                authMode === 'REGISTER'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ចុះឈ្មោះគណនីថ្មី' : 'Create Account'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('LOGIN'); setErrorMsg(''); }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                authMode === 'LOGIN'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ចូលគណនី' : 'Sign In'}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* REGISTER SPECIFIC: Full Name */}
            {authMode === 'REGISTER' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'} *</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sokha Mean"
                  required
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Mobile Phone Input with Carrier Detection */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKhmer ? 'លេខទូរស័ព្ទ' : 'Mobile Phone Number'} *</span>
                </label>
                {carrier && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${carrier.color}`}>
                    {carrier.icon} {carrier.name}
                  </span>
                )}
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 012 888 999"
                required
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{isKhmer ? 'ពាក្យសម្ងាត់' : 'Password'} *</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* REGISTER SPECIFIC: Default Delivery Address */}
            {authMode === 'REGISTER' && (
              <div className="space-y-2.5 pt-1 border-t border-stone-850">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{isKhmer ? 'ខណ្ឌ / តំបន់នៅភ្នំពេញ' : 'Default Phnom Penh District'}</span>
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {PHNOM_PENH_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-300">
                    {isKhmer ? 'ផ្ទះលេខ & ផ្លូវ (សម្រាប់ដឹកជញ្ជូន)' : 'House & Street Address'}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. #45, Street 288, Sangkat BKK1"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Real Profile Photo Upload (Optional) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isKhmer ? 'រូបថតផ្ទាល់ខ្លួនពិត (Real Profile Photo)' : 'Real Profile Photo'}</span>
                    </label>
                    {regAvatar && (
                      <button
                        type="button"
                        onClick={() => setRegAvatar('')}
                        className="text-[10px] text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>{isKhmer ? 'លុប' : 'Remove'}</span>
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    ref={regFileInputRef}
                    accept="image/*"
                    onChange={handleRegImageUpload}
                    className="hidden"
                  />

                  <div 
                    onClick={() => regFileInputRef.current?.click()}
                    className="p-2.5 rounded-xl bg-stone-950 border border-dashed border-stone-800 hover:border-amber-500/60 cursor-pointer transition flex items-center gap-3"
                  >
                    {regAvatar ? (
                      <img src={regAvatar} alt="Upload Preview" className="w-10 h-10 rounded-xl object-cover border border-amber-500 shadow" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500">
                        <Upload className="w-4 h-4 text-amber-400" />
                      </div>
                    )}
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-200 truncate">
                        {regAvatar ? (isKhmer ? '✅ បានជ្រើសរើសរូបថតពិត' : '✅ Real photo ready') : (isKhmer ? 'ចុចដើម្បីបង្ហោះរូបថតពីទូរស័ព្ទ / កុំព្យូទ័រ' : 'Upload real photo from device')}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {isKhmer ? 'JPG, PNG, WebP ឬថតផ្ទាល់ពីទូរស័ព្ទ' : 'JPG, PNG, WebP or Camera'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-stone-950 font-black text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-xl shadow-amber-950/40 mt-4"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>{isKhmer ? 'កំពុងដំណើរការ...' : 'Authenticating...'}</span>
                </>
              ) : authMode === 'REGISTER' ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isKhmer ? 'បង្កើតគណនី & បន្តទៅទិញកាហ្វេ' : 'Register & Continue to Checkout'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{isKhmer ? 'ចូលគណនី & បន្តទៅទិញកាហ្វេ' : 'Sign In & Continue to Checkout'}</span>
                </>
              )}
            </button>
          </form>

          {/* 1-Click Fast Demo Sign-In Options */}
          <div className="pt-4 border-t border-stone-850 space-y-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block text-center">
              {isKhmer ? 'ឬចូលសាកល្បងរហ័ស (1-Click Demo Accounts)' : 'Or Instant 1-Click Demo Customer'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Sophea Kem', '012 888 999')}
                className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-850 border border-stone-800 text-left transition cursor-pointer"
              >
                <p className="font-bold text-xs text-amber-300">👤 Sophea Kem</p>
                <p className="text-[10px] text-stone-500 font-mono">012 888 999 • Gold VIP</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('David Miller', '017 333 444')}
                className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-850 border border-stone-800 text-left transition cursor-pointer"
              >
                <p className="font-bold text-xs text-stone-200">👤 David Miller</p>
                <p className="text-[10px] text-stone-500 font-mono">017 333 444 • Member</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

