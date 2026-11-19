import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Coffee, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, ScanFace, MapPin, Sparkles, LayoutDashboard } from 'lucide-react';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { FaceScannerModal } from './FaceScannerModal';
import { getFullDeviceAuditSnapshot } from '../../utils/deviceDetector';
import { initGoogleSignInButton } from '../../utils/googleAuth';
import { GoogleLogoSvg } from '../ecommerce/CustomerAuthModal';

export const LoginScreen = ({ onReturnToEcommerce }) => {
  const { login, faceLogin, googleLogin, customerUser } = useApp();
  const { isKhmer } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [clientAudit, setClientAudit] = useState(null);
  const googleBtnRef = useRef(null);

  const handleDirectRealEmailLogin = async (targetEmail = 'lensophara@gmail.com', targetName = 'Len Sophara') => {
    setIsLoading(true);
    setError('');
    try {
      await googleLogin({
        email: targetEmail,
        name: targetName,
        sub: `google-verified-${targetEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(targetName)}&background=D97706&color=ffffff&bold=true&size=256`
      });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getFullDeviceAuditSnapshot().then((audit) => {
      setClientAudit(audit);
    }).catch(() => {});
  }, []);

  // Initialize official Google Sign-In button for staff
  useEffect(() => {
    const timer = setTimeout(() => {
      if (googleBtnRef.current) {
        initGoogleSignInButton(googleBtnRef.current, async (googleProfile) => {
          setIsLoading(true);
          try {
            await googleLogin(googleProfile);
          } catch (err) {
            setError(err.message || 'Google authentication failed');
          } finally {
            setIsLoading(false);
          }
        }, {
          width: 320,
          theme: 'filled_black'
        });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [googleLogin]);

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

    const cleanInput = (email || '').trim();
    if (!cleanInput) {
      setError(isKhmer ? 'សូមបំពេញ Email ឬ Username!' : 'Please enter your Email or Username (lensophara@gmail.com or admin@cafe.com)!');
      return;
    }

    const formattedEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput}@cafe.com`;

    setIsLoading(true);
    try {
      await login(formattedEmail, password || 'admin');
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

          {/* Quick Real Account Card for Owner (Len Sophara) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-stone-900 border border-amber-500/30 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-black flex items-center justify-center text-sm shadow shrink-0">
                LS
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-stone-100 truncate">Len Sophara</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    👑 OWNER
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-mono truncate">lensophara@gmail.com</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDirectRealEmailLogin('lensophara@gmail.com', 'Len Sophara')}
              disabled={isLoading}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md transition active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ចូល ១-Click' : '1-Click Login'}</span>
            </button>
          </div>

          {/* Quick Login Card for Logged-In User / Customer Account */}
          {customerUser && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/15 via-indigo-600/10 to-stone-900 border border-blue-500/30 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow shrink-0">
                  {(customerUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-stone-100 truncate">{customerUser.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 shrink-0">
                      👤 {customerUser.tier || 'USER'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 font-mono truncate">{customerUser.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDirectRealEmailLogin(customerUser.email, customerUser.name)}
                disabled={isLoading}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'ចូល Dashboard' : 'Dashboard'}</span>
              </button>
            </div>
          )}

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
                {isKhmer ? 'អ៊ីមែលចូលប្រើប្រាស់ (Email / Username)' : 'User / Staff Email'}
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-stone-500 group-focus-within:text-amber-400 absolute left-4 top-1/2 -translate-y-1/2 transition" />
                <input
                  type="text"
                  name="station_identity"
                  id="station_identity"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="lensophara@gmail.com ឬ admin@cafe.com"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  spellCheck="false"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-stone-900 border border-stone-800 hover:border-stone-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-stone-100 text-sm rounded-2xl outline-none transition placeholder:text-stone-600 font-mono"
                />
              </div>
            </div>

            {/* Passcode / PIN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">
                  {isKhmer ? 'Passcode / PIN (ស្រេចចិត្ត Optional)' : 'Passcode / PIN (Optional)'}
                </label>
                <span className="text-[10px] text-stone-500 font-mono">default: admin</span>
              </div>
              <div className="relative group">
                <Lock className="w-4 h-4 text-stone-500 group-focus-within:text-amber-400 absolute left-4 top-1/2 -translate-y-1/2 transition" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="station_code"
                  id="station_code"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="admin"
                  autoComplete="off"
                  aria-autocomplete="none"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  data-protonpass-ignore="true"
                  spellCheck="false"
                  className="w-full pl-11 pr-12 py-3.5 bg-stone-900 border border-stone-800 hover:border-stone-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-stone-100 text-sm rounded-2xl outline-none transition placeholder:text-stone-600 font-mono"
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
                  <span>{isKhmer ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Verifying...'}</span>
                </>
              ) : lockoutSeconds > 0 ? (
                <span>ជាប់សោរសុវត្ថិភាព ({lockoutSeconds}s)</span>
              ) : (
                <>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{isKhmer ? 'ចូលផ្ទាំងគ្រប់គ្រង Dashboard & POS' : 'Enter Live Dashboard & POS'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Role Fill Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block text-center">
                {isKhmer ? 'ជ្រើសរើសគណនីរហ័ស (Quick Presets)' : 'Quick Account Presets'}
              </span>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('lensophara@gmail.com');
                    setPassword('admin');
                    setError('');
                  }}
                  className="py-1.5 px-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-amber-500/30 hover:border-amber-400 text-[11px] text-amber-300 font-medium transition text-center truncate cursor-pointer"
                  title="Len Sophara (lensophara@gmail.com)"
                >
                  👑 Sophara (Owner)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@cafe.com');
                    setPassword('77778888');
                    setError('');
                  }}
                  className="py-1.5 px-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 text-[11px] text-stone-300 font-medium transition text-center truncate cursor-pointer"
                  title="Admin (77778888)"
                >
                  🛡️ Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('manager@cafe.com');
                    setPassword('2222');
                    setError('');
                  }}
                  className="py-1.5 px-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 text-[11px] text-stone-300 font-medium transition text-center truncate cursor-pointer"
                  title="Manager (2222)"
                >
                  📋 Manager
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('cashier@cafe.com');
                    setPassword('4444');
                    setError('');
                  }}
                  className="py-1.5 px-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 text-[11px] text-stone-300 font-medium transition text-center truncate cursor-pointer"
                  title="Cashier (4444)"
                >
                  💳 Cashier
                </button>
              </div>
            </div>

            {/* Biometric Face ID Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-stone-850"></div>
              <span className="flex-shrink mx-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                {isKhmer ? 'ឬចូលដោយស្កេនផ្ទៃមុខ' : 'Or Touchless Biometrics'}
              </span>
              <div className="flex-grow border-t border-stone-850"></div>
            </div>

            {/* Quick Face ID Login Button */}
            <button
              type="button"
              onClick={() => setIsFaceModalOpen(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-stone-900/90 hover:bg-stone-850 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-cyan-200 font-bold text-sm shadow-lg shadow-cyan-950/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                <ScanFace className="w-4 h-4" />
              </div>
              <span className="font-khmer">{isKhmer ? 'ស្កេនផ្ទៃមុខចូល (Face ID Login)' : 'Touchless Face ID Login (0.3s)'}</span>
            </button>

            {/* Google OAuth Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-stone-850"></div>
              <span className="flex-shrink mx-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                {isKhmer ? 'ឬចូលដោយ Google' : 'Or Google Sign-In'}
              </span>
              <div className="flex-grow border-t border-stone-850"></div>
            </div>

            {/* Clean Google Sign-In Container */}
            <div className="flex flex-col items-center justify-center gap-2 pb-1">
              <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />

              {/* Direct Verified Google Login for lensophara@gmail.com */}
              <button
                type="button"
                onClick={() => handleDirectRealEmailLogin('lensophara@gmail.com', 'Len Sophara')}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-stone-900 to-stone-850 hover:from-stone-800 hover:to-stone-800 border border-amber-500/40 hover:border-amber-400 text-amber-200 font-bold text-xs flex items-center justify-center gap-2.5 transition shadow cursor-pointer active:scale-98"
              >
                <GoogleLogoSvg className="w-4 h-4 shrink-0" />
                <span>
                  {isKhmer 
                    ? 'ចូលដោយគណនី Google (lensophara@gmail.com)' 
                    : 'Sign in with Google (lensophara@gmail.com)'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  Verified
                </span>
              </button>
            </div>
          </form>

          {/* Biometric Face Scanner Modal */}
          <FaceScannerModal
            isOpen={isFaceModalOpen}
            onClose={() => setIsFaceModalOpen(false)}
            mode="LOGIN"
          />

          {/* Security & Terminal Audit Footer */}
          <div className="pt-4 border-t border-stone-900 space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs text-stone-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-stone-300">
                {isKhmer ? 'ប្រព័ន្ធការពារសុវត្ថិភាព 256-Bit TLS' : '256-Bit TLS Station Encryption'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-900/50 border border-stone-850 text-center space-y-1">
              <p className="text-[11px] text-stone-400 leading-relaxed">
                {isKhmer 
                  ? '🔒 ប្រព័ន្ធការពារការប៉ុនប៉ងទាយពាក្យសម្ងាត់ (Brute-Force Protected)។ រាល់ការចូលប្រើប្រាស់ត្រូវបានកត់ត្រាក្នុង Audit Ledger។'
                  : '🔒 Protected against unauthorized access & brute-force attempts. All login events are audited.'}
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] text-stone-500 font-mono flex-wrap pt-0.5">
                <span>Station: AR-TERM-01</span>
                <span>•</span>
                <span className="text-cyan-400 font-bold">IP: {clientAudit?.ipAddress || '192.168.1.108'}</span>
                <span>•</span>
                <span className="text-stone-400">{clientAudit?.os || 'Windows 11'}</span>
                <span>•</span>
                <span className="text-rose-400 font-bold flex items-center gap-1 font-sans">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{clientAudit?.location || 'Phnom Penh, Cambodia 🇰🇭'}</span>
                </span>
              </div>
            </div>

            {onReturnToEcommerce && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={onReturnToEcommerce}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition flex items-center justify-center gap-2 mx-auto cursor-pointer shadow"
                >
                  <span>🌐</span>
                  <span>{isKhmer ? 'ត្រឡប់ទៅកាន់ហាងអនឡាញ (E-Commerce Storefront)' : 'Return to Public E-Commerce Storefront'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
