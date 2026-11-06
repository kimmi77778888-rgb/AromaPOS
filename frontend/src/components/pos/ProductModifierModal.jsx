import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Sparkles, Check, Coffee, Flame, Snowflake, Sliders, ShieldAlert } from 'lucide-react';
import { MODIFIER_GROUPS } from '../../services/coffeeData';

export const ProductModifierModal = ({ product, isOpen, onClose, onConfirm }) => {
  const [selectedModifiers, setSelectedModifiers] = useState({
    size: 'sz-sm',
    sweetness: 'sw-100',
    ice: 'ice-100',
    milk: 'm-whole',
    shots: 's-standard',
    syrup: 'syr-none'
  });
  const [customNotes, setCustomNotes] = useState('');

  // Reset modifiers whenever opened with a new product
  useEffect(() => {
    if (product) {
      const isIced = product.category === 'Iced Coffee';
      setSelectedModifiers({
        size: 'sz-reg',
        sweetness: 'sw-100',
        ice: isIced ? 'ice-100' : 'ice-0',
        milk: 'm-whole',
        shots: 's-standard',
        syrup: 'syr-none'
      });
      setCustomNotes('');
    }
  }, [product]);

  // Dynamically calculate additional modifier price (must be called unconditionally)
  const modifierPriceDelta = useMemo(() => {
    let delta = 0;
    MODIFIER_GROUPS.forEach((group) => {
      const selectedId = selectedModifiers[group.id];
      const opt = group.options.find((o) => o.id === selectedId);
      if (opt) delta += opt.price;
    });
    return Math.round(delta * 100) / 100;
  }, [selectedModifiers]);

  // Selected Size Name (must be called unconditionally)
  const selectedSizeOption = useMemo(() => {
    const sizeGroup = MODIFIER_GROUPS.find((g) => g.id === 'size');
    return sizeGroup?.options.find((o) => o.id === selectedModifiers.size);
  }, [selectedModifiers.size]);

  if (!isOpen || !product) return null;

  const handleSelect = (groupId, optionId) => {
    setSelectedModifiers((prev) => ({
      ...prev,
      [groupId]: optionId
    }));
  };

  const finalUnitPrice = Math.round((product.price + modifierPriceDelta) * 100) / 100;

  const getSelectedLabels = () => {
    const labels = [];
    MODIFIER_GROUPS.forEach((group) => {
      const opt = group.options.find((o) => o.id === selectedModifiers[group.id]);
      if (opt) {
        if (group.id === 'size') {
          labels.push(`Size: ${opt.name}`);
        } else if (group.id === 'sweetness' && opt.id !== 'sw-100') {
          labels.push(`Sugar: ${opt.name}`);
        } else if (group.id === 'ice' && opt.id !== 'ice-100') {
          labels.push(`Ice: ${opt.name}`);
        } else if (opt.price > 0) {
          labels.push(opt.name);
        }
      }
    });
    return labels;
  };

  const handleAddToCart = () => {
    const formattedModifiers = {};
    MODIFIER_GROUPS.forEach((g) => {
      const opt = g.options.find((o) => o.id === selectedModifiers[g.id]);
      if (opt) formattedModifiers[g.id] = opt.name;
    });

    onConfirm({
      product,
      modifiers: formattedModifiers,
      modifierLabels: getSelectedLabels(),
      finalUnitPrice,
      notes: customNotes.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center gap-3">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/40 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/60">
                  {product.category}
                </span>
                <span className="text-xs text-stone-400 font-mono">#{product.sku}</span>
              </div>
              <h3 className="text-lg font-bold text-stone-100 mt-0.5">{product.name}</h3>
              <p className="text-xs text-stone-400">
                Base Retail: <strong className="text-amber-400 font-mono">${product.price.toFixed(2)}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customization Options Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* SECTION 1: Cup Size Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-200 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-amber-500" />
                <span>1. Cup Size Selection</span>
              </label>
              <span className="text-[11px] text-amber-400 font-medium">
                Active: {selectedSizeOption?.name}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {MODIFIER_GROUPS.find((g) => g.id === 'size')?.options.map((opt) => {
                const isSelected = selectedModifiers.size === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect('size', opt.id)}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600/20 border-amber-500 text-amber-200 ring-2 ring-amber-500/40 shadow-md'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <span className="text-xs font-bold">{opt.name}</span>
                    <span className="text-[11px] font-mono text-amber-400 font-semibold">
                      {opt.price > 0 ? `+$${opt.price.toFixed(2)}` : 'Standard'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Sweetness & Ice Customization Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Sweetness Score */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800/80">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center justify-between">
                <span>Sweetness Score</span>
                <span className="text-[10px] text-stone-400 lowercase font-mono">Sugar Level</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {MODIFIER_GROUPS.find((g) => g.id === 'sweetness')?.options.map((opt) => {
                  const isSelected = selectedModifiers.sweetness === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect('sweetness', opt.id)}
                      className={`p-2 rounded-xl border text-center transition text-xs font-semibold cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 border-amber-400 text-stone-950 font-bold shadow-sm'
                          : 'bg-stone-900/80 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ice Level Score */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800/80">
              <label className="text-xs font-bold uppercase tracking-wider text-sky-400/90 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Snowflake className="w-3.5 h-3.5" />
                  <span>Ice Level Score</span>
                </span>
                <span className="text-[10px] text-stone-400 lowercase font-mono">Temperature</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {MODIFIER_GROUPS.find((g) => g.id === 'ice')?.options.map((opt) => {
                  const isSelected = selectedModifiers.ice === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect('ice', opt.id)}
                      className={`p-2 rounded-xl border text-center transition text-xs font-semibold cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500 border-sky-400 text-stone-950 font-bold shadow-sm'
                          : 'bg-stone-900/80 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 3: Premium Milk Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center justify-between">
              <span>Milk Base Selection</span>
              <span className="text-[10px] text-stone-500">Plant-based & Dairy</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MODIFIER_GROUPS.find((g) => g.id === 'milk')?.options.map((opt) => {
                const isSelected = selectedModifiers.milk === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect('milk', opt.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/40 font-semibold'
                        : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-amber-400 bg-amber-500' : 'border-stone-600'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-stone-950 font-bold" />}
                      </div>
                      <span className="truncate">{opt.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-stone-400 ml-1 shrink-0">
                      {opt.price > 0 ? `+$${opt.price.toFixed(2)}` : '+$0'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Extra Espresso Shots & Syrups */}
          <div className="space-y-4">
            {/* Espresso Shots */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center justify-between">
                <span>Espresso Intensity</span>
                <span className="text-[10px] text-amber-500 font-semibold">Caffeine Boost</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MODIFIER_GROUPS.find((g) => g.id === 'shots')?.options.map((opt) => {
                  const isSelected = selectedModifiers.shots === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect('shots', opt.id)}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 text-xs cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/40 font-semibold'
                          : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                      }`}
                    >
                      <span className="truncate text-[11px]">{opt.name}</span>
                      <span className="text-[11px] font-mono text-amber-400 font-semibold">
                        {opt.price > 0 ? `+$${opt.price.toFixed(2)}` : '+$0'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Artisan Syrup */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center justify-between">
                <span>Artisan Syrup Infusions</span>
                <span className="text-[10px] text-stone-500">+$0.60 Upcharge</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MODIFIER_GROUPS.find((g) => g.id === 'syrup')?.options.map((opt) => {
                  const isSelected = selectedModifiers.syrup === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect('syrup', opt.id)}
                      className={`p-2 rounded-xl border text-center transition text-xs font-medium cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/40 font-semibold'
                          : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <span className="truncate block">{opt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Special Preparation Notes */}
          <div className="space-y-1.5 pt-2 border-t border-stone-800">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-300 block">
              Barista Station Special Notes
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Extra hot, double cupped, split milk..."
              className="w-full bg-stone-950/80 border border-stone-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Modal Footer CTA with Real-Time Total Price */}
        <div className="p-5 border-t border-stone-800 bg-stone-950/90 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold block">
              Configured Item Price
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                ${finalUnitPrice.toFixed(2)}
              </span>
              {modifierPriceDelta > 0 && (
                <span className="text-xs text-stone-400 font-mono">
                  (${product.price.toFixed(2)} base + ${modifierPriceDelta.toFixed(2)} mods)
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="py-3 px-6 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-950/50 flex items-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customized Item (${finalUnitPrice.toFixed(2)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
