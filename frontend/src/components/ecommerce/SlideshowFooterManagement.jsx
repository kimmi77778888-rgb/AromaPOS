'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  SlidersHorizontal, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  RotateCcw, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Image as ImageIcon, 
  Coffee, 
  Sparkles, 
  Globe, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  Tag,
  Layers,
  HelpCircle,
  X
} from 'lucide-react';

// Curated high-resolution Unsplash photos for 1-click selection
export const PRESET_SLIDE_IMAGES = [
  {
    id: 'roastery',
    title: 'Roastery HQ',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'barista-pour',
    title: 'Barista Pour Over',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'bakery-croissant',
    title: 'French Croissant',
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'delivery-express',
    title: 'Courier Delivery',
    url: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'vip-loyalty',
    title: 'VIP Coffee Club',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'iced-latte',
    title: 'Iced Artisan Latte',
    url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'espresso-machine',
    title: 'La Marzocco Espresso',
    url: 'https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?auto=format&fit=crop&w=1600&q=80'
  },
  {
    id: 'cafe-interior',
    title: 'BKK1 Cafe Vibe',
    url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1600&q=80'
  }
];

export const SlideshowFooterManagement = () => {
  const { isKhmer } = useLanguage();
  const { 
    footerSlides = [], 
    footerConfig = {}, 
    addFooterSlide, 
    updateFooterSlide, 
    deleteFooterSlide, 
    reorderFooterSlides, 
    resetFooterSlides, 
    updateFooterConfig, 
    resetFooterConfig,
    showToast,
    changeAppMode
  } = useApp();

  const [activeTab, setActiveTab] = useState('slideshow'); // 'slideshow' | 'footer'

  // Slide Form State (Add / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState(null);

  const initialSlideState = {
    tag: '',
    tagKm: '',
    title: '',
    titleKm: '',
    description: '',
    descriptionKm: '',
    badge: 'Fresh Daily Roast',
    badgeKm: 'លីងស្រស់ៗរាល់ថ្ងៃ',
    actionText: 'Order Now',
    actionTextKm: 'កុម្ម៉ង់ឥឡូវនេះ',
    actionHref: '#menu',
    actionType: 'MENU', // 'MENU' | 'TRACKER' | 'AUTH' | 'CUSTOM'
    customHref: '',
    image: PRESET_SLIDE_IMAGES[0].url
  };

  const [slideFormData, setSlideFormData] = useState(initialSlideState);

  // Footer Settings Local Form State
  const [localFooterConfig, setLocalFooterConfig] = useState({
    aboutEn: footerConfig.aboutEn || '',
    aboutKm: footerConfig.aboutKm || '',
    openingHours: footerConfig.openingHours || 'Open Daily: 6:30 AM - 9:00 PM',
    openingHoursKm: footerConfig.openingHoursKm || 'បើកជារៀងរាល់ថ្ងៃ: ៦:៣០ ព្រឹក - ៩:០០ យប់',
    socialHandle: footerConfig.socialHandle || '@aromacoffeepnh',
    contactPhone: footerConfig.contactPhone || '+855 23 999 881',
    contactAddress: footerConfig.contactAddress || 'Street 57, Sangkat Boeng Keng Kang 1, Phnom Penh',
    contactAddressKm: footerConfig.contactAddressKm || 'ផ្លូវ ៥៧ សង្កាត់បឹងកេងកង ១ រាជធានីភ្នំពេញ',
    tickerItems: footerConfig.tickerItems || []
  });

  // Ticker Item Quick Form State
  const [newTickerIcon, setNewTickerIcon] = useState('☕');
  const [newTickerText, setNewTickerText] = useState('');
  const [newTickerTextKm, setNewTickerTextKm] = useState('');
  const [newTickerColor, setNewTickerColor] = useState('text-amber-400');

  // Handle Edit Slide Pre-fill
  const handleStartEditSlide = (slide) => {
    setEditingSlideId(slide.id);
    setSlideFormData({
      tag: slide.tag || '',
      tagKm: slide.tagKm || '',
      title: slide.title || '',
      titleKm: slide.titleKm || '',
      description: slide.description || '',
      descriptionKm: slide.descriptionKm || '',
      badge: slide.badge || 'Featured',
      badgeKm: slide.badgeKm || 'ពិសេស',
      actionText: slide.actionText || 'Order Now',
      actionTextKm: slide.actionTextKm || 'កុម្ម៉ង់ឥឡូវនេះ',
      actionHref: slide.actionHref || '#menu',
      actionType: slide.actionType || (slide.actionHref ? 'MENU' : 'CUSTOM'),
      customHref: slide.actionHref || '',
      image: slide.image || PRESET_SLIDE_IMAGES[0].url
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Reset Slide Form
  const handleCancelSlideForm = () => {
    setEditingSlideId(null);
    setSlideFormData(initialSlideState);
    setIsFormOpen(false);
  };

  // Handle Save / Add Slide Submit
  const handleSaveSlide = (e) => {
    e.preventDefault();
    if (!slideFormData.title.trim() && !slideFormData.titleKm.trim()) {
      showToast?.('Please enter a title for the slide', 'error');
      return;
    }
    if (!slideFormData.image.trim()) {
      showToast?.('Please select or provide an image URL', 'error');
      return;
    }

    const payload = {
      tag: slideFormData.tag.trim() || 'FEATURED SPECIALTY',
      tagKm: slideFormData.tagKm.trim() || 'កាហ្វេពិសេសប្រចាំហាង',
      title: slideFormData.title.trim() || slideFormData.titleKm.trim(),
      titleKm: slideFormData.titleKm.trim() || slideFormData.title.trim(),
      description: slideFormData.description.trim(),
      descriptionKm: slideFormData.descriptionKm.trim() || slideFormData.description.trim(),
      badge: slideFormData.badge.trim() || 'Special',
      badgeKm: slideFormData.badgeKm.trim() || 'ពិសេស',
      actionText: slideFormData.actionText.trim() || 'Explore',
      actionTextKm: slideFormData.actionTextKm.trim() || 'ស្វែងរក',
      image: slideFormData.image.trim(),
      actionType: slideFormData.actionType,
      actionHref: slideFormData.actionType === 'MENU' ? '#menu' : (slideFormData.actionType === 'CUSTOM' ? slideFormData.customHref : null)
    };

    if (editingSlideId) {
      updateFooterSlide(editingSlideId, payload);
      showToast?.(isKhmer ? '✓ បានកែប្រែស្លាយដោយជោគជ័យ' : '✓ Slide updated successfully', 'success');
    } else {
      addFooterSlide(payload);
      showToast?.(isKhmer ? '✓ បានបន្ថែមស្លាយថ្មីដោយជោគជ័យ' : '✓ New slide added successfully', 'success');
    }

    handleCancelSlideForm();
  };

  // Handle Slide Delete
  const handleDeleteSlide = (id) => {
    if (footerSlides.length <= 1) {
      showToast?.('You must have at least one slide in the showcase', 'error');
      return;
    }
    if (window.confirm(isKhmer ? 'តើអ្នកប្រាកដជាចង់លុបស្លាយនេះមែនទេ?' : 'Are you sure you want to delete this slide?')) {
      deleteFooterSlide(id);
      showToast?.(isKhmer ? 'បានលុបស្លាយរួចរាល់' : 'Slide deleted', 'info');
      if (editingSlideId === id) handleCancelSlideForm();
    }
  };

  // Handle Slide Reorder (Move Up / Down)
  const handleMoveSlide = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= footerSlides.length) return;
    const reordered = [...footerSlides];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    reorderFooterSlides(reordered);
    showToast?.(isKhmer ? '✓ បានរៀបចំលំដាប់ស្លាយថ្មី' : '✓ Slides reordered', 'success');
  };

  // Handle Add Ticker Announcement
  const handleAddTickerItem = (e) => {
    e.preventDefault();
    if (!newTickerText.trim() && !newTickerTextKm.trim()) {
      showToast?.('Please enter message text', 'error');
      return;
    }

    const newItem = {
      id: `tick-${Date.now()}`,
      icon: newTickerIcon || '☕',
      text: newTickerText.trim() || newTickerTextKm.trim(),
      textKm: newTickerTextKm.trim() || newTickerText.trim(),
      color: newTickerColor
    };

    const updatedItems = [...(localFooterConfig.tickerItems || []), newItem];
    setLocalFooterConfig((prev) => ({ ...prev, tickerItems: updatedItems }));
    updateFooterConfig({ tickerItems: updatedItems });
    setNewTickerText('');
    setNewTickerTextKm('');
    showToast?.(isKhmer ? '✓ បានបន្ថែមពាក្យអក្សររត់ថ្មី' : '✓ New ticker announcement added', 'success');
  };

  // Handle Delete Ticker Announcement
  const handleDeleteTickerItem = (id) => {
    const updated = (localFooterConfig.tickerItems || []).filter((item) => item.id !== id);
    setLocalFooterConfig((prev) => ({ ...prev, tickerItems: updated }));
    updateFooterConfig({ tickerItems: updated });
    showToast?.(isKhmer ? 'បានលុបសារអក្សររត់' : 'Ticker item removed', 'info');
  };

  // Handle Save Full Footer Config
  const handleSaveFooterConfig = (e) => {
    e.preventDefault();
    updateFooterConfig(localFooterConfig);
    showToast?.(isKhmer ? '✓ បានរក្សាទុកការកំណត់ Footer ដោយជោគជ័យ' : '✓ Footer settings saved successfully', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-950 text-stone-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-stone-900 border border-stone-850 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {isKhmer ? 'គ្រប់គ្រង Slideshow & Footer' : 'Slideshow & Footer Manager'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                  {footerSlides.length} {isKhmer ? 'ស្លាយ' : 'Slides'}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {isKhmer 
                  ? 'កែប្រែផ្ទាំងរូបភាពស្លាយ អក្សររត់ផ្សព្វផ្សាយ និងព័ត៌មានខាងក្រោមគេហទំព័រផ្ទាល់' 
                  : 'Customize homepage hero showcase slides, running ticker ribbon, and 4-column footer.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {changeAppMode && (
              <button
                type="button"
                onClick={() => changeAppMode('ecommerce')}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="View Live Storefront"
              >
                <Globe className="w-4 h-4 text-amber-400" />
                <span>{isKhmer ? 'មើលគេហទំព័រ' : 'View Storefront'}</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </button>
            )}
          </div>
        </div>

        {/* Segmented Tab Navigation */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-stone-900/90 border border-stone-800 max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab('slideshow')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'slideshow'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-md shadow-amber-950/40'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isKhmer ? '🎠 ផ្ទាំងស្លាយ (Slideshow)' : '🎠 Slideshow Manager'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('footer')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'footer'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-md shadow-amber-950/40'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>{isKhmer ? '📜 Footer & អក្សររត់' : '📜 Footer & Ticker'}</span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: SLIDESHOW MANAGER & ADD/EDIT FORM
        ────────────────────────────────────────────────────────────── */}
        {activeTab === 'slideshow' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-850">
              <div className="flex items-center gap-2 text-xs text-stone-300">
                <span className="font-bold text-amber-400">⚡ Auto-Plays:</span>
                <span>Advances every 4.5 seconds with pause on mouse hover</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(isKhmer ? 'តើអ្នកចង់កំណត់ស្លាយទៅលំនាំដើមវិញទេ?' : 'Reset all slides to default Roastery showcase?')) {
                      resetFooterSlides();
                      showToast?.(isKhmer ? 'បានកំណត់ស្លាយទៅលំនាំដើមវិញ' : 'Reset to default slides', 'info');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-750 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Reset Slides to Factory Default"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'កំណត់លំនាំដើម' : 'Reset Defaults'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isFormOpen && !editingSlideId) {
                      setIsFormOpen(false);
                    } else {
                      setEditingSlideId(null);
                      setSlideFormData(initialSlideState);
                      setIsFormOpen(true);
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-950/40"
                >
                  {isFormOpen && !editingSlideId ? (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>{isKhmer ? 'បិទ Form' : 'Close Form'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{isKhmer ? '+ បន្ថែមស្លាយថ្មី' : '+ Add New Slide'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* COLLAPSIBLE ADD / EDIT SLIDE FORM */}
            {isFormOpen && (
              <div className="p-5 sm:p-6 rounded-3xl bg-stone-900 border border-amber-500/40 shadow-2xl space-y-6 animate-fade-in relative">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                      {editingSlideId ? '✏️' : '✨'}
                    </span>
                    <div>
                      <h3 className="font-black text-base text-white">
                        {editingSlideId 
                          ? (isKhmer ? 'កែប្រែស្លាយ (Edit Slide)' : 'Edit Slide') 
                          : (isKhmer ? 'បង្កើតស្លាយផ្សព្វផ្សាយថ្មី' : 'Create New Showcase Slide')}
                      </h3>
                      <p className="text-[11px] text-stone-400">
                        {isKhmer ? 'បញ្ចូលចំណងជើង រូបភាព និងប៊ូតុងសកម្មភាព' : 'Fill in headline, photography, and call-to-action button'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelSlideForm}
                    className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveSlide} className="space-y-5">
                  {/* Grid 1: Titles (EN & KM) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                        <span>Headline / Title (English)</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={slideFormData.title}
                        onChange={(e) => setSlideFormData({ ...slideFormData, title: e.target.value })}
                        placeholder="e.g. Farm-to-Cup Micro Batch Roasting"
                        required
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                        <span>ចំណងជើងស្លាយ (Khmer)</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={slideFormData.titleKm}
                        onChange={(e) => setSlideFormData({ ...slideFormData, titleKm: e.target.value })}
                        placeholder="ឧ. កាហ្វេសុទ្ធ 100% ពីចម្ការលំដាប់ខ្ពស់"
                        required
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>

                  {/* Grid 2: Ribbon Tag & Badge Pill */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300">Category Tag (EN)</label>
                      <input
                        type="text"
                        value={slideFormData.tag}
                        onChange={(e) => setSlideFormData({ ...slideFormData, tag: e.target.value })}
                        placeholder="CRAFT ROASTERY • BKK1"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300">Category Tag (KM)</label>
                      <input
                        type="text"
                        value={slideFormData.tagKm}
                        onChange={(e) => setSlideFormData({ ...slideFormData, tagKm: e.target.value })}
                        placeholder="រោងម៉ាស៊ីនលីងកាហ្វេ BKK1"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300">Badge Pill (EN)</label>
                      <input
                        type="text"
                        value={slideFormData.badge}
                        onChange={(e) => setSlideFormData({ ...slideFormData, badge: e.target.value })}
                        placeholder="Fresh Daily Roast"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300">Badge Pill (KM)</label>
                      <input
                        type="text"
                        value={slideFormData.badgeKm}
                        onChange={(e) => setSlideFormData({ ...slideFormData, badgeKm: e.target.value })}
                        placeholder="លីងស្រស់ៗរាល់ថ្ងៃ"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>

                  {/* Grid 3: Description (EN & KM) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300">Description (English)</label>
                      <textarea
                        rows={2}
                        value={slideFormData.description}
                        onChange={(e) => setSlideFormData({ ...slideFormData, description: e.target.value })}
                        placeholder="Slow-roasted daily in 5kg artisan batches to unlock exquisite chocolate, floral, and nutty notes..."
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300">ការពិពណ៌នាស្លាយ (Khmer)</label>
                      <textarea
                        rows={2}
                        value={slideFormData.descriptionKm}
                        onChange={(e) => setSlideFormData({ ...slideFormData, descriptionKm: e.target.value })}
                        placeholder="លីងថ្មីៗជារៀងរាល់ថ្ងៃក្នុងបរិមាណតិច ដើម្បីធានាក្លិនឈ្ងុយ និងរសជាតិកាហ្វេពិតៗ..."
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition resize-none"
                      />
                    </div>
                  </div>

                  {/* Grid 4: Action Button CTA & Target */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300">Button Text (EN)</label>
                      <input
                        type="text"
                        value={slideFormData.actionText}
                        onChange={(e) => setSlideFormData({ ...slideFormData, actionText: e.target.value })}
                        placeholder="Explore Menu"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300">ប៊ូតុងចុច (Khmer)</label>
                      <input
                        type="text"
                        value={slideFormData.actionTextKm}
                        onChange={(e) => setSlideFormData({ ...slideFormData, actionTextKm: e.target.value })}
                        placeholder="ស្វែងរកមុខទំនិញ"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300">Action Target</label>
                      <select
                        value={slideFormData.actionType}
                        onChange={(e) => setSlideFormData({ ...slideFormData, actionType: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 transition cursor-pointer"
                      >
                        <option value="MENU">Jump to Menu (#menu)</option>
                        <option value="TRACKER">Open Order Tracker Modal</option>
                        <option value="AUTH">Open VIP Sign In Modal</option>
                        <option value="CUSTOM">Custom External Link</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom link input if CUSTOM selected */}
                  {slideFormData.actionType === 'CUSTOM' && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-xs font-bold text-stone-300">Custom Target URL</label>
                      <input
                        type="url"
                        value={slideFormData.customHref}
                        onChange={(e) => setSlideFormData({ ...slideFormData, customHref: e.target.value })}
                        placeholder="https://example.com/promo or #locations"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition font-mono"
                      />
                    </div>
                  )}

                  {/* Photography & Preset Picker */}
                  <div className="space-y-3 pt-2 border-t border-stone-800">
                    <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                        <span>Background Photography (រូបភាពផ្ទៃក្រោយ)</span>
                      </span>
                      <span className="text-[10px] text-stone-500">Pick from presets below or paste custom image URL</span>
                    </label>

                    {/* Preset Badges Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {PRESET_SLIDE_IMAGES.map((preset) => {
                        const isSelected = slideFormData.image === preset.url;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => setSlideFormData({ ...slideFormData, image: preset.url })}
                            className={`p-2 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                              isSelected
                                ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/20'
                                : 'bg-stone-950/80 border-stone-800 hover:border-stone-700'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.title}
                              className="w-10 h-10 rounded-xl object-cover shrink-0"
                            />
                            <div className="overflow-hidden">
                              <span className="text-[11px] font-bold text-white block truncate leading-tight">
                                {preset.title}
                              </span>
                              <span className="text-[9px] text-amber-400 font-mono">
                                {isSelected ? '✓ Selected' : 'Use Photo'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Custom Image URL Input */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="url"
                        value={slideFormData.image}
                        onChange={(e) => setSlideFormData({ ...slideFormData, image: e.target.value })}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition font-mono"
                      />
                    </div>
                  </div>

                  {/* LIVE MINI PREVIEW CARD */}
                  <div className="space-y-2 pt-2 border-t border-stone-800">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Slide Preview (ទម្រង់ស្លាយជាក់ស្តែងលើគេហទំព័រ):</span>
                    </span>

                    <div className="relative h-56 sm:h-64 rounded-3xl overflow-hidden border border-stone-800 bg-stone-950 shadow-2xl">
                      <img
                        src={slideFormData.image || PRESET_SLIDE_IMAGES[0].url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/75 to-transparent" />

                      <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between z-10">
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                            <Coffee className="w-3 h-3" />
                            <span>{isKhmer ? (slideFormData.badgeKm || slideFormData.badge) : (slideFormData.badge || 'Featured')}</span>
                          </span>
                        </div>

                        <div className="space-y-1.5 max-w-lg">
                          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                            {isKhmer ? (slideFormData.tagKm || slideFormData.tag) : (slideFormData.tag || 'CRAFT ROASTERY')}
                          </span>
                          <h4 className="text-lg sm:text-xl font-black text-white leading-tight">
                            {isKhmer ? (slideFormData.titleKm || slideFormData.title) : (slideFormData.title || 'Specialty Coffee Showcase')}
                          </h4>
                          <p className="text-[11px] text-stone-300 line-clamp-2">
                            {isKhmer ? (slideFormData.descriptionKm || slideFormData.description) : (slideFormData.description || 'Slow-roasted daily in small artisan batches.')}
                          </p>
                          <div className="pt-1">
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black text-xs shadow-md">
                              <span>{isKhmer ? (slideFormData.actionTextKm || slideFormData.actionText) : (slideFormData.actionText || 'Order Now')}</span>
                              <span>→</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Submission Controls */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                    <button
                      type="button"
                      onClick={handleCancelSlideForm}
                      className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 font-bold text-xs transition cursor-pointer"
                    >
                      {isKhmer ? 'បោះបង់' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs transition cursor-pointer shadow-lg shadow-amber-950/50 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>
                        {editingSlideId 
                          ? (isKhmer ? 'រក្សាទុកការកែប្រែ' : 'Save Changes') 
                          : (isKhmer ? 'បង្កើតស្លាយ' : 'Create Slide')}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ACTIVE SLIDES LIST */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm uppercase tracking-wider text-stone-300">
                  {isKhmer ? 'បញ្ជីស្លាយសកម្ម (Active Slides)' : 'Active Showcase Slides'}
                </h3>
                <span className="text-xs text-stone-500">
                  {isKhmer ? 'ចុចព្រួញឡើងលើ/ចុះក្រោមដើម្បីតម្រៀប' : 'Use arrows to reorder slides'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {footerSlides.map((slide, index) => (
                  <div
                    key={slide.id || index}
                    className="p-4 rounded-2xl bg-stone-900 border border-stone-850 hover:border-stone-750 transition flex flex-col md:flex-row md:items-center justify-between gap-4 group shadow-md"
                  >
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      {/* Thumbnail */}
                      <div className="relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border border-stone-800 bg-stone-950">
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-stone-950/80 text-[9px] font-mono font-black text-amber-400">
                          #{index + 1}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="overflow-hidden space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block truncate">
                          {isKhmer ? (slide.tagKm || slide.tag) : (slide.tag || 'Specialty')}
                        </span>
                        <h4 className="font-bold text-sm text-white truncate">
                          {isKhmer ? (slide.titleKm || slide.title) : (slide.title || 'Showcase Slide')}
                        </h4>
                        <p className="text-[11px] text-stone-400 truncate">
                          {isKhmer ? (slide.descriptionKm || slide.description) : (slide.description || '')}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(index, 'up')}
                        disabled={index === 0}
                        className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-750 disabled:opacity-30 disabled:cursor-not-allowed text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(index, 'down')}
                        disabled={index === footerSlides.length - 1}
                        className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-750 disabled:opacity-30 disabled:cursor-not-allowed text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleStartEditSlide(slide)}
                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-amber-500/20 hover:text-amber-300 text-stone-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-transparent hover:border-amber-500/30"
                        title="Edit Slide"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isKhmer ? 'កែ' : 'Edit'}</span>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 flex items-center justify-center transition cursor-pointer border border-transparent hover:border-rose-500/30"
                        title="Delete Slide"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: FOOTER & MARQUEE TICKER MANAGEMENT
        ────────────────────────────────────────────────────────────── */}
        {activeTab === 'footer' && (
          <div className="space-y-6">
            {/* 1. RUNNING MARQUEE TICKER TAPE EDITOR */}
            <div className="p-5 sm:p-6 rounded-3xl bg-stone-900 border border-stone-850 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">
                    ⚡
                  </span>
                  <div>
                    <h3 className="font-black text-base text-white">
                      {isKhmer ? 'ពាក្យអក្សររត់ Marquee Ticker' : 'Live Running Marquee Ticker Tape'}
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      {isKhmer ? 'សារជូនដំណឹងរត់ឥតឈប់ឈរនៅពីលើ Footer' : 'Continuous animated ribbon tape shown above the footer'}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-800/60">
                  {(localFooterConfig.tickerItems || []).length} Announcements
                </span>
              </div>

              {/* LIVE TICKER PREVIEW TAPE */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">
                  Live Preview:
                </span>
                <div className="overflow-hidden rounded-2xl bg-stone-950 border border-stone-800 py-3 relative select-none">
                  <div className="flex items-center gap-8 whitespace-nowrap animate-marquee font-mono text-xs text-stone-300 font-bold">
                    {(localFooterConfig.tickerItems || []).map((item, idx) => (
                      <React.Fragment key={item.id || idx}>
                        <span className={`flex items-center gap-2 ${item.color || 'text-amber-400'}`}>
                          <span>{item.icon || '☕'}</span>
                          <span>{isKhmer ? (item.textKm || item.text) : item.text}</span>
                        </span>
                        <span className="text-stone-700">•</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* ADD NEW TICKER ANNOUNCEMENT FORM */}
              <form onSubmit={handleAddTickerItem} className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 block">
                  + {isKhmer ? 'បន្ថែមសារអក្សររត់ថ្មី' : 'Add New Marquee Message'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-stone-400 font-bold">Emoji / Icon</label>
                    <input
                      type="text"
                      value={newTickerIcon}
                      onChange={(e) => setNewTickerIcon(e.target.value)}
                      placeholder="☕"
                      maxLength={4}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-center text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[10px] text-stone-400 font-bold">Message (English)</label>
                    <input
                      type="text"
                      value={newTickerText}
                      onChange={(e) => setNewTickerText(e.target.value)}
                      placeholder="e.g. Free Delivery for orders $10+"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[10px] text-stone-400 font-bold">សារជាភាសាខ្មែរ</label>
                    <input
                      type="text"
                      value={newTickerTextKm}
                      onChange={(e) => setNewTickerTextKm(e.target.value)}
                      placeholder="ឧ. ដឹកជញ្ជូនឥតគិតថ្លៃសម្រាប់ការកុម្ម៉ង់ $10+"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition cursor-pointer shadow-md"
                    >
                      {isKhmer ? '+ បន្ថែម' : '+ Add'}
                    </button>
                  </div>
                </div>
              </form>

              {/* LIST OF CURRENT TICKER MESSAGES */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-400 block">
                  {isKhmer ? 'សារដែលកំពុងដំណើរការ' : 'Active Ticker Announcements'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(localFooterConfig.tickerItems || []).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-stone-950 border border-stone-850 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-base">{item.icon}</span>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">
                            {item.text}
                          </p>
                          {item.textKm && (
                            <p className="text-[10px] text-stone-400 truncate">
                              {item.textKm}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTickerItem(item.id)}
                        className="text-stone-500 hover:text-rose-400 p-1 rounded-lg transition cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. ROASTERY STORY & STORE CONTACT DETAILS */}
            <form onSubmit={handleSaveFooterConfig} className="p-5 sm:p-6 rounded-3xl bg-stone-900 border border-stone-850 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-sm">
                    📍
                  </span>
                  <div>
                    <h3 className="font-black text-base text-white">
                      {isKhmer ? 'ព័ត៌មានរោងម៉ាស៊ីន & ទំនាក់ទំនង' : 'Roastery Story & Store Info'}
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      {isKhmer ? 'កែប្រែជីវប្រវត្តិហាង ម៉ោងបើក និងលេខទំនាក់ទំនង' : 'Store bio, opening hours, social handles, and address'}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs transition cursor-pointer shadow-lg shadow-amber-950/40 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isKhmer ? 'រក្សាទុក Footer' : 'Save Footer Settings'}</span>
                </button>
              </div>

              {/* Bio English & Khmer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300">About Roastery Bio (English)</label>
                  <textarea
                    rows={3}
                    value={localFooterConfig.aboutEn}
                    onChange={(e) => setLocalFooterConfig({ ...localFooterConfig, aboutEn: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition resize-none"
                    placeholder="Specialty coffee roastery and artisan bakery in Phnom Penh..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300">ជីវប្រវត្តិហាងកាហ្វេ (Khmer)</label>
                  <textarea
                    rows={3}
                    value={localFooterConfig.aboutKm}
                    onChange={(e) => setLocalFooterConfig({ ...localFooterConfig, aboutKm: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition resize-none"
                    placeholder="រោងម៉ាស៊ីនកាហ្វេសិល្បៈ និងហាងកាហ្វេពិសេសនៅរាជធានីភ្នំពេញ..."
                  />
                </div>
              </div>

              {/* Opening Hours & Social Handle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Opening Hours (EN)</span>
                  </label>
                  <input
                    type="text"
                    value={localFooterConfig.openingHours}
                    onChange={(e) => setLocalFooterConfig({ ...localFooterConfig, openingHours: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>ម៉ោងបើកលក់ (KM)</span>
                  </label>
                  <input
                    type="text"
                    value={localFooterConfig.openingHoursKm}
                    onChange={(e) => setLocalFooterConfig({ ...localFooterConfig, openingHoursKm: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                    <span>Social Media Tag</span>
                  </label>
                  <input
                    type="text"
                    value={localFooterConfig.socialHandle}
                    onChange={(e) => setLocalFooterConfig({ ...localFooterConfig, socialHandle: e.target.value })}
                    placeholder="@aromacoffeepnh"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition font-mono"
                  />
                </div>
              </div>

              {/* Contact Phone & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Contact Phone</span>
                  </label>
                  <input
                    type="text"
                    value={localFooterConfig.contactPhone}
                    onChange={(e) => setLocalFooterConfig({ ...localFooterConfig, contactPhone: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition font-mono"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Store Address</span>
                  </label>
                  <input
                    type="text"
                    value={localFooterConfig.contactAddress}
                    onChange={(e) => setLocalFooterConfig({ ...localFooterConfig, contactAddress: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Save Footer Button */}
              <div className="flex items-center justify-end pt-3 border-t border-stone-800">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs transition cursor-pointer shadow-lg shadow-amber-950/40 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isKhmer ? 'រក្សាទុកការកែប្រែ Footer ទាំងអស់' : 'Save All Footer Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
