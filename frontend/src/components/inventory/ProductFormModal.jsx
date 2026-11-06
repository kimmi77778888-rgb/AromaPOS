import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  Plus, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  Coffee, 
  DollarSign, 
  Package, 
  Upload, 
  FolderPlus, 
  Trash2, 
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';
import { PHOTO_PRESETS } from '../../services/coffeeData';
import { CategoryModal } from '../pos/CategoryModal';
import { api } from '../../services/api';

export const ProductFormModal = ({ isOpen, onClose, productToEdit = null }) => {
  const { addProduct, updateProduct, categories } = useApp();
  const { t, isKhmer, formatKHR } = useLanguage();

  const [name, setName] = useState('');
  const [nameKm, setNameKm] = useState('');
  const [category, setCategory] = useState('Hot Coffee');
  const [price, setPrice] = useState('4.50');
  const [cost, setCost] = useState('1.25');
  const [stock, setStock] = useState('15');
  const [minStock, setMinStock] = useState('5');
  const [uom, setUom] = useState('Cup');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageTab, setImageTab] = useState('upload'); // 'upload' | 'preset' | 'url'
  const [isDragging, setIsDragging] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setNameKm(productToEdit.nameKm || productToEdit.name || '');
      setCategory(productToEdit.category || 'Hot Coffee');
      setPrice(productToEdit.price ? productToEdit.price.toString() : '4.50');
      setCost(productToEdit.cost !== undefined ? productToEdit.cost.toString() : '1.25');
      setStock(productToEdit.stock !== undefined ? productToEdit.stock.toString() : '15');
      setMinStock(productToEdit.minStock !== undefined ? productToEdit.minStock.toString() : '5');
      setUom(productToEdit.uom || 'Cup');
      setImageUrl(productToEdit.imageUrl || '');
      setDescription(productToEdit.description || '');
      setSku(productToEdit.sku || '');
    } else {
      // Defaults for new product
      setName('');
      setNameKm('');
      setCategory(categories.find((c) => c.id !== 'all')?.id || 'Hot Coffee');
      setPrice('4.50');
      setCost('1.25');
      setStock('15');
      setMinStock('5');
      setUom('Cup');
      setImageUrl(PHOTO_PRESETS[0]?.url || '');
      setDescription('Freshly handcrafted roast with smooth crema and balanced sweetness.');
      setSku(`SKU-${Math.floor(Math.random() * 9000 + 1000)}`);
    }
    setErrors({});
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleProcessFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, imageUrl: 'Please select a valid image file (JPG, PNG, WEBP)' }));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, imageUrl: 'Image file size must be less than 8MB' }));
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.uploadImage(file);
      if (res && res.imageUrl) {
        setImageUrl(res.imageUrl);
        setErrors((prev) => ({ ...prev, imageUrl: '' }));
      }
    } catch (e) {
      setErrors((prev) => ({ ...prev, imageUrl: 'Failed to process image' }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = isKhmer ? 'សូមបញ្ចូលឈ្មោះភេសជ្ជៈ' : 'Product name is required';
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) errs.price = 'Valid price greater than $0 is required';
    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock < 0) errs.stock = 'Stock must be 0 or greater';
    if (!imageUrl.trim()) errs.imageUrl = isKhmer ? 'សូមជ្រើសរើស ឬផ្ទុកឡើងរូបភាព' : 'Product image is required';
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
        categoryKm: categories.find((c) => c.id === category)?.nameKm || category,
        price: parseFloat(price),
        cost: parseFloat(cost) || 0,
        stock: parseInt(stock, 10),
        minStock: parseInt(minStock, 10) || 5,
        uom: uom || 'Cup',
        imageUrl: imageUrl.trim(),
        description: description.trim(),
        sku: sku.trim() || `SKU-${Math.floor(Math.random() * 9000 + 1000)}`
      };

      if (productToEdit && productToEdit.id && !productToEdit.isDuplicate) {
        await updateProduct(productToEdit.id, payload);
      } else {
        await addProduct(payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-6 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-100">
                  {productToEdit?.isDuplicate
                    ? (isKhmer ? 'ចម្លងបង្កើតមុខទំនិញថ្មី' : 'Duplicate Artisan Product')
                    : productToEdit
                    ? (isKhmer ? 'កែប្រែព័ត៌មានមុខទំនិញ' : 'Edit Product Specifications')
                    : (isKhmer ? 'បង្កើតមុខទំនិញថ្មី' : 'Add New Artisan Product')}
                </h3>
                <p className="text-xs text-stone-400">
                  {isKhmer 
                    ? 'ធ្វើបច្ចុប្បន្នភាពផ្ទាល់ទៅកាន់ផ្ទាំង POS និងស្តុកទំនិញ' 
                    : 'Instantly reflects across the POS register and stock ledger'}
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
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name (English) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                  {isKhmer ? 'ឈ្មោះទំនិញ (English)' : 'Product Name (English)'} <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Honey Lavender Cortado"
                  className={`w-full bg-stone-950/80 border rounded-xl py-2.5 px-3.5 text-sm text-stone-100 focus:outline-none transition ${
                    errors.name ? 'border-rose-500' : 'border-stone-800 focus:border-amber-500'
                  }`}
                />
                {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Product Name (Khmer) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                  {isKhmer ? 'ឈ្មោះទំនិញ (ភាសាខ្មែរ)' : 'Product Name (Khmer)'}
                </label>
                <input
                  type="text"
                  value={nameKm}
                  onChange={(e) => setNameKm(e.target.value)}
                  placeholder="e.g. កាហ្វេទឹកឃ្មុំ Cortado"
                  className="w-full bg-stone-950/80 border border-stone-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-sm text-stone-100 focus:outline-none transition font-sans"
                />
              </div>

              {/* Category Dropdown & Quick Add Category Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                    {t('filter_by')} {t('quick_categories')} <span className="text-amber-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ {t('new_category')}</span>
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-stone-950/80 border border-stone-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-sm text-stone-100 focus:outline-none transition"
                >
                  {categories.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-stone-900 text-stone-100">
                      {isKhmer && cat.nameKm ? `${cat.nameKm} (${cat.name})` : cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SKU / Barcode */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                    {isKhmer ? 'លេខកូដទំនិញ / បាកូដ' : 'SKU / Barcode'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setSku(`PRD-${Math.floor(Math.random() * 9000 + 1000)}`)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    🔀 Auto SKU
                  </button>
                </div>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="PRD-COF-001"
                  className="w-full bg-stone-950/80 border border-stone-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-sm text-stone-100 focus:outline-none transition font-mono"
                />
              </div>

              {/* Unit of Measure (UOM) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                  {isKhmer ? 'ខ្នាតទំនិញ (Unit of Measure)' : 'Unit of Measure (UOM)'}
                </label>
                <select
                  value={uom}
                  onChange={(e) => setUom(e.target.value)}
                  className="w-full bg-stone-950/80 border border-stone-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-sm text-stone-100 focus:outline-none transition"
                >
                  <option value="Cup">{isKhmer ? 'កែវ (Cup)' : 'Cup'}</option>
                  <option value="Bottle">{isKhmer ? 'ដប (Bottle)' : 'Bottle'}</option>
                  <option value="Can">{isKhmer ? 'កំប៉ុង (Can)' : 'Can'}</option>
                  <option value="Piece">{isKhmer ? 'ដុំ / នំ (Piece)' : 'Piece'}</option>
                  <option value="Pack">{isKhmer ? 'កញ្ចប់ (Pack)' : 'Pack'}</option>
                  <option value="Box">{isKhmer ? 'ប្រអប់ (Box)' : 'Box'}</option>
                  <option value="Kg">{isKhmer ? 'គីឡូក្រាម (Kg)' : 'Kg'}</option>
                </select>
              </div>

              {/* Selling Price ($) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                    {isKhmer ? 'តម្លៃលក់ (Selling Price $)' : 'Selling Price ($)'} <span className="text-amber-500">*</span>
                  </label>
                  <span className="text-[11px] text-amber-500 font-bold font-mono">
                    &asymp; {formatKHR(parseFloat(price) || 0)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0.10"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="4.50"
                    className={`w-full bg-stone-950/80 border rounded-xl py-2.5 pl-8 pr-3 text-sm text-stone-100 focus:outline-none transition font-mono ${
                      errors.price ? 'border-rose-500' : 'border-stone-800 focus:border-amber-500'
                    }`}
                  />
                </div>
                {errors.price && <p className="text-rose-400 text-xs mt-1">{errors.price}</p>}
              </div>

              {/* Cost Price ($) & Profit Margin */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                    {isKhmer ? 'ថ្លៃដើម (Cost Price / COGS $)' : 'Cost Price ($)'}
                  </label>
                  {parseFloat(price) > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      parseFloat(price) >= parseFloat(cost)
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}>
                      {parseFloat(price) >= parseFloat(cost)
                        ? `+${((parseFloat(price) - parseFloat(cost)) || 0).toFixed(2)}$ (${(((parseFloat(price) - parseFloat(cost)) / parseFloat(price)) * 100).toFixed(0)}%)`
                        : 'Warning: Negative Margin'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="1.25"
                    className="w-full bg-stone-950/80 border border-stone-800 focus:border-amber-500 rounded-xl py-2.5 pl-8 pr-3 text-sm text-stone-100 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* Current Stock Count */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                  {isKhmer ? 'ចំនួនស្តុកបច្ចុប្បន្ន' : 'Current Stock'} ({uom}) <span className="text-amber-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="15"
                  className={`w-full bg-stone-950/80 border rounded-xl py-2.5 px-3.5 text-sm text-stone-100 focus:outline-none transition font-mono ${
                    errors.stock ? 'border-rose-500' : 'border-stone-800 focus:border-amber-500'
                  }`}
                />
                {parseInt(stock, 10) <= parseInt(minStock, 10) && parseInt(stock, 10) > 0 && (
                  <p className="text-rose-400 text-xs mt-1">⚠️ {isKhmer ? `ស្តុកទាប (≤ ${minStock})` : `Low Stock (≤ ${minStock})`}</p>
                )}
                {errors.stock && <p className="text-rose-400 text-xs mt-1">{errors.stock}</p>}
              </div>

              {/* Minimum Stock Alert Threshold */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                  {isKhmer ? 'កម្រិតព្រមានស្តុកទាប (Min Stock Alert)' : 'Min Stock Alert Threshold'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="5"
                  className="w-full bg-stone-950/80 border border-stone-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-sm text-stone-100 focus:outline-none transition font-mono"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                  {isKhmer ? 'ការពិពណ៌នាអំពីរសជាតិ' : 'Tasting Notes / Description'}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Flavor notes, roast intensity, allergens, origin..."
                  className="w-full bg-stone-950/80 border border-stone-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-sm text-stone-100 focus:outline-none transition"
                />
              </div>

              {/* Real Image Uploader & Presets */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-500" />
                    <span>{t('upload_real_image')}</span> <span className="text-amber-500">*</span>
                  </label>
                  <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setImageTab('upload')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        imageTab === 'upload'
                          ? 'bg-amber-600 text-stone-950 font-bold'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 inline mr-1" />
                      {isKhmer ? 'ផ្ទុករូបភាពពិត' : 'Real Upload'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('preset')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        imageTab === 'preset'
                          ? 'bg-amber-600 text-stone-950 font-bold'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                      {isKhmer ? 'រូបភាពគំរូ' : 'Presets'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('url')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        imageTab === 'url'
                          ? 'bg-amber-600 text-stone-950 font-bold'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5 inline mr-1" />
                      URL
                    </button>
                  </div>
                </div>

                {/* Tab 1: Real Image Upload Dropzone */}
                {imageTab === 'upload' && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />

                    {imageUrl && (
                      <div className="mb-3 p-3 bg-stone-950/80 rounded-2xl border border-stone-800 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={imageUrl}
                            alt="uploaded thumbnail"
                            className="w-14 h-14 rounded-xl object-cover ring-2 ring-amber-500/40 shrink-0"
                          />
                          <div>
                            <span className="text-xs font-bold text-stone-200 block truncate max-w-xs">
                              {imageUrl.startsWith('data:') ? 'Real Image (Local Base64)' : imageUrl.split('/').pop()}
                            </span>
                            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                              <Check className="w-3.5 h-3.5" />
                              {isKhmer ? 'រូបភាពពិតត្រូវបានភ្ជាប់' : 'Real Image Loaded & Ready'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>{t('change_photo')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center transition ${
                        isDragging
                          ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                          : 'border-stone-800 hover:border-amber-500/50 bg-stone-950/40 hover:bg-stone-950/70'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-3 shadow-inner">
                        {isUploading ? (
                          <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                        ) : (
                          <Upload className="w-6 h-6" />
                        )}
                      </div>
                      <span className="text-sm font-bold text-stone-200 block mb-1">
                        {isUploading ? (isKhmer ? 'កំពុងដំណើរការរូបភាព...' : 'Processing Real Image...') : t('drag_drop_image')}
                      </span>
                      <p className="text-xs text-stone-500 max-w-sm">
                        {t('supports_formats')}
                      </p>
                      <button
                        type="button"
                        className="mt-3 px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold transition"
                      >
                        {t('choose_real_file')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 2: Barista Preset Picker */}
                {imageTab === 'preset' && (
                  <div>
                    <span className="text-[11px] text-stone-500 block mb-2">
                      {t('or_choose_preset')}
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {PHOTO_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImageUrl(preset.url)}
                          className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition ${
                            imageUrl === preset.url
                              ? 'border-amber-500 bg-amber-600/20 text-amber-300 ring-2 ring-amber-500/20'
                              : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:border-stone-700'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-8 h-8 rounded-lg object-cover shrink-0"
                          />
                          <span className="text-[10px] font-medium truncate">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 3: Direct URL Input */}
                {imageTab === 'url' && (
                  <div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className={`w-full bg-stone-950/80 border rounded-xl py-2.5 px-3.5 text-sm text-stone-100 focus:outline-none transition ${
                        errors.imageUrl ? 'border-rose-500' : 'border-stone-800 focus:border-amber-500'
                      }`}
                    />
                  </div>
                )}

                {errors.imageUrl && (
                  <p className="text-rose-400 text-xs">{errors.imageUrl}</p>
                )}
              </div>

              {/* Live POS Preview Card */}
              <div className="md:col-span-2 pt-2 border-t border-stone-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-2">
                  {isKhmer ? 'ការមើលគំរូទំនិញលើ POS (Live Preview)' : 'Live POS Terminal Preview'}
                </span>
                <div className="p-3.5 bg-stone-950/80 rounded-2xl border border-stone-800/80 max-w-sm flex gap-3.5 items-center shadow-lg">
                  <img
                    src={imageUrl || PHOTO_PRESETS[0]?.url}
                    alt="preview"
                    className="w-16 h-16 rounded-xl object-cover ring-1 ring-amber-500/30 shrink-0"
                    onError={(e) => {
                      e.target.src = PHOTO_PRESETS[0]?.url;
                    }}
                  />
                  <div className="overflow-hidden flex-1">
                    <h5 className="text-xs font-bold text-stone-100 truncate">
                      {isKhmer ? (nameKm || name || 'ឈ្មោះភេសជ្ជៈ') : (name || 'Coffee Item Name')}
                    </h5>
                    <span className="text-[10px] text-amber-500 font-medium">
                      {isKhmer ? (categories.find((c) => c.id === category)?.nameKm || category) : category}
                    </span>
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <div>
                        <span className="text-sm font-extrabold text-amber-400">
                          ${parseFloat(price || '0').toFixed(2)}
                        </span>
                        <span className="text-[10px] text-stone-500 block">
                          {formatKHR(parseFloat(price || '0'))}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          parseInt(stock, 10) <= 5
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {parseInt(stock, 10) <= 5 ? `Low (${stock})` : `${stock} ${t('in_stock')}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-stone-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 font-semibold text-xs transition"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs shadow-md shadow-amber-950/50 transition duration-200 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting
                  ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...')
                  : productToEdit?.isDuplicate
                  ? (isKhmer ? 'ចម្លងបង្កើតទំនិញ' : 'Create Duplicated Product')
                  : productToEdit
                  ? (isKhmer ? 'រក្សាទុកការកែប្រែ' : 'Save Changes')
                  : (isKhmer ? 'បញ្ចូលក្នុងស្តុក' : 'Add to Inventory')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Creation Modal child */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryCreated={(newCat) => {
          setCategory(newCat.id);
        }}
      />
    </>
  );
};
