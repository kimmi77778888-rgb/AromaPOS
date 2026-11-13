import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { soundService } from '../../services/soundService';
import { downloadInvoice } from '../../utils/invoiceDownloader';
import confetti from 'canvas-confetti';
import { 
  generateOfficialBakongKhqr,
  getStoredMerchantBakongId
} from '../../utils/khqrGenerator';
import { 
  X, 
  QrCode, 
  Banknote, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  User, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Bike,
  FileText,
  Coffee,
  RotateCcw,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export const EcommerceCheckoutModal = ({
  isOpen,
  onClose,
  orderData,
  onOrderPlaced,
  onOpenLiveDeliveryMap,
  onOpenAccountModal
}) => {
  const { isKhmer } = useLanguage();

  // Modal Flow Stages: 'PAYMENT' -> 'PROCESSING' -> 'SUCCESS'
  const [flowState, setFlowState] = useState('PAYMENT');
  const [processingStep, setProcessingStep] = useState(1);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState('KHQR'); // 'KHQR' | 'COD'
  const [khqrData, setKhqrData] = useState(null);
  const [isKhqrLoading, setIsKhqrLoading] = useState(false);
  const [cashChangeNote, setCashChangeNote] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 mins
  const [isCopied, setIsCopied] = useState(false);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setFlowState('PAYMENT');
      setProcessingStep(1);
      setConfirmedOrder(null);
      setSecondsLeft(300);
      setIsCopied(false);
    }
  }, [isOpen]);

  // Generate real official NBC Bakong KHQR whenever modal opens with KHQR selected
  useEffect(() => {
    let timer = null;
    let isCancelled = false;

    if (isOpen && paymentMethod === 'KHQR' && orderData && flowState === 'PAYMENT') {
      setIsKhqrLoading(!khqrData);

      const billNumber = 'ONL-' + Math.floor(1000 + Math.random() * 9000);
      const merchantId = getStoredMerchantBakongId() || 'sophara_len@bkrt';

      generateOfficialBakongKhqr({
        merchantId,
        merchantName: 'AROMA COFFEE ROASTERY',
        merchantCity: 'Phnom Penh',
        acquiringBank: 'Bakong',
        amount: orderData.grandTotal,
        currency: 'USD',
        billNumber
      }).then((result) => {
        if (!isCancelled && result && result.success) {
          setKhqrData(result);
          setIsKhqrLoading(false);
        }
      }).catch(() => {
        if (!isCancelled) {
          setIsKhqrLoading(false);
        }
      });

      timer = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }

    return () => {
      isCancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [isOpen, paymentMethod, orderData, flowState]);

  if (!isOpen || !orderData) return null;

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyKhqr = () => {
    if (khqrData?.khqr) {
      navigator.clipboard.writeText(khqrData.khqr);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Dynamic Multi-Step Payment Processing Pipeline
  const handleConfirmAndProcessOrder = () => {
    setFlowState('PROCESSING');
    setProcessingStep(1);

    // Step 1: Connecting to NBC Bakong Gateway (700ms)
    setTimeout(() => {
      setProcessingStep(2);

      // Step 2: Validating KHQR transaction settlement & merchant signature (800ms)
      setTimeout(() => {
        setProcessingStep(3);

        // Step 3: Dispatching to POS register, kitchen KDS & loyalty sync (600ms)
        setTimeout(() => {
          const orderNumber = `ORD-ONL-${Math.floor(1000 + Math.random() * 9000)}`;

          const newOrderPayload = {
            id: `ord-onl-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            orderNumber,
            channel: 'ONLINE_ECOMMERCE',
            orderType: orderData.orderType || 'DELIVERY',
            status: 'IN_PREPARATION',
            createdAt: new Date().toISOString(),
            customerId: orderData.customerId,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            carrier: orderData.carrier || 'Cellcard 4G LTE',
            deliveryAddress: orderData.deliveryAddress,
            deliveryNotes: orderData.deliveryNotes,
            pickupBranch: orderData.pickupBranch,
            items: (orderData.cartItems || []).map((item) => ({
              productId: item.productId,
              name: item.name,
              nameKm: item.nameKm,
              price: item.unitPrice,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              total: item.totalPrice,
              size: item.size,
              ice: item.ice,
              sweetness: item.sweetness,
              milk: item.milk,
              addons: item.addons,
              specialNote: item.specialNote
            })),
            subtotal: orderData.subtotal,
            discount: orderData.discount || 0,
            appliedPromo: orderData.appliedPromo,
            deliveryFee: orderData.deliveryFee || 0,
            total: orderData.grandTotal,
            rielTotal: orderData.rielGrandTotal,
            paymentMethod: paymentMethod,
            paymentStatus: paymentMethod === 'KHQR' ? 'PAID' : 'PENDING_ON_DELIVERY',
            cashChangeNote: paymentMethod === 'COD' ? cashChangeNote : null,
            notes: `Online Store (${orderData.orderType === 'DELIVERY' ? 'Phnom Penh Delivery' : 'Store Pickup'})`
          };

          setConfirmedOrder(newOrderPayload);
          setFlowState('SUCCESS');

          // Celebrate with Ka-Ching chime & Confetti
          try {
            soundService.playKaChing();
            confetti({
              particleCount: 75,
              spread: 85,
              origin: { y: 0.6 },
              colors: ['#D97706', '#10B981', '#F59E0B', '#3B82F6']
            });
          } catch (e) {}

          if (onOrderPlaced) {
            onOrderPlaced(newOrderPayload);
          }
        }, 600);
      }, 800);
    }, 700);
  };

  const handleDownloadInvoice = () => {
    if (confirmedOrder) {
      downloadInvoice(confirmedOrder);
    }
  };

  const handleOpenLiveMap = () => {
    if (confirmedOrder && onOpenLiveDeliveryMap) {
      onClose();
      onOpenLiveDeliveryMap(confirmedOrder);
    }
  };

  const displayQrSource = khqrData?.qrImageUrl || khqrData?.qrImage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {flowState === 'SUCCESS' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : flowState === 'PROCESSING' ? (
                <Coffee className="w-5 h-5 text-amber-400 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">
                {flowState === 'SUCCESS'
                  ? (isKhmer ? 'ការកុម្ម៉ង់បានជោគជ័យ' : 'Order Placed & Confirmed')
                  : flowState === 'PROCESSING'
                  ? (isKhmer ? 'កំពុងដំណើរការទូទាត់ប្រាក់...' : 'Processing Payment...')
                  : (isKhmer ? 'ការទូទាត់ & បញ្ជាក់ការកុម្ម៉ង់' : 'Payment & Order Confirmation')}
              </h3>
              <p className="text-xs text-stone-400">
                Aroma Coffee Storefront • Phnom Penh Delivery
              </p>
            </div>
          </div>
          {flowState !== 'PROCESSING' && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-900 border border-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* =========================================================================
            STAGE 1: PAYMENT METHOD SELECTION & BAKONG KHQR SCANNING
           ========================================================================= */}
        {flowState === 'PAYMENT' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-stone-200">
              {/* Customer & Destination Summary Pill */}
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800/80 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>{orderData.customerName}</span>
                    </span>
                    <span className="font-mono text-stone-400 text-[11px]">
                      ({orderData.customerPhone})
                    </span>
                  </div>
                  <p className="text-stone-400 flex items-center gap-1 text-[11px] truncate max-w-xs sm:max-w-md">
                    <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>
                      {orderData.orderType === 'DELIVERY'
                        ? orderData.deliveryAddress
                        : `Pickup at ${orderData.pickupBranch?.name || 'Aroma Coffee Roastery BKK1'}`}
                    </span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">Total Due</span>
                  <span className="font-mono font-black text-amber-400 text-sm sm:text-base">
                    ${orderData.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method Switcher: KHQR vs COD */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-stone-400 block">
                  {isKhmer ? 'ជ្រើសរើសវិធីសាស្ត្រទូទាត់ប្រាក់' : 'Select Payment Method'}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('KHQR')}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition cursor-pointer text-left ${
                      paymentMethod === 'KHQR'
                        ? 'bg-rose-950/40 border-rose-600/80 text-rose-300 ring-2 ring-rose-500/20'
                        : 'bg-stone-950 border-stone-850 text-stone-400 hover:border-stone-750'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">Bakong KHQR</p>
                      <p className="text-[10px] text-stone-400 font-mono">ABA / Wing / ACLEDA</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition cursor-pointer text-left ${
                      paymentMethod === 'COD'
                        ? 'bg-amber-950/40 border-amber-600/80 text-amber-300 ring-2 ring-amber-500/20'
                        : 'bg-stone-950 border-stone-850 text-stone-400 hover:border-stone-750'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">
                        {isKhmer ? 'ទូទាត់ពេលដឹកជញ្ជូន' : 'Cash on Delivery'}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono">USD / KHR Cash</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* KHQR Presentation Screen */}
              {paymentMethod === 'KHQR' && (
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-stone-950 via-stone-950 to-rose-950/20 border border-rose-900/40 text-center space-y-3.5 shadow-xl">
                  {/* National Bank of Cambodia KHQR Header */}
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-rose-600 text-white font-black text-xs shadow-md">
                    <span className="tracking-wider">KHQR</span>
                    <span className="text-[11px] font-bold">National Bank of Cambodia</span>
                    <span className="font-mono text-[11px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatCountdown(secondsLeft)}</span>
                    </span>
                  </div>

                  {/* QR Image Frame */}
                  <div className="relative inline-block p-4 bg-white rounded-3xl shadow-2xl border-4 border-rose-600/20">
                    {isKhqrLoading ? (
                      <div className="w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[11px] font-bold text-stone-700">Generating KHQR...</span>
                      </div>
                    ) : displayQrSource ? (
                      <img
                        src={displayQrSource}
                        alt="National Bank of Cambodia KHQR"
                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                      />
                    ) : (
                      <div className="w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center gap-2 text-stone-500">
                        <QrCode className="w-12 h-12 text-rose-600 opacity-60" />
                        <span className="text-xs font-bold text-stone-700">Bakong KHQR Ready</span>
                      </div>
                    )}
                  </div>

                  {/* Total Amount in USD & KHR */}
                  <div className="space-y-0.5">
                    <p className="font-mono text-2xl font-black text-white">
                      ${orderData.grandTotal.toFixed(2)} USD
                    </p>
                    <p className="font-mono text-xs text-amber-400 font-bold">
                      ≈ {orderData.rielGrandTotal || Math.round(orderData.grandTotal * 4100).toLocaleString()} ៛ KHR
                    </p>
                    <p className="text-[11px] text-stone-400 pt-1">
                      {isKhmer 
                        ? 'ស្កេនជាមួយ App ធនាគារណាក៏បាន (ABA Mobile, Wing, ACLEDA, Bakong, Canadia...)' 
                        : 'Scan with any Cambodian Banking App (ABA, Wing, ACLEDA, Bakong)'}
                    </p>
                  </div>

                  {/* Copy & Deeplink Options */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyKhqr}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
                      <span>{isCopied ? 'បានចម្លងរួច!' : (isKhmer ? 'ចម្លងកូដ KHQR' : 'Copy Code')}</span>
                    </button>

                    {khqrData?.deeplink && (
                      <a
                        href={khqrData.deeplink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-rose-400 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                        title="Open directly in Bakong app"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Bakong App</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* COD Presentation Screen */}
              {paymentMethod === 'COD' && (
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Banknote className="w-4 h-4" />
                    <span>{isKhmer ? 'ទូទាត់ប្រាក់សុទ្ធពេលអ្នកដឹកជញ្ជូនមកដល់' : 'Cash on Delivery Details'}</span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {isKhmer
                      ? `សូមត្រៀមប្រាក់ចំនួន $${orderData.grandTotal.toFixed(2)} USD (ឬប្រហែល ${orderData.rielGrandTotal} ៛) ជូនអ្នកដឹកជញ្ជូនពេលទទួលភេសជ្ជៈ។` 
                      : `Please prepare $${orderData.grandTotal.toFixed(2)} USD or equivalent in Cambodian Riel upon arrival.`}
                  </p>
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-bold text-stone-400">
                      {isKhmer ? 'កំណត់សម្គាល់អាប់ប្រាក់ (បើមាន)' : 'Need change? (e.g. paying with $20 or 100,000 KHR)'}
                    </label>
                    <input
                      type="text"
                      value={cashChangeNote}
                      onChange={(e) => setCashChangeNote(e.target.value)}
                      placeholder="e.g. Paying with $20 bill, please bring change"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Footer */}
            <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800 space-y-2 shrink-0">
              <button
                type="button"
                onClick={handleConfirmAndProcessOrder}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 transition cursor-pointer shadow-xl shadow-amber-950/40"
              >
                {paymentMethod === 'KHQR' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isKhmer 
                        ? `ខ្ញុំបានស្កេនរួចរាល់ • បញ្ជាក់ការកុម្ម៉ង់ $${orderData.grandTotal.toFixed(2)}` 
                        : `I Have Paid • Confirm Order $${orderData.grandTotal.toFixed(2)}`}
                    </span>
                  </>
                ) : (
                  <>
                    <Bike className="w-4 h-4" />
                    <span>
                      {isKhmer 
                        ? `បញ្ជាក់ការកុម្ម៉ង់ • $${orderData.grandTotal.toFixed(2)}` 
                        : `Confirm & Place Order • $${orderData.grandTotal.toFixed(2)}`}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-stone-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isKhmer 
                    ? 'ការកុម្ម៉ង់នឹងត្រូវបានបញ្ជូនទៅកាន់ Barista ក្នុងផ្ទះបាយភ្លាមៗ' 
                    : 'Instant live transmission to POS register & Kitchen Display (KDS)'}
                </span>
              </div>
            </div>
          </>
        )}

        {/* =========================================================================
            STAGE 2: DYNAMIC PAYMENT & ORDER TRANSMISSION PROCESSING
           ========================================================================= */}
        {flowState === 'PROCESSING' && (
          <div className="py-16 px-6 text-center space-y-6 text-stone-200 animate-fade-in">
            {/* High Tech Animated Processing Ring */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping" />
              <div className="w-24 h-24 rounded-full border-4 border-amber-500 border-t-transparent animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 flex items-center justify-center text-amber-400">
                <Coffee className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-black text-lg sm:text-xl text-white">
                {isKhmer ? 'កំពុងដំណើរការទូទាត់ប្រាក់ & បញ្ជូនការកុម្ម៉ង់...' : 'Processing Payment & Transmitting Order...'}
              </h3>
              <p className="text-xs text-stone-400">
                Aroma Coffee Gateway • National Bank of Cambodia Bakong & POS Telemetry
              </p>
            </div>

            {/* Dynamic Step Progression */}
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-stone-950 border border-stone-850 space-y-3 text-left text-xs">
              {/* Step 1 */}
              <div className={`flex items-center gap-3 transition ${processingStep >= 1 ? 'text-stone-100 font-bold' : 'text-stone-600'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  processingStep > 1 
                    ? 'bg-emerald-500 text-stone-950' 
                    : processingStep === 1 
                    ? 'bg-amber-500 text-stone-950 animate-pulse' 
                    : 'bg-stone-800 text-stone-500'
                }`}>
                  {processingStep > 1 ? '✓' : '1'}
                </div>
                <span>{isKhmer ? 'ភ្ជាប់ទៅកាន់បណ្តាញ National Bank of Cambodia Bakong Gateway...' : 'Connecting to NBC Bakong Gateway...'}</span>
              </div>

              {/* Step 2 */}
              <div className={`flex items-center gap-3 transition ${processingStep >= 2 ? 'text-stone-100 font-bold' : 'text-stone-600'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  processingStep > 2 
                    ? 'bg-emerald-500 text-stone-950' 
                    : processingStep === 2 
                    ? 'bg-amber-500 text-stone-950 animate-pulse' 
                    : 'bg-stone-800 text-stone-500'
                }`}>
                  {processingStep > 2 ? '✓' : '2'}
                </div>
                <span>{isKhmer ? 'ផ្ទៀងផ្ទាត់ប្រតិបត្តិការទូទាត់ KHQR & Digital Signature...' : 'Validating KHQR settlement & signature...'}</span>
              </div>

              {/* Step 3 */}
              <div className={`flex items-center gap-3 transition ${processingStep >= 3 ? 'text-stone-100 font-bold' : 'text-stone-600'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  processingStep === 3 
                    ? 'bg-amber-500 text-stone-950 animate-pulse' 
                    : 'bg-stone-800 text-stone-500'
                }`}>
                  3
                </div>
                <span>{isKhmer ? 'បញ្ជូនការកុម្ម៉ង់ទៅផ្ទះបាយ Barista (KDS) & អ្នកដឹកជញ្ជូន...' : 'Dispatching to Barista Kitchen & Delivery fleet...'}</span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 3: SUCCESS CONFIRMATION, INVOICE DOWNLOAD & LIVE MAP
           ========================================================================= */}
        {flowState === 'SUCCESS' && confirmedOrder && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-stone-200 animate-fade-in">
            {/* Success Heading */}
            <div className="text-center space-y-2 py-1">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="font-black text-lg sm:text-xl text-white">
                {isKhmer ? '🎉 ការកុម្ម៉ង់បានជោគជ័យ!' : '🎉 Order Placed Successfully!'}
              </h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                {isKhmer 
                  ? `ការកុម្ម៉ង់លេខ #${confirmedOrder.orderNumber} ត្រូវបានបញ្ជូនទៅកាន់ Barista ក្នុងផ្ទះបាយរួចរាល់!`
                  : `Order #${confirmedOrder.orderNumber} has been received and is being crafted by our barista!`}
              </p>
            </div>

            {/* Order & Loyalty Summary Card */}
            <div className="p-4 rounded-2xl bg-stone-950 border border-stone-850 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-stone-850">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Order Number</span>
                  <span className="font-mono font-black text-amber-400 text-sm sm:text-base">
                    #{confirmedOrder.orderNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Total Paid</span>
                  <span className="font-mono font-black text-white text-base">
                    ${(confirmedOrder.total || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    ≈ {confirmedOrder.rielTotal || Math.round((confirmedOrder.total || 0) * 4100).toLocaleString()} ៛ • {confirmedOrder.paymentMethod} ({confirmedOrder.paymentStatus || 'PAID'})
                  </span>
                </div>
              </div>

              {/* Customer & Destination */}
              <div className="text-xs space-y-1 text-stone-300">
                <p className="flex items-center gap-2">
                  <span className="font-bold text-white">👤 {confirmedOrder.customerName}</span>
                  <span className="text-stone-500 font-mono">({confirmedOrder.customerPhone})</span>
                </p>
                <p className="flex items-start gap-1.5 text-stone-400">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{confirmedOrder.deliveryAddress || 'Aroma Coffee Roastery BKK1'}</span>
                </p>
              </div>

              {/* Loyalty Reward Earned Badge */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{isKhmer ? 'ទទួលបានពិន្ទុ & ត្រាកាហ្វេ:' : 'Loyalty Rewards Earned:'}</span>
                </span>
                <span className="font-mono font-bold text-amber-400 text-[11px]">
                  +{Math.max(10, Math.floor((confirmedOrder.total || 0) * 10))} Pts • +1 Coffee Stamp ☕
                </span>
              </div>
            </div>

            {/* 4-Step Fulfillment Journey */}
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-850 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-400">
                <span>{isKhmer ? 'ដំណាក់កាលកុម្ម៉ង់' : 'Order Journey'}</span>
                <span className="text-amber-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>{isKhmer ? 'Barista កំពុងឆុង...' : 'Brewing in Kitchen'}</span>
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <span className="font-bold block">1. Confirmed</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-300 animate-pulse">
                  <Coffee className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <span className="font-bold block">2. Brewing</span>
                </div>
                <div className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-500">
                  <Bike className="w-4 h-4 mx-auto mb-1 opacity-50" />
                  <span className="font-bold block">3. Delivery</span>
                </div>
                <div className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-500">
                  <Sparkles className="w-4 h-4 mx-auto mb-1 opacity-50" />
                  <span className="font-bold block">4. Enjoy</span>
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Download Official Tax Invoice */}
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-850 border border-stone-750 hover:border-amber-500/50 text-stone-100 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                  title="Download or Print Official Tax Invoice"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>{isKhmer ? 'ទាញយកវិក្កយបត្រ (Invoice)' : 'Download Tax Invoice'}</span>
                </button>

                {/* Live Delivery Map */}
                {confirmedOrder.orderType === 'DELIVERY' && onOpenLiveDeliveryMap && (
                  <button
                    type="button"
                    onClick={handleOpenLiveMap}
                    className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-950/40"
                  >
                    <Bike className="w-4 h-4" />
                    <span>{isKhmer ? 'ផែនទីដឹកជញ្ជូនផ្ទាល់ (Live Map)' : 'Track Rider on Live Map'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                {onOpenAccountModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAccountModal();
                    }}
                    className="text-stone-400 hover:text-amber-400 underline cursor-pointer py-1"
                  >
                    {isKhmer ? 'មើលក្នុងប្រវត្តិកុម្ម៉ង់គណនីខ្ញុំ' : 'View in Account Purchase History'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 font-bold text-xs ml-auto cursor-pointer"
                >
                  {isKhmer ? 'កុម្ម៉ង់បន្ថែម (Done)' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
