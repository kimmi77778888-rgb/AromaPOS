import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  Coffee, 
  ChevronRight, 
  PlusCircle, 
  Receipt,
  Sparkles,
  Zap,
  Calculator,
  Layers,
  Lock,
  BarChart3,
  Volume2,
  RefreshCw,
  Bike,
  User,
  LogOut,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { soundService } from '../../services/soundService';
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
    orders, 
    products, 
    ingredients, 
    lowStockProducts, 
    lowStockIngredients, 
    restockProduct, 
    restockIngredient, 
    setActiveTab, 
    setReceiptModalOrder,
    setIsZReportOpen,
    lockScreen,
    activeShift,
    openShiftModal,
    isLiveMode,
    setIsLiveMode,
    liveSyncStatus,
    refreshDataSilently,
    user,
    logout,
    setIsProfileModalOpen
  } = useApp();

  const { isKhmer, formatKHR, formatUSD } = useLanguage();

  // Metrics computation
  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const itemsSold = orders.reduce(
      (sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );

    return {
      revenue: Math.round(totalRevenue * 100) / 100,
      orders: totalOrders,
      avgOrder: Math.round(avgOrder * 100) / 100,
      itemsSold
    };
  }, [orders]);

  // Hourly Sales Data for Chart
  const hourlyData = useMemo(() => {
    const hours = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];
    const baseAmounts = [65.50, 112.00, 168.40, 142.00, 215.50, 180.20, 135.00, 155.80, 95.00, 68.00];

    const dynamicRevenue = orders.reduce((s, o) => s + o.total, 0);
    return hours.map((hour, idx) => ({
      hour,
      sales: Math.round((baseAmounts[idx] + (idx >= 4 ? dynamicRevenue * 0.12 : 0)) * 100) / 100,
      tickets: Math.floor(baseAmounts[idx] / 15) + (idx === 4 ? 3 : 1)
    }));
  }, [orders]);

  // Category Revenue Data for Chart
  const categoryChartData = useMemo(() => {
    const counts = {
      'Hot Coffee': 320.50,
      'Iced Coffee': 415.80,
      'Pastries': 195.40,
      'Beans': 180.00,
      'Specialty': 98.50
    };

    orders.forEach((o) => {
      o.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.category || 'Specialty';
        if (counts[cat] !== undefined) {
          counts[cat] += item.subtotal;
        } else {
          counts[cat] = item.subtotal;
        }
      });
    });

    const categoryTranslations = {
      'Hot Coffee': isKhmer ? 'កាហ្វេក្តៅ' : 'Hot Coffee',
      'Iced Coffee': isKhmer ? 'កាហ្វេទឹកកក' : 'Iced Coffee',
      'Pastries': isKhmer ? 'នំបុ័ង & នំ' : 'Pastries',
      'Beans': isKhmer ? 'គ្រាប់កាហ្វេ' : 'Beans',
      'Specialty': isKhmer ? 'ភេសជ្ជៈពិសេស' : 'Specialty'
    };

    return Object.entries(counts).map(([name, value]) => ({
      name: categoryTranslations[name] || name,
      rawName: name,
      sales: Math.round(value * 100) / 100
    }));
  }, [orders, products, isKhmer]);

  const CATEGORY_COLORS = ['#D97706', '#F59E0B', '#B45309', '#78350F', '#92400E'];

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-stone-900/40">
      {/* Top Section: Active User Account & Live Delivery Alert Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Logged-in User Account Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/30 border border-stone-800/80 shadow-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 overflow-hidden">
            <div className="relative">
              <UserAvatar user={user} size="lg" shape="rounded-2xl" showBadge />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-stone-900 animate-pulse" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white truncate">
                  {user?.name || 'Marcus Thorne'}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800">
                  {user?.role || 'ADMIN / OWNER'}
                </span>
              </div>
              <p className="text-xs text-stone-400 truncate mt-0.5">
                {user?.email || 'admin@aromacoffee.com'} • Terminal #01
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

        {/* 2. Admin Live Location Delivery GPS Card */}
        <div 
          onClick={() => setActiveTab('delivery')}
          className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-stone-900 to-stone-950 border border-emerald-600/40 hover:border-emerald-500/80 shadow-lg flex items-center justify-between gap-4 cursor-pointer group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition shadow-md">
              <Bike className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                  <span>{isKhmer ? 'ផែនទីដឹកជញ្ជូនផ្ទាល់ (Live Location Delivery)' : 'Live Delivery Fleet GPS'}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  2 On Route
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {isKhmer 
                  ? 'ចុចទីនេះដើម្បីមើលផែនទី GPS ទីតាំងអ្នកដឹកជញ្ជូន និងអតិថិជននៅភ្នំពេញផ្ទាល់' 
                  : 'Track riders, route waypoints, speed & live customer destinations in Phnom Penh'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black text-xs transition shadow-md shrink-0">
            <span>{isKhmer ? 'មើលផែនទី GPS' : 'Open GPS Map'}</span>
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Top Shift Management Action Strip */}
      <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-100">
              {isKhmer ? 'វេនគិតប្រាក់ POS ផ្ទាល់' : 'Live POS Shift Session'}
            </h4>
            <p className="text-xs text-stone-400">
              {isKhmer 
                ? 'រាល់ស្ថិតិ និងការកាត់ស្តុកគ្រឿងផ្សំធ្វើបច្ចុប្បន្នភាពផ្ទាល់តាមប្រតិបត្តិការ'
                : 'All metrics and recipe deductions update live with every transaction'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
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
              title={isLiveMode ? 'Live Mode Active: Auto-syncing orders every 5s' : 'Live Mode Paused'}
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
            <span>{isKhmer ? 'ស្វាគមន៍ (Voice)' : 'Welcome (Voice)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 hover:border-amber-500 text-stone-300 hover:text-stone-100 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
            <span>{isKhmer ? 'វិភាគស្ថិតិ & របាយការណ៍' : 'Management Analytics'}</span>
          </button>

          <button
            onClick={lockScreen}
            className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 hover:border-amber-500 text-stone-300 hover:text-stone-100 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>{isKhmer ? 'ចាក់សោ & ប្តូរវេន' : 'Lock & Handover'}</span>
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
                ? (isKhmer ? 'របាយការណ៍បិទវេន (Z-Report)' : 'Run Z-Report (End Shift)') 
                : (isKhmer ? 'បើកវេនគិតប្រាក់ថ្មី' : 'Open Register Shift')}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {isKhmer ? 'ចំណូលសរុបប្រចាំថ្ងៃ' : "Today's Gross Sales"}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition">
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
                <span>{isKhmer ? 'ផ្ទាល់' : 'Live'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {isKhmer ? 'ការកម្ម៉ង់ដែលបានបញ្ចប់' : 'Completed Orders'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition">
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

        <div
          onClick={() => setActiveTab('inventory')}
          className={`p-6 rounded-2xl border shadow-lg relative overflow-hidden cursor-pointer transition ${
            lowStockProducts.length > 0 || lowStockIngredients.length > 0
              ? 'bg-rose-950/30 border-rose-800/60 hover:bg-rose-950/50 hover:border-rose-600'
              : 'bg-stone-900/80 border-stone-800/80 hover:border-stone-700'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {isKhmer ? 'ស្តុក & គ្រឿងផ្សំជិតអស់' : 'Low Stock & Materials'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 animate-pulse">
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
                : `${lowStockIngredients.length} raw ingredients • ${lowStockProducts.length} menu items`}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {isKhmer ? 'មុខទំនិញផ្អាកលក់ស្វ័យប្រវត្តិ' : 'Auto-Disabled Items'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition">
              <Coffee className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-stone-100 font-mono tracking-tight">
              {products.filter((p) => p.isAutoDisabled).length}
            </h3>
            <p className="text-xs text-stone-400">
              {isKhmer ? 'ទប់ស្កាត់ការកុម្ម៉ង់មុខទំនិញដែលអស់គ្រឿងផ្សំ' : 'Preventing impossible orders on POS'}
            </p>
          </div>
        </div>
      </div>

      {/* Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-100">
                {isKhmer ? 'ល្បឿនលក់ប្រចាំម៉ោងផ្ទាល់' : 'Live Hourly Sales Velocity'}
              </h3>
              <p className="text-xs text-stone-400">
                {isKhmer ? 'ដំណើរការចំណូលជាក់ស្តែងតាមប្រតិបត្តិការថ្មីៗ' : 'Real-time revenue progression with live transaction feed'}
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800/40">
              8:00 AM – 6:00 PM
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2a27" vertical={false} />
                <XAxis dataKey="hour" stroke="#78716c" fontSize={11} tickLine={false} />
                <YAxis stroke="#78716c" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-stone-950 border border-amber-600/50 rounded-xl shadow-xl text-xs space-y-1">
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

        <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-lg space-y-4">
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
              <BarChart data={categoryChartData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2a27" horizontal={false} />
                <XAxis type="number" stroke="#78716c" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <YAxis dataKey="name" type="category" stroke="#78716c" fontSize={11} tickLine={false} width={95} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2.5 bg-stone-950 border border-amber-600/50 rounded-xl shadow-xl text-xs">
                          <p className="font-bold text-stone-200">{payload[0].payload.name}</p>
                          <p className="text-amber-400 font-mono font-bold">${payload[0].value.toFixed(2)} ({formatKHR(payload[0].value)})</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="sales" radius={[0, 8, 8, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Raw Ingredients Alerts & Recent Order Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw Ingredients Alert Monitor */}
        <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-bold text-stone-100">
                  {isKhmer ? 'សុខភាពគ្រឿងផ្សំ & រូបមន្ត' : 'Raw Ingredients & Recipe Health'}
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
                  className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center justify-between"
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
                      className="px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-stone-950 text-[10px] font-bold transition cursor-pointer"
                    >
                      {isKhmer ? '+ថែមស្តុក' : '+Restock'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live POS Activity Feed */}
        <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-bold text-stone-100">
                  {isKhmer ? 'ប្រតិបត្តិការលក់ផ្ទាល់' : 'Live Register Feed'}
                </h3>
                <p className="text-xs text-stone-400">
                  {isKhmer ? 'ប្រតិបត្តិការអតិថិជនថ្មីៗ និងកំណត់ត្រាបេឡាធិការ' : 'Recent customer transactions and operator stamps'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{isKhmer ? 'មើលវិក្កយបត្រទាំងអស់' : 'View All Tickets'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                onClick={() => setReceiptModalOrder(order)}
                className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 hover:border-amber-600/40 transition flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">{order.orderNumber}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-900 border border-stone-800 text-stone-400">
                      {order.cashierName}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300 mt-0.5">
                    {order.customerName || (isKhmer ? 'ភ្ញៀវទូទៅ' : 'Walk-in')} • {order.items.length} {isKhmer ? 'មុខ' : 'item(s)'} • {order.paymentMethod}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-stone-100 font-mono block">
                    ${order.total.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {isKhmer ? 'ទូទាត់រួចរាល់' : 'Settled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
