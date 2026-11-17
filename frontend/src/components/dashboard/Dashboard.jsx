import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  ArrowUpRight, 
  ChevronRight, 
  Receipt,
  Zap,
  Calculator,
  Layers,
  Lock,
  BarChart3,
  Volume2,
  RefreshCw,
  Bike,
  User,
  Award,
  Globe
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { soundService } from '../../services/soundService';
import { api } from '../../services/api';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export const Dashboard = () => {
  const { 
    orders = [], 
    products = [], 
    ingredients = [], 
    lowStockProducts = [], 
    lowStockIngredients = [], 
    restockIngredient, 
    setActiveTab, 
    setReceiptModalOrder,
    lockScreen,
    activeShift,
    openShiftModal,
    isLiveMode,
    setIsLiveMode,
    liveSyncStatus,
    refreshDataSilently,
    user,
    storeInfo,
    setIsProfileModalOpen
  } = useApp();

  const { isKhmer, formatKHR } = useLanguage();

  // Dynamic Time Range Filter: 'today' | 'yesterday' | 'week' | 'month' | 'all'
  const [timeRange, setTimeRange] = useState('today');

  // Activity Feed Filter: 'all' | 'pos' | 'online' | 'delivery'
  const [feedFilter, setFeedFilter] = useState('all');

  // Load live backend stats whenever timeRange changes
  useEffect(() => {
    let isCancelled = false;
    api.fetchDashboardStats(timeRange).catch(() => {});

    return () => { isCancelled = true; };
  }, [timeRange, orders.length]);

  // 1. Dynamic Order Filtering based on selected Time Range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      if (o.status === 'REFUNDED') return false;
      if (timeRange === 'all') return true;
      const d = new Date(o.createdAt || Date.now());
      if (timeRange === 'today') {
        return d.toDateString() === now.toDateString();
      } else if (timeRange === 'yesterday') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return d.toDateString() === y.toDateString();
      } else if (timeRange === 'week') {
        return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      } else if (timeRange === 'month') {
        return (now.getTime() - d.getTime()) <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [orders, timeRange]);

  // 2. Dynamic Metrics Computation
  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const itemsSold = filteredOrders.reduce(
      (sum, o) => sum + (o.items || []).reduce((iSum, item) => iSum + (item.quantity || 1), 0),
      0
    );

    // Channel breakdown
    const onlineOrders = filteredOrders.filter((o) => o.channel === 'ONLINE_ECOMMERCE');
    const posOrders = filteredOrders.filter((o) => o.channel !== 'ONLINE_ECOMMERCE');

    // Active deliveries currently in preparation or transit
    const activeDeliveries = orders.filter((o) => 
      (o.orderType === 'DELIVERY' || o.fulfillmentType === 'DELIVERY') &&
      o.status !== 'COMPLETED' &&
      o.status !== 'CANCELLED' &&
      o.status !== 'REFUNDED'
    );

    return {
      revenue: Math.round(totalRevenue * 100) / 100,
      orders: totalOrders,
      avgOrder: Math.round(avgOrder * 100) / 100,
      itemsSold,
      onlineOrdersCount: onlineOrders.length,
      posOrdersCount: posOrders.length,
      activeDeliveriesCount: activeDeliveries.length
    };
  }, [filteredOrders, orders]);

  // 3. Dynamic Sales Timeline Data for Chart
  const timelineChartData = useMemo(() => {
    if (timeRange === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const daysKm = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
      const dayData = [0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
        let sales = 0;
        let tickets = 0;
        filteredOrders.forEach((o) => {
          const d = new Date(o.createdAt || Date.now());
          if (d.getDay() === dayIdx) {
            sales += (o.total || 0);
            tickets += 1;
          }
        });
        return {
          label: isKhmer ? daysKm[dayIdx] : days[dayIdx],
          sales: Math.round(sales * 100) / 100,
          tickets
        };
      });
      return dayData;
    }

    // Default hourly slots for 'today', 'yesterday', 'month', 'all'
    const hourSlots = [
      { label: '7 AM', h: 7 },
      { label: '8 AM', h: 8 },
      { label: '9 AM', h: 9 },
      { label: '10 AM', h: 10 },
      { label: '11 AM', h: 11 },
      { label: '12 PM', h: 12 },
      { label: '1 PM', h: 13 },
      { label: '2 PM', h: 14 },
      { label: '3 PM', h: 15 },
      { label: '4 PM', h: 16 },
      { label: '5 PM', h: 17 },
      { label: '6 PM', h: 18 },
      { label: '7 PM', h: 19 },
      { label: '8 PM', h: 20 },
      { label: '9 PM', h: 21 }
    ];

    return hourSlots.map(({ label, h }) => {
      let sales = 0;
      let tickets = 0;

      filteredOrders.forEach((o) => {
        const d = new Date(o.createdAt || Date.now());
        if (d.getHours() === h) {
          sales += (o.total || 0);
          tickets += 1;
        }
      });

      return {
        label,
        sales: Math.round(sales * 100) / 100,
        tickets
      };
    });
  }, [filteredOrders, timeRange, isKhmer]);

  // 4. Dynamic Category Revenue Data: 100% computed from active catalog & actual orders
  const categoryChartData = useMemo(() => {
    const categoryTotals = {};

    // Seed all existing product categories
    products.forEach((p) => {
      if (p.category && !categoryTotals[p.category]) {
        categoryTotals[p.category] = 0;
      }
    });

    filteredOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.category || item.category || 'Specialty';
        const lineVal = Number(item.subtotal || item.total || ((item.unitPrice || 0) * (item.quantity || 1)) || 0);
        categoryTotals[cat] = (categoryTotals[cat] || 0) + lineVal;
      });
    });

    const categoryTranslations = {
      'Hot Coffee': isKhmer ? 'កាហ្វេក្តៅ' : 'Hot Coffee',
      'Iced Coffee': isKhmer ? 'កាហ្វេទឹកកក' : 'Iced Coffee',
      'Cold Brew & Iced': isKhmer ? 'កាហ្វេត្រជាក់ & Cold Brew' : 'Cold Brew & Iced',
      'Tube Signatures': isKhmer ? 'កាហ្វេពិសេស Tube' : 'Tube Signatures',
      'Signature Frappes': isKhmer ? 'ហ្វ្រេបប៉េពិសេស' : 'Signature Frappes',
      'Artisan Bakery': isKhmer ? 'នំប៉័ង & នំខេក' : 'Artisan Bakery',
      'Pastries': isKhmer ? 'នំប៉័ង & នំ' : 'Pastries',
      'Beans': isKhmer ? 'គ្រាប់កាហ្វេ' : 'Whole Beans',
      'Whole Bean Bags': isKhmer ? 'គ្រាប់កាហ្វេ' : 'Whole Beans',
      'Specialty': isKhmer ? 'ភេសជ្ជៈពិសេស' : 'Specialty',
      'Merchandise': isKhmer ? 'សម្ភារៈកាហ្វេ' : 'Merchandise'
    };

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name: categoryTranslations[name] || name,
        rawName: name,
        sales: Math.round(value * 100) / 100
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [filteredOrders, products, isKhmer]);

  const CATEGORY_COLORS = [
    '#D97706', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', 
    '#F59E0B', '#14B8A6', '#6366F1', '#F43F5E', '#84CC16'
  ];

  // 5. Dynamic Top Selling Products Leaderboard
  const topSellingProducts = useMemo(() => {
    const itemMap = {};
    filteredOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const id = item.productId || item.name;
        if (!itemMap[id]) {
          itemMap[id] = {
            id,
            name: item.name || item.productName || 'Product',
            nameKm: item.nameKm,
            unitsSold: 0,
            revenue: 0
          };
        }
        itemMap[id].unitsSold += (item.quantity || 1);
        itemMap[id].revenue += Number(item.subtotal || item.total || ((item.unitPrice || 0) * (item.quantity || 1)) || 0);
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5)
      .map((item, idx) => {
        const matchedProd = products.find((p) => p.id === item.id || p.name === item.name);
        return {
          ...item,
          rank: idx + 1,
          category: matchedProd?.category || 'Specialty',
          imageUrl: matchedProd?.imageUrl,
          revenue: Math.round(item.revenue * 100) / 100
        };
      });
  }, [filteredOrders, products]);

  // 6. Filtered Live Activity Feed
  const filteredFeedOrders = useMemo(() => {
    return orders.filter((o) => {
      if (feedFilter === 'all') return true;
      if (feedFilter === 'pos') return o.channel !== 'ONLINE_ECOMMERCE';
      if (feedFilter === 'online') return o.channel === 'ONLINE_ECOMMERCE';
      if (feedFilter === 'delivery') return o.orderType === 'DELIVERY' || o.fulfillmentType === 'DELIVERY';
      return true;
    }).slice(0, 7);
  }, [orders, feedFilter]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 bg-stone-900/40">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP EXECUTIVE STRIP & REAL-TIME TIME RANGE SELECTOR
      ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-stone-950/80 border border-stone-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-amber-950/40 shrink-0">
            <BarChart3 className="w-6 h-6 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                {isKhmer ? 'ផ្ទាំងគ្រប់គ្រងទូទៅ & ស្ថិតិលក់ផ្ទាល់' : 'Executive Store Dashboard'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                100% Dynamic
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {isKhmer 
                ? 'ទិន្នន័យជាក់ស្តែងពី POS ស្ថានីយ ហាងអនឡាញ និងការដឹកជញ្ជូន' 
                : 'Live unified metrics across POS registers, online storefront & deliveries'}
            </p>
          </div>
        </div>

        {/* Dynamic Period Filter Pill Selector */}
        <div className="flex items-center p-1 rounded-2xl bg-stone-900 border border-stone-850 self-start md:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'today', label: isKhmer ? 'ថ្ងៃនេះ' : 'Today' },
            { id: 'yesterday', label: isKhmer ? 'ម្សិលមិញ' : 'Yesterday' },
            { id: 'week', label: isKhmer ? '៧ ថ្ងៃ' : '7 Days' },
            { id: 'month', label: isKhmer ? 'ខែនេះ' : '30 Days' },
            { id: 'all', label: isKhmer ? 'ទាំងអស់' : 'All Time' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundService.playBeepSound();
                setTimeRange(tab.id);
              }}
              className={`py-1.5 px-3 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                timeRange === tab.id
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/30 font-black'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. USER ACCOUNT PROFILE & LIVE DELIVERY FLEET CARDS
      ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Logged-in User Account Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/30 border border-stone-800/80 shadow-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 overflow-hidden">
            <div className="relative">
              <UserAvatar user={user} size="lg" shape="rounded-2xl" showBadge />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-stone-900 animate-pulse" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white truncate">
                  {user?.name || 'Administrator'}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800">
                  {user?.role || 'OWNER'}
                </span>
              </div>
              <p className="text-xs text-stone-400 truncate mt-0.5">
                {user?.email || 'admin@aromacoffee.com'} • {storeInfo?.name || 'Aroma Coffee'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title={isKhmer ? 'កែប្រែគណនី' : 'Account Profile'}
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isKhmer ? 'គណនី' : 'Profile'}</span>
            </button>
            <button
              type="button"
              onClick={lockScreen}
              className="p-2 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-rose-300 transition cursor-pointer"
              title={isKhmer ? 'ចាក់សោ PIN' : 'Lock Screen'}
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Admin Live Location Delivery GPS Card (Dynamic) */}
        <div 
          onClick={() => setActiveTab('delivery')}
          className="lg:col-span-2 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-stone-900 to-stone-950 border border-emerald-600/40 hover:border-emerald-500/80 shadow-lg flex items-center justify-between gap-4 cursor-pointer group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition shadow-md shrink-0">
              <Bike className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                  <span>{isKhmer ? 'ផែនទីដឹកជញ្ជូនផ្ទាល់ (Live Fleet GPS)' : 'Live Delivery Fleet GPS'}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {metrics.activeDeliveriesCount} {isKhmer ? 'កំពុងដឹក' : 'Active Orders'}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {metrics.onlineOrdersCount} {isKhmer ? 'ការកុម្ម៉ង់ពីហាងអនឡាញ' : 'Online Store Orders'} • {metrics.posOrdersCount} {isKhmer ? 'ការកុម្ម៉ង់នៅបេឡា POS' : 'POS Register Tickets'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black text-xs transition shadow-md shrink-0">
            <span>{isKhmer ? 'បើកផែនទី' : 'Open GPS Map'}</span>
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SHIFT CONTROLS & LIVE SYNC STRIP
      ────────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-3xl bg-stone-950/80 border border-stone-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-100">
              {isKhmer ? 'ស្ថានភាពវេនគិតប្រាក់ (POS Shift)' : 'Register Shift Session'}
            </h4>
            <p className="text-xs text-stone-400">
              {activeShift 
                ? `${isKhmer ? 'កំពុងបើកដំណើរការដោយ' : 'Active cashier:'} ${activeShift.cashierName || user?.name || 'Staff'}`
                : (isKhmer ? 'មិនទាន់បើកវេនគិតប្រាក់នៅឡើយទេ' : 'Shift currently closed')}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Live Mode Indicator & Quick Sync */}
          <div className="flex items-center">
            <button
              onClick={() => {
                soundService.playBeepSound();
                setIsLiveMode(!isLiveMode);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-l-xl text-xs font-bold transition border cursor-pointer ${
                isLiveMode
                  ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300 hover:bg-emerald-900/80 shadow-sm'
                  : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
              title={isLiveMode ? 'Live Mode Active: Auto-syncing every 5s' : 'Live Mode Paused'}
            >
              <span className="relative flex h-2 w-2">
                {isLiveMode && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveMode ? 'bg-emerald-400' : 'bg-stone-500'}`}></span>
              </span>
              <span className="font-mono text-[11px] uppercase">
                {isLiveMode ? (isKhmer ? 'ផ្ទាល់ (5s)' : 'LIVE (5s)') : (isKhmer ? 'ផ្អាក' : 'PAUSED')}
              </span>
            </button>
            <button
              onClick={() => {
                soundService.playBeepSound();
                refreshDataSilently(false);
              }}
              className={`px-2 py-2 rounded-r-xl border-y border-r transition text-xs cursor-pointer ${
                isLiveMode
                  ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-900/60'
                  : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
              title={isKhmer ? 'ទាញទិន្នន័យថ្មីភ្លាមៗ' : 'Sync Now'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${liveSyncStatus === 'syncing' ? 'animate-spin text-emerald-300' : ''}`} />
            </button>
          </div>

          <button
            onClick={() => soundService.speakKhmerWelcome()}
            title={isKhmer ? 'ស្ដាប់សំឡេងស្វាគមន៍ជាភាសាខ្មែរ' : 'Play Welcome Announcement'}
            className="px-3.5 py-2 rounded-xl bg-amber-950/40 border border-amber-600/50 hover:bg-amber-900/50 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{isKhmer ? 'សំឡេង' : 'Voice'}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 hover:border-amber-500 text-stone-300 hover:text-stone-100 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
            <span>{isKhmer ? 'របាយការណ៍' : 'Reports'}</span>
          </button>

          <button
            onClick={() => openShiftModal(activeShift ? 'CLOSE' : 'OPEN')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer ${
              activeShift 
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 shadow-amber-950/50'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-emerald-950/50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>
              {activeShift 
                ? (isKhmer ? 'បិទវេន (Z-Report)' : 'End Shift (Z-Report)') 
                : (isKhmer ? 'បើកវេនថ្មី' : 'Open Shift')}
            </span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. 4 KPI METRIC CARDS (DYNAMIC TO SELECTED TIME RANGE)
      ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Gross Sales */}
        <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {isKhmer ? 'ចំណូលលក់សរុប' : 'Gross Sales Revenue'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-stone-100 font-mono tracking-tight">
              ${metrics.revenue.toFixed(2)}
            </h3>
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-amber-400 font-semibold font-mono">{formatKHR(metrics.revenue)}</span>
              <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{timeRange.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Completed Orders */}
        <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {isKhmer ? 'ការកុម្ម៉ង់សរុប' : 'Completed Orders'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-stone-100 font-mono tracking-tight">
              {metrics.orders}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-stone-400">
              <span>{isKhmer ? 'មធ្យមភាគក្នុង ១ វិក្កយបត្រ:' : 'Average Ticket:'}</span>
              <span className="font-bold text-amber-400 font-mono">${metrics.avgOrder.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Low Stock & Materials Alert */}
        <div
          onClick={() => setActiveTab('inventory')}
          className={`p-6 rounded-3xl border shadow-lg relative overflow-hidden cursor-pointer transition ${
            lowStockProducts.length > 0 || lowStockIngredients.length > 0
              ? 'bg-rose-950/30 border-rose-800/60 hover:bg-rose-950/50 hover:border-rose-600'
              : 'bg-stone-900/80 border-stone-800/80 hover:border-stone-700'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {isKhmer ? 'ស្តុក & គ្រឿងផ្សំជិតអស់' : 'Low Stock & Raw Materials'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold font-mono tracking-tight text-rose-400">
              {lowStockProducts.length + lowStockIngredients.length}
            </h3>
            <p className="text-xs text-stone-400">
              {isKhmer 
                ? `${lowStockIngredients.length} គ្រឿងផ្សំជិតអស់ • ${lowStockProducts.length} មុខទំនិញ`
                : `${lowStockIngredients.length} ingredients • ${lowStockProducts.length} menu items`}
            </p>
          </div>
        </div>

        {/* Card 4: Omnichannel Volume */}
        <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {isKhmer ? 'បរិមាណលក់តាមឆានែល' : 'Omnichannel Breakdown'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-stone-100 font-mono tracking-tight">
              {metrics.itemsSold} <span className="text-sm font-normal text-stone-400 font-sans">cups/items</span>
            </h3>
            <p className="text-xs text-stone-400">
              {metrics.onlineOrdersCount} {isKhmer ? 'ហាងអនឡាញ' : 'Online'} • {metrics.posOrdersCount} {isKhmer ? 'បេឡា POS' : 'In-Store POS'}
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. RECHARTS: TIMELINE SALES VELOCITY & CATEGORY SHARE
      ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Hourly / Daily Timeline Sales Velocity */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-stone-900/80 border border-stone-800/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-100">
                {timeRange === 'week' 
                  ? (isKhmer ? 'ល្បឿនលក់តាមថ្ងៃក្នុងសប្តាហ៍' : 'Daily Sales Velocity (Last 7 Days)') 
                  : (isKhmer ? 'ល្បឿនលក់ប្រចាំម៉ោងផ្ទាល់' : 'Live Hourly Sales Velocity')}
              </h3>
              <p className="text-xs text-stone-400">
                {isKhmer ? 'ដំណើរការចំណូលជាក់ស្តែងតាមប្រតិបត្តិការផ្ទាល់' : 'Real-time revenue progression computed from orders'}
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-800/40">
              {timeRange.toUpperCase()}
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2a27" vertical={false} />
                <XAxis dataKey="label" stroke="#78716c" fontSize={11} tickLine={false} />
                <YAxis stroke="#78716c" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-stone-950 border border-amber-600/50 rounded-2xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-stone-200">{label}</p>
                          <p className="text-amber-400 font-mono font-bold">
                            {isKhmer ? 'ចំណូល:' : 'Revenue:'} ${payload[0].value.toFixed(2)} ({formatKHR(payload[0].value)})
                          </p>
                          <p className="text-stone-400">
                            {isKhmer ? 'វិក្កយបត្រ:' : 'Tickets:'} {payload[0].payload.tickets}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#amberGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Revenue Breakdown */}
        <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800/80 shadow-lg space-y-4">
          <div>
            <h3 className="text-base font-bold text-stone-100">
              {isKhmer ? 'ចំណែកតាមប្រភេទមុខទំនិញ' : 'Category Share'}
            </h3>
            <p className="text-xs text-stone-400">
              {isKhmer ? 'ការបែងចែកចំណូលតាមប្រភេទភេសជ្ជៈ & ទំនិញ' : 'Revenue split across drinks & merchandise'}
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData.slice(0, 6)} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2a27" horizontal={false} />
                <XAxis type="number" stroke="#78716c" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <YAxis dataKey="name" type="category" stroke="#78716c" fontSize={11} tickLine={false} width={95} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2.5 bg-stone-950 border border-amber-600/50 rounded-2xl shadow-xl text-xs">
                          <p className="font-bold text-stone-200">{payload[0].payload.name}</p>
                          <p className="text-amber-400 font-mono font-bold">${payload[0].value.toFixed(2)} ({formatKHR(payload[0].value)})</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="sales" radius={[0, 8, 8, 0]}>
                  {categoryChartData.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. TOP SELLING PRODUCTS LEADERBOARD
      ────────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800/80 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-100">
                {isKhmer ? 'មុខទំនិញលក់ដាច់បំផុត (Top 5 Bestsellers)' : 'Top Selling Products Leaderboard'}
              </h3>
              <p className="text-xs text-stone-400">
                {isKhmer ? 'ចំណាត់ថ្នាក់តាមចំនួនលក់ & ចំណូលជាក់ស្តែង' : 'Ranked dynamically by units sold and generated revenue'}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-stone-400 bg-stone-950 px-3 py-1 rounded-xl border border-stone-800">
            {timeRange.toUpperCase()}
          </span>
        </div>

        {topSellingProducts.length === 0 ? (
          <p className="text-xs text-stone-500 py-6 text-center">
            {isKhmer ? 'មិនទាន់មានទិន្នន័យលក់ក្នុងកំឡុងពេលនេះទេ' : 'No sales recorded for this period yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            {topSellingProducts.map((item) => (
              <div 
                key={item.id}
                className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 hover:border-amber-500/40 transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`w-6 h-6 rounded-xl flex items-center justify-center font-black text-xs ${
                    item.rank === 1 
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/40' 
                      : item.rank === 2
                      ? 'bg-stone-300 text-stone-950'
                      : item.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-stone-800 text-stone-300'
                  }`}>
                    #{item.rank}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400">
                    {item.category}
                  </span>
                </div>

                <div className="my-3">
                  <h4 className="font-black text-xs sm:text-sm text-stone-100 line-clamp-1">
                    {isKhmer && item.nameKm ? item.nameKm : item.name}
                  </h4>
                  <p className="text-xs text-amber-400 font-mono font-bold mt-1">
                    ${item.revenue.toFixed(2)}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-850 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                  <span>{isKhmer ? 'លក់បាន:' : 'Sold:'}</span>
                  <span className="text-white font-bold">{item.unitsSold} units</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          7. RAW INGREDIENTS MONITOR & LIVE ORDER FEED
      ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw Ingredients Alert Monitor */}
        <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-bold text-stone-100">
                  {isKhmer ? 'សុខភាពគ្រឿងផ្សំ & រូបមន្ត (BOM)' : 'Raw Ingredients & Recipe Health'}
                </h3>
                <p className="text-xs text-stone-400">
                  {isKhmer ? 'តាមដានស្តុកគ្រាប់កាហ្វេ ទឹកដោះគោ និងកែវផ្ទាល់' : 'Live monitoring of beans, milk, and cup stocks'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{isKhmer ? 'គ្រប់គ្រងរូបមន្ត' : 'Manage BOM'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {ingredients.slice(0, 5).map((ing) => {
              const isLow = ing.stock <= ing.minThreshold;
              const ingName = isKhmer && ing.nameKm ? ing.nameKm : ing.name;
              return (
                <div
                  key={ing.id}
                  className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800 flex items-center justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-stone-200">{ingName}</h5>
                    <span className="text-[10px] text-stone-400">
                      {isKhmer ? 'កម្រិតកំណត់:' : 'Threshold:'} {ing.minThreshold} {ing.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        isLow ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-stone-300'
                      }`}
                    >
                      {ing.stock} {ing.unit}
                    </span>
                    <button
                      onClick={() => restockIngredient(ing.id, ing.unit === 'g' ? 500 : ing.unit === 'ml' ? 1000 : 50)}
                      className="px-2.5 py-1 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-stone-950 text-[10px] font-bold transition cursor-pointer"
                    >
                      {isKhmer ? '+ថែមស្តុក' : '+Restock'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live POS & Online Activity Feed */}
        <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800/80 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-bold text-stone-100">
                  {isKhmer ? 'ប្រតិបត្តិការលក់ផ្ទាល់' : 'Live Register & Store Feed'}
                </h3>
                <p className="text-xs text-stone-400">
                  {isKhmer ? 'កំណត់ត្រាប្រតិបត្តិការពីគ្រប់ឆានែល' : 'Real-time transaction feed from POS & online'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{isKhmer ? 'មើលទាំងអស់' : 'View All'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Activity Feed Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-950 border border-stone-850">
            {[
              { id: 'all', label: isKhmer ? 'ទាំងអស់' : 'All' },
              { id: 'pos', label: 'POS' },
              { id: 'online', label: isKhmer ? 'អនឡាញ' : 'Online' },
              { id: 'delivery', label: isKhmer ? 'ដឹកជញ្ជូន' : 'Delivery' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFeedFilter(f.id)}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  feedFilter === f.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredFeedOrders.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">
                {isKhmer ? 'មិនមានប្រតិបត្តិការត្រូវបង្ហាញទេ' : 'No transactions found in this filter.'}
              </p>
            ) : (
              filteredFeedOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setReceiptModalOrder(order)}
                  className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800 hover:border-amber-600/40 transition flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">{order.orderNumber}</span>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${
                        order.channel === 'ONLINE_ECOMMERCE'
                          ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}>
                        {order.channel === 'ONLINE_ECOMMERCE' ? 'ONLINE' : 'POS'}
                      </span>
                      {order.orderType === 'DELIVERY' && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                          <Bike className="w-2.5 h-2.5" />
                          <span>Delivery</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-300 mt-0.5">
                      {order.customerName || (isKhmer ? 'ភ្ញៀវទូទៅ' : 'Walk-in')} • {(order.items || []).length} {isKhmer ? 'មុខ' : 'item(s)'} • {order.paymentMethod}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-stone-100 font-mono block">
                      ${(order.total || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {isKhmer ? 'ទូទាត់រួច' : 'Settled'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};