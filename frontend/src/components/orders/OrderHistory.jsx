import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { CambodiaFlag } from '../common/FlagIcons';
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CheckCircle2, 
  RotateCcw,
  Printer, 
  ArrowUpRight,
  User,
  ShoppingBag,
  Download,
  Eye,
  RefreshCw,
  Clock,
  X,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  Tag,
  Coffee,
  Copy
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ReceiptModal } from '../pos/ReceiptModal';

export const OrderHistory = () => {
  const { 
    orders, 
    products = [], 
    setReceiptModalOrder, 
    setReceiptModalView, 
    refundOrder, 
    duplicateOrder, 
    showToast,
    user,
    userRole,
    isCashier,
    isManagerOrAdmin,
    isAdmin,
    setActiveTab
  } = useApp();
  const { isKhmer, formatKHR } = useLanguage();

  // Strict Cashier Restriction: Cashiers can only view orders created by their own account
  const isRestrictedCashier = isCashier || userRole === 'CASHIER' || (!isManagerOrAdmin && !isAdmin);

  // Helper: check whether an order was processed by the current logged-in user
  const isOrderOwnedByUser = useCallback((order, currentUser) => {
    if (!order || !currentUser) return false;
    const orderCashier = (order.cashierName || '').trim().toLowerCase();
    const myName = (currentUser.name || '').trim().toLowerCase();
    const myUsername = (currentUser.username || '').trim().toLowerCase();
    const myEmail = (currentUser.email || '').trim().toLowerCase();

    return Boolean(
      (myName && orderCashier === myName) ||
      (myUsername && orderCashier === myUsername) ||
      (myEmail && orderCashier === myEmail)
    );
  }, []);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, YESTERDAY, THIS_WEEK, THIS_MONTH, CUSTOM
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, DINE_IN, TAKEAWAY
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, COMPLETED, REFUNDED
  const [cashierFilter, setCashierFilter] = useState(() => (isRestrictedCashier ? (user?.name || 'ALL') : 'ALL'));

  // Sync cashierFilter whenever the active user or role changes
  useEffect(() => {
    if (isRestrictedCashier && user?.name) {
      setCashierFilter(user.name);
    }
  }, [isRestrictedCashier, user?.name]);

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  // Extract unique cashiers for filter dropdown (Admins/Managers see all; Cashiers see only their own)
  const uniqueCashiers = useMemo(() => {
    if (isRestrictedCashier) {
      return user?.name ? [user.name] : [];
    }
    const names = new Set();
    orders.forEach(o => {
      if (o.cashierName) names.add(o.cashierName);
    });
    return Array.from(names);
  }, [orders, isRestrictedCashier, user]);

  // Active filters counter
  const activeFiltersCount = 
    (searchQuery ? 1 : 0) +
    (methodFilter !== 'ALL' ? 1 : 0) +
    (dateFilter !== 'ALL' ? 1 : 0) +
    (typeFilter !== 'ALL' ? 1 : 0) +
    (statusFilter !== 'ALL' ? 1 : 0) +
    (!isRestrictedCashier && cashierFilter !== 'ALL' ? 1 : 0);

  const resetAllFilters = () => {
    setSearchQuery('');
    setMethodFilter('ALL');
    setDateFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setCashierFilter(isRestrictedCashier ? (user?.name || 'ALL') : 'ALL');
  };

  // Filter Logic
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 6 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter((o) => {
      // 1. Strict Cashier Account Scope: Cashier can ONLY see orders where cashierName matches their account
      if (isRestrictedCashier) {
        if (!isOrderOwnedByUser(o, user)) {
          return false;
        }
      } else {
        // Manager / Admin: Can filter by any cashier
        if (cashierFilter !== 'ALL' && o.cashierName !== cashierFilter) {
          return false;
        }
      }

      // 2. Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.orderNumber?.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        (o.cashierName && o.cashierName.toLowerCase().includes(q)) ||
        (o.items && o.items.some(i => i.productName?.toLowerCase().includes(q)));

      if (!matchesSearch) return false;

      // 3. Payment method match
      if (methodFilter !== 'ALL' && o.paymentMethod !== methodFilter) return false;

      // 4. Type match
      if (typeFilter !== 'ALL' && o.orderType !== typeFilter) return false;

      // 5. Status match
      if (statusFilter !== 'ALL' && (o.status || 'COMPLETED') !== statusFilter) return false;

      // 6. Date match
      const orderTime = new Date(o.createdAt || Date.now()).getTime();
      if (dateFilter === 'TODAY') {
        if (orderTime < todayStart) return false;
      } else if (dateFilter === 'YESTERDAY') {
        if (orderTime < yesterdayStart || orderTime >= todayStart) return false;
      } else if (dateFilter === 'THIS_WEEK') {
        if (orderTime < weekStart) return false;
      } else if (dateFilter === 'THIS_MONTH') {
        if (orderTime < monthStart) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate && orderTime < new Date(customStartDate).getTime()) return false;
        if (customEndDate && orderTime >= new Date(customEndDate).getTime() + 86400000) return false;
      }

      return true;
    });
  }, [orders, isRestrictedCashier, user, cashierFilter, isOrderOwnedByUser, searchQuery, methodFilter, typeFilter, statusFilter, dateFilter, customStartDate, customEndDate]);

  // Key Sales Performance Metrics
  const stats = useMemo(() => {
    const validOrders = filteredOrders.filter(o => o.status !== 'REFUNDED');
    const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalCount = filteredOrders.length;
    const averageOrder = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    const khqrRevenue = validOrders
      .filter((o) => o.paymentMethod === 'QR_CODE')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const cashRevenue = validOrders
      .filter((o) => o.paymentMethod === 'CASH')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const cardRevenue = validOrders
      .filter((o) => o.paymentMethod === 'CARD')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    return {
      totalRevenue,
      totalCount,
      averageOrder,
      khqrRevenue,
      cashRevenue,
      cardRevenue
    };
  }, [filteredOrders]);

  // Payment Badge Helper
  const getPaymentBadge = (method) => {
    switch (method) {
      case 'QR_CODE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 font-semibold text-[11px]">
            <QrCode className="w-3.5 h-3.5 text-rose-400" />
            <span>Bakong KHQR</span>
          </span>
        );
      case 'CARD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-800/60 text-sky-300 font-semibold text-[11px]">
            <CreditCard className="w-3.5 h-3.5 text-sky-400" />
            <span>Card</span>
          </span>
        );
      case 'CASH':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-semibold text-[11px]">
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cash</span>
          </span>
        );
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      showToast('No orders to export', 'warning');
      return;
    }

    const headers = [
      'Ticket Number',
      'Date & Time',
      'Customer',
      'Phone',
      'Order Type',
      'Items',
      'Payment Method',
      'Subtotal ($)',
      'Discount ($)',
      'Tax ($)',
      'Total ($)',
      'Total (KHR)',
      'Cashier',
      'Status'
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber || ''}"`,
      `"${new Date(o.createdAt || Date.now()).toLocaleString()}"`,
      `"${o.customerName || 'Walk-in Guest'}"`,
      `"${o.customerPhone || ''}"`,
      `"${o.orderType || 'DINE_IN'}"`,
      `"${(o.items || []).map((i) => `${i.quantity}x ${i.productName}`).join('; ')}"`,
      `"${o.paymentMethod || 'CASH'}"`,
      (o.subtotal || 0).toFixed(2),
      (o.discount || 0).toFixed(2),
      (o.tax || 0).toFixed(2),
      (o.total || 0).toFixed(2),
      Math.round((o.total || 0) * 4100),
      `"${o.cashierName || 'Staff'}"`,
      `"${o.status || 'COMPLETED'}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Sales ledger exported successfully!', 'success');
  };

  // Export to Clean & Modern Excel (.xlsx)
  const exportToExcel = () => {
    if (filteredOrders.length === 0) {
      showToast(isKhmer ? 'មិនមានការកម្ម៉ង់សម្រាប់នាំចេញទេ' : 'No orders available to export', 'warning');
      return;
    }

    const wb = XLSX.utils.book_new();
    const generatedAt = new Date().toLocaleString('en-GB');
    const totalRev = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalSub = filteredOrders.reduce((sum, o) => sum + (o.subtotal || o.total || 0), 0);
    const totalDisc = filteredOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const totalTx = filteredOrders.reduce((sum, o) => sum + (o.tax || 0), 0);

    const sheetRows = [
      ['☕ AROMA COFFEE & ARTISAN BAKERY'],
      ['SALES TRANSACTION HISTORY & AUDIT LEDGER'],
      [`Generated: ${generatedAt}   |   Orders: ${filteredOrders.length}   |   Gross Settled: $${totalRev.toFixed(2)} (៛${Math.round(totalRev * 4100).toLocaleString()})   |   Exchange: 1 USD = 4,100 KHR`],
      [],
      [
        'Ticket #',
        'Date & Time',
        'Customer Name',
        'Phone Number',
        'Order Type',
        'Items Purchased',
        'Payment Method',
        'Subtotal ($)',
        'Discount ($)',
        'Sales Tax ($)',
        'Total Paid ($)',
        'Total (KHR)',
        'Cashier / Staff',
        'Status'
      ]
    ];

    filteredOrders.forEach((o) => {
      const subtotal = o.subtotal || (o.total || 0);
      const discount = o.discount || 0;
      const tax = o.tax || 0;
      const total = o.total || 0;
      const itemsStr = (o.items || []).map((i) => `${i.quantity}× ${i.productName}`).join('; ');

      sheetRows.push([
        o.orderNumber || o.id,
        new Date(o.createdAt || Date.now()).toLocaleString('en-GB'),
        o.customerName || 'Walk-in Guest',
        o.customerPhone || '-',
        o.orderType === 'DINE_IN' ? '🍽️ Dine In' : '🥡 Takeaway',
        itemsStr,
        o.paymentMethod || 'CASH',
        Math.round(subtotal * 100) / 100,
        Math.round(discount * 100) / 100,
        Math.round(tax * 100) / 100,
        Math.round(total * 100) / 100,
        Math.round(total * 4100),
        o.cashierName || 'Staff',
        o.status || 'COMPLETED'
      ]);
    });

    // Grand Total Summary Row
    sheetRows.push([]);
    sheetRows.push([
      'TOTAL SALES LEDGER',
      `${filteredOrders.length} Completed Orders`,
      '-',
      '-',
      '-',
      '-',
      '-',
      Math.round(totalSub * 100) / 100,
      Math.round(totalDisc * 100) / 100,
      Math.round(totalTx * 100) / 100,
      Math.round(totalRev * 100) / 100,
      Math.round(totalRev * 4100),
      '-',
      'AUDITED'
    ]);

    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 13 } },
    ];
    ws['!rows'] = [{ hpt: 28 }, { hpt: 18 }, { hpt: 15 }, { hpt: 10 }];
    ws['!cols'] = [
      { wch: 14 },
      { wch: 20 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
      { wch: 35 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 }
    ];

    Object.keys(ws).forEach(ref => {
      if (ref.startsWith('!')) return;
      const cell = ws[ref];
      if (cell && typeof cell.v === 'number') {
        cell.t = 'n';
        if (cell.v % 1 !== 0) {
          cell.z = '"$"#,##0.00';
        } else {
          cell.z = '#,##0';
        }
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Sales_Transactions');
    const filename = `AromaPOS_Sales_History_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);

    showToast(
      isKhmer ? `បានទាញយកឯកសារ Excel: ${filename}` : `Exported clean Excel sales ledger: ${filename}`,
      'success'
    );
  };

  // Handle Order Refund
  const handleExecuteRefund = async () => {
    if (!selectedOrder) return;
    setIsRefunding(true);
    try {
      await refundOrder(selectedOrder.id, refundReason || 'Customer requested refund');
      setSelectedOrder(prev => prev ? { ...prev, status: 'REFUNDED' } : null);
      setRefundReason('');
    } catch (e) {
      // Toast handled by AppContext
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-stone-950/70 text-stone-100 font-sans">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-100 flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-amber-500" />
            <span>{isKhmer ? 'ប្រវត្តិការលក់ & បញ្ជីប្រតិបត្តិការ' : 'Order Transactions & Ledger'}</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            {isKhmer 
              ? 'ត្រួតពិនិត្យប្រតិបត្តិការលក់ទាំងអស់ បោះពុម្ពវិក្កយបត្រឡើងវិញ និងបង្វិលសង'
              : 'Comprehensive ledger of completed tickets, refunds, and live audit reprints'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('cambodia-excel')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 text-xs font-bold transition cursor-pointer shadow-md"
            title={isKhmer ? 'បើកផ្ទាំងតារាងស្តង់ដារកម្ពុជា & Excel' : 'Open Cambodia Standard Excel Interface'}
          >
            <CambodiaFlag className="w-4 h-3 rounded-xs" />
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isKhmer ? 'ស្តង់ដារកម្ពុជា & Excel' : 'Cambodia Standard Excel'}</span>
          </button>
          <button
            type="button"
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition cursor-pointer shadow-md"
            title="Export filtered transactions to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-stone-950" />
            <span>{isKhmer ? 'នាំចេញ Excel (.xlsx)' : 'Export Excel (.xlsx)'}</span>
          </button>
          <button
            type="button"
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-amber-400 border border-stone-800 text-xs font-semibold transition cursor-pointer shadow-sm"
            title="Export filtered transactions to CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>{isKhmer ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Cashier Personal Scope Alert Banner */}
      {isRestrictedCashier && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-950/40 border border-sky-800/60 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-sky-200 flex items-center gap-2">
                <span>{isKhmer ? 'ប្រវត្តិការលក់សម្រាប់តែគណនីបេឡាករផ្ទាល់ខ្លួន' : 'Personal Cashier Sales History View'}</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-900/90 text-[10px] text-sky-300 font-mono border border-sky-700/60 font-semibold uppercase">
                  {user?.name || 'Cashier'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {isKhmer 
                  ? 'អ្នកអាចមើលឃើញតែប្រតិបត្តិការលក់ដែលបានធ្វើឡើងដោយគណនីរបស់អ្នកប៉ុណ្ណោះ។'
                  : 'You are restricted to viewing only sales transactions processed by your logged-in cashier account.'}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-900/40 border border-sky-700/60 text-sky-300 text-xs font-semibold">
            🔒 {isKhmer ? 'គណនីបេឡាករ' : 'Cashier Filter Active'}
          </span>
        </div>
      )}

      {/* Top Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-md">
          <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
            <span>
              {isRestrictedCashier 
                ? (isKhmer ? 'ចំណូលលក់របស់អ្នក (My Revenue)' : 'My Sales Revenue') 
                : (isKhmer ? 'ចំណូលសរុប (Gross Revenue)' : 'Gross Revenue')}
            </span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight block">
              ${stats.totalRevenue.toFixed(2)}
            </span>
            <span className="text-xs text-stone-400 font-mono mt-0.5 block">
              ≈ {formatKHR(stats.totalRevenue)}
            </span>
          </div>
        </div>

        {/* Total Orders Count */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-md">
          <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
            <span>
              {isRestrictedCashier 
                ? (isKhmer ? 'វិក្កយបត្ររបស់អ្នក (My Tickets)' : 'My Tickets') 
                : (isKhmer ? 'ចំនួនវិក្កយបត្រ (Tickets)' : 'Total Tickets')}
            </span>
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-stone-100 font-mono tracking-tight block">
              {stats.totalCount}
            </span>
            <span className="text-xs text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{filteredOrders.filter(o => o.status !== 'REFUNDED').length} Settled</span>
            </span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-md">
          <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
            <span>{isKhmer ? 'តម្លៃជាមធ្យម (AOV)' : 'Average Ticket'}</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono tracking-tight block">
              ${stats.averageOrder.toFixed(2)}
            </span>
            <span className="text-xs text-stone-400 font-mono mt-0.5 block">
              ≈ {formatKHR(stats.averageOrder)}
            </span>
          </div>
        </div>

        {/* Bakong KHQR Volume */}
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800/80 shadow-md">
          <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
            <span>{isKhmer ? 'ស្កេន Bakong KHQR' : 'Bakong KHQR'}</span>
            <QrCode className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight block">
              ${stats.khqrRevenue.toFixed(2)}
            </span>
            <span className="text-xs text-stone-400 mt-0.5 font-medium block">
              Cash: ${stats.cashRevenue.toFixed(2)} · Card: ${stats.cardRevenue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Comprehensive Filter Toolbar with Clear Section Labels */}
      <div className="p-4 md:p-5 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-4 shadow-xl">
        {/* Row 1: Search & Date Range Filters with Visible Descriptive Labels */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input with explicit Label */}
          <div className="flex-1 max-w-lg">
            <div className="flex items-center gap-1.5 mb-1.5 text-stone-300 text-xs font-bold">
              <Search className="w-3.5 h-3.5 text-amber-500" />
              <span>{isKhmer ? 'ស្វែងរកវិក្កយបត្រ (Quick Search):' : 'Search Tickets & Customers:'}</span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isKhmer ? 'ស្វែងរកលេខវិក្កយបត្រ (ឧ. #ORD-1036), អតិថិជន, ទំនិញ, បេឡាករ...' : 'Search ticket # (e.g. #ORD-1036), customer, items, cashier...'}
                className="w-full bg-stone-950/80 border border-stone-800 focus:border-amber-500 rounded-xl py-2 pl-10 pr-8 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Quick Date Range Filter with explicit Label */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 text-stone-300 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>{isKhmer ? 'ចន្លោះកាលបរិច្ឆេទ (Date Range):' : 'Filter by Date Range:'}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', en: 'All Time', km: 'ទាំងអស់' },
                { id: 'TODAY', en: 'Today', km: 'ថ្ងៃនេះ' },
                { id: 'YESTERDAY', en: 'Yesterday', km: 'ម្សិលមិញ' },
                { id: 'THIS_WEEK', en: 'This Week', km: 'សប្តាហ៍នេះ' },
                { id: 'THIS_MONTH', en: 'This Month', km: 'ខែនេះ' },
                { id: 'CUSTOM', en: 'Custom Date', km: 'កំណត់ថ្ងៃ' }
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDateFilter(d.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    dateFilter === d.id
                      ? 'bg-amber-600 text-stone-950 shadow-sm'
                      : 'bg-stone-950/60 border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-850'
                  }`}
                >
                  {isKhmer ? d.km : d.en}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker when CUSTOM is selected */}
        {dateFilter === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-4 p-3.5 rounded-xl bg-stone-950/80 border border-amber-600/40 text-xs animate-fade-in shadow-inner">
            <div className="flex items-center gap-2">
              <span className="text-stone-400 font-bold">{isKhmer ? 'ចាប់ពីថ្ងៃ (From):' : 'From Date:'}</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-lg px-2.5 py-1 text-stone-100 text-xs focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-400 font-bold">{isKhmer ? 'ដល់ថ្ងៃ (To):' : 'To Date:'}</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-lg px-2.5 py-1 text-stone-100 text-xs focus:outline-none"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                className="text-stone-400 hover:text-rose-400 text-xs underline cursor-pointer"
              >
                {isKhmer ? 'កំណត់ឡើងវិញ' : 'Reset Dates'}
              </button>
            )}
          </div>
        )}

        {/* Row 2: Secondary Filter Deck with Explicit Labels for Payment, Type, Status & Cashier */}
        <div className="pt-3 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* 1. Payment Method Filter with Label */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-stone-300 font-bold">
              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
              <span>{isKhmer ? 'វិធីទូទាត់ប្រាក់ (Payment):' : 'Payment Method:'}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'CASH', label: 'Cash' },
                { id: 'CARD', label: 'Card' },
                { id: 'QR_CODE', label: 'Bakong' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethodFilter(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    methodFilter === m.id
                      ? 'bg-amber-600 text-stone-950 font-black shadow-sm'
                      : 'bg-stone-950/60 border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-850'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Order / Service Type Filter with Label */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-stone-300 font-bold">
              <Coffee className="w-3.5 h-3.5 text-amber-500" />
              <span>{isKhmer ? 'ប្រភេទសេវា (Order Type):' : 'Order Type:'}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'DINE_IN', label: '🍽️ Dine-In' },
                { id: 'TAKEAWAY', label: '🥡 Takeaway' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    typeFilter === t.id
                      ? 'bg-amber-600/30 text-amber-300 border border-amber-500 font-bold shadow-sm'
                      : 'bg-stone-950/60 border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-850'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Order Status Filter with Label */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-stone-300 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isKhmer ? 'ស្ថានភាពវិក្កយបត្រ (Status):' : 'Order Status:'}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'COMPLETED', label: '✅ Settled' },
                { id: 'REFUNDED', label: '↺ Refunded' }
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatusFilter(s.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    statusFilter === s.id
                      ? s.id === 'REFUNDED'
                        ? 'bg-rose-950 text-rose-300 border border-rose-600 font-bold'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold'
                      : 'bg-stone-950/60 border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-850'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Cashier Filter with Label */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-stone-300 font-bold">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isKhmer ? 'បេឡាករ (Cashier):' : 'Cashier / Staff:'}</span>
            </div>
            {isRestrictedCashier ? (
              <div className="flex items-center justify-between w-full bg-stone-950/90 border border-sky-800/70 rounded-lg py-1.5 px-2.5 text-xs text-sky-200 shadow-inner">
                <div className="flex items-center gap-1.5 truncate">
                  <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></div>
                  <span className="font-semibold text-stone-100 truncate">{user?.name || 'Cashier'}</span>
                </div>
                <span className="text-[10px] bg-sky-950 px-2 py-0.5 rounded border border-sky-800/80 text-sky-300 font-mono font-bold uppercase tracking-wider shrink-0">
                  {isKhmer ? 'ផ្ទាល់ខ្លួន' : 'My Sales Only'}
                </span>
              </div>
            ) : (
              <select
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
                className="w-full bg-stone-950/80 border border-stone-800 rounded-lg py-1.5 px-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">{isKhmer ? 'គ្រប់បេឡាករ និងបុគ្គលិកទាំងអស់' : 'All Cashiers & Staff'}</option>
                {uniqueCashiers.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Row 3: Active Filters Summary Bar & Reset All Button */}
        {activeFiltersCount > 0 && (
          <div className="pt-2.5 border-t border-stone-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-stone-400 font-bold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                <span>Active Filters ({activeFiltersCount}):</span>
              </span>
              {isRestrictedCashier ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-950/80 text-sky-300 border border-sky-800 font-medium">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isKhmer ? 'គណនីបេឡាករ៖' : 'Cashier:'} {user?.name || 'My Register'} ({isKhmer ? 'ផ្ទាល់ខ្លួន' : 'Account Sales'})</span>
                </span>
              ) : (
                cashierFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 border border-stone-700 font-medium">
                    Cashier: {cashierFilter}
                    <button onClick={() => setCashierFilter('ALL')} className="text-stone-400 hover:text-stone-100 cursor-pointer">✕</button>
                  </span>
                )
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 border border-stone-700">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-100 cursor-pointer">✕</button>
                </span>
              )}
              {dateFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800/80 font-medium">
                  Date: {dateFilter}
                  <button onClick={() => setDateFilter('ALL')} className="text-amber-400 hover:text-amber-200 cursor-pointer">✕</button>
                </span>
              )}
              {methodFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 border border-stone-700 font-medium">
                  Payment: {methodFilter}
                  <button onClick={() => setMethodFilter('ALL')} className="text-stone-400 hover:text-stone-100 cursor-pointer">✕</button>
                </span>
              )}
              {typeFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/60 font-medium">
                  Type: {typeFilter}
                  <button onClick={() => setTypeFilter('ALL')} className="text-amber-400 hover:text-amber-200 cursor-pointer">✕</button>
                </span>
              )}
              {statusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 border border-stone-700 font-medium">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('ALL')} className="text-stone-400 hover:text-stone-100 cursor-pointer">✕</button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-stone-400 text-xs font-medium">
                Showing <span className="font-bold text-amber-400 font-mono">{filteredOrders.length}</span> {isRestrictedCashier ? (isKhmer ? 'វិក្កយបត្រផ្ទាល់ខ្លួន' : 'of your tickets') : `of ${orders.length} tickets`}
              </span>
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 font-bold transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isKhmer ? 'សម្អាតតម្រងទាំងអស់' : 'Reset All Filters'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Transactions Table */}
      <div className="rounded-2xl border border-stone-800/80 bg-stone-900/70 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-950/90 border-b border-stone-800 uppercase tracking-wider text-[11px] text-stone-400 font-semibold select-none">
              <tr>
                <th className="py-3.5 px-4">{isKhmer ? 'លេខវិក្កយបត្រ' : 'Ticket #'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Date & Time'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'អតិថិជន & ប្រភេទ' : 'Customer / Type'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'ទំនិញដែលបានកម្ម៉ង់' : 'Items'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'វិធីទូទាត់' : 'Payment'}</th>
                <th className="py-3.5 px-4">{isKhmer ? 'សរុបទឹកប្រាក់' : 'Total'}</th>
                <th className="py-3.5 px-4 text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-3.5 px-4 text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-800/60 text-stone-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-stone-500">
                    <Receipt className="w-12 h-12 mx-auto text-stone-700 mb-3" />
                    <p className="font-bold text-stone-300 text-sm">
                      {isRestrictedCashier
                        ? (isKhmer 
                            ? `មិនទាន់មានការលក់សម្រាប់គណនីបេឡាករ ${user?.name || ''} នៅឡើយទេ` 
                            : `No sales recorded yet for cashier account: ${user?.name || 'Cashier'}`)
                        : (isKhmer 
                            ? 'មិនមានប្រវត្តិវិក្កយបត្រត្រូវនឹងការស្វែងរកទេ' 
                            : 'No matching sales tickets found')}
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      {isRestrictedCashier
                        ? (isKhmer 
                            ? 'ការលក់ថ្មីៗដែលបានកត់ត្រាតាមរយៈគណនីរបស់អ្នកនឹងបង្ហាញនៅទីនេះដោយស្វ័យប្រវត្តិ។' 
                            : 'New sales processed by your account will automatically appear here.')
                        : (isKhmer 
                            ? 'ព្យាយាមផ្លាស់ប្តូរតម្រង ឬស្វែងរកពាក្យគន្លឹះផ្សេង' 
                            : 'Try adjusting your search filters or date range.')}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const dateObj = new Date(order.createdAt || Date.now());
                  const formattedDate = dateObj.toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric'
                  });
                  const formattedTime = dateObj.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const isRefunded = order.status === 'REFUNDED';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-stone-850/60 transition group cursor-pointer ${
                        isRefunded ? 'opacity-65 bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Ticket Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{order.orderNumber}</span>
                        </div>
                        <span className="text-[10px] text-stone-500 font-sans block mt-0.5">
                          by {order.cashierName?.split(' ')[0] || 'Staff'}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-stone-300 whitespace-nowrap">
                        <div className="font-medium text-stone-200">{formattedDate}</div>
                        <div className="text-[11px] text-stone-500 font-mono">{formattedTime}</div>
                      </td>

                      {/* Customer / Service Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-stone-200">
                          {order.customerName || 'Walk-in Guest'}
                        </div>
                        <div className="mt-1">
                          {order.orderType === 'DINE_IN' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/70 text-amber-300 border border-amber-700/60 text-[10px] font-bold">
                              🍽️ Dine-In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-950/70 text-sky-300 border border-sky-700/60 text-[10px] font-bold">
                              🥡 Takeaway
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Items with product thumbnails and quantity badges */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-col gap-1">
                          {(order.items || []).map((i, idx) => {
                            const prod = products.find(p => p.id === i.productId || p.name === i.productName);
                            return (
                              <div key={idx} className="flex items-center gap-1.5 text-xs">
                                {prod?.image ? (
                                  <img
                                    src={prod.image}
                                    alt={i.productName}
                                    className="w-5 h-5 rounded-md object-cover border border-stone-700 shrink-0"
                                  />
                                ) : (
                                  <span className="w-5 h-5 rounded-md bg-stone-800 border border-stone-700 flex items-center justify-center text-[10px] shrink-0">
                                    ☕
                                  </span>
                                )}
                                <span className="font-bold text-amber-400 font-mono text-[11px] shrink-0">{i.quantity}×</span>
                                <span className="text-stone-300 truncate">{i.productName}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getPaymentBadge(order.paymentMethod)}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <div className={`font-extrabold text-sm ${isRefunded ? 'line-through text-stone-500' : 'text-stone-100'}`}>
                          ${(order.total || 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {formatKHR(order.total || 0)}
                        </div>
                      </td>

                      {/* Status with prominent Badge Label */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isRefunded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-600 text-[10px] font-bold shadow-sm">
                            <RotateCcw className="w-3 h-3 text-rose-400" />
                            <span>REFUNDED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/80 text-[10px] font-bold shadow-sm">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>SETTLED</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 transition cursor-pointer"
                            title="View order details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateOrder(order)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-600 text-emerald-300 hover:text-stone-950 border border-emerald-700/60 font-semibold text-[11px] transition cursor-pointer"
                            title={isKhmer ? "ចម្លងកម្មង់នេះទៅកន្ត្រក POS (Reorder)" : "Duplicate / Reorder this ticket to POS"}
                          >
                            <Copy className="w-3 h-3" />
                            <span>{isKhmer ? 'ចម្លង' : 'Duplicate'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (setReceiptModalView) setReceiptModalView('customer');
                              setReceiptModalOrder(order);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-amber-600 text-stone-300 hover:text-stone-950 font-semibold text-[11px] transition cursor-pointer"
                            title="Reprint receipt"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (setReceiptModalView) setReceiptModalView('label');
                              setReceiptModalOrder(order);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-600 text-amber-300 hover:text-stone-950 border border-amber-700/60 font-semibold text-[11px] transition cursor-pointer"
                            title="Print drink cup stickers / item labels"
                          >
                            <Tag className="w-3 h-3" />
                            <span>Label</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal / Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono font-bold text-lg text-stone-100">
                      {selectedOrder.orderNumber}
                    </h3>
                    {selectedOrder.status === 'REFUNDED' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                        REFUNDED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        SETTLED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(selectedOrder.createdAt || Date.now()).toLocaleString()} · Register #01
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Itemized Details */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Customer & Server Card */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-stone-950/70 border border-stone-800/80">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-semibold block">{isKhmer ? 'អតិថិជន' : 'Customer'}</span>
                  <span className="font-bold text-stone-200 text-sm mt-0.5 block">
                    {selectedOrder.customerName || 'Walk-in Guest'}
                  </span>
                  {selectedOrder.customerPhone && (
                    <span className="text-[11px] text-stone-400 font-mono">{selectedOrder.customerPhone}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-500 uppercase font-semibold block">{isKhmer ? 'បេឡាករ / Barista' : 'Cashier'}</span>
                  <span className="font-bold text-stone-200 text-sm mt-0.5 block">
                    {selectedOrder.cashierName || 'Liam Vance'}
                  </span>
                  <span className="text-[11px] text-amber-500 uppercase tracking-wider font-semibold">
                    {selectedOrder.orderType === 'DINE_IN' ? '🍽️ Dine-In' : '🥡 Takeaway'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  {isKhmer ? 'មុខទំនិញបានកម្ម៉ង់' : 'Ordered Items'}
                </span>
                <div className="border border-stone-800 rounded-xl divide-y divide-stone-800/70 overflow-hidden bg-stone-950/40">
                  {(selectedOrder.items || []).map((item, idx) => {
                    const itemImg = item.imageUrl || products.find(p => p.id === item.productId || p.name === item.productName)?.imageUrl;
                    return (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-stone-900 border border-stone-800 shrink-0">
                            {itemImg ? (
                              <img
                                src={itemImg}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fb = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                  if (fb) fb.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center bg-stone-900 text-stone-600 fallback-icon ${itemImg ? 'hidden' : ''}`}>
                              <Coffee className="w-4 h-4 text-amber-500/50" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-stone-200 text-sm truncate">
                              {item.quantity}× {item.productName}
                            </div>
                            {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                              <div className="text-[11px] text-amber-400/90 mt-0.5">
                                {Object.entries(item.modifiers).map(([k, v]) => `${k}: ${v}`).join(', ')}
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-[10px] text-stone-400 italic mt-0.5">
                                Note: {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right font-mono font-bold text-stone-100 shrink-0">
                          ${((item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment & Financial Ledger */}
              <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2 font-mono">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal:</span>
                  <span>${(selectedOrder.subtotal || selectedOrder.total || 0).toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-rose-400 font-semibold">
                    <span>Discount:</span>
                    <span>-${selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-400">
                  <span>Tax (8%):</span>
                  <span>${(selectedOrder.tax || 0).toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-stone-800 flex justify-between items-baseline text-base font-bold text-amber-400">
                  <span>Total Due:</span>
                  <div className="text-right">
                    <span>${(selectedOrder.total || 0).toFixed(2)}</span>
                    <span className="text-xs text-stone-400 block font-normal">
                      ≈ {formatKHR(selectedOrder.total || 0)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-800 flex justify-between text-xs text-stone-300">
                  <span>Tender ({selectedOrder.paymentMethod}):</span>
                  <span>${(selectedOrder.amountPaid || selectedOrder.total || 0).toFixed(2)}</span>
                </div>
                {selectedOrder.change > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                    <span>Change Returned:</span>
                    <span>${selectedOrder.change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between gap-3">
              {/* Refund Button */}
              {selectedOrder.status !== 'REFUNDED' ? (
                <button
                  type="button"
                  disabled={isRefunding}
                  onClick={handleExecuteRefund}
                  className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isRefunding ? 'Processing Refund...' : 'Refund Order'}</span>
                </button>
              ) : (
                <span className="text-xs text-rose-400 font-semibold italic flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Order has already been refunded</span>
                </span>
              )}

              {/* Print Receipt & Duplicate Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    duplicateOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title={isKhmer ? "ចម្លងទំនិញទាំងអស់ក្នុងកម្មង់នេះទៅកន្ត្រក POS សម្រាប់ការកុម្ម៉ង់ម្តងទៀត" : "Duplicate all items in this order directly to POS cart"}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'ចម្លងកម្មង់ទៅ POS' : 'Duplicate Order to POS'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptModalOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Receipt Modal for Printout */}
      <ReceiptModal />
    </div>
  );
};
