import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  ArrowDownToLine, 
  Scale, 
  Check, 
  Coffee, 
  Layers, 
  Truck, 
  FileText, 
  AlertTriangle,
  Calendar,
  User,
  DollarSign
} from 'lucide-react';
import { soundService } from '../../services/soundService';

export const STOCK_ADJUSTMENT_REASONS = [
  { id: 'SPOILAGE', labelKm: '🗑️ ខូចគុណភាព / ហួសកាលកំណត់', labelEn: '🗑️ Spoilage / Expired', isNegative: true },
  { id: 'SPILLAGE', labelKm: '💥 កំពប់ / ខូចខាតក្នុងដំណើរការឆុង', labelEn: '💥 Spillage / Prep Waste', isNegative: true },
  { id: 'ADJUST_CORRECTION', labelKm: '⚖️ កែតម្រូវការរាប់ស្តុកជាក់ស្តែង', labelEn: '⚖️ Physical Count Discrepancy', isNegative: false },
  { id: 'RETURN', labelKm: '↩️ ប្រគល់ត្រឡប់ទៅអ្នកផ្គត់ផ្គង់វិញ', labelEn: '↩️ Return to Supplier', isNegative: true },
  { id: 'STAFF_CONSUMPTION', labelKm: '☕ ប្រើប្រាស់ផ្ទៃក្នុងបុគ្គលិក / ភ្លក់រសជាតិ', labelEn: '☕ Staff Tasting / Courtesy', isNegative: true }
];

export const COMMON_SUPPLIERS = [
  'Mondulkiri Organic Coffee Farm',
  'Angkor Dairy Farm (Fresh Milk)',
  'Phnom Penh Food & Packaging Co.',
  'Uji Kyoto Matcha Direct Imports',
  'Royal Bakery Wholesale Supplies',
  'Local Wholesale Market'
];

