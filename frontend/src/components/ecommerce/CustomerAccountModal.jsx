import React, { useState, useEffect } from 'react';
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
  Mail
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

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
];

export const CustomerAccountModal = ({
  isOpen,
  onClose,
  onOpenLiveDeliveryMap,
  onReorderItems
}) => {
  const { isKhmer } = useLanguage();
  const { customerUser, logoutCustomer, orders = [], updateCustomerProfile } = useApp();

  const [activeTab, setActiveTab] = useState('ORDERS'); // 'ORDERS' | 'PROFILE' | 'ADDRESS'
  const [historyFilter, setHistoryFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'

  // Profile Edit State
  const [profileName, setProfileName] = useState(customerUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(customerUser?.phone || '');
  const [profileEmail, setProfileEmail] = useState(customerUser?.email || '');
  const [profileDistrict, setProfileDistrict] = useState(customerUser?.district || 'Boeng Keng Kang');
  const [profileAddress, setProfileAddress] = useState(customerUser?.address || '');
  const [profileAvatar, setProfileAvatar] = useState(customerUser?.avatar || AVATAR_PRESETS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (customerUser) {
      setProfileName(customerUser.name || '');
      setProfilePhone(customerUser.phone || '');
      setProfileEmail(customerUser.email || '');
      setProfileDistrict(customerUser.district || 'Boeng Keng Kang');
      setProfileAddress(customerUser.address || '');
      setProfileAvatar(customerUser.avatar || AVATAR_PRESETS[0]);
    }
  }, [customerUser]);

  if (!isOpen || !customerUser) return null;

  // Filter orders associated with this customer
  const cleanPhone = (customerUser.phone || '').replace(/[^0-9]/g, '');
  const userOrders = orders.filter((o) => {
    const oPhone = (o.customerPhone || '').replace(/[^0-9]/g, '');
    const phoneMatch = cleanPhone && oPhone && (cleanPhone.includes(oPhone) || oPhone.includes(cleanPhone));
    const nameMatch = o.customerName && o.customerName.toLowerCase() === (customerUser.name || '').toLowerCase();
    return phoneMatch || nameMatch;
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
        {/* Header Profile Banner */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/40 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <img
              src={customerUser.avatar || AVATAR_PRESETS[0]}
              alt={customerUser.name}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-xl text-white">
                  {customerUser.name}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {customerUser.tier || 'Gold VIP Member'}
                </span>
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
                      ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-sm'
                      : isFinal
                      ? 'bg-amber-950/40 border-amber-600/60 text-amber-400 border-dashed animate-pulse'
                      : 'bg-stone-900 border-stone-800 text-stone-600'
                  }`}
                  title={isFinal ? 'Free Coffee Reward Cup!' : `Stamp #${idx + 1}`}
                >
                  {isStamped ? '☕' : isFinal ? '🎁' : idx + 1}
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
                <div className="py-16 text-center space-y-2 bg-stone-950/40 rounded-3xl border border-stone-850">
                  <Package className="w-10 h-10 mx-auto text-stone-600 opacity-60" />
                  <p className="font-bold text-stone-300">
                    {isKhmer ? 'មិនមានប្រវត្តិកុម្ម៉ង់ក្នុងផ្នែកនេះទេ' : 'No orders found in this section.'}
                  </p>
                  <p className="text-xs text-stone-500">
                    {isKhmer ? 'រាល់ការកុម្ម៉ង់របស់អ្នកនឹងបង្ហាញនៅទីនេះ' : 'Orders you place online will appear here with live tracking.'}
                  </p>
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
              {/* Avatar Selector */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-850 space-y-3">
                <label className="text-xs font-bold text-stone-300 block">
                  {isKhmer ? 'រូបតំណាងគណនី (Profile Avatar)' : 'Profile Avatar'}
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={profileAvatar}
                    alt="Current Avatar"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500 shadow-md"
                  />
                  <div className="flex items-center gap-2">
                    {AVATAR_PRESETS.map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProfileAvatar(av)}
                        className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                          profileAvatar === av ? 'border-amber-400 scale-105 shadow' : 'border-stone-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={av} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
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
