import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Coffee, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export const LoginScreen = () => {
  const { login, faceLogin } = useApp();
  const { isKhmer } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  // Countdown timer for security lockout
  React.useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setError('');

    if (!email || !email.includes('@')) {
      setError('សូមបំពេញ Email ឲ្យបានត្រឹមត្រូវ!');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password ត្រូវមានយ៉ាងតិច ៤ តួអក្សរ!');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      setFailedCount(0);
    } catch (err) {
      const nextFails = failedCount + 1;
      setFailedCount(nextFails);
      if (nextFails >= 5) {
        setLockoutSeconds(30);
        setError('សុវត្ថិភាព៖ បរាជ័យ ៥ លើក! ប្រព័ន្ធត្រូវបានចាក់សោរ ៣០ វិនាទី (Security Lockout).');
      } else {
        setError(err.message || 'Email ឬ Password មិនត្រឹមត្រូវ!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-khmer">

      {/* Left Branding Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-amber-700 via-amber-600 to-stone-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-stone-900/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative text-center text-white space-y-6 max-w-sm">
          <div className="w-20 h-20 bg-white/15 backdrop-blur rounded-3xl flex items-center justify-center mx-auto shadow-2xl border border-white/20">
            <Coffee className="w-10 h-10 text-white" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-4xl font-black text-white tracking-tight">Aroma</h1>
              <h1 className="text-4xl font-black text-stone-950 tracking-tight">POS</h1>
            </div>
            <p className="text-amber-100 mt-2 text-sm">Artisan Cafe Point of Sale & Inventory Suite</p>
          </div>

          <div className="space-y-3 text-left">
            {[
              { icon: '🌅', label: 'វេនព្រឹក', time: '06:00 — 12:00' },
              { icon: '🌆', label: 'វេនរសៀល', time: '13:00 — 20:00' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
                <span className="text-xl">{s.icon}</span>
                <div>
                  <p className="text-xs text-amber-200 font-medium">{s.label}</p>
                  <p className="text-sm font-bold text-white">{s.time}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-amber-200/60">🔐 Secure Station Encryption</p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center bg-stone-950 p-6 relative">
        <div className="absolute top-6 right-6 z-20">
          <LanguageSwitcher />
        </div>

        {/* Ambient glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-amber-600/10 blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-[400px] space-y-8 relative z-10">

          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-xl mb-3">
              <Coffee className="w-7 h-7 text-stone-950" />
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-2xl font-black text-stone-100">Aroma</h1>
              <h1 className="text-2xl font-black text-amber-500">POS</h1>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-stone-100">ចូលប្រើប្រព័ន្ធ</h2>
            <p className="text-stone-400 text-sm mt-1">Welcome back — Sign in to continue</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 bg-rose-950/50 border border-rose-800/60 rounded-2xl px-4 py-3.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1"></span>
              <p className="text-rose-300 text-sm font-medium leading-snug">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Staff Email
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-stone-500 group-focus-within:text-amber-400 absolute left-4 top-1/2 -translate-y-1/2 transition" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="name@cafe.com"
                  autoComplete="email"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-stone-900 border border-stone-800 hover:border-stone-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-stone-100 text-sm rounded-2xl outline-none transition placeholder:text-stone-600"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Passcode / Password
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-stone-500 group-focus-within:text-amber-400 absolute left-4 top-1/2 -translate-y-1/2 transition" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-stone-900 border border-stone-800 hover:border-stone-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-stone-100 text-sm rounded-2xl outline-none transition placeholder:text-stone-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || lockoutSeconds > 0}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-bold text-sm rounded-2xl shadow-lg shadow-amber-950/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin"></div>
                  <span>កំពុងផ្ទៀងផ្ទាត់...</span>
                </>
              ) : lockoutSeconds > 0 ? (
                <span>ជាប់សោរសុវត្ថិភាព ({lockoutSeconds}s)</span>
              ) : (
                <>
                  <span>Access Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-stone-600">
            AromaPOS System v2.4 • Secure Station Encryption
          </p>
        </div>
      </div>
    </div>
  );
};
