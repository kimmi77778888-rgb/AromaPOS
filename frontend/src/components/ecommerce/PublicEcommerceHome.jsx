import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { 
  Coffee, 
  ShoppingBag, 
  Bike, 
  Store, 
  Search, 
  Sparkles, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  Flame, 
  Snowflake, 
  Layers, 
  Lock, 
  Globe, 
  ShieldCheck,
  ChevronRight,
  Filter,
  Tag,
  Menu,
  X,
  User,
  LocateFixed,
  Navigation,
  Compass,
  Radio,
  ChevronDown
} from 'lucide-react';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { EcommerceCustomizationModal } from './EcommerceCustomizationModal';
import { EcommerceCartDrawer } from './EcommerceCartDrawer';
import { EcommerceCheckoutModal } from './EcommerceCheckoutModal';
import { CustomerOrderTracker } from './CustomerOrderTracker';
import { CustomerAuthModal } from './CustomerAuthModal';
import { CustomerAccountModal } from './CustomerAccountModal';
import { LiveDeliveryMapModal } from './LiveDeliveryMapModal';
import { getLiveDeviceLocation } from '../../services/routingService';

export const TUBE_STORE_BRANCHES = [
  { 
    id: 'bkk1', 
    name: 'Aroma / Tube BKK1 Flagship', 
    nameKm: 'សាខា បឹងកេងកង ១ (ផ្លូវ ៥៧)', 
    address: 'Street 57, Sangkat Boeng Keng Kang 1, Phnom Penh', 
    hours: '6:30 AM - 9:00 PM',
    distance: '0.8 km',
    readyTime: '~10 mins'
  },
  { 
    id: 'tuolkork', 
    name: 'Aroma / Tube Toul Kork TK Avenue', 
    nameKm: 'សាខា ទួលគោក (TK Avenue)', 
    address: 'TK Avenue Mall, Street 315, Tuol Kork, Phnom Penh', 
    hours: '7:00 AM - 8:30 PM',
    distance: '3.2 km',
    readyTime: '~12 mins'
  },
  { 
    id: 'riverside', 
    name: 'Aroma / Tube Riverside Heritage', 
    nameKm: 'សាខា មាត់ទន្លេ (ដូនពេញ)', 
    address: '#118, Preah Sisowath Quay, Daun Penh, Phnom Penh', 
    hours: '7:00 AM - 10:00 PM',
    distance: '2.1 km',
    readyTime: '~10 mins'
  },
  { 
    id: 'edengarden', 
    name: 'Aroma / Tube Eden Garden Mall', 
    nameKm: 'សាខា អ៊ីដិនហ្គាដិន (បឹងកក់)', 
    address: 'Phnom Penh City Center, Srah Chak, Daun Penh', 
    hours: '7:30 AM - 9:30 PM',
    distance: '2.8 km',
    readyTime: '~15 mins'
  }
];

export const PHNOM_PENH_QUICK_DISTRICTS = [
  'Boeng Keng Kang',
  'Daun Penh',
  'Tuol Kouk',
  'Chamkar Mon',
  'Sen Sok',
  'Chbar Ampov',
  'Mean Chey',
  'Chroy Changvar'
];

const CATEGORIES = [
  { id: 'ALL', name: 'All Menu', nameKm: 'មុខទំនិញទាំងអស់', icon: Coffee },
  { id: 'Tube Signatures', name: 'Tube Signatures', nameKm: 'កាហ្វេពិសេស Tube', icon: Sparkles },
  { id: 'Cold Brew & Iced', name: 'Iced & Cold Brew', nameKm: 'កាហ្វេត្រជាក់', icon: Snowflake },
  { id: 'Hot Coffee', name: 'Hot Coffee', nameKm: 'កាហ្វេក្តៅ', icon: Flame },
  { id: 'Signature Frappes', name: 'Frappes & Blends', nameKm: 'ហ្វ្រេបប៉េពិសេស', icon: Sparkles },
  { id: 'Artisan Bakery', name: 'Fresh Bakery', nameKm: 'នំប៉័ង & នំខេក', icon: ShoppingBag },
  { id: 'Whole Bean Bags', name: 'Whole Beans', nameKm: 'គ្រាប់កាហ្វេ', icon: Layers },
  { id: 'Merchandise', name: 'Brewing Gear', nameKm: 'សម្ភារៈកាហ្វេ', icon: Store }
];

