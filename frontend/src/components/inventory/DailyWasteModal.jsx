import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  Trash2, 
  Coffee, 
  Milk, 
  Croissant, 
  Flame, 
  Scale, 
  AlertTriangle, 
  User, 
  Check, 
  Sparkles,
  DollarSign
} from 'lucide-react';
import { soundService } from '../../services/soundService';

export const WASTE_PRESETS = [
  {
    id: 'DIAL_IN',
    icon: Coffee,
    titleEn: 'Espresso Grinder Dial-In',
    titleKm: 'កិនសាកល្បងម៉ាស៊ីនកាហ្វេ (Dial-In)',
    descEn: 'Morning espresso extraction calibration & purge',
    descKm: 'ការកិនសាកល្បងកម្រិតម៉ត់-គ្រើមពេលព្រឹក',
    defaultType: 'ingredient',
    filterKeywords: ['bean', 'espresso', 'arabica', 'coffee'],
    defaultQty: 100,
    unit: 'g',
    quickAmounts: [50, 100, 150, 200],
    reasonCode: 'DIAL_IN'
  },
  {
    id: 'MILK_PURGE',
    icon: Milk,
    titleEn: 'Milk Steaming Waste & Purge',
    titleKm: 'ចាក់ចោលទឹកដោះគោ & សម្អាតចំហាយ',
    descEn: 'Steam wand purging, pitcher leftovers, or overheating',
    descKm: 'ទឹកដោះគោក្តៅពេក ឬសល់ក្នុងកែវកម្តៅ',
    defaultType: 'ingredient',
    filterKeywords: ['milk', 'oat', 'dairy', 'fresh'],
    defaultQty: 500,
    unit: 'ml',
    quickAmounts: [250, 500, 1000, 2000],
    reasonCode: 'SPILLAGE'
  },
  {
    id: 'EXPIRED_PASTRY',
    icon: Croissant,
    titleEn: 'Bakery & Food Expiration',
    titleKm: 'នំហួសកាលកំណត់ / ខូចគុណភាព',
    descEn: 'Unsold croissants, pastries, or stale bakery items',
    descKm: 'នំសល់ចុងវេន ឬហួសសុពលភាពបរិភោគ',
    defaultType: 'product',
    filterKeywords: ['bakery', 'croissant', 'muffin', 'cake', 'food', 'pastry'],
    defaultQty: 1,
    unit: 'pcs',
    quickAmounts: [1, 2, 3, 5],
    reasonCode: 'EXPIRED'
  },
  {
    id: 'QC_TASTING',
    icon: Flame,
    titleEn: 'Barista QC & Cupping Tasting',
    titleKm: 'ភ្លក់រសជាតិ & ត្រួតពិនិត្យគុណភាព (QC)',
    descEn: 'Coffee tasting, training, or recipe quality check',
    descKm: 'ការភ្លក់វាយតម្លៃគុណភាពគ្រាប់កាហ្វេថ្មី',
    defaultType: 'ingredient',
    filterKeywords: ['bean', 'coffee', 'matcha', 'syrup'],
    defaultQty: 36,
    unit: 'g',
    quickAmounts: [18, 36, 54, 72],
    reasonCode: 'STAFF_CONSUMPTION'
  }
];

