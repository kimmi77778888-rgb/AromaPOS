import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CheckCircle2, 
  AlertCircle,
  Receipt,
  Percent,
  Coins,
  Sparkles,
  Smartphone,
  Check,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Volume2,
  VolumeX,
  Search,
  Copy
} from 'lucide-react';

import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { soundService } from '../../services/soundService';
import { formatKhmerDisplayAnnouncement } from '../../utils/khmerCurrencyWords';

export const CheckoutModal = ({ isOpen, onClose }) => {
  const { 
    cartTotals, 
    processCheckout, 
    customerName, 
    orderType, 
    setDiscountPercent, 
    discountPercent,
    linkedCustomer,
    appliedPoints,
    setCheckoutModalState,
    activeShift,
    openShiftModal,
    showToast
  } = useApp();

  const { t, isKhmer, formatKHR } = useLanguage();

  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, CARD, KHQR
  const [cashTendered, setCashTendered] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalStatus, setTerminalStatus] = useState('READY'); // READY, PROCESSING, APPROVED
  const [isSoundOn, setIsSoundOn] = useState(soundService.isSoundEnabled());

  // Bakong KHQR Live Gateway State
  const [khqrData, setKhqrData] = useState(null);
  const [isKhqrLoading, setIsKhqrLoading] = useState(false);
  const [isKhqrPaid, setIsKhqrPaid] = useState(false);
  const [khqrPollCount, setKhqrPollCount] = useState(0);
  const [isCheckingManual, setIsCheckingManual] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyKhqr = () => {
    if (khqrData?.khqr) {
      navigator.clipboard.writeText(khqrData.khqr);
      setIsCopied(true);
      if (showToast) showToast('KHQR String copied to clipboard!', 'info');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const total = cartTotals.total;
  const numericTendered = parseFloat(cashTendered) || 0;

  // Real-Time Tendering Calculation
  const changeDue = Math.round((numericTendered - total) * 100) / 100;
  const isCashSufficient = paymentMethod !== 'CASH' || numericTendered >= total;

  const toggleSound = () => {
    const next = soundService.toggleSound();
    setIsSoundOn(next);
    if (showToast) {
      showToast(next ? 'POS Sound On' : 'POS Sound Muted', 'info');
    }
  };

  const handleTestSound = () => {
    const testAmount = total > 0 ? total : 3.50;
    soundService.testKhmerSound(testAmount, 'USD');
    const displayPhrase = formatKhmerDisplayAnnouncement(testAmount, 'USD');
    if (showToast) {
      showToast(isKhmer ? `🔊 ${displayPhrase} + Ka-Ching` : `🔊 Received $${testAmount.toFixed(2)} + Ka-Ching`, 'success');
    }
  };

  // Real-time KHQR generation and live NBC Bakong payment polling
  useEffect(() => {
    let pollInterval = null;
    let isCancelled = false;

    if (isOpen && (paymentMethod === 'KHQR' || paymentMethod === 'QR_CODE')) {
      setIsKhqrLoading(true);
      setIsKhqrPaid(false);
      setKhqrPollCount(0);
      setStatusMessage(null);

      const billNumber = 'ORD-' + Math.floor(1000 + Math.random() * 9000);

      api.generateBakongQr({ billNumber, amount: total, currency: 'USD' })
        .then((data) => {
          if (isCancelled) return;
          setIsKhqrLoading(false);
          if (data && data.success) {
            setKhqrData(data);
            if (setCheckoutModalState) {
              setCheckoutModalState({
                isOpen: true,
                paymentMethod: 'KHQR',
                amountPaid: total,
                khqrData: data
              });
            }

            // Start live verification polling against NBC Bakong API
            pollInterval = setInterval(async () => {
              if (isCancelled) return;
              setKhqrPollCount((prev) => prev + 1);
              try {
                const checkRes = await api.checkBakongPayment(data.md5);
                if (checkRes && checkRes.paid) {
                  clearInterval(pollInterval);
                  setIsKhqrPaid(true);
                  // Play authentic cash register chime and announce exact money amount in Khmer!
                  soundService.playKhmerPaymentSuccessSound({ paymentMethod: 'KHQR', amount: total, currency: 'USD' });
                  const displayNotice = formatKhmerDisplayAnnouncement(total, 'USD');
                  setStatusMessage({ type: 'success', text: isKhmer ? `✅ ${displayNotice} (NBC Bakong)` : `Payment Confirmed: $${total.toFixed(2)} USD by NBC Bakong Gateway!` });
                  // Automatically finalize checkout when paid!
                  setTimeout(() => {
                    handleCompleteOrder();
                  }, 1200);
                }
              } catch (e) {
                console.error('Polling error', e);
              }
            }, 2500);
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            setIsKhqrLoading(false);
            console.error('Error generating KHQR', err);
          }
        });
    } else {
      setKhqrData(null);
      setIsKhqrPaid(false);
      setStatusMessage(null);
    }

    return () => {
      isCancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isOpen, paymentMethod, total]);

  // Active Manual Payment Status Verification
  const handleCheckBakongStatus = async () => {
    if (!khqrData?.md5) {
      if (showToast) showToast('No active KHQR transaction to check', 'warning');
      return;
    }

    setIsCheckingManual(true);
    setStatusMessage({ type: 'info', text: 'Connecting to NBC Bakong Gateway to check payment status...' });

    try {
      const res = await api.checkBakongPayment(khqrData.md5);
      if (res && res.paid) {
        setIsKhqrPaid(true);
        soundService.playKhmerPaymentSuccessSound({ paymentMethod: 'KHQR', amount: total, currency: 'USD' });
        const displayNotice = formatKhmerDisplayAnnouncement(total, 'USD');
        setStatusMessage({ type: 'success', text: isKhmer ? `✅ ${displayNotice} (${res.fromAccountId || 'Bakong Wallet'})` : `Verified! Transaction received from ${res.fromAccountId || 'Bakong Wallet'}` });
        if (showToast) showToast(isKhmer ? `✅ ${displayNotice}` : `Payment Verified: $${total.toFixed(2)} USD via NBC Bakong!`, 'success');
        setTimeout(() => {
          handleCompleteOrder();
        }, 1200);
      } else {
        soundService.playBeepSound();
        const msg = res?.message || 'Transaction is still pending on Bakong network.';
        setStatusMessage({ type: 'pending', text: `Status: Pending (${msg})` });
        if (showToast) showToast('Pending: Customer transfer not yet detected.', 'info');
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Error querying gateway. Please check connection or verify manually.' });
    } finally {
      setIsCheckingManual(false);
    }
  };

  // Sync to dual-screen customer display
  useEffect(() => {
    if (setCheckoutModalState) {
      setCheckoutModalState({
        isOpen,
        paymentMethod,
        amountPaid: numericTendered,
        khqrData: (paymentMethod === 'KHQR' || paymentMethod === 'QR_CODE') ? khqrData : null
      });
    }
  }, [isOpen, paymentMethod, numericTendered, khqrData, setCheckoutModalState]);

  // Denomination buttons: $5, $10, $20, $50, $100 and Exact
  const denominationButtons = [5, 10, 20, 50, 100];

  const handleClose = () => {
    if (setCheckoutModalState) {
      setCheckoutModalState({ isOpen: false, paymentMethod: 'CASH', amountPaid: 0 });
    }
    onClose();
  };

  if (!isOpen) return null;

  const handleCompleteOrder = async () => {
    if (!activeShift) {
      if (showToast) {
        showToast(
          isKhmer 
            ? 'មិនអាចគិតប្រាក់បានទេ៖ សូមបើកហាង/វេនជាមុនសិន!' 
            : 'Cannot complete sale: Store is closed. Please open store first!',
          'error'
        );
      }
      if (openShiftModal) openShiftModal('OPEN');
      handleClose();
      return;
    }

    if (paymentMethod === 'CASH' && numericTendered < total) {
      return;
    }

    setIsProcessing(true);
    try {
      // Play real cash register chime sound and Khmer voice announcement!
      soundService.playKhmerPaymentSuccessSound({
        paymentMethod,
        amount: paymentMethod === 'CASH' ? numericTendered : total,
        currency: 'USD'
      });
      await processCheckout(
        paymentMethod,
        paymentMethod === 'CASH' ? numericTendered : total
      );
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateTerminalTap = () => {
    setTerminalStatus('PROCESSING');
    setTimeout(() => {
      setTerminalStatus('APPROVED');
      soundService.playKhmerPaymentSuccessSound({ paymentMethod: 'CARD', amount: total, currency: 'USD' });
      setTimeout(() => {
        handleCompleteOrder();
      }, 700);
    }, 900);
  };

  // Convert USD to Cambodian Riel (KHR) at official 4,100 KHR per USD rate
  const khrAmount = Math.round(total * 4100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-md">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                <span>Multi-Tender Payment Interface</span>
              </h3>
              <p className="text-xs text-stone-400">
                {orderType === 'DINE_IN' ? '🍽️ Dine-in Table' : '🥡 Takeaway Ticket'} • {customerName || 'Walk-in Guest'}
                {linkedCustomer && (
                  <span className="ml-1 text-amber-400 font-semibold">({linkedCustomer.tier})</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestSound}
              className="px-2.5 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400 hover:bg-amber-900/60 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title={isKhmer ? 'សាកល្បងសំឡេងប្រកាសចំនួនទឹកប្រាក់ខ្មែរ (Soundbox Announcement)' : 'Test Khmer Voice Amount Announcement (Soundbox)'}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">{isKhmer ? '🔊 សំឡេងទឹកប្រាក់' : '🔊 Khmer Amount'}</span>
            </button>
            <button
              type="button"
              onClick={toggleSound}
              className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
                isSoundOn
                  ? 'bg-stone-800 border-stone-700 text-amber-400 hover:text-amber-300'
                  : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
              }`}
              title={isSoundOn ? 'Sound Effects Enabled (Click to mute)' : 'Sound Muted (Click to enable)'}
            >
              {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Payable Total Card with Real-Time Discount & Loyalty Breakdown */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-950 to-stone-900 border border-amber-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
                  Amount Payable
                </span>
                <p className="text-xs text-stone-500 mt-0.5">
                  Subtotal: ${cartTotals.subtotal.toFixed(2)} • Tax (8%): ${cartTotals.tax.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
                  ${total.toFixed(2)}
                </span>
                <span className="text-xs text-stone-400 block font-mono">
                  ≈ ៛{khrAmount.toLocaleString()} KHR
                </span>
              </div>
            </div>

            {/* Loyalty points deduction display if applied */}
            {appliedPoints > 0 && (
              <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs text-amber-300 font-medium bg-amber-950/20 px-3 py-1.5 rounded-xl border border-amber-900/40">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Loyalty Points Redeemed ({appliedPoints} pts):</span>
                </span>
                <span className="font-mono font-bold text-amber-400">
                  -${(appliedPoints / 100).toFixed(2)}
                </span>
              </div>
            )}

            {/* In-Checkout Discount Picker */}
            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-2 text-xs">
              <span className="text-stone-400 flex items-center gap-1 font-semibold text-[11px]">
                <Percent className="w-3 h-3 text-amber-400" />
                <span>Quick Promo Discount:</span>
              </span>
              <div className="flex items-center gap-1">
                {[0, 10, 15, 20].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiscountPercent(d)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      discountPercent === d
                        ? 'bg-amber-600 text-stone-950 shadow-sm'
                        : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    {d === 0 ? 'None' : `${d}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">
              Select Multi-Tender Payment Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/40 font-bold shadow-md'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                }`}
              >
                <Banknote className="w-6 h-6 text-emerald-400" />
                <span className="text-xs">Physical Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('KHQR')}
                className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'KHQR' || paymentMethod === 'QR_CODE'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-300 ring-2 ring-rose-500/40 font-bold shadow-md'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                }`}
              >
                <QrCode className="w-6 h-6 text-rose-400" />
                <span className="text-xs">KHQR (Bakong)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'CARD'
                    ? 'bg-sky-950/40 border-sky-500 text-sky-300 ring-2 ring-sky-500/40 font-bold shadow-md'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                }`}
              >
                <CreditCard className="w-6 h-6 text-sky-400" />
                <span className="text-xs">Card / Terminal</span>
              </button>
            </div>
          </div>

          {/* CASH TENDERING VIEW */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-4 p-5 rounded-2xl bg-stone-950/80 border border-stone-800 animate-fade-in">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-stone-300">
                    Physical Cash Tendered ($)
                  </label>
                  <span className="text-[10px] text-amber-500 font-semibold">Live Change Calculation</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-lg">$</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={total.toFixed(2)}
                    className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-xl py-2.5 pl-9 pr-4 text-xl font-bold font-mono text-amber-400 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Quick Cash Presets: Exact, $5, $10, $20, $50, $100 */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                  Quick Denomination Buttons
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCashTendered(total.toFixed(2))}
                    className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition cursor-pointer"
                  >
                    Exact (${total.toFixed(2)})
                  </button>
                  {denominationButtons.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(amt.toString())}
                      className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-bold transition font-mono cursor-pointer"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Change Due Box */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  numericTendered >= total
                    ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-600/50 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Coins className="w-5 h-5" />
                  <div>
                    <span className="text-xs font-extrabold block">
                      {numericTendered >= total ? 'Change to Return to Guest:' : 'Cash Shortage:'}
                    </span>
                    <span className="text-[10px] opacity-75">
                      {numericTendered >= total
                        ? `Return $${changeDue.toFixed(2)} (or ៛${Math.round(changeDue * 4100).toLocaleString()} KHR)`
                        : `Needs $${Math.abs(changeDue).toFixed(2)} more to tender`}
                    </span>
                  </div>
                </div>
                <span className="text-2xl font-mono font-black">
                  {numericTendered >= total ? `$${changeDue.toFixed(2)}` : `-$${Math.abs(changeDue).toFixed(2)}`}
                </span>
              </div>
            </div>
          )}

          {/* KHQR VIEW: Clean & Modern Official NBC Bakong KHQR */}
          {(paymentMethod === 'KHQR' || paymentMethod === 'QR_CODE') && (
            <div className="p-6 rounded-3xl bg-stone-950/90 border border-stone-800 text-center space-y-4 animate-fade-in shadow-2xl">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  <span>National Bank of Cambodia (NBC) KHQR</span>
                </span>
                <span className="text-[10px] bg-rose-950/80 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-800/80 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{khqrData?.merchantId || 'sophara_len@bkrt'}</span>
                </span>
              </div>

              {isKhqrLoading ? (
                <div className="py-14 flex flex-col items-center justify-center space-y-3.5">
                  <div className="relative">
                    <div className="w-12 h-12 border-3 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
                    <QrCode className="w-5 h-5 text-rose-500 absolute inset-0 m-auto" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-200">
                      Generating Official KHQR Payload...
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Establishing handshake with https://api-bakong.nbc.gov.kh
                    </p>
                  </div>
                </div>
              ) : khqrData ? (
                <>
                  {/* Clean & Modern Official KHQR Card */}
                  <div className="w-64 sm:w-72 mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-red-600 transition-all hover:shadow-red-600/15">
                    {/* Official Crimson KHQR Header */}
                    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 px-4 py-2.5 flex items-center justify-between text-white shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black tracking-widest uppercase font-sans drop-shadow-sm">
                          KHQR
                        </span>
                        <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          CAMBODIA
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider block truncate max-w-[130px]">
                          {khqrData.merchantName || 'COFFEE POS'}
                        </span>
                        <span className="text-[8px] opacity-80 block">
                          Phnom Penh • NBC
                        </span>
                      </div>
                    </div>

                    {/* QR Code Canvas with Modern Corner Target Brackets & Laser Scan Sweep */}
                    <div className="p-4 bg-white flex flex-col items-center justify-center relative">
                      <div className="relative p-2 bg-stone-50 rounded-2xl border border-stone-200/80 shadow-inner group">
                        {/* 4 Camera Focus Brackets */}
                        <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-red-600 rounded-tl-sm pointer-events-none"></div>
                        <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-red-600 rounded-tr-sm pointer-events-none"></div>
                        <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-red-600 rounded-bl-sm pointer-events-none"></div>
                        <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-red-600 rounded-br-sm pointer-events-none"></div>

                        {/* Animated Laser Sweep Line */}
                        <div className="animate-laser"></div>

                        <img
                          src={khqrData.qrImageUrl}
                          alt="Dynamic NBC Bakong KHQR"
                          className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl select-none"
                        />
                      </div>

                      {/* Dynamic Price Display: Dual Currency USD & KHR */}
                      <div className="mt-3 text-center w-full space-y-0.5">
                        <span className="text-xl font-black text-stone-900 font-mono tracking-tight block">
                          ${Number(khqrData.amount).toFixed(2)} USD
                        </span>
                        <span className="text-xs font-extrabold text-red-600 font-mono block">
                          ≈ ៛{Math.round(khqrData.amount * 4100).toLocaleString()} KHR
                        </span>
                        <div className="flex items-center justify-center gap-1.5 text-[9px] text-stone-500 font-mono pt-1">
                          <span>Bill: {khqrData.billNumber}</span>
                          <span>•</span>
                          <span title={khqrData.md5}>MD5: {khqrData.md5 ? khqrData.md5.substring(0, 8) + '...' : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Accepted Cambodian Banks Footer */}
                    <div className="bg-stone-50 py-1.5 px-2 text-center border-t border-stone-200">
                      <p className="text-[8px] font-bold text-stone-700 tracking-wider">
                        BAKONG • ABA PAY • ACLEDA • WING • CANADIA • CHIP MONG
                      </p>
                    </div>
                  </div>

                  {/* Real-Time Live Status Banner */}
                  {isKhqrPaid ? (
                    <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 animate-bounce flex items-center justify-center gap-2.5 shadow-lg">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-extrabold">
                        {isKhmer ? `✅ ${formatKhmerDisplayAnnouncement(total, 'USD')}! កំពុងបញ្ចប់ការបញ្ជាទិញ...` : `Payment Confirmed: $${total.toFixed(2)} USD! Finalizing order...`}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-w-md mx-auto">
                      <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <span className="text-stone-300 font-medium text-left">
                            Listening for live customer transfer via Bakong...
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 font-mono bg-stone-950 px-2 py-0.5 rounded-lg border border-stone-800">
                          Auto-Poll #{khqrPollCount}
                        </span>
                      </div>

                      {/* Live Feedback Card */}
                      {statusMessage && (
                        <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition animate-fade-in ${
                          statusMessage.type === 'success'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80'
                            : statusMessage.type === 'pending'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                            : statusMessage.type === 'error'
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                            : 'bg-stone-900 text-stone-300 border border-stone-800'
                        }`}>
                          <span>{statusMessage.text}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clean Modern Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {/* Active Manual Status Check */}
                    <button
                      type="button"
                      disabled={isCheckingManual || isKhqrPaid}
                      onClick={handleCheckBakongStatus}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 rounded-xl text-xs font-extrabold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Directly ping NBC Bakong API to verify transaction MD5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingManual ? 'animate-spin' : ''}`} />
                      <span>{isCheckingManual ? 'Querying Bakong...' : '⚡ Check Status Now'}</span>
                    </button>

                    {khqrData.deeplink && (
                      <a
                        href={khqrData.deeplink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        title="Open deep link in official Bakong Mobile App"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                        <span>Open in Bakong</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={handleCopyKhqr}
                      className="px-3 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-stone-100 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      title="Copy EMVCo KHQR String for testing"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                      <span>{isCopied ? 'Copied!' : 'Copy KHQR'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundService.playCashRegisterSound();
                        handleCompleteOrder();
                      }}
                      className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      title="Manual Cashier Settle"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Approve & Settle</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 text-xs text-rose-400 bg-rose-950/40 rounded-xl border border-rose-800">
                  Failed to load Bakong QR code. Please check internet connection.
                </div>
              )}
            </div>
          )}

          {/* CARD / TERMINAL VIEW: Push Total to Connected Card Reader */}
          {paymentMethod === 'CARD' && (
            <div className="p-6 rounded-2xl bg-stone-950/80 border border-stone-800 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-950/60 border border-sky-800/60 flex items-center justify-center text-sky-400 shadow-lg">
                <CreditCard className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-stone-200">
                  {terminalStatus === 'READY'
                    ? 'Total Pushed to PAX A920 Terminal'
                    : terminalStatus === 'PROCESSING'
                    ? 'Reading Smart Chip / Contactless...'
                    : 'Payment Authorized & Settled!'}
                </h4>
                <p className="text-xs text-stone-400 mt-1 font-mono">
                  Amount: <strong className="text-sky-400 text-sm">${total.toFixed(2)}</strong> (Terminal #01)
                </p>
              </div>

              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs text-stone-400 max-w-xs mx-auto">
                <div className="flex justify-between py-1">
                  <span>Terminal State:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online & Ready
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Accepted:</span>
                  <span className="text-stone-200">Visa, Mastercard, UnionPay</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulateTerminalTap}
                disabled={terminalStatus === 'PROCESSING' || isProcessing}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 mx-auto cursor-pointer disabled:opacity-50"
              >
                {terminalStatus === 'PROCESSING' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Simulate Guest Card Tap / Chip Insert</span>
              </button>
            </div>
          )}

          {/* Loyalty Score Notice */}
          {linkedCustomer && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center justify-between text-xs">
              <span className="text-stone-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Loyalty Award on Completion:</span>
              </span>
              <span className="text-amber-400 font-mono font-bold">
                +{cartTotals.earnedPoints} Points to {linkedCustomer.name}
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-stone-800 bg-stone-950/90 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-stone-700 text-stone-300 hover:bg-stone-800 font-semibold text-xs transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCompleteOrder}
            disabled={isProcessing || !isCashSufficient}
            className="flex-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs shadow-lg shadow-amber-950/50 transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Syncing Inventory & Dispatching Ticket...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Settle Order (${total.toFixed(2)})</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
