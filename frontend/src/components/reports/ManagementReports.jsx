import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Users, 
  QrCode, 
  CreditCard, 
  Banknote, 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Calendar, 
  Clock, 
  Percent, 
  ShoppingBag, 
  Sparkles, 
  Filter, 
  RotateCcw, 
  Check, 
  X, 
  Coffee, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  UserPlus, 
  Search, 
  ArrowUpDown, 
  FileDown, 
  Award, 
  CheckCircle,
  Layers,
  ArrowUpRight,
  Eye,
  FileText,
  Package,
  AlertTriangle,
  ShieldAlert,
  Crown,
  Gift,
  Flame,
  Activity,
  CheckCircle2,
  PieChart as PieChartIcon
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
import { CreateUserModal } from '../auth/CreateUserModal';
import { soundService } from '../../services/soundService';
import { StoreLogo } from '../common/StoreLogo';

export const ManagementReports = () => {
  const { 
    orders, 
    products, 
    ingredients, 
    categories, 
    shifts, 
    customers, 
    showToast, 
    user,
    storeInfo
  } = useApp();
  const { isKhmer } = useLanguage();

  // 10 Reports Tabs + Export Center
  // 1: 'overview', 2: 'sales', 3: 'products', 4: 'categories', 5: 'payments', 
  // 6: 'peak-hours', 7: 'cogs', 8: 'inventory', 9: 'staff', 10: 'loyalty-discounts', 'export'
  const [activeTab, setActiveTab] = useState('overview');
  const [reportViewMode, setReportViewMode] = useState('one-page'); // 'one-page' (unified 1-page report) or 'tabbed' (10 deep-dive tabs)
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Search & Filter Sub-states
  const [salesSearch, setSalesSearch] = useState('');
  const [salesPaymentFilter, setSalesPaymentFilter] = useState('ALL');
  const [ordersPageLimit, setOrdersPageLimit] = useState(1000); // List all orders by default
  
  const [productSearch, setProductSearch] = useState('');
  const [productSort, setProductSort] = useState('units'); // 'units', 'revenue', 'margin', 'name'
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [productPageLimit, setProductPageLimit] = useState(1000); // List all products by default

  const [overviewProductSearch, setOverviewProductSearch] = useState('');
  const [overviewProductsLimit, setOverviewProductsLimit] = useState(1000); // List all products on 1-page report
  const [overviewOrdersLimit, setOverviewOrdersLimit] = useState(1000); // List all orders on 1-page report

  const [categorySearch, setCategorySearch] = useState('');
  const [cogsSearch, setCogsSearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('ALL'); // 'ALL', 'CRITICAL', 'LOW', 'OPTIMAL'
  const [loyaltySearch, setLoyaltySearch] = useState('');

  // Date & Scope Filters
  const [filters, setFilters] = useState({
    datePreset: 'all', // 'today', 'week', 'month', 'all', 'custom'
    startDate: '',
    endDate: '',
    cashier: 'all',
    category: 'all'
  });

  const exportMenuRef = useRef(null);
  const tabsContainerRef = useRef(null);

  const scrollTabs = (offset) => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Scroll active tab into view when activeTab changes
  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeEl = tabsContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  // Click outside to close export dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const getDaysAgoISO = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const handleApplyPreset = (preset) => {
    soundService.playBeepSound();
    if (preset === 'today') {
      const today = getTodayISO();
      setFilters(prev => ({ ...prev, datePreset: 'today', startDate: today, endDate: today }));
    } else if (preset === 'yesterday') {
      const yesterday = getDaysAgoISO(1);
      setFilters(prev => ({ ...prev, datePreset: 'yesterday', startDate: yesterday, endDate: yesterday }));
    } else if (preset === 'week') {
      setFilters(prev => ({ ...prev, datePreset: 'week', startDate: getDaysAgoISO(7), endDate: getTodayISO() }));
    } else if (preset === 'month') {
      setFilters(prev => ({ ...prev, datePreset: 'month', startDate: getDaysAgoISO(30), endDate: getTodayISO() }));
    } else if (preset === 'all') {
      setFilters(prev => ({ ...prev, datePreset: 'all', startDate: '', endDate: '' }));
    }
  };

  const handleCustomDateChange = (field, val) => {
    setFilters(prev => ({
      ...prev,
      datePreset: 'custom',
      [field]: val
    }));
  };

  const handleResetFilters = () => {
    soundService.playBeepSound();
    setFilters({
      datePreset: 'all',
      startDate: '',
      endDate: '',
      cashier: 'all',
      category: 'all'
    });
    showToast(isKhmer ? 'បានកំណត់លំនាំដើមតម្រងឡើងវិញ' : 'Filters reset to default', 'info');
  };

  const loadReport = async () => {
    setIsFiltering(true);
    try {
      const data = await api.fetchManagementReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        cashier: filters.cashier,
        category: filters.category
      });
      setReportData(data);
    } catch (err) {
      console.error('Report fetch error:', err);
    } finally {
      setIsFiltering(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [filters, orders, products, ingredients]);

  // =========================================================================
  // DYNAMIC COMPUTED VALUES & KPI AGGREGATIONS
  // =========================================================================
  const netSales = reportData?.netSales || 0;
  const grossSales = reportData?.grossSales || 0;
  const totalTax = reportData?.totalTax || 0;
  const totalDiscounts = reportData?.totalDiscounts || 0;
  const customerCount = reportData?.customerCount || 0;
  const avgSpend = reportData?.averageSpendPerGuest || 0;
  const cashTotal = reportData?.paymentBreakdown?.CASH || 0;
  const khqrTotal = reportData?.paymentBreakdown?.KHQR || 0;
  const cardTotal = reportData?.paymentBreakdown?.CARD || 0;
  const totalGrossProfit = reportData?.totalGrossProfit != null ? reportData.totalGrossProfit : (netSales * 0.726);
  const overallCogsPercentage = reportData?.overallCogsPercentage != null ? reportData.overallCogsPercentage : 27.4;
  const totalCOGS = reportData?.totalCogs != null ? reportData.totalCogs : (netSales * (overallCogsPercentage / 100));
  const peakHourData = reportData?.peakHourData || [];
  const staffPerformance = reportData?.staffPerformance || [];
  const itemProfitability = reportData?.itemProfitability || [];

  const lowStockIngredients = useMemo(() => {
    return (ingredients || []).filter(ing => (ing.stock || 0) <= (ing.minThreshold || 5));
  }, [ingredients]);

  const totalTenders = (cashTotal + khqrTotal + cardTotal) || 1;
  const cashPct = Math.round((cashTotal / totalTenders) * 100);
  const khqrPct = Math.round((khqrTotal / totalTenders) * 100);
  const cardPct = Math.round((cardTotal / totalTenders) * 100);
  const cashlessRate = (((khqrTotal + cardTotal) / totalTenders) * 100).toFixed(1);

  const topItems = (reportData?.allProductPerformance || []).slice(0, 5);

  // Category Breakdown Aggregations (Report 4)
  const categoryStats = useMemo(() => {
    const catMap = {};
    const catColors = ['#f59e0b', '#10b981', '#38bdf8', '#a855f7', '#ec4899', '#f97316', '#64748b'];

    // Collect defined categories
    (categories || []).forEach((cat, idx) => {
      const cName = typeof cat === 'string' ? cat : (cat.name || cat.id);
      catMap[cName] = {
        name: cName,
        revenue: 0,
        units: 0,
        itemCount: 0,
        topItem: null,
        topItemUnits: 0,
        color: catColors[idx % catColors.length]
      };
    });

    // Match products
    (products || []).forEach(prod => {
      const cat = prod.category || 'Other';
      if (!catMap[cat]) {
        catMap[cat] = { name: cat, revenue: 0, units: 0, itemCount: 0, topItem: null, topItemUnits: 0, color: '#f59e0b' };
      }
      catMap[cat].itemCount += 1;
    });

    // Populate performance
    const perfList = reportData?.allProductPerformance || [];
    perfList.forEach(p => {
      const cat = p.category || 'Other';
      if (!catMap[cat]) {
        catMap[cat] = { name: cat, revenue: 0, units: 0, itemCount: 0, topItem: null, topItemUnits: 0, color: '#f59e0b' };
      }
      const rev = p.revenue || (p.retailPrice * (p.unitsSold || 0));
      const units = p.unitsSold || 0;
      catMap[cat].revenue += rev;
      catMap[cat].units += units;
      if (units > catMap[cat].topItemUnits) {
        catMap[cat].topItemUnits = units;
        catMap[cat].topItem = p.name;
      }
    });

    const totalCatRevenue = Object.values(catMap).reduce((acc, c) => acc + c.revenue, 0) || 1;
    let list = Object.values(catMap).map(c => ({
      ...c,
      sharePct: Math.round((c.revenue / totalCatRevenue) * 100),
      avgPrice: c.units > 0 ? (c.revenue / c.units).toFixed(2) : '0.00'
    })).sort((a, b) => b.revenue - a.revenue);

    if (categorySearch.trim()) {
      const q = categorySearch.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [categories, products, reportData, categorySearch]);

  // Filtered Orders for Sales Ledger (Report 2)
  const filteredOrders = useMemo(() => {
    let list = orders || [];
    if (salesPaymentFilter !== 'ALL') {
      list = list.filter(o => {
        let m = o.paymentMethod || 'CASH';
        if (m === 'QR_CODE') m = 'KHQR';
        return m.toUpperCase() === salesPaymentFilter;
      });
    }
    if (salesSearch.trim()) {
      const q = salesSearch.toLowerCase();
      list = list.filter(o => 
        (o.id && String(o.id).toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.cashierName && o.cashierName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [orders, salesPaymentFilter, salesSearch]);

  // Filtered & Sorted Products (Report 3)
  const filteredProducts = useMemo(() => {
    let list = reportData?.allProductPerformance || [];
    if (productCategoryFilter !== 'ALL') {
      list = list.filter(p => p.category === productCategoryFilter);
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (productSort === 'units') return (b.unitsSold || 0) - (a.unitsSold || 0);
      if (productSort === 'revenue') return (b.revenue || 0) - (a.revenue || 0);
      if (productSort === 'margin') return (b.profitMarginPct || b.marginPercentage || 0) - (a.profitMarginPct || a.marginPercentage || 0);
      if (productSort === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [reportData, productCategoryFilter, productSearch, productSort]);

  // Overview Products with live search for 1-Page Consolidated Report
  const overviewProducts = useMemo(() => {
    let list = filteredProducts;
    if (overviewProductSearch.trim()) {
      const q = overviewProductSearch.toLowerCase();
      list = list.filter(p => (p.name && p.name.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase().includes(q)));
    }
    return list;
  }, [filteredProducts, overviewProductSearch]);

  // Filtered Inventory Stock Depletion (Report 8)
  const filteredInventory = useMemo(() => {
    let list = (ingredients || []).map(ing => {
      const ratio = ing.minThreshold > 0 ? (ing.stock / ing.minThreshold) : 2.0;
      let status = 'OPTIMAL';
      if (ing.stock <= ing.minThreshold) status = 'CRITICAL';
      else if (ing.stock <= ing.minThreshold * 1.5) status = 'LOW';

      const suggestedReorder = Math.max(10, Math.round(ing.minThreshold * 2.5 - ing.stock));
      const reorderCost = suggestedReorder * (ing.costPerUnit || 0);
      const totalStockVal = ing.stock * (ing.costPerUnit || 0);

      return {
        ...ing,
        status,
        ratio,
        suggestedReorder,
        reorderCost,
        totalStockVal
      };
    });

    if (inventoryFilter !== 'ALL') {
      list = list.filter(i => i.status === inventoryFilter);
    }
    return list;
  }, [ingredients, inventoryFilter]);

  // Filtered VIP Loyalty Customers (Report 10)
  const filteredLoyalty = useMemo(() => {
    let list = customers || [];
    if (loyaltySearch.trim()) {
      const q = loyaltySearch.toLowerCase();
      list = list.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }
    return [...list].sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [customers, loyaltySearch]);

  // Filtered COGS Recipe Profitability (Report 7)
  const filteredCogs = useMemo(() => {
    let list = itemProfitability || [];
    if (cogsSearch.trim()) {
      const q = cogsSearch.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [itemProfitability, cogsSearch]);

  // =========================================================================
  // COMPLETE 10-SHEET NATIVE EXCEL (.XLSX) EXPORT ENGINE
  // =========================================================================
  const exportToExcel = (mode = 'all') => {
    setIsExportMenuOpen(false);
    soundService.playPaymentSuccessSound();
    if (!reportData) return;

    const wb = XLSX.utils.book_new();
    const dateScope = (filters.startDate && filters.endDate)
      ? `${filters.startDate} to ${filters.endDate}`
      : filters.datePreset.toUpperCase();
    const generatedAt = new Date().toLocaleString('en-GB');
    const operatorName = `${user?.name || 'Liam Vance'} (${user?.role || 'ADMIN'})`;

    const formatWorksheet = (ws, merges = [], colWidths = []) => {
      if (merges.length > 0) ws['!merges'] = merges;
      if (colWidths.length > 0) ws['!cols'] = colWidths.map(w => ({ wch: w }));
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
      return ws;
    };

    // 1. Sheet: Executive Overview
    if (mode === 'all' || mode === 'overview') {
      const overviewRows = [
        ['☕ AROMA COFFEE & ARTISAN BAKERY POS'],
        ['REPORT 1: EXECUTIVE MANAGEMENT FINANCIAL OVERVIEW'],
        [`Scope: ${dateScope}   |   Generated: ${generatedAt}   |   Audited By: ${operatorName}`],
        [],
        ['1. CORE FINANCIAL PERFORMANCE METRICS', 'AMOUNT (USD)', 'AMOUNT (KHR)', 'DESCRIPTION'],
        ['Gross Sales Volume', grossSales, Math.round(grossSales * 4100), 'Total gross revenue prior to deductions'],
        ['Discounts Total', -totalDiscounts, -Math.round(totalDiscounts * 4100), 'Promotions, VIP and customer loyalty discounts'],
        ['Sales Tax (VAT 8%)', totalTax, Math.round(totalTax * 4100), 'Statutory sales tax collection'],
        ['Net Revenue Collected', netSales, Math.round(netSales * 4100), 'Cleared net intake settled in cash registers'],
        ['Orders Handled', customerCount, '-', 'Completed guest checkout transactions'],
        ['Average Spend Per Guest', avgSpend, Math.round(avgSpend * 4100), 'Average order value (AOV) per guest receipt'],
        ['Gross Profit (After COGS)', totalGrossProfit, Math.round(totalGrossProfit * 4100), 'Operating profit after raw ingredients cost'],
        ['Store Gross Profit Margin', `${(100 - overallCogsPercentage).toFixed(1)}%`, '-', 'Store-wide gross profit margin ratio'],
        [],
        ['2. PAYMENT TENDER RECONCILIATION', 'AMOUNT (USD)', 'AMOUNT (KHR)', 'TENDER SHARE %'],
        ['Physical Cash (USD & KHR)', cashTotal, Math.round(cashTotal * 4100), `${cashPct}%`],
        ['Bakong KHQR (NBC QR)', khqrTotal, Math.round(khqrTotal * 4100), `${khqrPct}%`],
        ['Credit / Debit Cards', cardTotal, Math.round(cardTotal * 4100), `${cardPct}%`],
        ['Total Tenders Audited', cashTotal + khqrTotal + cardTotal, Math.round((cashTotal + khqrTotal + cardTotal) * 4100), '100.0%']
      ];
      const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
      formatWorksheet(wsOverview, [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
      ], [32, 20, 20, 38]);
      XLSX.utils.book_append_sheet(wb, wsOverview, '1_Executive_Overview');
    }

    // 2. Sheet: Sales & Daily Ledger
    if (mode === 'all' || mode === 'sales') {
      const salesRows = [
        ['☕ AROMA COFFEE & ARTISAN BAKERY POS'],
        ['REPORT 2: SALES & DAILY ORDERS AUDIT LEDGER'],
        [`Scope: ${dateScope}   |   Total Orders: ${orders?.length || 0}   |   Audited By: ${operatorName}`],
        [],
        ['Receipt ID', 'Customer', 'Cashier', 'Order Type', 'Items Summary', 'Payment', 'Subtotal ($)', 'Discount ($)', 'Tax ($)', 'Total ($)', 'Total (KHR)', 'Status']
      ];
      (orders || []).forEach(o => {
        const itemSumm = (o.items || []).map(it => `${it.productName || it.name} (${it.quantity})`).join(', ');
        salesRows.push([
          o.id,
          o.customerName || 'Walk-in Guest',
          o.cashierName || 'Liam Vance',
          o.orderType || 'DINE_IN',
          itemSumm,
          o.paymentMethod || 'CASH',
          o.subtotal || 0,
          o.discount || 0,
          o.tax || 0,
          o.total || 0,
          Math.round((o.total || 0) * 4100),
          o.status || 'PAID'
        ]);
      });
      const wsSales = XLSX.utils.aoa_to_sheet(salesRows);
      formatWorksheet(wsSales, [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } }
      ], [14, 18, 16, 12, 36, 12, 14, 14, 12, 14, 16, 12]);
      XLSX.utils.book_append_sheet(wb, wsSales, '2_Sales_Ledger');
    }

    // 3. Sheet: Product Performance
    if (mode === 'all' || mode === 'products') {
      const productRows = [
        ['☕ AROMA COFFEE & ARTISAN BAKERY POS'],
        ['REPORT 3: PRODUCT SALES & MENU MIX AUDIT'],
        [`Scope: ${dateScope}   |   Menu Items: ${(reportData.allProductPerformance || []).length}`],
        [],
        ['Rank', 'Item Name', 'Category', 'Price ($)', 'Price (KHR)', 'Units Sold', 'Revenue ($)', 'Revenue (KHR)', 'Cost ($)', 'Gross Profit ($)', 'Margin %']
      ];
      (reportData.allProductPerformance || []).forEach((p, idx) => {
        const price = p.retailPrice || p.unitPrice || 0;
        const units = p.unitsSold || 0;
        const rev = p.revenue || (price * units);
        const cost = p.unitCost || p.bomCost || (price * 0.28);
        const profit = p.grossProfit || (rev - (cost * units));
        const margin = p.profitMarginPct || p.marginPercentage || 70;
        productRows.push([
          idx + 1,
          p.name,
          p.category,
          price,
          Math.round(price * 4100),
          units,
          rev,
          Math.round(rev * 4100),
          cost,
          profit,
          `${margin}%`
        ]);
      });
      const wsProducts = XLSX.utils.aoa_to_sheet(productRows);
      formatWorksheet(wsProducts, [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }
      ], [8, 30, 16, 14, 14, 12, 16, 16, 14, 16, 12]);
      XLSX.utils.book_append_sheet(wb, wsProducts, '3_Product_Performance');
    }

    // 4. Sheet: Category Breakdown
    if (mode === 'all' || mode === 'categories') {
      const categoryRows = [
        ['☕ AROMA COFFEE & ARTISAN BAKERY POS'],
        ['REPORT 4: CATEGORY & DEPARTMENT BREAKDOWN'],
        [`Scope: ${dateScope}   |   Audited By: ${operatorName}`],
        [],
        ['Category Name', 'Items in Menu', 'Units Sold', 'Gross Revenue ($)', 'Revenue (KHR)', 'Share of Sales %', 'Avg Item Price ($)', 'Top Selling Hero Item']
      ];
      categoryStats.forEach(c => {
        categoryRows.push([
          c.name,
          c.itemCount,
          c.units,
          c.revenue,
          Math.round(c.revenue * 4100),
          `${c.sharePct}%`,
          c.avgPrice,
          c.topItem || 'N/A'
        ]);
      });
      const wsCat = XLSX.utils.aoa_to_sheet(categoryRows);
      formatWorksheet(wsCat, [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }
      ], [22, 14, 14, 18, 18, 16, 16, 28]);
      XLSX.utils.book_append_sheet(wb, wsCat, '4_Category_Breakdown');
    }

    // 5. Sheet: Payment Tenders & Shift Reconciliation
    if (mode === 'all' || mode === 'payments') {
      const paymentRows = [
        ['☕ AROMA COFFEE & ARTISAN BAKERY POS'],
        ['REPORT 5: PAYMENT TENDERS & SHIFT CASH RECONCILIATION'],
        [`Scope: ${dateScope}   |   Cashless Adoption: ${cashlessRate}%`],
        [],
        ['Shift ID', 'Cashier', 'Opened At', 'Closed At', 'Starting Float ($)', 'Expected Cash ($)', 'Actual Cash ($)', 'Variance ($)', 'Status']
      ];
      (shifts || []).forEach(sh => {
        paymentRows.push([
          sh.id,
          sh.cashierName || 'Liam Vance',
          sh.openedAt ? new Date(sh.openedAt).toLocaleString() : 'N/A',
          sh.closedAt ? new Date(sh.closedAt).toLocaleString() : 'Active',
          sh.startingFloat || 0,
          sh.expectedCash || 0,
          sh.actualCash || sh.expectedCash || 0,
          (sh.actualCash && sh.expectedCash) ? (sh.actualCash - sh.expectedCash) : 0,
          sh.status || 'CLOSED'
        ]);
      });
      const wsPay = XLSX.utils.aoa_to_sheet(paymentRows);
      formatWorksheet(wsPay, [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
      ], [14, 18, 20, 20, 16, 16, 16, 14, 14]);
      XLSX.utils.book_append_sheet(wb, wsPay, '5_Payment_Tenders');
    }

    // 6. Sheet: Hourly Rush Demand
    if (mode === 'all' || mode === 'peak-hours') {
      const hourlyRows = [
        ['☕ AROMA COFFEE & ARTISAN BAKERY POS'],
        ['REPORT 6: HOURLY SALES VELOCITY & RUSH DEMAND'],
        [`Scope: ${dateScope}   |   Generated: ${generatedAt}`],
        [],
        ['Hour Slot', 'Sales ($)', 'Sales (KHR)', 'Customer Tickets', 'Avg Ticket ($)', 'Recommended Staffing']
      ];
      (peakHourData || []).forEach(h => {
        const sales = h.sales || 0;
        const tickets = h.tickets || 0;
        hourlyRows.push([
          h.hour,
          sales,
          Math.round(sales * 4100),
          tickets,
          tickets > 0 ? (sales / tickets).toFixed(2) : '0.00',
          h.recommendedStaff || (tickets > 30 ? 3 : 2)
        ]);
      });
      const wsHourly = XLSX.utils.aoa_to_sheet(hourlyRows);
      formatWorksheet(wsHourly, [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }
      ], [16, 16, 16, 18, 16, 24]);
      XLSX.utils.book_append_sheet(wb, wsHourly, '6_Hourly_Rush');
    }

    // 7. Sheet: COGS & Recipe Profitability
    if (mode === 'all' || mode === 'cogs') {
      const cogsRows = [
        ['☕ AROMA COFFEE & ARTISAN BAKERY POS'],
        ['REPORT 7: COGS & RECIPE PROFITABILITY AUDIT'],
        [`Store-wide COGS Ratio: ${overallCogsPercentage}%   |   Target Benchmark: < 28%`],
        [],
        ['Item Name', 'Category', 'Retail Price ($)', 'BOM Cost ($)', 'Gross Margin ($)', 'Margin %', 'COGS %', 'Health Status']
      ];
      itemProfitability.forEach(it => {
        const status = it.marginPercentage >= 75 ? 'STAR_MARGIN' : (it.marginPercentage >= 65 ? 'HEALTHY' : 'HIGH_COGS');
        cogsRows.push([
          it.name,
          it.category,
          it.retailPrice || 0,
          it.bomCost || 0,
          it.grossMargin || 0,
          `${it.marginPercentage}%`,
          `${it.cogsPercentage}%`,
          status
        ]);
      });
      const wsCogs = XLSX.utils.aoa_to_sheet(cogsRows);
      formatWorksheet(wsCogs, [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }
      ], [28, 16, 16, 16, 16, 14, 14, 18]);
      XLSX.utils.book_append_sheet(wb, wsCogs, '7_COGS_Recipe_Margins');
    }

    // 8. Sheet: Raw Inventory Depletion
    if (mode === 'all' || mode === 'inventory') {
      const inventoryRows = [
        ['☕ AROMA COFFEE & ARTISAN BAKERY POS'],
        ['REPORT 8: RAW MATERIALS & STOCK DEPLETION'],
        [`Scope: ${dateScope}   |   Total Raw Ingredients: ${(ingredients || []).length}`],
        [],
        ['Ingredient Name', 'Current Stock', 'Unit', 'Safety Threshold', 'Unit Cost ($)', 'Stock Value ($)', 'Depletion Status', 'Suggested Reorder', 'Estimated Restock Cost ($)']
      ];
      filteredInventory.forEach(ing => {
        inventoryRows.push([
          ing.name,
          ing.stock,
          ing.unit,
          ing.minThreshold,
          ing.costPerUnit || 0,
          ing.totalStockVal,
          ing.status,
          ing.suggestedReorder,
          ing.reorderCost
        ]);
      });
      const wsInv = XLSX.utils.aoa_to_sheet(inventoryRows);
      formatWorksheet(wsInv, [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
      ], [24, 14, 10, 16, 14, 16, 18, 18, 22]);
      XLSX.utils.book_append_sheet(wb, wsInv, '8_Inventory_Depletion');
    }

    // 9. Sheet: Staff Performance & Labor Audit
    if (mode === 'all' || mode === 'staff') {
      const staffRows = [
        ['☕ AROMA COFFEE & ARTISAN BAKERY POS'],
        ['REPORT 9: STAFF PERFORMANCE & LABOR AUDIT'],
        [`Scope: ${dateScope}   |   Store Labor Ratio: ${reportData.storeLaborCostPercentage || 24}%`],
        [],
        ['Staff Name', 'Role', 'Tickets Handled', 'Sales ($)', 'Sales (KHR)', 'Avg Ticket ($)', 'Void Count', 'Discounts ($)', 'Hours', 'Labor Cost ($)', 'Labor %']
      ];
      (staffPerformance || []).forEach(st => {
        staffRows.push([
          st.name,
          st.role,
          st.ticketsHandled || 0,
          st.salesGenerated || 0,
          Math.round((st.salesGenerated || 0) * 4100),
          st.avgTicketValue || 0,
          st.voidCount || 0,
          st.discountTotal || 0,
          st.hoursWorked || 0,
          st.laborCost || 0,
          `${st.laborCostPct || 0}%`
        ]);
      });
      const wsStaff = XLSX.utils.aoa_to_sheet(staffRows);
      formatWorksheet(wsStaff, [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }
      ], [20, 16, 16, 16, 16, 14, 12, 14, 10, 16, 12]);
      XLSX.utils.book_append_sheet(wb, wsStaff, '9_Staff_Performance');
    }

    // 10. Sheet: Loyalty & Discounts Audit
    if (mode === 'all' || mode === 'loyalty-discounts') {
      const loyaltyRows = [
        ['☕ AROMA COFFEE & ARTISAN BAKERY POS'],
        ['REPORT 10: DISCOUNTS, VOIDS & CUSTOMER LOYALTY AUDIT'],
        [`Total Discounts: $${totalDiscounts.toFixed(2)}   |   VIP Customers: ${(customers || []).length}`],
        [],
        ['Rank', 'Customer Name', 'Phone Number', 'Loyalty Tier', 'Points Balance', 'Total Lifetime Spend ($)', 'Spend (KHR)', 'Visits Count']
      ];
      filteredLoyalty.forEach((c, idx) => {
        loyaltyRows.push([
          idx + 1,
          c.name,
          c.phone || 'N/A',
          c.tier || 'VIP MEMBER',
          c.points || 0,
          c.totalSpent || 0,
          Math.round((c.totalSpent || 0) * 4100),
          c.visitCount || 1
        ]);
      });
      const wsLoyalty = XLSX.utils.aoa_to_sheet(loyaltyRows);
      formatWorksheet(wsLoyalty, [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }
      ], [8, 24, 18, 16, 16, 20, 20, 14]);
      XLSX.utils.book_append_sheet(wb, wsLoyalty, '10_Loyalty_Discounts');
    }

    // Write file to download
    const filename = `AromaPOS_10_Report_Workbook_${getTodayISO()}.xlsx`;
    XLSX.writeFile(wb, filename);

    showToast(
      isKhmer 
        ? `បានទាញយកកញ្ចប់ Excel ពេញលេញទាំង ១០ របាយការណ៍: ${filename}` 
        : `Downloaded complete 10-report Excel package: ${filename}`, 
      'success'
    );
  };

  // CSV Fallback Export
  const exportToCSV = () => {
    setIsExportMenuOpen(false);
    soundService.playPaymentSuccessSound();
    if (!reportData) return;

    let csvContent = '\uFEFF';
    csvContent += 'AROMA POS & BAKERY - 10-REPORT AUDIT SUMMARY\r\n';
    csvContent += `Generated At,${new Date().toLocaleString('en-GB')}\r\n`;
    csvContent += `Scope,${filters.datePreset.toUpperCase()}\r\n\r\n`;

    csvContent += '1. EXECUTIVE KPI,AMOUNT (USD),AMOUNT (KHR)\r\n';
    csvContent += `Gross Sales,$${grossSales.toFixed(2)},៛${Math.round(grossSales * 4100)}\r\n`;
    csvContent += `Discounts,-$${totalDiscounts.toFixed(2)},-៛${Math.round(totalDiscounts * 4100)}\r\n`;
    csvContent += `VAT 8%,$${totalTax.toFixed(2)},៛${Math.round(totalTax * 4100)}\r\n`;
    csvContent += `Net Sales,$${netSales.toFixed(2)},៛${Math.round(netSales * 4100)}\r\n`;
    csvContent += `Orders Handled,${customerCount},-\r\n\r\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `AromaPOS_Executive_Report_${getTodayISO()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(isKhmer ? 'បានទាញយកឯកសារ CSV' : 'CSV file downloaded successfully', 'success');
  };

  const handlePrint = () => {
    soundService.playBeepSound();
    setIsPrintPreviewOpen(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // 10 Tabs Definition with icons and bilingual descriptions
  const REPORT_TABS = [
    { id: 'overview', num: 1, label: isKhmer ? '១. សង្ខេបប្រតិបត្តិ' : '1. Executive Summary', icon: BarChart3 },
    { id: 'sales', num: 2, label: isKhmer ? '២. បញ្ជីលក់ប្រចាំថ្ងៃ' : '2. Sales & Daily Ledger', icon: TrendingUp },
    { id: 'products', num: 3, label: isKhmer ? '៣. ទំនិញលក់ដាច់ (Top Products)' : '3. Top Products & Mix', icon: ShoppingBag },
    { id: 'categories', num: 4, label: isKhmer ? '៤. ក្រុមមុខទំនិញ' : '4. Category Breakdown', icon: Layers },
    { id: 'payments', num: 5, label: isKhmer ? '៥. វិធីសាស្ត្រទូទាត់ & វេន' : '5. Payment Tenders & Shifts', icon: Banknote },
    { id: 'peak-hours', num: 6, label: isKhmer ? '៦. ម៉ោងលក់ដាច់ខ្លាំង' : '6. Peak Hours & Demand', icon: Clock },
    { id: 'cogs', num: 7, label: isKhmer ? '៧. ថ្លៃដើម COGS & ចំណេញ' : '7. COGS & Recipe Margins', icon: Percent },
    { id: 'inventory', num: 8, label: isKhmer ? '៨. វត្ថុធាតុដើម & ស្តុក' : '8. Inventory Depletion', icon: Package },
    { id: 'staff', num: 9, label: isKhmer ? '៩. បុគ្គលិកឆ្នើម (Top Staff Audit)' : '9. Top Staff & Labor', icon: Users },
    { id: 'loyalty-discounts', num: 10, label: isKhmer ? '១០. ការបញ្ចុះតម្លៃ & ភក្តីភាព' : '10. Loyalty & Discounts', icon: Gift },
    { id: 'export', num: '+', label: isKhmer ? 'មជ្ឈមណ្ឌល Excel' : 'Excel & Export Hub', icon: FileSpreadsheet }
  ];

  if (loading && !reportData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-stone-900/40 p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-stone-400">
            {isKhmer ? 'កំពុងទាញយកទិន្នន័យរបាយការណ៍ POS ទាំង ១០...' : 'Loading Standard 10-Report POS Suite...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 bg-stone-900/40 select-none">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & GLOBAL ACTIONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-stone-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              <span>{isKhmer ? 'ប្រព័ន្ធរបាយការណ៍អាជីវកម្មទាំង ១០ (10-Report Suite)' : 'POS 10-Report Business Intelligence Suite'}</span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 uppercase tracking-wide">
              10 Core Reports
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            {isKhmer 
              ? 'របាយការណ៍គ្រប់គ្រងហាងកាហ្វេ & ភោជនីយដ្ឋានពេញលេញ • នាំចេញ Excel (.xlsx) ១០ សន្លឹក & បោះពុម្ព A4' 
              : 'Complete coffee shop & retail management reports • 10-Sheet native Excel (.xlsx) & 1-page A4 print'}
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle: 1-Page Consolidated vs Detailed 10-Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-stone-900 border border-stone-800 text-xs shadow-inner">
            <button
              type="button"
              onClick={() => {
                soundService.playBeepSound();
                setReportViewMode('one-page');
                setActiveTab('overview');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                reportViewMode === 'one-page'
                  ? 'bg-amber-600 text-stone-950 shadow-md font-extrabold ring-1 ring-amber-400'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ទំព័រតែមួយ (1-Page)' : '1-Page Report'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundService.playBeepSound();
                setReportViewMode('tabbed');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                reportViewMode === 'tabbed'
                  ? 'bg-amber-600 text-stone-950 shadow-md font-extrabold ring-1 ring-amber-400'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ផ្ទាំងលម្អិត (10 Tabs)' : '10-Tabs View'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateUserOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-700 text-stone-300 font-bold text-xs transition cursor-pointer shadow-sm hover:border-amber-500/50"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>{isKhmer ? 'បង្កើតគណនី' : 'Add User'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playBeepSound();
              setIsPrintPreviewOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-700 hover:border-cyan-500/60 text-stone-200 font-bold text-xs transition cursor-pointer shadow-sm active:scale-95"
            title="Preview and print clean 1-page A4 summary"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isKhmer ? 'បោះពុម្ព ១ទំព័រ' : 'Print 1-Page'}</span>
          </button>

          {/* Export Native Excel (.xlsx) Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/50 transition cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>{isKhmer ? 'នាំចេញ Excel (.xlsx)' : 'Export to Excel (.xlsx)'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-stone-900 border border-stone-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-stone-800 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  {isKhmer ? 'ជម្រើសនាំចេញ Excel' : 'Choose Export Format'}
                </div>

                <div className="space-y-1 pt-1">
                  <button
                    type="button"
                    onClick={() => exportToExcel('all')}
                    className="w-full p-2.5 rounded-xl hover:bg-emerald-950/40 text-left transition flex items-start gap-2.5 group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-100 group-hover:text-emerald-300">
                        {isKhmer ? 'កញ្ចប់ Excel ពេញលេញ (១០ សន្លឹក)' : 'Complete 10-Sheet Workbook (.xlsx)'}
                      </p>
                      <p className="text-[10px] text-stone-400 leading-tight">
                        {isKhmer ? 'គ្រប់ ១០ របាយការណ៍ទាំងអស់ក្នុងឯកសារតែមួយ' : 'All 10 structured reports in one workbook'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportToExcel(activeTab)}
                    className="w-full p-2.5 rounded-xl hover:bg-stone-800 text-left transition flex items-start gap-2.5 group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-200 group-hover:text-amber-300">
                        {isKhmer ? 'នាំចេញរបាយការណ៍បច្ចុប្បន្ន (.xlsx)' : 'Export Current Active Report (.xlsx)'}
                      </p>
                      <p className="text-[10px] text-stone-400 leading-tight">
                        {isKhmer ? 'នាំចេញតែរបាយការណ៍ដែលកំពុងមើល' : 'Download active sheet only'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const url = api.getExportUrl('top_products', filters);
                      window.open(url, '_blank');
                      setIsExportMenuOpen(false);
                      showToast(isKhmer ? 'កំពុងទាញយករបាយការណ៍ទំនិញលក់ដាច់...' : 'Downloading Top Products CSV...', 'info');
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-amber-950/30 text-left transition flex items-start gap-2.5 group cursor-pointer border-t border-stone-800"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-200 group-hover:text-amber-300">
                        {isKhmer ? 'ទាញយកទំនិញលក់ដាច់ (.csv)' : 'Top Products Report (.csv)'}
                      </p>
                      <p className="text-[10px] text-stone-400 leading-tight">
                        Ranked units sold, revenue & margin
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const url = api.getExportUrl('top_staff', filters);
                      window.open(url, '_blank');
                      setIsExportMenuOpen(false);
                      showToast(isKhmer ? 'កំពុងទាញយករបាយការណ៍បុគ្គលិកឆ្នើម...' : 'Downloading Top Staff CSV...', 'info');
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-sky-950/30 text-left transition flex items-start gap-2.5 group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-200 group-hover:text-sky-300">
                        {isKhmer ? 'ទាញយកបុគ្គលិកឆ្នើម (.csv)' : 'Top Staff Leaderboard (.csv)'}
                      </p>
                      <p className="text-[10px] text-stone-400 leading-tight">
                        Cashier velocity, sales volume & audit
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={exportToCSV}
                    className="w-full p-2.5 rounded-xl hover:bg-stone-800 text-left transition flex items-start gap-2.5 group cursor-pointer border-t border-stone-800"
                  >
                    <div className="w-7 h-7 rounded-lg bg-stone-800 text-stone-300 flex items-center justify-center shrink-0 mt-0.5">
                      <FileDown className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-200 group-hover:text-stone-100">
                        {isKhmer ? 'ឯកសារ CSV ស្ដង់ដារ (.csv)' : 'Standard CSV File (.csv)'}
                      </p>
                      <p className="text-[10px] text-stone-400 leading-tight">
                        Universal UTF-8 CSV summary
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DATE SCOPE & FILTER CONTROLS */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-stone-950/70 border border-stone-800 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-stone-400 flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>{isKhmer ? 'កាលបរិច្ឆេទ:' : 'Date Scope:'}</span>
          </span>

          {[
            { id: 'today', label: isKhmer ? 'ថ្ងៃនេះ' : 'Today' },
            { id: 'yesterday', label: isKhmer ? 'ម្សិលមិញ' : 'Yesterday' },
            { id: 'week', label: isKhmer ? '៧ ថ្ងៃ' : '7 Days' },
            { id: 'month', label: isKhmer ? '៣០ ថ្ងៃ' : '30 Days' },
            { id: 'all', label: isKhmer ? 'ទាំងអស់' : 'All Time' }
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p.id)}
              className={`py-1 px-3 rounded-xl font-bold transition cursor-pointer ${
                filters.datePreset === p.id
                  ? 'bg-amber-600 text-stone-950 shadow-sm'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              {p.label}
            </button>
          ))}

          <div className="flex items-center gap-1.5 ml-1 bg-stone-900 px-2.5 py-1 rounded-xl border border-stone-800">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              className="bg-transparent text-stone-200 text-xs focus:outline-none"
            />
            <span className="text-stone-500 text-[10px]">→</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              className="bg-transparent text-stone-200 text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filters.cashier}
            onChange={(e) => setFilters(prev => ({ ...prev, cashier: e.target.value }))}
            className="bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1 text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">{isKhmer ? '👥 បុគ្គលិកទាំងអស់' : '👥 All Cashiers'}</option>
            <option value="Liam Vance">Liam Vance (Barista)</option>
            <option value="Sophia Bennett">Sophia Bennett (Manager)</option>
            <option value="Marcus Thorne">Marcus Thorne (Admin)</option>
            <option value="Chloe Chen">Chloe Chen (Cashier)</option>
          </select>

          {(filters.startDate || filters.endDate || filters.datePreset !== 'all' || filters.cashier !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 10-REPORT NUMBERED HORIZONTAL TAB SELECTOR (Only shown in Tabbed mode) */}
      {/* ========================================================================= */}
      {reportViewMode === 'tabbed' && (
        <div className="relative flex items-center group">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollTabs(-250)}
            className="flex absolute left-1 z-10 w-8 h-8 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-amber-400 items-center justify-center shadow-xl transition active:scale-95 cursor-pointer backdrop-blur-sm"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Horizontally Scrollable Tab Container */}
          <div 
            ref={tabsContainerRef}
            onWheel={(e) => {
              if (tabsContainerRef.current && e.deltaY !== 0) {
                tabsContainerRef.current.scrollLeft += e.deltaY;
              }
            }}
            className="flex-1 flex items-center gap-1.5 p-1.5 px-10 bg-stone-950/80 rounded-2xl border border-stone-800 overflow-x-auto text-xs scroll-smooth shadow-inner"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {REPORT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-active={isSelected ? "true" : undefined}
                  onClick={() => {
                    soundService.playBeepSound();
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer shrink-0 select-none ${
                    isSelected
                      ? 'bg-amber-600 text-stone-950 shadow-md font-extrabold ring-1 ring-amber-400'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollTabs(250)}
            className="flex absolute right-1 z-10 w-8 h-8 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-amber-400 items-center justify-center shadow-xl transition active:scale-95 cursor-pointer backdrop-blur-sm"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1-PAGE CONSOLIDATED REPORT (ACTIVE BY DEFAULT) OR EXECUTIVE OVERVIEW TAB */}
      {/* ========================================================================= */}
      {(reportViewMode === 'one-page' || activeTab === 'overview') && (
        <div className="space-y-5 animate-fade-in">
          
          {/* ======================================================================= */}
          {/* SECTION 1: EXECUTIVE FINANCIAL KPI MATRIX (៦ សូចនាករហិរញ្ញវត្ថុគន្លឹះ) */}
          {/* ======================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/30">1</span>
                <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKhmer ? 'សូចនាករហិរញ្ញវត្ថុចម្បង (Executive Financial KPIs)' : 'Executive Financial KPI Matrix'}</span>
                </h3>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">
                {isKhmer ? 'អត្រាប្តូរប្រាក់៖ 1 USD = 4,100 KHR' : 'FX Rate: $1.00 = 4,100 KHR'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* 1. Gross Sales */}
              <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-1 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {isKhmer ? 'ចំណូលដុល' : 'Gross Sales'}
                  </span>
                  <DollarSign className="w-3.5 h-3.5 text-stone-400" />
                </div>
                <p className="text-xl font-black text-stone-100 font-mono">
                  ${grossSales.toFixed(2)}
                </p>
                <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
                  <span className="truncate">៛{Math.round(grossSales * 4100).toLocaleString()}</span>
                  <span className="text-[9px] text-stone-500">{isKhmer ? 'មុនកាត់' : 'Pre-cut'}</span>
                </div>
              </div>

              {/* 2. Discounts Given */}
              <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-1 hover:border-rose-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                    {isKhmer ? 'បញ្ចុះតម្លៃ' : 'Discounts'}
                  </span>
                  <Gift className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <p className="text-xl font-black text-rose-400 font-mono">
                  -${totalDiscounts.toFixed(2)}
                </p>
                <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
                  <span className="truncate">៛{Math.round(totalDiscounts * 4100).toLocaleString()}</span>
                  <span className="text-[9px] text-rose-400">{isKhmer ? 'ប្រូម៉ូសិន' : 'Promo'}</span>
                </div>
              </div>

              {/* 3. Net Cleared Revenue */}
              <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-emerald-900/60 space-y-1 hover:border-emerald-500/60 transition shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {isKhmer ? 'ចំណូលសុទ្ធ' : 'Net Revenue'}
                  </span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-xl font-black text-emerald-400 font-mono">
                  ${netSales.toFixed(2)}
                </p>
                <div className="flex items-center justify-between text-[10px] text-emerald-500 font-mono">
                  <span className="truncate">៛{Math.round(netSales * 4100).toLocaleString()}</span>
                  <span className="text-[9px] px-1 py-0.2 bg-emerald-950 border border-emerald-800 rounded text-emerald-300 font-bold">
                    Cleared
                  </span>
                </div>
              </div>

              {/* 4. Total COGS */}
              <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-1 hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    {isKhmer ? 'ថ្លៃដើម COGS' : 'Cost of Goods'}
                  </span>
                  <Package className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="text-xl font-black text-amber-400 font-mono">
                  ${totalCOGS.toFixed(2)}
                </p>
                <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
                  <span className="truncate">៛{Math.round(totalCOGS * 4100).toLocaleString()}</span>
                  <span className="text-[9px] text-amber-400 font-bold">{overallCogsPercentage.toFixed(1)}%</span>
                </div>
              </div>

              {/* 5. Gross Profit */}
              <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-1 hover:border-purple-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    {isKhmer ? 'ចំណេញដុល' : 'Gross Profit'}
                  </span>
                  <Percent className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <p className="text-xl font-black text-stone-100 font-mono">
                  ${totalGrossProfit.toFixed(2)}
                </p>
                <div className="flex items-center justify-between text-[10px] text-purple-300 font-mono">
                  <span className="truncate">៛{Math.round(totalGrossProfit * 4100).toLocaleString()}</span>
                  <span className="text-[9px] text-stone-400">{(100 - overallCogsPercentage).toFixed(1)}%</span>
                </div>
              </div>

              {/* 6. Total Orders & Avg Check */}
              <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-1 hover:border-sky-500/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    {isKhmer ? 'កុម្ម៉ង់ & មធ្យម' : 'Tickets & Avg'}
                  </span>
                  <Receipt className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <p className="text-xl font-black text-stone-100 font-mono">
                  {customerCount} <span className="text-xs font-semibold text-stone-400">{isKhmer ? 'កុម្ម៉ង់' : 'tix'}</span>
                </p>
                <div className="flex items-center justify-between text-[10px] text-sky-400/90 font-mono">
                  <span>${avgSpend.toFixed(2)} / tix</span>
                  <span className="text-[9px] text-stone-500">៛{Math.round(avgSpend * 4100).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SECTION 2: PAYMENT TENDERS & FINANCIAL RECONCILIATION */}
          {/* ======================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/30">2</span>
                <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isKhmer ? 'ការផ្ទៀងផ្ទាត់ការទូទាត់ & តុល្យការហិរញ្ញវត្ថុ (Payment & Financial Reconciliation)' : 'Financial Balance & Payment Settlement'}</span>
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800 font-mono">
                {cashlessRate}% {isKhmer ? 'មិនប្រើសាច់ប្រាក់' : 'Cashless Adoption'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Payment Tender Settlement */}
              <div className="lg:col-span-6 p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-pink-400" />
                    <span>{isKhmer ? 'ចំណូលតាមវិធីសាស្ត្រទូទាត់ (Payment Methods Breakdown)' : 'Settlement by Payment Tender'}</span>
                  </h4>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Total: ${(cashTotal + khqrTotal + cardTotal).toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {/* Cash */}
                  <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <Banknote className="w-4 h-4" />
                        <span>{isKhmer ? 'សាច់ប្រាក់ (Cash Register)' : 'Physical Cash (USD & KHR)'}</span>
                      </span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-stone-100">${cashTotal.toFixed(2)}</span>
                        <span className="text-[10px] text-stone-500 font-mono ml-1.5">({cashPct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${cashPct}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                      <span>៛{Math.round(cashTotal * 4100).toLocaleString()}</span>
                      <span>{isKhmer ? 'រាប់ក្នុងថតប្រាក់' : 'In Register Drawer'}</span>
                    </div>
                  </div>

                  {/* Bakong KHQR */}
                  <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-pink-400">
                        <QrCode className="w-4 h-4" />
                        <span>{isKhmer ? 'បាគង KHQR (Bakong NBC QR)' : 'Bakong KHQR Instant Pay'}</span>
                      </span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-stone-100">${khqrTotal.toFixed(2)}</span>
                        <span className="text-[10px] text-stone-500 font-mono ml-1.5">({khqrPct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 rounded-full transition-all duration-500" style={{ width: `${khqrPct}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                      <span>៛{Math.round(khqrTotal * 4100).toLocaleString()}</span>
                      <span className="text-pink-400 font-semibold">{isKhmer ? 'ស្វ័យប្រវត្តិកុងធនាគារ' : 'Direct Bank Settled'}</span>
                    </div>
                  </div>

                  {/* Credit / Debit Card */}
                  <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-sky-400">
                        <CreditCard className="w-4 h-4" />
                        <span>{isKhmer ? 'កាតធនាគារ (Visa / Mastercard)' : 'Credit & Debit Cards'}</span>
                      </span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-stone-100">${cardTotal.toFixed(2)}</span>
                        <span className="text-[10px] text-stone-500 font-mono ml-1.5">({cardPct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${cardPct}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                      <span>៛{Math.round(cardTotal * 4100).toLocaleString()}</span>
                      <span>POS Terminal</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Executive Financial Balance Sheet */}
              <div className="lg:col-span-6 p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
                    <h4 className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      <span>{isKhmer ? 'តុល្យការហិរញ្ញវត្ថុផ្លូវការ (Financial Balance Ledger)' : 'Executive Financial Statement'}</span>
                    </h4>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {isKhmer ? 'បានផ្ទៀងផ្ទាត់' : 'Audited'}
                    </span>
                  </div>

                  <div className="divide-y divide-stone-800 text-xs">
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-stone-300 font-medium">{isKhmer ? 'ចំណូលលក់ដុល (Gross Sales Volume)' : 'Gross Sales Volume'}</span>
                      <span className="font-mono font-bold text-stone-100">+${grossSales.toFixed(2)}</span>
                    </div>
                    <div className="py-2 flex items-center justify-between text-rose-400">
                      <span>{isKhmer ? 'ការបញ្ចុះតម្លៃ & VIP (Discounts Deducted)' : 'Total Discounts Given'}</span>
                      <span className="font-mono font-bold">-${totalDiscounts.toFixed(2)}</span>
                    </div>
                    <div className="py-2 flex items-center justify-between text-stone-300">
                      <span>{isKhmer ? 'ពន្ធអាកររដ្ឋ (VAT 8% Sales Tax)' : 'Government Sales Tax (VAT 8%)'}</span>
                      <span className="font-mono font-bold text-stone-300">+${totalTax.toFixed(2)}</span>
                    </div>
                    <div className="py-2 flex items-center justify-between text-amber-400/90">
                      <span>{isKhmer ? 'ថ្លៃដើមវត្ថុធាតុដើម (COGS / Recipe Costs)' : 'Cost of Goods Sold (COGS)'}</span>
                      <span className="font-mono font-bold">-${totalCOGS.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t-2 border-stone-800">
                  <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-emerald-400 block">{isKhmer ? 'ចំណូលសុទ្ធបានទូទាត់' : 'Net Cleared Intake'}</span>
                      <span className="text-[9px] text-stone-400">{isKhmer ? 'សរុបសាច់ប្រាក់ & ឌីជីថល' : 'Cash + KHQR + Cards'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black font-mono text-emerald-400">${netSales.toFixed(2)}</span>
                      <span className="text-[10px] text-emerald-500 font-mono block">៛{Math.round(netSales * 4100).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-purple-300 block">{isKhmer ? 'ប្រាក់ចំណេញប្រតិបត្តិការដុល' : 'Gross Operating Profit'}</span>
                      <span className="text-[9px] text-stone-400">{isKhmer ? 'ចំណូលសុទ្ធ - ថ្លៃដើម COGS' : 'Net Revenue - Raw COGS'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black font-mono text-purple-300">${totalGrossProfit.toFixed(2)}</span>
                      <span className="text-[10px] text-purple-400 font-mono block">Margin: {(100 - overallCogsPercentage).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SECTION 3: HOURLY SALES VELOCITY & RUSH HOUR DEMAND */}
          {/* ======================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-sky-500/20 text-sky-400 font-black text-xs flex items-center justify-center border border-sky-500/30">3</span>
                <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isKhmer ? 'និន្នាការលក់តាមម៉ោង & ពេលវេលាមមាញឹក (Hourly Sales & Peak Demand)' : '24-Hour Velocity & Rush Hours'}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReportViewMode('tabbed');
                  setActiveTab('peak-hours');
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{isKhmer ? 'មើលផ្ទាំងម៉ោងលម្អិត' : 'View Rush Hours Tab'}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-stone-200">
                    {isKhmer ? 'ខ្សែកោងចំណូលលក់ ២៤ ម៉ោង (24-Hour Revenue Demand Curve)' : 'Hourly Revenue Velocity & Customer Footfall'}
                  </h4>
                  <p className="text-[10px] text-stone-500">
                    {isKhmer ? 'កំណត់ម៉ោងភ្ញៀវច្រើនដើម្បីត្រៀមបុគ្គលិក និងវត្ថុធាតុដើម' : 'Identify peak ordering windows to optimize barista scheduling'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    <span>{isKhmer ? 'ម៉ោងលក់ដាច់ខ្លាំង (Rush Hour)' : 'Peak Hours Monitored'}</span>
                  </span>
                </div>
              </div>

              <div className="h-48 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={peakHourData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGradOverviewStandard" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                    <XAxis dataKey="hour" stroke="#78716c" fontSize={10} tickLine={false} />
                    <YAxis stroke="#78716c" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val) => [`$${val}`, 'Sales']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGradOverviewStandard)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Peak Insights Quick Chips */}
              <div className="pt-2 border-t border-stone-850 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-stone-900/60 border border-stone-850">
                  <span className="text-[9px] text-stone-500 block uppercase font-bold">{isKhmer ? 'ម៉ោងភ្ញៀវច្រើន' : 'Busiest Window'}</span>
                  <span className="font-bold text-amber-400 font-mono">08:00 - 10:00</span>
                </div>
                <div className="p-2 rounded-xl bg-stone-900/60 border border-stone-850">
                  <span className="text-[9px] text-stone-500 block uppercase font-bold">{isKhmer ? 'ពេលរសៀល' : 'Afternoon Peak'}</span>
                  <span className="font-bold text-stone-300 font-mono">13:00 - 15:00</span>
                </div>
                <div className="p-2 rounded-xl bg-stone-900/60 border border-stone-850">
                  <span className="text-[9px] text-stone-500 block uppercase font-bold">{isKhmer ? 'បុគ្គលិកណែនាំ' : 'Suggested Staff'}</span>
                  <span className="font-bold text-emerald-400">3 - 4 Baristas</span>
                </div>
                <div className="p-2 rounded-xl bg-stone-900/60 border border-stone-850">
                  <span className="text-[9px] text-stone-500 block uppercase font-bold">{isKhmer ? 'កុម្ម៉ង់/ម៉ោង' : 'Peak Velocity'}</span>
                  <span className="font-bold text-sky-400 font-mono">~35 tix / hr</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SECTION 4: TOP MENU PRODUCTS PODIUM & PRODUCT PERFORMANCE */}
          {/* ======================================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/30">4</span>
                <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKhmer ? 'ចំណាត់ថ្នាក់ទំនិញលក់ដាច់ & មុខទំនិញទាំងអស់ (Top Products & Performance)' : 'Top Selling Products & Menu Performance'}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReportViewMode('tabbed');
                  setActiveTab('products');
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{isKhmer ? 'ផ្ទាំងលម្អិតមុខទំនិញ' : 'View Products Tab'}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {/* Subsection 4A: Top 3 Best Sellers Podium */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1st Gold */}
              {filteredProducts[0] && (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/40 via-stone-950/70 to-stone-950/90 border-2 border-amber-500/60 shadow-xl relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>#1 {isKhmer ? 'លក់ដាច់បំផុត (មាស)' : 'Top Seller (Gold)'}</span>
                    </span>
                    <span className="text-xl">🥇</span>
                  </div>
                  <div className="mt-3">
                    <h5 className="text-base font-black text-stone-100 group-hover:text-amber-300 transition truncate">{filteredProducts[0].name}</h5>
                    <p className="text-[11px] text-stone-400">{filteredProducts[0].category}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-stone-800/80 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'កែវ' : 'Units'}</span>
                      <p className="text-sm font-black text-amber-400 font-mono">{filteredProducts[0].unitsSold || 0}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ចំណូល' : 'Revenue'}</span>
                      <p className="text-sm font-black text-stone-200 font-mono">${(filteredProducts[0].revenue || ((filteredProducts[0].retailPrice || 0) * (filteredProducts[0].unitsSold || 0))).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ចំណេញ' : 'Profit'}</span>
                      <p className="text-sm font-black text-emerald-400 font-mono">${(filteredProducts[0].grossProfit || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2nd Silver */}
              {filteredProducts[1] && (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-stone-850/50 via-stone-950/70 to-stone-950/90 border border-stone-700/80 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-700/40 text-stone-300 border border-stone-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-stone-300" />
                      <span>#2 {isKhmer ? 'ចំណាត់ថ្នាក់ទី២ (ប្រាក់)' : 'Runner Up (Silver)'}</span>
                    </span>
                    <span className="text-xl">🥈</span>
                  </div>
                  <div className="mt-3">
                    <h5 className="text-base font-black text-stone-200 group-hover:text-stone-100 transition truncate">{filteredProducts[1].name}</h5>
                    <p className="text-[11px] text-stone-400">{filteredProducts[1].category}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-stone-800/80 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'កែវ' : 'Units'}</span>
                      <p className="text-sm font-black text-stone-200 font-mono">{filteredProducts[1].unitsSold || 0}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ចំណូល' : 'Revenue'}</span>
                      <p className="text-sm font-black text-stone-200 font-mono">${(filteredProducts[1].revenue || ((filteredProducts[1].retailPrice || 0) * (filteredProducts[1].unitsSold || 0))).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ភាគរយ' : 'Margin'}</span>
                      <p className="text-sm font-black text-emerald-400 font-mono">{filteredProducts[1].profitMarginPct || 70}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Bronze */}
              {filteredProducts[2] && (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/20 via-stone-950/70 to-stone-950/90 border border-amber-800/40 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-900/20 text-amber-400 border border-amber-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>#3 {isKhmer ? 'ចំណាត់ថ្នាក់ទី៣ (សំរឹទ្ធ)' : 'Third Place (Bronze)'}</span>
                    </span>
                    <span className="text-xl">🥉</span>
                  </div>
                  <div className="mt-3">
                    <h5 className="text-base font-black text-stone-200 group-hover:text-amber-200 transition truncate">{filteredProducts[2].name}</h5>
                    <p className="text-[11px] text-stone-400">{filteredProducts[2].category}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-stone-800/80 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'កែវ' : 'Units'}</span>
                      <p className="text-sm font-black text-stone-200 font-mono">{filteredProducts[2].unitsSold || 0}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ចំណូល' : 'Revenue'}</span>
                      <p className="text-sm font-black text-stone-200 font-mono">${(filteredProducts[2].revenue || ((filteredProducts[2].retailPrice || 0) * (filteredProducts[2].unitsSold || 0))).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ភាគរយ' : 'Margin'}</span>
                      <p className="text-sm font-black text-emerald-400 font-mono">{filteredProducts[2].profitMarginPct || 70}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Subsection 4B: Category Contribution Mix Chips */}
            {categoryStats.length > 0 && (
              <div className="p-3 rounded-2xl bg-stone-950/70 border border-stone-800 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-stone-400 flex items-center gap-1 mr-1">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isKhmer ? 'ចំណែកតាមក្រុម:' : 'Category Mix:'}</span>
                </span>
                {categoryStats.slice(0, 5).map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <span className="font-bold text-stone-200">{cat.name}</span>
                    <span className="text-stone-400 font-mono">${cat.revenue.toFixed(0)}</span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">({cat.sharePct}%)</span>
                  </div>
                ))}
              </div>
            )}

            {/* Subsection 4C: Complete Menu Products Performance Table */}
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold text-stone-200">
                    {isKhmer 
                      ? `តារាងមុខទំនិញលក់ទាំងអស់ (${overviewProducts.length} មុខ)` 
                      : `All Menu Products & Performance (${overviewProducts.length} Items)`}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                    {isKhmer ? 'បញ្ជីពេញលេញ' : 'List All'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      placeholder={isKhmer ? 'ស្វែងរកមុខទំនិញ...' : 'Filter products...'}
                      value={overviewProductSearch}
                      onChange={(e) => setOverviewProductSearch(e.target.value)}
                      className="bg-stone-900 border border-stone-800 rounded-xl pl-7 pr-2.5 py-1 text-[11px] text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 w-32 sm:w-44"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setOverviewProductsLimit(prev => prev >= 1000 ? 5 : 1000)}
                    className="px-2.5 py-1 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-amber-400 text-[11px] font-bold cursor-pointer transition whitespace-nowrap"
                  >
                    {overviewProductsLimit >= 1000 ? (isKhmer ? 'ទាំងអស់ ✓' : 'All Items ✓') : (isKhmer ? 'បង្ហាញទាំងអស់' : 'Show All')}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[380px] overflow-y-auto rounded-xl border border-stone-850/80">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-stone-900/95 backdrop-blur z-10 border-b border-stone-800 text-stone-400 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2.5 px-3"># Rank</th>
                      <th className="py-2.5 px-3">{isKhmer ? 'ឈ្មោះទំនិញ' : 'Item Name'}</th>
                      <th className="py-2.5 px-3">{isKhmer ? 'ប្រភេទ' : 'Category'}</th>
                      <th className="py-2.5 px-3 text-right">{isKhmer ? 'តម្លៃរាយ' : 'Price'}</th>
                      <th className="py-2.5 px-3 text-center">{isKhmer ? 'ចំនួនលក់' : 'Units'}</th>
                      <th className="py-2.5 px-3 text-right">{isKhmer ? 'ចំណូលសរុប' : 'Revenue ($)'}</th>
                      <th className="py-2.5 px-3 text-right">{isKhmer ? 'ចំណូល (៛)' : 'Revenue (KHR)'}</th>
                      <th className="py-2.5 px-3 text-right">{isKhmer ? 'ចំណេញ' : 'Margin'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-medium">
                    {overviewProducts.slice(0, overviewProductsLimit).map((p, idx) => {
                      const price = p.retailPrice || p.unitPrice || 0;
                      const units = p.unitsSold || 0;
                      const rev = p.revenue || (price * units);
                      const margin = p.profitMarginPct || p.marginPercentage || 70;
                      return (
                        <tr key={idx} className="hover:bg-stone-900/60 transition">
                          <td className="py-2 px-3 text-stone-500 font-mono text-[11px]">
                            {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : (idx + 1)}
                          </td>
                          <td className="py-2 px-3 font-bold text-stone-200">{p.name}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-400 text-[10px]">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-stone-400 text-[11px]">${price.toFixed(2)}</td>
                          <td className="py-2 px-3 text-center font-bold text-amber-400 font-mono">{units}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-stone-100">${rev.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-mono text-stone-400 text-[11px]">៛{Math.round(rev * 4100).toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 text-[10px] font-bold border border-emerald-800/60">
                              {margin}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-400 px-1 pt-1">
                <span>
                  {isKhmer 
                    ? `បង្ហាញ ${Math.min(overviewProductsLimit, overviewProducts.length)} នៃ ${overviewProducts.length} មុខទំនិញ` 
                    : `Showing ${Math.min(overviewProductsLimit, overviewProducts.length)} of ${overviewProducts.length} items`}
                </span>
                <button
                  type="button"
                  onClick={() => setOverviewProductsLimit(prev => prev >= 1000 ? 5 : 1000)}
                  className="text-amber-400 hover:text-amber-300 font-bold text-[11px] cursor-pointer"
                >
                  {overviewProductsLimit >= 1000 ? (isKhmer ? 'បង្រួមត្រឹម ៥' : 'Show Top 5 Only') : (isKhmer ? 'បង្ហាញទាំងអស់' : 'Show All Items')}
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SECTION 5: STAFF PRODUCTIVITY & CASHIER SHIFT RECONCILIATION */}
          {/* ======================================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-purple-500/20 text-purple-400 font-black text-xs flex items-center justify-center border border-purple-500/30">5</span>
                <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>{isKhmer ? 'សវនកម្មបុគ្គលិក & វេនបម្រើការងារ (Staff Productivity & Shift Audit)' : 'Staff Velocity & Cashier Shift Audit'}</span>
                </h3>
              </div>
              <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800 font-bold">
                Store Labor: {reportData?.storeLaborCostPercentage || 24.5}%
              </span>
            </div>

            {/* Subsection 5A: Top Staff Champions Podium */}
            {staffPerformance.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* #1 MVP Sales */}
                {(() => {
                  const mvp = [...staffPerformance].sort((a, b) => (b.salesGenerated || 0) - (a.salesGenerated || 0))[0];
                  return mvp ? (
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/40 via-stone-950/70 to-stone-950/90 border-2 border-amber-500/60 shadow-xl relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>🏆 {isKhmer ? 'បុគ្គលិកឆ្នើមផ្នែកលក់ (MVP)' : 'MVP Sales Champion'}</span>
                        </span>
                        <span className="text-xl">🥇</span>
                      </div>
                      <div className="mt-3">
                        <h5 className="text-base font-black text-stone-100 group-hover:text-amber-300 transition truncate">{mvp.name}</h5>
                        <p className="text-[11px] text-amber-400 font-semibold">{mvp.role}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-stone-800/80 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ចំណូល' : 'Sales'}</span>
                          <p className="text-sm font-black text-emerald-400 font-mono">${(mvp.salesGenerated || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'រៀល' : 'KHR'}</span>
                          <p className="text-xs font-bold text-stone-300 font-mono truncate">៛{Math.round((mvp.salesGenerated || 0) * 4100).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'កុម្ម៉ង់' : 'Tickets'}</span>
                          <p className="text-sm font-black text-amber-400 font-mono">{mvp.ticketsHandled || 0}</p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Speed Master */}
                {(() => {
                  const speed = [...staffPerformance].sort((a, b) => (b.ticketsHandled || 0) - (a.ticketsHandled || 0))[0];
                  return speed ? (
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-sky-950/40 via-stone-950/70 to-stone-950/90 border border-sky-500/40 shadow-lg relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-sky-400" />
                          <span>⚡ {isKhmer ? 'ល្បឿនលឿន' : 'Speed Master'}</span>
                        </span>
                        <span className="text-xl">🏃</span>
                      </div>
                      <div className="mt-3">
                        <h5 className="text-base font-black text-stone-200 group-hover:text-sky-300 transition truncate">{speed.name}</h5>
                        <p className="text-[11px] text-sky-400 font-semibold">{speed.role}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-stone-800/80 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'វិក្កយបត្រ' : 'Tickets'}</span>
                          <p className="text-sm font-black text-sky-400 font-mono">{speed.ticketsHandled || 0}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ចំណូល' : 'Sales'}</span>
                          <p className="text-sm font-black text-stone-200 font-mono">${(speed.salesGenerated || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'មធ្យម' : 'Avg/Order'}</span>
                          <p className="text-sm font-black text-amber-400 font-mono">${(speed.avgTicketValue || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Upsell Champion */}
                {(() => {
                  const upsell = [...staffPerformance].sort((a, b) => (b.avgTicketValue || 0) - (a.avgTicketValue || 0))[0];
                  return upsell ? (
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/40 via-stone-950/70 to-stone-950/90 border border-purple-500/40 shadow-lg relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span>💎 {isKhmer ? 'ពូកែណែនាំទំនិញ' : 'Upsell Guru'}</span>
                        </span>
                        <span className="text-xl">📈</span>
                      </div>
                      <div className="mt-3">
                        <h5 className="text-base font-black text-stone-200 group-hover:text-purple-300 transition truncate">{upsell.name}</h5>
                        <p className="text-[11px] text-purple-400 font-semibold">{upsell.role}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-stone-800/80 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'មធ្យម' : 'Avg Ticket'}</span>
                          <p className="text-sm font-black text-purple-400 font-mono">${(upsell.avgTicketValue || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ម៉ោង' : 'Hours'}</span>
                          <p className="text-xs font-black text-stone-200 font-mono">{upsell.hoursWorked || 0}h</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'លុប' : 'Voids'}</span>
                          <p className={`text-xs font-black font-mono ${(upsell.voidCount || 0) > 2 ? 'text-rose-400' : 'text-emerald-400'}`}>{upsell.voidCount || 0}</p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Subsection 5B: Recent Cashier Shifts Audit Table */}
            {shifts && shifts.length > 0 && (
              <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>{isKhmer ? 'សវនកម្មវេនការងារ & ភាពលម្អៀងសាច់ប្រាក់ (Cashier Shift & Drawer Audit)' : 'Cashier Shifts & Cash Drawer Variance'}</span>
                  </h4>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {shifts.length} {isKhmer ? 'វេន' : 'Shifts Logged'}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-stone-850">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-900/90 text-stone-400 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="py-2 px-3">Shift ID</th>
                        <th className="py-2 px-3">{isKhmer ? 'បេឡាករ' : 'Cashier'}</th>
                        <th className="py-2 px-3">{isKhmer ? 'ម៉ោងបើក / បិទ' : 'Open / Close'}</th>
                        <th className="py-2 px-3 text-right">{isKhmer ? 'ប្រាក់ដើម' : 'Start Float'}</th>
                        <th className="py-2 px-3 text-right">{isKhmer ? 'រំពឹងទុក' : 'Expected'}</th>
                        <th className="py-2 px-3 text-right">{isKhmer ? 'ជាក់ស្តែង' : 'Actual'}</th>
                        <th className="py-2 px-3 text-right">{isKhmer ? 'លម្អៀង' : 'Variance'}</th>
                        <th className="py-2 px-3 text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850 font-medium">
                      {shifts.slice(0, 5).map((sh, idx) => {
                        const variance = (sh.actualCash && sh.expectedCash) ? (sh.actualCash - sh.expectedCash) : 0;
                        return (
                          <tr key={idx} className="hover:bg-stone-900/50 transition">
                            <td className="py-2 px-3 font-mono font-bold text-amber-400">{sh.id}</td>
                            <td className="py-2 px-3 text-stone-200 font-semibold">{sh.cashierName || 'Liam Vance'}</td>
                            <td className="py-2 px-3 text-stone-400 text-[11px]">
                              {sh.openedAt ? new Date(sh.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'} - {sh.closedAt ? new Date(sh.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-stone-400">${(sh.startingFloat || 0).toFixed(2)}</td>
                            <td className="py-2 px-3 text-right font-mono text-stone-300">${(sh.expectedCash || 0).toFixed(2)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-stone-100">${(sh.actualCash || sh.expectedCash || 0).toFixed(2)}</td>
                            <td className="py-2 px-3 text-right font-mono">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                Math.abs(variance) < 0.01 ? 'bg-emerald-950 text-emerald-400' :
                                variance > 0 ? 'bg-sky-950 text-sky-400' : 'bg-rose-950 text-rose-400'
                              }`}>
                                {variance >= 0 ? `+$${variance.toFixed(2)}` : `-$${Math.abs(variance).toFixed(2)}`}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sh.status === 'CLOSED' ? 'bg-stone-800 text-stone-300' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              }`}>
                                {sh.status || 'CLOSED'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* SECTION 6: COMPLETE ORDERS & TRANSACTIONS AUDIT LEDGER */}
          {/* ======================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/30">6</span>
                <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isKhmer ? 'សវនកម្មប្រតិបត្តិការ & វិក្កយបត្រលក់លម្អិត (Orders & Transaction Audit)' : 'Complete Orders & Transaction Audit Ledger'}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReportViewMode('tabbed');
                  setActiveTab('sales');
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{isKhmer ? 'មើលផ្ទាំងលម្អិតការលក់' : 'View Sales Ledger Tab'}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="text-xs font-bold text-stone-200">
                    {isKhmer 
                      ? `បញ្ជីវិក្កយបត្រទាំងអស់ (${filteredOrders.length} វិក្កយបត្រ)` 
                      : `All Orders & Guest Transactions (${filteredOrders.length} Orders)`}
                  </h4>
                  <p className="text-[10px] text-stone-500">
                    {isKhmer 
                      ? 'ពិនិត្យមើលគ្រប់ការបញ្ជាទិញ វិធីសាស្ត្រទូទាត់ និងទឹកប្រាក់លម្អិតតាមពេលវេលាជាក់ស្ដែង' 
                      : 'Audit every transaction, tender type, cashier, and order breakdown in real-time'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      placeholder={isKhmer ? 'ស្វែងរកវិក្កយបត្រ, ភ្ញៀវ...' : 'Search receipt ID, guest...'}
                      value={salesSearch}
                      onChange={(e) => setSalesSearch(e.target.value)}
                      className="bg-stone-900 border border-stone-800 rounded-xl pl-7 pr-2.5 py-1 text-[11px] text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 w-36 sm:w-48"
                    />
                  </div>

                  {/* Payment filter */}
                  <select
                    value={salesPaymentFilter}
                    onChange={(e) => setSalesPaymentFilter(e.target.value)}
                    className="bg-stone-900 border border-stone-800 rounded-xl px-2 py-1 text-[11px] text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="ALL">{isKhmer ? 'គ្រប់ការទូទាត់' : 'All Payments'}</option>
                    <option value="CASH">Cash</option>
                    <option value="KHQR">Bakong KHQR</option>
                    <option value="CARD">Card</option>
                  </select>

                  {/* Toggle Show All / 15 */}
                  <button
                    type="button"
                    onClick={() => setOverviewOrdersLimit(prev => prev >= 1000 ? 15 : 1000)}
                    className="px-2.5 py-1 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-amber-400 text-[11px] font-bold cursor-pointer transition whitespace-nowrap"
                  >
                    {overviewOrdersLimit >= 1000 ? (isKhmer ? 'ទាំងអស់ ✓' : 'All Orders ✓') : (isKhmer ? 'បង្ហាញទាំងអស់' : 'Show All')}
                  </button>
                </div>
              </div>

              {/* Orders Table */}
              <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-stone-850/80">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-stone-900/95 backdrop-blur z-10 border-b border-stone-800 text-stone-400 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Receipt #</th>
                      <th className="py-2.5 px-3">{isKhmer ? 'ភ្ញៀវ' : 'Customer'}</th>
                      <th className="py-2.5 px-3">{isKhmer ? 'បុគ្គលិក' : 'Cashier'}</th>
                      <th className="py-2.5 px-3">{isKhmer ? 'ប្រភេទ' : 'Type'}</th>
                      <th className="py-2.5 px-3">{isKhmer ? 'មុខទំនិញ' : 'Items'}</th>
                      <th className="py-2.5 px-3">{isKhmer ? 'ទូទាត់' : 'Payment'}</th>
                      <th className="py-2.5 px-3 text-right">{isKhmer ? 'សរុប ($)' : 'Total ($)'}</th>
                      <th className="py-2.5 px-3 text-right">{isKhmer ? 'សរុប (៛)' : 'Total (KHR)'}</th>
                      <th className="py-2.5 px-3 text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-medium">
                    {filteredOrders.slice(0, overviewOrdersLimit).map((o, idx) => {
                      const payMethod = o.paymentMethod === 'QR_CODE' ? 'KHQR' : (o.paymentMethod || 'CASH');
                      return (
                        <tr key={idx} className="hover:bg-stone-900/60 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{o.id}</td>
                          <td className="py-2.5 px-3 text-stone-200">{o.customerName || 'Walk-in Guest'}</td>
                          <td className="py-2.5 px-3 text-stone-400 text-[11px]">{o.cashierName || 'Liam Vance'}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-[10px] text-stone-300 font-bold">
                              {o.orderType || 'DINE_IN'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-stone-300 max-w-[220px] truncate">
                            {(o.items || []).map(it => `${it.productName || it.name} x${it.quantity}`).join(', ')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              payMethod === 'CASH' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                              payMethod === 'KHQR' ? 'bg-pink-950 text-pink-400 border-pink-800' :
                              'bg-sky-950 text-sky-400 border-sky-800'
                            }`}>
                              {payMethod}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-100">${(o.total || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-stone-400 text-[11px]">៛{Math.round((o.total || 0) * 4100).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                              PAID
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-400 px-1 pt-1">
                <span>
                  {isKhmer 
                    ? `បង្ហាញ ${Math.min(overviewOrdersLimit, filteredOrders.length)} នៃ ${filteredOrders.length} វិក្កយបត្រ` 
                    : `Showing ${Math.min(overviewOrdersLimit, filteredOrders.length)} of ${filteredOrders.length} orders`}
                </span>
                <button
                  type="button"
                  onClick={() => setOverviewOrdersLimit(prev => prev >= 1000 ? 15 : 1000)}
                  className="text-amber-400 hover:text-amber-300 font-bold text-[11px] cursor-pointer"
                >
                  {overviewOrdersLimit >= 1000 ? (isKhmer ? 'បង្រួមត្រឹម ១៥' : 'Show Top 15 Only') : (isKhmer ? 'បង្ហាញទាំងអស់' : 'Show All Orders')}
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SECTION 7: INVENTORY WATCHLIST & LOW STOCK ALERTS */}
          {/* ======================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-rose-500/20 text-rose-400 font-black text-xs flex items-center justify-center border border-rose-500/30">7</span>
                <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-rose-400" />
                  <span>{isKhmer ? 'ការត្រួតពិនិត្យស្តុក & វត្ថុធាតុដើមជិតអស់ (Inventory & Stock Watchlist)' : 'Inventory Depletion & Reorder Watchlist'}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReportViewMode('tabbed');
                  setActiveTab('inventory');
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{isKhmer ? 'ផ្ទាំងស្តុកទំនិញ' : 'View Inventory Tab'}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {lowStockIngredients.length > 0 ? (
              <div className="p-4 rounded-2xl bg-stone-950/70 border border-rose-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-rose-300">
                      {isKhmer ? `មានវត្ថុធាតុដើម ${lowStockIngredients.length} មុខជិតអស់ពីស្តុក (ត្រូវបញ្ជាទិញបន្ថែម)` : `${lowStockIngredients.length} Raw Materials Low on Stock (Reorder Needed)`}
                    </span>
                  </div>
                  <span className="text-[10px] text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800 font-bold">
                    Action Required
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {lowStockIngredients.slice(0, 6).map((ing, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-stone-200">{ing.name}</h5>
                        <p className="text-[10px] text-stone-500 font-mono">
                          {isKhmer ? 'ស្តុកបច្ចុប្បន្ន' : 'In Stock'}: <span className="text-rose-400 font-bold">{ing.stock} {ing.unit}</span> (Min: {ing.minThreshold || 5})
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-800 text-[10px] font-bold">
                        {isKhmer ? 'ជិតអស់' : 'Low Stock'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-emerald-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-300">
                    {isKhmer ? 'ស្តុកវត្ថុធាតុដើមមានសុវត្ថិភាព ១០០% - គ្មានវត្ថុធាតុដើមខ្វះខាតក្នុងប្រតិបត្តិការទេ' : 'Raw inventory is 100% optimal - No critical shortages detected'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                  Optimal
                </span>
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* SECTION 8: EXECUTIVE SUMMARY SIGN-OFF & QUICK ACTIONS FOOTER */}
          {/* ======================================================================= */}
          <div className="p-4 rounded-2xl bg-stone-950/90 border border-stone-800 flex flex-wrap items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <div>
                <span className="text-xs font-bold text-stone-200 block">
                  {isKhmer ? 'របាយការណ៍អាជីវកម្មសង្ខេប ១ទំព័រពេញលេញ (1-Page Consolidated Executive Report)' : 'Consolidated 1-Page Coffee Shop Executive Business Report'}
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  {isKhmer ? `សវនកម្មដោយ៖ ${user?.name || 'Manager'} • ម៉ោង៖ ${new Date().toLocaleTimeString()}` : `Audited by: ${user?.name || 'Manager'} • Time: ${new Date().toLocaleTimeString()}`}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundService.playBeepSound();
                  setIsPrintPreviewOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-cyan-500 text-cyan-400 font-bold text-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'បោះពុម្ព ១ទំព័រ A4' : 'Print 1-Page A4'}</span>
              </button>

              <button
                type="button"
                onClick={() => exportToExcel('all')}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold text-xs transition cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'នាំចេញ Excel (.xlsx)' : 'Download Excel (.xlsx)'}</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 2: SALES & DAILY ORDERS AUDIT LEDGER */}
      {/* ========================================================================= */}
      {reportViewMode === 'tabbed' && activeTab === 'sales' && (
        <div className="space-y-4 animate-fade-in">
          {/* Sales Ledger Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800">
              <span className="text-[10px] font-bold text-stone-400 uppercase">{isKhmer ? 'ចំណូលដុល' : 'Gross Sales'}</span>
              <p className="text-xl font-bold font-mono text-stone-100">${grossSales.toFixed(2)}</p>
              <span className="text-[10px] text-stone-500 font-mono">៛{Math.round(grossSales * 4100).toLocaleString()}</span>
            </div>
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800">
              <span className="text-[10px] font-bold text-rose-400 uppercase">{isKhmer ? 'បញ្ចុះតម្លៃ' : 'Discounts'}</span>
              <p className="text-xl font-bold font-mono text-rose-400">-${totalDiscounts.toFixed(2)}</p>
              <span className="text-[10px] text-stone-500 font-mono">៛{Math.round(totalDiscounts * 4100).toLocaleString()}</span>
            </div>
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800">
              <span className="text-[10px] font-bold text-amber-400 uppercase">{isKhmer ? 'ពន្ធអាករ (8%)' : 'Tax (VAT 8%)'}</span>
              <p className="text-xl font-bold font-mono text-amber-400">${totalTax.toFixed(2)}</p>
              <span className="text-[10px] text-stone-500 font-mono">៛{Math.round(totalTax * 4100).toLocaleString()}</span>
            </div>
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-emerald-900/60">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">{isKhmer ? 'ចំណូលសុទ្ធ' : 'Net Sales'}</span>
              <p className="text-xl font-bold font-mono text-emerald-400">${netSales.toFixed(2)}</p>
              <span className="text-[10px] text-emerald-500 font-mono">៛{Math.round(netSales * 4100).toLocaleString()}</span>
            </div>
          </div>

          {/* Search & Filter Bar for Orders */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-stone-950/70 border border-stone-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder={isKhmer ? 'ស្វែងរកតាមលេខវិក្កយបត្រ, ភ្ញៀវ ឬបុគ្គលិក...' : 'Search receipt ID, guest, or cashier...'}
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-400 font-bold">{isKhmer ? 'វិធីសាស្ត្រទូទាត់:' : 'Payment:'}</span>
              <select
                value={salesPaymentFilter}
                onChange={(e) => setSalesPaymentFilter(e.target.value)}
                className="bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">{isKhmer ? 'ទាំងអស់ (All)' : 'All Payments'}</option>
                <option value="CASH">{isKhmer ? 'សាច់ប្រាក់ (Cash)' : 'Cash'}</option>
                <option value="KHQR">{isKhmer ? 'បាគង KHQR' : 'Bakong KHQR'}</option>
                <option value="CARD">{isKhmer ? 'កាតធនាគារ (Card)' : 'Card'}</option>
              </select>
            </div>
          </div>

          {/* Orders Audit Ledger Table */}
          <div className="rounded-2xl bg-stone-950/70 border border-stone-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 text-[10px] uppercase font-bold bg-stone-900/50">
                    <th className="py-2.5 px-3">Receipt #</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'ភ្ញៀវ' : 'Customer'}</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'បុគ្គលិក' : 'Cashier'}</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'ប្រភេទ' : 'Type'}</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'មុខទំនិញ' : 'Items'}</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'ទូទាត់' : 'Payment'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'សរុប ($)' : 'Total ($)'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'សរុប (៛)' : 'Total (KHR)'}</th>
                    <th className="py-2.5 px-3 text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-medium">
                  {filteredOrders.slice(0, ordersPageLimit).map((o, idx) => {
                    const payMethod = o.paymentMethod === 'QR_CODE' ? 'KHQR' : (o.paymentMethod || 'CASH');
                    return (
                      <tr key={idx} className="hover:bg-stone-900/60 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{o.id}</td>
                        <td className="py-2.5 px-3 text-stone-200">{o.customerName || 'Walk-in Guest'}</td>
                        <td className="py-2.5 px-3 text-stone-400 text-[11px]">{o.cashierName || 'Liam Vance'}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-[10px] text-stone-300 font-bold">
                            {o.orderType || 'DINE_IN'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-stone-300 max-w-[200px] truncate">
                          {(o.items || []).map(it => `${it.productName || it.name} x${it.quantity}`).join(', ')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            payMethod === 'CASH' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                            payMethod === 'KHQR' ? 'bg-pink-950 text-pink-400 border-pink-800' :
                            'bg-sky-950 text-sky-400 border-sky-800'
                          }`}>
                            {payMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-100">${(o.total || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-400">៛{Math.round((o.total || 0) * 4100).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                            PAID
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
              <span>
                {isKhmer 
                  ? `បង្ហាញ ${Math.min(ordersPageLimit, filteredOrders.length)} នៃ ${filteredOrders.length} វិក្កយបត្រ` 
                  : `Showing ${Math.min(ordersPageLimit, filteredOrders.length)} of ${filteredOrders.length} orders`}
              </span>
              <button
                type="button"
                onClick={() => setOrdersPageLimit(prev => prev >= 1000 ? 15 : 1000)}
                className="px-3 py-1 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold cursor-pointer transition border border-stone-800"
              >
                {ordersPageLimit >= 1000 ? (isKhmer ? 'បង្រួមត្រឹម ១៥' : 'Show Top 15 Only') : (isKhmer ? 'បង្ហាញទាំងអស់' : 'Show All Orders')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 3: PRODUCT SALES & MENU MIX */}
      {/* ========================================================================= */}
      {reportViewMode === 'tabbed' && activeTab === 'products' && (
        <div className="space-y-4 animate-fade-in">
          {/* Top Product Leaderboard Podium (Top 3) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1st Place - Gold */}
            {filteredProducts[0] && (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/40 via-stone-950/70 to-stone-950/90 border-2 border-amber-500/60 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>#1 {isKhmer ? 'លក់ដាច់បំផុត (មាស)' : 'Top Seller (Gold)'}</span>
                  </span>
                  <span className="text-xl">🥇</span>
                </div>
                <div className="mt-3">
                  <h4 className="text-base font-black text-stone-100 group-hover:text-amber-300 transition truncate">{filteredProducts[0].name}</h4>
                  <p className="text-[11px] text-stone-400">{filteredProducts[0].category}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-stone-800/80 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'កែវ' : 'Units'}</span>
                    <p className="text-sm font-black text-amber-400 font-mono">{filteredProducts[0].unitsSold || 0}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ចំណូល' : 'Revenue'}</span>
                    <p className="text-sm font-black text-stone-200 font-mono">${(filteredProducts[0].revenue || ((filteredProducts[0].retailPrice || 0) * (filteredProducts[0].unitsSold || 0))).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ចំណេញ' : 'Profit'}</span>
                    <p className="text-sm font-black text-emerald-400 font-mono">${(filteredProducts[0].grossProfit || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2nd Place - Silver */}
            {filteredProducts[1] && (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-stone-850/50 via-stone-950/70 to-stone-950/90 border border-stone-700/80 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-stone-700/40 text-stone-300 border border-stone-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-stone-300" />
                    <span>#2 {isKhmer ? 'ចំណាត់ថ្នាក់ទី២ (ប្រាក់)' : 'Runner Up (Silver)'}</span>
                  </span>
                  <span className="text-xl">🥈</span>
                </div>
                <div className="mt-3">
                  <h4 className="text-base font-black text-stone-200 group-hover:text-stone-100 transition truncate">{filteredProducts[1].name}</h4>
                  <p className="text-[11px] text-stone-400">{filteredProducts[1].category}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-stone-800/80 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'កែវ' : 'Units'}</span>
                    <p className="text-sm font-black text-stone-200 font-mono">{filteredProducts[1].unitsSold || 0}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ចំណូល' : 'Revenue'}</span>
                    <p className="text-sm font-black text-stone-200 font-mono">${(filteredProducts[1].revenue || ((filteredProducts[1].retailPrice || 0) * (filteredProducts[1].unitsSold || 0))).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ភាគរយ' : 'Margin'}</span>
                    <p className="text-sm font-black text-emerald-400 font-mono">{filteredProducts[1].profitMarginPct || 70}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place - Bronze */}
            {filteredProducts[2] && (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/20 via-stone-950/70 to-stone-950/90 border border-amber-800/40 shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-900/20 text-amber-400 border border-amber-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>#3 {isKhmer ? 'ចំណាត់ថ្នាក់ទី៣ (សំរឹទ្ធ)' : 'Third Place (Bronze)'}</span>
                  </span>
                  <span className="text-xl">🥉</span>
                </div>
                <div className="mt-3">
                  <h4 className="text-base font-black text-stone-200 group-hover:text-amber-200 transition truncate">{filteredProducts[2].name}</h4>
                  <p className="text-[11px] text-stone-400">{filteredProducts[2].category}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-stone-800/80 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'កែវ' : 'Units'}</span>
                    <p className="text-sm font-black text-stone-200 font-mono">{filteredProducts[2].unitsSold || 0}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ចំណូល' : 'Revenue'}</span>
                    <p className="text-sm font-black text-stone-200 font-mono">${(filteredProducts[2].revenue || ((filteredProducts[2].retailPrice || 0) * (filteredProducts[2].unitsSold || 0))).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ភាគរយ' : 'Margin'}</span>
                    <p className="text-sm font-black text-emerald-400 font-mono">{filteredProducts[2].profitMarginPct || 70}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-stone-950/70 border border-stone-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder={isKhmer ? 'ស្វែងរកទំនិញ ឬប្រភេទ...' : 'Search item or category...'}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">{isKhmer ? 'គ្រប់ប្រភេទ (All Categories)' : 'All Categories'}</option>
                {(categories || []).map((c, idx) => {
                  const cName = typeof c === 'string' ? c : (c.name || c.id);
                  return <option key={idx} value={cName}>{cName}</option>;
                })}
              </select>

              <select
                value={productSort}
                onChange={(e) => setProductSort(e.target.value)}
                className="bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="units">{isKhmer ? 'ចំនួនលក់ (Units)' : 'Units Sold'}</option>
                <option value="revenue">{isKhmer ? 'ចំណូលសរុប (Revenue)' : 'Revenue'}</option>
                <option value="margin">{isKhmer ? 'ប្រាក់ចំណេញ (Margin %)' : 'Margin %'}</option>
                <option value="name">{isKhmer ? 'ឈ្មោះទំនិញ (Name)' : 'Name'}</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl bg-stone-950/70 border border-stone-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 text-[10px] uppercase font-bold bg-stone-900/50">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'ឈ្មោះទំនិញ' : 'Product Name'}</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'ប្រភេទ' : 'Category'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'តម្លៃរាយ ($)' : 'Price ($)'}</th>
                    <th className="py-2.5 px-3 text-center">{isKhmer ? 'ចំនួនលក់' : 'Units Sold'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ចំណូល ($)' : 'Revenue ($)'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ថ្លៃដើម ($)' : 'Unit Cost ($)'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ចំណេញ ($)' : 'Profit ($)'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ភាគរយចំណេញ' : 'Margin %'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-medium">
                  {filteredProducts.slice(0, productPageLimit).map((p, idx) => {
                    const price = p.retailPrice || p.unitPrice || 0;
                    const units = p.unitsSold || 0;
                    const rev = p.revenue || (price * units);
                    const cost = p.unitCost || p.bomCost || (price * 0.28);
                    const profit = p.grossProfit || (rev - (cost * units));
                    const margin = p.profitMarginPct || p.marginPercentage || 70;

                    return (
                      <tr key={idx} className="hover:bg-stone-900/60 transition">
                        <td className="py-2.5 px-3 text-stone-500 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-stone-200">{p.name}</td>
                        <td className="py-2.5 px-3 text-stone-400 text-[11px]">{p.category}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-300">${price.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-400 font-mono">{units}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-100">${rev.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-400">${cost.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">${profit.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
              <span>{isKhmer ? `បង្ហាញ ${Math.min(productPageLimit, filteredProducts.length)} នៃ ${filteredProducts.length} មុខទំនិញ` : `Showing ${Math.min(productPageLimit, filteredProducts.length)} of ${filteredProducts.length} items`}</span>
              <button
                type="button"
                onClick={() => setProductPageLimit(prev => prev >= 1000 ? 10 : 1000)}
                className="px-3 py-1 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold cursor-pointer transition border border-stone-800"
              >
                {productPageLimit >= 1000 ? (isKhmer ? 'បង្រួមត្រឹម ១០' : 'Show Top 10 Only') : (isKhmer ? 'បង្ហាញទាំងអស់' : 'Show All Items')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 4: CATEGORY & DEPARTMENT BREAKDOWN */}
      {/* ========================================================================= */}
      {reportViewMode === 'tabbed' && activeTab === 'categories' && (
        <div className="space-y-4 animate-fade-in">
          {/* All Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categoryStats.map((c, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-200">{c.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-950 text-amber-400 border border-amber-800">
                    {c.sharePct}% Share
                  </span>
                </div>
                <p className="text-xl font-bold font-mono text-emerald-400">${c.revenue.toFixed(2)}</p>
                <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                  <span>{c.units} Units Sold</span>
                  <span>Avg: ${c.avgPrice}</span>
                </div>
                <div className="text-[10px] text-stone-500 truncate pt-1 border-t border-stone-800/80">
                  Hero: <span className="text-stone-300 font-semibold">{c.topItem || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Category Revenue Comparison Bar Chart */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-3">
            <h4 className="text-xs font-bold text-stone-200">
              {isKhmer ? 'ការប្រៀបធៀបចំណូលតាមក្រុមមុខទំនិញ (Category Revenue Share)' : 'Category Revenue & Department Distribution'}
            </h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                  <XAxis dataKey="name" stroke="#78716c" fontSize={10} tickLine={false} />
                  <YAxis stroke="#78716c" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val) => [`$${val}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="rounded-2xl bg-stone-950/70 border border-stone-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 text-[10px] uppercase font-bold bg-stone-900/50">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'ក្រុមមុខទំនិញ' : 'Category'}</th>
                    <th className="py-2.5 px-3 text-center">{isKhmer ? 'មុខទំនិញក្នុងម៉ឺនុយ' : 'Items Count'}</th>
                    <th className="py-2.5 px-3 text-center">{isKhmer ? 'ចំនួនលក់សរុប' : 'Total Units'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ចំណូល ($)' : 'Revenue ($)'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ចំណូល (៛)' : 'Revenue (KHR)'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'សមាមាត្រ %' : 'Share %'}</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'ទំនិញលក់ដាច់ជាងគេ' : 'Top Selling Item'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-medium">
                  {categoryStats.map((c, idx) => (
                    <tr key={idx} className="hover:bg-stone-900/60 transition">
                      <td className="py-2.5 px-3 text-stone-500 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-stone-200">{c.name}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-stone-400">{c.itemCount}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-amber-400 font-mono">{c.units}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">${c.revenue.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-400">៛{Math.round(c.revenue * 4100).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-300">{c.sharePct}%</td>
                      <td className="py-2.5 px-3 text-stone-300 font-semibold">{c.topItem || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 5: PAYMENT TENDERS & SHIFT CASH RECONCILIATION */}
      {/* ========================================================================= */}
      {reportViewMode === 'tabbed' && activeTab === 'payments' && (
        <div className="space-y-4 animate-fade-in">
          {/* Tender Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-emerald-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4" />
                  <span>Physical Cash</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {cashPct}%
                </span>
              </div>
              <p className="text-2xl font-bold font-mono text-emerald-400">${cashTotal.toFixed(2)}</p>
              <p className="text-xs text-stone-400 font-mono">៛{Math.round(cashTotal * 4100).toLocaleString()}</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/70 border border-pink-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" />
                  <span>Bakong KHQR (NBC)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-pink-950 text-pink-400 border border-pink-800">
                  {khqrPct}%
                </span>
              </div>
              <p className="text-2xl font-bold font-mono text-pink-400">${khqrTotal.toFixed(2)}</p>
              <p className="text-xs text-stone-400 font-mono">៛{Math.round(khqrTotal * 4100).toLocaleString()}</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/70 border border-sky-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  <span>Credit / Debit Card</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-950 text-sky-400 border border-sky-800">
                  {cardPct}%
                </span>
              </div>
              <p className="text-2xl font-bold font-mono text-sky-400">${cardTotal.toFixed(2)}</p>
              <p className="text-xs text-stone-400 font-mono">៛{Math.round(cardTotal * 4100).toLocaleString()}</p>
            </div>
          </div>

          {/* Cashless Adoption KPI Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-stone-200">
                {isKhmer ? 'អត្រាការទូទាត់មិនប្រើសាច់ប្រាក់ (Cashless Adoption Rate)' : 'Store-Wide Cashless Adoption Rate'}
              </h4>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {isKhmer ? 'ការទូទាត់តាម KHQR & កាតធនាគារកាត់បន្ថយហានិភ័យកិបកេងសាច់ប្រាក់' : 'Bakong KHQR + Card payments minimize register shrinkage'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-mono text-amber-400">{cashlessRate}%</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                High Adoption
              </span>
            </div>
          </div>

          {/* Shift Drawer Cash Reconciliation Ledger */}
          <div className="rounded-2xl bg-stone-950/70 border border-stone-800 overflow-hidden shadow-xl">
            <div className="p-3 border-b border-stone-800 bg-stone-900/50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-200 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>{isKhmer ? 'ប្រវត្តិផ្ទៀងផ្ទាត់ថតប្រាក់តាមវេន (Shift Register Cash Audit)' : 'Register Shifts & Drawer Cash Reconciliation'}</span>
              </h4>
              <span className="text-[10px] text-stone-400">
                {shifts?.length || 0} Shifts Logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 text-[10px] uppercase font-bold bg-stone-900/30">
                    <th className="py-2.5 px-3">Shift ID</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'អ្នកគិតលុយ' : 'Cashier'}</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'បើកវេន' : 'Opened At'}</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'បិទវេន' : 'Closed At'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ដើមវេន ($)' : 'Float In ($)'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'រំពឹងទុក ($)' : 'Expected ($)'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'រាប់ជាក់ស្ដែង ($)' : 'Actual ($)'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ភាពលំអៀង' : 'Variance'}</th>
                    <th className="py-2.5 px-3 text-center">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-medium">
                  {(shifts || []).length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-6 text-center text-stone-500 text-xs">
                        {isKhmer ? 'មិនទាន់មានប្រវត្តិបិទវេននៅឡើយទេ' : 'No closed shifts recorded yet'}
                      </td>
                    </tr>
                  ) : (
                    (shifts || []).map((sh, idx) => {
                      const variance = (sh.actualCash && sh.expectedCash) ? (sh.actualCash - sh.expectedCash) : 0;
                      return (
                        <tr key={idx} className="hover:bg-stone-900/60 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{sh.id}</td>
                          <td className="py-2.5 px-3 text-stone-200">{sh.cashierName || 'Liam Vance'}</td>
                          <td className="py-2.5 px-3 text-stone-400 text-[11px]">{sh.openedAt ? new Date(sh.openedAt).toLocaleTimeString() : 'N/A'}</td>
                          <td className="py-2.5 px-3 text-stone-400 text-[11px]">{sh.closedAt ? new Date(sh.closedAt).toLocaleTimeString() : 'Active'}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-stone-300">${(sh.startingFloat || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-stone-300">${(sh.expectedCash || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-100">${(sh.actualCash || sh.expectedCash || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              variance === 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                              variance > 0 ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                              'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}>
                              {variance >= 0 ? `+$${variance.toFixed(2)}` : `-$${Math.abs(variance).toFixed(2)}`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              sh.status === 'CLOSED' ? 'bg-stone-800 text-stone-300' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}>
                              {sh.status || 'CLOSED'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 6: PEAK HOURS & RUSH DEMAND ANALYSIS */}
      {/* ========================================================================= */}
      {reportViewMode === 'tabbed' && activeTab === 'peak-hours' && (
        <div className="space-y-4 animate-fade-in">
          {/* Rush Period Insight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-amber-900/50 space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                Morning Rush (8:00 - 10:00 AM)
              </span>
              <p className="text-xl font-bold font-mono text-stone-100">Peak Coffee Volume</p>
              <p className="text-xs text-stone-400">Breakfast & grab-and-go espresso rush</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-emerald-900/50 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                Midday Lunch Rush (11:30 - 1:30 PM)
              </span>
              <p className="text-xl font-bold font-mono text-stone-100">Max Ticket Value</p>
              <p className="text-xs text-stone-400">Pastry combos, dine-in & cold brews</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-sky-900/50 space-y-1">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wide">
                Afternoon Refresh (2:30 - 4:00 PM)
              </span>
              <p className="text-xl font-bold font-mono text-stone-100">Secondary Boost</p>
              <p className="text-xs text-stone-400">Boba, flavored teas & artisan bakery</p>
            </div>
          </div>

          {/* Peak Hour Rush Chart */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-200">
                {isKhmer ? 'ការចែកចាយម៉ោងលក់ & ចំនួនភ្ញៀវ (Hourly Rush Demand Curve)' : 'Hourly Sales Volume & Customer Ticket Distribution'}
              </h4>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800">
                8 AM - 5 PM
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHourData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                  <XAxis dataKey="hour" stroke="#78716c" fontSize={10} tickLine={false} />
                  <YAxis stroke="#78716c" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val) => [`$${val}`, 'Sales']}
                  />
                  <Bar dataKey="sales" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Staffing Recommendations Table */}
          <div className="rounded-2xl bg-stone-950/70 border border-stone-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 text-[10px] uppercase font-bold bg-stone-900/50">
                    <th className="py-2.5 px-3">Hour Slot</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ចំណូលលក់ ($)' : 'Sales Volume ($)'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ចំណូល (៛)' : 'Sales (KHR)'}</th>
                    <th className="py-2.5 px-3 text-center">{isKhmer ? 'ចំនួនវិក្កយបត្រ' : 'Tickets Handled'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ជាមធ្យម/វិក្កយបត្រ' : 'Avg Ticket ($)'}</th>
                    <th className="py-2.5 px-3 text-center">{isKhmer ? 'បុគ្គលិកណែនាំ' : 'Recommended Staff'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-medium">
                  {peakHourData.map((h, idx) => {
                    const sales = h.sales || 0;
                    const tickets = h.tickets || 0;
                    const avg = tickets > 0 ? (sales / tickets).toFixed(2) : '0.00';
                    return (
                      <tr key={idx} className="hover:bg-stone-900/60 transition">
                        <td className="py-2.5 px-3 font-bold text-stone-200">{h.hour}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">${sales.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-400">៛{Math.round(sales * 4100).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-stone-300">{tickets}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-300">${avg}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            h.recommendedStaff >= 3 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                            'bg-stone-850 text-stone-300 border border-stone-700'
                          }`}>
                            {h.recommendedStaff >= 3 ? '3 Staff (Peak Rush)' : `${h.recommendedStaff || 2} Staff`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 7: COGS, FOOD COST & RECIPE PROFITABILITY */}
      {/* ========================================================================= */}
      {reportViewMode === 'tabbed' && activeTab === 'cogs' && (
        <div className="space-y-4 animate-fade-in">
          {/* Target Benchmark KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase">Store COGS Ratio</span>
              <p className="text-2xl font-black font-mono text-amber-400">{overallCogsPercentage}%</p>
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>Target: &lt; 28.0%</span>
                <span className="text-emerald-400 font-bold">Optimal</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase">Gross Profit Ratio</span>
              <p className="text-2xl font-black font-mono text-emerald-400">{(100 - overallCogsPercentage).toFixed(1)}%</p>
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>Total Profit: ${totalGrossProfit.toFixed(2)}</span>
                <span className="text-stone-400">Healthy Margin</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase">Total Ingredient Cost</span>
              <p className="text-2xl font-black font-mono text-stone-100">${(reportData.totalIngredientCost || (netSales * 0.274)).toFixed(2)}</p>
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>Raw Material Spend</span>
                <span>BOM Synced</span>
              </div>
            </div>
          </div>

          {/* Search Bar for Recipes */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/70 border border-stone-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder={isKhmer ? 'ស្វែងរកមុខទំនិញ ឬរូបមន្ត...' : 'Search recipe item or category...'}
                value={cogsSearch}
                onChange={(e) => setCogsSearch(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <span className="text-xs text-stone-400">
              {filteredCogs.length} Recipes Audited
            </span>
          </div>

          {/* Recipe BOM Profitability Table */}
          <div className="rounded-2xl bg-stone-950/70 border border-stone-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 text-[10px] uppercase font-bold bg-stone-900/50">
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Retail Price ($)</th>
                    <th className="py-2.5 px-3 text-right">BOM Cost ($)</th>
                    <th className="py-2.5 px-3 text-right">Gross Margin ($)</th>
                    <th className="py-2.5 px-3 text-right">Margin %</th>
                    <th className="py-2.5 px-3 text-right">COGS %</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-medium">
                  {filteredCogs.map((it, idx) => (
                    <tr key={idx} className="hover:bg-stone-900/60 transition">
                      <td className="py-2.5 px-3 font-bold text-stone-200">{it.name}</td>
                      <td className="py-2.5 px-3 text-stone-400 text-[11px]">{it.category}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-300">${(it.retailPrice || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-400 font-bold">${(it.bomCost || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">${(it.grossMargin || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-100 font-bold">{it.marginPercentage}%</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-400">{it.cogsPercentage}%</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          it.marginPercentage >= 75 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          it.marginPercentage >= 65 ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                          'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {it.marginPercentage >= 75 ? 'Star Margin ⭐' : (it.marginPercentage >= 65 ? 'Healthy' : 'High COGS')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 8: RAW MATERIALS & INVENTORY DEPLETION */}
      {/* ========================================================================= */}
      {reportViewMode === 'tabbed' && activeTab === 'inventory' && (
        <div className="space-y-4 animate-fade-in">
          {/* Inventory Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800">
              <span className="text-[10px] font-bold text-stone-400 uppercase">Ingredients Tracked</span>
              <p className="text-xl font-bold font-mono text-stone-100">{ingredients?.length || 0}</p>
              <span className="text-[10px] text-stone-500">Active BOM Catalog</span>
            </div>
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-rose-900/60">
              <span className="text-[10px] font-bold text-rose-400 uppercase">Critical Depletion</span>
              <p className="text-xl font-bold font-mono text-rose-400">
                {filteredInventory.filter(i => i.status === 'CRITICAL').length} Items
              </p>
              <span className="text-[10px] text-rose-400">Below Safety Threshold</span>
            </div>
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-amber-900/60">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Low Stock Warning</span>
              <p className="text-xl font-bold font-mono text-amber-400">
                {filteredInventory.filter(i => i.status === 'LOW').length} Items
              </p>
              <span className="text-[10px] text-amber-400">Near Safety Buffer</span>
            </div>
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-emerald-900/60">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Optimal Buffer</span>
              <p className="text-xl font-bold font-mono text-emerald-400">
                {filteredInventory.filter(i => i.status === 'OPTIMAL').length} Items
              </p>
              <span className="text-[10px] text-emerald-400">Stocked</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/70 border border-stone-800">
            <div className="flex items-center gap-1.5">
              {['ALL', 'CRITICAL', 'LOW', 'OPTIMAL'].map(st => (
                <button
                  key={st}
                  onClick={() => setInventoryFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    inventoryFilter === st
                      ? 'bg-amber-600 text-stone-950'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <span className="text-xs text-stone-400">
              {filteredInventory.length} Raw Materials Shown
            </span>
          </div>

          {/* Stock Depletion Table */}
          <div className="rounded-2xl bg-stone-950/70 border border-stone-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 text-[10px] uppercase font-bold bg-stone-900/50">
                    <th className="py-2.5 px-3">Ingredient</th>
                    <th className="py-2.5 px-3 text-right">Current Stock</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-right">Safety Threshold</th>
                    <th className="py-2.5 px-3 text-right">Unit Cost ($)</th>
                    <th className="py-2.5 px-3 text-right">Stock Value ($)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Suggested PO</th>
                    <th className="py-2.5 px-3 text-right">Restock Cost ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-medium">
                  {filteredInventory.map((ing, idx) => (
                    <tr key={idx} className="hover:bg-stone-900/60 transition">
                      <td className="py-2.5 px-3 font-bold text-stone-200">{ing.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-100">{ing.stock}</td>
                      <td className="py-2.5 px-3 text-stone-400 text-[11px]">{ing.unit}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-400">{ing.minThreshold}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-300">${(ing.costPerUnit || 0).toFixed(3)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">${ing.totalStockVal.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ing.status === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                          ing.status === 'LOW' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}>
                          {ing.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-400 font-bold">+{ing.suggestedReorder} {ing.unit}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-200">${ing.reorderCost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 9: CASHIER & STAFF PERFORMANCE AUDIT */}
      {/* ========================================================================= */}
      {reportViewMode === 'tabbed' && activeTab === 'staff' && (
        <div className="space-y-4 animate-fade-in">
          {/* Top Staff Leaderboard Podium */}
          {staffPerformance.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* #1 MVP Sales Leader */}
              {(() => {
                const mvp = [...staffPerformance].sort((a, b) => (b.salesGenerated || 0) - (a.salesGenerated || 0))[0];
                return mvp ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/40 via-stone-950/70 to-stone-950/90 border-2 border-amber-500/60 shadow-xl relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>🏆 {isKhmer ? 'បុគ្គលិកឆ្នើមផ្នែកលក់ (MVP)' : 'MVP Sales Champion'}</span>
                      </span>
                      <span className="text-xl">🥇</span>
                    </div>
                    <div className="mt-3">
                      <h4 className="text-base font-black text-stone-100 group-hover:text-amber-300 transition">{mvp.name}</h4>
                      <p className="text-[11px] text-amber-400 font-semibold">{mvp.role}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-stone-800/80 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ចំណូល ($)' : 'Sales ($)'}</span>
                        <p className="text-sm font-black text-emerald-400 font-mono">${(mvp.salesGenerated || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ចំណូល (៛)' : 'Sales (៛)'}</span>
                        <p className="text-xs font-bold text-stone-300 font-mono">៛{Math.round((mvp.salesGenerated || 0) * 4100).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'វិក្កយបត្រ' : 'Tickets'}</span>
                        <p className="text-sm font-black text-amber-400 font-mono">{mvp.ticketsHandled || 0}</p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Speed Master */}
              {(() => {
                const speed = [...staffPerformance].sort((a, b) => (b.ticketsHandled || 0) - (a.ticketsHandled || 0))[0];
                return speed ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-sky-950/40 via-stone-950/70 to-stone-950/90 border border-sky-500/40 shadow-lg relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-sky-400" />
                        <span>⚡ {isKhmer ? 'ល្បឿនលឿនបំផុត' : 'Speed Master'}</span>
                      </span>
                      <span className="text-xl">🏃</span>
                    </div>
                    <div className="mt-3">
                      <h4 className="text-base font-black text-stone-200 group-hover:text-sky-300 transition">{speed.name}</h4>
                      <p className="text-[11px] text-sky-400 font-semibold">{speed.role}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-stone-800/80 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'វិក្កយបត្រ' : 'Tickets'}</span>
                        <p className="text-sm font-black text-sky-400 font-mono">{speed.ticketsHandled || 0}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'ចំណូល' : 'Sales'}</span>
                        <p className="text-sm font-black text-stone-200 font-mono">${(speed.salesGenerated || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'មធ្យម/កុម្ម៉ង់' : 'Avg/Order'}</span>
                        <p className="text-sm font-black text-amber-400 font-mono">${(speed.avgTicketValue || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Upsell Champion */}
              {(() => {
                const upsell = [...staffPerformance].sort((a, b) => (b.avgTicketValue || 0) - (a.avgTicketValue || 0))[0];
                return upsell ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/40 via-stone-950/70 to-stone-950/90 border border-purple-500/40 shadow-lg relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>💎 {isKhmer ? 'ពូកែណែនាំទំនិញ' : 'Upsell Champion'}</span>
                      </span>
                      <span className="text-xl">📈</span>
                    </div>
                    <div className="mt-3">
                      <h4 className="text-base font-black text-stone-200 group-hover:text-purple-300 transition">{upsell.name}</h4>
                      <p className="text-[11px] text-purple-400 font-semibold">{upsell.role}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-stone-800/80 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'មធ្យម/កុម្ម៉ង់' : 'Avg Ticket'}</span>
                        <p className="text-sm font-black text-purple-400 font-mono">${(upsell.avgTicketValue || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'បញ្ចុះតម្លៃ' : 'Discounts'}</span>
                        <p className="text-sm font-black text-stone-200 font-mono">{upsell.discountCount || 0}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-400 uppercase font-bold">{isKhmer ? 'លុបចោល' : 'Voids'}</span>
                        <p className={`text-sm font-black font-mono ${(upsell.voidCount || 0) > 2 ? 'text-rose-400' : 'text-emerald-400'}`}>{upsell.voidCount || 0}</p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Labor Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase">Store Labor Ratio</span>
              <p className="text-2xl font-black font-mono text-sky-400">{reportData.storeLaborCostPercentage || 24.5}%</p>
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>Target: 22 - 28%</span>
                <span className="text-emerald-400 font-bold">Well Controlled</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase">Staff on Duty</span>
              <p className="text-2xl font-black font-mono text-stone-100">{staffPerformance.length} Baristas</p>
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>Total Tickets: {customerCount}</span>
                <span>Active Roster</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase">Total Shift Hours</span>
              <p className="text-2xl font-black font-mono text-amber-400">
                {staffPerformance.reduce((acc, st) => acc + (st.hoursWorked || 0), 0).toFixed(1)} hrs
              </p>
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>Logged Clock Time</span>
                <span>Audit Verified</span>
              </div>
            </div>
          </div>

          {/* Staff Performance Table */}
          <div className="rounded-2xl bg-stone-950/70 border border-stone-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 text-[10px] uppercase font-bold bg-stone-900/50">
                    <th className="py-2.5 px-3">{isKhmer ? 'បុគ្គលិក' : 'Staff Member'}</th>
                    <th className="py-2.5 px-3">{isKhmer ? 'តួនាទី' : 'Role'}</th>
                    <th className="py-2.5 px-3 text-center">{isKhmer ? 'ចំនួនវិក្កយបត្រ' : 'Tickets'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ចំណូលលក់ ($)' : 'Sales Volume ($)'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ចំណូល (៛)' : 'Sales (KHR)'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ជាមធ្យម/វិក្កយបត្រ' : 'Avg Ticket ($)'}</th>
                    <th className="py-2.5 px-3 text-center">{isKhmer ? 'លុបចោល' : 'Voids'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ម៉ោងធ្វើការ' : 'Hours'}</th>
                    <th className="py-2.5 px-3 text-right">{isKhmer ? 'ប្រាក់ពលកម្ម ($)' : 'Labor Cost ($)'}</th>
                    <th className="py-2.5 px-3 text-center">{isKhmer ? 'ការត្រួតពិនិត្យ' : 'Audit'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-medium">
                  {staffPerformance.map((st, idx) => (
                    <tr key={idx} className="hover:bg-stone-900/60 transition">
                      <td className="py-2.5 px-3 font-bold text-stone-200">{st.name}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-[10px] text-stone-300 font-bold uppercase">
                          {st.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400">{st.ticketsHandled || 0}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">${(st.salesGenerated || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-400">៛{Math.round((st.salesGenerated || 0) * 4100).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-300">${(st.avgTicketValue || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-rose-400">{st.voidCount || 0}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-400">{st.hoursWorked || 0} hrs</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-300">${(st.laborCost || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.flaggedAudit ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}>
                          {st.flaggedAudit ? 'Needs Review' : 'Verified'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 10: DISCOUNTS, VOIDS & CUSTOMER LOYALTY AUDIT */}
      {/* ========================================================================= */}
      {reportViewMode === 'tabbed' && activeTab === 'loyalty-discounts' && (
        <div className="space-y-4 animate-fade-in">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-rose-900/50 space-y-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase">Total Discounts Given</span>
              <p className="text-2xl font-black font-mono text-rose-400">-${totalDiscounts.toFixed(2)}</p>
              <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                <span>៛{Math.round(totalDiscounts * 4100).toLocaleString()}</span>
                <span>{grossSales > 0 ? `${((totalDiscounts / grossSales) * 100).toFixed(1)}% of Gross` : '0.0%'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/70 border border-amber-900/50 space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase">VIP Loyalty Members</span>
              <p className="text-2xl font-black font-mono text-stone-100">{customers?.length || 0} Members</p>
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>Total Registered</span>
                <span className="text-amber-400 font-bold">Gold & Platinum</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/70 border border-emerald-900/50 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Loyalty Points Bank</span>
              <p className="text-2xl font-black font-mono text-emerald-400">
                {(customers || []).reduce((acc, c) => acc + (c.points || 0), 0)} pts
              </p>
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>Available for Redemption</span>
                <span>Active Ledger</span>
              </div>
            </div>
          </div>

          {/* Search Bar for VIP Members */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/70 border border-stone-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder={isKhmer ? 'ស្វែងរកសមាជិក VIP តាមឈ្មោះ ឬលេខទូរស័ព្ទ...' : 'Search VIP customer by name or phone...'}
                value={loyaltySearch}
                onChange={(e) => setLoyaltySearch(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <span className="text-xs text-stone-400">
              {filteredLoyalty.length} Members Listed
            </span>
          </div>

          {/* Customer Loyalty Table */}
          <div className="rounded-2xl bg-stone-950/70 border border-stone-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 text-[10px] uppercase font-bold bg-stone-900/50">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Loyalty Tier</th>
                    <th className="py-2.5 px-3 text-right">Points Balance</th>
                    <th className="py-2.5 px-3 text-right">Lifetime Spend ($)</th>
                    <th className="py-2.5 px-3 text-right">Spend (KHR)</th>
                    <th className="py-2.5 px-3 text-center">Visits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-medium">
                  {filteredLoyalty.map((c, idx) => (
                    <tr key={idx} className="hover:bg-stone-900/60 transition">
                      <td className="py-2.5 px-3 text-stone-500 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-stone-200">{c.name}</td>
                      <td className="py-2.5 px-3 text-stone-400 text-[11px] font-mono">{c.phone || 'N/A'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold">
                          {c.tier || 'VIP MEMBER'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">{c.points || 0} pts</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">${(c.totalSpent || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-400">៛{Math.round((c.totalSpent || 0) * 4100).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-stone-300">{c.visitCount || 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXPORT & PRINT CENTER */}
      {/* ========================================================================= */}
      {reportViewMode === 'tabbed' && activeTab === 'export' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-stone-950/80 border border-emerald-900/40 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-100">
                  {isKhmer ? 'កញ្ចប់របាយការណ៍ Excel ពេញលេញ (.xlsx)' : 'Complete 10-Sheet Multi-Workbook Package (.xlsx)'}
                </h4>
                <p className="text-xs text-stone-400 mt-0.5">
                  {isKhmer 
                    ? 'មានគ្រប់ទាំង ១០ របាយការណ៍ (Overview, Sales Ledger, Products, Categories, Payments, Hourly Rush, COGS, Inventory, Staff, Loyalty) ក្នុងឯកសារតែមួយ' 
                    : 'Includes all 10 reports in a single structured workbook'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportToExcel('all')}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/50"
              >
                <Download className="w-4 h-4" />
                <span>{isKhmer ? 'ទាញយក Excel ទាំង ១០ របាយការណ៍' : 'Download Complete 10-Report Excel (.xlsx)'}</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-100">
                  {isKhmer ? 'បោះពុម្ពរបាយការណ៍សង្ខេប ១ទំព័រ' : 'Standard 1-Page Summary Printout'}
                </h4>
                <p className="text-xs text-stone-400 mt-0.5">
                  {isKhmer 
                    ? 'រៀបចំទម្រង់ A4 ស្ដង់ដារសម្រាប់ម្ចាស់ហាង និងអ្នកគ្រប់គ្រងចុះហត្ថលេខា' 
                    : 'A4 formatted single-page executive summary sheet with manager sign-off'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundService.playBeepSound();
                  setIsPrintPreviewOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>{isKhmer ? 'មើលមុន & បោះពុម្ព (A4)' : 'Preview & Print 1-Page'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE PRINT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
                    <span>{isKhmer ? 'ការមើលទំព័រមុនបោះពុម្ព (Print Preview)' : 'Standard 1-Page Print Preview'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                      A4 Portrait
                    </span>
                  </h3>
                  <p className="text-xs text-stone-400">
                    {isKhmer 
                      ? 'ទម្រង់របាយការណ៍សង្ខេប ១ទំព័រស្ដង់ដារសម្រាប់បោះពុម្ព ឬរក្សាទុកជា PDF' 
                      : 'Formatted to fit strictly on 1 single sheet of A4 paper'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isKhmer ? 'បញ្ជាក់បោះពុម្ព (Print Now)' : 'Confirm & Print'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-stone-950/90 flex justify-center">
              <div className="w-full max-w-[210mm] bg-white text-black p-8 rounded-xl shadow-2xl border border-stone-300 space-y-4">
                <div className="border-b-2 border-black pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StoreLogo size="md" variant="monochrome" />
                    <div>
                      <h1 className="text-lg font-black tracking-tight uppercase">{storeInfo?.name || 'AROMA COFFEE & BAKERY POS'}</h1>
                      <p className="text-[11px] font-semibold text-gray-700">{storeInfo?.address || 'Official Executive Management & Daily Business Audit Report'}</p>
                      <p className="text-[9px] text-gray-500 font-mono mt-0.5">Dual Currency: 1 USD = 4,100 KHR</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px]">
                    <p className="font-bold">Period: {(filters.startDate && filters.endDate) ? `${filters.startDate} → ${filters.endDate}` : filters.datePreset.toUpperCase()}</p>
                    <p className="text-gray-600">Printed: {new Date().toLocaleString('en-GB')}</p>
                    <p className="text-gray-600">Operator: {user?.name || 'Manager'} ({user?.role || 'ADMIN'})</p>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  <div className="border border-black p-2 rounded text-center">
                    <span className="text-[8px] uppercase font-bold text-gray-600 block">Gross Sales</span>
                    <span className="text-xs font-black">${grossSales.toFixed(2)}</span>
                    <span className="text-[7px] text-gray-600 block font-mono">៛{Math.round(grossSales * 4100).toLocaleString()}</span>
                  </div>
                  <div className="border border-black p-2 rounded text-center">
                    <span className="text-[8px] uppercase font-bold text-red-600 block">Discounts</span>
                    <span className="text-xs font-black text-red-700">-${totalDiscounts.toFixed(2)}</span>
                    <span className="text-[7px] text-red-600 block font-mono">Promo/VIP</span>
                  </div>
                  <div className="border border-black p-2 rounded text-center bg-gray-50">
                    <span className="text-[8px] uppercase font-bold text-gray-800 block">Net Revenue</span>
                    <span className="text-xs font-black">${netSales.toFixed(2)}</span>
                    <span className="text-[7px] text-gray-600 block font-mono">៛{Math.round(netSales * 4100).toLocaleString()}</span>
                  </div>
                  <div className="border border-black p-2 rounded text-center">
                    <span className="text-[8px] uppercase font-bold text-gray-600 block">COGS Cost</span>
                    <span className="text-xs font-black">${totalCOGS.toFixed(2)}</span>
                    <span className="text-[7px] text-gray-600 block font-mono">{overallCogsPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="border border-black p-2 rounded text-center">
                    <span className="text-[8px] uppercase font-bold text-gray-600 block">Gross Profit</span>
                    <span className="text-xs font-black">${totalGrossProfit.toFixed(2)}</span>
                    <span className="text-[7px] text-gray-600 block font-mono">{(100 - overallCogsPercentage).toFixed(1)}%</span>
                  </div>
                  <div className="border border-black p-2 rounded text-center">
                    <span className="text-[8px] uppercase font-bold text-gray-600 block">Orders / Avg</span>
                    <span className="text-xs font-black">{customerCount}</span>
                    <span className="text-[7px] text-gray-600 block font-mono">${avgSpend.toFixed(2)}/tix</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-gray-400 p-2.5 rounded">
                    <h3 className="font-bold uppercase text-[10px] border-b border-gray-400 pb-1 mb-1">Financial Reconciliation</h3>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span>Gross Sales Volume:</span>
                        <span className="font-mono font-bold">${grossSales.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-red-700">
                        <span>Discounts Given:</span>
                        <span className="font-mono font-bold">-${totalDiscounts.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sales Tax (VAT 8%):</span>
                        <span className="font-mono font-bold">${totalTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-amber-800">
                        <span>Cost of Goods Sold (COGS):</span>
                        <span className="font-mono font-bold">-${totalCOGS.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-black border-t border-black pt-1 text-[11px]">
                        <span>Net Cleared Revenue:</span>
                        <span className="font-mono">${netSales.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-400 p-2.5 rounded">
                    <h3 className="font-bold uppercase text-[10px] border-b border-gray-400 pb-1 mb-1">Payment Tender Reconciliation</h3>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span>Physical Cash (USD/KHR):</span>
                        <span className="font-mono font-bold">${cashTotal.toFixed(2)} ({cashPct}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bakong KHQR (NBC):</span>
                        <span className="font-mono font-bold">${khqrTotal.toFixed(2)} ({khqrPct}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Credit / Debit Card:</span>
                        <span className="font-mono font-bold">${cardTotal.toFixed(2)} ({cardPct}%)</span>
                      </div>
                      <div className="flex justify-between font-black border-t border-black pt-1 text-[11px]">
                        <span>Total Tenders Audited:</span>
                        <span className="font-mono">${(cashTotal + khqrTotal + cardTotal).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-400 p-2.5 rounded">
                  <h3 className="font-bold uppercase text-[10px] border-b border-gray-400 pb-1 mb-1">Menu Products & Sales Performance (All Items)</h3>
                  <table className="w-full text-left text-[10px]">
                    <thead>
                      <tr className="border-b border-gray-300 font-bold uppercase text-[9px]">
                        <th className="py-1">Rank</th>
                        <th className="py-1">Product Name</th>
                        <th className="py-1">Category</th>
                        <th className="py-1 text-center">Units Sold</th>
                        <th className="py-1 text-right">Price</th>
                        <th className="py-1 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData?.allProductPerformance || []).map((p, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="py-1 font-mono">{idx + 1}</td>
                          <td className="py-1 font-bold">{p.name}</td>
                          <td className="py-1 text-gray-600">{p.category}</td>
                          <td className="py-1 text-center font-bold font-mono">{p.unitsSold || 0}</td>
                          <td className="py-1 text-right font-mono">${(p.retailPrice || 0).toFixed(2)}</td>
                          <td className="py-1 text-right font-mono font-bold">${(p.revenue || ((p.retailPrice || 0) * (p.unitsSold || 0))).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-black text-[10px]">
                  <div>
                    <p className="font-bold uppercase">Store Manager Sign-off:</p>
                    <div className="border-b border-black mt-7"></div>
                    <p className="text-gray-600 mt-1">Signature & Date</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase">Store Auditor / Owner Verification:</p>
                    <div className="border-b border-black mt-7"></div>
                    <p className="text-gray-600 mt-1">Official Verification Stamp</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DEDICATED PRINT CONTAINER */}
      {/* ========================================================================= */}
      <div id="pos-1page-print-sheet" className="hidden print:block font-sans text-black p-4 bg-white max-w-[210mm] mx-auto text-xs">
        <div className="border-b-2 border-black pb-3 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StoreLogo size="md" variant="monochrome" />
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase">{storeInfo?.name || 'AROMA COFFEE & BAKERY POS'}</h1>
              <p className="text-[11px] font-semibold text-gray-700">{storeInfo?.address || 'Official Executive Management & Daily Business Audit Report'}</p>
              <p className="text-[9px] text-gray-500 font-mono mt-0.5">Dual Currency: 1 USD = 4,100 KHR</p>
            </div>
          </div>
          <div className="text-right text-[10px]">
            <p className="font-bold">Period: {(filters.startDate && filters.endDate) ? `${filters.startDate} → ${filters.endDate}` : filters.datePreset.toUpperCase()}</p>
            <p className="text-gray-600">Printed: {new Date().toLocaleString('en-GB')}</p>
            <p className="text-gray-600">Operator: {user?.name || 'Manager'} ({user?.role || 'ADMIN'})</p>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2 mb-3">
          <div className="border border-black p-2 rounded text-center">
            <span className="text-[8px] uppercase font-bold text-gray-600 block">Gross Sales</span>
            <span className="text-xs font-black">${grossSales.toFixed(2)}</span>
            <span className="text-[7px] text-gray-600 block font-mono">៛{Math.round(grossSales * 4100).toLocaleString()}</span>
          </div>
          <div className="border border-black p-2 rounded text-center">
            <span className="text-[8px] uppercase font-bold text-red-600 block">Discounts</span>
            <span className="text-xs font-black text-red-700">-${totalDiscounts.toFixed(2)}</span>
            <span className="text-[7px] text-red-600 block font-mono">Promo/VIP</span>
          </div>
          <div className="border border-black p-2 rounded text-center bg-gray-50">
            <span className="text-[8px] uppercase font-bold text-gray-800 block">Net Revenue</span>
            <span className="text-xs font-black">${netSales.toFixed(2)}</span>
            <span className="text-[7px] text-gray-600 block font-mono">៛{Math.round(netSales * 4100).toLocaleString()}</span>
          </div>
          <div className="border border-black p-2 rounded text-center">
            <span className="text-[8px] uppercase font-bold text-gray-600 block">COGS Cost</span>
            <span className="text-xs font-black">${totalCOGS.toFixed(2)}</span>
            <span className="text-[7px] text-gray-600 block font-mono">{overallCogsPercentage.toFixed(1)}%</span>
          </div>
          <div className="border border-black p-2 rounded text-center">
            <span className="text-[8px] uppercase font-bold text-gray-600 block">Gross Profit</span>
            <span className="text-xs font-black">${totalGrossProfit.toFixed(2)}</span>
            <span className="text-[7px] text-gray-600 block font-mono">{(100 - overallCogsPercentage).toFixed(1)}%</span>
          </div>
          <div className="border border-black p-2 rounded text-center">
            <span className="text-[8px] uppercase font-bold text-gray-600 block">Orders / Avg</span>
            <span className="text-xs font-black">{customerCount}</span>
            <span className="text-[7px] text-gray-600 block font-mono">${avgSpend.toFixed(2)}/tix</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="border border-gray-400 p-2.5 rounded">
            <h3 className="font-bold uppercase text-[10px] border-b border-gray-400 pb-1 mb-1">Financial Reconciliation</h3>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Gross Sales Volume:</span>
                <span className="font-mono font-bold">${grossSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-700">
                <span>Discounts Given:</span>
                <span className="font-mono font-bold">-${totalDiscounts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sales Tax (VAT 8%):</span>
                <span className="font-mono font-bold">${totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-800">
                <span>Cost of Goods Sold (COGS):</span>
                <span className="font-mono font-bold">-${totalCOGS.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black border-t border-black pt-1 text-[11px]">
                <span>Net Sales Revenue:</span>
                <span className="font-mono">${netSales.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-400 p-2.5 rounded">
            <h3 className="font-bold uppercase text-[10px] border-b border-gray-400 pb-1 mb-1">Payment Tender Reconciliation</h3>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Physical Cash (USD/KHR):</span>
                <span className="font-mono font-bold">${cashTotal.toFixed(2)} ({cashPct}%)</span>
              </div>
              <div className="flex justify-between">
                <span>Bakong KHQR (NBC):</span>
                <span className="font-mono font-bold">${khqrTotal.toFixed(2)} ({khqrPct}%)</span>
              </div>
              <div className="flex justify-between">
                <span>Credit / Debit Card:</span>
                <span className="font-mono font-bold">${cardTotal.toFixed(2)} ({cardPct}%)</span>
              </div>
              <div className="flex justify-between font-black border-t border-black pt-1 text-[11px]">
                <span>Total Tenders Audited:</span>
                <span className="font-mono">${(cashTotal + khqrTotal + cardTotal).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-400 p-2.5 rounded mb-4">
          <h3 className="font-bold uppercase text-[10px] border-b border-gray-400 pb-1 mb-1">Menu Products & Sales Performance (All Items)</h3>
          <table className="w-full text-left text-[10px]">
            <thead>
              <tr className="border-b border-gray-300 font-bold uppercase text-[9px]">
                <th className="py-1">Rank</th>
                <th className="py-1">Product Name</th>
                <th className="py-1">Category</th>
                <th className="py-1 text-center">Units Sold</th>
                <th className="py-1 text-right">Price</th>
                <th className="py-1 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(reportData?.allProductPerformance || []).map((p, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-1 font-mono">{idx + 1}</td>
                  <td className="py-1 font-bold">{p.name}</td>
                  <td className="py-1 text-gray-600">{p.category}</td>
                  <td className="py-1 text-center font-bold font-mono">{p.unitsSold || 0}</td>
                  <td className="py-1 text-right font-mono">${(p.retailPrice || 0).toFixed(2)}</td>
                  <td className="py-1 text-right font-mono font-bold">${(p.revenue || ((p.retailPrice || 0) * (p.unitsSold || 0))).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-black text-[10px]">
          <div>
            <p className="font-bold uppercase">Store Manager Sign-off:</p>
            <div className="border-b border-black mt-7"></div>
            <p className="text-gray-600 mt-1">Signature & Date</p>
          </div>
          <div>
            <p className="font-bold uppercase">Store Auditor / Owner Verification:</p>
            <div className="border-b border-black mt-7"></div>
            <p className="text-gray-600 mt-1">Official Verification Stamp</p>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        onUserCreated={() => {
          loadReport();
          showToast(isKhmer ? 'បានបង្កើតគណនី និងភ្ជាប់ទៅរបាយការណ៍!' : 'User created & synced with reports!', 'success');
        }}
      />

      {/* Strict CSS for 1-Page A4 Printing */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #pos-1page-print-sheet,
          #pos-1page-print-sheet * {
            visibility: visible !important;
          }
          #pos-1page-print-sheet {
            display: block !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 8mm 12mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 9999999 !important;
          }
        }
      `}</style>
    </div>
  );
};
