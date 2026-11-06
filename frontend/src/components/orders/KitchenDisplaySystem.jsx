import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Coffee, 
  Flame, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChefHat, 
  ShoppingBag, 
  Sparkles, 
  RotateCcw,
  Check,
  Timer,
  Volume2
} from 'lucide-react';

export const KitchenDisplaySystem = () => {
  const { orders, products = [], showToast, user } = useApp();
  const [stationFilter, setStationFilter] = useState('all'); // all, hot, cold, pastry
  const [orderStatuses, setOrderStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem('aromapos_kds_statuses');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const saveStatuses = (next) => {
    setOrderStatuses(next);
    try {
      localStorage.setItem('aromapos_kds_statuses', JSON.stringify(next));
    } catch (e) {}
  };

  const handleUpdateStatus = (orderId, newStatus) => {
    const next = { ...orderStatuses, [orderId]: newStatus };
    saveStatuses(next);
    if (newStatus === 'COMPLETED') {
      showToast(`Ticket #${orderId} marked as completed! Dispatched to pickup counter. ☕`, 'success');
    } else if (newStatus === 'IN_PROGRESS') {
      showToast(`Started brewing order #${orderId}`, 'info');
    }
  };

  const handleResetTicket = (orderId) => {
    const next = { ...orderStatuses };
    delete next[orderId];
    saveStatuses(next);
    showToast(`Ticket #${orderId} recalled to brewing queue`, 'info');
  };

  // Filter orders
  const activeOrders = orders.filter((o) => {
    const status = orderStatuses[o.id] || 'PENDING';
    return status !== 'COMPLETED';
  });

  const completedOrders = orders.filter((o) => {
    const status = orderStatuses[o.id] || 'PENDING';
    return status === 'COMPLETED';
  });

  const getElapsedSeconds = (createdAt) => {
    const created = new Date(createdAt).getTime();
    return Math.max(0, Math.floor((currentTime - created) / 1000));
  };

  const formatElapsed = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-900/40 select-none">
      {/* Top Bar with Live Station Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-md">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-stone-100">Kitchen Display System (KDS)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse">
                  ● LIVE BARISTA QUEUE
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Active drink tickets, cup size specifications, sweetness & ice custom scores, and preparation fulfillment
              </p>
            </div>
          </div>
        </div>

        {/* Station Stat Badges */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-center">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Pending Queue</span>
            <span className="text-xl font-extrabold text-amber-400 font-mono">{activeOrders.length}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-center">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Fulfilled Today</span>
            <span className="text-xl font-extrabold text-emerald-400 font-mono">{completedOrders.length}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-center">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Target Speed</span>
            <span className="text-xl font-extrabold text-stone-200 font-mono">&lt; 3:00</span>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {activeOrders.length === 0 ? (
        <div className="p-16 rounded-3xl bg-stone-900/60 border border-stone-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-stone-100">All Drink Tickets Fulfilled!</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              The beverage station queue is completely clear. Incoming orders from the POS terminal will appear here instantly.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {activeOrders.map((order, index) => {
            const status = orderStatuses[order.id] || 'PENDING';
            const elapsed = getElapsedSeconds(order.createdAt);
            const isDelayed = elapsed > 300; // > 5 mins
            const isWarning = elapsed > 180 && !isDelayed; // > 3 mins

            return (
              <div
                key={order.id}
                className={`rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between ${
                  isDelayed
                    ? 'bg-rose-950/20 border-rose-800/80 ring-1 ring-rose-500/50'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-800/80'
                    : 'bg-stone-900/90 border-stone-800'
                }`}
              >
                {/* Ticket Top Header */}
                <div className="p-4 border-b border-stone-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-base text-amber-400">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.orderType === 'DINE_IN' 
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800' 
                        : 'bg-sky-950/80 text-sky-300 border border-sky-800'
                    }`}>
                      {order.orderType === 'DINE_IN' ? '🍽️ Dine-In' : '🥡 Takeaway'}
                    </span>
                  </div>

                  {/* Elapsed Live Timer */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-xs font-bold border ${
                    isDelayed
                      ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                      : isWarning
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-stone-800 text-stone-300 border-stone-700'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatElapsed(elapsed)}</span>
                  </div>
                </div>

                {/* Customer & Server Info */}
                <div className="px-4 py-2 bg-stone-950/60 border-b border-stone-800/60 flex items-center justify-between text-xs text-stone-400">
                  <span>Guest: <strong className="text-stone-200">{order.customerName || 'Walk-in Guest'}</strong></span>
                  <span>Cashier: <strong className="text-stone-300">{order.cashierName || 'Staff'}</strong></span>
                </div>

                {/* Items Preparation List */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[300px]">
                  {order.items.map((item, idx) => {
                    const itemImg = item.imageUrl || products.find(p => p.id === item.productId || p.name === item.productName)?.imageUrl;
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-stone-950/50 border border-stone-800/80 space-y-1.5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-amber-600/30 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                              {item.quantity}x
                            </span>
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-stone-900 border border-stone-800 shrink-0">
                              {itemImg ? (
                                <img
                                  src={itemImg}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fb = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                    if (fb) fb.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center bg-stone-900 text-stone-600 fallback-icon ${itemImg ? 'hidden' : ''}`}>
                                <Coffee className="w-3.5 h-3.5 text-amber-500/50" />
                              </div>
                            </div>
                            <span className="font-bold text-sm text-stone-100">{item.productName}</span>
                          </div>
                        </div>

                        {/* Modifier Scores & Barista Specs */}
                        {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                          <div className="pl-10 space-y-1 text-xs">
                            {Object.entries(item.modifiers).map(([group, val]) => (
                              <div key={group} className="flex items-center gap-1 text-[11px] text-amber-400/90 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span className="capitalize">{group}:</span>
                                <span className="font-bold text-stone-200">{val}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <p className="pl-10 text-[11px] text-rose-300 italic font-sans bg-rose-950/30 p-1 rounded border border-rose-900/40">
                            Note: "{item.notes}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Action Footer */}
                <div className="p-4 border-t border-stone-800/80 bg-stone-950/80 flex items-center gap-2">
                  {status === 'PENDING' ? (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'IN_PROGRESS')}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg cursor-pointer"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Start Brewing</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Complete & Dispatch</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recently Completed Orders Drawer */}
      {completedOrders.length > 0 && (
        <div className="mt-8 pt-6 border-t border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Recently Fulfilled Beverage Tickets ({completedOrders.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {completedOrders.slice(0, 4).map((o) => (
              <div
                key={o.id}
                className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-stone-300 block">#{o.id.slice(-6).toUpperCase()}</span>
                  <span className="text-[10px] text-stone-500 truncate block max-w-[120px]">{o.customerName || 'Guest'}</span>
                </div>
                <button
                  onClick={() => handleResetTicket(o.id)}
                  className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[10px] text-amber-400 flex items-center gap-1 transition"
                  title="Recall ticket back to brewing queue"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Recall</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
