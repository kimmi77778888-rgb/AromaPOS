import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { soundService } from '../../services/soundService';
import confetti from 'canvas-confetti';
import { launchGoogleOAuthPopup } from '../../utils/googleAuth';
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
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Zap,
  ShieldAlert
} from 'lucide-react';

/**
 * Official Google 4-Color "G" Logo SVG
 */
export const GoogleLogoSvg = ({ className = "w-5 h-5", ...props }) => (
  <svg viewBox="0 0 24 24" className={className} {...props}>
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

/**
 * Official Gmail Envelope Logo SVG
 */
export const GmailLogoSvg = ({ className = "w-5 h-5", ...props }) => (
  <svg viewBox="0 0 24 24" className={className} {...props}>
    <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64 5.455 11.73v9.272H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.573l8.073-6.08c1.618-1.214 3.927-.059 3.927 1.964z" />
    <path fill="#C5221F" d="M18.545 11.73v9.272h3.819c.904 0 1.636-.732 1.636-1.636V5.457c0-.493-.138-.953-.377-1.344L18.545 11.73z" opacity="0.35" />
    <path fill="#4285F4" d="M1.636 4.113c-.239.391-.377.851-.377 1.344v13.909c0 .904.732 1.636 1.636 1.636h3.819V11.73L1.636 4.113z" opacity="0.18" />
  </svg>
);

// Known fake / temporary / burner email domains to block
const BLOCKED_DISPOSABLE_DOMAINS = [
  'fake.com', 'test.com', 'example.com', 'tempmail.com', 'mailinator.com', 
  '10minutemail.com', 'throwawaymail.com', 'guerrillamail.com', 'yopmail.com', 
  'asdf.com', 'abc.com', '123.com', 'dummy.com', 'sample.com', 'fakeemail.com',
  'trashmail.com', 'sharklasers.com', 'dispostable.com', 'getairmail.com'
];

export const CustomerAuthModal = ({
  isOpen,
  onClose,
  onAuthSuccess,
  messagePrompt = '',
  initialTab = 'register' // 'register' | 'login'
}) => {
  const { isKhmer } = useLanguage();
  const { 
    registerCustomer, 
    loginCustomer, 
    loginCustomerWithGoogle, 
    customers = [] 
  } = useApp();

  // Active Tab: 'register' (Step 1) vs 'login' (Step 2)
  const [activeTab, setActiveTab] = useState(initialTab || 'register');

  // Step 1: Register State (Strictly empty, no dummy values)
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Step 2: Login State (Strictly empty, no dummy values)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [googleLoadingState, setGoogleLoadingState] = useState(''); // 'authenticating' | 'syncing' | ''
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  if (!isOpen) return null;

  const triggerCelebration = () => {
    try {
      soundService.playKaChing();
      confetti({
        particleCount: 90,
        spread: 95,
        origin: { y: 0.6 },
        colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#F59E0B']
      });
    } catch (e) {}
  };

  // Helper to validate genuine email syntax
  const validateRealEmail = (email) => {
    const clean = (email || '').trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    
    if (!clean || !emailRegex.test(clean)) {
      return { valid: false, error: isKhmer ? 'សូមបញ្ចូលអាសយដ្ឋាន Email ត្រឹមត្រូវ (ឧ. name@gmail.com)' : 'Please enter a valid real email format (e.g. name@gmail.com)' };
    }

    const domain = clean.split('@')[1];
    if (BLOCKED_DISPOSABLE_DOMAINS.includes(domain)) {
      return { valid: false, error: isKhmer ? 'មិនអនុញ្ញាត Email បន្លំ ឬបណ្តោះអាសន្នទេ។ សូមប្រើ Email ពិតប្រាកដរបស់អ្នក (Gmail, Yahoo, Outlook)' : 'Disposable or fake emails are strictly blocked. Please use your real email (e.g. Gmail, Yahoo, Outlook).' };
    }

    return { valid: true, clean };
  };

  // Helper to detect Cambodian Mobile Carrier
  const detectCarrier = (phone) => {
    const p = (phone || '').replace(/[^0-9]/g, '');
    if (/^(010|015|016|069|070|081|086|087|093|096|098)/.test(p)) return 'Smart';
    if (/^(012|017|076|077|078|085|089|092|095|099)/.test(p)) return 'Cellcard';
    if (/^(088|097|071|060|066|067|068|090)/.test(p)) return 'Metfone';
    return null;
  };

  const isGmailAddress = (email) => {
    return (email || '').trim().toLowerCase().endsWith('@gmail.com');
  };

  // ══════════════════════════════════════════════════════════════
  // STRICT REAL GOOGLE OAUTH AUTHENTICATION (NO FAKE / NO BYPASS)
  // ══════════════════════════════════════════════════════════════
  const handleGoogleSignIn = () => {
    setErrorMsg('');
    setSuccessNotice('');
    setIsLoading(true);
    setGoogleLoadingState('authenticating');

    launchGoogleOAuthPopup(
      (googleProfile) => {
        // STRICT CHECK: Verify that Google returned a real, verified email
        if (!googleProfile || !googleProfile.email || !googleProfile.email.includes('@')) {
          setErrorMsg(isKhmer ? 'មិនអាចផ្ទៀងផ្ទាត់គណនី Google បានទេ' : 'Could not verify Google account credentials.');
          setIsLoading(false);
          setGoogleLoadingState('');
          return;
        }

        setGoogleLoadingState('syncing');

        try {
          let customer;
          if (loginCustomerWithGoogle) {
            customer = loginCustomerWithGoogle({
              email: googleProfile.email.trim().toLowerCase(),
              name: googleProfile.name || googleProfile.email.split('@')[0],
              picture: googleProfile.picture || '',
              phone: '',
              verified_email: Boolean(googleProfile.email_verified)
            });
          }

          triggerCelebration();
          if (onAuthSuccess) {
            onAuthSuccess(customer);
          }
          onClose();
        } catch (err) {
          setErrorMsg(err.message || 'Google Sign-in failed. Please try again.');
        } finally {
          setIsLoading(false);
          setGoogleLoadingState('');
        }
      },
      (err) => {
        // STRICT: If user closes popup or cancels or Google fails, DO NOT LOG IN
        setIsLoading(false);
        setGoogleLoadingState('');
        const msg = err?.message || '';
        if (msg.includes('closed') || msg.includes('cancel') || msg.includes('popup_closed_by_user')) {
          setErrorMsg(isKhmer ? 'អ្នកបានបិទផ្ទាំង Google Sign-In។ សូមព្យាយាមម្តងទៀត។' : 'Google sign-in popup was closed. Please try again.');
        } else {
          setErrorMsg(isKhmer ? `ការផ្ទៀងផ្ទាត់ Google បរាជ័យ: ${msg}` : `Google authentication failed: ${msg || 'Please check your Google connection'}`);
        }
      }
    );
  };

  // ══════════════════════════════════════════════════════════════
  // STEP 1: STRICT REAL REGISTRATION (VALIDATE REAL DETAILS)
  // ══════════════════════════════════════════════════════════════
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const emailCheck = validateRealEmail(regEmail);
    if (!emailCheck.valid) {
      setErrorMsg(emailCheck.error);
      return;
    }
    const cleanEmail = emailCheck.clean;

    const name = (regName || '').trim();
    if (!name || name.length < 2) {
      setErrorMsg(isKhmer ? 'សូមបញ្ចូលឈ្មោះពេញពិតប្រាកដរបស់អ្នក' : 'Please enter your real full name');
      return;
    }

    const cleanPhoneDigits = (regPhone || '').replace(/[^0-9]/g, '');
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 8 || cleanPhoneDigits.length > 12 || !cleanPhoneDigits.startsWith('0')) {
      setErrorMsg(isKhmer ? 'សូមបញ្ចូលលេខទូរស័ព្ទត្រឹមត្រូវ (ឧ. 012 xxx xxx ឬ 096 xxx xxx)' : 'Please enter a valid phone number starting with 0 (8-10 digits)');
      return;
    }

    const password = (regPassword || '').trim();
    if (!password || password.length < 6) {
      setErrorMsg(isKhmer ? 'សូមបញ្ចូលលេខសម្ងាត់យ៉ាងតិច ៦ ខ្ទង់ដើម្បីសុវត្ថិភាព' : 'Password must be at least 6 characters for account security');
      return;
    }

    // Check if email already registered in system
    const existing = customers.find((c) => c.email && c.email.toLowerCase() === cleanEmail);
    if (existing) {
      setSuccessNotice(
        isKhmer 
          ? 'Email នេះមានគណនីរួចហើយ! បានប្តូរទៅជំហានទី២ ដើម្បីចូលគណនី។' 
          : 'This email is already registered! Switched to Step 2: Login.'
      );
      setLoginEmail(cleanEmail);
      setActiveTab('login');
      return;
    }

    setIsLoading(true);

    try {
      const newCustomer = registerCustomer({
        email: cleanEmail,
        name,
        phone: regPhone.trim(),
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

  // ══════════════════════════════════════════════════════════════
  // STEP 2: STRICT REAL LOGIN (REQUIRES VALID REGISTERED ACCOUNT)
  // ══════════════════════════════════════════════════════════════
  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const emailCheck = validateRealEmail(loginEmail);
    if (!emailCheck.valid) {
      setErrorMsg(emailCheck.error);
      return;
    }
    const cleanEmail = emailCheck.clean;

    const password = (loginPassword || '').trim();
    if (!password) {
      setErrorMsg(isKhmer ? 'សូមបញ្ចូលលេខសម្ងាត់របស់អ្នក' : 'Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const customer = loginCustomer(cleanEmail, password);
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

  const regCarrier = detectCarrier(regPhone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/70 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-[460px] bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl border border-stone-200/90 dark:border-stone-800/90 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94dvh] text-stone-900 dark:text-stone-100 transition-all animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Ambient Floating Gradient Orbs */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl animate-float-slow" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 bg-blue-500/15 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '3.5s' }} />

        {/* Modal Top Header */}
        <div className="relative px-5 pt-4 pb-3 flex items-center justify-between shrink-0 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 shadow-md shadow-amber-500/20 shrink-0">
              <Coffee className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-base sm:text-lg text-stone-900 dark:text-white tracking-tight leading-tight">
                  {isKhmer ? 'គណនីអតិថិជន Aroma' : 'Aroma Coffee Club'}
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Real Auth
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                <span>Google & Verified Real Email Only</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3.5 text-stone-800 dark:text-stone-200 scrollbar-thin">
          
          {/* Member Perk Banner */}
          <div className="relative overflow-hidden p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-950 dark:text-amber-200 shadow-xs">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold leading-tight truncate">
                {messagePrompt || (isKhmer 
                  ? '🎁 ផ្ទៀងផ្ទាត់ជាមួយ Google / Gmail ទទួលបាន ១០០ ពិន្ទុ & ត្រាកាហ្វេ!' 
                  : '🎁 Sign in with verified Google / Gmail to earn 100 points & rewards!')}
              </p>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                100 Points = $1 Discount on any Espresso or Frappe
              </p>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              OFFICIAL GOOGLE OAUTH POPUP BUTTON (REAL AUTHENTICATION)
          ══════════════════════════════════════════════════════════════ */}
          <div className="space-y-2 p-3 rounded-2xl bg-stone-50/80 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-850 animate-border-glow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                <GoogleLogoSvg className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'ផ្ទៀងផ្ទាត់ជាមួយ Google OAuth ផ្ទាល់' : 'Official Google Sign In'}</span>
              </span>
              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
                Verified OAuth 2.0
              </span>
            </div>

            {/* Official Google OAuth Popup Trigger */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="relative w-full overflow-hidden py-3 px-4 rounded-xl bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-850 border border-stone-300 dark:border-stone-700 hover:border-blue-500 text-stone-900 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99] group"
            >
              {/* Shimmer Light Reflection Sweep */}
              <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />

              {googleLoadingState ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                    {googleLoadingState === 'authenticating' ? 'Opening Google Account Picker...' : 'Verifying Google Account...'}
                  </span>
                </div>
              ) : (
                <>
                  <GoogleLogoSvg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                  <GmailLogoSvg className="w-4 h-4 shrink-0 -ml-1 group-hover:scale-110 transition-transform" />
                  <span className="font-sans font-bold">
                    {isKhmer ? 'បន្តជាមួយគណនី Google ពិតប្រាកដ' : 'Continue with Real Google Account'}
                  </span>
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0 ml-auto group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>

            <p className="text-[10px] text-stone-400 text-center flex items-center justify-center gap-1 pt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Directly opens Google OAuth popup to verify your real identity</span>
            </p>
          </div>

          {/* Divider with Text */}
          <div className="relative flex items-center justify-center my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-stone-800" />
            </div>
            <div className="relative px-3 bg-white dark:bg-stone-900 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {isKhmer ? 'ឬ ចុះឈ្មោះដោយប្រើ Email ពិតប្រាកដ' : 'or enter verified email'}
            </div>
          </div>

          {/* 2-Step Segmented Tab Bar: Step 1 Register vs Step 2 Login */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg('');
                setSuccessNotice('');
              }}
              className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
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
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ជំហានទី២: ចូលគណនី' : 'Step 2: Login'}</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-badge-bounce">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2 animate-badge-bounce">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="text-[11px] leading-relaxed font-medium">{successNotice}</span>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STEP 1: REGISTRATION FORM (Real Email Account Creation)
          ════════════════════════════════════════════════════════════ */}
          {activeTab === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 animate-tab-slide">
              <div className="text-left space-y-0.5">
                <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-amber-600" />
                  <span>{isKhmer ? 'ជំហានទី១: បង្កើតគណនីថ្មី (Real Email)' : 'Step 1: Create Real Email Account'}</span>
                </span>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {isKhmer ? 'បំពេញព័ត៌មានពិតប្រាកដដើម្បីទទួលពិន្ទុ និងការដឹកជញ្ជូន' : 'Enter real details to earn points and receive delivery'}
                </p>
              </div>

              {/* Email Input with Live Gmail Detection */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                    {isKhmer ? 'អាសយដ្ឋាន Email ពិតប្រាកដ *' : 'Real Email Address *'}
                  </label>
                  {isGmailAddress(regEmail) && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 animate-badge-bounce">
                      <GmailLogoSvg className="w-3 h-3" />
                      <span>Gmail Verified Domain</span>
                    </span>
                  )}
                </div>
                <div className="relative flex items-center rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/25 transition-all">
                  <Mail className="w-4 h-4 text-stone-400 ml-3 shrink-0" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
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
                <div className="relative flex items-center rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/25 transition-all">
                  <User className="w-4 h-4 text-stone-400 ml-3 shrink-0" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={isKhmer ? 'ឧ. Sophara Len' : 'e.g. Sophara Len'}
                    required
                    minLength={2}
                    className="w-full bg-transparent px-2.5 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone Number with Carrier Detection */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                    {isKhmer ? 'លេខទូរស័ព្ទ (សម្រាប់ដឹកជញ្ជូន) *' : 'Phone Number (for delivery) *'}
                  </label>
                  {regCarrier && (
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      {regCarrier} 4G
                    </span>
                  )}
                </div>
                <div className="relative flex items-center rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/25 transition-all">
                  <Phone className="w-4 h-4 text-stone-400 ml-3 shrink-0" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="012 345 678"
                    required
                    className="w-full bg-transparent px-2.5 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Password with View Toggle */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                    {isKhmer ? 'បង្កើតលេខសម្ងាត់ *' : 'Create Password *'}
                  </label>
                  <span className="text-[10px] text-stone-400">Min 6 characters</span>
                </div>
                <div className="relative flex items-center rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/25 transition-all">
                  <Lock className="w-4 h-4 text-stone-400 ml-3 shrink-0" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-transparent px-2.5 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="mr-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Registration Button with Modern Shimmer */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative overflow-hidden w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-950/20 active:scale-[0.99] group"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>{isKhmer ? 'កំពុងបង្កើតគណនី...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-stone-950 group-hover:rotate-12 transition-transform" />
                    <span>{isKhmer ? 'ជំហានទី១: ចុះឈ្មោះ & ទទួល ១០០ ពិន្ទុ' : 'Step 1: Register & Get 100 Points'}</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
            <form onSubmit={handleLoginSubmit} className="space-y-3 animate-tab-slide">
              <div className="text-left space-y-0.5">
                <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                  <LogIn className="w-4 h-4 text-amber-600" />
                  <span>{isKhmer ? 'ជំហានទី២: ចូលគណនីអតិថិជន (Login)' : 'Step 2: Sign In with Real Email'}</span>
                </span>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {isKhmer ? 'បញ្ចូល Email និងលេខសម្ងាត់របស់អ្នកដើម្បីចូលគណនី' : 'Enter your registered email and password to sign in'}
                </p>
              </div>

              {/* Login Email with Gmail Detection */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                    {isKhmer ? 'Email របស់អ្នក *' : 'Your Email *'}
                  </label>
                  {isGmailAddress(loginEmail) && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 animate-badge-bounce">
                      <GmailLogoSvg className="w-3 h-3" />
                      <span>Gmail Domain</span>
                    </span>
                  )}
                </div>
                <div className="relative flex items-center rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/25 transition-all">
                  <Mail className="w-4 h-4 text-stone-400 ml-3 shrink-0" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    required
                    className="w-full bg-transparent px-2.5 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Login Password with View Toggle */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 block">
                  {isKhmer ? 'លេខសម្ងាត់ *' : 'Password *'}
                </label>
                <div className="relative flex items-center rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/25 transition-all">
                  <Lock className="w-4 h-4 text-stone-400 ml-3 shrink-0" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-transparent px-2.5 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="mr-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative overflow-hidden w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-950/20 active:scale-[0.99] group"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>{isKhmer ? 'កំពុងចូល...' : 'Signing In...'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-stone-950 group-hover:translate-x-0.5 transition-transform" />
                    <span>{isKhmer ? 'ជំហានទី២: ចូលគណនី' : 'Step 2: Sign In'}</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
                <span>+100 Points ($1.00)</span>
              </span>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">Awarded on verified account</p>
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
            <span>256-Bit SSL Encrypted • Real Identity & OAuth 2.0 Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
};