export const PublicEcommerceHome = ({ onSwitchToPos }) => {
  const { isKhmer } = useLanguage();
  const { products = [], orders = [], placeOnlineOrder, customerUser } = useApp();

  // Navigation & Search State
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Tube Coffee Fulfillment State (Delivery vs Store Pickup)
  const [fulfillmentMode, setFulfillmentMode] = useState('DELIVERY'); // 'DELIVERY' | 'PICKUP'
  const [selectedBranchId, setSelectedBranchId] = useState('bkk1');
  const [currentDeliveryAddress, setCurrentDeliveryAddress] = useState(
    customerUser?.address || '#45, Street 288, Sangkat Boeng Keng Kang 1, Phnom Penh'
  );
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressInputText, setAddressInputText] = useState('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('Boeng Keng Kang');
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  // Sync address if customerUser changes
  useEffect(() => {
    if (customerUser?.address) {
      setCurrentDeliveryAddress(`${customerUser.address}${customerUser.district ? `, Sangkat ${customerUser.district}` : ''}, Phnom Penh`);
    }
  }, [customerUser]);

  const activeBranch = useMemo(() => {
    return TUBE_STORE_BRANCHES.find((b) => b.id === selectedBranchId) || TUBE_STORE_BRANCHES[0];
  }, [selectedBranchId]);

  const handleUseLiveGps = async () => {
    setIsLocatingGps(true);
    const loc = await getLiveDeviceLocation();
    setIsLocatingGps(false);
    if (loc.success && loc.isRealGps) {
      setCurrentDeliveryAddress(`GPS Pinpoint (Lat: ${loc.lat.toFixed(4)}, Lon: ${loc.lon.toFixed(4)}), Sangkat Boeng Keng Kang 1, Phnom Penh`);
      setIsAddressModalOpen(false);
    } else {
      setCurrentDeliveryAddress('#45, Street 288, Sangkat Boeng Keng Kang 1, Phnom Penh');
      setIsAddressModalOpen(false);
    }
  };

  // E-Commerce Modals & Cart State
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [pendingCheckoutOrderData, setPendingCheckoutOrderData] = useState(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [latestPlacedOrder, setLatestPlacedOrder] = useState(null);

  // Customer Authentication & Account Modals State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalPrompt, setAuthModalPrompt] = useState('');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isLiveDeliveryMapOpen, setIsLiveDeliveryMapOpen] = useState(false);
  const [activeDeliveryOrderForMap, setActiveDeliveryOrderForMap] = useState(null);

  // Cart Management
  const handleAddToCart = (customizedItem) => {
    setCartItems((prev) => [customizedItem, ...prev]);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (index, newQty) => {
    setCartItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const total = Math.round(item.unitPrice * newQty * 100) / 100;
        return { ...item, quantity: newQty, totalPrice: total };
      })
    );
  };

  const handleRemoveCartItem = (index) => {
    setCartItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Checkout Pipeline
  const handleProceedToCheckout = (orderData) => {
    setPendingCheckoutOrderData(orderData);
    setIsCartOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const handleOrderPlacedSuccess = (newOrder) => {
    if (placeOnlineOrder) {
      placeOnlineOrder(newOrder);
    }
    setLatestPlacedOrder(newOrder);
    setCartItems([]);
  };

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'ALL' ||
        p.category === selectedCategory ||
        (selectedCategory === 'Tube Signatures' && (p.category === 'Tube Signatures' || p.name?.includes('Tube') || p.name?.includes('Thnol') || p.name?.includes('Phum') || p.name?.includes('Passion'))) ||
        (selectedCategory === 'Cold Brew & Iced' && (p.category === 'Cold Brew & Iced' || p.category?.includes('Cold') || p.category?.includes('Iced')));
      
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.nameKm || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q);

      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.totalPrice || item.unitPrice * item.quantity), 0);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP ANNOUNCEMENT & DELIVERY BANNER
      ────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 py-2 px-4 text-stone-950 font-bold text-xs flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 mx-auto">
          <Bike className="w-4 h-4 shrink-0 animate-bounce" />
          <span>
            {isKhmer 
              ? '🛵 ដឹកជញ្ជូនរហ័សទូទាំងរាជធានីភ្នំពេញ (៣០ នាទី) • ដឹកឥតគិតថ្លៃសម្រាប់ការកុម្ម៉ង់ចាប់ពី $១០ ឡើងទៅ!' 
              : '🛵 Fast 30-min Phnom Penh Delivery • Free Delivery on orders over $10.00 • Fresh Daily Micro-Roasts'}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. STICKY PUBLIC NAVBAR
      ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-stone-850 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-950/40">
            <Coffee className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-black text-lg sm:text-xl tracking-tight leading-none text-white">
              Aroma<span className="text-amber-500">Coffee</span>
            </h1>
            <p className="text-[10px] text-stone-400 font-medium tracking-wider uppercase mt-0.5">
              Artisan Roastery & Café
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-stone-300">
          <a href="#menu" className="hover:text-amber-400 transition">
            {isKhmer ? 'ម៉ឺនុយកាហ្វេ' : 'Explore Menu'}
          </a>
          <a href="#promos" className="hover:text-amber-400 transition">
            {isKhmer ? 'ប្រូម៉ូសិនពិសេស' : 'Special Offers'}
          </a>
          <a href="#roastery" className="hover:text-amber-400 transition">
            {isKhmer ? 'រោងកាហ្វេ' : 'Our Roastery'}
          </a>
          <a href="#locations" className="hover:text-amber-400 transition">
            {isKhmer ? 'ទីតាំង & ម៉ោងបើក' : 'Locations & Hours'}
          </a>
          <button
            type="button"
            onClick={() => setIsTrackerOpen(true)}
            className="hover:text-amber-400 transition flex items-center gap-1 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>{isKhmer ? 'តាមដានការកុម្ម៉ង់' : 'Track Order'}</span>
          </button>
        </nav>

        {/* Right Actions: Lang, Cart, POS Portal Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Customer Account Profile / Sign In Pill */}
          {customerUser ? (
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(true)}
              className="py-1.5 px-3 rounded-2xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/60 text-amber-300 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm"
              title="My Account & Purchase History"
            >
              {customerUser.avatar && !customerUser.avatar.includes('images.unsplash.com') ? (
                <img
                  src={customerUser.avatar}
                  alt={customerUser.name}
                  className="w-5 h-5 rounded-full object-cover border border-amber-400"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-black text-[10px] flex items-center justify-center">
                  {(customerUser.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden md:inline truncate max-w-[90px]">{customerUser.name}</span>
              <span className="text-[10px] font-mono text-amber-400 font-black">⭐ {customerUser.points || 0}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthModalPrompt(isKhmer ? 'ចុះឈ្មោះបង្កើតគណនី ដើម្បីទទួលបានត្រាកាហ្វេ & ១០០ ពិន្ទុ!' : 'Sign in or register to earn coffee stamps & points!');
                setIsAuthModalOpen(true);
              }}
              className="py-2 px-3 rounded-2xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Customer Sign In / Register"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">{isKhmer ? 'គណនីអតិថិជន' : 'Sign In'}</span>
            </button>
          )}

          {/* Cart Bag Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 sm:px-4 sm:py-2 rounded-2xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
            title="Open Shopping Bag"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{isKhmer ? 'កន្ត្រក' : 'Bag'}</span>
            {totalCartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-black text-[11px] flex items-center justify-center -mr-1 shadow">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileNavOpen && (
        <div className="lg:hidden bg-stone-950 border-b border-stone-800 p-4 space-y-3 font-bold text-xs text-stone-300">
          <a href="#menu" onClick={() => setIsMobileNavOpen(false)} className="block py-2 hover:text-amber-400">
            {isKhmer ? 'ម៉ឺនុយកាហ្វេ' : 'Explore Menu'}
          </a>
          <a href="#promos" onClick={() => setIsMobileNavOpen(false)} className="block py-2 hover:text-amber-400">
            {isKhmer ? 'ប្រូម៉ូសិនពិសេស' : 'Special Offers'}
          </a>
          <a href="#roastery" onClick={() => setIsMobileNavOpen(false)} className="block py-2 hover:text-amber-400">
            {isKhmer ? 'រោងកាហ្វេ' : 'Our Roastery'}
          </a>
          <a href="#locations" onClick={() => setIsMobileNavOpen(false)} className="block py-2 hover:text-amber-400">
            {isKhmer ? 'ទីតាំង & ម៉ោងបើក' : 'Locations & Hours'}
          </a>
          <button
            type="button"
            onClick={() => {
              setIsMobileNavOpen(false);
              setIsTrackerOpen(true);
            }}
            className="w-full text-left py-2 hover:text-amber-400 flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>{isKhmer ? 'តាមដានការកុម្ម៉ង់ផ្ទាល់' : 'Live Order Tracking'}</span>
          </button>
          <div className="pt-2 border-t border-stone-800">
            <LanguageSwitcher />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. HERO SECTION: ARTISAN COFFEE ROASTERS
      ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-8 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text & Call to Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'កាហ្វេរសជាតិពិសេសកម្រិតខ្ពស់នៅភ្នំពេញ' : 'Specialty Coffee Roastery in Phnom Penh'}</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              {isKhmer ? (
                <>
                  កាហ្វេលីងថ្មីៗ <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600">
                    ដឹកជញ្ជូនដល់ផ្ទះអ្នក
                  </span>
                </>
              ) : (
                <>
                  Freshly Roasted Coffee, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600">
                    Delivered to Your Door.
                  </span>
                </>
              )}
            </h2>

            <p className="text-sm sm:text-base text-stone-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {isKhmer 
                ? 'រសជាតិកាហ្វេពិតៗ ចម្រាញ់ចេញពីគ្រាប់កាហ្វេ Ethiopia Guji និង Mondulkiri លីងផ្ទាល់ក្នុងបរិមាណតិចៗ ដើម្បីរក្សាគុណភាពខ្ពស់បំផុត និងដឹកជញ្ជូនរហ័សទូទាំងភ្នំពេញ។' 
                : 'Single-origin beans ethically sourced from Ethiopian highlands and Mondulkiri, batch-roasted daily in Phnom Penh and handcrafted by artisan baristas.'}
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <a
                href="#menu"
                className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm flex items-center gap-2 transition shadow-xl shadow-amber-950/40"
              >
                <Bike className="w-4 h-4" />
                <span>{isKhmer ? 'កុម្ម៉ង់ដឹកជញ្ជូនឥឡូវនេះ' : 'Order Delivery'}</span>
              </a>

              <a
                href="#menu"
                className="py-3.5 px-6 rounded-2xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-200 font-bold text-sm flex items-center gap-2 transition"
              >
                <Store className="w-4 h-4 text-amber-400" />
                <span>{isKhmer ? 'មកយកនៅហាង' : 'Store Pickup'}</span>
              </a>
            </div>

            {/* Feature Pills */}
            <div className="pt-6 grid grid-cols-3 gap-3 border-t border-stone-850/80 text-left">
              <div>
                <p className="font-mono font-black text-lg sm:text-xl text-amber-400">30 Min</p>
                <p className="text-[11px] text-stone-400 font-medium">Fast City Delivery</p>
              </div>
              <div>
                <p className="font-mono font-black text-lg sm:text-xl text-emerald-400">KHQR</p>
                <p className="text-[11px] text-stone-400 font-medium">Bakong / ABA Pay</p>
              </div>
              <div>
                <p className="font-mono font-black text-lg sm:text-xl text-cyan-400">100%</p>
                <p className="text-[11px] text-stone-400 font-medium">Arabica Specialty</p>
              </div>
            </div>
          </div>

          {/* Right Visual Card Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden border border-stone-800 shadow-2xl bg-stone-900 group">
              <img
                src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
                alt="Artisan Specialty Coffee"
                className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
              
              {/* Floating Badge */}
              <div className="absolute top-4 left-4 p-2 rounded-xl bg-stone-950/85 backdrop-blur-md border border-stone-700 text-xs font-bold text-amber-300 flex items-center gap-1.5 shadow-lg">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>4.9 / 5.0 (520+ Reviews)</span>
              </div>

              {/* Bottom Card Content */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-stone-950/90 backdrop-blur-md border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    Bestseller of the Month
                  </span>
                  <h4 className="font-black text-sm text-white">Artisan Pour Over Reserve</h4>
                  <p className="text-[11px] text-stone-400 font-mono">Ethiopia Guji Heirloom</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-base text-amber-400">$4.75</span>
                  <span className="text-[10px] text-stone-500 block font-normal">≈ 19,475 ៛</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. PROMOTIONS CAROUSEL
      ────────────────────────────────────────────────────────────── */}
      <section id="promos" className="py-8 px-4 sm:px-8 border-y border-stone-850 bg-stone-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Promo 1 */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-stone-900 border border-amber-800/40 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-400 font-mono">Promo Code: AROMA20</span>
                <h4 className="font-black text-sm text-stone-100">{isKhmer ? 'បញ្ចុះតម្លៃ ២០% លើកដំបូង' : '20% Off First Online Order'}</h4>
                <p className="text-[11px] text-stone-400">Use code at checkout for any specialty coffee</p>
              </div>
            </div>

            {/* Promo 2 */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-stone-900 border border-emerald-800/40 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-400 font-mono">Orders $10+</span>
                <h4 className="font-black text-sm text-stone-100">{isKhmer ? 'ដឹកជញ្ជូនឥតគិតថ្លៃនៅភ្នំពេញ' : 'Free Delivery in Phnom Penh'}</h4>
                <p className="text-[11px] text-stone-400">Automatically applied on orders over $10.00</p>
              </div>
            </div>

            {/* Promo 3 */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 to-stone-900 border border-rose-800/40 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-400 font-mono">Every Tuesday</span>
                <h4 className="font-black text-sm text-stone-100">{isKhmer ? 'ដូរកាហ្វេទឹកដោះគោ Oat ឥតគិតថ្លៃ' : 'Free Oatly Oat Milk Upgrade'}</h4>
                <p className="text-[11px] text-stone-400">Enjoy creamy plant-based goodness on us</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. PRODUCT MENU CATALOG & CATEGORY FILTER
      ────────────────────────────────────────────────────────────── */}
      <section id="menu" className="py-12 sm:py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Coffee className="w-4 h-4" />
              <span>{isKhmer ? 'ម៉ឺនុយកាហ្វេ & នំប៉័ង' : 'Artisan Handcrafted Menu'}</span>
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1">
              {isKhmer ? 'ជ្រើសរើសភេសជ្ជៈដែលអ្នកចូលចិត្ត' : 'Choose Your Daily Brew'}
            </h3>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isKhmer ? 'ស្វែងរកកាហ្វេ, នំ, ឬរសជាតិ...' : 'Search drinks, bakery, roasts...'}
              className="w-full bg-stone-900 border border-stone-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TUBE COFFEE ORDER FULFILLMENT SWITCHER (DELIVERY VS PICK-UP)
        ────────────────────────────────────────────────────────────── */}
        <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl backdrop-blur-md">
          {/* Segmented 2-Way Tab Switcher */}
          <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-stone-950 border border-stone-800/80 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setFulfillmentMode('DELIVERY')}
              className={`py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                fulfillmentMode === 'DELIVERY'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-lg shadow-amber-950/40'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>{isKhmer ? 'ដឹកជញ្ជូន (Delivery)' : 'Delivery'}</span>
            </button>

            <button
              type="button"
              onClick={() => setFulfillmentMode('PICKUP')}
              className={`py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                fulfillmentMode === 'PICKUP'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-lg shadow-amber-950/40'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>{isKhmer ? 'ទៅយកនៅហាង (Pick-up)' : 'Pick-up'}</span>
            </button>
          </div>

          {/* Fulfillment Sub-Detail Strip */}
          <div className="mt-4 pt-3 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {fulfillmentMode === 'DELIVERY' ? (
              <>
                <div className="flex items-center gap-3 text-stone-300 w-full sm:w-auto">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-white truncate max-w-md">
                      {isKhmer ? 'ដឹកជញ្ជូនទៅកាន់:' : 'Delivering to:'} <span className="text-amber-400">{currentDeliveryAddress}</span>
                    </p>
                    <p className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>{isKhmer ? 'រយៈពេលដឹក: ~២០-៣០ នាទី • ដឹកឥតគិតថ្លៃសម្រាប់ការកុម្ម៉ង់ចាប់ពី $១០ ឡើង' : 'Est. Delivery: ~20-30 mins • Free delivery on orders > $10'}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAddressInputText(currentDeliveryAddress);
                    setIsAddressModalOpen(true);
                  }}
                  className="py-2 px-3.5 rounded-xl bg-stone-950 hover:bg-stone-850 border border-stone-750 text-amber-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKhmer ? 'ប្តូរអាសយដ្ឋាន' : 'Change Address'}</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 text-stone-300 w-full sm:w-auto">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-white truncate max-w-md">
                      {isKhmer ? 'ទៅយកនៅសាខា:' : 'Pick up at:'} <span className="text-amber-400">{activeBranch?.nameKm || activeBranch?.name}</span>
                    </p>
                    <p className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{activeBranch?.address} • <strong className="text-emerald-400">{isKhmer ? 'ឆុងរួចរាល់ក្នុង ~១០ នាទី (មិនបាច់តម្រង់ជួរ)' : 'Ready in ~10 mins (Skip queue)'}</strong></span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(true)}
                  className="py-2 px-3.5 rounded-xl bg-stone-950 hover:bg-stone-850 border border-stone-750 text-amber-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKhmer ? 'ប្តូរសាខា' : 'Change Branch'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`py-2 px-4 rounded-2xl font-bold text-xs whitespace-nowrap flex items-center gap-2 transition cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-950/30 font-black'
                    : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{isKhmer ? cat.nameKm : cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-stone-900/40 rounded-3xl border border-stone-850">
            <Coffee className="w-10 h-10 mx-auto text-stone-600 opacity-60" />
            <p className="font-bold text-stone-300">
              {isKhmer ? 'រកមិនឃើញមុខទំនិញតាមការស្វែងរកនេះទេ' : 'No items match your search criteria.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs hover:bg-amber-500/30 cursor-pointer"
            >
              {isKhmer ? 'បង្ហាញមុខទំនិញទាំងអស់' : 'Show All Items'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const riel = Math.round((product.price || 0) * 4100).toLocaleString();

              return (
                <div
                  key={product.id}
                  className="rounded-3xl bg-stone-900/90 border border-stone-850 overflow-hidden flex flex-col group hover:border-stone-700 transition duration-300 shadow-lg hover:shadow-2xl hover:shadow-black/60"
                >
                  {/* Image Container */}
                  <div className="relative h-48 w-full overflow-hidden bg-stone-950">
                    <img
                      src={product.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />

                    {/* Category Tag */}
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-950/80 backdrop-blur-md text-amber-300 border border-stone-800">
                      {isKhmer ? (product.categoryKm || product.category) : product.category}
                    </span>

                    {/* Stock status */}
                    {product.stock <= 5 && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800 backdrop-blur-md">
                        {isKhmer ? `សល់តែ ${product.stock}` : `Only ${product.stock} left`}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="font-black text-base text-stone-100 group-hover:text-amber-400 transition leading-snug">
                        {isKhmer ? (product.nameKm || product.name) : product.name}
                      </h4>
                      {isKhmer && product.nameKm && product.nameKm !== product.name && (
                        <p className="text-[11px] text-stone-400 font-medium">{product.name}</p>
                      )}
                      {product.description && (
                        <p className="text-xs text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Action Button */}
                    <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-lg font-black text-amber-400">
                          ${(product.price || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-stone-500 block font-normal">
                          ≈ {riel} ៛
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedProductForModal(product)}
                        className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-950/20"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{isKhmer ? 'កុម្ម៉ង់' : 'Order'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. OUR ROASTERY & PHILOSOPHY
      ────────────────────────────────────────────────────────────── */}
      <section id="roastery" className="py-16 px-4 sm:px-8 bg-stone-900/60 border-t border-stone-850">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>{isKhmer ? 'រឿងរ៉ាវរោងកាហ្វេ' : 'The Roasting Philosophy'}</span>
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {isKhmer 
                ? 'ពីចំការកាហ្វេរហូតដល់កែវរបស់អ្នក' 
                : 'From Farm to Your Cup, Handcrafted with Passion.'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              {isKhmer
                ? 'យើងជ្រើសរើសតែគ្រាប់កាហ្វេ Arabica លំដាប់ថ្នាក់ Specialty ដែលដាំដុះលើដីភ្នំខ្ពស់ៗពីប្រទេសអេត្យូពី កូឡុំប៊ី និងខេត្តមណ្ឌលគិរី។ គ្រាប់កាហ្វេទាំងអស់ត្រូវបានលីងក្នុងរោងចក្រផ្ទាល់ខ្លួននៅភ្នំពេញក្នុងបរិមាណតិចតួច (Micro-Batch) ដើម្បីផ្តល់នូវក្លិនឈ្ងុយ និងរសជាតិផ្អែមធម្មជាតិនៃផ្លែឈើ។'
                : 'At Aroma Coffee Roastery, every batch of coffee is meticulously roasted in our BKK1 flagship roastery using eco-friendly fluid-bed roasters. We partner directly with organic coffee farmers to ensure direct trade, equitable wages, and exceptional bean profiles.'}
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800">
                <p className="font-black text-sm text-amber-400">Ethically Sourced</p>
                <p className="text-[11px] text-stone-400 mt-0.5">100% Direct Trade with Farmers</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800">
                <p className="font-black text-sm text-emerald-400">Fresh Roasted</p>
                <p className="text-[11px] text-stone-400 mt-0.5">Micro-batch roasted within 48 hours</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80"
              alt="Coffee Roastery Machine"
              className="rounded-3xl border border-stone-800 shadow-2xl object-cover w-full h-80 sm:h-96"
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. CAFE LOCATIONS & HOURS
      ────────────────────────────────────────────────────────────── */}
      <section id="locations" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
            {isKhmer ? 'សាខាហាងរបស់យើង' : 'Visit Our Roasteries'}
          </span>
          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {isKhmer ? 'ទីតាំងហាង Aroma Coffee នៅភ្នំពេញ' : 'Store Locations & Open Hours'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-stone-900 border border-stone-850 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Store className="w-5 h-5" />
            </div>
            <h4 className="font-black text-base text-white">BKK1 Flagship Roastery</h4>
            <p className="text-xs text-stone-400">#42, Street 57, Sangkat Boeng Keng Kang 1, Phnom Penh</p>
            <div className="pt-2 text-xs font-mono space-y-1 text-stone-300">
              <p className="text-emerald-400 font-bold">Open Daily: 6:30 AM - 9:00 PM</p>
              <p className="text-stone-400">Tel: +855 23 999 881</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-stone-900 border border-stone-850 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Store className="w-5 h-5" />
            </div>
            <h4 className="font-black text-base text-white">Riverside Café</h4>
            <p className="text-xs text-stone-400">#118, Preah Sisowath Quay, Daun Penh, Phnom Penh</p>
            <div className="pt-2 text-xs font-mono space-y-1 text-stone-300">
              <p className="text-emerald-400 font-bold">Open Daily: 7:00 AM - 10:00 PM</p>
              <p className="text-stone-400">Tel: +855 23 999 882</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-stone-900 border border-stone-850 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Store className="w-5 h-5" />
            </div>
            <h4 className="font-black text-base text-white">TK Avenue Roastery</h4>
            <p className="text-xs text-stone-400">TK Avenue Mall, Street 315, Tuol Kork, Phnom Penh</p>
            <div className="pt-2 text-xs font-mono space-y-1 text-stone-300">
              <p className="text-emerald-400 font-bold">Open Daily: 7:00 AM - 8:30 PM</p>
              <p className="text-stone-400">Tel: +855 23 999 883</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. PUBLIC FOOTER
      ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-850 bg-stone-950 py-12 px-4 sm:px-8 text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black">
              ☕
            </div>
            <div>
              <p className="font-black text-sm text-white">Aroma Coffee & Bakery Roasters</p>
              <p className="text-[10px] text-stone-500">Phnom Penh, Kingdom of Cambodia</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <a href="#menu" className="hover:text-amber-400 transition">Online Menu</a>
            <a href="#roastery" className="hover:text-amber-400 transition">Our Craft</a>
            <a href="#locations" className="hover:text-amber-400 transition">Locations</a>
            <button
              type="button"
              onClick={() => setIsTrackerOpen(true)}
              className="hover:text-amber-400 transition cursor-pointer"
            >
              Order Tracking
            </button>
          </div>

          <p className="text-[11px] text-stone-500 text-center md:text-right">
            © {new Date().getFullYear()} Aroma Coffee Roastery. All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          9. MODALS & SLIDE-OUT DRAWERS
      ────────────────────────────────────────────────────────────── */}
      {/* 1. Customization Modal */}
      <EcommerceCustomizationModal
        product={selectedProductForModal}
        isOpen={Boolean(selectedProductForModal)}
        onClose={() => setSelectedProductForModal(null)}
        onAddToCart={handleAddToCart}
      />

      {/* 2. Cart & Delivery Drawer */}
      <EcommerceCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={handleProceedToCheckout}
        onRequireAuth={() => {
          setAuthModalPrompt(isKhmer ? 'សូមចុះឈ្មោះ ឬចូលគណនីមុនពេលទូទាត់ប្រាក់កាហ្វេ' : 'Please register or sign in to proceed to checkout');
          setIsAuthModalOpen(true);
        }}
        initialOrderType={fulfillmentMode}
        initialBranch={selectedBranchId}
        initialAddress={currentDeliveryAddress}
      />

      {/* 3. Checkout & Payment Modal (Bakong KHQR & COD) */}
      <EcommerceCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        orderData={pendingCheckoutOrderData}
        onOrderPlaced={handleOrderPlacedSuccess}
        onOpenLiveDeliveryMap={(order) => {
          setActiveDeliveryOrderForMap(order);
          setIsLiveDeliveryMapOpen(true);
        }}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      {/* 4. Live Order Status Tracker */}
      <CustomerOrderTracker
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        activeOrder={latestPlacedOrder}
        allOrders={orders}
        onOpenLiveMap={(order) => {
          setActiveDeliveryOrderForMap(order);
          setIsLiveDeliveryMapOpen(true);
        }}
        onOrderAgain={() => {
          setIsTrackerOpen(false);
          const menuEl = document.getElementById('menu');
          if (menuEl) menuEl.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 5. Customer Authentication Modal (Mandatory Registration/Login before Checkout) */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        messagePrompt={authModalPrompt}
        onAuthSuccess={(u) => {
          setIsAuthModalOpen(false);
          // If cart has items, immediately proceed to checkout with authenticated profile!
          if (cartItems.length > 0) {
            const subtotal = cartItems.reduce((sum, item) => sum + (item.totalPrice || item.unitPrice * item.quantity), 0);
            const isPickup = fulfillmentMode === 'PICKUP';
            const deliveryFee = isPickup ? 0 : (subtotal >= 10 ? 0 : 1.00);
            const grandTotal = Math.round((subtotal + deliveryFee) * 100) / 100;
            const branchObj = TUBE_STORE_BRANCHES.find((b) => b.id === selectedBranchId) || TUBE_STORE_BRANCHES[0];
            handleProceedToCheckout({
              orderType: fulfillmentMode,
              customerId: u.id,
              customerName: u.name,
              customerPhone: u.phone,
              carrier: 'Cellcard 4G LTE',
              deliveryAddress: !isPickup ? (u.address ? `${u.address}, ${u.district || 'Boeng Keng Kang'}, Phnom Penh` : currentDeliveryAddress) : null,
              deliveryNotes: '',
              pickupBranch: isPickup ? (branchObj?.name || 'Aroma BKK1 Flagship Roastery') : null,
              cartItems,
              subtotal,
              discount: 0,
              appliedPromo: null,
              deliveryFee,
              grandTotal,
              rielGrandTotal: Math.round(grandTotal * 4100).toLocaleString()
            });
          }
        }}
      />

      {/* 6. Customer Account & Order History Portal */}
      <CustomerAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onOpenLiveDeliveryMap={(order) => {
          setActiveDeliveryOrderForMap(order);
          setIsLiveDeliveryMapOpen(true);
        }}
        onReorderItems={(items) => {
          if (items && items.length > 0) {
            setCartItems((prev) => [...items, ...prev]);
            setIsCartOpen(true);
          }
        }}
      />

      {/* 7. Interactive Live Delivery Map Modal */}
      <LiveDeliveryMapModal
        isOpen={isLiveDeliveryMapOpen}
        onClose={() => {
          setIsLiveDeliveryMapOpen(false);
          setActiveDeliveryOrderForMap(null);
        }}
        order={activeDeliveryOrderForMap || latestPlacedOrder}
      />

      {/* ─────────────────────────────────────────────────────────────
          8. TUBE COFFEE STICKY FLOATING CART BAR (BOTTOM PILL)
      ────────────────────────────────────────────────────────────── */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg animate-fade-in font-sans">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-5 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black flex items-center justify-between shadow-2xl shadow-amber-500/40 border border-amber-300 transition-all cursor-pointer active:scale-95 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-950 text-amber-400 flex items-center justify-center font-black text-sm shadow">
                {totalCartCount}
              </div>
              <div className="text-left leading-tight">
                <p className="text-[10px] uppercase tracking-wider text-stone-900 font-extrabold flex items-center gap-1">
                  <span>{fulfillmentMode === 'DELIVERY' ? (isKhmer ? '🛵 ដឹកជញ្ជូន' : '🛵 Delivery') : (isKhmer ? '🏬 ទៅយកនៅហាង' : '🏬 Pick Up')}</span>
                  <span>•</span>
                  <span>{totalCartCount} {isKhmer ? 'កែវ/មុខ' : 'items'}</span>
                </p>
                <p className="text-base font-black font-mono">
                  ${subtotal.toFixed(2)}{' '}
                  <span className="text-xs font-normal opacity-85">
                    ({Math.round(subtotal * 4100).toLocaleString()} ៛)
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-stone-950/15 group-hover:bg-stone-950/25 px-3.5 py-2 rounded-2xl transition">
              <span>{isKhmer ? 'មើលកន្ត្រក & កុម្ម៉ង់' : 'View Cart & Order'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </div>
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          9. TUBE COFFEE STORE BRANCH SELECTOR MODAL
      ────────────────────────────────────────────────────────────── */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
          <div 
            className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">
                    {isKhmer ? 'ជ្រើសរើសសាខា Tube Coffee' : 'Select Tube Coffee Outlet'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {isKhmer ? 'ទៅយកកាហ្វេភ្លាមៗ មិនបាច់រង់ចាំតម្រង់ជួរ' : 'Pick up quickly without waiting in line'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBranchModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {TUBE_STORE_BRANCHES.map((b) => {
                const isSelected = selectedBranchId === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBranchId(b.id);
                      setFulfillmentMode('PICKUP');
                      setIsBranchModalOpen(false);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 shadow-lg'
                        : 'bg-stone-950/70 border-stone-800 hover:border-stone-700 hover:bg-stone-950'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">
                          {isKhmer ? b.nameKm : b.name}
                        </h4>
                        {isSelected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{b.address}</span>
                      </p>
                      <p className="text-[11px] text-stone-500 flex items-center gap-2">
                        <span>🕒 {b.hours}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">⚡ Ready in {b.readyTime}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-amber-400 block">
                        {b.distance}
                      </span>
                      <button
                        type="button"
                        className={`mt-2 py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950'
                            : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        {isSelected ? '✓ Selected' : 'Choose'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          10. TUBE COFFEE DELIVERY ADDRESS CHANGER MODAL
      ────────────────────────────────────────────────────────────── */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
          <div 
            className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">
                    {isKhmer ? 'ប្តូរទីតាំងដឹកជញ្ជូន' : 'Set Delivery Address'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {isKhmer ? 'ដឹកជញ្ជូនរហ័សទូទាំងរាជធានីភ្នំពេញ' : 'Fast door-to-door courier across Phnom Penh'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hardware Live GPS Quick Pin */}
            <button
              type="button"
              onClick={handleUseLiveGps}
              disabled={isLocatingGps}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/60 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
            >
              <LocateFixed className={`w-4 h-4 ${isLocatingGps ? 'animate-spin' : ''}`} />
              <span>
                {isLocatingGps
                  ? (isKhmer ? 'កំពុងចាប់យក GPS ពីឧបករណ៍...' : 'Acquiring Device GPS...')
                  : (isKhmer ? '📍 ប្រើប្រាស់ទីតាំង GPS ជាក់ស្តែងលើទូរស័ព្ទ/កុំព្យូទ័រ' : '📍 Use Current Live Device GPS')}
              </span>
            </button>

            {/* Quick District Pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300">
                {isKhmer ? 'ជ្រើសរើសខណ្ឌ/សង្កាត់:' : 'Select District / Sangkat:'}
              </label>
              <div className="flex flex-wrap gap-2">
                {PHNOM_PENH_QUICK_DISTRICTS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setSelectedDistrictFilter(d);
                      setCurrentDeliveryAddress(`#45, Street 288, Sangkat ${d}, Phnom Penh`);
                      setFulfillmentMode('DELIVERY');
                      setIsAddressModalOpen(false);
                    }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedDistrictFilter === d
                        ? 'bg-amber-500 text-stone-950 font-black'
                        : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Street Address Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300">
                {isKhmer ? 'ឬបញ្ចូលអាសយដ្ឋានលម្អិត:' : 'Or enter exact street/building details:'}
              </label>
              <input
                type="text"
                value={addressInputText}
                onChange={(e) => setAddressInputText(e.target.value)}
                placeholder="e.g. #45, St. 288, Sangkat Boeng Keng Kang 1, Phnom Penh"
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (addressInputText.trim()) {
                    setCurrentDeliveryAddress(addressInputText.trim());
                  }
                  setFulfillmentMode('DELIVERY');
                  setIsAddressModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs"
              >
                {isKhmer ? 'រក្សាទុក' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

