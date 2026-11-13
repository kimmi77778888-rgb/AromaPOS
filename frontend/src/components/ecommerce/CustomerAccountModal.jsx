import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
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
  ChevronRight
} from 'lucide-react';

export const CustomerAccountModal = ({
  isOpen,
  onClose,
  onOpenLiveDeliveryMap,
  onReorderItems
}) => {
  const { isKhmer } = useLanguage();
  const { customerUser, logoutCustomer, orders = [] } = useApp();

  const [activeTab, setActiveTab] = useState('ORDERS'); // 'ORDERS' | 'REWARDS' | 'ADDRESS'
  const [historyFilter, setHistoryFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'

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
              src={customerUser.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'}
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
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className="font-mono font-black text-base text-white">
                              ${(order.total || 0).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-stone-500 block font-normal">
                              ≈ {riel} ៛ • {order.paymentMethod || 'KHQR'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
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
                                <span>{isKhmer ? 'មើលទីតាំងដឹកជញ្ជូន' : 'Live Delivery Map'}</span>
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
                              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
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

          {activeTab === 'ADDRESS' && (
            <div className="p-4 rounded-2xl bg-stone-950 border border-stone-850 space-y-3 text-xs">
              <h4 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>{isKhmer ? 'អាសយដ្ឋានដឹកជញ្ជូនចម្បង' : 'Primary Delivery Address'}</span>
              </h4>
              <p className="text-stone-300">
                {customerUser.address || '#45, Street 288, Sangkat BKK1'}, {customerUser.district || 'Khan Boeng Keng Kang'}, Phnom Penh
              </p>
              <p className="text-[11px] text-stone-500">
                Contact: {customerUser.phone} ({customerUser.name})
              </p>
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
