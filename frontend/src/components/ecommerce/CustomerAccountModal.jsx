import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { downloadInvoice } from '../../utils/invoiceDownloader';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Bike, 
  Store, 
  Coffee, 
  RotateCcw, 
  LogOut, 
  Package, 
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  FileText,
  Edit3,
  Save,
  Check,
  Mail,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

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
  'Dangkao'
];

export const CustomerAccountModal = ({
  isOpen,
  onClose,
  onOpenLiveDeliveryMap,
  onReorderItems
}) => {
  const { isKhmer } = useLanguage();
  const { customerUser, logoutCustomer, orders = [], updateCustomerProfile, placeOnlineOrder } = useApp();

  const [activeTab, setActiveTab] = useState('ORDERS'); // 'ORDERS' | 'PROFILE' | 'ADDRESS'
  const [historyFilter, setHistoryFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'

  const fileInputRef = useRef(null);

  // Profile Edit State
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

  const handleRemoveAvatar = () => {
    setProfileAvatar('');
    if (updateCustomerProfile) {
      updateCustomerProfile({ avatar: '' });
    }
  };

  // Combine live context orders with localStorage to guarantee immediate visibility
  const allOrders = React.useMemo(() => {
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

  // Filter orders associated with this customer
  const cleanPhone = (customerUser.phone || '').replace(/[^0-9]/g, '');
  const userOrders = allOrders.filter((o) => {
    const oPhone = (o.customerPhone || '').replace(/[^0-9]/g, '');
    const phoneMatch = cleanPhone && oPhone && (
      cleanPhone.includes(oPhone) || 
      oPhone.includes(cleanPhone) ||
      (cleanPhone.length >= 8 && oPhone.slice(-8) === cleanPhone.slice(-8))
    );
    const idMatch = customerUser.id && o.customerId && customerUser.id === o.customerId;
    const nameMatch = customerUser.name && o.customerName && customerUser.name.toLowerCase() === o.customerName.toLowerCase();
    return phoneMatch || idMatch || nameMatch;
  });

  const filteredOrders = userOrders.filter((o) => {
    if (historyFilter === 'ACTIVE') {
      return o.status !== 'COMPLETED' && o.status !== 'REFUNDED';
    }
    if (historyFilter === 'COMPLETED') {
      return o.status === 'COMPLETED';
    }
    return true;
  });

  const stampsCount = customerUser.stamps || 3;
  const totalStampsGoal = 10;

  const handleCreateDemoOrder = () => {
    const demoOrder = {
      id: `ord-onl-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      orderNumber: `ORD-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
      channel: 'ONLINE_ECOMMERCE',
      orderType: 'DELIVERY',
      status: 'IN_PREPARATION',
      createdAt: new Date().toISOString(),
      customerId: customerUser.id,
      customerName: customerUser.name,
      customerPhone: customerUser.phone,
      deliveryAddress: customerUser.address || '#45, Street 288, Sangkat Boeng Keng Kang 1, Phnom Penh',
      customerDistrict: customerUser.district || 'Boeng Keng Kang',
      items: [
        {
          productId: 'prod-latte',
          name: 'Iced Spanish Latte (កាហ្វេឡាតេ)',
          nameKm: 'កាហ្វេឡាតេអេស្ប៉ាញ',
          unitPrice: 3.50,
          price: 3.50,
          quantity: 1,
          total: 3.50,
          size: 'Regular',
          ice: 'Normal',
          sweetness: '50%'
        },
        {
          productId: 'prod-croissant',
          name: 'Butter Croissant (នំក្រូសង់ប៊ឺ)',
          nameKm: 'នំក្រូសង់ប៊ឺស្រស់',
          unitPrice: 2.00,
          price: 2.00,
          quantity: 1,
          total: 2.00,
          size: 'Standard'
        }
      ],
      subtotal: 5.50,
      deliveryFee: 1.00,
      discount: 0,
      total: 6.50,
      rielTotal: '26,650',
      paymentMethod: 'KHQR',
      paymentStatus: 'PAID',
      notes: 'Instant Demo Order with official NBC Bakong KHQR receipt'
    };

    if (placeOnlineOrder) {
      placeOnlineOrder(demoOrder);
    }
  };

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
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 400);
  };

  const currentCarrier = detectCarrier(profilePhone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden File Input for Real Photo Upload from Device / Camera */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Header Profile Banner */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/40 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Clickable Real Photo with Camera Overlay */}
            <div 
              className="relative group cursor-pointer shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title={isKhmer ? 'ចុចទីនេះដើម្បីប្តូររូបថតពិត (Upload Real Photo)' : 'Click to upload real photo'}
            >
              {customerUser.avatar && !customerUser.avatar.includes('images.unsplash.com') ? (
                <img
                  src={customerUser.avatar}
                  alt={customerUser.name}
                  className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-lg group-hover:border-amber-400 transition"
                />
              ) : (
                <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-black text-xl flex items-center justify-center border-2 border-amber-400 shadow-lg">
                  {(customerUser.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div 
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-stone-900 border border-amber-500 text-amber-400 flex items-center justify-center shadow hover:scale-110 transition cursor-pointer"
                title={isKhmer ? 'បង្ហោះរូបថតពិត' : 'Upload photo'}
              >
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-xl text-white">
                  {customerUser.name}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {customerUser.tier || 'Gold VIP Member'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('PROFILE')}
                  className="px-2.5 py-0.5 rounded-lg bg-stone-850 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-amber-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  title={isKhmer ? 'កែប្រែព័ត៌មានគណនី' : 'Edit Profile'}
                >
                  <Edit3 className="w-3 h-3 text-amber-400" />
                  <span>{isKhmer ? 'កែប្រែ' : 'Edit'}</span>
                </button>
              </div>
              <p className="text-xs text-stone-400 font-mono flex items-center gap-2 mt-0.5">
                <span>📞 {customerUser.phone}</span>
                {customerUser.district && <span>• 📍 {customerUser.district}</span>}
                {customerUser.points !== undefined && (
                  <span className="text-amber-400 font-bold">• 🌟 {customerUser.points} Pts</span>
                )}
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

        {/* Digital Stamp Card & Loyalty Banner */}
        <div className="p-4 bg-stone-950/90 border-b border-stone-850">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isKhmer ? 'កាតត្រាកាហ្វេឌីជីថល (Digital Stamp Card)' : 'Coffee Stamp Card'}</span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {stampsCount} / {totalStampsGoal} {isKhmer ? 'ត្រា' : 'Stamps'} (Buy 9 Get 1 Free)
            </span>
          </div>

          {/* 10 Stamp Circles */}
          <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
            {Array.from({ length: totalStampsGoal }).map((_, idx) => {
              const isStamped = idx < stampsCount;
              const isFinal = idx === totalStampsGoal - 1;

              return (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition border ${
                    isStamped
                      ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-md'
                      : isFinal
                      ? 'bg-amber-950/40 border-amber-600/60 text-amber-400 border-dashed animate-pulse'
                      : 'bg-stone-900 border-stone-800 text-stone-600'
                  }`}
                  title={isFinal ? 'Free Coffee Reward Cup!' : `Stamp #${idx + 1}`}
                >
                  {isStamped ? (
                    <Coffee className="w-4 h-4 fill-stone-950 stroke-stone-950 stroke-[2.5]" />
                  ) : isFinal ? (
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  ) : (
                    <span className="font-mono text-xs">{idx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-stone-850 flex items-center gap-3 text-xs font-bold text-stone-400 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ORDERS')}
            className={`pb-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ORDERS'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent hover:text-stone-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{isKhmer ? 'ប្រវត្តិកុម្ម៉ង់ទិញ' : 'Purchase History'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-stone-300 font-mono text-[10px]">
              {userOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`pb-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PROFILE'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent hover:text-stone-200'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isKhmer ? 'កែប្រែព័ត៌មានគណនី' : 'Edit Profile'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ADDRESS')}
            className={`pb-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ADDRESS'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent hover:text-stone-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{isKhmer ? 'អាសយដ្ឋានដឹកជញ្ជូន' : 'Saved Address'}</span>
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-stone-200">
          {/* TAB 1: ORDER HISTORY */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-4">
              {/* Order Status Filters */}
              <div className="flex items-center gap-2 text-xs">
                {['ALL', 'ACTIVE', 'COMPLETED'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setHistoryFilter(f)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      historyFilter === f
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-stone-950 text-stone-400 border border-stone-850 hover:text-stone-200'
                    }`}
                  >
                    {f === 'ALL' ? (isKhmer ? 'ទាំងអស់' : 'All') : f === 'ACTIVE' ? (isKhmer ? 'កំពុងដំណើរការ' : 'Active') : (isKhmer ? 'បានបញ្ចប់' : 'Completed')}
                  </button>
                ))}
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-4 bg-stone-950/50 rounded-3xl border border-stone-850">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Package className="w-7 h-7 opacity-80" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-stone-200 text-sm">
                      {isKhmer ? 'មិនទាន់មានប្រវត្តិកុម្ម៉ង់ក្នុងផ្នែកនេះទេ' : 'No orders found in this section'}
                    </p>
                    <p className="text-xs text-stone-400 max-w-sm mx-auto">
                      {isKhmer 
                        ? 'រាល់ការកុម្ម៉ង់របស់អ្នកនឹងបង្ហាញនៅទីនេះ ជាមួយការតាមដាន Live Rider និងទាញយកវិក្កយបត្រផ្លូវការ។' 
                        : 'Orders you place online will appear here with live rider tracking and downloadable tax invoices.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        const menuEl = document.getElementById('menu');
                        if (menuEl) menuEl.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
                    >
                      <Coffee className="w-3.5 h-3.5" />
                      <span>{isKhmer ? 'កុម្ម៉ង់កាហ្វេឥឡូវនេះ' : 'Order Coffee Now'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCreateDemoOrder}
                      className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-750 text-amber-300 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm hover:border-amber-500/40"
                      title={isKhmer ? 'បង្កើតកុម្ម៉ង់សាកល្បងភ្លាមៗដើម្បីតេស្តមុខងារវិក្កយបត្រ' : 'Create instant test order to preview invoice & tracking'}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isKhmer ? '⚡ បង្កើតកុម្ម៉ង់សាកល្បង' : '⚡ Instant Test Order'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => {
                    const isDelivery = order.orderType === 'DELIVERY';
                    const riel = Math.round((order.total || 0) * 4100).toLocaleString();

                    return (
                      <div
                        key={order.id}
                        className="p-4 rounded-2xl bg-stone-950/80 border border-stone-850 space-y-3 hover:border-stone-750 transition shadow"
                      >
                        {/* Order Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-400 text-sm">
                              #{order.orderNumber || order.id}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isDelivery
                                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                                : 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                            }`}>
                              {isDelivery ? '🛵 Delivery' : '🛍️ Pickup'}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                            order.status === 'COMPLETED'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{order.status || 'IN_PREPARATION'}</span>
                          </span>
                        </div>

                        {/* Items Preview */}
                        <div className="space-y-1.5 border-t border-b border-stone-850/80 py-2.5 text-xs text-stone-300">
                          {(order.items || []).map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="truncate pr-2">
                                <strong className="text-amber-400">{it.quantity}x</strong> {it.nameKm || it.name}
                                {it.size && <span className="text-stone-500 ml-1 font-mono text-[11px]">({it.size})</span>}
                              </span>
                              <span className="font-mono text-stone-300 shrink-0">
                                ${((it.price || it.unitPrice || 0) * (it.quantity || 1)).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Total & Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div>
                            <span className="font-mono font-black text-base text-white">
                              ${(order.total || 0).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-stone-500 block font-normal">
                              ≈ {riel} ៛ • {order.paymentMethod || 'KHQR'} ({order.paymentStatus || 'PAID'})
                            </span>
                          </div>

                          <div className="flex items-center flex-wrap gap-2">
                            {/* Download Official Tax Invoice */}
                            <button
                              type="button"
                              onClick={() => downloadInvoice(order)}
                              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:border-amber-500/50"
                              title="Download Official Tax Invoice (PDF / Print)"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-400" />
                              <span>{isKhmer ? 'ទាញយកវិក្កយបត្រ' : 'Invoice'}</span>
                            </button>

                            {/* Got Product / Mark Received Button */}
                            {order.status !== 'COMPLETED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  try {
                                    soundService.playKaChing();
                                  } catch (e) {}
                                  if (setOrders) {
                                    setOrders((prev) =>
                                      prev.map((o) => (o.id === order.id || o.orderNumber === order.orderNumber ? { ...o, status: 'COMPLETED', isDelivered: true } : o))
                                    );
                                  }
                                  try {
                                    const stored = JSON.parse(localStorage.getItem('aromapos_orders') || '[]');
                                    const updated = stored.map((o) => (o.id === order.id || o.orderNumber === order.orderNumber ? { ...o, status: 'COMPLETED', isDelivered: true } : o));
                                    localStorage.setItem('aromapos_orders', JSON.stringify(updated));
                                  } catch (e) {}
                                  if (showToast) {
                                    showToast(isKhmer ? '🎉 បានបញ្ជាក់ថាទទួលបានកាហ្វេរួចរាល់!' : '🎉 Confirmed received!', 'success');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>{isKhmer ? 'បានទទួលទំនិញ' : 'Got Product'}</span>
                              </button>
                            )}

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
                                <span>{isKhmer ? 'ផែនទីដឹកជញ្ជូន' : 'Live Map'}</span>
                              </button>
                            )}

                            {/* 1-Click Reorder Button */}
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                if (onReorderItems) onReorderItems(order.items);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                              title="Reorder exact drinks"
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

          {/* TAB 2: EDIT PROFILE */}
          {activeTab === 'PROFILE' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Real Profile Photo Uploader Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-950 border border-stone-850 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>{isKhmer ? 'រូបថតផ្ទាល់ខ្លួនពិត (Real Profile Photo)' : 'Real Profile Photo'}</span>
                  </label>
                  <span className="text-[11px] text-stone-500">
                    {isKhmer ? 'JPG, PNG, WebP ឬថតផ្ទាល់ពីទូរស័ព្ទ' : 'JPG, PNG, WebP or Camera'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Photo Preview Box */}
                  <div 
                    className="relative group cursor-pointer shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    title={isKhmer ? 'ចុចទីនេះដើម្បីជ្រើសរើសរូបថតពិត' : 'Click to select real photo'}
                  >
                    {profileAvatar ? (
                      <img
                        src={profileAvatar}
                        alt="Uploaded Profile Photo"
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500 shadow-lg group-hover:border-amber-400 transition"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 text-amber-400 flex flex-col items-center justify-center border-2 border-stone-750 group-hover:border-amber-500/60 transition shadow">
                        <User className="w-8 h-8 opacity-70" />
                        <span className="text-[10px] font-bold text-stone-400 mt-1">No Photo</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-bold">
                      <Camera className="w-5 h-5 text-amber-300" />
                    </div>
                  </div>

                  {/* Upload / Remove Actions */}
                  <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                    <p className="text-xs text-stone-300">
                      {profileAvatar 
                        ? (isKhmer ? '✅ រូបថតពិតរបស់អ្នកត្រូវបានផ្ទុក និងប្រើប្រាស់លើគណនី' : '✅ Real photo active on your account') 
                        : (isKhmer ? 'សូមជ្រើសរើសរូបថតពិតប្រាកដពីទូរស័ព្ទ ឬកុំព្យូទ័ររបស់អ្នក' : 'Upload your real photo from your device gallery or camera')}
                    </p>

                    <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isKhmer ? 'ជ្រើសរើសរូបថតពិត' : 'Upload Real Photo'}</span>
                      </button>

                      {profileAvatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-rose-700/60 text-rose-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isKhmer ? 'លុបរូប' : 'Remove'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isKhmer ? 'ឈ្មោះពេញ (Full Name)' : 'Full Name'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Sok Chenda"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isKhmer ? 'លេខទូរស័ព្ទ (Phone Number)' : 'Phone Number'}</span>
                    </label>
                    {currentCarrier && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentCarrier.color}`}>
                        {currentCarrier.name}
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="010 123 456"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Email & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isKhmer ? 'អ៊ីមែល (Email Address)' : 'Email Address'}</span>
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isKhmer ? 'ខណ្ឌ / តំបន់ (Khan / District)' : 'Khan / District'}</span>
                  </label>
                  <select
                    value={profileDistrict}
                    onChange={(e) => setProfileDistrict(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {PHNOM_PENH_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        Khan {d}, Phnom Penh
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKhmer ? 'អាសយដ្ឋានផ្ទះ / ផ្លូវ (Street & House Delivery Address)' : 'Delivery Address (House #, Street, Sangkat)'}</span>
                </label>
                <textarea
                  rows={2}
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  placeholder="e.g. #45, Street 288, Sangkat Boeng Keng Kang 1, Phnom Penh"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Save Success Banner */}
              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isKhmer ? 'ព័ត៌មានគណនីរបស់អ្នកត្រូវបានកែប្រែដោយជោគជ័យ!' : 'Account profile successfully updated!'}</span>
                </div>
              )}

              {/* Save Button */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-950/30 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>{isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving Changes...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isKhmer ? '💾 រក្សាទុកព័ត៌មានគណនី (Save Profile)' : '💾 Save Changes'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: SAVED ADDRESS */}
          {activeTab === 'ADDRESS' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-950 border border-stone-850 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>{isKhmer ? 'អាសយដ្ឋានដឹកជញ្ជូនចម្បង' : 'Primary Delivery Address'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('PROFILE')}
                  className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-amber-400 hover:text-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isKhmer ? 'កែប្រែ' : 'Edit'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800/80 space-y-1.5">
                <p className="text-stone-200 font-bold text-xs">
                  {customerUser.name} <span className="font-mono text-stone-400 font-normal">({customerUser.phone})</span>
                </p>
                <p className="text-stone-300 leading-relaxed">
                  {customerUser.address || '#45, Street 288, Sangkat BKK1'}, {customerUser.district || 'Boeng Keng Kang'}, Phnom Penh
                </p>
                {customerUser.email && (
                  <p className="text-stone-500 font-mono text-[11px]">
                    ✉️ {customerUser.email}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-stone-400 text-[11px]">
                <Bike className="w-4 h-4 text-amber-400" />
                <span>
                  {isKhmer ? 'អ្នកដឹកជញ្ជូន Aroma Coffee នឹងដឹកជញ្ជូនមកកាន់អាសយដ្ឋាននេះដោយស្វ័យប្រវត្តិ។' : 'Aroma Coffee riders will prioritize this address for instant delivery.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Logout Button */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              logoutCustomer();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'ចាកចេញពីគណនី' : 'Sign Out'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200 font-bold text-xs transition cursor-pointer"
          >
            {isKhmer ? 'បិទ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
