import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { StoreLogo } from '../common/StoreLogo';
import { 
  Search, 
  Coffee, 
  Flame, 
  Snowflake, 
  Croissant, 
  Sparkles, 
  CupSoda, 
  Utensils,
  Apple,
  Milk,
  Heart,
  Award,
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Receipt, 
  CreditCard, 
  AlertTriangle,
  FileEdit,
  ArrowRight,
  SlidersHorizontal,
  XCircle,
  Phone,
  QrCode,
  Coins,
  CheckCircle2,
  FolderPlus,
  Minimize2,
  Tv,
  Lock,
  Unlock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Copy,
  X
} from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { ProductModifierModal } from './ProductModifierModal';
import { CategoryModal } from './CategoryModal';

export const PosTerminal = () => {
  const {
    products,
    cart,
    addToCart,
    duplicateCartItem,
    updateCartQuantity,
    updateItemNotes,
    removeFromCart,
    voidCartItem,
    clearCart,
    orderType,
    setOrderType,
    customerName,
    setCustomerName,
    discountPercent,
    setDiscountPercent,
    setAuthorizedDiscount,
    isCashier,
    customers,
    linkedCustomer,
    appliedPoints,
    linkCustomer,
    unlinkCustomer,
    applyLoyaltyPoints,
    cartTotals,
    categories,
    isPosFocusMode,
    setIsPosFocusMode,
    isCustomerPreviewOpen,
    setIsCustomerPreviewOpen,
    openCustomerDisplayWindow,
    lockScreen,
    user,
    activeShift,
    openShiftModal,
    showToast,
    storeInfo
  } = useApp();

  const { t, language, setLanguage, isKhmer, formatKHR, formatUSD } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerPhoneQuery, setCustomerPhoneQuery] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [modifyingProduct, setModifyingProduct] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Horizontal Category Scroll states & refs
  const categoryScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const checkScrollability = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const hasLeft = el.scrollLeft > 6;
    const hasRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 6;
    setCanScrollLeft(hasLeft);
    setCanScrollRight(hasRight);
  }, []);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;

    checkScrollability();

    // Natural wheel to horizontal scroll listener with passive: false so page doesn't scroll vertically
    const handleWheel = (e) => {
      if (el.scrollWidth > el.clientWidth) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX) || Math.abs(e.deltaX) > 0) {
          e.preventDefault();
          const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
          el.scrollLeft += delta * 1.2;
          checkScrollability();
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        checkScrollability();
      });
      ro.observe(el);
    }
    window.addEventListener('resize', checkScrollability);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', checkScrollability);
    };
  }, [checkScrollability, categories]);

  const scrollCategories = (direction) => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -240 : 240;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScrollability, 350);
  };

  const handleMouseDown = (e) => {
    const el = categoryScrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const el = categoryScrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.3;
    if (Math.abs(walk) > 5) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
    checkScrollability();
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleCategoryClick = (catId) => {
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    setSelectedCategory(catId);
  };

  const handleNewCategoryClick = () => {
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    setIsCategoryModalOpen(true);
  };

  // Category Icon mapper
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-4 h-4" />;
      case 'Snowflake': return <Snowflake className="w-4 h-4" />;
      case 'Croissant': return <Croissant className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'CupSoda': return <CupSoda className="w-4 h-4" />;
      case 'Utensils': return <Utensils className="w-4 h-4" />;
      case 'Apple': return <Apple className="w-4 h-4" />;
      case 'Milk': return <Milk className="w-4 h-4" />;
      case 'Heart': return <Heart className="w-4 h-4" />;
      case 'Award': return <Award className="w-4 h-4" />;
      default: return <Coffee className="w-4 h-4" />;
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.nameKm && p.nameKm.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleProductClick = (product) => {
    if (!activeShift) {
      showToast(
        isKhmer ? 'សូមបើកហាង/វេនជាមុនសិន មុនពេលចាប់ផ្តើមលក់' : 'Store is closed. Please open store first before making a sale.',
        'warning'
      );
      openShiftModal('OPEN');
      return;
    }

    if (product.isAutoDisabled || product.stock <= 0) return;

    // For drinks, open modifier modal for customization options (size, sweetness, ice, milk, shots)
    if (
      product.category === 'Hot Coffee' || 
      product.category === 'Iced Coffee' || 
      product.category === 'Specialty' ||
      (product.category && product.category.toLowerCase().includes('tea'))
    ) {
      setModifyingProduct(product);
    } else {
      addToCart(product);
    }
  };

  const handleQuickAdd = (e, product) => {
    e.stopPropagation();
    if (!activeShift) {
      showToast(
        isKhmer ? 'សូមបើកហាង/វេនជាមុនសិន មុនពេលចាប់ផ្តើមលក់' : 'Store is closed. Please open store first before making a sale.',
        'warning'
      );
      openShiftModal('OPEN');
      return;
    }
    if (product.isAutoDisabled || product.stock <= 0) return;
    addToCart(product);
  };

  const handleConfirmModifiers = (customized) => {
    if (!activeShift) {
      showToast(
        isKhmer ? 'សូមបើកហាង/វេនជាមុនសិន មុនពេលចាប់ផ្តើមលក់' : 'Store is closed. Please open store first before making a sale.',
        'warning'
      );
      openShiftModal('OPEN');
      return;
    }
    addToCart(customized.product, customized);
  };

  const handleOpenNoteModal = (item) => {
    setEditingNoteId(item.cartItemId);
    setNoteInput(item.notes || '');
  };

  const handleSaveNote = (cartItemId) => {
    updateItemNotes(cartItemId, noteInput.trim());
    setEditingNoteId(null);
  };

  const handleLinkCustomerSubmit = (e) => {
    if (e) e.preventDefault();
    if (!customerPhoneQuery.trim()) return;
    linkCustomer(customerPhoneQuery.trim());
    setCustomerPhoneQuery('');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-stone-950 text-stone-100 select-none">
      {/* Focused Pure POS Top Utility Bar (Displayed when Focus POS Mode is Active) */}
      {isPosFocusMode && (
        <div className="px-5 py-2.5 bg-stone-900 border-b border-stone-800 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <StoreLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-stone-100">
                  {storeInfo?.name || (isKhmer ? 'ស្ថានីយគិតប្រាក់ (AromaPOS)' : 'AromaPOS Terminal')}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {isKhmer ? 'របៀប POS ពេញអេក្រង់' : 'Pure POS Mode'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions in Focus Mode */}
          <div className="flex items-center gap-2.5">
            {/* Register Shift Status Pill in Focus Mode */}
            <button
              type="button"
              onClick={() => openShiftModal(activeShift ? 'ACTIVE' : 'OPEN')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                activeShift
                  ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/60 shadow-sm'
                  : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-700/60 animate-pulse'
              }`}
              title={activeShift ? 'Manage Active Register Shift & Cash Drawer' : 'Click to Open Register Shift & Float'}
            >
              {activeShift ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="font-mono">{activeShift.staffName}</span>
                  <span className="text-stone-500">•</span>
                  <span className="font-mono text-emerald-400 font-extrabold">
                    ${(activeShift.expectedCash || (activeShift.startingFloat + (activeShift.cashSales || 0))).toFixed(2)}
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>{isKhmer ? 'ហាងបានបិទ (បើកហាង)' : 'Store Closed (Open Store)'}</span>
                </>
              )}
            </button>

            {/* Language Switcher with Clean SVG Flags */}
            <LanguageSwitcher />

            {/* Customer Display Launcher */}
            <button
              type="button"
              onClick={openCustomerDisplayWindow}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition border border-stone-700"
              title="Open Customer Facing Display on 2nd monitor"
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('customer_display')}</span>
            </button>

            {/* Lock Station */}
            <button
              type="button"
              onClick={lockScreen}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition border border-stone-700"
            >
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>{t('lock_station')}</span>
            </button>

            {/* Exit Focus Mode Button */}
            <button
              type="button"
              onClick={() => setIsPosFocusMode(false)}
              className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>{t('exit_focus')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Terminal Grid: Left Product Catalog + Right Shopping Cart */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dynamic Product Catalog Grid (Left Side) */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-stone-800/80 overflow-hidden">
          {/* Top Controls: Search Bar & Quick Categories Bar */}
          <div className="p-4 sm:p-5 border-b border-stone-800 space-y-3.5 bg-stone-950/70 shrink-0">
            <div className="flex items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-full bg-stone-900 border border-stone-800 focus:border-amber-500 rounded-xl pl-10 pr-12 py-2.5 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none transition shadow-inner font-sans"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Category Filter Tabs + "+ New Category" button (with Smooth Scroll Controls) */}
            <div className="relative group/category-bar flex items-center">
              {/* Left Scroll Chevron Arrow */}
              {canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-4 pl-0.5 bg-gradient-to-r from-stone-950 via-stone-950/90 to-transparent pointer-events-none rounded-l-xl">
                  <button
                    type="button"
                    onClick={() => scrollCategories('left')}
                    className="w-7 h-7 rounded-lg bg-stone-900 border border-amber-500/40 text-amber-400 hover:text-amber-300 hover:bg-stone-850 shadow-md flex items-center justify-center cursor-pointer pointer-events-auto active:scale-95 transition"
                    aria-label="Scroll Left"
                    title="Scroll left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Scrollable Container */}
              <div
                ref={categoryScrollRef}
                onScroll={checkScrollability}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                className="w-full flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 px-0.5 scroll-smooth select-none cursor-grab active:cursor-grabbing no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const displayName = isKhmer && cat.nameKm ? cat.nameKm : cat.name;
                  const count = cat.id === 'all' 
                    ? products.length 
                    : products.filter((p) => p.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-950/40 ring-1 ring-amber-400 font-extrabold'
                          : 'bg-stone-900/90 text-stone-400 hover:text-stone-100 hover:bg-stone-850 border border-stone-800'
                      }`}
                    >
                      {getCategoryIcon(cat.icon)}
                      <span>{displayName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isSelected ? 'bg-stone-950/20 text-stone-950' : 'bg-stone-800 text-stone-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}

                {/* Add New Category Action */}
                <button
                  type="button"
                  onClick={handleNewCategoryClick}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-400 bg-amber-950/20 hover:bg-amber-950/40 border border-dashed border-amber-500/40 hover:border-amber-500 transition whitespace-nowrap cursor-pointer shrink-0"
                  title={t('create_category')}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ {t('new_category')}</span>
                </button>
              </div>

              {/* Right Scroll Chevron Arrow */}
              {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-4 pr-0.5 bg-gradient-to-l from-stone-950 via-stone-950/90 to-transparent pointer-events-none rounded-r-xl">
                  <button
                    type="button"
                    onClick={() => scrollCategories('right')}
                    className="w-7 h-7 rounded-lg bg-stone-900 border border-amber-500/40 text-amber-400 hover:text-amber-300 hover:bg-stone-850 shadow-md flex items-center justify-center cursor-pointer pointer-events-auto active:scale-95 transition animate-pulse hover:animate-none"
                    aria-label="Scroll Right"
                    title="Scroll right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Prominent Store Closed Notice Banner across POS */}
          {!activeShift && (
            <div className="mx-4 sm:mx-5 mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-stone-900 to-amber-950/70 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Lock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-100 text-sm">
                      {isKhmer ? 'ហាងមិនទាន់បានបើកដំណើរការលក់ (Store Closed)' : 'Store & Register Closed'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      {isKhmer ? 'មិនអាចលក់បាន' : 'Sales Blocked'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {isKhmer 
                      ? 'លក្ខខណ្ឌតម្រូវ៖ សូមបើកហាង/វេនគិតប្រាក់ និងផ្ទៀងផ្ទាត់ចំនួនទឹកប្រាក់បឋម (Float) ជាមុនសិន ទើបអាចចាប់ផ្តើមទទួលការបញ្ជាទិញ។'
                      : 'Condition: You must open the store / register shift and initialize the cash drawer float before selling.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openShiftModal('OPEN')}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/60 transition flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
              >
                <Unlock className="w-4 h-4" />
                <span>{isKhmer ? 'បើកហាង / បើកវេនឥឡូវនេះ' : 'Open Store to Sell'}</span>
              </button>
            </div>
          )}

          {/* Dynamic Responsive Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-500">
                <Coffee className="w-12 h-12 text-stone-700 mb-3" />
                <p className="text-base font-semibold text-stone-400">
                  {isKhmer ? 'រកមិនឃើញមុខទំនិញដែលត្រូវគ្នាទេ' : 'No matching products found'}
                </p>
                <p className="text-xs text-stone-600 mt-1 max-w-sm">
                  {isKhmer ? 'សូមសាកល្បងស្វែងរកពាក្យផ្សេង ឬផ្លាស់ប្តូរប្រភេទមុខទំនិញ' : 'Try searching for another keyword or switch category filters.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pb-6">
                {filteredProducts.map((product) => {
                  const isDisabled = product.isAutoDisabled || product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= 3;
                  const inCartItem = cart.find((c) => c.product.id === product.id);
                  const inCartCount = inCartItem ? inCartItem.quantity : 0;
                  const displayName = isKhmer && product.nameKm ? product.nameKm : product.name;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className={`group relative rounded-2xl border transition flex flex-col overflow-hidden select-none pos-card-hover ${
                        isDisabled
                          ? 'bg-stone-950/60 border-stone-800/50 opacity-60 cursor-not-allowed'
                          : 'bg-stone-900/80 border-stone-800/90 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-950/30 cursor-pointer backdrop-blur-xs'
                      }`}
                    >
                      {/* Thumbnail & Status Badges */}
                      <div className="relative aspect-4/3 w-full bg-stone-950 overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={displayName}
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80';
                          }}
                        />

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                          {isDisabled ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-900/90 text-rose-400 border border-rose-500/30 backdrop-blur-sm">
                              {product.disabledReason || t('out_of_stock')}
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/40 backdrop-blur-sm animate-pulse">
                              {product.stock} {t('low_stock')}
                            </span>
                          ) : null}
                        </div>

                        {/* Cart Counter Overlay Badge */}
                        {inCartCount > 0 && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center shadow-lg ring-2 ring-stone-950 glow-amber">
                            {inCartCount}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-stone-100 line-clamp-1 group-hover:text-amber-300 transition">
                            {displayName}
                          </h4>
                          <span className="text-[11px] text-stone-400 block mt-0.5">
                            {isKhmer && product.categoryKm ? product.categoryKm : product.category}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-stone-800/80">
                          <div>
                            <span className="text-sm font-extrabold text-amber-400 font-mono block">
                              ${product.price.toFixed(2)}
                            </span>
                            <span className="text-xs text-stone-400 block font-medium">
                              {formatKHR(product.price)}
                            </span>
                          </div>

                          {!isDisabled && (
                            <button
                              type="button"
                              onClick={(e) => handleQuickAdd(e, product)}
                              className="w-7 h-7 rounded-xl bg-stone-800 group-hover:bg-amber-500 text-stone-400 group-hover:text-stone-950 flex items-center justify-center transition shadow-sm font-bold"
                              title={t('quick_add')}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Cart Backdrop Overlay */}
        {isMobileCartOpen && (
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 lg:hidden animate-fade-in"
            onClick={() => setIsMobileCartOpen(false)}
          />
        )}

        {/* Real-Time Cart / Order Ticket (Side-by-side on lg+, Slide-over Drawer on Phone/iPad) */}
        <div 
          className={`
            fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-stone-950/98 shadow-2xl flex flex-col border-l border-stone-800 transition-transform duration-300 ease-in-out
            lg:static lg:w-80 xl:w-96 lg:translate-x-0 lg:shadow-none lg:bg-stone-900/60 lg:flex
            ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Cart Header */}
          <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
            <div className="flex items-center gap-2">
              {/* Mobile Drawer Close Button */}
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="lg:hidden p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 transition mr-1 cursor-pointer"
                title="Close Ticket"
              >
                <X className="w-4 h-4" />
              </button>
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-stone-100">{t('order_ticket')}</h3>
              {cartTotals.itemCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono">
                  {cartTotals.itemCount}
                </span>
              )}
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-stone-400 hover:text-rose-400 flex items-center gap-1 transition"
                title="Clear Ticket"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('clear_ticket')}</span>
              </button>
            )}
          </div>

          {/* Order Type & Customer Linking Bar */}
          <div className="p-3 border-b border-stone-800 space-y-2 bg-stone-950/40">
            {/* Order Type Selector */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-950 rounded-xl border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setOrderType('DINE_IN')}
                className={`py-1.5 rounded-lg font-bold transition ${
                  orderType === 'DINE_IN'
                    ? 'bg-amber-600 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {t('dine_in')}
              </button>
              <button
                type="button"
                onClick={() => setOrderType('TAKEAWAY')}
                className={`py-1.5 rounded-lg font-bold transition ${
                  orderType === 'TAKEAWAY'
                    ? 'bg-amber-600 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {t('takeaway')}
              </button>
            </div>

            {/* VIP Customer Linking Form */}
            <form onSubmit={handleLinkCustomerSubmit} className="relative">
              <Phone className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerPhoneQuery}
                onChange={(e) => setCustomerPhoneQuery(e.target.value)}
                placeholder={t('search_customer_placeholder')}
                className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl pl-8 pr-12 py-1.5 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none transition"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-700 text-[10px] text-amber-400 font-bold transition"
              >
                {t('link_member')}
              </button>
            </form>

            {/* Linked Customer Profile Pill */}
            {linkedCustomer && (
              <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-amber-300 block">{linkedCustomer.name}</span>
                  <span className="text-[10px] text-stone-400">
                    {linkedCustomer.points} {t('points_available')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={unlinkCustomer}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                >
                  {t('unlink')}
                </button>
              </div>
            )}
          </div>

          {/* Store Closed Warning Banner in Cart */}
          {!activeShift && (
            <div className="mx-3 mt-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs animate-fade-in shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-amber-300 block">{isKhmer ? 'ហាងមិនទាន់បានបើកដំណើរការ' : 'Store is Closed'}</span>
                  <span className="text-[10px] text-stone-400">{isKhmer ? 'ត្រូវតែបើកហាងជាមុនសិន ទើបអាចលក់បាន' : 'Must open store first before selling'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openShiftModal('OPEN')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-[11px] rounded-xl shadow-md cursor-pointer transition flex items-center gap-1 active:scale-95 shrink-0"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'បើកហាង' : 'Open Store'}</span>
              </button>
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
                <ShoppingBag className="w-10 h-10 text-stone-700 mb-2" />
                <span className="text-sm font-semibold text-stone-400">{t('ticket_empty_title')}</span>
                <p className="text-xs text-stone-600 mt-1 max-w-[200px]">
                  {t('ticket_empty_desc')}
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const displayName = isKhmer && item.product.nameKm ? item.product.nameKm : item.product.name;
                const subtotal = item.unitPrice * item.quantity;
                return (
                  <div
                    key={item.cartItemId}
                    className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800/80 space-y-2 shadow-sm hover:border-stone-700/80 transition"
                  >
                    <div className="flex items-start gap-3">
                      {/* Product Thumbnail Image */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-900 border border-stone-800 shrink-0 shadow-inner">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={displayName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center bg-stone-900 text-stone-600 fallback-icon ${item.product.imageUrl ? 'hidden' : ''}`}>
                          <Coffee className="w-5 h-5 text-amber-500/50" />
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-xs font-bold text-stone-200 truncate leading-tight" title={displayName}>
                            {displayName}
                          </h4>
                          <span className="text-xs font-extrabold text-amber-400 font-mono shrink-0">
                            ${subtotal.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1 mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono font-bold text-amber-400">
                              ${item.unitPrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">
                              ({formatKHR(item.unitPrice)})
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => duplicateCartItem(item.cartItemId)}
                              className="text-stone-500 hover:text-emerald-400 p-0.5 transition cursor-pointer"
                              title={isKhmer ? "ចម្លងមុខទំនិញនេះ (+1)" : "Duplicate item (+1)"}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => voidCartItem(item.cartItemId)}
                              className="text-stone-500 hover:text-rose-400 p-0.5 transition cursor-pointer"
                              title="Void item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Modifiers Pill Tags */}
                        {item.modifierLabels && item.modifierLabels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.modifierLabels.map((lbl, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] px-1.5 py-0.2 rounded bg-stone-900 text-amber-300/80 border border-stone-800"
                              >
                                {lbl}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Barista Notes & Stepper */}
                    {editingNoteId === item.cartItemId ? (
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="e.g. Oat milk, Extra hot..."
                          className="w-full bg-stone-900 border border-amber-500/60 rounded-lg px-2 py-1 text-[11px] text-stone-200 focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveNote(item.cartItemId)}
                          className="px-2 py-1 bg-amber-600 text-stone-950 font-bold rounded-lg text-[10px]"
                        >
                          {t('save')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1 border-t border-stone-900">
                        <button
                          onClick={() => handleOpenNoteModal(item)}
                          className="text-[10px] text-stone-500 hover:text-amber-400 flex items-center gap-1 transition"
                        >
                          <FileEdit className="w-3 h-3" />
                          <span>{item.notes ? item.notes : `+ ${t('notes')}`}</span>
                        </button>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-lg px-1.5 py-0.5">
                          <button
                            onClick={() => updateCartQuantity(item.cartItemId, item.quantity - 1)}
                            className="w-4 h-4 flex items-center justify-center text-stone-400 hover:text-amber-400 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-stone-200 min-w-[14px] text-center font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.cartItemId, item.quantity + 1)}
                            className="w-4 h-4 flex items-center justify-center text-stone-400 hover:text-amber-400 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Financial Summary & Checkout Footer */}
          <div className="p-4 border-t border-stone-800 bg-stone-950 space-y-3 shrink-0">
            {/* Quick Discount Presets */}
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="text-stone-400 text-[10px] font-semibold uppercase">{t('discount')}:</span>
              <div className="flex gap-1">
                {[0, 10, 15, 20, 50].map((disc) => (
                  <button
                    key={disc}
                    type="button"
                    onClick={() => setAuthorizedDiscount(disc)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      discountPercent === disc
                        ? 'bg-amber-600 text-stone-950'
                        : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    {disc === 0 ? 'None' : `${disc}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtotal, Tax, and Dual Currency Totals */}
            <div className="space-y-1.5 text-xs text-stone-400 border-t border-stone-900 pt-2 font-medium">
              <div className="flex justify-between">
                <span>{t('subtotal')}:</span>
                <span className="font-mono text-stone-300">${cartTotals.subtotal.toFixed(2)}</span>
              </div>

              {cartTotals.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>{t('discount')}:</span>
                  <span className="font-mono">-${cartTotals.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>{t('tax')}:</span>
                <span className="font-mono text-stone-300">${cartTotals.tax.toFixed(2)}</span>
              </div>

              {/* Grand Total in USD and KHR */}
              <div className="flex justify-between text-base font-extrabold text-stone-100 pt-2 border-t border-stone-800">
                <div className="flex flex-col">
                  <span className="text-stone-300">{t('grand_total')}:</span>
                  <span className="text-xs font-bold text-amber-400 font-sans mt-0.5">
                    {formatKHR(cartTotals.total)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-amber-400 font-mono text-2xl font-black">
                    ${cartTotals.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Charge Order CTA */}
            {!activeShift ? (
              <button
                type="button"
                onClick={() => {
                  showToast(
                    isKhmer ? 'សូមបើកហាង/វេនជាមុនសិន មុនពេលចាប់ផ្តើមលក់' : 'Store is closed. Please open store first to start selling.',
                    'warning'
                  );
                  openShiftModal('OPEN');
                }}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-sm rounded-xl shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2 transition duration-200 active:scale-[0.99] cursor-pointer glow-amber"
              >
                <Unlock className="w-4 h-4 stroke-[2.5]" />
                <span>{isKhmer ? 'បើកហាង/វេនដើម្បីចាប់ផ្តើមលក់' : 'Open Store to Start Selling'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => {
                  setIsMobileCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-sm rounded-xl shadow-lg shadow-amber-950/50 flex items-center justify-between transition duration-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer glow-amber"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 stroke-[2.5]" />
                  <span>{t('proceed_to_payment')}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-base font-black">
                  <span>${cartTotals.total.toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Cart Action Bar for Mobile Phones & Tablets */}
      {!isMobileCartOpen && cartTotals.itemCount > 0 && (
        <div className="lg:hidden fixed bottom-16 sm:bottom-4 left-3 right-3 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-stone-950 font-black text-sm flex items-center justify-between shadow-2xl shadow-amber-950/80 active:scale-[0.98] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-stone-950 text-amber-400 font-mono text-xs flex items-center justify-center font-bold">
                {cartTotals.itemCount}
              </span>
              <span className="font-sans font-bold">{isKhmer ? 'ពិនិត្យវិក្កយបត្រ' : 'View Order Ticket'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black">${cartTotals.total.toFixed(2)}</span>
              <span className="text-xs font-semibold">({formatKHR(cartTotals.total)})</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </div>
          </button>
        </div>
      )}

      {/* Modals */}
      <ProductModifierModal
        product={modifyingProduct}
        isOpen={!!modifyingProduct}
        onClose={() => setModifyingProduct(null)}
        onConfirm={handleConfirmModifiers}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      <ReceiptModal />
    </div>
  );
};