export const DailyWasteModal = ({ isOpen, onClose }) => {
  const { 
    ingredients = [], 
    products = [], 
    recordStockAdjustment, 
    user, 
    showToast 
  } = useApp();

  const { isKhmer, khrExchangeRate = 4100, formatUSD, formatKHR } = useLanguage();

  const [activePreset, setActivePreset] = useState('DIAL_IN');
  const [targetType, setTargetType] = useState('ingredient'); // 'ingredient' | 'product'
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Preset definition
  const currentPresetDef = useMemo(() => {
    return WASTE_PRESETS.find(p => p.id === activePreset) || WASTE_PRESETS[0];
  }, [activePreset]);

  // Filtered available items based on active preset
  const selectableItems = useMemo(() => {
    if (targetType === 'ingredient') {
      const keywords = currentPresetDef.filterKeywords || [];
      const matched = ingredients.filter(i => 
        keywords.some(kw => i.name.toLowerCase().includes(kw))
      );
      return matched.length > 0 ? matched : ingredients;
    } else {
      const keywords = currentPresetDef.filterKeywords || [];
      const matched = products.filter(p => 
        keywords.some(kw => 
          p.name.toLowerCase().includes(kw) || 
          (p.category && p.category.toLowerCase().includes(kw))
        )
      );
      return matched.length > 0 ? matched : products;
    }
  }, [targetType, currentPresetDef, ingredients, products]);

  // When preset changes, automatically pick the most suitable item and default quantity
  useEffect(() => {
    if (!isOpen) return;

    setTargetType(currentPresetDef.defaultType);
    setQuantity(String(currentPresetDef.defaultQty));
    setNotes(currentPresetDef.titleEn);

    const pool = currentPresetDef.defaultType === 'ingredient' ? ingredients : products;
    const keywords = currentPresetDef.filterKeywords || [];
    const bestMatch = pool.find(item => 
      keywords.some(kw => item.name.toLowerCase().includes(kw))
    ) || pool[0];

    if (bestMatch) {
      setSelectedItemId(bestMatch.id);
    }
  }, [activePreset, isOpen, currentPresetDef, ingredients, products]);

  if (!isOpen) return null;

  // Selected item details
  const selectedItem = targetType === 'ingredient'
    ? ingredients.find(i => i.id === selectedItemId)
    : products.find(p => p.id === selectedItemId);

  const unitName = selectedItem?.unit || selectedItem?.uom || (targetType === 'ingredient' ? 'g' : 'pcs');
  const unitCost = targetType === 'ingredient' 
    ? (selectedItem?.costPerUnit || 0) 
    : (selectedItem?.cost || (selectedItem?.price ? selectedItem.price * 0.35 : 0));

  const parsedQty = parseFloat(quantity) || 0;
  const currentStock = selectedItem ? (selectedItem.stock || 0) : 0;
  const newStockPreview = Math.max(0, Math.round((currentStock - parsedQty) * 100) / 100);
  const totalCostLoss = Math.round(unitCost * parsedQty * 100) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId) {
      if (showToast) showToast(isKhmer ? 'សូមជ្រើសរើសមុខទំនិញ' : 'Please select an item', 'error');
      return;
    }
    if (parsedQty <= 0) {
      if (showToast) showToast(isKhmer ? 'បរិមាណត្រូវតែធំជាង ០' : 'Quantity must be greater than 0', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      soundService.playPaymentSuccessSound();

      await recordStockAdjustment({
        productId: targetType === 'product' ? selectedItemId : null,
        ingredientId: targetType === 'ingredient' ? selectedItemId : null,
        quantity: -Math.abs(parsedQty), // Always negative for waste
        reason: currentPresetDef.reasonCode,
        reference: `WST-${Date.now().toString().slice(-5)}`,
        notes: `[${currentPresetDef.titleEn}] ${notes || ''}`.trim()
      });

      if (showToast) {
        showToast(
          isKhmer 
            ? `បានកត់ត្រាការខាតបង់ ${selectedItem?.name} (-${parsedQty} ${unitName}) ជោគជ័យ` 
            : `Logged waste: -${parsedQty} ${unitName} of ${selectedItem?.name}`, 
          'success'
        );
      }
      onClose();
    } catch (err) {
      console.error('Waste logging error:', err);
      if (showToast) showToast(err.message || 'Failed to log waste', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-md">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-stone-100">
                  {isKhmer ? 'កត់ត្រាការខូចខាត & កិនសាកល្បង' : 'Daily Waste & Dial-In Logger'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  STANDARD F&B FLOW
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {isKhmer 
                  ? 'កត់ត្រាការចាក់ចោលកាហ្វេសាកល្បង ទឹកដោះគោ និងនំហួសកាលកំណត់តាមស្តង់ដារ'
                  : 'Track barista grinder calibration, steamed milk purge, and stale bakery waste'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Preset Buttons Grid */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">
              {isKhmer ? '១. ជ្រើសរើសប្រភេទការខាតបង់ (Waste Category)' : '1. Select Waste Category:'}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {WASTE_PRESETS.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setActivePreset(preset.id)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-gradient-to-br from-rose-950/80 to-stone-900 border-rose-500 text-stone-100 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/50'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-850'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-rose-500 text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-xs truncate ${isSelected ? 'text-rose-200' : 'text-stone-200'}`}>
                        {isKhmer ? preset.titleKm : preset.titleEn}
                      </p>
                      <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                        {isKhmer ? preset.descKm : preset.descEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item Selector & Type Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider">
                {isKhmer ? '២. ជ្រើសរើសមុខទំនិញជាក់លាក់' : '2. Specific Item To Deduct:'}
              </label>
              <div className="inline-flex rounded-lg bg-stone-950 p-1 border border-stone-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => setTargetType('ingredient')}
                  className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                    targetType === 'ingredient' ? 'bg-stone-800 text-amber-400' : 'text-stone-400'
                  }`}
                >
                  Raw Ingredient
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('product')}
                  className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                    targetType === 'product' ? 'bg-stone-800 text-amber-400' : 'text-stone-400'
                  }`}
                >
                  Bakery / Product
                </button>
              </div>
            </div>

            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 px-3 text-xs text-stone-100 font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              {selectableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.nameKm ? `(${item.nameKm})` : ''} — Stock: {item.stock || 0} {item.unit || item.uom || ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Quick Amount Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider">
                {isKhmer ? '៣. បរិមាណខាតបង់ជាក់ស្តែង' : '3. Waste Quantity:'}
              </label>
              <span className="text-[11px] text-stone-400 font-mono">
                Current Stock: <strong className="text-stone-200">{currentStock} {unitName}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="flex-1 bg-stone-950 border border-stone-800 rounded-xl py-2.5 px-3 font-mono text-base font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                required
              />
              <span className="px-3.5 py-2.5 rounded-xl bg-stone-800 text-stone-300 font-mono font-bold text-xs">
                {unitName}
              </span>
            </div>

            {/* Quick Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-stone-500 uppercase font-bold mr-1">Presets:</span>
              {currentPresetDef.quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setQuantity(String(amt))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    quantity === String(amt)
                      ? 'bg-rose-500 text-stone-950 shadow-sm'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                  }`}
                >
                  +{amt} {unitName}
                </button>
              ))}
            </div>
          </div>

          {/* Reason / Operator Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">
              {isKhmer ? '៤. កំណត់សម្គាល់បន្ថែមពី Barista / អ្នកឆុង' : '4. Barista / Shift Notes:'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Grinder burrs recalibrated; 2 shots pulled too fast"
              className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2 px-3 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Financial Impact & Post-Deduction Stock Preview Card */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400 font-medium">Estimated Financial Cost (Food Cost Loss):</span>
              <div className="text-right">
                <span className="text-sm font-black text-rose-400 font-mono">-${totalCostLoss.toFixed(2)}</span>
                <span className="text-[11px] text-stone-500 ml-1.5">({formatKHR(totalCostLoss)})</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-850">
              <span className="text-stone-400 font-medium">Stock After Deduction:</span>
              <span className={`font-mono font-bold ${newStockPreview === 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {currentStock} → {newStockPreview} {unitName}
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/80 transition cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Logging Waste...' : 'Confirm & Log Waste'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

