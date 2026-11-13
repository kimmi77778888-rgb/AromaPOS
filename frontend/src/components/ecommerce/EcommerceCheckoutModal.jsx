import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { soundService } from '../../services/soundService';
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
  Check
} from 'lucide-react';

export const EcommerceCheckoutModal = ({
  isOpen,
  onClose,
  orderData,
  onOrderPlaced
}) => {
  const { isKhmer } = useLanguage();

  const [paymentMethod, setPaymentMethod] = useState('KHQR'); // 'KHQR' | 'COD' | 'CARD'
  const [khqrData, setKhqrData] = useState(null);
  const [isKhqrLoading, setIsKhqrLoading] = useState(false);
  const [isKhqrPaid, setIsKhqrPaid] = useState(false);
  const [cashChangeNote, setCashChangeNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 mins
  const [isCopied, setIsCopied] = useState(false);

  // Generate KHQR when modal opens or method changes to KHQR
  useEffect(() => {
    let timer = null;
    if (isOpen && paymentMethod === 'KHQR' && orderData) {
      setIsKhqrLoading(true);
      setIsKhqrPaid(false);
      setSecondsLeft(300);

      const billNumber = 'ONL-' + Math.floor(1000 + Math.random() * 9000);
      api.generateBakongQr({
        billNumber,
        amount: orderData.grandTotal,
        currency: 'USD'
      }).then((res) => {
        setIsKhqrLoading(false);
        if (res && res.success) {
          setKhqrData(res);
        } else {
          // Fallback mock KHQR if offline
          setKhqrData({
            success: true,
            qrImage: null,
            md5: 'mock-md5-' + Date.now(),
            billNumber
          });
        }
      }).catch(() => {
        setIsKhqrLoading(false);
        setKhqrData({
          success: true,
          qrImage: null,
          md5: 'mock-md5-' + Date.now(),
          billNumber
        });
      });

      timer = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, paymentMethod, orderData]);

  if (!isOpen || !orderData) return null;

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSimulateKhqrPaid = () => {
    setIsKhqrPaid(true);
    soundService.testKhmerSound(orderData.grandTotal, 'USD');
  };

  const handleCopyKhqr = () => {
    if (khqrData?.khqr) {
      navigator.clipboard.writeText(khqrData.khqr);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSubmitOrder = () => {
    setIsSubmitting(true);

    const orderNumber = `ORD-ONL-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrderPayload = {
      id: `ord-onl-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      orderNumber,
      channel: 'ONLINE_ECOMMERCE',
      orderType: orderData.orderType, // 'DELIVERY' | 'PICKUP'
      status: 'IN_PREPARATION', // Immediately moves to KDS
      createdAt: new Date().toISOString(),
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      carrier: orderData.carrier,
      deliveryAddress: orderData.deliveryAddress,
      deliveryNotes: orderData.deliveryNotes,
      pickupBranch: orderData.pickupBranch,
      items: orderData.cartItems.map((item) => ({
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
      discount: orderData.discount,
      appliedPromo: orderData.appliedPromo,
      deliveryFee: orderData.deliveryFee,
      total: orderData.grandTotal,
      rielTotal: orderData.rielGrandTotal,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'KHQR' ? 'PAID' : 'PENDING_ON_DELIVERY',
      cashChangeNote: paymentMethod === 'COD' ? cashChangeNote : null,
      notes: `Online Store (${orderData.orderType === 'DELIVERY' ? 'Phnom Penh Delivery' : 'Store Pickup'})`
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onOrderPlaced(newOrderPayload);
    }, 600);
  };

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
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">
                {isKhmer ? 'ការទូទាត់ប្រាក់ & បញ្ជាក់ការកុម្ម៉ង់' : 'Payment & Order Confirmation'}
              </h3>
              <p className="text-xs text-stone-400">
                Aroma Coffee Storefront • {orderData.orderType === 'DELIVERY' ? 'Phnom Penh Delivery' : 'Store Pickup'}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-stone-200">
          {/* Order Snapshot Card */}
          <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-850 flex items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-stone-100 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>{orderData.customerName}</span>
                <span className="text-stone-400 font-normal">({orderData.customerPhone})</span>
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5 truncate max-w-xs">
                {orderData.orderType === 'DELIVERY' 
                  ? `📍 ${orderData.deliveryAddress}` 
                  : `🛍️ Pickup at ${orderData.pickupBranch?.name}`}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Due</span>
              <span className="font-mono text-base font-black text-amber-400">${orderData.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-stone-300">
              {isKhmer ? 'ជ្រើសរើសវិធីសាស្ត្រទូទាត់' : 'Select Payment Method'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('KHQR')}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  paymentMethod === 'KHQR'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-200 shadow-md shadow-rose-950/30'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold block">Bakong KHQR</span>
                <span className="text-[9px] opacity-75 font-mono">ABA / Wing / ACLEDA</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  paymentMethod === 'COD'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-950/30'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold block">{isKhmer ? 'សាច់ប្រាក់' : 'Cash on Delivery'}</span>
                <span className="text-[9px] opacity-75 font-mono">USD / KHR Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  paymentMethod === 'CARD'
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/30'
                    : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold block">{isKhmer ? 'កាតធនាគារ' : 'Card'}</span>
                <span className="text-[9px] opacity-75 font-mono">Visa / Mastercard</span>
              </button>
            </div>
          </div>

          {/* Method 1: Bakong KHQR Screen */}
          {paymentMethod === 'KHQR' && (
            <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-center space-y-3.5">
              {/* Bakong Official Red Header */}
              <div className="bg-gradient-to-r from-rose-700 to-rose-600 rounded-xl py-2 px-4 text-white flex items-center justify-between shadow-sm">
                <span className="font-black text-sm tracking-widest font-mono">KHQR</span>
                <span className="text-[11px] font-bold opacity-90">National Bank of Cambodia</span>
                <div className="flex items-center gap-1 font-mono text-[11px] bg-black/20 px-2 py-0.5 rounded">
                  <Clock className="w-3 h-3" />
                  <span>{formatCountdown(secondsLeft)}</span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mx-auto relative">
                {isKhqrLoading ? (
                  <div className="w-48 h-48 flex flex-col items-center justify-center text-stone-900">
                    <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-xs font-bold">Generating Bakong QR...</span>
                  </div>
                ) : khqrData?.qrImage ? (
                  <img
                    src={khqrData.qrImage}
                    alt="Bakong KHQR"
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 bg-stone-50 border-2 border-stone-300 rounded-xl flex flex-col items-center justify-center p-3 text-stone-900">
                    <QrCode className="w-24 h-24 text-stone-900 mb-1" />
                    <span className="text-[10px] font-mono font-bold text-rose-700">BAKONG KHQR CODE</span>
                    <span className="text-[9px] text-stone-500 font-mono">Aroma Coffee Roastery</span>
                  </div>
                )}

                {isKhqrPaid && (
                  <div className="absolute inset-0 bg-emerald-600/90 rounded-2xl flex flex-col items-center justify-center text-white backdrop-blur-xs animate-fade-in">
                    <CheckCircle2 className="w-12 h-12 mb-1" />
                    <span className="font-black text-sm uppercase tracking-wider">Payment Verified!</span>
                    <span className="text-[10px] opacity-90 font-mono">Bakong Instant Settlement</span>
                  </div>
                )}
              </div>

              {/* Amount Display */}
              <div>
                <p className="text-xl font-mono font-black text-white">
                  ${orderData.grandTotal.toFixed(2)} USD
                </p>
                <p className="text-xs text-amber-400 font-mono font-bold">
                  ≈ {orderData.rielGrandTotal} ៛ KHR
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  {isKhmer 
                    ? 'ស្កេនជាមួយ App ធនាគារណាក៏បាន (ABA, Wing, ACLEDA, Canadia, Bakong)' 
                    : 'Scan with any Cambodian Banking App (ABA, Wing, ACLEDA, Bakong)'}
                </p>
              </div>

              {/* KHQR Actions: Simulate Pay or Copy */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {!isKhqrPaid ? (
                  <button
                    type="button"
                    onClick={handleSimulateKhqrPaid}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'បញ្ជាក់ការទូទាត់ KHQR (Demo Test)' : 'Simulate KHQR Payment Received'}</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isKhmer ? 'បានទូទាត់ជោគជ័យ' : 'Payment Successfully Received'}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Method 2: Cash on Delivery Screen */}
          {paymentMethod === 'COD' && (
            <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Banknote className="w-4 h-4" />
                <span>{isKhmer ? 'ទូទាត់សាច់ប្រាក់ផ្ទាល់ពេលទទួលទំនិញ' : 'Pay Cash to Delivery Driver / Barista'}</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                {isKhmer 
                  ? `សូមត្រៀមប្រាក់ចំនួន $${orderData.grandTotal.toFixed(2)} (ឬប្រហែល ${orderData.rielGrandTotal} ៛) ជូនអ្នកដឹកជញ្ជូន ឬបុគ្គលិកពេលទទួលភេសជ្ជៈ។` 
                  : `Please prepare $${orderData.grandTotal.toFixed(2)} USD or equivalent in Cambodian Riel upon arrival.`}
              </p>
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-stone-400">
                  {isKhmer ? 'ចំណាំសម្រាប់ការអាប់ប្រាក់ (បើមាន)' : 'Need Change? (e.g. Paying with $50 bill)'}
                </label>
                <input
                  type="text"
                  value={cashChangeNote}
                  onChange={(e) => setCashChangeNote(e.target.value)}
                  placeholder={isKhmer ? 'ឧ. ខ្ញុំមានក្រដាស $50 សូមអាប់ $XX ផង' : 'e.g. I have a $20 bill, please bring change'}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Method 3: Card Screen */}
          {paymentMethod === 'CARD' && (
            <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <CreditCard className="w-4 h-4" />
                <span>{isKhmer ? 'ទូទាត់តាមកាតឥណទាន / ឥណពន្ធ' : 'Credit / Debit Card Checkout'}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs space-y-2 text-stone-300">
                <div className="flex items-center justify-between text-stone-400 text-[11px]">
                  <span>Supported Cards</span>
                  <span className="font-mono text-stone-300">Visa • Mastercard • UnionPay</span>
                </div>
                <p className="text-stone-400 text-[11px]">
                  {isKhmer 
                    ? 'អ្នកអាចទូទាត់ជាមួយកាតធនាគារក្នុងស្រុក ឬអន្តរជាតិបានដោយសុវត្ថិភាព។' 
                    : 'Encrypted via 256-bit TLS Gateway. Direct settlement to Aroma Coffee merchant.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Submit Button */}
        <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800 space-y-2 shrink-0">
          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-stone-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 transition cursor-pointer shadow-xl shadow-amber-950/40"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                <span>{isKhmer ? 'កំពុងបញ្ជូនការកុម្ម៉ង់...' : 'Transmitting Order to POS...'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
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
            <span>{isKhmer ? 'ទិន្នន័យបញ្ជូនទៅផ្ទះបាយ Barista និងប្រព័ន្ធ POS ភ្លាមៗ' : 'Instant live dispatch to POS register and Kitchen KDS'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

