'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  Star, 
  Plus, 
  ChevronLeft, 
  Heart, 
  Home, 
  ShoppingBag, 
  Bell, 
  ChevronDown, 
  X, 
  Check, 
  Sparkles, 
  Wifi, 
  Battery, 
  Signal, 
  Smartphone, 
  Columns,
  Share2,
  Coffee,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';

export const CoffeeAppMobileExperience = ({ 
  initialScreen = 'home', // 'onboarding' | 'home' | 'detail'
  onClose,
  standalone = false 
}) => {
  const { 
    products = [], 
    customerUser, 
    showToast, 
    currencyRate = 4100,
    cartItems = [],
    placeOnlineOrder
  } = useApp();
  const { isKhmer } = useLanguage();

  // Active Screen: 'onboarding' | 'home' | 'detail'
  const [currentScreen, setCurrentScreen] = useState(initialScreen);
  // View layout mode: 'single' (interactive phone) or 'showcase' (3 screens side-by-side as in Figma mockup)
  const [layoutMode, setLayoutMode] = useState('single');

  // Selected product for Detail screen (Screen 3)
  const defaultProduct = useMemo(() => {
    return products.find(p => p.id === 'prod-espresso-coffee' || p.name?.toLowerCase().includes('espresso')) || 
           products.find(p => p.name?.toLowerCase().includes('cappuccino')) || 
           products[0] || {
      id: 'prod-espresso-coffee',
      name: 'Espresso Coffee',
      subtitle: 'with Chocolate',
      category: 'Cappuccino',
      price: 4.53,
      rating: 4.5,
      reviews: 2330,
      description: 'A cappuccino is an approximately 150 ml (5 oz) beverage, with 25 ml of espresso coffee and 85ml of fresh milk the fo... Read More',
      fullDescription: 'A cappuccino is an approximately 150 ml (5 oz) beverage, with 25 ml of espresso coffee and 85ml of fresh milk and velvety foam. Handcrafted with high-mountain Arabica beans and finished with delicate latte art.',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      topDownImage: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=80'
    };
  }, [products]);

  const [selectedProduct, setSelectedProduct] = useState(defaultProduct);

  useEffect(() => {
    if (defaultProduct && (!selectedProduct || !selectedProduct.id)) {
      setSelectedProduct(defaultProduct);
    }
  }, [defaultProduct]);

  // Screen 2 Catalog State
  const [selectedCategory, setSelectedCategory] = useState('Cappuccino');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState('West, Balurghat');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [favorites, setFavorites] = useState({});
  const [bottomNavTab, setBottomNavTab] = useState('home'); // 'home' | 'heart' | 'bag' | 'bell'
  const [isCartQuickDrawerOpen, setIsCartQuickDrawerOpen] = useState(false);
  const [isCheckoutSuccessOpen, setIsCheckoutSuccessOpen] = useState(false);

  // Screen 3 Detail State
  const [selectedSize, setSelectedSize] = useState('M'); // 'S' | 'M' | 'L'
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Available Categories (exact match to user mockup)
  const appCategories = ['Cappuccino', 'Machiato', 'Latte', 'Americano'];

  // Toggle favorite
  const toggleFavorite = (productId, e) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const next = { ...prev, [productId]: !prev[productId] };
      if (showToast) {
        showToast(
          next[productId] ? '❤️ Added to your Coffee Wishlist' : 'Removed from Wishlist',
          'info'
        );
      }
      return next;
    });
  };

  // Filtered products for Screen 2 Home
  const catalogProducts = useMemo(() => {
    let list = products.filter(p => {
      const matchCat = !selectedCategory || selectedCategory === 'All' ||
        (p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase())) ||
        (p.name && p.name.toLowerCase().includes(selectedCategory.toLowerCase()));
      
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));

      return matchCat && matchQuery;
    });

    // If filtering by specific category returns empty, fallback to all coffee
    if (list.length === 0 && products.length > 0) {
      list = products.slice(0, 8);
    }

    return list;
  }, [products, selectedCategory, searchQuery]);

  // Handle Quick Add from Screen 2
  const handleQuickAdd = (product, e) => {
    if (e) e.stopPropagation();
    const item = {
      productId: product.id,
      name: product.name,
      subtitle: product.subtitle || 'with Chocolate',
      imageUrl: product.imageUrl,
      basePrice: product.price || 4.53,
      unitPrice: product.price || 4.53,
      totalPrice: product.price || 4.53,
      quantity: 1,
      size: 'Medium (M)'
    };
    if (showToast) {
      showToast(`☕ Added ${product.name} to Cart! ($${(product.price || 4.53).toFixed(2)})`, 'success');
    }
  };

  // Handle Size selection price calculation
  const computedDetailPrice = useMemo(() => {
    const base = selectedProduct?.price || 4.53;
    if (selectedSize === 'S') return Math.max(2.5, base - 0.60);
    if (selectedSize === 'L') return base + 0.70;
    return base;
  }, [selectedProduct, selectedSize]);

  // Handle Buy Now from Screen 3
  const handleBuyNow = () => {
    const orderData = {
      id: `ord-app-${Date.now().toString().slice(-6)}`,
      orderNumber: `#COFFEE-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerUser?.name || 'Coffee Lover',
      customerEmail: customerUser?.email || 'coffee.app@user.com',
      items: [
        {
          productId: selectedProduct.id,
          productName: `${selectedProduct.name} (${selectedSize})`,
          unitPrice: computedDetailPrice,
          quantity: 1,
          subtotal: computedDetailPrice
        }
      ],
      total: computedDetailPrice,
      paymentMethod: 'KHQR / Card',
      createdAt: new Date().toISOString(),
      status: 'PREPARING'
    };

    if (placeOnlineOrder) {
      placeOnlineOrder(orderData);
    }

    setIsCheckoutSuccessOpen(true);
    if (showToast) {
      showToast(`🎉 Order Placed! ${selectedProduct.name} is being brewed! ☕`, 'success');
    }
  };

  // Open detail view for a specific product
  const handleOpenDetail = (product) => {
    setSelectedProduct(product);
    setCurrentScreen('detail');
  };

  // Locations list for dropdown
  const locationList = [
    'West, Balurghat',
    'BKK1 Flagship, Phnom Penh',
    'TK Avenue Mall, Tuol Kork',
    'Riverside Heritage, Daun Penh',
    'Eden Garden, Phnom Penh'
  ];

  /* ─────────────────────────────────────────────────────────────
     RENDER SCREEN 1: ONBOARDING / WELCOME SCREEN
  ────────────────────────────────────────────────────────────── */
  const renderOnboardingScreen = (isMockup = false) => {
    return (
      <div className="relative w-full h-full min-h-[720px] bg-[#140E0B] text-white flex flex-col justify-between overflow-hidden select-none font-sans">
        {/* Dynamic ambient coffee glow behind image */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-700/20 blur-3xl pointer-events-none" />

        {/* Top Status Bar (9:41) */}
        <div className="relative z-20 flex items-center justify-between px-7 pt-3.5 text-stone-200 text-xs font-semibold">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Hero Coffee Splash Photo */}
        <div className="relative flex-1 flex items-center justify-center px-4 pt-2 overflow-hidden">
          <div className="relative w-full max-w-[320px] h-[340px] flex items-center justify-center">
            {/* Dark glass mug with splashing coffee & milk */}
            <img
              src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
              alt="Coffee Splash"
              className="w-full h-full object-cover rounded-3xl shadow-2xl filter contrast-105"
            />
            {/* Realistic soft coffee vignette gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#140E0B] via-transparent to-transparent rounded-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#140E0B]/40 via-transparent to-transparent rounded-3xl" />
          </div>
        </div>

        {/* Bottom Content Card */}
        <div className="relative z-20 px-8 pb-9 pt-4 text-center space-y-5">
          <div className="space-y-2.5">
            <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-white leading-tight">
              Time for a coffee break....
            </h2>
            <p className="text-xs sm:text-[13px] text-stone-400 leading-relaxed max-w-[280px] mx-auto font-normal">
              Your daily dose of fresh brew delivered to your doorstep. Start your coffee journey now!
            </p>
          </div>

          {/* Stepper Dot Indicators: Elongated Orange Pill + 2 Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-6 h-2 rounded-full bg-[#C67C4E] transition-all" />
            <span className="w-2 h-2 rounded-full bg-stone-600 transition-all" />
            <span className="w-2 h-2 rounded-full bg-stone-600 transition-all" />
          </div>

          {/* Large CTA Button: Get Started */}
          <button
            type="button"
            onClick={() => setCurrentScreen('home')}
            className="w-full py-4 rounded-2xl bg-[#C67C4E] hover:bg-[#b06a3e] active:scale-[0.98] text-white font-bold text-sm tracking-wide shadow-xl shadow-amber-950/50 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────────
     RENDER SCREEN 2: HOME / CATALOG SCREEN
  ────────────────────────────────────────────────────────────── */
  const renderHomeScreen = (isMockup = false) => {
    return (
      <div className="relative w-full h-full min-h-[720px] bg-[#1E1916] text-white flex flex-col justify-between overflow-hidden select-none font-sans">
        {/* Status Bar */}
        <div className="relative z-20 flex items-center justify-between px-7 pt-3.5 text-stone-300 text-xs font-semibold">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto px-6 pt-3 pb-24 scrollbar-none space-y-5">
          {/* Top Bar: Location on left, Profile Avatar on right */}
          <div className="flex items-center justify-between pt-1">
            <div className="relative text-left">
              <span className="text-[11px] text-stone-400 font-medium block">
                Location
              </span>
              <button
                type="button"
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                className="text-xs font-bold text-white flex items-center gap-1 hover:text-amber-400 transition cursor-pointer mt-0.5"
              >
                <span>{currentLocation}</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {/* Location Selector Dropdown */}
              {isLocationDropdownOpen && (
                <div className="absolute top-10 left-0 z-50 w-56 p-2 rounded-2xl bg-[#28211D] border border-stone-700/80 shadow-2xl text-xs space-y-1 animate-fade-in">
                  {locationList.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setCurrentLocation(loc);
                        setIsLocationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition ${
                        currentLocation === loc
                          ? 'bg-[#C67C4E] text-white font-bold'
                          : 'text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Avatar Circle */}
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-amber-600/40 shadow-md shrink-0">
              <img
                src={customerUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Search Bar + Orange Filter Button */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 absolute left-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coffee"
                className="w-full bg-[#2C241F] border border-stone-800/80 rounded-2xl pl-11 pr-4 py-3 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#C67C4E] transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-stone-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Orange Filter Button */}
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className="w-11 h-11 rounded-2xl bg-[#C67C4E] hover:bg-[#b06a3e] active:scale-95 text-white flex items-center justify-center transition shadow-lg shadow-amber-950/40 cursor-pointer shrink-0"
              title="Filter Coffee"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Category Horizontal Scrolling Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {appCategories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#C67C4E] text-white shadow-md shadow-amber-950/30'
                      : 'bg-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 2-Column Product Grid (Exact Match to Screen 2) */}
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            {catalogProducts.slice(0, 6).map((product) => {
              const isFav = Boolean(favorites[product.id]);
              return (
                <div
                  key={product.id}
                  onClick={() => handleOpenDetail(product)}
                  className="rounded-2xl bg-[#28211D] border border-stone-800/60 p-2.5 flex flex-col justify-between group hover:border-[#C67C4E]/60 transition cursor-pointer shadow-lg shadow-black/20"
                >
                  {/* Image container */}
                  <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-stone-900">
                    <img
                      src={product.imageUrl || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    {/* Star Rating Badge (Top Left) */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-300 flex items-center gap-1 shadow">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{product.rating || '4.5'}</span>
                    </div>

                    {/* Heart Button (Top Right) */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(product.id, e)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-stone-300 hover:text-rose-400 transition"
                    >
                      <Heart className={`w-3 h-3 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="pt-2.5 text-left">
                    <h4 className="font-bold text-xs text-white truncate leading-snug">
                      {product.name}
                    </h4>
                    <p className="text-[10px] text-stone-400 truncate mt-0.5">
                      {product.subtitle || 'with Chocolate'}
                    </p>

                    {/* Price and Add Button Row */}
                    <div className="pt-2 flex items-center justify-between">
                      <span className="font-bold text-xs text-white">
                        $ {(product.price || 4.53).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(product, e)}
                        className="w-7 h-7 rounded-lg bg-[#C67C4E] hover:bg-[#b06a3e] active:scale-90 text-white flex items-center justify-center transition shadow-sm cursor-pointer"
                        title="Add to cart"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation Bar: Home, Heart, Bag, Bell */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-[#1E1916]/95 backdrop-blur-xl border-t border-stone-800/80 px-8 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setBottomNavTab('home')}
            className={`flex flex-col items-center gap-1 transition ${
              bottomNavTab === 'home' ? 'text-[#C67C4E]' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className={`w-1 h-1 rounded-full ${bottomNavTab === 'home' ? 'bg-[#C67C4E]' : 'opacity-0'}`} />
          </button>

          <button
            type="button"
            onClick={() => setBottomNavTab('heart')}
            className={`flex flex-col items-center gap-1 transition ${
              bottomNavTab === 'heart' ? 'text-[#C67C4E]' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className={`w-1 h-1 rounded-full ${bottomNavTab === 'heart' ? 'bg-[#C67C4E]' : 'opacity-0'}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setBottomNavTab('bag');
              setIsCartQuickDrawerOpen(true);
            }}
            className={`relative flex flex-col items-center gap-1 transition ${
              bottomNavTab === 'bag' ? 'text-[#C67C4E]' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#C67C4E] text-white text-[9px] font-black flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
            <span className={`w-1 h-1 rounded-full ${bottomNavTab === 'bag' ? 'bg-[#C67C4E]' : 'opacity-0'}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setBottomNavTab('bell');
              if (showToast) showToast('🔔 No new notifications right now!', 'info');
            }}
            className={`flex flex-col items-center gap-1 transition ${
              bottomNavTab === 'bell' ? 'text-[#C67C4E]' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className={`w-1 h-1 rounded-full ${bottomNavTab === 'bell' ? 'bg-[#C67C4E]' : 'opacity-0'}`} />
          </button>
        </div>
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────────
     RENDER SCREEN 3: PRODUCT DETAIL SCREEN (CLEAN LIGHT DESIGN)
  ────────────────────────────────────────────────────────────── */
  const renderDetailScreen = (isMockup = false) => {
    const isFav = Boolean(favorites[selectedProduct?.id]);
    const displayImage = selectedProduct?.topDownImage || selectedProduct?.imageUrl || "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=80";

    return (
      <div className="relative w-full h-full min-h-[720px] bg-white text-stone-900 flex flex-col justify-between overflow-hidden select-none font-sans">
        {/* Status Bar */}
        <div className="relative z-20 flex items-center justify-between px-7 pt-3.5 text-stone-800 text-xs font-semibold">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-24 scrollbar-none space-y-5">
          {/* Top Bar: Back Button < & Heart ♡ */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentScreen('home')}
              className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 flex items-center justify-center transition cursor-pointer"
              title="Back to Catalog"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={(e) => toggleFavorite(selectedProduct?.id, e)}
              className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 flex items-center justify-center transition cursor-pointer"
              title="Favorite"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Hero: Large Top-Down Coffee Cup with Latte Art on Saucer */}
          <div className="relative py-2 flex items-center justify-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full flex items-center justify-center">
              {/* Soft circular drop shadow */}
              <div className="absolute inset-4 rounded-full bg-stone-400/25 blur-xl transform translate-y-3" />
              
              <img
                src={displayImage}
                alt={selectedProduct?.name}
                className="w-full h-full object-cover rounded-full shadow-2xl relative z-10 border-4 border-white"
              />
            </div>
          </div>

          {/* Title, Subtitle, & Rating */}
          <div className="text-left space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
                  {selectedProduct?.name || 'Espresso Coffee'}
                </h2>
                <p className="text-xs text-stone-400 font-medium">
                  {selectedProduct?.subtitle || 'with Chocolate'}
                </p>
              </div>

              {/* Star Rating & Review Count */}
              <div className="flex items-center gap-1.5 text-xs text-stone-800 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{selectedProduct?.rating || '4.5'}</span>
                <span className="text-[11px] text-stone-400 font-normal">
                  ({(selectedProduct?.reviews || 2330).toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          {/* Thin Separator Line */}
          <div className="h-[1px] bg-stone-100" />

          {/* Description Section */}
          <div className="text-left space-y-1.5">
            <h3 className="text-xs font-bold text-stone-900">
              Description
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              {isDescriptionExpanded
                ? (selectedProduct?.fullDescription || selectedProduct?.description || 'A cappuccino is an approximately 150 ml (5 oz) beverage, with 25 ml of espresso coffee and 85ml of fresh milk and velvety foam. Handcrafted by artisan baristas with high-mountain Arabica beans.')
                : (selectedProduct?.description || 'A cappuccino is an approximately 150 ml (5 oz) beverage, with 25 ml of espresso coffee and 85ml of fresh milk the fo...')}
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="ml-1 text-[#C67C4E] font-bold hover:underline cursor-pointer"
              >
                {isDescriptionExpanded ? 'Read Less' : 'Read More'}
              </button>
            </p>
          </div>

          {/* Size Section: [ S ] [ M ] [ L ] */}
          <div className="text-left space-y-2.5">
            <h3 className="text-xs font-bold text-stone-900">
              Size
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {['S', 'M', 'L'].map((sz) => {
                const isActive = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'border-2 border-[#C67C4E] bg-[#FFF5EE] text-[#C67C4E] shadow-sm'
                        : 'border border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Bottom Bar: Price on left, "Buy Now" on right */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-stone-100 px-7 py-4 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[11px] text-stone-400 font-medium block">
              Price
            </span>
            <span className="text-base sm:text-lg font-black text-[#C67C4E]">
              $ {computedDetailPrice.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleBuyNow}
            className="py-3.5 px-8 rounded-2xl bg-[#C67C4E] hover:bg-[#b06a3e] active:scale-[0.98] text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-950/20 transition cursor-pointer"
          >
            Buy Now
          </button>
        </div>
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────────
     RENDER MAIN VIEW WRAPPER
  ────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#DDE2E8] dark:bg-stone-950 py-8 px-4 sm:px-8 font-sans selection:bg-[#C67C4E] selection:text-white flex flex-col items-center justify-center transition-colors">
      {/* Top Floating Control Bar */}
      <div className="w-full max-w-6xl mb-6 flex flex-wrap items-center justify-between gap-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md p-3 sm:p-4 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#C67C4E] text-white flex items-center justify-center shadow">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-stone-900 dark:text-white leading-tight">
              Coffee Shop App <span className="text-[#C67C4E]">UI UX Design</span>
            </h1>
            <p className="text-[11px] text-stone-500 font-mono">
              Modern Style • Clean UI • Auto Layout
            </p>
          </div>
        </div>

        {/* View Mode & Screen Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Switcher: Showcase vs Single Phone */}
          <div className="p-1 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setLayoutMode('showcase')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                layoutMode === 'showcase'
                  ? 'bg-white dark:bg-stone-900 text-[#C67C4E] shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>3-Screen Showcase</span>
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode('single')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                layoutMode === 'single'
                  ? 'bg-white dark:bg-stone-900 text-[#C67C4E] shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Interactive Phone</span>
            </button>
          </div>

          {/* Interactive Screen Stepper when in Single Phone mode */}
          {layoutMode === 'single' && (
            <div className="p-1 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCurrentScreen('onboarding')}
                className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer ${
                  currentScreen === 'onboarding'
                    ? 'bg-[#C67C4E] text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                1. Welcome
              </button>
              <button
                type="button"
                onClick={() => setCurrentScreen('home')}
                className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer ${
                  currentScreen === 'home'
                    ? 'bg-[#C67C4E] text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                2. Home
              </button>
              <button
                type="button"
                onClick={() => setCurrentScreen('detail')}
                className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer ${
                  currentScreen === 'detail'
                    ? 'bg-[#C67C4E] text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                3. Product Detail
              </button>
            </div>
          )}

          {/* Optional Close or return to Web Store */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition cursor-pointer"
              title="Close App View"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LAYOUT OPTION A: 3-SCREEN SHOWCASE (FIGMA DESIGN MOCKUP)
      ────────────────────────────────────────────────────────────── */}
      {layoutMode === 'showcase' && (
        <div className="w-full max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-center gap-8 py-4 animate-fade-in">
          {/* Left Title Card (Exact wording from user's image) */}
          <div className="xl:w-64 text-center xl:text-left space-y-4 shrink-0">
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black text-stone-800 dark:text-white tracking-tight leading-tight">
                Coffee Shop App
              </h2>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#C67C4E] tracking-tight">
                UI UX Design
              </h3>
            </div>

            <div className="pt-4 space-y-2 font-medium text-stone-600 dark:text-stone-400 text-sm">
              <p className="flex items-center gap-2 justify-center xl:justify-start">
                <span className="w-2 h-2 rounded-full bg-[#C67C4E]" />
                Modern Style
              </p>
              <p className="flex items-center gap-2 justify-center xl:justify-start">
                <span className="w-2 h-2 rounded-full bg-[#C67C4E]" />
                Clean UI
              </p>
              <p className="flex items-center gap-2 justify-center xl:justify-start">
                <span className="w-2 h-2 rounded-full bg-[#C67C4E]" />
                Auto Layout
              </p>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => setLayoutMode('single')}
                className="px-4 py-2.5 rounded-2xl bg-[#C67C4E] hover:bg-[#b06a3e] text-white text-xs font-bold transition shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Test Live Phone Simulator</span>
              </button>
            </div>
          </div>

          {/* Three Phone Mockups Side-by-Side */}
          <div className="flex-1 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            {/* Phone 1: Onboarding Screen */}
            <div className="w-[310px] h-[670px] rounded-[44px] bg-[#140E0B] p-3 shadow-2xl border-4 border-stone-800/80 ring-1 ring-black/40 overflow-hidden relative group">
              <div className="w-full h-full rounded-[34px] overflow-hidden relative">
                {renderOnboardingScreen(true)}
              </div>
            </div>

            {/* Phone 2: Home Catalog Screen */}
            <div className="w-[310px] h-[670px] rounded-[44px] bg-[#1E1916] p-3 shadow-2xl border-4 border-stone-800/80 ring-1 ring-black/40 overflow-hidden relative group">
              <div className="w-full h-full rounded-[34px] overflow-hidden relative">
                {renderHomeScreen(true)}
              </div>
            </div>

            {/* Phone 3: Product Detail Screen */}
            <div className="w-[310px] h-[670px] rounded-[44px] bg-white p-3 shadow-2xl border-4 border-stone-200/80 ring-1 ring-black/10 overflow-hidden relative group">
              <div className="w-full h-full rounded-[34px] overflow-hidden relative">
                {renderDetailScreen(true)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          LAYOUT OPTION B: SINGLE INTERACTIVE PHONE SIMULATOR
      ────────────────────────────────────────────────────────────── */}
      {layoutMode === 'single' && (
        <div className="relative mx-auto my-2 animate-fade-in">
          {/* Realistic iPhone Phone Shell */}
          <div className="w-[360px] sm:w-[390px] h-[780px] rounded-[52px] bg-stone-900 p-3.5 shadow-2xl border-4 border-stone-700/60 ring-8 ring-stone-950/40 overflow-hidden relative">
            {/* Dynamic Island / Top Speaker Notch */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-between px-2.5 pointer-events-none">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-800" />
              <span className="w-2.5 h-2.5 rounded-full bg-blue-950/80 border border-blue-900/60" />
            </div>

            {/* Internal Phone Viewport */}
            <div className="w-full h-full rounded-[42px] overflow-hidden relative bg-[#1E1916]">
              {currentScreen === 'onboarding' && renderOnboardingScreen()}
              {currentScreen === 'home' && renderHomeScreen()}
              {currentScreen === 'detail' && renderDetailScreen()}
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal Drawer */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#28211D] border border-stone-700/80 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#C67C4E]" />
                Filter Options
              </h3>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 font-medium block mb-1.5">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {['All', ...appCategories].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
                      className={`p-2 rounded-xl text-center font-bold ${
                        (selectedCategory === cat || (cat === 'All' && !selectedCategory))
                          ? 'bg-[#C67C4E] text-white'
                          : 'bg-stone-850 text-stone-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-stone-400 font-medium block mb-1.5">Sort by</label>
                <div className="grid grid-cols-2 gap-2">
                  <span className="p-2 rounded-xl bg-[#C67C4E] text-white text-center font-bold">Popular</span>
                  <span className="p-2 rounded-xl bg-stone-850 text-stone-300 text-center font-bold">Highest Rated</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFilterModalOpen(false)}
              className="w-full py-3 rounded-2xl bg-[#C67C4E] hover:bg-[#b06a3e] text-white font-bold text-xs shadow-lg transition"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}

      {/* Quick Cart Drawer */}
      {isCartQuickDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#28211D] border border-stone-700/80 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#C67C4E]" />
                Your Coffee Bag
              </h3>
              <button
                type="button"
                onClick={() => setIsCartQuickDrawerOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
              {cartItems.length === 0 ? (
                <p className="text-stone-400 text-center py-6">Your bag is empty. Tap '+' on any coffee to add!</p>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900 border border-stone-800">
                    <div>
                      <p className="font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-stone-400">{item.size || 'Regular'}</p>
                    </div>
                    <span className="font-bold text-[#C67C4E]">${(item.totalPrice || item.unitPrice || 4.53).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsCartQuickDrawerOpen(false);
                  handleBuyNow();
                }}
                className="w-full py-3 rounded-2xl bg-[#C67C4E] hover:bg-[#b06a3e] text-white font-bold text-xs shadow-lg transition"
              >
                Proceed to Checkout
              </button>
            )}
          </div>
        </div>
      )}

      {/* Checkout Success Popup */}
      {isCheckoutSuccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white text-stone-900 p-6 text-center space-y-4 shadow-2xl border border-stone-100">
            <div className="w-16 h-16 rounded-full bg-[#FFF5EE] text-[#C67C4E] mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900">
                Order Received!
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Your coffee is being brewed fresh right now. Estimated delivery in 15-20 minutes!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCheckoutSuccessOpen(false)}
              className="w-full py-3 rounded-2xl bg-[#C67C4E] hover:bg-[#b06a3e] text-white font-bold text-xs shadow-md transition"
            >
              Back to Coffee Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
