'use client';

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Coffee, Printer, X, Tag, Clock, User, QrCode } from 'lucide-react';

export const CupStickerModal = ({ isOpen, onClose, order, item }) => {
  const { isKhmer } = useLanguage();

  if (!isOpen || !order || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  const drinkName = item.productName || item.product?.name || 'Artisan Drink';
  const size = item.modifiers?.size || 'Regular (12oz)';
  const sweetness = item.modifiers?.sweetness || '100% Normal';
  const ice = item.modifiers?.ice || 'Normal Ice';
  const milk = item.modifiers?.milk || 'Whole Milk';
  const notes = item.notes || '';
  const dateFormatted = new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-stone-100">
              {isKhmer ? 'បោះពុម្ពស្លាកបិទកែវ (Cup Sticker)' : 'Barista Cup Sticker Label'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-850 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Realistic 50mm Cup Sticker Preview */}
        <div className="p-6 flex flex-col items-center justify-center bg-stone-950/60">
          <p className="text-[11px] text-stone-500 mb-2 font-mono">
            50mm × 40mm Thermal Adhesive Label
          </p>

          <div 
            id="cup-sticker-print" 
            className="w-64 bg-white text-stone-950 p-4 rounded-xl shadow-xl border-2 border-dashed border-stone-300 font-sans text-xs space-y-2 select-text"
          >
            {/* Store & Order Header */}
            <div className="border-b border-stone-900 pb-1.5 flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-tight">☕ Aroma Coffee</span>
              <span className="font-mono font-black text-sm bg-stone-950 text-white px-1.5 py-0.5 rounded">
                {order.orderNumber || `#ORD-${order.id?.slice(-4) || '101'}`}
              </span>
            </div>

            {/* Customer & Buzzer Info */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
              <span>{order.customerName || 'Walk-in Guest'}</span>
              {order.buzzerNumber ? (
                <span className="font-black text-stone-950 bg-stone-200 px-1 rounded">
                  🔔 {order.buzzerNumber}
                </span>
              ) : (
                <span>{order.orderType === 'DINE_IN' ? '🍽️ Dine-In' : '🥡 Takeaway'}</span>
              )}
            </div>

            {/* Bold Drink Name */}
            <div className="py-1">
              <h2 className="text-base font-black leading-tight text-stone-950">
                {drinkName}
              </h2>
              <span className="text-[11px] font-bold text-stone-600 block">
                {size}
              </span>
            </div>

            {/* Custom Modifiers List */}
            <div className="bg-stone-100 p-2 rounded-lg border border-stone-300 text-[11px] space-y-0.5 font-medium text-stone-800">
              <p>• ស្ករ/Sweet: <strong>{sweetness}</strong></p>
              <p>• ទឹកកក/Ice: <strong>{ice}</strong></p>
              {milk !== 'Whole Milk' && <p>• ទឹកដោះគោ/Milk: <strong className="text-amber-800">{milk}</strong></p>}
              {notes && <p className="text-stone-600 italic">Note: "{notes}"</p>}
            </div>

            {/* Sticker Footer */}
            <div className="pt-1 border-t border-stone-300 flex items-center justify-between text-[10px] text-stone-500 font-mono">
              <span>Time: {dateFormatted}</span>
              <span>Barista: {order.cashierName?.split(' ')[0] || 'Staff'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-200 transition"
          >
            {isKhmer ? 'បិទ' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isKhmer ? 'បោះពុម្ពស្លាកកែវ' : 'Print Cup Sticker'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default CupStickerModal;
