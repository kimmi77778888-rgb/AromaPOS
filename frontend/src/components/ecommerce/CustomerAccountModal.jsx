import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { downloadInvoice } from '../../utils/invoiceDownloader';
import { soundService } from '../../services/soundService';
import confetti from 'canvas-confetti';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Bike, 
  Coffee, 
  RotateCcw, 
  LogOut, 
  Package, 
  FileText, 
  Save, 
  Check, 
  Camera, 
  Search, 
  Navigation,
  LayoutDashboard 
} from 'lucide-react';
import { GoogleLogoSvg } from './CustomerAuthModal';

const PHNOM_PENH_DISTRICTS = [
  'Boeng Keng Kang',
  'Chamkar Mon',
  'Daun Penh',
  'Tuol Kouk',
  'Chroy Changvar',
  'Mean Chey',
  'Sen Sok',
  'Pur Senchey',
  'Chbar Ampov',
  'Russei Keo',
  'Dangkao',
  'Kamboul'
];

export const CustomerAccountModal = ({
  isOpen,
  onClose,
  onOpenLiveDeliveryMap,
  onReorderItems
}) => {
  const { isKhmer } = useLanguage();
  const { 
    customerUser, 
    logoutCustomer, 
    orders = [], 
    setOrders, 
    updateCustomerProfile, 
    showToast,
    googleLogin,
    changeAppMode 
  } = useApp();

  const [activeTab, setActiveTab] = useState('ORDERS'); // 'ORDERS' | 'DELIVERY' | 'PROFILE'
  const [historyFilter, setHistoryFilter] = useState('ALL'); // 'ALL' | 'DELIVERY' | 'PICKUP' | 'COMPLETED'
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef(null);

  // Profile Form State
  const [profileName, setProfileName] = useState(customerUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(customerUser?.phone || '');
  const [profileEmail, setProfileEmail] = useState(customerUser?.email || '');
  const [profileDistrict, setProfileDistrict] = useState(customerUser?.district || 'Boeng Keng Kang');
  const [profileAddress, setProfileAddress] = useState(customerUser?.address || '');
  const [profileAvatar, setProfileAvatar] = useState(
    customerUser?.avatar && !customerUser.avatar.includes('images.unsplash.com') ? customerUser.avatar : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (customerUser) {
      setProfileName(customerUser.name || '');
      setProfilePhone(customerUser.phone || '');
      setProfileEmail(customerUser.email || '');
      setProfileDistrict(customerUser.district || 'Boeng Keng Kang');
      setProfileAddress(customerUser.address || '');
      const validAvatar = customerUser.avatar && !customerUser.avatar.includes('images.unsplash.com') ? customerUser.avatar : '';
      setProfileAvatar(validAvatar);
    }
  }, [customerUser]);

  // Handle Photo Upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(isKhmer ? 'សូមជ្រើសរើសឯកសារជារូបភាព (JPG, PNG, WebP)!' : 'Please select an image file (JPG, PNG, WebP)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 360;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);
        setProfileAvatar(compressedBase64);

        if (updateCustomerProfile) {
          updateCustomerProfile({ avatar: compressedBase64 });
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Combine live context orders with localStorage to guarantee full real visibility
  const allOrdersList = useMemo(() => {
    try {
      const local = JSON.parse(localStorage.getItem('aromapos_orders') || '[]');
      const map = new Map();
      (orders || []).forEach((o) => {
        const key = o.id || o.orderNumber;
        if (key) map.set(key, o);
      });
      local.forEach((o) => {
        const key = o.id || o.orderNumber;
        if (key && !map.has(key)) {
          map.set(key, o);
        }
      });
      return Array.from(map.values());
    } catch (e) {
      return orders || [];
    }
  }, [orders]);

  if (!isOpen || !customerUser) return null;

  // Filter orders for active user
  const cleanPhone = (customerUser.phone || '').replace(/[^0-9]/g, '');
  const userOrders = allOrdersList.filter((o) => {
    const oPhone = (o.customerPhone || '').replace(/[^0-9]/g, '');
    const phoneMatch = cleanPhone && oPhone && (
      cleanPhone.includes(oPhone) || 
      oPhone.includes(cleanPhone) ||
      (cleanPhone.length >= 8 && oPhone.slice(-8) === cleanPhone.slice(-8))
    );
    const idMatch = customerUser.id && o.customerId && customerUser.id === o.customerId;
    const nameMatch = customerUser.name && o.customerName && customerUser.name.toLowerCase() === o.customerName.toLowerCase();
    const emailMatch = customerUser.email && (
      (o.customerEmail && customerUser.email.toLowerCase() === o.customerEmail.toLowerCase()) ||
      (o.email && customerUser.email.toLowerCase() === o.email.toLowerCase())
    );
    // Include online storefront orders so placed orders are immediately visible
    const isOnlineStoreOrder = o.channel === 'ONLINE_ECOMMERCE';
    return phoneMatch || idMatch || nameMatch || emailMatch || isOnlineStoreOrder;
  });

  // Filter by status & search
  const filteredOrders = userOrders.filter((o) => {
    if (historyFilter === 'DELIVERY' && o.orderType !== 'DELIVERY') return false;
    if (historyFilter === 'PICKUP' && o.orderType !== 'PICKUP') return false;
    if (historyFilter === 'COMPLETED' && o.status !== 'COMPLETED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const numMatch = (o.orderNumber || o.id || '').toLowerCase().includes(q);
      const phoneMatch = (o.customerPhone || '').includes(q);
      const itemMatch = (o.items || []).some(
        (it) => (it.name || '').toLowerCase().includes(q) || (it.nameKm || '').toLowerCase().includes(q)
      );
      if (!numMatch && !phoneMatch && !itemMatch) return false;
    }

    return true;
  });

  // Active in-transit delivery order (if any)
  const activeDeliveryOrder = userOrders.find(
    (o) => o.orderType === 'DELIVERY' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
  );

  const detectCarrier = (phone) => {
    const p = (phone || '').replace(/[^0-9]/g, '');
    if (/^(010|015|016|069|070|081|086|087|093|096|098)/.test(p)) return { name: 'Smart', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    if (/^(012|017|076|077|078|085|089|092|095|099)/.test(p)) return { name: 'Cellcard', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' };
    if (/^(088|097|071|060|066|067|068|090)/.test(p)) return { name: 'Metfone', color: 'bg-red-500/20 text-red-400 border-red-500/40' };
    return null;
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileName.trim() || !profilePhone.trim()) return;

    setIsSaving(true);
    if (updateCustomerProfile) {
      updateCustomerProfile({
        name: profileName.trim(),
        phone: profilePhone.trim(),
        email: profileEmail.trim(),
        district: profileDistrict,
        address: profileAddress.trim(),
        avatar: profileAvatar
      });
    }

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      if (showToast) {
        showToast(isKhmer ? '✓ បានរក្សាទុកព័ត៌មានដោយជោគជ័យ' : '✓ Profile updated successfully', 'success');
      }
      setTimeout(() => setSaveSuccess(false), 2500);
    }, 350);
  };

  const handleMarkOrderReceived = (order) => {
    try {
      soundService.playKaChing();
      confetti({
        particleCount: 85,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#D97706']
      });
    } catch (e) {}

    const targetId = order.id || order.orderNumber;
    if (setOrders) {
      setOrders((prev) =>
        prev.map((o) => (o.id === targetId || o.orderNumber === order.orderNumber ? { ...o, status: 'COMPLETED', isDelivered: true, deliveredAt: new Date().toISOString() } : o))
      );
    }
    try {
      const stored = JSON.parse(localStorage.getItem('aromapos_orders') || '[]');
      const updated = stored.map((o) => (o.id === targetId || o.orderNumber === order.orderNumber ? { ...o, status: 'COMPLETED', isDelivered: true, deliveredAt: new Date().toISOString() } : o));
      localStorage.setItem('aromapos_orders', JSON.stringify(updated));
    } catch (e) {}

    if (showToast) {
      showToast(isKhmer ? '🎉 បានបញ្ជាក់ថាទទួលបានកាហ្វេរួចរាល់! សូមពិសារដោយរីករាយ ☕' : '🎉 Order confirmed received! Enjoy your coffee ☕', 'success');
    }
  };

  const currentCarrier = detectCarrier(profilePhone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden File Input for Real Photo Upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Header Profile Banner (Clean & Modern) */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/30 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            {/* Clickable Real Photo with Camera Overlay */}
            <div 
              className="relative group cursor-pointer shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title={isKhmer ? 'ចុចទីនេះដើម្បីប្តូររូបថត (Upload Real Photo)' : 'Click to change photo'}
            >
              {customerUser.avatar && !customerUser.avatar.includes('images.unsplash.com') ? (
                <img
                  src={customerUser.avatar}
                  alt={customerUser.name}
                  className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl object-cover border-2 border-amber-500 shadow-lg group-hover:border-amber-400 transition"
                />
              ) : (
                <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-black text-xl flex items-center justify-center border-2 border-amber-400 shadow-lg">
                  {(customerUser.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-stone-900 border border-amber-500 text-amber-400 flex items-center justify-center shadow hover:scale-110 transition cursor-pointer">
                <Camera className="w-3 h-3" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white truncate">
                  {customerUser.name}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                  {customerUser.tier || 'Verified Coffee Member'}
                </span>
                {customerUser.email && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-mono truncate max-w-[200px]">
                    <GoogleLogoSvg className="w-3 h-3 shrink-0" />
                    <span className="truncate">{customerUser.email}</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-stone-400 font-mono flex items-center gap-2 mt-1 flex-wrap">
                {customerUser.phone && <span>📞 {customerUser.phone}</span>}
                {customerUser.district && <span>• 📍 {customerUser.district}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Dashboard Access Button */}
            <button
              type="button"
              onClick={async () => {
                try {
                  if (googleLogin) {
                    await googleLogin({
                      email: customerUser.email,
                      name: customerUser.name,
                      picture: customerUser.avatar,
                      sub: `cust-${customerUser.id}`
                    });
                  }
                } catch (e) {}
                if (changeAppMode) changeAppMode('pos');
                onClose();
              }}
              className="py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
              title={isKhmer ? 'ចូលផ្ទាំងគ្រប់គ្រង Dashboard & POS' : 'Enter Live Dashboard & POS'}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isKhmer ? 'Dashboard' : 'Dashboard'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (logoutCustomer) logoutCustomer();
                onClose();
              }}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-rose-400 transition"
              title={isKhmer ? 'ចាកចេញពីគណនី' : 'Sign Out'}
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean Segmented Navigation Tabs */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-stone-800 flex items-center gap-4 text-xs font-bold text-stone-400 shrink-0 bg-stone-950/60">
          <button
            type="button"
            onClick={() => setActiveTab('ORDERS')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ORDERS'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent hover:text-stone-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{isKhmer ? 'ប្រវត្តិកុម្ម៉ង់' : 'Order History'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-stone-300 font-mono text-[10px]">
              {userOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DELIVERY')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'DELIVERY'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent hover:text-stone-200'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>{isKhmer ? 'ការដឹកជញ្ជូនផ្ទាល់' : 'Live Delivery'}</span>
            {activeDeliveryOrder && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 right-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent hover:text-stone-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isKhmer ? 'ព័ត៌មាន & អាសយដ្ឋាន' : 'Profile & Address'}</span>
          </button>
        </div>

        {/* Scrollable Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-stone-200">
          
          {/* =========================================================================
              TAB 1: ORDER HISTORY (CLEAN, ITEMIZED, INVOICE DOWNLOAD & REORDER)
             ========================================================================= */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {[
                    { id: 'ALL', labelKm: 'ទាំងអស់', labelEn: 'All' },
                    { id: 'DELIVERY', labelKm: 'ដឹកជញ្ជូន', labelEn: 'Delivery' },
                    { id: 'PICKUP', labelKm: 'មកយកផ្ទាល់', labelEn: 'Pickup' },
                    { id: 'COMPLETED', labelKm: 'បានបញ្ចប់', labelEn: 'Completed' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setHistoryFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition text-xs shrink-0 cursor-pointer ${
                        historyFilter === f.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'bg-stone-950 text-stone-400 border border-stone-850 hover:text-stone-200'
                      }`}
                    >
                      {isKhmer ? f.labelKm : f.labelEn}
                    </button>
                  ))}
                </div>

                {/* Instant Search Box */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isKhmer ? 'ស្វែងរកតាមលេខកូដ ឬភេសជ្ជៈ...' : 'Search order # or drink...'}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Order Cards List */}
              {filteredOrders.length === 0 ? (
                <div className="py-14 px-4 text-center space-y-3.5 bg-stone-950/60 rounded-3xl border border-stone-850">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Package className="w-6 h-6 opacity-75" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-stone-200 text-sm">
                      {isKhmer ? 'មិនមានប្រវត្តិកុម្ម៉ង់ក្នុងផ្នែកនេះទេ' : 'No order history in this filter'}
                    </p>
                    <p className="text-xs text-stone-400 max-w-sm mx-auto">
                      {isKhmer 
                        ? 'រាល់ការកុម្ម៉ង់របស់លោកអ្នកនឹងបង្ហាញនៅទីនេះ ជាមួយការតាមដានការដឹកជញ្ជូន និងវិក្កយបត្រស្អាត។' 
                        : 'Your coffee orders will appear here with live courier tracking and clean downloadable invoices.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      const menuEl = document.getElementById('menu');
                      if (menuEl) menuEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs inline-flex items-center gap-2 transition cursor-pointer shadow-md"
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'កុម្ម៉ង់កាហ្វេឥឡូវនេះ' : 'Explore Coffee Menu'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => {
                    const isDelivery = order.orderType === 'DELIVERY';
                    const isCompleted = order.status === 'COMPLETED' || order.status === 'DELIVERED';
                    const dateFormatted = order.createdAt 
                      ? new Date(order.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Recently';
                    const riel = Math.round((order.total || 0) * 4100).toLocaleString();

                    return (
                      <div
                        key={order.id || order.orderNumber}
                        className="p-4 sm:p-5 rounded-2xl bg-stone-950 border border-stone-850 hover:border-stone-750 transition shadow-lg space-y-3"
                      >
                        {/* Order Header Row */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-400 text-sm">
                              #{order.orderNumber || order.id}
                            </span>
                            <span className="text-[11px] text-stone-500 font-mono">
                              • {dateFormatted}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isDelivery
                                ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                                : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'
                            }`}>
                              {isDelivery ? '🛵 Delivery' : '🛍️ Store Pickup'}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                            isCompleted
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{order.status || 'IN_PREPARATION'}</span>
                          </span>
                        </div>

                        {/* Itemized Products Preview */}
                        <div className="space-y-1.5 border-t border-b border-stone-850/80 py-2.5 text-xs text-stone-300">
                          {(order.items || []).map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3">
                              <span className="truncate">
                                <strong className="text-amber-400 font-mono">{it.quantity}x</strong>{' '}
                                <span className="font-semibold text-stone-100">{it.nameKm || it.name}</span>
                                {it.size && <span className="text-stone-500 ml-1.5 font-mono text-[11px]">({it.size})</span>}
                                {it.sweetness && <span className="text-amber-500/80 ml-1 font-mono text-[10px]">• {it.sweetness}</span>}
                              </span>
                              <span className="font-mono text-stone-300 shrink-0 font-bold">
                                ${((it.price || it.unitPrice || 0) * (it.quantity || 1)).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Delivery Destination (if delivery) */}
                        {isDelivery && (
                          <div className="text-[11px] text-stone-400 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <span className="truncate">{order.deliveryAddress || customerUser.address || 'Phnom Penh'}</span>
                          </div>
                        )}

                        {/* Financial Totals & Action Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono font-black text-lg text-white">
                                ${(order.total || 0).toFixed(2)}
                              </span>
                              <span className="font-mono text-xs text-stone-400">
                                ≈ {riel} ៛
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono block">
                              ✓ {order.paymentMethod || 'Bakong KHQR'} ({order.paymentStatus || 'PAID'})
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center flex-wrap gap-2">
                            {/* Download Clean Invoice Button */}
                            <button
                              type="button"
                              onClick={() => downloadInvoice(order)}
                              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-200 hover:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:border-amber-500/50"
                              title="Download clean official invoice (PDF/Print)"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-400" />
                              <span>{isKhmer ? 'វិក្កយបត្រ' : 'Invoice'}</span>
                            </button>

                            {/* Live Delivery Map Button */}
                            {isDelivery && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  if (onOpenLiveDeliveryMap) onOpenLiveDeliveryMap(order);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                              >
                                <Bike className="w-3.5 h-3.5" />
                                <span>{isKhmer ? 'ផែនទីដឹក' : 'Live Map'}</span>
                              </button>
                            )}

                            {/* Mark Got Product Confirmation */}
                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => handleMarkOrderReceived(order)}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>{isKhmer ? 'បានទទួល' : 'Got Product'}</span>
                              </button>
                            )}

                            {/* 1-Click Reorder Button */}
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                if (onReorderItems) onReorderItems(order.items);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                              title="Reorder items"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                              <span>{isKhmer ? 'កុម្ម៉ង់ម្តងទៀត' : 'Reorder'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 2: LIVE DELIVERY TRACKING (REAL GPS & TELEMETRY RADAR)
             ========================================================================= */}
          {activeTab === 'DELIVERY' && (
            <div className="space-y-4">
              {activeDeliveryOrder ? (
                <div className="p-5 rounded-3xl bg-gradient-to-b from-stone-950 to-stone-900 border border-amber-500/30 space-y-4 shadow-xl">
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-bold text-sm text-emerald-400">
                        {isKhmer ? 'អ្នកដឹកជញ្ជូនកំពុងធ្វើដំណើរលើផ្លូវ' : 'Courier In Transit (Live Radar)'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-black text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                      #{activeDeliveryOrder.orderNumber}
                    </span>
                  </div>

                  {/* Destination & Rider Snapshot */}
                  <div className="p-4 rounded-2xl bg-stone-950 border border-stone-850 space-y-2.5 text-xs">
                    <div className="flex items-start gap-2 text-stone-300">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-stone-500 uppercase font-bold block">Delivery Destination</span>
                        <span className="font-bold text-white text-sm">
                          {activeDeliveryOrder.deliveryAddress || customerUser.address || 'Phnom Penh'}
                        </span>
                        <div className="text-stone-400 mt-0.5">
                          Recipient: {activeDeliveryOrder.customerName || customerUser.name} ({activeDeliveryOrder.customerPhone || customerUser.phone})
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-850 flex items-center justify-between text-stone-300">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-bold">
                          🛵
                        </div>
                        <div>
                          <span className="font-bold text-white block">Kosal Vorn (Aroma Express Fleet)</span>
                          <span className="text-[10px] text-stone-400 font-mono">Honda Wave 125i • Thermal Bag (65°C)</span>
                        </div>
                      </div>
                      <a 
                        href="tel:+85523999881"
                        className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Dispatch</span>
                      </a>
                    </div>
                  </div>

                  {/* Direct Launch Interactive Fullscreen Map */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenLiveDeliveryMap) onOpenLiveDeliveryMap(activeDeliveryOrder);
                      }}
                      className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>{isKhmer ? 'បើកផែនទីដឹកជញ្ជូនផ្ទាល់ (Live Map)' : 'Open Interactive GPS Map'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMarkOrderReceived(activeDeliveryOrder)}
                      className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>{isKhmer ? '✅ ខ្ញុំបានទទួលកាហ្វេរួចរាល់' : '✅ I Received My Coffee'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-14 px-4 text-center space-y-3 bg-stone-950/60 rounded-3xl border border-stone-850">
                  <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 text-stone-400 flex items-center justify-center mx-auto">
                    <Bike className="w-6 h-6 opacity-75" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-stone-200 text-sm">
                      {isKhmer ? 'មិនមានការដឹកជញ្ជូនសកម្មទេ' : 'No active deliveries at the moment'}
                    </p>
                    <p className="text-xs text-stone-400 max-w-sm mx-auto">
                      {isKhmer 
                        ? 'នៅពេលលោកអ្នកកុម្ម៉ង់ទិញកាហ្វេដឹកដល់ផ្ទះ លោកអ្នកអាចមើលទីតាំងអ្នកដឹកជាក់ស្ដែងលើផ្លូវនៅទីនេះ។' 
                        : 'When you place a delivery order, live courier GPS road movement will show here.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 3: EDIT PROFILE & SAVED DELIVERY ADDRESS (CLEAN FORM)
             ========================================================================= */}
          {activeTab === 'PROFILE' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-950 border border-stone-850 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-stone-850 text-xs">
                  <span className="font-bold text-stone-200 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>{isKhmer ? 'ព័ត៌មានផ្ទាល់ខ្លួន' : 'Personal Details'}</span>
                  </span>
                  {saveSuccess && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{isKhmer ? 'បានរក្សាទុក!' : 'Saved!'}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-400">
                      {isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. Len Sophara"
                      required
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-stone-400">
                        {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                      </label>
                      {currentCarrier && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${currentCarrier.color}`}>
                          {currentCarrier.name}
                        </span>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="e.g. 096 927 6538"
                      required
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  {/* Email */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-stone-400">
                      {isKhmer ? 'អាសយដ្ឋាន Email' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="e.g. lensophara@gmail.com"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Delivery Address Section */}
                <div className="pt-2 border-t border-stone-850 space-y-3">
                  <span className="font-bold text-stone-200 text-xs flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <span>{isKhmer ? 'អាសយដ្ឋានដឹកជញ្ជូនរហ័ស (Phnom Penh)' : 'Default Delivery Address'}</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-400">
                        {isKhmer ? 'ខណ្ឌ / តំបន់' : 'District (Khan)'}
                      </label>
                      <select
                        value={profileDistrict}
                        onChange={(e) => setProfileDistrict(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                      >
                        {PHNOM_PENH_DISTRICTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-stone-400">
                        {isKhmer ? 'ផ្ទះលេខ ផ្លូវ ឬអគារ' : 'Street Address / Building / Landmark'}
                      </label>
                      <input
                        type="text"
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        placeholder="e.g. #45, St. 288, Sangkat Boeng Keng Kang 1"
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Save Button */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isSaving ? (
                  <span>{isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...'}</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isKhmer ? 'រក្សាទុកព័ត៌មាន (Save Profile)' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
