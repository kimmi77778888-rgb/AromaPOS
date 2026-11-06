import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Printer, 
  CheckCircle, 
  Coffee, 
  Share2, 
  Sparkles, 
  Receipt, 
  Flame, 
  Snowflake, 
  CheckCircle2, 
  Utensils,
  Tag
} from 'lucide-react';
import { StoreLogo } from '../common/StoreLogo';

export const ReceiptModal = () => {
  const { receiptModalOrder, setReceiptModalOrder, receiptModalView, setReceiptModalView, storeInfo } = useApp();
  const [activeView, setActiveView] = useState(receiptModalView || 'customer'); // 'customer' | 'barista' | 'label'

  React.useEffect(() => {
    if (receiptModalView) {
      setActiveView(receiptModalView);
    }
  }, [receiptModalView]);

  if (!receiptModalOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setReceiptModalOrder(null);
    if (setReceiptModalView) setReceiptModalView('customer');
  };

  const formattedDate = new Date(receiptModalOrder.createdAt || Date.now()).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle className="w-4 h-4" />
            <span>Order #{receiptModalOrder.orderNumber}</span>
          </div>

          {/* View Switcher: Customer Receipt vs Barista Station Ticket vs Cup Sticker Labels */}
          <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveView('customer')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeView === 'customer'
                  ? 'bg-amber-600 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Receipt
            </button>
            <button
              type="button"
              onClick={() => setActiveView('barista')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                activeView === 'barista'
                  ? 'bg-amber-600 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Utensils className="w-3 h-3" />
              <span>Barista</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('label')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                activeView === 'label'
                  ? 'bg-amber-600 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Tag className="w-3 h-3" />
              <span>Cup Labels</span>
            </button>
          </div>

          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Layout Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-950/60 flex items-center justify-center">
          {activeView === 'customer' ? (
            /* VIEW 1: CUSTOMER THERMAL RECEIPT */
            <div
              id="printable-receipt"
              className="bg-stone-100 text-stone-900 p-6 rounded-2xl shadow-2xl font-mono text-xs border border-stone-300 relative w-full max-w-sm"
            >
              {/* Cafe Logo Header */}
              <div className="text-center pb-4 border-b border-dashed border-stone-400 space-y-1">
                <div className="flex justify-center mb-1">
                  <StoreLogo size="receipt" variant="monochrome" />
                </div>
                <h2 className="font-extrabold text-base tracking-widest uppercase">{storeInfo?.name || 'Aroma Roasters'}</h2>
                <p className="text-[10px] text-stone-600">{storeInfo?.address || '742 Artisan Ave, Bean District'}</p>
                <p className="text-[10px] text-stone-600">Tel: {storeInfo?.phone || '+855 23 888 777'}</p>
              </div>

              {/* Order Info */}
              <div className="py-3 border-b border-dashed border-stone-400 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold">Ticket #:</span>
                  <span className="font-bold text-stone-950">{receiptModalOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Date/Time:</span>
                  <span>{formattedDate}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Barista:</span>
                  <span>{receiptModalOrder.cashierName || 'Liam Vance'}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Guest:</span>
                  <span>{receiptModalOrder.customerName || 'Walk-in'}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Order Type:</span>
                  <span className="font-bold uppercase text-stone-900">
                    {receiptModalOrder.orderType === 'DINE_IN' ? '🍽️ Dine In' : '🥡 Takeaway'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-3 border-b border-dashed border-stone-400 space-y-2">
                <div className="flex justify-between font-bold text-stone-700 text-[10px] uppercase">
                  <span>Item & Modifiers</span>
                  <span>Qty x Price</span>
                  <span>Total</span>
                </div>

                {receiptModalOrder.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold truncate max-w-[170px]">{item.productName}</span>
                      <span className="text-stone-600">{item.quantity} @ ${item.unitPrice.toFixed(2)}</span>
                      <span className="font-bold">${item.subtotal.toFixed(2)}</span>
                    </div>

                    {/* Modifiers line */}
                    {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                      <p className="text-[10px] text-stone-600 pl-2">
                        ↳ {Object.values(item.modifiers).join(' • ')}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-[10px] text-stone-500 italic pl-2">
                        ↳ Special: {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="py-3 border-b border-dashed border-stone-400 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span>${receiptModalOrder.subtotal.toFixed(2)}</span>
                </div>

                {receiptModalOrder.discount > 0 && (
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>Discount / Loyalty Applied:</span>
                    <span>-${receiptModalOrder.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-600">
                  <span>Sales Tax (8%):</span>
                  <span>${receiptModalOrder.tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-stone-300">
                  <span>TOTAL PAID:</span>
                  <span>${receiptModalOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="py-2.5 border-b border-dashed border-stone-400 text-[10px] space-y-1 text-stone-600">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-bold uppercase text-stone-900">
                    {receiptModalOrder.paymentMethod === 'KHQR' ? 'KHQR (Bakong)' : receiptModalOrder.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Tendered:</span>
                  <span>${(receiptModalOrder.amountPaid || receiptModalOrder.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900">
                  <span>Change Due:</span>
                  <span>${(receiptModalOrder.change || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Customer Loyalty Reward Score Summary */}
              {receiptModalOrder.loyaltyPointsEarned > 0 && (
                <div className="py-2.5 border-b border-dashed border-stone-400 text-[10px] space-y-1 bg-amber-50 p-2 rounded-lg my-2 border border-amber-200">
                  <div className="flex items-center gap-1 text-amber-800 font-bold">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Aroma Loyalty Club Summary</span>
                  </div>
                  {receiptModalOrder.loyaltyPointsUsed > 0 && (
                    <div className="flex justify-between text-stone-700">
                      <span>Points Redeemed:</span>
                      <span className="font-bold text-rose-700">-{receiptModalOrder.loyaltyPointsUsed} pts</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-700">
                    <span>New Points Earned:</span>
                    <span className="font-bold text-emerald-700">+{receiptModalOrder.loyaltyPointsEarned} pts</span>
                  </div>
                  {receiptModalOrder.newLoyaltyBalance !== undefined && (
                    <div className="flex justify-between text-stone-900 font-extrabold pt-0.5 border-t border-amber-200">
                      <span>Available Balance:</span>
                      <span>{receiptModalOrder.newLoyaltyBalance} Points</span>
                    </div>
                  )}
                </div>
              )}

              {/* Barcode & Footer */}
              <div className="pt-3 text-center space-y-1.5">
                <div className="h-7 flex items-center justify-center gap-1 opacity-80">
                  {[4, 2, 6, 1, 3, 5, 2, 7, 2, 4, 1, 3, 6, 2, 5, 1, 4, 3, 2].map((w, i) => (
                    <span
                      key={i}
                      className="h-full bg-stone-900 inline-block"
                      style={{ width: `${w}px` }}
                    ></span>
                  ))}
                </div>
                <p className="text-[10px] text-stone-600 font-mono tracking-widest">
                  {receiptModalOrder.orderNumber}
                </p>
                {storeInfo?.wifiSsid && (
                  <p className="text-[9px] text-stone-600 font-mono pt-1 border-t border-dashed border-stone-300">
                    📶 Wi-Fi: <span className="font-bold">{storeInfo.wifiSsid}</span> | Pass: <span className="font-bold">{storeInfo.wifiPassword}</span>
                  </p>
                )}
                <p className="text-[10px] text-stone-500 italic">
                  Freshly ground and roasted with passion. Enjoy your coffee!
                </p>
              </div>
            </div>
          ) : activeView === 'barista' ? (
            /* VIEW 2: BARISTA STATION KITCHEN TICKET */
            <div className="bg-amber-50 text-stone-950 p-6 rounded-2xl shadow-2xl font-mono text-xs border-2 border-amber-600 relative w-full max-w-sm">
              <div className="text-center pb-3 border-b-2 border-stone-800 space-y-1">
                <div className="inline-block px-3 py-1 bg-stone-950 text-amber-400 rounded-lg text-xs font-black uppercase tracking-wider mb-1">
                  BARISTA PREPARATION TICKET
                </div>
                <h3 className="text-2xl font-black tracking-tight">{receiptModalOrder.orderNumber}</h3>
                <div className="flex items-center justify-center gap-2 text-[11px] font-bold">
                  <span className="px-2 py-0.5 bg-amber-200 rounded border border-amber-400">
                    {receiptModalOrder.orderType === 'DINE_IN' ? 'DINE-IN TABLE' : 'TAKEAWAY TICKET'}
                  </span>
                  <span>•</span>
                  <span>{receiptModalOrder.customerName || 'Walk-in Guest'}</span>
                </div>
              </div>

              {/* Barista Drink Items with Prominent Specs */}
              <div className="py-4 space-y-4 border-b-2 border-stone-800">
                {receiptModalOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-stone-300 shadow-sm space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-stone-950 text-white font-extrabold flex items-center justify-center text-xs">
                          {item.quantity}x
                        </span>
                        <h4 className="font-extrabold text-sm text-stone-900">{item.productName}</h4>
                      </div>
                    </div>

                    {/* Drink Specs Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.modifiers?.size && (
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-300 font-bold text-[10px]">
                          🥤 {item.modifiers.size}
                        </span>
                      )}
                      {item.modifiers?.sweetness && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[10px]">
                          🍯 Sugar: {item.modifiers.sweetness}
                        </span>
                      )}
                      {item.modifiers?.ice && (
                        <span className="px-2 py-0.5 rounded-md bg-sky-100 border border-sky-300 text-sky-900 font-bold text-[10px]">
                          🧊 Ice: {item.modifiers.ice}
                        </span>
                      )}
                      {item.modifiers?.milk && (
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-300 font-bold text-[10px]">
                          🥛 {item.modifiers.milk}
                        </span>
                      )}
                      {item.modifiers?.shots && (
                        <span className="px-2 py-0.5 rounded-md bg-stone-900 text-white font-bold text-[10px]">
                          ☕ {item.modifiers.shots}
                        </span>
                      )}
                      {item.modifiers?.syrup && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px]">
                          ✨ {item.modifiers.syrup}
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[10px] font-bold">
                        ⚠️ Note: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Ticket Footer */}
              <div className="pt-3 flex items-center justify-between text-[10px] font-bold text-stone-600">
                <span>Dispatched: {formattedDate}</span>
                <span className="text-emerald-700 uppercase font-black">
                  Auto-Printed • Espresso Bar #1
                </span>
              </div>
            </div>
          ) : (
            /* VIEW 3: DRINK CUP STICKERS / ITEM LABELS */
            <div className="w-full max-w-sm space-y-4 py-2">
              <div className="text-center pb-2">
                <span className="text-xs text-stone-400 font-semibold">
                  ☕ Cup Sticker Labels ({receiptModalOrder.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0} Total Units)
                </span>
              </div>

              {receiptModalOrder.items?.flatMap((item, itemIdx) => {
                const qty = item.quantity || 1;
                return Array.from({ length: qty }).map((_, unitIdx) => (
                  <div
                    key={`${itemIdx}-${unitIdx}`}
                    id="printable-cup-label"
                    className="bg-white text-stone-950 p-4 rounded-xl border-2 border-stone-900 shadow-xl font-mono text-xs space-y-2 relative"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-dashed border-stone-400 pb-1.5 text-[10px] font-bold">
                      <span className="flex items-center gap-1 uppercase tracking-wider text-amber-900">
                        ☕ Aroma Roasters
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-stone-900 text-white font-black">
                        #{receiptModalOrder.orderNumber}
                      </span>
                    </div>

                    {/* Customer & Type */}
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="truncate max-w-[140px] text-stone-900">
                        {receiptModalOrder.customerName || 'Walk-in'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-stone-200 text-stone-800 text-[10px] uppercase">
                        {receiptModalOrder.orderType === 'DINE_IN' ? '🍽️ Dine-In' : '🥡 Takeaway'}
                      </span>
                    </div>

                    {/* Product Name */}
                    <div className="pt-0.5">
                      <h4 className="text-sm font-black text-stone-950 tracking-tight leading-tight">
                        {item.productName}
                      </h4>
                    </div>

                    {/* Modifiers List */}
                    {item.modifiers && Object.keys(item.modifiers).length > 0 ? (
                      <div className="text-[11px] space-y-0.5 bg-stone-100 p-2 rounded-lg border border-stone-200">
                        {item.modifiers.size && (
                          <div className="font-bold flex justify-between">
                            <span className="text-stone-600">Size:</span>
                            <span className="text-stone-900">{item.modifiers.size}</span>
                          </div>
                        )}
                        {item.modifiers.sweetness && (
                          <div className="flex justify-between">
                            <span className="text-stone-600">Sweetness:</span>
                            <span className="font-bold text-amber-900">{item.modifiers.sweetness}</span>
                          </div>
                        )}
                        {item.modifiers.ice && (
                          <div className="flex justify-between">
                            <span className="text-stone-600">Ice:</span>
                            <span className="font-bold text-sky-900">{item.modifiers.ice}</span>
                          </div>
                        )}
                        {item.modifiers.milk && (
                          <div className="flex justify-between">
                            <span className="text-stone-600">Milk:</span>
                            <span className="font-bold text-stone-900">{item.modifiers.milk}</span>
                          </div>
                        )}
                        {item.modifiers.shots && (
                          <div className="flex justify-between">
                            <span className="text-stone-600">Shots:</span>
                            <span className="font-bold text-stone-900">{item.modifiers.shots}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[10px] text-stone-500 italic">
                        Standard preparation (no custom modifiers)
                      </div>
                    )}

                    {/* Barista Notes */}
                    {item.notes && (
                      <div className="p-1 bg-amber-50 border border-amber-300 rounded text-amber-950 font-bold text-[10px]">
                        ⚠️ {item.notes}
                      </div>
                    )}

                    {/* Sticker Footer with Barcode Lines */}
                    <div className="pt-1 border-t border-dashed border-stone-400 flex items-center justify-between text-[9px] text-stone-600">
                      <span>Cup {unitIdx + 1} of {qty}</span>
                      <span>{formattedDate}</span>
                    </div>

                    <div className="h-4 flex items-center justify-center gap-0.5 opacity-70">
                      {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 3, 2, 1, 4, 2].map((w, i) => (
                        <span key={i} className="h-full bg-stone-900 inline-block" style={{ width: `${w}px` }}></span>
                      ))}
                    </div>
                  </div>
                ));
              })}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/90 flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>
              Print {activeView === 'customer' ? 'Customer Receipt' : activeView === 'barista' ? 'Kitchen Ticket' : 'Cup Labels'}
            </span>
          </button>
          <button
            onClick={handleClose}
            className="flex-1 py-3 px-4 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 font-semibold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
