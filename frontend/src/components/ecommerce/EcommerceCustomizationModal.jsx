import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Sparkles, 
  Check, 
  Flame, 
  Snowflake, 
  Droplet,
  Coffee,
  Info
} from 'lucide-react';

const SIZES = [
  { id: 'regular', name: 'Regular (12oz)', nameKm: 'ធម្មតា (12oz)', priceAdd: 0 },
  { id: 'large', name: 'Large (16oz)', nameKm: 'ធំ (16oz)', priceAdd: 0.50 }
];

const ICE_LEVELS = [
  { id: '100', name: '100% Standard Ice', nameKm: 'ទឹកកក ១០០% (ស្តង់ដារ)' },
  { id: '50', name: '50% Less Ice', nameKm: 'ទឹកកក ៥០% (តិច)' },
  { id: '0', name: 'No Ice', nameKm: 'គ្មានទឹកកក (No Ice)' }
];

const SWEETNESS_LEVELS = [
  { id: '100', name: '100% Normal Sweet', nameKm: 'ផ្អែមធម្មតា (១០០%)' },
  { id: '70', name: '70% Less Sweet', nameKm: 'ផ្អែមតិច (៧០%)' },
  { id: '50', name: '50% Half Sweet', nameKm: 'ផ្អែមកន្លះ (៥០%)' },
  { id: '0', name: '0% No Sugar', nameKm: 'មិនដាក់ស្ករ (០%)' }
];

const MILK_OPTIONS = [
  { id: 'dairy', name: 'Fresh Whole Milk', nameKm: 'ទឹកដោះគោស្រស់សុទ្ធ', priceAdd: 0 },
  { id: 'oat', name: 'Oatly Barista Oat Milk', nameKm: 'ទឹកដោះគោអូត (Oat Milk)', priceAdd: 0.75 },
  { id: 'almond', name: 'Organic Almond Milk', nameKm: 'ទឹកដោះគោអាល់ម៉ុន', priceAdd: 0.75 },
  { id: 'soy', name: 'Silk Soy Milk', nameKm: 'ទឹកដោះគោសណ្តែកសៀង', priceAdd: 0.50 }
];

const ADDONS = [
  { id: 'extra_shot', name: 'Extra Espresso Shot', nameKm: 'ថែម Espresso ១ ប្លុក', price: 0.80 },
  { id: 'caramel', name: 'House Salted Caramel Drizzle', nameKm: 'ថែមទឹកការ៉ាមែលប្រៃ', price: 0.50 },
  { id: 'whip', name: 'Whipped Cream', nameKm: 'ថែមក្រែមម៉ដ្ឋ (Whipped Cream)', price: 0.50 },
  { id: 'jelly', name: 'Coffee Jelly Cube', nameKm: 'ថែមចាហួយកាហ្វេ', price: 0.60 }
];

