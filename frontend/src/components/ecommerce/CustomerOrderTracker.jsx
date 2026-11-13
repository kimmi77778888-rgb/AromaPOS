import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  Search, 
  CheckCircle2, 
  Clock, 
  Bike, 
  Store, 
  Coffee, 
  MapPin, 
  Phone, 
  Sparkles, 
  ChevronRight,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

export const CustomerOrderTracker = ({
  isOpen,
  onClose,
  activeOrder = null,
  allOrders = [],
  onOrderAgain
}) => {
  const { isKhmer } = useLanguage();
  const [searchCode, setSearchCode] = useState('');
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [searchError, setSearchError] = useState('');

  if (!isOpen) return null;

  // Use active order or user's search
  const currentOrder = searchedOrder || activeOrder || (allOrders.length > 0 ? allOrders[0] : null);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchError('');
    const query = searchCode.trim().toLowerCase();
    if (!query) return;

    const found = allOrders.find(
      (o) =>
        (o.orderNumber || '').toLowerCase().includes(query) ||
        (o.customerPhone || '').includes(query) ||
        (o.id || '').toLowerCase().includes(query)
    );

    if (found) {
      setSearchedOrder(found);
    } else {
      setSearchError(isKhmer ? 'រកមិនឃើញការកុម្ម៉ង់តាមលេខកូដនេះទេ' : 'No order found matching this order code or phone.');
    }
  };

  // Determine Current Step (1..4)
  const getStepIndex = (status, orderType) => {
    if (status === 'COMPLETED') return 4;
    if (status === 'READY' || status === 'OUT_FOR_DELIVERY') return 3;
    if (status === 'IN_PREPARATION') return 2;
    return 1; // PENDING or NEW
  };

  const currentStep = currentOrder ? getStepIndex(currentOrder.status, currentOrder.orderType) : 1;

  const steps = [
    {
      num: 1,
      title: isKhmer ? 'បានទទួលការកុម្ម៉ង់' : 'Order Confirmed',
      desc: isKhmer ? 'ប្រព័ន្ធបានកត់ត្រាការកុម្ម៉ង់ចូល POS' : 'Logged into AromaPOS suite',
      icon: Clock
    },
    {
      num: 2,
      title: isKhmer ? 'Barista កំពុងឆុង' : 'Brewing in Kitchen',
      desc: isKhmer ? 'កំពុងរៀបចំភេសជ្ជៈស្រស់ៗតាមរូបមន្ត' : 'Fresh micro-batch brewing',
      icon: Coffee
    },
    {
      num: 3,
      title: currentOrder?.orderType === 'PICKUP' 
        ? (isKhmer ? 'រួចរាល់សម្រាប់មកយក' : 'Ready for Pickup')
        : (isKhmer ? 'កំពុងដឹកជញ្ជូនដល់ផ្ទះ' : 'Out for Delivery'),
      desc: currentOrder?.orderType === 'PICKUP'
        ? (isKhmer ? 'សូមអញ្ជើញមកយកនៅបញ្ជរហាង' : 'Awaiting customer pickup')
        : (isKhmer ? 'អ្នកដឹកជញ្ជូនកំពុងធ្វើដំណើរទៅ' : 'Rider on the way in Phnom Penh'),
      icon: currentOrder?.orderType === 'PICKUP' ? Store : Bike
    },
    {
      num: 4,
      title: isKhmer ? 'បានបញ្ចប់ជោគជ័យ' : 'Enjoy Your Coffee!',
      desc: isKhmer ? 'សូមពិសារកាហ្វេដោយសេចក្តីរីករាយ' : 'Thank you for choosing Aroma Coffee',
      icon: CheckCircle2
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">
                {isKhmer ? 'តាមដានស្ថានភាពការកុម្ម៉ង់ផ្ទាល់' : 'Live Order Tracking'}
              </h3>
              <p className="text-xs text-stone-400">
                Aroma Coffee Storefront • Real-Time Barista & Delivery Telemetry
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-stone-200">
          {/* Order Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder={isKhmer ? 'វាយលេខកូដកុម្ម៉ង់ (ឧ. ORD-ONL-XXXX) ឬលេខទូរស័ព្ទ...' : 'Enter Order Number (e.g. ORD-ONL-1234) or phone...'}
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition cursor-pointer shrink-0"
            >
              {isKhmer ? 'ស្វែងរក' : 'Track'}
            </button>
          </form>
          {searchError && (
            <p className="text-xs text-rose-400 font-medium -mt-3">{searchError}</p>
          )}

          {currentOrder ? (
            <div className="space-y-6">
              {/* Order Highlight Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-stone-950 to-stone-900 border border-stone-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base sm:text-lg font-black text-amber-400">
                      #{currentOrder.orderNumber || currentOrder.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      currentOrder.orderType === 'DELIVERY'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                        : 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                    }`}>
                      {currentOrder.orderType === 'DELIVERY' ? '🛵 Delivery' : '🛍️ Pickup'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1 flex items-center gap-2">
                    <span>{currentOrder.customerName}</span>
                    <span>•</span>
                    <span className="font-mono">{currentOrder.customerPhone}</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {currentOrder.orderType === 'DELIVERY'
                      ? `📍 ${currentOrder.deliveryAddress}`
                      : `🛍️ Pickup at ${currentOrder.pickupBranch?.name || 'Aroma BKK1'}`}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Total</span>
                  <span className="font-mono text-xl font-black text-white">
                    ${(currentOrder.total || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    {currentOrder.paymentMethod} • {currentOrder.paymentStatus || 'PAID'}
                  </span>
                </div>
              </div>

              {/* 4-Step Visual Progress Tracker */}
              <div className="p-4 sm:p-6 rounded-3xl bg-stone-950/90 border border-stone-850 space-y-6">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKhmer ? 'ដំណាក់កាលនៃការរៀបចំភេសជ្ជៈ' : 'Fulfillment Journey'}</span>
                </h4>

                <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-800">
                  {steps.map((st) => {
                    const isDone = currentStep >= st.num;
                    const isCurrent = currentStep === st.num;
                    const Icon = st.icon;

                    return (
                      <div key={st.num} className="relative flex items-start gap-3.5">
                        {/* Milestone dot */}
                        <div className={`absolute -left-6 sm:-left-8 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center border-2 transition shadow-md ${
                          isDone
                            ? 'bg-amber-500 border-amber-400 text-stone-950'
                            : 'bg-stone-900 border-stone-800 text-stone-600'
                        } ${isCurrent ? 'ring-4 ring-amber-500/20 animate-pulse' : ''}`}>
                          <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>

                        {/* Step Details */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2">
                            <h5 className={`font-black text-xs sm:text-sm ${
                              isDone ? 'text-stone-100' : 'text-stone-500'
                            }`}>
                              {st.title}
                            </h5>
                            {isCurrent && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                {isKhmer ? 'កំពុងដំណើរការ' : 'In Progress'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            {st.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items List in this Order */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-400">
                  {isKhmer ? 'ភេសជ្ជៈ & មុខទំនិញក្នុងកុម្ម៉ង់នេះ' : 'Order Summary'}
                </h4>
                <div className="space-y-2">
                  {(currentOrder.items || []).map((it, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-2xl bg-stone-950/60 border border-stone-850 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-stone-200">
                          {it.quantity}x {it.nameKm || it.name}
                        </p>
                        <div className="text-[10px] text-stone-400">
                          {it.size && <span>{it.size} • </span>}
                          {it.sweetness && <span>{it.sweetness} Sugar • </span>}
                          {it.ice && <span>{it.ice} Ice • </span>}
                          {it.milk && <span>{it.milk}</span>}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        ${((it.price || it.unitPrice || 0) * (it.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Need Help Banner */}
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-850 flex items-center justify-between text-xs text-stone-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>{isKhmer ? 'ត្រូវការជំនួយការដឹកជញ្ជូន? ទូរស័ព្ទមកហាងផ្ទាល់:' : 'Need order support? Call store hotline:'}</span>
                </div>
                <a 
                  href="tel:+85523999888" 
                  className="font-mono font-bold text-emerald-400 hover:underline"
                >
                  023 999 888
                </a>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-2 text-stone-500">
              <Clock className="w-8 h-8 mx-auto opacity-50" />
              <p className="text-xs">
                {isKhmer ? 'មិនមានការកុម្ម៉ង់ណាមួយត្រូវបានជ្រើសរើសទេ' : 'No active order currently selected.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition cursor-pointer"
          >
            {isKhmer ? 'ត្រឡប់ក្រោយ' : 'Close Tracker'}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOrderAgain) onOrderAgain();
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'កុម្ម៉ង់បន្ថែមទៀត' : 'Order More Coffee'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
