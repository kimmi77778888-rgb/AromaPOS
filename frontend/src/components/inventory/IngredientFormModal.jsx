import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  Plus, 
  Check, 
  Layers, 
  DollarSign, 
  Package, 
  Truck, 
  AlertTriangle,
  Scale
} from 'lucide-react';

export const INGREDIENT_CATEGORIES = [
  { id: 'Coffee Beans', nameEn: 'Coffee Beans', nameKm: 'គ្រាប់កាហ្វេ', icon: '🫘' },
  { id: 'Dairy & Milk', nameEn: 'Dairy & Milk', nameKm: 'ទឹកដោះគោ & ផលិតផលទឹកដោះគោ', icon: '🥛' },
  { id: 'Syrups & Sauces', nameEn: 'Syrups & Sauces', nameKm: 'ទឹកស៊ីរ៉ូ & ទឹកជ្រលក់', icon: '🍯' },
  { id: 'Powders & Tea', nameEn: 'Powders & Tea', nameKm: 'ម្សៅតែ & ម្សៅឆុង', icon: '🍵' },
  { id: 'Packaging & Cups', nameEn: 'Packaging & Cups', nameKm: 'កែវ & សម្ភារៈវេចខ្ចប់', icon: '🥤' },
  { id: 'Bakery Ingredients', nameEn: 'Bakery Ingredients', nameKm: 'គ្រឿងផ្សំនំប៉័ង-បង្អែម', icon: '🥐' }
];

export const COMMON_UOMS = [
  { id: 'g', label: 'ក្រាម (g)' },
  { id: 'ml', label: 'មីលីលីត្រ (ml)' },
  { id: 'cups', label: 'កែវ (cups)' },
  { id: 'pcs', label: 'ដុំ/គ្រាប់ (pcs)' },
  { id: 'kg', label: 'គីឡូក្រាម (kg)' },
  { id: 'L', label: 'លីត្រ (L)' }
];

