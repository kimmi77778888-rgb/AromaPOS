import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  StoreLogo, 
  PRESET_LOGOS 
} from './StoreLogo';
import { 
  Store, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Sparkles, 
  Check, 
  X, 
  Receipt, 
  Monitor, 
  Phone, 
  MapPin, 
  Wifi, 
  Hash, 
  RotateCcw,
  CheckCircle2,
  Coffee,
  Globe,
  Sliders
} from 'lucide-react';
import { soundService } from '../../services/soundService';

export const StoreSettingsModal = ({ isOpen, onClose }) => {
  const { storeInfo, updateStoreInfo, showToast } = useApp();
  const { isKhmer } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    nameKhmer: '',
    tagline: '',
    taglineKhmer: '',
    logo: '',
    presetLogoId: 'artisan-cup',
    phone: '',
    address: '',
    addressKhmer: '',
    wifiSsid: '',
    wifiPassword: '',
    taxId: ''
  });

  const [activePreviewTab, setActivePreviewTab] = useState('sidebar'); // 'sidebar', 'customer', 'receipt'
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (storeInfo && isOpen) {
      setFormData({
        name: storeInfo.name || 'Aroma Coffee & Bakery',
        nameKhmer: storeInfo.nameKhmer || 'អាហ្រូម៉ា កាហ្វេ & ប៊េកឃឺរី',
        tagline: storeInfo.tagline || 'Artisan Roastery & Espresso Bar',
        taglineKhmer: storeInfo.taglineKhmer || 'ហាងកាហ្វេ Artisan Roastery',
        logo: storeInfo.logo || '',
        presetLogoId: storeInfo.presetLogoId || 'artisan-cup',
        phone: storeInfo.phone || '+855 23 888 777',
        address: storeInfo.address || '742 Artisan Ave, Phnom Penh, Cambodia',
        addressKhmer: storeInfo.addressKhmer || 'ផ្លូវ ៧៤២ មហាវិថីសិល្បៈ រាជធានីភ្នំពេញ',
        wifiSsid: storeInfo.wifiSsid || 'Aroma_Guest_WiFi',
        wifiPassword: storeInfo.wifiPassword || 'coffeeartisan',
        taxId: storeInfo.taxId || 'K002-9023412'
      });
      setUrlInput(storeInfo.logo && storeInfo.logo.startsWith('http') ? storeInfo.logo : '');
    }
  }, [storeInfo, isOpen]);

  if (!isOpen) return null;

  // Handle local file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(isKhmer ? 'សូមជ្រើសរើសឯកសាររូបភាព (PNG, JPG, SVG, WebP)' : 'Please select a valid image file', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(isKhmer ? 'ទំហំរូបភាពត្រូវតែតូចជាង 5MB' : 'Image size must be less than 5MB', 'warning');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setFormData(prev => ({
        ...prev,
        logo: base64
      }));
      setIsUploading(false);
      soundService.playBeepSound();
      showToast(isKhmer ? 'បានបញ្ចូលរូបសញ្ញាហាងជោគជ័យ!' : 'Custom logo loaded successfully!', 'success');
    };
    reader.onerror = () => {
      setIsUploading(false);
      showToast(isKhmer ? 'បរាជ័យក្នុងការអានរូបភាព' : 'Failed to read image file', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setFormData(prev => ({ ...prev, logo: urlInput.trim() }));
    soundService.playBeepSound();
    showToast(isKhmer ? 'បានភ្ជាប់រូបសញ្ញាពី URL' : 'Applied logo from URL', 'info');
  };

  const handleRemoveLogo = () => {
    soundService.playBeepSound();
    setFormData(prev => ({ ...prev, logo: '' }));
    setUrlInput('');
    showToast(isKhmer ? 'បានលុបរូបសញ្ញាផ្ទាល់ខ្លួន (ត្រឡប់មកប្រើ Logo គំរូ)' : 'Removed custom logo (reverted to preset)', 'info');
  };

  const handleSelectPreset = (presetId) => {
    soundService.playBeepSound();
    setFormData(prev => ({
      ...prev,
      presetLogoId: presetId,
      logo: '' // Clear custom image so preset is used
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    soundService.playPaymentSuccessSound();
    updateStoreInfo(formData);
    showToast(isKhmer ? 'បានរក្សាទុកព័ត៌មាន & រូបសញ្ញាហាងដោយជោគជ័យ!' : 'Store branding & logo saved successfully!', 'success');
    onClose();
  };

  const handleResetDefaults = () => {
    soundService.playBeepSound();
    setFormData({
      name: 'Aroma Coffee & Bakery',
      nameKhmer: 'អាហ្រូម៉ា កាហ្វេ & ប៊េកឃឺរី',
      tagline: 'Artisan Roastery & Espresso Bar',
      taglineKhmer: 'ហាងកាហ្វេ Artisan Roastery',
      logo: '',
      presetLogoId: 'artisan-cup',
      phone: '+855 23 888 777',
      address: '742 Artisan Ave, Phnom Penh, Cambodia',
      addressKhmer: 'ផ្លូវ ៧៤២ មហាវិថីសិល្បៈ រាជធានីភ្នំពេញ',
      wifiSsid: 'Aroma_Guest_WiFi',
      wifiPassword: 'coffeeartisan',
      taxId: 'K002-9023412'
    });
    setUrlInput('');
    showToast(isKhmer ? 'បានកំណត់ព័ត៌មានដើមឡើងវិញ' : 'Reset to default store profile', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
                <span>{isKhmer ? 'ការកំណត់រូបសញ្ញា & ព័ត៌មានហាងកាហ្វេ' : 'Coffee Shop Branding & Dynamic Logo'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 uppercase">
                  Live Sync
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                {isKhmer 
                  ? 'ប្ដូររូបសញ្ញាហាង (Logo), ឈ្មោះហាង, និងបឋមកថាវិក្កយបត្រដោយស្វ័យប្រវត្តិ' 
                  : 'Customize logo, store name, address and receipt print headers in real time'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* SECTION 1: DYNAMIC LOGO UPLOAD & ARTISAN PRESETS */}
          {/* ========================================================================= */}
          <div className="p-5 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>{isKhmer ? 'រូបសញ្ញាហាងកាហ្វេ (Store Logo)' : 'Store Coffee Logo'}</span>
                </h3>
                <p className="text-xs text-stone-400">
                  {isKhmer ? 'បញ្ចូលរូបភាពផ្ទាល់ខ្លួន (PNG, JPG, SVG) ឬជ្រើសរើស Logo គំរូស្អាតៗ' : 'Upload your own custom coffee logo or select an artisan vector preset'}
                </p>
              </div>

              {formData.logo && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'លុបរូប Logo ផ្ទាល់ខ្លួន' : 'Remove Custom Logo'}</span>
                </button>
              )}
            </div>

            {/* Upload Zone & Preset Selector */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left 5 Cols: Upload Controls */}
              <div className="md:col-span-5 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-700 hover:border-amber-500/80 rounded-2xl p-5 text-center cursor-pointer transition bg-stone-900/40 hover:bg-amber-950/10 group"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-800 group-hover:bg-amber-500/20 text-stone-400 group-hover:text-amber-400 flex items-center justify-center transition mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-stone-200 group-hover:text-amber-300">
                    {isKhmer ? 'ចុចទីនេះដើម្បីបញ្ចូលរូប Logo ថ្មី' : 'Click to Upload Store Logo'}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-1">
                    PNG, JPG, WebP, SVG (Max 5MB)
                  </p>
                </div>

                {/* Or enter Image URL */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://example.com/logo.png"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition cursor-pointer shrink-0"
                  >
                    Apply URL
                  </button>
                </div>
              </div>

              {/* Right 7 Cols: 5 Artisan Vector Presets */}
              <div className="md:col-span-7 space-y-2">
                <span className="text-xs font-bold text-stone-300 block">
                  {isKhmer ? 'ឬជ្រើសរើស Logo គំរូសិល្បៈ (Artisan Vector Presets):' : 'Or Pick an Artisan Preset Badge:'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_LOGOS.map((p) => {
                    const isSelected = !formData.logo && formData.presetLogoId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPreset(p.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/50 border-amber-500 text-stone-100 shadow-sm ring-1 ring-amber-500/50'
                            : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 text-stone-300 hover:bg-stone-900'
                        }`}
                      >
                        <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                          {p.render({ sizeClass: 'w-8 h-8' })}
                        </div>
                        <div className="overflow-hidden flex-1">
                          <p className="text-xs font-bold truncate">
                            {isKhmer ? p.nameKm : p.name}
                          </p>
                          <p className="text-[10px] text-stone-500 truncate">
                            {p.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LIVE MOCKUP PREVIEWS (Sidebar, Customer Screen, Receipt) */}
          {/* ========================================================================= */}
          <div className="p-5 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{isKhmer ? 'ការមើលទិដ្ឋភាពផ្ទាល់ (Real-Time Live Previews)' : 'Real-Time Logo Placements Preview'}</span>
                </h3>
                <p className="text-xs text-stone-400">
                  {isKhmer ? 'របៀបដែល Logo បង្ហាញក្នុងប្រព័ន្ធ' : 'See how your dynamic logo appears across terminals & prints'}
                </p>
              </div>

              {/* Preview Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs">
                {[
                  { id: 'sidebar', label: 'Sidebar / Header', icon: Sliders },
                  { id: 'customer', label: 'Customer Screen', icon: Monitor },
                  { id: 'receipt', label: 'Paper Receipt', icon: Receipt }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActivePreviewTab(tab.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        activePreviewTab === tab.id
                          ? 'bg-amber-600 text-stone-950'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview Box Container */}
            <div className="p-4 rounded-xl bg-stone-900/50 border border-stone-800 flex items-center justify-center min-h-[120px]">
              {/* Preview 1: Sidebar Style */}
              {activePreviewTab === 'sidebar' && (
                <div className="w-full max-w-sm p-3 rounded-2xl bg-stone-950 border border-stone-800 shadow-xl flex items-center justify-between">
                  <StoreLogo 
                    size="md" 
                    showName={true} 
                    showTagline={true} 
                    customStore={formData}
                  />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                    Terminal #01
                  </span>
                </div>
              )}

              {/* Preview 2: Customer Facing Display */}
              {activePreviewTab === 'customer' && (
                <div className="w-full max-w-lg p-4 rounded-2xl bg-stone-950 border border-stone-800 shadow-2xl flex items-center justify-between">
                  <StoreLogo 
                    size="lg" 
                    showName={true} 
                    showTagline={true} 
                    customStore={formData}
                  />
                  <div className="text-right">
                    <span className="text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Welcome Guest
                    </span>
                    <p className="text-xs text-stone-400 font-mono mt-1">Dual-Screen Display</p>
                  </div>
                </div>
              )}

              {/* Preview 3: Receipt Paper Style */}
              {activePreviewTab === 'receipt' && (
                <div className="w-full max-w-xs p-5 rounded-xl bg-stone-100 text-stone-900 border border-stone-300 font-mono text-center shadow-lg space-y-1">
                  <div className="flex justify-center mb-1">
                    <StoreLogo 
                      size="receipt" 
                      variant="monochrome"
                      customStore={formData}
                    />
                  </div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">{formData.name || 'Aroma Coffee'}</h4>
                  <p className="text-[10px] text-stone-600">{formData.address || '742 Artisan Ave, Phnom Penh'}</p>
                  <p className="text-[10px] text-stone-600">Tel: {formData.phone || '+855 23 888 777'}</p>
                  {formData.wifiSsid && (
                    <p className="text-[9px] text-stone-500 pt-1 border-t border-dashed border-stone-400">
                      WiFi: {formData.wifiSsid} | Pass: {formData.wifiPassword}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: STORE INFORMATION & PRINT SETTINGS */}
          {/* ========================================================================= */}
          <div className="p-5 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-4">
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2 border-b border-stone-800/80 pb-2.5">
              <Store className="w-4 h-4 text-amber-500" />
              <span>{isKhmer ? 'ព័ត៌មានអាជីវកម្ម & វិក្កយបត្រ (Business Details)' : 'Store Profile & Receipt Metadata'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Store Name (EN) */}
              <div className="space-y-1">
                <label className="font-bold text-stone-300">
                  {isKhmer ? 'ឈ្មោះហាង (អង់គ្លេស)' : 'Store Name (English)'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Aroma Coffee & Bakery"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              {/* Store Name (KH) */}
              <div className="space-y-1">
                <label className="font-bold text-stone-300">
                  {isKhmer ? 'ឈ្មោះហាង (ភាសាខ្មែរ)' : 'Store Name (Khmer)'}
                </label>
                <input
                  type="text"
                  value={formData.nameKhmer}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameKhmer: e.target.value }))}
                  placeholder="អាហ្រូម៉ា កាហ្វេ & ប៊េកឃឺរី"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500 font-semibold font-khmer"
                />
              </div>

              {/* Tagline (EN) */}
              <div className="space-y-1">
                <label className="font-bold text-stone-300">
                  {isKhmer ? 'ពាក្យស្លោក / អនុចំណងជើង' : 'Brand Tagline / Subtitle'}
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Artisan Roastery & Espresso Bar"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="font-bold text-stone-300 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{isKhmer ? 'លេខទូរស័ព្ទទំនាក់ទំនង' : 'Contact Phone Number'}</span>
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+855 23 888 777"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Address (EN) */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-stone-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{isKhmer ? 'អាសយដ្ឋានហាង (បង្ហាញលើវិក្កយបត្រ)' : 'Store Address (Printed on Receipts)'}</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="742 Artisan Ave, Phnom Penh, Cambodia"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* WiFi SSID */}
              <div className="space-y-1">
                <label className="font-bold text-stone-300 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-stone-400" />
                  <span>Guest Wi-Fi Name (SSID)</span>
                </label>
                <input
                  type="text"
                  value={formData.wifiSsid}
                  onChange={(e) => setFormData(prev => ({ ...prev, wifiSsid: e.target.value }))}
                  placeholder="Aroma_Guest_WiFi"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* WiFi Password */}
              <div className="space-y-1">
                <label className="font-bold text-stone-300">
                  Guest Wi-Fi Password
                </label>
                <input
                  type="text"
                  value={formData.wifiPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, wifiPassword: e.target.value }))}
                  placeholder="coffeeartisan"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-800">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'កំណត់លំនាំដើមឡើងវិញ' : 'Reset to Defaults'}</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs transition cursor-pointer"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-xs shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{isKhmer ? 'រក្សាទុក & អនុវត្ត Logo' : 'Save & Apply Store Logo'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