export const StockOperationModal = ({ 
  isOpen, 
  onClose, 
  initialMode = 'STOCK_IN', // 'STOCK_IN' | 'ADJUSTMENT'
  targetItem = null,        // { id, type: 'ingredient' | 'product', ... }
}) => {
  const { 
    products, 
    ingredients, 
    recordStockIn, 
    recordStockAdjustment, 
    user 
  } = useApp();
  const { isKhmer, khrExchangeRate = 4100 } = useLanguage();

  const [operationType, setOperationType] = useState(initialMode); // 'STOCK_IN' | 'ADJUSTMENT'
  const [itemType, setItemType] = useState('ingredient'); // 'ingredient' | 'product'
  const [selectedItemId, setSelectedItemId] = useState('');
  
  // Stock In fields
  const [quantity, setQuantity] = useState('100');
  const [unitCost, setUnitCost] = useState('0.05');
  const [supplier, setSupplier] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  
  // Adjustment fields
  const [adjustmentReason, setAdjustmentReason] = useState('SPOILAGE');
  const [adjustSign, setAdjustSign] = useState('-'); // '-' for deduction, '+' for count increase
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    setOperationType(initialMode);
    setReference(initialMode === 'STOCK_IN' ? `PO-${Date.now().toString().slice(-5)}` : `ADJ-${Date.now().toString().slice(-4)}`);
    setNotes('');
    setErrors({});

    if (targetItem) {
      if (targetItem.uom || targetItem.price !== undefined) {
        setItemType('product');
        setSelectedItemId(targetItem.id);
        setUnitCost(String(targetItem.cost || 1.25));
        setQuantity('20');
      } else {
        setItemType('ingredient');
        setSelectedItemId(targetItem.id);
        setUnitCost(String(targetItem.costPerUnit || 0.03));
        setQuantity(targetItem.unit === 'ml' ? '1000' : targetItem.unit === 'g' ? '500' : '50');
      }
    } else {
      setItemType('ingredient');
      if (ingredients.length > 0) {
        setSelectedItemId(ingredients[0].id);
        setUnitCost(String(ingredients[0].costPerUnit || 0.03));
        setQuantity(ingredients[0].unit === 'ml' ? '1000' : ingredients[0].unit === 'g' ? '500' : '50');
      }
    }
  }, [isOpen, initialMode, targetItem, ingredients]);

  // Find currently selected item
  const currentItem = useMemo(() => {
    if (itemType === 'product') {
      return products.find(p => p.id === selectedItemId);
    }
    return ingredients.find(i => i.id === selectedItemId);
  }, [itemType, selectedItemId, products, ingredients]);

  // Auto-update unit cost when item changes
  const handleItemSelect = (id) => {
    setSelectedItemId(id);
    if (itemType === 'product') {
      const p = products.find(prod => prod.id === id);
      if (p) {
        setUnitCost(String(p.cost || 1.25));
        setQuantity('10');
      }
    } else {
      const ing = ingredients.find(i => i.id === id);
      if (ing) {
        setUnitCost(String(ing.costPerUnit || 0.03));
        setQuantity(ing.unit === 'ml' ? '1000' : ing.unit === 'g' ? '500' : '50');
      }
    }
  };

  if (!isOpen) return null;

  const currentStock = currentItem ? Number(currentItem.stock || 0) : 0;
  const itemUnit = currentItem ? (currentItem.unit || currentItem.uom || 'units') : 'units';
  const qtyNum = parseFloat(quantity) || 0;
  const costNum = parseFloat(unitCost) || 0;

  // Calculate projected new balance
  let projectedStock = currentStock;
  if (operationType === 'STOCK_IN') {
    projectedStock = Math.round((currentStock + qtyNum) * 100) / 100;
  } else {
    const delta = adjustSign === '-' ? -qtyNum : qtyNum;
    projectedStock = Math.max(0, Math.round((currentStock + delta) * 100) / 100);
  }

  const totalCostUSD = Math.round(qtyNum * costNum * 100) / 100;
  const totalCostKHR = Math.round(totalCostUSD * khrExchangeRate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId) {
      setErrors({ item: isKhmer ? 'សូមជ្រើសរើសមុខទំនិញ ឬវត្ថុធាតុដើម' : 'Please select an item' });
      return;
    }
    if (qtyNum <= 0) {
      setErrors({ quantity: isKhmer ? 'បរិមាណត្រូវតែធំជាង ០' : 'Quantity must be greater than 0' });
      return;
    }

    setIsSubmitting(true);
    try {
      soundService.playPaymentSuccessSound();

      if (operationType === 'STOCK_IN') {
        await recordStockIn({
          productId: itemType === 'product' ? selectedItemId : null,
          ingredientId: itemType === 'ingredient' ? selectedItemId : null,
          quantity: qtyNum,
          unitCost: costNum,
          supplier: supplier.trim() || 'Standard Vendor',
          reference: reference.trim() || `PO-${Date.now().toString().slice(-4)}`,
          notes: notes.trim() || 'Stock received',
          uom: itemUnit
        });
      } else {
        const finalDelta = adjustSign === '-' ? -qtyNum : qtyNum;
        await recordStockAdjustment({
          productId: itemType === 'product' ? selectedItemId : null,
          ingredientId: itemType === 'ingredient' ? selectedItemId : null,
          quantity: finalDelta,
          reason: adjustmentReason,
          reference: reference.trim() || `ADJ-${Date.now().toString().slice(-4)}`,
          notes: notes.trim() || 'Inventory audit adjustment'
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Mode Switcher */}
        <div className="px-6 py-5 border-b border-stone-800/80 bg-stone-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                operationType === 'STOCK_IN' 
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50' 
                  : 'bg-rose-950/60 text-rose-400 border-rose-800/50'
              }`}>
                {operationType === 'STOCK_IN' ? <ArrowDownToLine className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base font-black text-stone-100">
                  {operationType === 'STOCK_IN' 
                    ? (isKhmer ? 'កត់ត្រានាំចូលស្តុក (Stock Receiving)' : 'Stock In / Inventory Receiving')
                    : (isKhmer ? 'កែសម្រួល & កត់ត្រាខូចខាត (Adjustment & Spoilage)' : 'Inventory Adjustment & Spoilage')}
                </h2>
                <p className="text-xs text-stone-400">
                  {isKhmer 
                    ? 'ប្រតិបត្តិការនេះនឹងធ្វើបច្ចុប្បន្នភាពស្តុក និងកត់ត្រាក្នុងសៀវភៅសវនកម្ម' 
                    : 'This transaction directly updates live balances and logs to the audit ledger'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-800/60">
            <button
              type="button"
              onClick={() => {
                setOperationType('STOCK_IN');
                setReference(`PO-${Date.now().toString().slice(-5)}`);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                operationType === 'STOCK_IN'
                  ? 'bg-emerald-600 text-stone-950 shadow-md shadow-emerald-950/50'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>{isKhmer ? '១. នាំចូលស្តុក (+ Stock In)' : '1. Receive Stock In'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOperationType('ADJUSTMENT');
                setReference(`ADJ-${Date.now().toString().slice(-4)}`);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                operationType === 'ADJUSTMENT'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{isKhmer ? '២. កែសម្រួល / ខូចខាត (Adjustment)' : '2. Adjust / Spoilage'}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Target Type Selector: Raw Ingredient vs Menu Product */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300">
              {isKhmer ? 'ប្រភេទមុខទំនិញត្រូវប្រតិបត្តិការ' : 'Select Inventory Scope'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setItemType('ingredient');
                  if (ingredients.length > 0) handleItemSelect(ingredients[0].id);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                  itemType === 'ingredient'
                    ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isKhmer ? `វត្ថុធាតុដើម (${ingredients.length})` : `Raw Materials (${ingredients.length})`}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setItemType('product');
                  if (products.length > 0) handleItemSelect(products[0].id);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                  itemType === 'product'
                    ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>{isKhmer ? `មុខទំនិញលក់ (${products.length})` : `Menu Products (${products.length})`}</span>
              </button>
            </div>
          </div>

          {/* Item Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300">
              {itemType === 'ingredient' 
                ? (isKhmer ? 'ជ្រើសរើសវត្ថុធាតុដើម' : 'Select Raw Material') 
                : (isKhmer ? 'ជ្រើសរើសមុខទំនិញ' : 'Select Menu Product')} *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleItemSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 text-xs text-stone-100 focus:outline-none transition cursor-pointer"
            >
              {itemType === 'ingredient' ? (
                ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} {ing.nameKm ? `(${ing.nameKm})` : ''} — ស្តុក: {ing.stock} {ing.unit}
                  </option>
                ))
              ) : (
                products.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} {prod.nameKm ? `(${prod.nameKm})` : ''} — ស្តុក: {prod.stock} {prod.uom || 'Cup'}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Stock Balance Comparison Card */}
          {currentItem && (
            <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  {isKhmer ? 'ស្តុកបច្ចុប្បន្ន' : 'Current Physical Stock'}
                </p>
                <p className="text-lg font-extrabold text-stone-100 font-mono">
                  {currentStock} <span className="text-xs text-stone-400">{itemUnit}</span>
                </p>
              </div>

              <div className="text-center">
                <span className="text-stone-500 text-lg">➔</span>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  {isKhmer ? 'ស្តុកព្យាករណ៍ថ្មី' : 'Projected Balance'}
                </p>
                <p className={`text-lg font-extrabold font-mono ${
                  projectedStock > currentStock 
                    ? 'text-emerald-400' 
                    : projectedStock < currentStock 
                    ? 'text-rose-400' 
                    : 'text-stone-100'
                }`}>
                  {projectedStock} <span className="text-xs text-stone-400">{itemUnit}</span>
                </p>
              </div>
            </div>
          )}

          {/* Operation Details: Stock In vs Adjustment */}
          {operationType === 'STOCK_IN' ? (
            <>
              {/* Quantity & Unit Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
                    <span>{isKhmer ? 'បរិមាណត្រូវនាំចូល' : 'Receiving Quantity'} *</span>
                    <span className="text-[10px] text-amber-400 font-mono">{itemUnit}</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="100"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border text-xs text-stone-100 font-mono focus:outline-none transition ${
                      errors.quantity ? 'border-rose-500' : 'border-stone-800 focus:border-amber-500'
                    }`}
                  />
                  {errors.quantity && <p className="text-[10px] text-rose-400">{errors.quantity}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
                    <span>{isKhmer ? 'ថ្លៃដើមទិញចូលក្នុង១ខ្នាត ($)' : 'Purchase Unit Cost ($)'}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">{Math.round(costNum * khrExchangeRate)}៛</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-500 text-xs">$</span>
                    <input
                      type="number"
                      step="0.001"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      placeholder="0.05"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 text-xs text-stone-100 font-mono focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Total Financial Outlay Card */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    {isKhmer ? 'ចំណាយសរុបលើការទិញ' : 'Total Purchase Outlay'}
                  </p>
                  <p className="text-base font-extrabold text-emerald-300 font-mono">
                    ${totalCostUSD.toFixed(2)} USD
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-stone-300 font-mono">
                    ៛{totalCostKHR.toLocaleString()} KHR
                  </p>
                  <span className="text-[10px] text-stone-400">NBC Rate: $1 = {khrExchangeRate}៛</span>
                </div>
              </div>

              {/* Supplier & Invoice/PO Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-stone-400" />
                    <span>{isKhmer ? 'អ្នកផ្គត់ផ្គង់ (Supplier)' : 'Vendor / Supplier'}</span>
                  </label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. Mondulkiri Coffee Farm"
                    list="suppliers-list"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 text-xs text-stone-100 focus:outline-none transition"
                  />
                  <datalist id="suppliers-list">
                    {COMMON_SUPPLIERS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-stone-400" />
                    <span>{isKhmer ? 'លេខប័ណ្ណ / PO Reference' : 'PO / Invoice #'}</span>
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="PO-12345"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 text-xs text-stone-100 font-mono focus:outline-none transition"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Adjustment Reason & Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">
                  {isKhmer ? 'មូលហេតុនៃការកែសម្រួលស្តុក' : 'Adjustment / Spoilage Reason'}
                </label>
                <div className="space-y-1.5">
                  {STOCK_ADJUSTMENT_REASONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setAdjustmentReason(r.id);
                        if (r.isNegative) setAdjustSign('-');
                      }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold text-left border transition flex items-center justify-between cursor-pointer ${
                        adjustmentReason === r.id
                          ? 'bg-rose-950/60 border-rose-600/60 text-rose-200'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <span>{isKhmer ? r.labelKm : r.labelEn}</span>
                      {adjustmentReason === r.id && <Check className="w-3.5 h-3.5 text-rose-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Delta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300">
                    {isKhmer ? 'ទិសដៅកែតម្រូវ' : 'Adjustment Type'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustSign('-')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        adjustSign === '-'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40'
                          : 'bg-stone-950 text-stone-400 border-stone-800'
                      }`}
                    >
                      {isKhmer ? 'កាត់បន្ថយ (- Waste)' : 'Deduct (- Waste)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustSign('+')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        adjustSign === '+'
                          ? 'bg-emerald-600 text-stone-950 border-emerald-500 shadow-md shadow-emerald-950/40'
                          : 'bg-stone-950 text-stone-400 border-stone-800'
                      }`}
                    >
                      {isKhmer ? 'បន្ថែម (+ Surplus)' : 'Add (+ Surplus)'}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
                    <span>{isKhmer ? 'ចំនួនប្រែប្រួល' : 'Quantity Delta'} *</span>
                    <span className="text-[10px] text-amber-400 font-mono">{itemUnit}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-500 text-xs font-mono font-bold">
                      {adjustSign}
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="10"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 text-xs text-stone-100 font-mono focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Loss / Impact Card */}
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    {adjustSign === '-' 
                      ? (isKhmer ? 'ការខាតបង់ហិរញ្ញវត្ថុ (Loss/Waste Value)' : 'Financial Loss Impact') 
                      : (isKhmer ? 'តម្លៃទ្រព្យស្តុកកើនឡើង' : 'Surplus Inventory Value')}
                  </p>
                  <p className="text-base font-extrabold text-rose-300 font-mono">
                    {adjustSign === '-' ? '-' : '+'}${totalCostUSD.toFixed(2)} USD
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-stone-300 font-mono">
                    {adjustSign === '-' ? '-' : '+'}៛{totalCostKHR.toLocaleString()} KHR
                  </p>
                  <span className="text-[10px] text-stone-400">@ ${costNum.toFixed(3)}/{itemUnit}</span>
                </div>
              </div>
            </>
          )}

          {/* Notes & Auditor */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300">
              {isKhmer ? 'កំណត់សម្គាល់បន្ថែម / មូលហេតុ' : 'Notes / Audit Explanation'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={operationType === 'STOCK_IN' ? 'e.g. Received weekly fresh roast beans' : 'e.g. Dropped milk container during morning rush'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 text-xs text-stone-100 focus:outline-none transition"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-800 hover:bg-stone-800 text-stone-300 font-bold text-xs transition cursor-pointer"
          >
            {isKhmer ? 'បោះបង់' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50 ${
              operationType === 'STOCK_IN'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-stone-950 shadow-emerald-950/40'
                : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950/40'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              {isSubmitting 
                ? (isKhmer ? 'កំពុងដំណើរការ...' : 'Processing...') 
                : operationType === 'STOCK_IN' 
                ? (isKhmer ? 'បញ្ជាក់ការនាំចូលស្តុក' : 'Confirm Stock In') 
                : (isKhmer ? 'បញ្ជាក់ការកែសម្រួល' : 'Confirm Adjustment')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

