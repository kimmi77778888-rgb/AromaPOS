import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Bike, 
  Store, 
  MapPin, 
  Phone, 
  User, 
  Tag, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';

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

const STORE_BRANCHES = [
  { id: 'bkk1', name: 'Aroma BKK1 Flagship', address: '#42, Street 57, BKK1, Phnom Penh', hours: '6:30 AM - 9:00 PM' },
  { id: 'riverside', name: 'Aroma Riverside Café', address: '#118, Preah Sisowath Quay, Daun Penh', hours: '7:00 AM - 10:00 PM' },
  { id: 'tuolkork', name: 'Aroma TK Roastery', address: 'TK Avenue Mall, Street 315, Tuol Kork', hours: '7:00 AM - 8:30 PM' }
];

export const EcommerceCartDrawer = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onRequireAuth
}) => {
  const { isKhmer } = useLanguage();
  const { customerUser } = useApp();

  const [orderType, setOrderType] = useState('DELIVERY'); // 'DELIVERY' | 'PICKUP'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [district, setDistrict] = useState(PHNOM_PENH_DISTRICTS[0]);
  const [streetAddress, setStreetAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(STORE_BRANCHES[0].id);

  // Sync details from authenticated customer account
  useEffect(() => {
    if (customerUser) {
      if (customerUser.name) setCustomerName(customerUser.name);
      if (customerUser.phone) setCustomerPhone(customerUser.phone);
      if (customerUser.address) setStreetAddress(customerUser.address);
      if (customerUser.district) setDistrict(customerUser.district);
    }
  }, [customerUser, isOpen]);

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  if (!isOpen) return null;

  const carrier = detectCarrier(customerPhone);

  // Subtotal Calculation
  const subtotal = cartItems.reduce((sum, item) => sum + (item.totalPrice || (item.unitPrice * item.quantity)), 0);

  // Discount Calculation
  let discount = 0;
  if (appliedPromo?.code === 'AROMA20') {
    discount = Math.round(subtotal * 0.20 * 100) / 100;
  }

  // Delivery Fee: $1.00 flat, or FREE if pickup or subtotal >= 10 or FREESHIP promo
  let deliveryFee = 0;
  if (orderType === 'DELIVERY') {
    if (appliedPromo?.code === 'FREESHIP' || subtotal >= 10) {
      deliveryFee = 0;
    } else {
      deliveryFee = 1.00;
    }
  }

  const grandTotal = Math.max(0, Math.round((subtotal - discount + deliveryFee) * 100) / 100);
  const rielGrandTotal = Math.round(grandTotal * 4100).toLocaleString();

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'AROMA20') {
      setAppliedPromo({ code: 'AROMA20', discountPercent: 20, description: '20% Off Artisan Coffee' });
      setPromoCodeInput('');
    } else if (code === 'FREESHIP') {
      setAppliedPromo({ code: 'FREESHIP', discountPercent: 0, description: 'Free Phnom Penh Delivery' });
      setPromoCodeInput('');
    } else {
      setPromoError(isKhmer ? 'កូដប្រូម៉ូសិនមិនត្រឹមត្រូវ' : 'Invalid promo code (Try AROMA20 or FREESHIP)');
    }
  };

  const handleCheckoutClick = () => {
    // 1. Mandatory Customer Account Verification before buying coffee
    if (!customerUser) {
      if (onRequireAuth) {
        onRequireAuth();
        return;
      }
    }

    if (!customerName.trim()) {
      alert(isKhmer ? 'សូមបញ្ចូលឈ្មោះរបស់អ្នក' : 'Please enter your name');
      return;
    }
    if (!customerPhone.trim()) {
      alert(isKhmer ? 'សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក' : 'Please enter your phone number');
      return;
    }
    if (orderType === 'DELIVERY' && !streetAddress.trim()) {
      alert(isKhmer ? 'សូមបញ្ចូលអាសយដ្ឋានផ្ទះ/ផ្លូវរបស់អ្នក' : 'Please enter your street & house delivery address');
      return;
    }

    const orderData = {
      orderType,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      carrier: carrier?.name || 'Cambodia Mobile',
      deliveryAddress: orderType === 'DELIVERY' ? `${streetAddress.trim()}, ${district}, Phnom Penh` : null,
      deliveryNotes: orderType === 'DELIVERY' ? deliveryNotes.trim() : null,
      pickupBranch: orderType === 'PICKUP' ? STORE_BRANCHES.find(b => b.id === selectedBranch) : null,
      cartItems,
      subtotal,
      discount,
      appliedPromo,
      deliveryFee,
      grandTotal,
      rielGrandTotal
    };

    onProceedToCheckout(orderData);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="w-full max-w-lg bg-stone-900 border-l border-stone-800 h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">
                {isKhmer ? 'កន្ត្រកកុម្ម៉ង់ទំនិញ' : 'Your Coffee Bag'}
              </h3>
              <p className="text-xs text-stone-400">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} • Artisan Roastery
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-stone-200">
          {cartItems.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-stone-950 border border-stone-800 flex items-center justify-center mx-auto text-stone-500">
                <ShoppingBag className="w-8 h-8 opacity-60" />
              </div>
              <h4 className="font-bold text-stone-300">
                {isKhmer ? 'កន្ត្រករបស់អ្នកទទេ' : 'Your bag is empty'}
              </h4>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                {isKhmer ? 'សូមជ្រើសរើសភេសជ្ជៈ ឬនំប៉័ងឆ្ងាញ់ៗពីម៉ឺនុយរបស់យើង' : 'Explore our specialty coffees, fresh roasts, and bakery items to start ordering.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition cursor-pointer"
              >
                {isKhmer ? 'មើលម៉ឺនុយឥឡូវនេះ' : 'Browse Menu'}
              </button>
            </div>
          ) : (
            <>
              {/* Order Mode Switcher: Delivery vs Pickup */}
              <div className="p-1 rounded-2xl bg-stone-950 border border-stone-800 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setOrderType('DELIVERY')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    orderType === 'DELIVERY'
                      ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>{isKhmer ? 'ដឹកជញ្ជូនដល់ផ្ទះ' : 'Delivery (30m)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('PICKUP')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    orderType === 'PICKUP'
                      ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>{isKhmer ? 'មកយកនៅហាង' : 'Store Pickup'}</span>
                </button>
              </div>

              {/* Free Delivery Banner */}
              {orderType === 'DELIVERY' && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🛵</span>
                    <span>
                      {subtotal >= 10
                        ? (isKhmer ? '🎉 អបអរសាទរ! អ្នកទទួលបានការដឹកជញ្ជូនឥតគិតថ្លៃ!' : '🎉 You unlocked Free Phnom Penh Delivery!')
                        : (isKhmer 
                            ? `បន្ថែម $${(10 - subtotal).toFixed(2)} ទៀតដើម្បីទទួលបានដឹកឥតគិតថ្លៃ` 
                            : `Add $${(10 - subtotal).toFixed(2)} more for Free Delivery`)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[11px] text-amber-200">
                    {subtotal >= 10 ? 'FREE' : '$1.00'}
                  </span>
                </div>
              )}

              {/* Cart Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-400">
                  {isKhmer ? 'មុខទំនិញដែលបានជ្រើស' : 'Order Items'}
                </h4>
                <div className="space-y-2.5">
                  {cartItems.map((item, index) => (
                    <div 
                      key={`${item.productId}-${index}`}
                      className="p-3 rounded-2xl bg-stone-950/70 border border-stone-850 flex gap-3 text-xs"
                    >
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&q=80'}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-800"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h5 className="font-bold text-stone-100 truncate text-sm">
                            {isKhmer ? item.nameKm : item.name}
                          </h5>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(index)}
                            className="text-stone-500 hover:text-rose-400 transition p-1 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Customization Specs summary */}
                        <div className="mt-0.5 space-y-0.5 text-[11px] text-stone-400">
                          {item.size && (
                            <span className="inline-block mr-2 text-amber-300/90 font-medium">
                              • {item.size}
                            </span>
                          )}
                          {item.ice && item.ice !== 'Hot' && (
                            <span className="inline-block mr-2 text-cyan-300/90">
                              • Ice: {item.ice}
                            </span>
                          )}
                          {item.sweetness && (
                            <span className="inline-block mr-2 text-stone-300">
                              • Sweet: {item.sweetness}
                            </span>
                          )}
                          {item.milk && item.milk !== 'Fresh Whole Milk' && (
                            <span className="inline-block mr-2 text-emerald-300/90">
                              • {item.milk}
                            </span>
                          )}
                          {item.addons && item.addons.length > 0 && (
                            <div className="text-[10px] text-amber-400">
                              + {item.addons.map(a => a.name).join(', ')}
                            </div>
                          )}
                          {item.specialNote && (
                            <div className="text-[10px] text-stone-500 italic">
                              "{item.specialNote}"
                            </div>
                          )}
                        </div>

                        {/* Price & Quantity Controls */}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-mono font-black text-amber-400 text-sm">
                            ${(item.totalPrice || (item.unitPrice * item.quantity)).toFixed(2)}
                          </span>

                          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl p-0.5">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                              className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center font-mono font-bold text-xs text-stone-100">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                              className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Contact & Delivery Info */}
              <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-850 space-y-3.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKhmer ? 'ព័ត៌មានអតិថិជន & ទំនាក់ទំនង' : 'Customer & Contact Details'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-400">
                      {isKhmer ? 'ឈ្មោះអតិថិជន' : 'Customer Name'} *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Sokha Mean"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-stone-400">
                        {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'} *
                      </label>
                      {carrier && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${carrier.color}`}>
                          {carrier.icon} {carrier.name}
                        </span>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 012 888 999"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {orderType === 'DELIVERY' ? (
                  <div className="space-y-2.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        <span>{isKhmer ? 'ខណ្ឌ / តំបន់នៅភ្នំពេញ' : 'Phnom Penh District (Khan)'} *</span>
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        {PHNOM_PENH_DISTRICTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-400">
                        {isKhmer ? 'ផ្ទះលេខ & ផ្លូវ' : 'Street & House Number'} *
                      </label>
                      <input
                        type="text"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="e.g. #24B, Street 302, Sangkat BKK1"
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-400">
                        {isKhmer ? 'ចំណាំសម្រាប់ការដឹកជញ្ជូន' : 'Delivery Instructions'}
                      </label>
                      <input
                        type="text"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="e.g. Ring the doorbell or call upon arrival"
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
                      <Store className="w-3 h-3 text-amber-400" />
                      <span>{isKhmer ? 'ជ្រើសរើសសាខាហាងសម្រាប់មកយក' : 'Select Pickup Branch'} *</span>
                    </label>
                    <div className="space-y-2">
                      {STORE_BRANCHES.map((b) => {
                        const isSelected = selectedBranch === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setSelectedBranch(b.id)}
                            className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-500 text-amber-200'
                                : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-xs text-stone-100">{b.name}</p>
                              <p className="text-[10px] text-stone-400">{b.address}</p>
                              <span className="text-[9px] text-emerald-400 font-mono mt-0.5 block">Open: {b.hours}</span>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Promo Code Accordion */}
              <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-850 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isKhmer ? 'កូដបញ្ចុះតម្លៃ' : 'Promo Code'}</span>
                  </span>
                  {appliedPromo && (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      ✓ {appliedPromo.code} Applied
                    </span>
                  )}
                </div>

                {appliedPromo ? (
                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs text-emerald-300">
                    <span>{appliedPromo.description}</span>
                    <button
                      type="button"
                      onClick={() => setAppliedPromo(null)}
                      className="text-stone-400 hover:text-rose-400 font-bold ml-2 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="Try 'AROMA20' or 'FREESHIP'"
                      className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono uppercase"
                    />
                    <button
                      type="submit"
                      disabled={!promoCodeInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 font-bold text-xs transition cursor-pointer"
                    >
                      {isKhmer ? 'ប្រើ' : 'Apply'}
                    </button>
                  </form>
                )}
                {promoError && (
                  <p className="text-[10px] text-rose-400 font-medium">{promoError}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Drawer Sticky Footer with Totals & Checkout Button */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800 space-y-3 shrink-0">
            {/* Bill Summary */}
            <div className="space-y-1.5 text-xs text-stone-400">
              <div className="flex items-center justify-between">
                <span>{isKhmer ? 'សរុបមុខទំនិញ (Subtotal)' : 'Subtotal'}</span>
                <span className="font-mono text-stone-200">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-emerald-400">
                  <span>{isKhmer ? 'បញ្ចុះតម្លៃ (Promo Discount)' : 'Discount'} ({appliedPromo?.code})</span>
                  <span className="font-mono">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>{isKhmer ? 'ថ្លៃដឹកជញ្ជូន (Delivery Fee)' : 'Delivery Fee'}</span>
                <span className="font-mono text-stone-200">
                  {deliveryFee === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : `$${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-sm sm:text-base font-black text-white">
                <span>{isKhmer ? 'ទឹកប្រាក់សរុប (Total)' : 'Total Amount'}</span>
                <div className="text-right">
                  <span className="font-mono text-amber-400 text-lg">${grandTotal.toFixed(2)}</span>
                  <span className="text-[11px] text-stone-400 block font-normal">≈ {rielGrandTotal} ៛</span>
                </div>
              </div>
            </div>

            {/* Customer Account Requirement Pill */}
            {!customerUser ? (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKhmer ? 'តម្រូវឱ្យមានគណនីដើម្បីកុម្ម៉ង់' : 'Account required to order coffee'}</span>
                </div>
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="font-bold underline text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  {isKhmer ? 'ចុះឈ្មោះ / ចូលគណនី' : 'Register / Sign In'}
                </button>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs text-emerald-300">
                <span className="truncate">👤 {customerUser.name} ({customerUser.tier || 'Member'})</span>
                <span className="font-mono font-bold text-amber-400 shrink-0 ml-1">{customerUser.points || 0} pts</span>
              </div>
            )}

            {/* Checkout Action Button */}
            <button
              type="button"
              onClick={handleCheckoutClick}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-xl shadow-amber-950/40"
            >
              <span>{isKhmer ? 'បន្តទៅទូទាត់ប្រាក់' : 'Proceed to Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-stone-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isKhmer ? 'ការទូទាត់សុវត្ថិភាពតាម Bakong KHQR & សាច់ប្រាក់' : 'Secure Checkout via Bakong KHQR & Cash on Delivery'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

