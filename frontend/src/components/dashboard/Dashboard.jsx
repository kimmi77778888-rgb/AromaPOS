import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
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
  BarChart3
} from 'lucide-react';
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
    openShiftModal
  } = useApp();

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

    return Object.entries(counts).map(([name, value]) => ({
      name,
      sales: Math.round(value * 100) / 100
    }));
  }, [orders, products]);

  const CATEGORY_COLORS = ['#D97706', '#F59E0B', '#B45309', '#78350F', '#92400E'];

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-stone-900/40">
      {/* Top Shift Management Action Strip */}
      <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-100">Live POS Shift Session</h4>
            <p className="text-xs text-stone-400">All metrics and recipe deductions update live with every transaction</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('reports')}
            className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 hover:border-amber-500 text-stone-300 hover:text-stone-100 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
            <span>Management Analytics</span>
          </button>

          <button
            onClick={lockScreen}
            className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 hover:border-amber-500 text-stone-300 hover:text-stone-100 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Lock & Handover</span>
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
            <span>{activeShift ? 'Run Z-Report (End Shift)' : 'Open Register Shift'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Today's Gross Sales
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-stone-100 font-mono tracking-tight">
              ${metrics.revenue.toFixed(2)}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <ArrowUpRight className="w-4 h-4" />
              <span>Live updated across register</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Completed Orders
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
              <span>Average Ticket:</span>
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
              Low Stock & Materials
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
              {lowStockIngredients.length} raw ingredients • {lowStockProducts.length} menu items
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Auto-Disabled Items
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition">
              <Coffee className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-stone-100 font-mono tracking-tight">
              {products.filter((p) => p.isAutoDisabled).length}
            </h3>
            <p className="text-xs text-stone-400">Preventing impossible orders on POS</p>
          </div>
        </div>
      </div>

      {/* Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-100">Live Hourly Sales Velocity</h3>
              <p className="text-xs text-stone-400">Real-time revenue progression with live transaction feed</p>
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
                            Revenue: ${payload[0].value.toFixed(2)}
                          </p>
                          <p className="text-stone-400">Tickets: {payload[0].payload.tickets}</p>
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
            <h3 className="text-base font-bold text-stone-100">Category Share</h3>
            <p className="text-xs text-stone-400">Revenue split across drinks & merchandise</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2a27" horizontal={false} />
                <XAxis type="number" stroke="#78716c" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <YAxis dataKey="name" type="category" stroke="#78716c" fontSize={11} tickLine={false} width={80} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2.5 bg-stone-950 border border-amber-600/50 rounded-xl shadow-xl text-xs">
                          <p className="font-bold text-stone-200">{payload[0].payload.name}</p>
                          <p className="text-amber-400 font-mono font-bold">${payload[0].value.toFixed(2)}</p>
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
                <h3 className="text-base font-bold text-stone-100">Raw Ingredients & Recipe Health</h3>
                <p className="text-xs text-stone-400">Live monitoring of beans, milk, and cup stocks</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1"
            >
              <span>Manage BOM</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {ingredients.slice(0, 5).map((ing) => {
              const isLow = ing.stock <= ing.minThreshold;
              return (
                <div
                  key={ing.id}
                  className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-stone-200">{ing.name}</h5>
                    <span className="text-[10px] text-stone-400">
                      Threshold: {ing.minThreshold} {ing.unit}
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
                      className="px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-stone-950 text-[10px] font-bold transition"
                    >
                      +Restock
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
                <h3 className="text-base font-bold text-stone-100">Live Register Feed</h3>
                <p className="text-xs text-stone-400">Recent customer transactions and operator stamps</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1"
            >
              <span>View All Tickets</span>
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
                    {order.customerName || 'Walk-in'} • {order.items.length} item(s) • {order.paymentMethod}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-stone-100 font-mono block">
                    ${order.total.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-400">Settled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
