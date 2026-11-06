import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  FolderPlus, 
  Coffee, 
  Flame, 
  Snowflake, 
  Croissant, 
  Sparkles, 
  CupSoda, 
  Utensils, 
  Apple, 
  Beer, 
  Milk, 
  Heart, 
  Award,
  Trash2,
  Check
} from 'lucide-react';

const AVAILABLE_ICONS = [
  { name: 'Coffee', icon: Coffee, label: 'Coffee' },
  { name: 'Flame', icon: Flame, label: 'Hot / Brew' },
  { name: 'Snowflake', icon: Snowflake, label: 'Cold / Ice' },
  { name: 'Croissant', icon: Croissant, label: 'Pastry / Bakery' },
  { name: 'CupSoda', icon: CupSoda, label: 'Cold Drinks' },
  { name: 'Sparkles', icon: Sparkles, label: 'Specialty / Beans' },
  { name: 'Utensils', icon: Utensils, label: 'Food / Meals' },
  { name: 'Apple', icon: Apple, label: 'Fresh / Juice' },
  { name: 'Milk', icon: Milk, label: 'Dairy / Latte' },
  { name: 'Heart', icon: Heart, label: 'VIP / Favorites' },
  { name: 'Award', icon: Award, label: 'Best Seller' }
];

const AVAILABLE_COLORS = [
  { id: 'amber', bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', dot: 'bg-amber-500' },
  { id: 'orange', bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', dot: 'bg-orange-500' },
  { id: 'rose', bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-400', dot: 'bg-rose-500' },
  { id: 'emerald', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  { id: 'sky', bg: 'bg-sky-500/20', border: 'border-sky-500/40', text: 'text-sky-400', dot: 'bg-sky-500' },
  { id: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400', dot: 'bg-purple-500' }
];

export const CategoryModal = ({ isOpen, onClose, categoryToEdit = null, onCategoryCreated = null }) => {
  const { addCategory, updateCategory, deleteCategory } = useApp();
  const { t, isKhmer } = useLanguage();

  const [name, setName] = useState('');
  const [nameKm, setNameKm] = useState('');
  const [icon, setIcon] = useState('Coffee');
  const [color, setColor] = useState('amber');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || '');
      setNameKm(categoryToEdit.nameKm || categoryToEdit.name || '');
      setIcon(categoryToEdit.icon || 'Coffee');
      setColor(categoryToEdit.color || 'amber');
    } else {
      setName('');
      setNameKm('');
      setIcon('Coffee');
      setColor('amber');
    }
    setError('');
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(isKhmer ? 'សូមបញ្ចូលឈ្មោះប្រភេទ (អង់គ្លេស)' : 'Category name in English is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        nameKm: nameKm.trim() || name.trim(),
        icon,
        color
      };

      let saved;
      if (categoryToEdit) {
        saved = await updateCategory(categoryToEdit.id, payload);
      } else {
        saved = await addCategory(payload);
      }

      if (onCategoryCreated) onCategoryCreated(saved);
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToEdit) return;
    if (window.confirm(t('delete_confirm_cat'))) {
      try {
        await deleteCategory(categoryToEdit.id);
        onClose();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const SelectedIconComp = AVAILABLE_ICONS.find((i) => i.name === icon)?.icon || Coffee;
  const selectedColorConfig = AVAILABLE_COLORS.find((c) => c.id === color) || AVAILABLE_COLORS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-100">
                {categoryToEdit ? t('edit_category') : t('create_category')}
              </h3>
              <p className="text-xs text-stone-400">
                {isKhmer 
                  ? 'បង្កើតប្រភេទមុខទំនិញថ្មីសម្រាប់បង្ហាញលើ POS និងរបាយការណ៍' 
                  : 'Add custom product categories for POS tabs and sales reports'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 flex items-center justify-between">
            <span className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
              {isKhmer ? 'ការមើលគំរូ (Preview)' : 'POS Tab Preview'}:
            </span>
            <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-medium ${selectedColorConfig.bg} ${selectedColorConfig.border} ${selectedColorConfig.text}`}>
              <SelectedIconComp className="w-4 h-4" />
              <span>{isKhmer ? (nameKm || name || 'ឈ្មោះប្រភេទ') : (name || 'Category Name')}</span>
            </div>
          </div>

          {/* Category Name (English) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
              {t('category_name_en')} <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Artisan Tea, Smoothies, Breakfast"
              className="w-full bg-stone-950/80 border border-stone-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-sm text-stone-100 focus:outline-none transition"
              required
            />
          </div>

          {/* Category Name (Khmer) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
              {t('category_name_km')} <span className="text-stone-500">(ភាសាខ្មែរ)</span>
            </label>
            <input
              type="text"
              value={nameKm}
              onChange={(e) => setNameKm(e.target.value)}
              placeholder="e.g. តែធម្មជាតិ, ទឹកផ្លែឈើក្រឡុក, អាហារពេលព្រឹក"
              className="w-full bg-stone-950/80 border border-stone-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-sm text-stone-100 focus:outline-none transition"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
              {t('category_icon')}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                      isSelected
                        ? 'bg-amber-600/20 border-amber-500 text-amber-400 ring-2 ring-amber-500/20'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-[10px] truncate max-w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Badge Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
              {t('category_color')}
            </label>
            <div className="flex items-center gap-3">
              {AVAILABLE_COLORS.map((c) => {
                const isSelected = color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition ${c.bg} ${c.border} ${
                      isSelected ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${c.dot}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
            {categoryToEdit && categoryToEdit.id !== 'all' ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isKhmer ? 'លុបប្រភេទ' : 'Delete'}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 transition disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : t('save')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