export const EcommerceCustomizationModal = ({ product, isOpen, onClose, onAddToCart }) => {
  const { isKhmer } = useLanguage();

  const [size, setSize] = useState('regular');
  const [ice, setIce] = useState('100');
  const [sweetness, setSweetness] = useState('100');
  const [milk, setMilk] = useState('dairy');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [specialNote, setSpecialNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Reset when product changes
  useEffect(() => {
    if (product) {
      setSize('regular');
      setIce(product.category?.includes('Hot') ? '0' : '100');
      setSweetness('100');
      setMilk('dairy');
      setSelectedAddons([]);
      setSpecialNote('');
      setQuantity(1);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const isDrink = !['Artisan Bakery', 'Whole Bean Bags', 'Merchandise'].includes(product.category);
  const isHotDrink = product.category?.includes('Hot');

  // Calculate Unit & Total Price
  const sizeObj = SIZES.find((s) => s.id === size);
  const sizeCost = isDrink ? (sizeObj?.priceAdd || 0) : 0;
  const milkObj = MILK_OPTIONS.find((m) => m.id === milk);
  const milkCost = isDrink ? (milkObj?.priceAdd || 0) : 0;
  const addonsCost = isDrink
    ? selectedAddons.reduce((sum, addId) => {
        const item = ADDONS.find((a) => a.id === addId);
        return sum + (item?.price || 0);
      }, 0)
    : 0;

  const unitPrice = (product.price || 0) + sizeCost + milkCost + addonsCost;
  const totalPrice = Math.round(unitPrice * quantity * 100) / 100;
  const rielPrice = Math.round(totalPrice * 4100).toLocaleString();

  const toggleAddon = (id) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    const customizedItem = {
      productId: product.id,
      name: product.name,
      nameKm: product.nameKm || product.name,
      category: product.category,
      imageUrl: product.imageUrl,
      basePrice: product.price,
      unitPrice,
      totalPrice,
      quantity,
      size: isDrink ? sizeObj?.name : 'Standard',
      sizeKm: isDrink ? sizeObj?.nameKm : 'ស្តង់ដារ',
      ice: isDrink ? (isHotDrink ? 'Hot' : `${ice}%`) : null,
      sweetness: isDrink ? `${sweetness}%` : null,
      milk: isDrink ? milkObj?.name : null,
      milkKm: isDrink ? milkObj?.nameKm : null,
      addons: isDrink
        ? selectedAddons.map((id) => {
            const a = ADDONS.find((item) => item.id === id);
            return { id, name: a?.name, nameKm: a?.nameKm, price: a?.price };
          })
        : [],
      specialNote: specialNote.trim()
    };

    onAddToCart(customizedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with image */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden shrink-0 bg-stone-950">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-950/80 border border-stone-700/80 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Product Badge & Title */}
          <div className="absolute bottom-3 left-6 right-6">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-block mb-1.5 backdrop-blur-sm">
              {isKhmer ? (product.categoryKm || product.category) : product.category}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {isKhmer ? (product.nameKm || product.name) : product.name}
            </h3>
            {isKhmer && product.nameKm && product.nameKm !== product.name && (
              <p className="text-xs text-stone-400 font-medium">{product.name}</p>
            )}
          </div>
        </div>

        {/* Scrollable Customization Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-200">
          {/* Description */}
          {product.description && (
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed bg-stone-950/40 p-3.5 rounded-2xl border border-stone-850">
              {product.description}
            </p>
          )}

          {isDrink && (
            <>
              {/* 1. Size Selection */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isKhmer ? 'ជ្រើសរើសទំហំ (Size)' : 'Select Cup Size'}</span>
                  </label>
                  <span className="text-[11px] text-amber-400 font-bold">{isKhmer ? 'ចាំបាច់' : 'Required'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {SIZES.map((s) => {
                    const isSelected = size === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSize(s.id)}
                        className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-950/20'
                            : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs sm:text-sm">{isKhmer ? s.nameKm : s.name}</p>
                          <span className="text-[11px] text-stone-400">
                            {s.priceAdd > 0 ? `+$${s.priceAdd.toFixed(2)}` : (isKhmer ? 'តម្លៃធម្មតា' : 'Standard')}
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-amber-400 bg-amber-500 text-stone-950' : 'border-stone-700'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Ice Level (if not hot drink) */}
              {!isHotDrink && (
                <div className="space-y-2.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                    <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isKhmer ? 'កម្រិតទឹកកក (Ice Level)' : 'Ice Level'}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ICE_LEVELS.map((lvl) => {
                      const isSelected = ice === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setIce(lvl.id)}
                          className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200 shadow'
                              : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300'
                          }`}
                        >
                          <span className="text-xs font-bold block">{lvl.id === '0' ? '0%' : `${lvl.id}%`}</span>
                          <span className="text-[10px] opacity-80 block truncate">{isKhmer ? lvl.nameKm : lvl.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Sweetness / Sugar Level */}
              <div className="space-y-2.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKhmer ? 'កម្រិតជាតិស្ករ (Sweetness Level)' : 'Sweetness Level'}</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {SWEETNESS_LEVELS.map((sw) => {
                    const isSelected = sweetness === sw.id;
                    return (
                      <button
                        key={sw.id}
                        type="button"
                        onClick={() => setSweetness(sw.id)}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow'
                            : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <span className="text-xs font-bold block">{sw.id}%</span>
                        <span className="text-[10px] opacity-80 block truncate">{isKhmer ? sw.nameKm : sw.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Milk Choice */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isKhmer ? 'ជម្រើសទឹកដោះគោ (Milk Alternative)' : 'Milk Choice'}</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {MILK_OPTIONS.map((m) => {
                    const isSelected = milk === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMilk(m.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                            : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <div className="truncate">
                          <p className="font-bold text-xs truncate">{isKhmer ? m.nameKm : m.name}</p>
                          <span className="text-[10px] text-stone-400">
                            {m.priceAdd > 0 ? `+$${m.priceAdd.toFixed(2)}` : (isKhmer ? 'ឥតគិតថ្លៃ' : 'Included')}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Extra Add-ons */}
              <div className="space-y-2.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKhmer ? 'ថែមគ្រឿងបន្ថែម (Add-ons)' : 'Extra Add-ons'}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ADDONS.map((addon) => {
                    const isSelected = selectedAddons.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddon(addon.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-amber-200'
                            : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <p className="font-bold text-xs truncate">{isKhmer ? addon.nameKm : addon.name}</p>
                          <span className="text-[10px] text-amber-400 font-mono">+${addon.price.toFixed(2)}</span>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-amber-500 border-amber-400 text-stone-950' : 'border-stone-700'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Special Instructions Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-stone-300">
              {isKhmer ? 'ចំណាំពិសេសសម្រាប់ Barista' : 'Special Instructions for Barista'}
            </label>
            <input
              type="text"
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              placeholder={isKhmer ? 'ឧ. សូមដាក់ទឹកកកដាច់ដោយឡែក, មិនដាក់កញ្ចប់ជ័រ...' : 'e.g. Separate ice bag, extra napkin...'}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Footer Actions & Price */}
        <div className="p-4 sm:p-6 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-4 shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-2xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 flex items-center justify-center transition cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-mono font-bold text-sm text-stone-100">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Bag Action Button */}
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm flex items-center justify-between transition cursor-pointer shadow-lg shadow-amber-950/40"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{isKhmer ? 'ដាក់ចូលកន្ត្រក' : 'Add to Bag'}</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-base font-black">${totalPrice.toFixed(2)}</span>
              <span className="text-[10px] text-stone-900/80 block font-normal">≈ {rielPrice} ៛</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

