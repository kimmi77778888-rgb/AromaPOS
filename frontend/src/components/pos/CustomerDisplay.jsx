'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { StoreLogo } from '../common/StoreLogo';
import { storage } from '../../utils/storage';
import { 
  Coffee, 
  Sparkles, 
  QrCode, 
  CheckCircle2, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  Clock, 
  Calendar,
  X,
  ExternalLink,
  Flame,
  Award,
  Maximize2
} from 'lucide-react';

export const CustomerDisplay = ({ standalone = false, onClose = null }) => {
  const { t, language, setLanguage, isKhmer, formatUSD, formatKHR } = useLanguage();

  const [displayState, setDisplayState] = useState(() => {
    try {
      const saved = storage.getItem('aroma_customer_state');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for BroadcastChannel synchronization from cashier terminal
  useEffect(() => {
    try {
      document.documentElement.classList.remove('mode-black-white');
    } catch (e) {}

    const bc = new BroadcastChannel('aroma_customer_channel');
    bc.onmessage = (event) => {
      if (event.data?.type === 'SYNC_STATE' && event.data.payload) {
        setDisplayState(event.data.payload);
      }
    };

    // Also listen to storage events if broadcast channel fails
    const handleStorage = (e) => {
      if (e.key === 'aroma_customer_state' && e.newValue) {
        try {
          setDisplayState(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const cart = displayState?.cart || [];
  const cartTotals = displayState?.cartTotals || { subtotal: 0, discountAmount: 0, tax: 0, total: 0, itemCount: 0 };
  const checkoutState = displayState?.checkoutState || { isOpen: false, paymentMethod: 'CASH', amountPaid: 0 };
  const customerName = displayState?.customerName || '';
  const orderType = displayState?.orderType || 'DINE_IN';

  const isCompleted = displayState?.orderCompleted;
  const completedOrder = displayState?.completedOrder;

  return (
    <div className={`flex flex-col bg-stone-950 text-stone-100 font-sans select-none overflow-hidden ${
      standalone ? 'min-h-screen w-screen' : 'w-full h-full'
    }`}>
      {/* Top Customer Branding Bar */}
      <header className="px-6 py-4 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3.5">
          <StoreLogo size="lg" customStore={displayState?.storeInfo} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-stone-100">
                {isKhmer 
                  ? (displayState?.storeInfo?.nameKhmer || displayState?.storeInfo?.name || 'អាហ្រូម៉ា កាហ្វេ') 
                  : (displayState?.storeInfo?.name || 'Aroma Craft Coffee')}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {isKhmer ? 'អេក្រង់អតិថិជន' : 'Customer Display'}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              {isKhmer 
                ? (displayState?.storeInfo?.taglineKhmer || 'កាហ្វេឈ្ងុយឆ្ងាញ់ • ផលិតដោយក្តីស្រលាញ់') 
                : (displayState?.storeInfo?.tagline || 'Artisan Roastery & Espresso Bar')}
            </p>
          </div>
        </div>

        {/* Live Clock & Language Pill */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-mono font-bold text-stone-300">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[10px] text-stone-500">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Clean Theme Switcher (Black / White) */}
          <ThemeSwitcher size="sm" variant="pill" />

          {/* Bilingual Language Selector with Clean SVG Flags */}
          <LanguageSwitcher />

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Screen Body: Dual Columns */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Live Cart Items (or Welcome Showcase if empty) */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-stone-800/80 bg-stone-950/60 overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-3.5 bg-stone-900/40 border-b border-stone-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-200">
                {t('live_ticket')}
              </h2>
              {cart.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono">
                  {cartTotals.itemCount} {isKhmer ? 'មុខ' : 'items'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span className="font-semibold text-stone-300">
                {orderType === 'TAKEAWAY' ? t('takeaway') : t('dine_in')}
              </span>
              {customerName && customerName !== 'Walk-in Guest' && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-medium">VIP: {customerName}</span>
                </>
              )}
            </div>
          </div>

          {/* Cart Item List or Idle Showcase */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {cart.length === 0 ? (
              /* Idle / Welcome Screensaver */
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="relative">
                  <div className="w-28 h-28 rounded-3xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xl">
                    <Coffee className="w-14 h-14 animate-pulse" />
                  </div>
                  <Sparkles className="w-6 h-6 text-amber-400 absolute -top-2 -right-2 animate-bounce" />
                </div>

                <div className="max-w-md space-y-2">
                  <h3 className="text-2xl font-extrabold text-stone-100">
                    {t('welcome_to')} {isKhmer ? 'អាហ្រូម៉ា កាហ្វេ' : 'Aroma Craft Coffee'}
                  </h3>
                  <p className="text-sm text-stone-400 leading-relaxed">
                    {isKhmer 
                      ? 'សូមស្វាគមន៍! អ្នកឆុងកាហ្វេរបស់យើងនឹងទទួលការបញ្ជាទិញរបស់លោកអ្នកបន្តិចទៀតនេះ។' 
                      : 'Handcrafted espresso, artisan pour overs, and fresh baked pastries crafted fresh for you.'}
                  </p>
                </div>

                {/* Promotional Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg pt-4">
                  <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 text-left flex items-start gap-3">
                    <Flame className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-200">
                        {isKhmer ? 'កាហ្វេតម្រងពិសេស' : 'Single-Origin Reserve'}
                      </h4>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {isKhmer ? 'គ្រាប់កាហ្វេ Ethiopian Guji ឈ្ងុយផ្កាម្លិះ' : 'Ethiopian Guji with jasmine & wild citrus notes'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 text-left flex items-start gap-3">
                    <QrCode className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-200">
                        {isKhmer ? 'ទទួលស្កេន KHQR' : 'Bakong KHQR Accepted'}
                      </h4>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {isKhmer ? 'ទូទាត់រហ័សជាមួយគ្រប់កម្មវិធីធនាគារ' : 'Instant payments with ABA, Wing, Acleda & all banks'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Live Order Items */
              cart.map((item) => {
                const displayName = isKhmer && item.product.nameKm ? item.product.nameKm : item.product.name;
                const subtotal = item.unitPrice * item.quantity;
                return (
                  <div
                    key={item.cartItemId}
                    className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800/80 flex items-center justify-between gap-4 transition hover:border-stone-700 animate-slide-up"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover ring-1 ring-amber-500/20 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-stone-100 truncate">
                          {displayName}
                        </h4>
                        
                        {/* Customization Details */}
                        {item.modifierLabels && item.modifierLabels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.modifierLabels.map((mod, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-amber-400/90 font-medium"
                              >
                                {mod}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <p className="text-[11px] text-stone-400 italic mt-0.5 truncate">
                            &ldquo;{item.notes}&rdquo;
                          </p>
                        )}

                        <div className="text-xs text-stone-400 mt-1">
                          <span className="font-mono text-stone-300 font-bold">${item.unitPrice.toFixed(2)}</span>
                          <span className="mx-1.5 text-stone-600">&times;</span>
                          <span className="font-bold text-amber-400 font-mono">{item.quantity}</span>
                        </div>
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold text-amber-400 font-mono block">
                        ${subtotal.toFixed(2)}
                      </span>
                      <span className="text-xs font-mono text-stone-500 block">
                        {formatKHR(subtotal)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Financial Summary & Dynamic Payment Screen */}
        <div className="w-full lg:w-[460px] bg-stone-900/50 flex flex-col justify-between shrink-0">
          {/* Top Payment / KHQR / Status State */}
          <div className="p-6 flex-1 flex flex-col justify-center">
            {checkoutState.isOpen && checkoutState.paymentMethod === 'KHQR' ? (
              /* Bakong KHQR Payment State */
              <div className="p-6 rounded-3xl bg-stone-950/90 border border-amber-500/30 flex flex-col items-center text-center space-y-4 shadow-2xl animate-fade-in">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold">
                  <QrCode className="w-4 h-4" />
                  <span>Bakong KHQR</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-stone-100">
                    {t('scan_to_pay')}
                  </h3>
                  <p className="text-xs text-stone-400 max-w-xs">
                    {t('open_banking_app')}
                  </p>
                </div>

                {/* Clean & Modern Official KHQR Code Ticket */}
                <div className="w-64 bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-red-600 transition-all">
                  <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 px-4 py-2 flex items-center justify-between text-white">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black tracking-widest uppercase font-sans">
                        KHQR
                      </span>
                      <span className="text-[8px] bg-white/20 px-1 py-0.5 rounded font-bold uppercase">
                        CAMBODIA
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider truncate max-w-[120px]">
                      {checkoutState?.khqrData?.merchantName || 'COFFEE POS'}
                    </span>
                  </div>
                  <div className="p-4 bg-white flex flex-col items-center justify-center relative">
                    <div className="relative p-2 bg-stone-50 rounded-2xl border border-stone-200/80 shadow-inner">
                      {/* 4 Camera Focus Brackets */}
                      <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-red-600 rounded-tl-sm pointer-events-none"></div>
                      <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-red-600 rounded-tr-sm pointer-events-none"></div>
                      <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-red-600 rounded-bl-sm pointer-events-none"></div>
                      <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-red-600 rounded-br-sm pointer-events-none"></div>

                      {/* Animated Laser Sweep Line */}
                      <div className="animate-laser"></div>

                      <img
                        src={checkoutState?.khqrData?.qrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020101021229440010bakong@nbc0116sophara_len@bkrt0206Bakong5204581453038405404${cartTotals.total.toFixed(2)}5802KH5910COFFEE POS6010Phnom Penh6304`}
                        alt="Bakong KHQR"
                        className="w-48 h-48 object-contain rounded-xl select-none"
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-[9px] font-black tracking-widest text-red-600 block">
                        KHQR • NATIONAL BANK OF CAMBODIA
                      </span>
                      <span className="text-[10px] font-mono text-stone-600 block font-semibold">
                        {checkoutState?.khqrData?.merchantId || 'sophara_len@bkrt'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-stone-50 py-1.5 text-center border-t border-stone-200">
                    <span className="text-[8px] font-bold text-stone-700 tracking-wider">
                      BAKONG • ABA PAY • ACLEDA • WING • CANADIA
                    </span>
                  </div>
                </div>

                {/* Price Due in USD and KHR */}
                <div className="text-center pt-1">
                  <span className="text-2xl font-black text-amber-400 font-mono block">
                    ${cartTotals.total.toFixed(2)} USD
                  </span>
                  <span className="text-base font-bold text-stone-400 font-mono">
                    &asymp; {formatKHR(cartTotals.total)}
                  </span>
                </div>

                {checkoutState?.khqrData?.deeplink && (
                  <a
                    href={checkoutState.khqrData.deeplink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 rounded-xl text-xs font-bold transition shadow-sm mt-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                    <span>{isKhmer ? 'ចុចដើម្បីទូទាត់តាម Bakong App' : 'Tap to Pay with Bakong App'}</span>
                  </a>
                )}
              </div>
            ) : checkoutState.isOpen && checkoutState.paymentMethod === 'CASH' ? (
              /* Cash Payment State */
              <div className="p-6 rounded-3xl bg-stone-950/90 border border-emerald-500/30 flex flex-col items-center text-center space-y-4 shadow-2xl animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Banknote className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-stone-100">
                    {t('cash')}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    {isKhmer ? 'បេឡាធិការកំពុងទទួល និងរាប់សាច់ប្រាក់' : 'Cashier is tendering cash payment'}
                  </p>
                </div>

                {/* Amount Received & Change Due */}
                {checkoutState.amountPaid > 0 && (
                  <div className="w-full grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                      <span className="text-[11px] text-stone-400 block mb-1">{t('amount_paid')}</span>
                      <span className="text-base font-extrabold text-stone-200 font-mono">
                        ${Number(checkoutState.amountPaid).toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                      <span className="text-[11px] text-emerald-400 block mb-1">{t('change_due')}</span>
                      <span className="text-base font-extrabold text-emerald-400 font-mono">
                        ${Math.max(0, checkoutState.amountPaid - cartTotals.total).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-emerald-500/80 block mt-0.5">
                        {formatKHR(Math.max(0, checkoutState.amountPaid - cartTotals.total))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : isCompleted ? (
              /* Order Completed Celebration */
              <div className="p-6 rounded-3xl bg-stone-950/90 border border-amber-500/40 flex flex-col items-center text-center space-y-4 shadow-2xl animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-stone-100">
                    {t('thank_you_title')}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1 max-w-xs">
                    {t('thank_you_desc')}
                  </p>
                </div>
                {completedOrder && (
                  <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 w-full">
                    <span className="text-xs text-stone-400 block">{t('order_number')}</span>
                    <span className="text-lg font-black text-amber-400 font-mono">
                      {completedOrder.orderNumber}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Normal Idle Banner */
              <div className="p-6 rounded-3xl bg-stone-950/70 border border-stone-800/80 flex flex-col items-center text-center space-y-3">
                <Coffee className="w-8 h-8 text-amber-500" />
                <h4 className="text-sm font-bold text-stone-200">
                  {isKhmer ? 'សូមពិនិត្យមើលបញ្ជីមុខទំនិញរបស់អ្នក' : 'Please Review Your Order'}
                </h4>
                <p className="text-xs text-stone-400">
                  {isKhmer 
                    ? 'រាល់ការកែប្រែកម្រិតស្ករ ទឹកកក និងទំហំនឹងបង្ហាញផ្ទាល់នៅលើអេក្រង់នេះ' 
                    : 'All drink customizations and totals are mirrored live on this screen.'}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Financial Breakdown & Total */}
          <div className="p-6 bg-stone-950 border-t border-stone-800 space-y-3 shrink-0">
            <div className="space-y-1.5 text-xs text-stone-400">
              <div className="flex justify-between">
                <span>{t('subtotal')}</span>
                <span className="font-mono text-stone-200">${cartTotals.subtotal.toFixed(2)}</span>
              </div>
              {cartTotals.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>{t('discount')}</span>
                  <span className="font-mono">-${cartTotals.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t('tax')}</span>
                <span className="font-mono text-stone-200">${cartTotals.tax.toFixed(2)}</span>
              </div>
            </div>

            {/* Glowing Grand Total (USD and KHR) */}
            <div className="pt-3 border-t border-stone-800 flex items-end justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
                  {t('grand_total')}
                </span>
                <span className="text-lg font-bold text-amber-500/90 font-mono block">
                  {formatKHR(cartTotals.total)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black text-amber-400 font-mono tracking-tight block">
                  ${cartTotals.total.toFixed(2)}
                </span>
                <span className="text-[10px] text-stone-500 font-mono block">
                  USD CURRENCY
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
