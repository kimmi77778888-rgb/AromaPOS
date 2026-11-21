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
  Lock,
  BarChart3,
  RefreshCw,
  Bike,
  User,
  Award,
  Layers,
  ArrowRight,
  TrendingUp,
  Package,
  Clock,
  Sparkles,
  Boxes,
  Compass,
  MapPin,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { soundService } from '../../services/soundService';
import { api } from '../../services/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
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
    setIsProfileModalOpen,
    setIsLiveDeliveryModalOpen,
    setSelectedOrderForTracking
  } = useApp();

  const { isKhmer, formatKHR } = useLanguage();

  // Dynamic Time Range Filter: 'today' | 'yesterday' | 'week' | 'month' | 'all'
  const [timeRange, setTimeRange] = useState('today');

  // Activity Feed Filter: 'all' | 'pos' | 'online' | 'delivery'
  const [feedFilter, setFeedFilter] = useState('all');

  // Load live stats on filter change
  useEffect(() => {
    let isCancelled = false;
    api.fetchDashboardStats(timeRange).catch(() => {});
    return () => { isCancelled = true; };
  }, [timeRange, orders.length]);

  // Clean order number formatter helper to eliminate any double "#"
  const cleanOrderNum = (num) => {
    if (!num) return '';
    const str = String(num).trim();
    return str.startsWith('#') ? str : `#${str}`;
  };

  // 1. Filtered Orders by Time Range
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

  // 2. Computed Metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const itemsSold = filteredOrders.reduce(
      (sum, o) => sum + (o.items || []).reduce((iSum, item) => iSum + (item.quantity || 1), 0),
      0
    );

    const onlineOrders = filteredOrders.filter((o) => o.channel === 'ONLINE_ECOMMERCE');
    const posOrders = filteredOrders.filter((o) => o.channel !== 'ONLINE_ECOMMERCE');

    const onlineRevenue = onlineOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const posRevenue = posOrders.reduce((sum, o) => sum + (o.total || 0), 0);

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
      onlineRevenue: Math.round(onlineRevenue * 100) / 100,
      posRevenue: Math.round(posRevenue * 100) / 100,
      activeDeliveriesCount: activeDeliveries.length
    };
  }, [filteredOrders, orders]);

  // 3. Sales Timeline Data for Chart
  const timelineChartData = useMemo(() => {
    if (timeRange === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const daysKm = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
      return [0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
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
    }

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

  // Peak sales period identification for chart badge
  const peakSlot = useMemo(() => {
    if (!timelineChartData || timelineChartData.length === 0) return null;
    return [...timelineChartData].sort((a, b) => b.sales - a.sales)[0];
  }, [timelineChartData]);

  // 4. Top Selling Products Leaderboard
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

    const totalLeaderboardRevenue = Object.values(itemMap).reduce((s, it) => s + it.revenue, 0) || 1;

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
          revenue: Math.round(item.revenue * 100) / 100,
          revenueShare: Math.min(100, Math.round((item.revenue / totalLeaderboardRevenue) * 100))
        };
      });
  }, [filteredOrders, products]);

  // 5. Filtered Feed Orders
  const filteredFeedOrders = useMemo(() => {
    return orders.filter((o) => {
      if (feedFilter === 'all') return true;
      if (feedFilter === 'pos') return o.channel !== 'ONLINE_ECOMMERCE';
      if (feedFilter === 'online') return o.channel === 'ONLINE_ECOMMERCE';
      if (feedFilter === 'delivery') return o.orderType === 'DELIVERY' || o.fulfillmentType === 'DELIVERY';
      return true;
    }).slice(0, 7);
  }, [orders, feedFilter]);

  const activeDeliveriesList = useMemo(() => {
    return orders.filter((o) => 
      (o.orderType === 'DELIVERY' || o.fulfillmentType === 'DELIVERY') &&
      o.status !== 'COMPLETED' &&
      o.status !== 'CANCELLED' &&
      o.status !== 'REFUNDED'
    ).slice(0, 3);
  }, [orders]);

  // Channel share percentage
  const totalRev = metrics.revenue || 1;
  const posPercent = Math.round((metrics.posRevenue / totalRev) * 100) || 75;
  const onlinePercent = 100 - posPercent;

  return (
    <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Background ambient lighting accent */}
      <div className="pointer-events-none absolute -top-32 right-12 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-96 left-8 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />

      {/* ─────────────────────────────────────────────────────────────
          1. EXECUTIVE HEADER & REAL-TIME CONTROLS BAR
      ────────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-stone-850">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{isKhmer ? 'ផ្ទាំងគ្រប់គ្រងអាជីវកម្ម' : 'Store Dashboard'}</span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{storeInfo?.name || 'Aroma Coffee'}</span>
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {isKhmer 
                ? 'ទិន្នន័យជាក់ស្តែងពី POS បេឡា ហាងអនឡាញ និងការដឹកជញ្ជូនភ្នំពេញ' 
                : 'Real-time telemetry across POS terminals, online web store, and city delivery'}
            </span>
          </p>
        </div>

        {/* Right Action Tools: Time Filters + Shift Badge + Sync */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Time Filter Capsule */}
          <div className="flex items-center p-1 rounded-2xl bg-stone-900/90 border border-stone-800 backdrop-blur-md shadow-inner">
            {[
              { id: 'today', label: isKhmer ? 'ថ្ងៃនេះ' : 'Today' },
              { id: 'yesterday', label: isKhmer ? 'ម្សិលមិញ' : 'Yesterday' },
              { id: 'week', label: isKhmer ? '៧ ថ្ងៃ' : '7 Days' },
              { id: 'month', label: isKhmer ? '៣០ ថ្ងៃ' : '30 Days' },
              { id: 'all', label: isKhmer ? 'ទាំងអស់' : 'All Time' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundService.playBeepSound();
                  setTimeRange(tab.id);
                }}
                className={`py-1.5 px-3.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  timeRange === tab.id
                    ? 'bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Shift Session Quick Action */}
          <button
            type="button"
            onClick={() => openShiftModal(activeShift ? 'CLOSE' : 'OPEN')}
            className={`px-3.5 py-1.5 rounded-2xl font-bold text-xs flex items-center gap-2 border transition cursor-pointer shadow-sm active:scale-95 ${
              activeShift 
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>
              {activeShift 
                ? (isKhmer ? 'បិទវេន (Z-Report)' : 'End Shift') 
                : (isKhmer ? 'បើកវេន' : 'Open Shift')}
            </span>
          </button>

          {/* Live Sync Indicator */}
          <button
            type="button"
            onClick={() => {
              soundService.playBeepSound();
              refreshDataSilently(false);
            }}
            className="p-2.5 rounded-2xl bg-stone-900/90 hover:bg-stone-850 border border-stone-800 text-stone-300 hover:text-amber-400 transition cursor-pointer shadow-sm active:scale-95"
            title={isKhmer ? 'ទាញទិន្នន័យថ្មីភ្លាមៗ' : 'Sync latest data from cloud'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${liveSyncStatus === 'syncing' ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Lock Screen */}
          <button
            type="button"
            onClick={lockScreen}
            className="p-2.5 rounded-2xl bg-stone-900/90 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-rose-400 transition cursor-pointer shadow-sm active:scale-95"
            title={isKhmer ? 'ចាក់សោ PIN' : 'Lock POS Screen'}
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 4 EXECUTIVE KPI METRIC CARDS (GLASSMORPHIC & ACCENTED)
      ────────────────────────────────────────────────────────────── */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-stone-900/80 via-stone-900/50 to-stone-950/90 border border-stone-800/80 hover:border-amber-500/40 shadow-xl transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              {isKhmer ? 'ចំណូលលក់សរុប' : 'Total Revenue'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              ${metrics.revenue.toFixed(2)}
            </h2>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-850 text-xs">
              <span className="text-amber-400 font-bold font-mono">≈ {formatKHR(metrics.revenue)}</span>
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase bg-stone-950/80 px-2 py-0.5 rounded-full border border-stone-800">
                {timeRange}
              </span>
            </div>
            {/* POS vs Online revenue distribution mini bar */}
            <div className="mt-2.5 pt-2 border-t border-stone-850/50 flex items-center justify-between text-[10px] text-stone-400 font-mono">
              <span>POS: ${metrics.posRevenue.toFixed(0)}</span>
              <span>•</span>
              <span className="text-cyan-400">Online: ${metrics.onlineRevenue.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Completed Orders */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-stone-900/80 via-stone-900/50 to-stone-950/90 border border-stone-800/80 hover:border-sky-500/40 shadow-xl transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              {isKhmer ? 'ការកុម្ម៉ង់សរុប' : 'Total Orders'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-sky-500/5 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/10 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {metrics.orders} <span className="text-xs font-sans font-medium text-stone-400">tickets</span>
            </h2>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-850 text-xs">
              <span className="text-stone-400">{isKhmer ? 'មធ្យមភាគ:' : 'Avg Ticket:'}</span>
              <span className="text-sky-400 font-bold font-mono">${metrics.avgOrder.toFixed(2)}</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-stone-850/50 flex items-center justify-between text-[10px] text-stone-400 font-mono">
              <span>POS: {metrics.posOrdersCount}</span>
              <span>•</span>
              <span className="text-emerald-400">Deliveries: {metrics.activeDeliveriesCount}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Items / Cups Sold */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-stone-900/80 via-stone-900/50 to-stone-950/90 border border-stone-800/80 hover:border-emerald-500/40 shadow-xl transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              {isKhmer ? 'ចំនួនកែវ & ទំនិញលក់បាន' : 'Items & Cups Sold'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {metrics.itemsSold} <span className="text-xs font-medium text-stone-400 font-sans">units</span>
            </h2>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-850 text-xs">
              <span className="text-emerald-400 font-medium">POS: {metrics.posOrdersCount}</span>
              <span className="text-stone-400">•</span>
              <span className="text-cyan-400 font-medium">Online: {metrics.onlineOrdersCount}</span>
            </div>
            {/* Visual ratio bar */}
            <div className="mt-2.5 pt-2 border-t border-stone-850/50 flex items-center gap-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-stone-800 overflow-hidden flex">
                <div style={{ width: `${posPercent}%` }} className="bg-amber-500 h-full rounded-full" title={`POS: ${posPercent}%`} />
                <div style={{ width: `${onlinePercent}%` }} className="bg-cyan-500 h-full rounded-full" title={`Online: ${onlinePercent}%`} />
              </div>
              <span className="text-[10px] font-mono text-stone-400">{posPercent}% POS</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Inventory & Stock Status */}
        <div 
          onClick={() => setActiveTab('inventory')}
          className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-stone-900/80 via-stone-900/50 to-stone-950/90 border border-stone-800/80 hover:border-amber-500/40 shadow-xl transition-all duration-300 cursor-pointer group"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              {isKhmer ? 'ស្តុកទំនិញ & គ្រឿងផ្សំ' : 'Inventory & Stock'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                {lowStockIngredients.length + lowStockProducts.length}
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                lowStockIngredients.length + lowStockProducts.length > 0
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                {lowStockIngredients.length + lowStockProducts.length > 0 
                  ? (isKhmer ? 'ស្តុកជិតអស់' : 'Stock Alerts') 
                  : (isKhmer ? 'ស្តុកគ្រប់គ្រាន់' : 'Healthy Stock')}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-850 text-xs text-stone-400">
              <span>{isKhmer ? 'គ្រឿងផ្សំជិតអស់:' : 'Low Ingredients:'}</span>
              <span className={`font-bold font-mono ${lowStockIngredients.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {lowStockIngredients.length} items
              </span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-stone-850/50 flex items-center justify-between text-[10px] text-amber-400 font-semibold group-hover:underline">
              <span>{isKhmer ? 'ចុចគ្រប់គ្រងស្តុក' : 'Manage Inventory'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. VISUAL ANALYTICS: SALES VELOCITY CHART & BESTSELLERS
      ────────────────────────────────────────────────────────────── */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Velocity Area Chart (2/3 width) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-stone-900/60 border border-stone-800/80 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {timeRange === 'week' 
                    ? (isKhmer ? 'ចំណូលលក់ប្រចាំថ្ងៃ (៧ ថ្ងៃ)' : 'Daily Sales Trend (7 Days)') 
                    : (isKhmer ? 'ល្បឿនលក់ប្រចាំម៉ោង' : 'Hourly Sales Progression')}
                </h3>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {isKhmer ? 'តាមដានចំណូល និងបរិមាណវិក្កយបត្រជាក់ស្តែង' : 'Real-time revenue progression and order volume'}
              </p>
            </div>
            {peakSlot && (
              <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/25 flex items-center gap-1.5 self-start sm:self-auto">
                <Sparkles className="w-3 h-3" />
                <span>Peak: {peakSlot.label} (${peakSlot.sales})</span>
              </span>
            )}
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cleanAmberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262422" vertical={false} />
                <XAxis dataKey="label" stroke="#78716c" fontSize={11} tickLine={false} />
                <YAxis stroke="#78716c" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-stone-950/95 border border-stone-750 rounded-2xl shadow-2xl text-xs space-y-1.5 backdrop-blur-xl">
                          <p className="font-bold text-stone-200">{label}</p>
                          <p className="text-amber-400 font-mono font-black text-sm">
                            ${Number(payload[0].value).toFixed(2)} ({formatKHR(payload[0].value)})
                          </p>
                          <p className="text-stone-400 font-medium">
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
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cleanAmberGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Bestsellers Leaderboard (1/3 width) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-stone-900/60 border border-stone-800/80 shadow-xl space-y-4 flex flex-col justify-between backdrop-blur-md">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-850">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isKhmer ? 'ទំនិញលក់ដាច់បំផុត' : 'Top Bestsellers'}
                </h3>
              </div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-stone-950 px-2 py-0.5 rounded-full border border-stone-800">
                Top 5
              </span>
            </div>

            <div className="space-y-2.5 pt-3">
              {topSellingProducts.length === 0 ? (
                <p className="text-xs text-stone-500 py-8 text-center">
                  {isKhmer ? 'មិនទាន់មានទិន្នន័យលក់ទេ' : 'No sales recorded yet for this period.'}
                </p>
              ) : (
                topSellingProducts.map((item) => (
                  <div 
                    key={item.id}
                    className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-stone-950/70 border border-stone-850 hover:border-amber-500/30 transition group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center font-black text-xs shadow-sm ${
                          item.rank === 1 
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950' 
                            : item.rank === 2
                            ? 'bg-gradient-to-r from-stone-200 to-slate-400 text-stone-950'
                            : item.rank === 3
                            ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100'
                            : 'bg-stone-850 text-stone-300'
                        }`}>
                          {item.rank}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-white truncate group-hover:text-amber-400 transition-colors">
                            {isKhmer && item.nameKm ? item.nameKm : item.name}
                          </h4>
                          <span className="text-[10px] text-stone-400">
                            {item.unitsSold} {isKhmer ? 'កែវ' : 'sold'}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-black text-amber-400 shrink-0">
                        ${item.revenue.toFixed(2)}
                      </span>
                    </div>

                    {/* Sales share bar */}
                    <div className="w-full h-1 rounded-full bg-stone-850 overflow-hidden">
                      <div 
                        style={{ width: `${item.revenueShare}%` }} 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" 
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className="w-full mt-4 py-2.5 rounded-2xl bg-stone-850 hover:bg-stone-800 border border-stone-750 text-stone-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
          >
            <span>{isKhmer ? 'មើលរបាយការណ៍លម្អិត' : 'View Full Reports & Analytics'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. OPERATIONS: RECENT ORDERS & OPERATIONAL RADAR (2 COLUMNS)
      ────────────────────────────────────────────────────────────── */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Orders & Transactions Feed */}
        <div className="p-5 sm:p-6 rounded-3xl bg-stone-900/60 border border-stone-800/80 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-850">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isKhmer ? 'ប្រតិបត្តិការលក់ថ្មីៗ' : 'Recent Transactions'}
              </h3>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-stone-950 border border-stone-850">
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
                  className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    feedFilter === f.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredFeedOrders.length === 0 ? (
              <p className="text-xs text-stone-500 py-8 text-center">
                {isKhmer ? 'មិនមានប្រតិបត្តិការត្រូវបង្ហាញទេ' : 'No transactions recorded yet.'}
              </p>
            ) : (
              filteredFeedOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setReceiptModalOrder(order)}
                  className="p-3 rounded-2xl bg-stone-950/70 border border-stone-850 hover:border-amber-500/40 transition flex items-center justify-between cursor-pointer group shadow-sm"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {cleanOrderNum(order.orderNumber || order.id)}
                      </span>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${
                        order.channel === 'ONLINE_ECOMMERCE'
                          ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}>
                        {order.channel === 'ONLINE_ECOMMERCE' ? 'ONLINE' : 'POS'}
                      </span>
                      {(order.orderType === 'DELIVERY' || order.fulfillmentType === 'DELIVERY') && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                          <Bike className="w-2.5 h-2.5" />
                          <span>Delivery</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1 truncate">
                      {order.customerName || (isKhmer ? 'ភ្ញៀវទូទៅ' : 'Walk-in')} • {(order.items || []).length} {isKhmer ? 'មុខ' : 'items'} • {order.paymentMethod || 'KHQR'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-black font-mono text-white block">
                      ${(order.total || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                      <span>{isKhmer ? 'ទូទាត់រួច' : 'Settled'}</span>
                      <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className="w-full py-2.5 rounded-2xl bg-stone-850 hover:bg-stone-800 border border-stone-750 text-stone-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
          >
            <span>{isKhmer ? 'មើលបញ្ជីកម្ម៉ង់ទាំងអស់' : 'View All Order History'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Column: Active Dispatch Tracker + Stock Quick-Restock */}
        <div className="p-5 sm:p-6 rounded-3xl bg-stone-900/60 border border-stone-800/80 shadow-xl space-y-5 flex flex-col justify-between backdrop-blur-md">
          <div className="space-y-4">
            {/* Active Courier Dispatch Widget */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Bike className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'អ្នកដឹកជញ្ជូនកំពុងធ្វើដំណើរ' : 'Live Delivery Dispatch Radar'}</span>
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {metrics.activeDeliveriesCount} Active
                </span>
              </div>

              {activeDeliveriesList.length === 0 ? (
                <p className="text-xs text-stone-400">
                  {isKhmer ? 'បច្ចុប្បន្នគ្មានការដឹកជញ្ជូនកំពុងដំណើរការទេ' : 'No deliveries in transit right now.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {activeDeliveriesList.map((deliv) => (
                    <div 
                      key={deliv.id}
                      onClick={() => {
                        if (setSelectedOrderForTracking) setSelectedOrderForTracking(deliv);
                        if (setIsLiveDeliveryModalOpen) setIsLiveDeliveryModalOpen(true);
                      }}
                      className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 hover:border-emerald-500/40 transition cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{cleanOrderNum(deliv.orderNumber || deliv.id)} • {deliv.customerName || 'Customer'}</p>
                          <p className="text-[10px] text-stone-400 truncate">{deliv.deliveryAddress || 'Phnom Penh delivery'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                        View Map →
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Restock Section Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-850">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isKhmer ? 'គ្រឿងផ្សំជិតអស់ (Restock)' : 'Low Ingredients Quick Restock'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{isKhmer ? 'គ្រប់គ្រង' : 'Manage'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Critical Inventory Items */}
            <div className="space-y-2">
              {ingredients.slice(0, 4).map((ing) => {
                const isLow = ing.stock <= ing.minThreshold;
                const ingName = isKhmer && ing.nameKm ? ing.nameKm : ing.name;
                return (
                  <div
                    key={ing.id}
                    className="p-2.5 rounded-2xl bg-stone-950/70 border border-stone-850 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{ingName}</h4>
                      <span className="text-[10px] text-stone-400">
                        {isKhmer ? 'កម្រិតប្រកាសអាសន្ន:' : 'Min Threshold:'} {ing.minThreshold} {ing.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        isLow ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'text-stone-300'
                      }`}>
                        {ing.stock} {ing.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => restockIngredient(ing.id, ing.unit === 'g' ? 500 : ing.unit === 'ml' ? 1000 : 50)}
                        className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/25 text-amber-300 text-[10px] font-bold transition cursor-pointer active:scale-95"
                      >
                        +Restock
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Cashier / Profile Strip */}
          <div className="pt-3 border-t border-stone-850 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <UserAvatar user={user} size="sm" shape="rounded-xl" />
              <div className="leading-tight">
                <span className="font-bold text-white block text-xs">{user?.name || 'Administrator'}</span>
                <span className="text-[10px] text-stone-400 font-mono">{user?.role || 'OWNER'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="text-stone-400 hover:text-amber-400 font-semibold cursor-pointer text-xs"
            >
              {isKhmer ? 'កែប្រែគណនី' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
