import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import * as XLSX from 'xlsx';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Receipt, 
  DollarSign, 
  Lock, 
  Unlock, 
  PlusCircle, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Printer, 
  X, 
  Banknote, 
  CreditCard, 
  QrCode, 
  Coins, 
  ShieldCheck, 
  FileText,
  UserCheck,
  Building2,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

export const StaffShiftList = () => {
  const { 
    shifts, 
    activeShift, 
    openShift, 
    closeShift, 
    loadShifts, 
    staffList, 
    showToast, 
    user,
    orders,
    openShiftModal
  } = useApp();

  const { t, isKhmer, formatUSD, formatKHR, khrExchangeRate } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPEN, CLOSED, VARIANCE
  const [selectedShiftForDetails, setSelectedShiftForDetails] = useState(null);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);

  // Open Shift Form State
  const [openFormData, setOpenFormData] = useState({
    staffId: user?.id || 'usr-4',
    staffName: user?.name || 'Chloe Chen',
    staffRole: user?.role || 'CASHIER',
    registerName: 'Register #1 - Main Bar',
    startingFloat: 100.00,
    notes: 'Morning shift opening float verified.'
  });

  // Close Shift Form State (Reconciliation)
  const [closePhysicalCount, setClosePhysicalCount] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [useDenomCalculator, setUseDenomCalculator] = useState(false);
  const [denominations, setDenominations] = useState({
    b100: 0,
    b50: 0,
    b20: 0,
    b10: 0,
    b5: 0,
    b1: 0,
    coins: 0
  });

  // Filtered shifts list
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      const matchSearch = 
        s.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.shiftNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.registerName && s.registerName.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (statusFilter === 'OPEN') return s.status === 'OPEN';
      if (statusFilter === 'CLOSED') return s.status === 'CLOSED';
      if (statusFilter === 'VARIANCE') return s.status === 'CLOSED' && s.variance !== 0;

      return true;
    });
  }, [shifts, searchTerm, statusFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const closed = shifts.filter((s) => s.status === 'CLOSED');
    const totalVariance = closed.reduce((acc, s) => acc + (s.variance || 0), 0);
    const totalSales = shifts.reduce((acc, s) => acc + (s.totalGrossSales || 0), 0);
    const totalTickets = shifts.reduce((acc, s) => acc + (s.totalOrders || 0), 0);

    return {
      activeCount: shifts.filter((s) => s.status === 'OPEN').length,
      closedCount: closed.length,
      totalVariance: Math.round(totalVariance * 100) / 100,
      totalSales: Math.round(totalSales * 100) / 100,
      totalTickets
    };
  }, [shifts]);

  // Handle Opening a new Shift
  const handleOpenSubmit = async (e) => {
    e.preventDefault();
    try {
      await openShift(openFormData);
      setIsOpenShiftModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Physical cash sum from denominations
  const denomSum = useMemo(() => {
    return (
      denominations.b100 * 100 +
      denominations.b50 * 50 +
      denominations.b20 * 20 +
      denominations.b10 * 10 +
      denominations.b5 * 5 +
      denominations.b1 * 1 +
      parseFloat(denominations.coins || 0)
    );
  }, [denominations]);

  const effectivePhysicalCash = useMemo(() => {
    if (useDenomCalculator) return Math.round(denomSum * 100) / 100;
    const p = parseFloat(closePhysicalCount);
    return isNaN(p) ? (activeShift?.expectedCash || 0) : Math.round(p * 100) / 100;
  }, [useDenomCalculator, denomSum, closePhysicalCount, activeShift]);

  const activeVariance = useMemo(() => {
    if (!activeShift) return 0;
    const expected = activeShift.expectedCash || (activeShift.startingFloat + activeShift.cashSales);
    return Math.round((effectivePhysicalCash - expected) * 100) / 100;
  }, [activeShift, effectivePhysicalCash]);

  // Handle Closing Active Shift
  const handleCloseSubmit = async (e) => {
    e.preventDefault();
    if (!activeShift) return;
    try {
      await closeShift({
        shiftId: activeShift.id,
        physicalCashCount: effectivePhysicalCash,
        closedBy: user?.name || activeShift.staffName,
        notes: closeNotes || 'Shift reconciled and drawer sealed.',
        denominations: useDenomCalculator ? denominations : null
      });
      setIsCloseShiftModalOpen(false);
      setClosePhysicalCount('');
      setCloseNotes('');
    } catch (err) {
      console.error(err);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Shift Number', 'Staff Name', 'Role', 'Register', 'Opened At', 'Closed At', 'Status', 'Starting Float', 'Gross Sales', 'Cash Sales', 'Card Sales', 'KHQR Sales', 'Expected Cash', 'Actual Cash', 'Variance'];
    const rows = filteredShifts.map((s) => [
      s.shiftNumber,
      `"${s.staffName}"`,
      s.staffRole,
      `"${s.registerName}"`,
      s.openedAt || '',
      s.closedAt || '',
      s.status,
      s.startingFloat.toFixed(2),
      (s.totalGrossSales || 0).toFixed(2),
      (s.cashSales || 0).toFixed(2),
      (s.cardSales || 0).toFixed(2),
      (s.qrSales || 0).toFixed(2),
      (s.expectedCash || 0).toFixed(2),
      (s.actualCashCount || 0).toFixed(2),
      (s.variance || 0).toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shifts_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Shift audit ledger exported to CSV', 'success');
  };

  // Export Excel (.xlsx) using SheetJS
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['☕ AROMA COFFEE & ARTISAN BAKERY'],
      ['REGISTER SHIFTS AUDIT & RECONCILIATION MASTER LEDGER'],
      [`Store: Phnom Penh Flagship   |   Exported: ${new Date().toLocaleString('en-GB')}   |   Records: ${filteredShifts.length} Shifts`],
      [],
      [
        'Shift Number',
        'Staff Name',
        'Role',
        'Register Terminal',
        'Opened At',
        'Closed At',
        'Status',
        'Starting Float ($)',
        'Gross Sales ($)',
        'Cash Sales ($)',
        'KHQR Sales ($)',
        'Card Sales ($)',
        'Expected Cash ($)',
        'Actual Count ($)',
        'Variance ($)',
        'Audit Result'
      ]
    ];

    let sumSales = 0;
    let sumCash = 0;
    let sumQr = 0;
    let sumCard = 0;
    let sumExpected = 0;
    let sumActual = 0;
    let sumVariance = 0;

    filteredShifts.forEach((s) => {
      const sales = Number(s.totalGrossSales || 0);
      const cash = Number(s.cashSales || 0);
      const qr = Number(s.qrSales || 0);
      const card = Number(s.cardSales || 0);
      const expected = Number(s.expectedCash || 0);
      const actual = Number(s.actualCashCount || 0);
      const variance = Number(s.variance || 0);

      sumSales += sales;
      sumCash += cash;
      sumQr += qr;
      sumCard += card;
      sumExpected += expected;
      sumActual += actual;
      sumVariance += variance;

      rows.push([
        s.shiftNumber,
        s.staffName,
        s.staffRole,
        s.registerName,
        s.openedAt ? s.openedAt.replace('T', ' ').substring(0, 16) : '—',
        s.closedAt ? s.closedAt.replace('T', ' ').substring(0, 16) : 'ACTIVE',
        s.status,
        Number(s.startingFloat || 0),
        sales,
        cash,
        qr,
        card,
        expected,
        actual,
        variance,
        s.varianceStatus || (variance === 0 ? 'BALANCED' : variance > 0 ? 'OVERAGE' : 'SHORTAGE')
      ]);
    });

    // Grand Total Row
    rows.push([]);
    rows.push([
      'STORE TOTALS',
      `${filteredShifts.length} Shift Records`,
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      Math.round(sumSales * 100) / 100,
      Math.round(sumCash * 100) / 100,
      Math.round(sumQr * 100) / 100,
      Math.round(sumCard * 100) / 100,
      Math.round(sumExpected * 100) / 100,
      Math.round(sumActual * 100) / 100,
      Math.round(sumVariance * 100) / 100,
      sumVariance === 0 ? 'BALANCED' : sumVariance > 0 ? `NET OVER +$${sumVariance.toFixed(2)}` : `NET SHORT -$${Math.abs(sumVariance).toFixed(2)}`
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 15 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 15 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 15 } },
    ];
    ws['!rows'] = [{ hpt: 26 }, { hpt: 18 }, { hpt: 15 }, { hpt: 10 }];
    ws['!cols'] = [
      { wch: 20 },
      { wch: 18 },
      { wch: 14 },
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 16 },
      { wch: 16 },
      { wch: 15 },
      { wch: 18 }
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

    XLSX.utils.book_append_sheet(wb, ws, 'Shifts Audit');
    XLSX.writeFile(wb, `Shift_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Shift audit ledger exported to clean styled Excel (.xlsx)', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Shift Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Shift Card */}
        <div className={`p-5 rounded-2xl border transition-all ${
          activeShift 
            ? 'bg-gradient-to-br from-emerald-950/40 to-stone-900/80 border-emerald-500/40 shadow-lg shadow-emerald-950/20' 
            : 'bg-stone-900/60 border-stone-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Active Register Shift
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
              activeShift 
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' 
                : 'bg-stone-800 text-stone-400'
            }`}>
              {activeShift && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
              <span>{activeShift ? 'REGISTER OPEN' : 'DRAWER CLOSED'}</span>
            </span>
          </div>

          {activeShift ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-stone-100">{activeShift.staffName}</h4>
                  <p className="text-xs text-stone-400">{activeShift.registerName}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500 block">Current Gross:</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    ${(activeShift.totalGrossSales || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
                <span className="text-stone-400">Float: <strong>${activeShift.startingFloat.toFixed(2)}</strong></span>
                <span className="text-stone-400">Tickets: <strong>{activeShift.totalOrders || 0}</strong></span>
                <button
                  type="button"
                  onClick={() => openShiftModal('CLOSE')}
                  className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>Close Drawer</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-stone-400">Store is closed. No active register shift.</p>
              <button
                type="button"
                onClick={() => openShiftModal('OPEN')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Open Store / Shift</span>
              </button>
            </div>
          )}
        </div>

        {/* Closed Shifts Count */}
        <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
            Reconciled Shifts
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-stone-100 font-mono">
              {stats.closedCount}
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Across all terminals
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audited with Z-Reports</span>
          </p>
        </div>

        {/* Total Cash Variance */}
        <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
            Total Drawer Variance
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className={`text-2xl font-black font-mono ${
              stats.totalVariance === 0 
                ? 'text-emerald-400' 
                : stats.totalVariance > 0 
                ? 'text-sky-400' 
                : 'text-rose-400'
            }`}>
              {stats.totalVariance >= 0 ? `+$${stats.totalVariance.toFixed(2)}` : `-$${Math.abs(stats.totalVariance).toFixed(2)}`}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              stats.totalVariance === 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
            }`}>
              {stats.totalVariance === 0 ? 'PERFECT' : stats.totalVariance > 0 ? 'OVERAGE' : 'SHORTAGE'}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            Net physical cash vs expected ledger
          </p>
        </div>

        {/* Total Reconciled Sales */}
        <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
            Total Ledger Sales
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-400 font-mono">
              ${stats.totalSales.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-stone-400">
              {stats.totalTickets} tickets
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>Multi-tender: Cash, Card, KHQR</span>
          </p>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-900/50 p-3 rounded-2xl border border-stone-800">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by cashier, register station, or shift number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl py-2 pl-9 pr-3 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none transition"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 text-[11px]">
            {['ALL', 'OPEN', 'CLOSED', 'VARIANCE'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-amber-600 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'OPEN' ? 'Open' : st === 'CLOSED' ? 'Closed' : 'Variance'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-stone-850 hover:bg-stone-800 text-emerald-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-emerald-600/40 cursor-pointer shadow-sm"
            title="Download full multi-column Excel spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-850 text-stone-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-stone-800 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-400" />
            <span>CSV</span>
          </button>

          {!activeShift ? (
            <button
              type="button"
              onClick={() => openShiftModal('OPEN')}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 rounded-xl text-xs font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Open Register Shift</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openShiftModal('CLOSE')}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Close Shift & Z-Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Shifts Ledger Table */}
      <div className="bg-stone-900/60 rounded-2xl border border-stone-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-950/70 text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-4">Shift Details</th>
                <th className="py-3 px-4">Staff / Cashier</th>
                <th className="py-3 px-4">Terminal</th>
                <th className="py-3 px-4">Opened & Float</th>
                <th className="py-3 px-4">Closed & Reconciled</th>
                <th className="py-3 px-4 text-right">Sales Breakdown</th>
                <th className="py-3 px-4 text-right">Cash Variance</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-stone-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-sm">No shifts matching the selected filters.</p>
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => {
                  const isOpen = shift.status === 'OPEN';
                  const isBalanced = shift.variance === 0;
                  const isOverage = (shift.variance || 0) > 0;

                  return (
                    <tr
                      key={shift.id}
                      className="hover:bg-stone-800/40 transition group cursor-pointer"
                      onClick={() => setSelectedShiftForDetails(shift)}
                    >
                      {/* Shift Number & Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isOpen ? 'bg-emerald-400 animate-ping' : 'bg-stone-600'
                          }`}></span>
                          <div>
                            <span className="font-mono font-bold text-stone-200 block">
                              {shift.shiftNumber}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-0.5 inline-block ${
                              isOpen 
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                                : 'bg-stone-800 text-stone-400'
                            }`}>
                              {isOpen ? 'ACTIVE NOW' : 'CLOSED'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Staff Member */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                            {shift.staffName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-stone-200 block">{shift.staffName}</span>
                            <span className="text-[10px] text-stone-400 font-mono">{shift.staffRole}</span>
                          </div>
                        </div>
                      </td>

                      {/* Register Terminal */}
                      <td className="py-3.5 px-4">
                        <span className="text-stone-300 font-medium block">{shift.registerName}</span>
                        <span className="text-[10px] text-stone-500 font-mono">ID: {shift.id}</span>
                      </td>

                      {/* Opened At & Float */}
                      <td className="py-3.5 px-4">
                        <span className="text-stone-300 font-mono block">
                          {shift.openedAt ? shift.openedAt.replace('T', ' ').substring(0, 16) : '—'}
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono font-bold">
                          Float: ${shift.startingFloat.toFixed(2)}
                        </span>
                      </td>

                      {/* Closed At & Reconciled By */}
                      <td className="py-3.5 px-4">
                        {isOpen ? (
                          <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            In Progress...
                          </span>
                        ) : (
                          <div>
                            <span className="text-stone-300 font-mono block">
                              {shift.closedAt ? shift.closedAt.replace('T', ' ').substring(0, 16) : '—'}
                            </span>
                            <span className="text-[10px] text-stone-500 block">
                              By: {shift.closedBy || shift.staffName}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Sales Breakdown */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-stone-100 font-extrabold font-mono text-sm block">
                          ${(shift.totalGrossSales || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono block">
                          Cash: ${(shift.cashSales || 0).toFixed(2)} • QR: ${(shift.qrSales || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Cash Variance */}
                      <td className="py-3.5 px-4 text-right">
                        {isOpen ? (
                          <span className="text-stone-500 text-[11px] font-mono italic">Pending close</span>
                        ) : (
                          <div>
                            <span className={`font-mono font-black text-sm block ${
                              isBalanced 
                                ? 'text-emerald-400' 
                                : isOverage 
                                ? 'text-sky-400' 
                                : 'text-rose-400'
                            }`}>
                              {shift.variance >= 0 ? `+$${shift.variance.toFixed(2)}` : `-$${Math.abs(shift.variance).toFixed(2)}`}
                            </span>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              isBalanced ? 'bg-emerald-950 text-emerald-300' : isOverage ? 'bg-sky-950 text-sky-300' : 'bg-rose-950 text-rose-300'
                            }`}>
                              {shift.varianceStatus || (isBalanced ? 'BALANCED' : 'VARIANCE')}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedShiftForDetails(shift)}
                            className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-amber-400 rounded-lg transition cursor-pointer"
                            title="Inspect Shift & Z-Report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isOpen && (
                            <button
                              type="button"
                              onClick={() => openShiftModal('CLOSE')}
                              className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-[10px] font-bold transition cursor-pointer"
                              title="Close Shift Drawer"
                            >
                              Close
                            </button>
                          )}
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

      {/* MODAL 1: OPEN REGISTER SHIFT */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Unlock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-100">Open Register Cash Drawer Shift</h3>
                  <p className="text-xs text-stone-400">Initialize staff register float and audit ledger</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenSubmit} className="p-6 space-y-4">
              {/* Staff Member Picker */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Assign Shift Cashier / Operator
                </label>
                <select
                  value={openFormData.staffId}
                  onChange={(e) => {
                    const st = staffList.find((s) => s.id === e.target.value);
                    if (st) {
                      setOpenFormData((prev) => ({
                        ...prev,
                        staffId: st.id,
                        staffName: st.name,
                        staffRole: st.role
                      }));
                    }
                  }}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-semibold"
                >
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Register Station Picker */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Terminal / Register Station
                </label>
                <select
                  value={openFormData.registerName}
                  onChange={(e) => setOpenFormData((prev) => ({ ...prev, registerName: e.target.value }))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="Register #1 - Main Bar">Register #1 - Main Bar</option>
                  <option value="Register #2 - Express Takeaway">Register #2 - Express Takeaway</option>
                  <option value="Mobile POS - Patio Bar">Mobile POS - Patio Bar</option>
                </select>
              </div>

              {/* Starting Float Input & Presets */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-stone-300">
                    Physical Starting Float ($)
                  </label>
                  <span className="text-[11px] text-amber-400 font-mono">
                    ≈ ៛{Math.round(openFormData.startingFloat * 4100).toLocaleString()} KHR
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold">$</span>
                  <input
                    type="number"
                    step="5"
                    min="10"
                    value={openFormData.startingFloat}
                    onChange={(e) => setOpenFormData((prev) => ({ ...prev, startingFloat: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl py-2 pl-7 pr-3 text-sm font-bold font-mono text-amber-400 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[50, 100, 150, 200].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setOpenFormData((prev) => ({ ...prev, startingFloat: amt }))}
                      className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold border transition ${
                        openFormData.startingFloat === amt
                          ? 'bg-amber-600 text-stone-950 border-amber-500'
                          : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opening Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Opening Verification Notes
                </label>
                <input
                  type="text"
                  value={openFormData.notes}
                  onChange={(e) => setOpenFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl py-2 px-3 text-xs text-stone-200 focus:outline-none"
                  placeholder="e.g. Clean drawer, counted and verified with shift supervisor"
                />
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpenShiftModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300 text-xs font-semibold hover:bg-stone-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 text-xs font-extrabold shadow-md transition"
                >
                  Confirm & Open Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CLOSE REGISTER SHIFT & RECONCILIATION */}
      {isCloseShiftModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-100">Close Register & Balance Cash Drawer</h3>
                  <p className="text-xs text-stone-400">Shift #{activeShift.shiftNumber} • Operator: {activeShift.staffName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Financial Expected Breakdown */}
              <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Starting Float:</span>
                  <span className="font-mono text-stone-200 font-bold">${activeShift.startingFloat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Physical Cash Sales Today:</span>
                  <span className="font-mono text-emerald-400 font-bold">+${(activeShift.cashSales || 0).toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-stone-800 flex justify-between items-center">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                    System Expected Cash:
                  </span>
                  <span className="text-xl font-black text-amber-400 font-mono">
                    ${(activeShift.expectedCash || (activeShift.startingFloat + activeShift.cashSales)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Toggle Denomination Calculator */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-300">
                  {useDenomCalculator ? 'Denomination Bill Counter' : 'Physical Cash Count ($)'}
                </span>
                <button
                  type="button"
                  onClick={() => setUseDenomCalculator(!useDenomCalculator)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>{useDenomCalculator ? 'Enter Single Amount' : 'Use Bill Breakdown Counter'}</span>
                </button>
              </div>

              {useDenomCalculator ? (
                /* Denomination Inputs */
                <div className="grid grid-cols-3 gap-2 p-3 bg-stone-950 rounded-xl border border-stone-800">
                  {[
                    { key: 'b100', label: '$100 Bills', val: 100 },
                    { key: 'b50', label: '$50 Bills', val: 50 },
                    { key: 'b20', label: '$20 Bills', val: 20 },
                    { key: 'b10', label: '$10 Bills', val: 10 },
                    { key: 'b5', label: '$5 Bills', val: 5 },
                    { key: 'b1', label: '$1 Bills', val: 1 }
                  ].map((denom) => (
                    <div key={denom.key} className="p-2 rounded-lg bg-stone-900 border border-stone-800">
                      <span className="text-[10px] text-stone-400 block font-bold">{denom.label}</span>
                      <input
                        type="number"
                        min="0"
                        value={denominations[denom.key] || ''}
                        onChange={(e) => setDenominations((prev) => ({ ...prev, [denom.key]: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-stone-950 border border-stone-700 rounded-md py-1 px-2 text-xs font-mono font-bold text-stone-200 mt-1"
                        placeholder="0"
                      />
                    </div>
                  ))}
                  <div className="col-span-3 pt-2 flex justify-between items-center text-xs px-1">
                    <span className="text-stone-400">Total Counted:</span>
                    <span className="font-mono font-extrabold text-amber-400 text-sm">${denomSum.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                /* Direct Amount Input */
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-lg">$</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={closePhysicalCount}
                    onChange={(e) => setClosePhysicalCount(e.target.value)}
                    placeholder={(activeShift.expectedCash || 0).toFixed(2)}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl py-2.5 pl-9 pr-4 text-xl font-bold font-mono text-amber-400 focus:outline-none"
                  />
                </div>
              )}

              {/* Dynamic Live Variance Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                activeVariance === 0
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300'
                  : activeVariance > 0
                  ? 'bg-sky-950/40 border-sky-600/50 text-sky-300'
                  : 'bg-rose-950/40 border-rose-600/50 text-rose-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  {activeVariance === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className={`w-5 h-5 ${activeVariance > 0 ? 'text-sky-400' : 'text-rose-400'}`} />
                  )}
                  <div>
                    <span className="text-xs font-bold block">
                      {activeVariance === 0 ? 'Drawer Perfectly Balanced ($0.00)' : activeVariance > 0 ? 'Cash Overage Detected' : 'Cash Shortage Detected'}
                    </span>
                    <span className="text-[10px] opacity-75">
                      Physical: ${effectivePhysicalCash.toFixed(2)} vs Expected: ${(activeShift.expectedCash || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <span className="text-xl font-mono font-black">
                  {activeVariance >= 0 ? `+$${activeVariance.toFixed(2)}` : `-$${Math.abs(activeVariance).toFixed(2)}`}
                </span>
              </div>

              {/* Closing Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Reconciliation Notes & Handover Sign-off
                </label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl py-2 px-3 text-xs text-stone-200 focus:outline-none"
                  placeholder="e.g. Cash drawer checked and sealed for evening bank deposit."
                />
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300 text-xs font-semibold hover:bg-stone-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Finalize & Seal Shift</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SHIFT DETAILS & PRINTABLE Z-REPORT */}
      {selectedShiftForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-100">
                    Shift Z-Report & Audit Summary
                  </h3>
                  <p className="text-xs text-stone-400 font-mono">
                    {selectedShiftForDetails.shiftNumber} • {selectedShiftForDetails.registerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedShiftForDetails(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 font-sans">
              {/* Receipt Header Card */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-center space-y-1">
                <h4 className="text-sm font-extrabold text-stone-100 uppercase tracking-widest">
                  COFFEE POS • REGISTER Z-REPORT
                </h4>
                <p className="text-[11px] text-stone-400">
                  Phnom Penh, Cambodia • NBC Bakong Integrated
                </p>
                <div className="pt-2 text-[11px] text-stone-400 flex justify-between border-t border-stone-800/80">
                  <span>Operator: <strong>{selectedShiftForDetails.staffName}</strong></span>
                  <span>Role: <strong>{selectedShiftForDetails.staffRole}</strong></span>
                </div>
                <div className="text-[10px] text-stone-500 flex justify-between font-mono">
                  <span>Opened: {selectedShiftForDetails.openedAt ? selectedShiftForDetails.openedAt.replace('T', ' ').substring(0, 16) : '—'}</span>
                  <span>Closed: {selectedShiftForDetails.closedAt ? selectedShiftForDetails.closedAt.replace('T', ' ').substring(0, 16) : 'ACTIVE'}</span>
                </div>
              </div>

              {/* Financial Tally Grid */}
              <div className="space-y-2 p-4 rounded-2xl bg-stone-950/60 border border-stone-800 text-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block mb-2">
                  Revenue & Tender Summary
                </span>
                <div className="flex justify-between py-1">
                  <span className="text-stone-400">Total Gross Sales:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    ${(selectedShiftForDetails.totalGrossSales || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-t border-stone-800/60">
                  <span className="text-stone-400 flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-emerald-400" /> Physical Cash Sales:
                  </span>
                  <span className="font-mono text-stone-200">
                    ${(selectedShiftForDetails.cashSales || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-t border-stone-800/60">
                  <span className="text-stone-400 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-rose-400" /> Bakong KHQR Sales:
                  </span>
                  <span className="font-mono text-stone-200">
                    ${(selectedShiftForDetails.qrSales || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-t border-stone-800/60">
                  <span className="text-stone-400 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-sky-400" /> Credit / Debit Card:
                  </span>
                  <span className="font-mono text-stone-200">
                    ${(selectedShiftForDetails.cardSales || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-t border-stone-800/60">
                  <span className="text-stone-400">Total Customer Orders:</span>
                  <span className="font-mono text-stone-200">
                    {selectedShiftForDetails.totalOrders || 0} tickets
                  </span>
                </div>
              </div>

              {/* Cash Reconciliation */}
              <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block mb-2">
                  Drawer Reconciliation & Float
                </span>
                <div className="flex justify-between">
                  <span className="text-stone-400">Starting Float:</span>
                  <span className="font-mono text-stone-200">${selectedShiftForDetails.startingFloat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Expected Cash in Drawer:</span>
                  <span className="font-mono text-stone-200">${(selectedShiftForDetails.expectedCash || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Actual Physical Count:</span>
                  <span className="font-mono text-amber-400 font-bold">${(selectedShiftForDetails.actualCashCount || 0).toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-stone-800 flex justify-between items-center">
                  <span className="font-extrabold text-stone-300">Variance:</span>
                  <span className={`font-mono font-black text-sm ${
                    selectedShiftForDetails.variance === 0 
                      ? 'text-emerald-400' 
                      : (selectedShiftForDetails.variance || 0) > 0 
                      ? 'text-sky-400' 
                      : 'text-rose-400'
                  }`}>
                    {selectedShiftForDetails.variance >= 0 ? `+$${(selectedShiftForDetails.variance || 0).toFixed(2)}` : `-$${Math.abs(selectedShiftForDetails.variance || 0).toFixed(2)}`}
                  </span>
                </div>
              </div>

              {selectedShiftForDetails.closingNotes && (
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs">
                  <span className="text-stone-500 block text-[10px] font-bold uppercase">Supervisor Sign-Off Notes:</span>
                  <p className="text-stone-300 italic mt-0.5">&ldquo;{selectedShiftForDetails.closingNotes}&rdquo;</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Z-Report</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedShiftForDetails(null)}
                className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
