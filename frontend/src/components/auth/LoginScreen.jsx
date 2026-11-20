import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Coffee, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export const LoginScreen = ({ onReturnToEcommerce }) => {
  const { login } = useApp();
  const { isKhmer } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanInput = (username || '').trim();
    if (!cleanInput) {
      setError(isKhmer ? 'សូមបញ្ចូលឈ្មោះគណនី ឬ អ៊ីមែល!' : 'Please enter your username or email!');
      return;
    }

    const cleanPass = (password || '').trim();
    if (!cleanPass) {
      setError(isKhmer ? 'សូមបញ្ចូលពាក្យសម្ងាត់!' : 'Please enter your password!');
      return;
    }

    const formattedEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput}@cafe.com`;

    setIsLoading(true);
    try {
      await login(formattedEmail, cleanPass);
    } catch (err) {
      setError(err.message || (isKhmer ? 'ឈ្មោះគណនី ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ!' : 'Invalid username or password!'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-khmer bg-stone-950 text-stone-100">

      {/* Left Branding Panel (Desktop) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-amber-700 via-amber-600 to-stone-900 flex-col items-center justify-center p-12 relative overflow-hidden select-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-stone-950/40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative text-center text-white space-y-6 max-w-sm">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto shadow-2xl border border-white/20">
            <Coffee className="w-10 h-10 text-white" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-4xl font-black text-white tracking-tight">Aroma</h1>
              <h1 className="text-4xl font-black text-stone-950 tracking-tight">POS</h1>
            </div>
            <p className="text-amber-100 mt-2 text-sm">Artisan Cafe Point of Sale & Management Suite</p>
          </div>

          <div className="space-y-3 text-left">
            {[
              { icon: '🌅', label: 'វេនព្រឹក', time: '06:00 — 12:00' },
              { icon: '🌆', label: 'វេនរសៀល', time: '13:00 — 20:00' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-3 backdrop-blur-xs">
                <span className="text-xl">{s.icon}</span>
                <div>
                  <p className="text-xs text-amber-200 font-medium">{s.label}</p>
                  <p className="text-sm font-bold text-white">{s.time}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-amber-200/70 flex items-center justify-center gap-1.5 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Secure Station Terminal</span>
          </p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 relative">
        {/* Top Header Controls */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          {onReturnToEcommerce ? (
            <button
              type="button"
              onClick={onReturnToEcommerce}
              className="py-1.5 px-3 rounded-xl bg-stone-900/80 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ទំព័រដើម' : 'Storefront'}</span>
            </button>
          ) : <div />}

          <LanguageSwitcher />
        </div>

        {/* Ambient glow */}
        <div className="absolute top-[20%] right-[10%] w-[350px] h-[350px] rounded-full bg-amber-600/10 blur-[100px] pointer-events-none"></div>

        {/* Centered Login Card */}
        <div className="w-full max-w-[380px] mx-auto space-y-7 relative z-10 my-auto py-6">

          {/* Header */}
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 shadow-lg shadow-amber-950/40 mb-1">
              <Coffee className="w-6 h-6 text-stone-950" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-100 tracking-tight">
              {isKhmer ? 'ចូលប្រើប្រព័ន្ធ' : 'Sign In'}
            </h2>
            <p className="text-stone-400 text-xs sm:text-sm">
              {isKhmer ? 'បញ្ចូលឈ្មោះគណនី និងពាក្យសម្ងាត់ដើម្បីបន្ត' : 'Enter your username and password to continue'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 bg-rose-950/50 border border-rose-800/60 rounded-2xl px-4 py-3.5 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5"></span>
              <p className="text-rose-300 text-xs sm:text-sm font-medium leading-snug">{error}</p>
            </div>
          )}

          {/* Form: ONLY Username and Password */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username / Email */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                {isKhmer ? 'ឈ្មោះគណនី ឬ អ៊ីមែល' : 'Username or Email'}
              </label>
              <div className="relative group">
                <User className="w-4 h-4 text-stone-500 group-focus-within:text-amber-400 absolute left-4 top-1/2 -translate-y-1/2 transition" />
                <input
                  type="text"
                  name="username"
                  id="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  placeholder="admin (or email)"
                  autoComplete="username"
                  spellCheck="false"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-stone-900/90 border border-stone-800 hover:border-stone-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-stone-100 text-sm rounded-2xl outline-none transition placeholder:text-stone-600 font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                {isKhmer ? 'ពាក្យសម្ងាត់' : 'Password'}
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-stone-500 group-focus-within:text-amber-400 absolute left-4 top-1/2 -translate-y-1/2 transition" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  spellCheck="false"
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-stone-900/90 border border-stone-800 hover:border-stone-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-stone-100 text-sm rounded-2xl outline-none transition placeholder:text-stone-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-950/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin"></div>
                  <span>{isKhmer ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{isKhmer ? 'ចូលប្រើប្រព័ន្ធ' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Minimal Clean Footer */}
        <div className="w-full max-w-md mx-auto text-center pt-4">
          <p className="text-[11px] text-stone-500 font-mono">
            AromaPOS 2.0 • Secured Station Terminal
          </p>
        </div>
      </div>
    </div>
  );
};