export const IngredientFormModal = ({ isOpen, onClose, ingredientToEdit = null }) => {
  const { createIngredient, updateIngredient } = useApp();
  const { isKhmer, khrExchangeRate = 4100 } = useLanguage();

  const [name, setName] = useState('');
  const [nameKm, setNameKm] = useState('');
  const [category, setCategory] = useState('Coffee Beans');
  const [unit, setUnit] = useState('g');
  const [stock, setStock] = useState('1000');
  const [minThreshold, setMinThreshold] = useState('200');
  const [costPerUnit, setCostPerUnit] = useState('0.03');
  const [supplier, setSupplier] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (ingredientToEdit) {
      setName(ingredientToEdit.name || '');
      setNameKm(ingredientToEdit.nameKm || ingredientToEdit.name || '');
      setCategory(ingredientToEdit.category || 'Coffee Beans');
      setUnit(ingredientToEdit.unit || 'g');
      setStock(ingredientToEdit.stock !== undefined ? String(ingredientToEdit.stock) : '0');
      setMinThreshold(ingredientToEdit.minThreshold !== undefined ? String(ingredientToEdit.minThreshold) : '100');
      setCostPerUnit(ingredientToEdit.costPerUnit !== undefined ? String(ingredientToEdit.costPerUnit) : '0.05');
      setSupplier(ingredientToEdit.supplier || '');
    } else {
      setName('');
      setNameKm('');
      setCategory('Coffee Beans');
      setUnit('g');
      setStock('1000');
      setMinThreshold('200');
      setCostPerUnit('0.03');
      setSupplier('');
    }
    setErrors({});
  }, [ingredientToEdit, isOpen]);

  if (!isOpen) return null;

  const costNum = parseFloat(costPerUnit) || 0;
  const costKHR = Math.round(costNum * khrExchangeRate);
  const totalValUSD = Math.round((parseFloat(stock) || 0) * costNum * 100) / 100;
  const totalValKHR = Math.round(totalValUSD * khrExchangeRate);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = isKhmer ? 'សូមបញ្ចូលឈ្មោះជាភាសាអង់គ្លេស' : 'English name is required';
    if (!unit) errs.unit = isKhmer ? 'សូមជ្រើសរើសខ្នាត' : 'Unit is required';
    if (isNaN(parseFloat(stock)) || parseFloat(stock) < 0) {
      errs.stock = isKhmer ? 'ស្តុកត្រូវតែជាចំនួនវិជ្ជមាន' : 'Stock must be 0 or positive';
    }
    if (isNaN(parseFloat(minThreshold)) || parseFloat(minThreshold) < 0) {
      errs.minThreshold = isKhmer ? 'កម្រិតសុវត្ថិភាពមិនត្រឹមត្រូវ' : 'Min threshold must be 0 or positive';
    }
    if (isNaN(costNum) || costNum < 0) {
      errs.costPerUnit = isKhmer ? 'ថ្លៃដើមមិនត្រឹមត្រូវ' : 'Cost must be 0 or positive';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        nameKm: nameKm.trim() || name.trim(),
        category,
        unit,
        stock: parseFloat(stock) || 0,
        minThreshold: parseFloat(minThreshold) || 0,
        costPerUnit: parseFloat(costPerUnit) || 0,
        supplier: supplier.trim() || 'Standard Wholesale'
      };

      if (ingredientToEdit?.id) {
        await updateIngredient(ingredientToEdit.id, payload);
      } else {
        await createIngredient(payload);
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
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-800/80 bg-stone-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-600/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-100">
                {ingredientToEdit 
                  ? (isKhmer ? 'កែប្រែព័ត៌មានវត្ថុធាតុដើម' : 'Edit Raw Material') 
                  : (isKhmer ? 'បង្កើតវត្ថុធាតុដើម / គ្រឿងផ្សំថ្មី' : 'Add New Raw Material')}
              </h2>
              <p className="text-xs text-stone-400">
                {isKhmer 
                  ? 'កំណត់ខ្នាតរង្វាស់ កម្រិតសុវត្ថិភាព និងថ្លៃដើមរូបមន្តផលិត' 
                  : 'Configure UOM, safety threshold, and recipe BOM unit costs'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Names (Khmer & English) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300">
                {isKhmer ? 'ឈ្មោះជាភាសាអង់គ្លេស' : 'Raw Material Name (EN)'} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Colombian Supremo Beans"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none transition ${
                  errors.name ? 'border-rose-500' : 'border-stone-800 focus:border-amber-500'
                }`}
              />
              {errors.name && <p className="text-[10px] text-rose-400">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300">
                {isKhmer ? 'ឈ្មោះជាភាសាខ្មែរ' : 'Raw Material Name (Khmer)'}
              </label>
              <input
                type="text"
                value={nameKm}
                onChange={(e) => setNameKm(e.target.value)}
                placeholder="ឧ. គ្រាប់កាហ្វេ Colombian Supremo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300">
                {isKhmer ? 'ប្រភេទវត្ថុធាតុដើម' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 text-xs text-stone-100 focus:outline-none transition cursor-pointer"
              >
                {INGREDIENT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {isKhmer ? `${c.nameKm} (${c.nameEn})` : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300">
                {isKhmer ? 'ខ្នាតរង្វាស់ (UOM)' : 'Unit of Measurement'} *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {COMMON_UOMS.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setUnit(u.id)}
                    className={`px-2 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      unit === u.id
                        ? 'bg-amber-600 text-stone-950 border-amber-500 shadow-md shadow-amber-950/40'
                        : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stock, Safety Min, and Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Initial / Current Stock */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
                <span>{isKhmer ? 'ស្តុកបច្ចុប្បន្ន' : 'Current Stock'}</span>
                <span className="text-[10px] text-stone-500 font-mono">{unit}</span>
              </label>
              <input
                type="number"
                step="any"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border text-xs text-stone-100 font-mono placeholder:text-stone-600 focus:outline-none transition ${
                  errors.stock ? 'border-rose-500' : 'border-stone-800 focus:border-amber-500'
                }`}
              />
              {errors.stock && <p className="text-[10px] text-rose-400">{errors.stock}</p>}
            </div>

            {/* Min Threshold */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
                <span>{isKhmer ? 'កម្រិតសុវត្ថិភាព' : 'Safety Min'}</span>
                <span className="text-[10px] text-amber-400 font-mono">Alert</span>
              </label>
              <input
                type="number"
                step="any"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                placeholder="100"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border text-xs text-stone-100 font-mono placeholder:text-stone-600 focus:outline-none transition ${
                  errors.minThreshold ? 'border-rose-500' : 'border-stone-800 focus:border-amber-500'
                }`}
              />
              {errors.minThreshold && <p className="text-[10px] text-rose-400">{errors.minThreshold}</p>}
            </div>

            {/* Cost Per Unit */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
                <span>{isKhmer ? 'ថ្លៃដើម/ខ្នាត ($)' : 'Unit Cost ($)'}</span>
                <span className="text-[10px] text-emerald-400 font-mono">{costKHR}៛</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-500 text-xs">$</span>
                <input
                  type="number"
                  step="0.001"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  placeholder="0.05"
                  className={`w-full pl-7 pr-3 py-2.5 rounded-xl bg-stone-950 border text-xs text-stone-100 font-mono placeholder:text-stone-600 focus:outline-none transition ${
                    errors.costPerUnit ? 'border-rose-500' : 'border-stone-800 focus:border-amber-500'
                  }`}
                />
              </div>
              {errors.costPerUnit && <p className="text-[10px] text-rose-400">{errors.costPerUnit}</p>}
            </div>
          </div>

          {/* Supplier & Valuation Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-stone-400" />
                <span>{isKhmer ? 'អ្នកផ្គត់ផ្គង់ទំនិញ' : 'Primary Supplier / Vendor'}</span>
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Mondulkiri Coffee Farm / Angkor Dairy"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none transition"
              />
            </div>

            {/* Asset Valuation Preview */}
            <div className="p-3 rounded-2xl bg-stone-950/70 border border-stone-800/80 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  {isKhmer ? 'តម្លៃទ្រព្យសកម្មស្តុកសរុប' : 'Total Stock Asset Value'}
                </p>
                <p className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
                  ${totalValUSD.toFixed(2)}
                </p>
                <p className="text-[10px] text-stone-500 font-mono">
                  ៛{totalValKHR.toLocaleString()} KHR
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] px-2 py-1 rounded-md bg-stone-900 border border-stone-800 text-stone-300 font-mono">
                  {stock || 0} {unit} @ ${costNum.toFixed(3)}
                </span>
              </div>
            </div>
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
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>
              {isSubmitting 
                ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') 
                : ingredientToEdit 
                ? (isKhmer ? 'ធ្វើបច្ចុប្បន្នភាព' : 'Update Material') 
                : (isKhmer ? 'បង្កើតវត្ថុធាតុដើម' : 'Save Material')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

