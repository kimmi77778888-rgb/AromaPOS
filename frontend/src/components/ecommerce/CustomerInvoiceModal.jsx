'use client';

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { downloadInvoice } from '../../utils/invoiceDownloader';
import { 
  X, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  Coffee, 
  Bike, 
  Store, 
  MapPin, 
  Phone, 
  Clock, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const CustomerInvoiceModal = ({ 
  order, 
  isOpen, 
  onClose,
  onOpenLiveMap,
  onOpenTracker
}) => {
  const { isKhmer } = useLanguage();
  const { storeInfo } = useApp();

  if (!isOpen || !order) return null;

  const orderNum = order.orderNumber || order.id || `ORD-${Date.now().toString().slice(-6)}`;
  const dateStr = order.createdAt 
    ? new Date(order.createdAt).toLocaleString(isKhmer ? 'km-KH' : [], {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : new Date().toLocaleString(isKhmer ? 'km-KH' : [], { dateStyle: 'medium', timeStyle: 'short' });

  const totalNum = Number(order.total || order.grandTotal || 0);
  const totalUsd = totalNum.toFixed(2);
  const subtotalUsd = Number(order.subtotal || order.total || totalNum).toFixed(2);
  const discountNum = Number(order.discount || 0);
  const deliveryFeeNum = Number(order.deliveryFee || 0);
  const totalRiel = order.rielTotal || Math.round(totalNum * (storeInfo?.currencyRate || 4100)).toLocaleString();

  const isDelivery = order.orderType === 'DELIVERY' || order.fulfillmentType === 'DELIVERY';
  const customerName = order.customerName || 'Customer';
  const customerPhone = order.customerPhone || '';
  const deliveryAddress = order.deliveryAddress || (isDelivery ? 'Phnom Penh City Delivery' : 'Store Pickup');

  const paymentMethod = order.paymentMethod === 'KHQR' || order.paymentMethod === 'QR_CODE'
    ? 'Bakong KHQR'
    : (order.paymentMethod === 'CASH' || order.paymentMethod === 'COD' 
        ? (isKhmer ? 'ទូទាត់ពេលដឹកដល់ (COD)' : 'Cash on Delivery') 
        : (order.paymentMethod || 'Bakong KHQR'));

  const paymentStatus = order.paymentStatus || (order.paymentMethod === 'KHQR' ? 'PAID' : 'PENDING_ON_DELIVERY');
  const isPaid = paymentStatus === 'PAID';

  const handleDownload = () => {
    downloadInvoice(order);
  };

  const handlePrint = () => {
    downloadInvoice(order);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">
                  {isKhmer ? 'វិក្កយបត្រផ្លូវការ (Official Invoice)' : 'Official Tax Invoice'}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isPaid ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-amber-950 text-amber-300 border border-amber-700'
                }`}>
                  {isPaid ? 'PAID ✓' : 'UNPAID'}
                </span>
              </div>
              <p className="text-xs text-stone-400 font-mono">
                #{orderNum} • {dateStr}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body (Realistic Paper Slip Preview) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-950/70 space-y-4">
          {/* Action Ribbon: Quick 1-Click Download and Print */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownload}
              className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-950/40 active:scale-95"
              title="Download clean printable invoice HTML/PDF"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{isKhmer ? 'ទាញយកវិក្កយបត្រ' : 'Download Invoice'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
              title="Print thermal receipt slip"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>{isKhmer ? 'បោះពុម្ព (Print)' : 'Print Receipt'}</span>
            </button>
          </div>

          {/* Actual Thermal Receipt Slip Container */}
          <div className="bg-white text-stone-900 rounded-3xl p-5 sm:p-6 shadow-2xl font-mono text-xs border border-stone-300 relative select-text">
            {/* Store Branding Header */}
            <div className="text-center pb-4 border-b border-dashed border-stone-300 space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-stone-950 text-amber-400 flex items-center justify-center mx-auto text-lg font-black shadow-md">
                ☕
              </div>
              <h4 className="font-extrabold text-base tracking-tight text-stone-950 font-sans">
                {storeInfo?.name || 'Aroma Coffee & Bakery'}
              </h4>
              <p className="text-[11px] text-stone-600 font-sans">
                {storeInfo?.nameKhmer || 'អាហ្រូម៉ា កាហ្វេ & ប៊េកឃឺរី'} • {storeInfo?.tagline || 'Artisan Roastery'}
              </p>
              <p className="text-[10px] text-stone-500">
                {storeInfo?.address || 'Street 57, Sangkat Boeng Keng Kang 1, Phnom Penh'}
              </p>
              <p className="text-[10px] text-stone-500">
                Tel: {storeInfo?.phone || '+855 23 999 881'} • VAT TIN: {storeInfo?.taxId || 'K002-9023412'}
              </p>
            </div>

            {/* Receipt Metadata */}
            <div className="py-3 border-b border-dashed border-stone-300 space-y-1 text-[11px] text-stone-700">
              <div className="flex justify-between">
                <span className="font-bold text-stone-900">INVOICE NO:</span>
                <span className="font-bold text-stone-950">#{orderNum}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{dateStr}</span>
              </div>
              <div className="flex justify-between">
                <span>CUSTOMER:</span>
                <span className="font-bold text-stone-900">{customerName} {customerPhone ? `(${customerPhone})` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>FULFILLMENT:</span>
                <span className="font-bold text-stone-900">
                  {isDelivery ? '🛵 Phnom Penh Delivery' : '🏬 Store Pick Up'}
                </span>
              </div>
              {isDelivery && (
                <div className="flex justify-between pt-0.5">
                  <span className="text-stone-500">ADDRESS:</span>
                  <span className="text-right max-w-[200px] text-[10px] truncate text-stone-800">{deliveryAddress}</span>
                </div>
              )}
              <div className="flex justify-between pt-0.5">
                <span>PAYMENT:</span>
                <span className="font-bold text-emerald-700">
                  {paymentMethod} ({paymentStatus})
                </span>
              </div>
            </div>

            {/* Itemized Table Header */}
            <div className="py-2 border-b border-stone-800 text-[10px] font-bold text-stone-600 flex justify-between">
              <span className="w-1/2">ITEM / CUSTOMIZATION</span>
              <span className="w-1/6 text-center">QTY</span>
              <span className="w-1/6 text-right">PRICE</span>
              <span className="w-1/6 text-right">TOTAL</span>
            </div>

            {/* Itemized Rows */}
            <div className="py-2 border-b border-dashed border-stone-300 space-y-2">
              {(order.items || []).map((item, idx) => {
                const itemName = item.productNameKm || item.nameKm || item.productName || item.name || 'Artisan Drink';
                const qty = item.quantity || 1;
                const unitPrice = Number(item.unitPrice || item.price || 0).toFixed(2);
                const lineTotal = (Number(item.unitPrice || item.price || 0) * qty).toFixed(2);

                const modifiers = [];
                if (item.size) modifiers.push(item.size);
                if (item.ice) modifiers.push(`${item.ice} Ice`);
                if (item.sweetness) modifiers.push(`${item.sweetness} Sugar`);
                if (item.milk && item.milk !== 'Fresh Whole Milk') modifiers.push(item.milk);
                if (Array.isArray(item.addons)) {
                  item.addons.forEach((a) => modifiers.push(typeof a === 'string' ? a : (a.name || 'Addon')));
                }

                return (
                  <div key={idx} className="text-[11px] leading-tight">
                    <div className="flex justify-between items-baseline font-bold text-stone-900">
                      <span className="w-1/2 font-sans truncate">{itemName}</span>
                      <span className="w-1/6 text-center font-mono">{qty}</span>
                      <span className="w-1/6 text-right font-mono">${unitPrice}</span>
                      <span className="w-1/6 text-right font-mono">${lineTotal}</span>
                    </div>
                    {modifiers.length > 0 && (
                      <p className="text-[9.5px] text-stone-500 pl-2 mt-0.5">
                        ↳ {modifiers.join(' • ')}
                      </p>
                    )}
                    {item.specialNote && (
                      <p className="text-[9.5px] text-amber-700 italic pl-2">
                        ↳ Note: {item.specialNote}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 border-b border-stone-800 space-y-1 text-[11px] text-stone-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold font-mono text-stone-900">${subtotalUsd}</span>
              </div>
              {discountNum > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span className="font-bold font-mono">-${discountNum.toFixed(2)}</span>
                </div>
              )}
              {deliveryFeeNum > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span className="font-bold font-mono text-stone-900">${deliveryFeeNum.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] text-stone-500">
                <span>Included VAT (8%):</span>
                <span className="font-mono">${(totalNum * 0.08 / 1.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-stone-300 font-extrabold text-sm sm:text-base text-stone-950">
                <span>GRAND TOTAL:</span>
                <div className="text-right">
                  <span className="font-mono">${totalUsd}</span>
                  <span className="text-[11px] text-stone-600 block font-normal">
                    ≈ {totalRiel} ៛
                  </span>
                </div>
              </div>
            </div>

            {/* Thermal Barcode Graphic */}
            <div className="pt-4 text-center space-y-1.5">
              <div className="h-8 flex items-center justify-center gap-0.5 overflow-hidden">
                {[4, 2, 6, 1, 3, 5, 2, 7, 2, 4, 1, 3, 6, 2, 5, 1, 4, 3, 2, 5, 2, 4, 2, 6, 1, 3, 4, 2, 5].map((w, idx) => (
                  <span key={idx} style={{ width: `${w}px` }} className="h-full bg-stone-950 inline-block" />
                ))}
              </div>
              <p className="text-[10px] font-mono tracking-widest text-stone-600 uppercase">
                *{orderNum}*
              </p>
              <p className="text-[9.5px] text-stone-500 pt-1 border-t border-dashed border-stone-300 font-sans">
                📶 Wi-Fi: <strong className="text-stone-900">{storeInfo?.wifiSsid || 'Aroma_Guest_WiFi'}</strong> | Pass: <strong className="text-stone-900">{storeInfo?.wifiPassword || 'coffeeartisan'}</strong>
              </p>
              <p className="text-[10px] text-stone-500 italic pt-0.5 font-sans">
                {isKhmer 
                  ? 'កាហ្វេកិន និងឆុងស្រស់ៗដោយក្តីស្រលាញ់។ សូមអរគុណ!' 
                  : 'Freshly roasted with passion. Thank you for your order!'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer Actions */}
        <div className="p-4 bg-stone-950 border-t border-stone-850 flex items-center justify-between gap-3 shrink-0">
          {isDelivery && onOpenLiveMap ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLiveMap(order);
              }}
              className="py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-amber-400 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Bike className="w-4 h-4" />
              <span>{isKhmer ? 'ផែនទីដឹកជញ្ជូន (Live Map)' : 'Track Courier on Map'}</span>
            </button>
          ) : (
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isKhmer ? 'វិក្កយបត្រផ្លូវការមានសុពលភាព' : 'Valid Official Receipt'}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{isKhmer ? 'ទាញយកវិក្កយបត្រ' : 'Download Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
