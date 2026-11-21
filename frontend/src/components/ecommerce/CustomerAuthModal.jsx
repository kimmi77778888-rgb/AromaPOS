import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { soundService } from '../../services/soundService';
import confetti from 'canvas-confetti';
import { 
  X, 
  User, 
  Sparkles, 
  Coffee, 
  ShieldCheck, 
  Gift, 
  Mail, 
  Lock, 
  Phone,
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserPlus,
  LogIn
} from 'lucide-react';

export const GoogleLogoSvg = ({ className = "w-4 h-4" }) => (
  <Mail className={className} />
);

export const CustomerAuthModal = ({
  isOpen,
  onClose,
  onAuthSuccess,
  messagePrompt = '',
  initialTab = 'register' // 'register' | 'login'
}) => {
  const { isKhmer } = useLanguage();
  const { registerCustomer, loginCustomer, customers = [] } = useApp();

  // Active Tab: 'register' (Step 1) vs 'login' (Step 2)
  const [activeTab, setActiveTab] = useState(initialTab || 'register');

  // Step 1: Register State
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Step 2: Login State
  const [loginEmail, setLoginEmail] = useState('lensophara@gmail.com');
  const [loginPassword, setLoginPassword] = useState('password123');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  if (!isOpen) return null;

  const triggerCelebration = () => {
    try {
      soundService.playKaChing();
      confetti({
        particleCount: 85,
        spread: 95,
        origin: { y: 0.6 },
        colors: ['#D97706', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']
      });
    } catch (e) {}
  };

  // STEP 1: Handle Real Email Registration
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const email = (regEmail || '').trim().toLowerCase();
    const name = (regName || '').trim();
    const phone = (regPhone || '').trim();
    const password = (regPassword || '').trim();

    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMsg(isKhmer ? 'សូមបញ្ចូលអាសយដ្ឋាន Email ពិតប្រាកដរបស់អ្នក' : 'Please enter a valid real email address');
      return;
    }

    if (!name) {
      setErrorMsg(isKhmer ? 'សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក' : 'Please enter your full name');
      return;
    }

    if (!phone || phone.length < 8) {
      setErrorMsg(isKhmer ? 'សូមបញ្ចូលលេខទូរស័ព្ទត្រឹមត្រូវ' : 'Please enter a valid phone number');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg(isKhmer ? 'សូមបញ្ចូលលេខសម្ងាត់យ៉ាងតិច ៤ ខ្ទង់' : 'Password must be at least 4 characters');
      return;
    }

    // Check if email already registered
    const existing = customers.find((c) => c.email && c.email.toLowerCase() === email);
    if (existing) {
      setSuccessNotice(
        isKhmer 
          ? 'Email នេះមានគណនីរួចហើយ! បានប្តូរទៅជំហានទី២ ដើម្បីចូលគណនី។' 
          : 'Email already registered! Switched to Step 2: Login.'
      );
      setLoginEmail(email);
      setActiveTab('login');
      return;
    }

    setIsLoading(true);

    try {
      const newCustomer = registerCustomer({
        email,
        name,
        phone,
        password
      });

      triggerCelebration();
      if (onAuthSuccess) {
        onAuthSuccess(newCustomer);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Handle Real Email Login
  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const email = (loginEmail || '').trim().toLowerCase();
    const password = (loginPassword || '').trim();

    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMsg(isKhmer ? 'សូមបញ្ចូល Email របស់អ្នក' : 'Please enter your registered email');
      return;
    }

    setIsLoading(true);

    try {
      const customer = loginCustomer(email, password);
      triggerCelebration();
      if (onAuthSuccess) {
        onAuthSuccess(customer);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || (isKhmer ? 'Email ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ' : 'Invalid email or password'));
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-Tap Sign In Helper for lensophara@gmail.com
  const handleOneTapLogin = (quickEmail, quickPass = 'password123') => {
    setLoginEmail(quickEmail);
    setLoginPassword(quickPass);
    setErrorMsg('');
    setSuccessNotice('');
    setIsLoading(true);

    try {
      const customer = loginCustomer(quickEmail, quickPass);
      triggerCelebration();
      if (onAuthSuccess) {
        onAuthSuccess(customer);
      }
      onClose();
    } catch (err) {
      // If not yet in demo customers, auto-register seamlessly
      const newCust = registerCustomer({
        email: quickEmail,
        name: 'Sophara Len',
        phone: '0969276538',
        password: quickPass
      });
      triggerCelebration();
      if (onAuthSuccess) {
        onAuthSuccess(newCust);
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/60 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-[440px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh] text-stone-900 dark:text-stone-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Brand Glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl" />

        {/* Modal Top Header */}
        <div className="relative px-5 pt-5 pb-3 flex items-center justify-between shrink-0 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 shadow-sm shrink-0">
              <Coffee className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-stone-900 dark:text-white tracking-tight leading-tight">
                {isKhmer ? 'គណនីអតិថិជន Aroma' : 'Aroma Customer Account'}
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Aroma Coffee Club • Phnom Penh
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Step Segmented Tab Bar: Step 1 Register vs Step 2 Login */}
        <div className="px-5 pt-3 shrink-0">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg('');
                setSuccessNotice('');
              }}
              className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ជំហានទី១: ចុះឈ្មោះ' : 'Step 1: Register'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
                setSuccessNotice('');
              }}
              className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ជំហានទី២: ចូលគណនី' : 'Step 2: Login'}</span>
            </button>
          </div>
        </div>

        {/* Member Perk Banner */}
        <div className="mx-5 mt-2.5 mb-1 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300 shrink-0">
          <Gift className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-[11px] leading-tight font-medium">
            {messagePrompt || (isKhmer 
              ? '🎁 ទទួលបាន ១០០ ពិន្ទុ & ត្រាកាហ្វេភ្លាមៗជាមួយ Real Email របស់អ្នក!' 
              : '🎁 Earn 100 welcome points & digital stamp with your Real Email!')}
          </span>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 text-stone-800 dark:text-stone-200 scrollbar-thin">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="text-[11px] leading-relaxed font-medium">{successNotice}</span>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STEP 1: REGISTRATION FORM (Real Email Account Creation)
          ════════════════════════════════════════════════════════════ */}
          {activeTab === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
              <div className="text-left space-y-0.5">
                <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-amber-600" />
                  <span>{isKhmer ? 'ជំហានទី១: បង្កើតគណនីថ្មី (Real Email)' : 'Step 1: Create Real Email Account'}</span>
                </span>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {isKhmer ? 'សូមបំពេញព័ត៌មានពិតប្រាកដដើម្បីទទួលពិន្ទុ និងការដឹកជញ្ជូន' : 'Enter your real details to earn points and order delivery'}
                </p>
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                  {isKhmer ? 'អាសយដ្ឋាន Email ពិតប្រាកដ *' : 'Real Email Address *'}
                </label>
                <div className="relative flex items-center rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition">
                  <Mail className="w-4 h-4 text-stone-400 ml-3 shrink-0" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. lensophara@gmail.com"
                    required
                    className="w-full bg-transparent px-2.5 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                  {isKhmer ? 'ឈ្មោះពេញ *' : 'Full Name *'}
                </label>
                <div className="relative flex items-center rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition">
                  <User className="w-4 h-4 text-stone-400 ml-3 shrink-0" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={isKhmer ? 'ឧ. Sophara Len' : 'e.g. Sophara Len'}
                    required
                    className="w-full bg-transparent px-2.5 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                  {isKhmer ? 'លេខទូរស័ព្ទ (សម្រាប់ដឹកជញ្ជូន) *' : 'Phone Number (for delivery) *'}
                </label>
                <div className="relative flex items-center rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition">
                  <Phone className="w-4 h-4 text-stone-400 ml-3 shrink-0" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="096 927 6538"
                    required
                    className="w-full bg-transparent px-2.5 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                  {isKhmer ? 'បង្កើតលេខសម្ងាត់ *' : 'Create Password *'}
                </label>
                <div className="relative flex items-center rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition">
                  <Lock className="w-4 h-4 text-stone-400 ml-3 shrink-0" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={4}
                    className="w-full bg-transparent px-2.5 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Registration Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-amber-950/20 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>{isKhmer ? 'កំពុងបង្កើតគណនី...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-stone-950" />
                    <span>{isKhmer ? 'ជំហានទី១: ចុះឈ្មោះ & ទទួល ១០០ ពិន្ទុ' : 'Step 1: Register & Get 100 Points'}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              {/* Switch to Step 2 Login */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg('');
                    setSuccessNotice('');
                  }}
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {isKhmer ? '👉 មានគណនីរួចហើយ? ទៅជំហានទី២: ចូលគណនី' : '👉 Already registered? Go to Step 2: Login'}
                </button>
              </div>
            </form>
          ) : (
            /* ═══════════════════════════════════════════════════════════
               STEP 2: LOGIN FORM (Real Email Sign In)
            ════════════════════════════════════════════════════════════ */
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="text-left space-y-0.5">
                <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                  <LogIn className="w-4 h-4 text-amber-600" />
                  <span>{isKhmer ? 'ជំហានទី២: ចូលគណនីអតិថិជន (Login)' : 'Step 2: Sign In with Real Email'}</span>
                </span>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {isKhmer ? 'បញ្ចូល Email និងលេខសម្ងាត់របស់អ្នកដើម្បីចូលគណនី' : 'Enter your email and password to sign in to your account'}
                </p>
              </div>

              {/* Quick One-Tap Account Chip */}
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-black text-[10px] flex items-center justify-center">
                    S
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs text-stone-900 dark:text-white leading-none">Sophara Len</p>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 font-mono mt-0.5">lensophara@gmail.com</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleOneTapLogin('lensophara@gmail.com', 'password123')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-[10px] transition cursor-pointer shadow-xs active:scale-95"
                >
                  1-Tap Login ⚡
                </button>
              </div>

              {/* Login Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                  {isKhmer ? 'Email របស់អ្នក *' : 'Your Email *'}
                </label>
                <div className="relative flex items-center rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition">
                  <Mail className="w-4 h-4 text-stone-400 ml-3 shrink-0" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. lensophara@gmail.com"
                    required
                    className="w-full bg-transparent px-2.5 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Login Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                    {isKhmer ? 'លេខសម្ងាត់ *' : 'Password *'}
                  </label>
                </div>
                <div className="relative flex items-center rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition">
                  <Lock className="w-4 h-4 text-stone-400 ml-3 shrink-0" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-transparent px-2.5 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-amber-950/20 active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>{isKhmer ? 'កំពុងចូល...' : 'Signing In...'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-stone-950" />
                    <span>{isKhmer ? 'ជំហានទី២: ចូលគណនី' : 'Step 2: Sign In'}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              {/* Switch to Step 1 Register */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg('');
                    setSuccessNotice('');
                  }}
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {isKhmer ? '👉 មិនទាន់មានគណនី? ទៅជំហានទី១: ចុះឈ្មោះ' : '👉 Don\'t have an account? Go to Step 1: Register'}
                </button>
              </div>
            </form>
          )}

          {/* Perks Summary Badge */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 space-y-0.5">
              <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>+100 Points</span>
              </span>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">Awarded on register</p>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 space-y-0.5">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                <Coffee className="w-3 h-3 text-emerald-500" />
                <span>Coffee Stamps</span>
              </span>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">Free cup at 10 stamps</p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 pb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>256-Bit SSL Encrypted • Real Email Authentication Only</span>
          </div>
        </div>
      </div>
    </div>
  );
};
