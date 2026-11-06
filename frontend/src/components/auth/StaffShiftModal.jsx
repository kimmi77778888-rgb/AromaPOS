import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import * as XLSX from 'xlsx';
import { 
  Lock, 
  Unlock, 
  DollarSign, 
  Coins, 
  Receipt, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Clock, 
  Banknote, 
  CreditCard, 
  QrCode, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  ChevronRight, 
  Sparkles, 
  UserCheck, 
  Calendar,
  Building2,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  ArrowRight
} from 'lucide-react';
import { soundService } from '../../services/soundService';

export const StaffShiftModal = ({ isOpen, onClose, initialMode = 'AUTO' }) => {
  const { 
    activeShift, 
    shifts, 
    openShift, 
    closeShift, 
    recordCashMovement, 
    staffList, 
    user, 
    showToast,
    loadShifts,
    lockScreen
  } = useApp();

  const { t, isKhmer, formatUSD, formatKHR, khrExchangeRate } = useLanguage();

  // Mode: 'OPEN', 'ACTIVE', 'CLOSE', 'REPORT', 'HISTORY'
  const [currentMode, setCurrentMode] = useState('OPEN');
  const [reportShift, setReportShift] = useState(null); // Shift for Z-Report view

  // Close wizard step: 1 (Review), 2 (Cash Count), 3 (Finalize & Z-Report)
  const [closeStep, setCloseStep] = useState(1);

  // -------------------------------------------------------------
  // OPEN SHIFT FORM STATE
  // -------------------------------------------------------------
  const [openStaffId, setOpenStaffId] = useState(user?.id || 'usr-1');
  const [openRegisterName, setOpenRegisterName] = useState('Register #1 - Main Bar');
  const [openFloatUSD, setOpenFloatUSD] = useState(100);
  const [openFloatKHR, setOpenFloatKHR] = useState(0);
  const [openNotes, setOpenNotes] = useState('Morning drawer count verified and sealed.');
  const [openUseDenom, setOpenUseDenom] = useState(false);
  const [openDenoms, setOpenDenoms] = useState({
    b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, b1: 0,
    k50000: 0, k20000: 0, k10000: 0, k5000: 0, k1000: 0, k500: 0
  });

  // -------------------------------------------------------------
  // CASH MOVEMENT (CASH IN / PAY OUT DROPS)
  // -------------------------------------------------------------
  const [showCashMovementForm, setShowCashMovementForm] = useState(false);
  const [movementType, setMovementType] = useState('CASH_OUT'); // 'CASH_IN' or 'CASH_OUT'
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('Safe drop to store safe');

  // -------------------------------------------------------------
  // CLOSE SHIFT RECONCILIATION STATE
  // -------------------------------------------------------------
  const [closeCashUSD, setCloseCashUSD] = useState('');
  const [closeCashKHR, setCloseCashKHR] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [closeUseDenom, setCloseUseDenom] = useState(false);
  const [closeDenoms, setCloseDenoms] = useState({
    b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, b1: 0,
    k50000: 0, k20000: 0, k10000: 0, k5000: 0, k1000: 0, k500: 0
  });
  const [isSupervisorConfirmed, setIsSupervisorConfirmed] = useState(false);

  // Determine initial mode on modal open
  useEffect(() => {
    if (!isOpen) return;

    if (initialMode === 'OPEN') {
      setCurrentMode('OPEN');
    } else if (initialMode === 'CLOSE') {
      if (activeShift) {
        setCurrentMode('CLOSE');
        setCloseStep(1);
      } else {
        setCurrentMode('OPEN');
      }
    } else if (initialMode === 'ACTIVE') {
      setCurrentMode(activeShift ? 'ACTIVE' : 'OPEN');
    } else {
      // AUTO
      if (activeShift) {
        setCurrentMode('ACTIVE');
      } else {
        setCurrentMode('OPEN');
      }
    }

    if (user?.id) {
      setOpenStaffId(user.id);
    }
    setCloseStep(1);
    setIsSupervisorConfirmed(false);
  }, [isOpen, initialMode, activeShift, user]);

  // Denomination Sum calculations
  const calcDenomTotalUSD = (denoms) => {
    const usdTotal = 
      (denoms.b100 || 0) * 100 +
      (denoms.b50 || 0) * 50 +
      (denoms.b20 || 0) * 20 +
      (denoms.b10 || 0) * 10 +
      (denoms.b5 || 0) * 5 +
      (denoms.b1 || 0) * 1;
    
    const khrTotal = 
      (denoms.k50000 || 0) * 50000 +
      (denoms.k20000 || 0) * 20000 +
      (denoms.k10000 || 0) * 10000 +
      (denoms.k5000 || 0) * 5000 +
      (denoms.k1000 || 0) * 1000 +
      (denoms.k500 || 0) * 500;

    const khrInUSD = khrTotal / khrExchangeRate;
    return Math.round((usdTotal + khrInUSD) * 100) / 100;
  };

  // Open Float Effective
  const totalOpenFloatUSD = useMemo(() => {
    if (openUseDenom) {
      return calcDenomTotalUSD(openDenoms);
    }
    const usd = parseFloat(openFloatUSD) || 0;
    const khr = (parseFloat(openFloatKHR) || 0) / khrExchangeRate;
    return Math.round((usd + khr) * 100) / 100;
  }, [openUseDenom, openDenoms, openFloatUSD, openFloatKHR, khrExchangeRate]);

  // Close Physical Count Effective
  const totalClosePhysicalUSD = useMemo(() => {
    if (closeUseDenom) {
      return calcDenomTotalUSD(closeDenoms);
    }
    const usd = parseFloat(closeCashUSD) || 0;
    const khr = (parseFloat(closeCashKHR) || 0) / khrExchangeRate;
    if (closeCashUSD === '' && closeCashKHR === '' && activeShift) {
      return activeShift.expectedCash || 0;
    }
    return Math.round((usd + khr) * 100) / 100;
  }, [closeUseDenom, closeDenoms, closeCashUSD, closeCashKHR, activeShift, khrExchangeRate]);

  // Expected Cash for active shift
  const expectedCashAmount = useMemo(() => {
    if (!activeShift) return 0;
    const base = activeShift.expectedCash !== undefined 
      ? activeShift.expectedCash 
      : (activeShift.startingFloat + (activeShift.cashSales || 0));
    return Math.round(base * 100) / 100;
  }, [activeShift]);

  // Variance = Physical Count - Expected Cash
  const currentVariance = useMemo(() => {
    return Math.round((totalClosePhysicalUSD - expectedCashAmount) * 100) / 100;
  }, [totalClosePhysicalUSD, expectedCashAmount]);

  // Elapsed time for active shift
  const elapsedTimeStr = useMemo(() => {
    if (!activeShift?.openedAt) return '0h 0m';
    try {
      const start = new Date(activeShift.openedAt).getTime();
      const diffMs = Math.max(0, Date.now() - start);
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${mins}m`;
    } catch (e) {
      return '—';
    }
  }, [activeShift]);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleOpenShiftSubmit = async (e) => {
    if (e) e.preventDefault();
    const selectedStaff = staffList.find((s) => s.id === openStaffId) || user || {
      id: 'usr-1',
      name: 'Cashier Staff',
      role: 'CASHIER'
    };

    try {
      const payload = {
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        staffRole: selectedStaff.role || 'CASHIER',
        registerName: openRegisterName,
        startingFloat: totalOpenFloatUSD,
        notes: openNotes || 'Register opened with starting cash float.',
        denominations: openUseDenom ? openDenoms : null
      };

      await openShift(payload);
      soundService.playCashRegisterSound();
      showToast(
        isKhmer
          ? 'បានបើកហាង & ថតប្រាក់ដោយជោគជ័យ! អ្នកអាចចាប់ផ្តើមលក់បានហើយ'
          : 'Store & register successfully opened! You can now start selling.',
        'success'
      );
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCashMovementSubmit = async (e) => {
    if (e) e.preventDefault();
    const amt = parseFloat(movementAmount);
    if (!amt || amt <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }
    if (!activeShift) return;

    try {
      await recordCashMovement({
        shiftId: activeShift.id,
        type: movementType,
        amount: amt,
        reason: movementReason || (movementType === 'CASH_IN' ? 'Float top-up' : 'Petty cash drop'),
        performedBy: user?.name || activeShift.staffName
      });
      soundService.playCashRegisterSound();
      setMovementAmount('');
      setShowCashMovementForm(false);
      showToast(`Recorded ${movementType === 'CASH_IN' ? 'Cash-In (+$' + amt.toFixed(2) + ')' : 'Cash Drop (-$' + amt.toFixed(2) + ')'}`, 'success');
    } catch (err) {
      showToast('Failed to record cash movement: ' + err.message, 'error');
    }
  };

  const handleCloseShiftSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!activeShift) return;

    try {
      const closed = await closeShift({
        shiftId: activeShift.id,
        physicalCashCount: totalClosePhysicalUSD,
        closedBy: user?.name || activeShift.staffName,
        notes: closeNotes || (currentVariance === 0 ? 'Shift drawer reconciled balanced.' : `Drawer discrepancy: ${currentVariance > 0 ? '+$' + currentVariance.toFixed(2) : '-$' + Math.abs(currentVariance).toFixed(2)}`),
        denominations: closeUseDenom ? closeDenoms : null
      });

      soundService.playCashRegisterSound();
      setReportShift(closed);
      setCloseStep(3);
    } catch (err) {
      showToast('Failed to finalize shift: ' + err.message, 'error');
    }
  };

  // -------------------------------------------------------------
  // EXPORT TO EXCEL (.XLSX)
  // -------------------------------------------------------------
  const handleExportExcel = (targetShift = (reportShift || activeShift)) => {
    if (!targetShift) return;
    const s = targetShift;

    const wb = XLSX.utils.book_new();

    const data = [
      ['☕ AROMA COFFEE & ARTISAN BAKERY'],
      ['OFFICIAL REGISTER SHIFT CLOSURE & Z-REPORT AUDIT'],
      [`Store: Phnom Penh Flagship   |   Generated: ${new Date().toLocaleString('en-GB')}   |   Exchange: 1 USD = 4,100 KHR`],
      [],
      ['1. REGISTER SHIFT INFORMATION', 'DETAILS'],
      ['Shift Identifier', s.shiftNumber || s.id],
      ['Register Station', s.registerName || 'Register #1 - Main Bar'],
      ['Cashier / Operator', s.staffName],
      ['Operator Role', s.staffRole || 'CASHIER'],
      ['Shift Status', s.status],
      ['Opened Timestamp', s.openedAt ? s.openedAt.replace('T', ' ') : '—'],
      ['Closed Timestamp', s.closedAt ? s.closedAt.replace('T', ' ') : 'CURRENTLY ACTIVE'],
      ['Closed By Auditor', s.closedBy || s.staffName],
      [],
      ['2. SALES & TENDER RECONCILIATION', 'AMOUNT (USD) / METRICS'],
      ['Gross Sales Revenue ($)', Number(s.totalGrossSales || 0)],
      ['Gross Sales in KHR (៛)', Math.round(Number(s.totalGrossSales || 0) * khrExchangeRate)],
      ['Total Tickets Processed', Number(s.totalOrders || 0)],
      ['Cash Sales Tendered ($)', Number(s.cashSales || 0)],
      ['Bakong KHQR Sales ($)', Number(s.qrSales || 0)],
      ['Credit/Debit Card Sales ($)', Number(s.cardSales || 0)],
      ['Refunds Processed ($)', Number(s.refunds || 0)],
      [],
      ['3. CASH DRAWER & VARIANCE RECONCILIATION', 'AMOUNT (USD)'],
      ['Opening Starting Float ($)', Number(s.startingFloat || 0)],
      ['Cash Sales Tendered ($)', Number(s.cashSales || 0)],
      ['Cash Pay-Ins / Additions ($)', Number(s.payIns || 0)],
      ['Cash Pay-Outs / Drops ($)', Number(s.payOuts || 0)],
      ['System Expected Cash ($)', Number(s.expectedCash || 0)],
      ['Actual Physical Cash Counted ($)', Number(s.actualCashCount || totalClosePhysicalUSD || 0)],
      ['Variance Discrepancy ($)', Number(s.variance !== undefined ? s.variance : currentVariance)],
      ['Variance Audit Result', s.varianceStatus || (currentVariance === 0 ? 'BALANCED ($0.00)' : currentVariance > 0 ? `OVERAGE (+${currentVariance.toFixed(2)})` : `SHORTAGE (-$${Math.abs(currentVariance).toFixed(2)})`)],
      [],
      ['4. AUDITOR NOTES & SIGN-OFF', 'REMARKS'],
      ['Opening Notes', s.openingNotes || '—'],
      ['Closing Handover Notes', s.closingNotes || closeNotes || '—']
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
      { s: { r: 14, c: 0 }, e: { r: 14, c: 1 } },
      { s: { r: 23, c: 0 }, e: { r: 23, c: 1 } },
      { s: { r: 33, c: 0 }, e: { r: 33, c: 1 } },
    ];

    ws['!rows'] = [
      { hpt: 26 },
      { hpt: 18 },
      { hpt: 15 },
      { hpt: 10 }
    ];

    ws['!cols'] = [
      { wch: 38 },
      { wch: 32 }
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

    XLSX.utils.book_append_sheet(wb, ws, 'Z-Report Summary');
    XLSX.writeFile(wb, `Z_Report_${s.shiftNumber || 'Shift'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Z-Report exported to clean styled Excel (.xlsx)', 'success');
  };

  // -------------------------------------------------------------
  // EXPORT TO CSV
  // -------------------------------------------------------------
  const handleExportCSV = (targetShift = (reportShift || activeShift)) => {
    if (!targetShift) return;
    const s = targetShift;
    const rows = [
      ['Shift Number', s.shiftNumber || s.id],
      ['Terminal', s.registerName],
      ['Operator', s.staffName],
      ['Role', s.staffRole],
      ['Status', s.status],
      ['Opened At', s.openedAt],
      ['Closed At', s.closedAt || 'ACTIVE'],
      ['Starting Float USD', (s.startingFloat || 0).toFixed(2)],
      ['Total Gross Sales USD', (s.totalGrossSales || 0).toFixed(2)],
      ['Cash Sales USD', (s.cashSales || 0).toFixed(2)],
      ['KHQR Sales USD', (s.qrSales || 0).toFixed(2)],
      ['Card Sales USD', (s.cardSales || 0).toFixed(2)],
      ['Expected Cash USD', (s.expectedCash || 0).toFixed(2)],
      ['Actual Cash USD', (s.actualCashCount || 0).toFixed(2)],
      ['Variance USD', (s.variance || 0).toFixed(2)],
      ['Audit Status', s.varianceStatus || 'BALANCED']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => `"${r[0]}","${r[1]}"`).join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Z_Report_${s.shiftNumber || 'Shift'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Z-Report exported to CSV', 'success');
  };

  // -------------------------------------------------------------
  // PRINT ACTION
  // -------------------------------------------------------------
  const handlePrintSlip = () => {
    window.print();
  };

  if (!isOpen) return null;

  const displayShift = reportShift || activeShift;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      {/* Hidden printable receipt / A4 sheet that isolates during window.print() */}
      <div id="pos-shift-print-slip" className="hidden">
        {displayShift && (
          <div style={{ fontFamily: 'monospace', padding: '10px', maxWidth: '300px', margin: '0 auto', color: '#000000', background: '#ffffff' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>AROMA COFFEE POS</h2>
              <p style={{ fontSize: '11px', margin: '0 0 2px 0' }}>REGISTER SHIFT {displayShift.status === 'CLOSED' ? 'Z-REPORT' : 'X-REPORT'}</p>
              <p style={{ fontSize: '10px', margin: '0' }}>Phnom Penh Flagship • Cambodia</p>
            </div>

            <div style={{ fontSize: '11px', lineHeight: '1.4', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
              <div>Shift #: <strong>{displayShift.shiftNumber}</strong></div>
              <div>Station: {displayShift.registerName}</div>
              <div>Operator: {displayShift.staffName} ({displayShift.staffRole})</div>
              <div>Opened: {displayShift.openedAt ? displayShift.openedAt.replace('T', ' ').substring(0, 16) : '—'}</div>
              <div>Closed: {displayShift.closedAt ? displayShift.closedAt.replace('T', ' ').substring(0, 16) : 'STILL OPEN'}</div>
            </div>

            <div style={{ fontSize: '11px', lineHeight: '1.4', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GROSS REVENUE:</span>
                <strong>${(displayShift.totalGrossSales || 0).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#555' }}>
                <span>KHR Equivalent:</span>
                <span>៛{Math.round((displayShift.totalGrossSales || 0) * khrExchangeRate).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Orders:</span>
                <span>{displayShift.totalOrders || 0} tickets</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Cash Sales:</span>
                <span>+${(displayShift.cashSales || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Bakong KHQR:</span>
                <span>${(displayShift.qrSales || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Card Sales:</span>
                <span>${(displayShift.cardSales || 0).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ fontSize: '11px', lineHeight: '1.4', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Starting Float:</span>
                <span>${(displayShift.startingFloat || 0).toFixed(2)}</span>
              </div>
              {(displayShift.payIns || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>+ Cash-In:</span>
                  <span>+${(displayShift.payIns || 0).toFixed(2)}</span>
                </div>
              )}
              {(displayShift.payOuts || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>- Cash Drops:</span>
                  <span>-${(displayShift.payOuts || 0).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>EXPECTED CASH:</span>
                <span>${(displayShift.expectedCash || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>ACTUAL CASH:</span>
                <span>${(displayShift.actualCashCount || totalClosePhysicalUSD || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '4px', borderTop: '1px solid #000', paddingTop: '2px' }}>
                <span>VARIANCE:</span>
                <span>{(displayShift.variance !== undefined ? displayShift.variance : currentVariance) >= 0 ? `+$${(displayShift.variance !== undefined ? displayShift.variance : currentVariance).toFixed(2)}` : `-$${Math.abs(displayShift.variance !== undefined ? displayShift.variance : currentVariance).toFixed(2)}`}</span>
              </div>
              <div style={{ fontSize: '10px', textAlign: 'right' }}>
                Status: {displayShift.varianceStatus || (currentVariance === 0 ? 'BALANCED' : currentVariance > 0 ? 'OVERAGE' : 'SHORTAGE')}
              </div>
            </div>

            <div style={{ fontSize: '10px', marginTop: '16px', textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', margin: '20px 20px 4px 20px' }}></div>
              <div>Operator Signature</div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', margin: '24px 20px 4px 20px' }}></div>
              <div>Manager / Auditor Signature</div>
              <p style={{ margin: '10px 0 0 0', fontSize: '9px', color: '#666' }}>End of Z-Report • Powered by AromaPOS</p>
            </div>
          </div>
        )}
      </div>

      {/* Main UI Dialog */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${
              activeShift 
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-500'
            }`}>
              {activeShift ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-100">
                  {isKhmer ? 'ការគ្រប់គ្រងវេនការងារ & ថតប្រាក់ (Shift Management)' : 'Cash Drawer & Shift Management'}
                </h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                  activeShift 
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' 
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}>
                  {activeShift ? (isKhmer ? 'កំពុងបើកដំណើរការ' : 'Register Open') : (isKhmer ? 'បានបិទ' : 'Register Closed')}
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">
                {activeShift 
                  ? `${activeShift.registerName} • ${activeShift.staffName} (${elapsedTimeStr})` 
                  : (isKhmer ? 'បើកវេនថ្មីដើម្បីចាប់ផ្តើមទទួលការទូទាត់' : 'Open register drawer to initialize shift & cash float')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Mode Bar */}
        <div className="px-4 py-2 border-b border-stone-800/80 bg-stone-950/40 flex items-center gap-2 overflow-x-auto">
          {activeShift ? (
            <>
              <button
                type="button"
                onClick={() => setCurrentMode('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  currentMode === 'ACTIVE'
                    ? 'bg-amber-600 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'វេនសកម្ម (X-Report)' : 'Active Shift (X-Report)'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentMode('CLOSE');
                  setCloseStep(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  currentMode === 'CLOSE'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'បិទវេន (Z-Report)' : 'Close Register (Z-Report)'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentMode('OPEN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                currentMode === 'OPEN'
                  ? 'bg-amber-600 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'បើកហាង/វេនថ្មី' : 'Open Store / Shift'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setCurrentMode('HISTORY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              currentMode === 'HISTORY'
                ? 'bg-stone-800 text-stone-100 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'ប្រវត្តិវេនការងារ' : 'Shift Audit History'}</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* ============================================================ */}
          {/* TAB 1: OPEN REGISTER SHIFT                                   */}
          {/* ============================================================ */}
          {currentMode === 'OPEN' && (
            <form onSubmit={handleOpenShiftSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  {isKhmer
                    ? 'សូមរាប់ចំនួនទឹកប្រាក់បឋម (Float) ទាំងជាដុល្លារ ($) និងប្រាក់រៀល (៛) មុនពេលចាប់ផ្តើមទទួលការបញ្ជាទិញ។ ប្រព័ន្ធនឹងកត់ត្រាដោយស្វ័យប្រវត្តិ។'
                    : 'Count and verify the starting cash float in both USD ($) and Khmer Riel (៛) before starting sales. All cashier activity is logged.'}
                </p>
              </div>

              {/* Cashier & Terminal Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    {isKhmer ? 'បុគ្គលិកទទួលវេន' : 'Shift Operator / Cashier'}
                  </label>
                  <select
                    value={openStaffId}
                    onChange={(e) => setOpenStaffId(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-stone-100 focus:outline-none"
                  >
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    {isKhmer ? 'ស្ថានីយ / ម៉ាស៊ីន POS' : 'Register Terminal'}
                  </label>
                  <select
                    value={openRegisterName}
                    onChange={(e) => setOpenRegisterName(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-stone-100 focus:outline-none"
                  >
                    <option value="Register #1 - Main Bar">Register #1 - Main Bar</option>
                    <option value="Register #2 - Express Takeaway">Register #2 - Express Takeaway</option>
                    <option value="Mobile POS - Patio Bar">Mobile POS - Patio Bar</option>
                  </select>
                </div>
              </div>

              {/* Starting Float Inputs */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-300">
                    {isKhmer ? 'ទឹកប្រាក់បឋមក្នុងថត (Starting Cash Float)' : 'Starting Cash Float'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenUseDenom(!openUseDenom)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>{openUseDenom ? 'Simple Amount' : 'Bill Counter'}</span>
                  </button>
                </div>

                {!openUseDenom ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-stone-400 block mb-1 font-semibold">USD Float ($)</span>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold">$</span>
                          <input
                            type="number"
                            step="5"
                            min="0"
                            value={openFloatUSD}
                            onChange={(e) => setOpenFloatUSD(e.target.value)}
                            className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-xl py-2 pl-8 pr-3 text-base font-mono font-bold text-amber-400 focus:outline-none"
                            placeholder="100.00"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-stone-400 block mb-1 font-semibold">Khmer Riel Float (៛)</span>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold">៛</span>
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            value={openFloatKHR}
                            onChange={(e) => setOpenFloatKHR(e.target.value)}
                            className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-xl py-2 pl-8 pr-3 text-base font-mono font-bold text-amber-400 focus:outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex gap-2">
                      {[50, 100, 150, 200].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setOpenFloatUSD(amt);
                            setOpenFloatKHR(0);
                          }}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
                            parseFloat(openFloatUSD) === amt && parseFloat(openFloatKHR) === 0
                              ? 'bg-amber-600 text-stone-950 border-amber-500 shadow-sm'
                              : 'bg-stone-900 text-stone-400 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Denomination Bill Breakdown */
                  <div className="space-y-3">
                    <span className="text-[11px] text-stone-400 block font-semibold">USD Bills</span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { key: 'b100', label: '$100' },
                        { key: 'b50', label: '$50' },
                        { key: 'b20', label: '$20' },
                        { key: 'b10', label: '$10' },
                        { key: 'b5', label: '$5' },
                        { key: 'b1', label: '$1' }
                      ].map((d) => (
                        <div key={d.key} className="p-2 rounded-xl bg-stone-900 border border-stone-800">
                          <span className="text-[10px] text-stone-400 font-bold block">{d.label}</span>
                          <input
                            type="number"
                            min="0"
                            value={openDenoms[d.key] || ''}
                            onChange={(e) => setOpenDenoms((prev) => ({ ...prev, [d.key]: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1 text-xs font-mono font-bold text-stone-100 mt-1"
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>

                    <span className="text-[11px] text-stone-400 block font-semibold mt-2">Khmer Riel Notes (៛)</span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { key: 'k50000', label: '50,000៛' },
                        { key: 'k20000', label: '20,000៛' },
                        { key: 'k10000', label: '10,000៛' },
                        { key: 'k5000', label: '5,000៛' },
                        { key: 'k1000', label: '1,000៛' },
                        { key: 'k500', label: '500៛' }
                      ].map((d) => (
                        <div key={d.key} className="p-2 rounded-xl bg-stone-900 border border-stone-800">
                          <span className="text-[10px] text-stone-400 font-bold block">{d.label}</span>
                          <input
                            type="number"
                            min="0"
                            value={openDenoms[d.key] || ''}
                            onChange={(e) => setOpenDenoms((prev) => ({ ...prev, [d.key]: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1 text-xs font-mono font-bold text-stone-100 mt-1"
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Combined Total Float Display */}
                <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-bold">Total Opening Float:</span>
                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-amber-400 block">
                      ${totalOpenFloatUSD.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono">
                      ≈ ៛{Math.round(totalOpenFloatUSD * khrExchangeRate).toLocaleString()} KHR
                    </span>
                  </div>
                </div>
              </div>

              {/* Opening Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  {isKhmer ? 'កំណត់ចំណាំពេលបើកវេន' : 'Opening Verification Notes'}
                </label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none"
                  placeholder="e.g. Cash drawer verified clean and counted."
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-stone-700 text-stone-300 text-xs font-semibold hover:bg-stone-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 text-xs font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{isKhmer ? 'បញ្ជាក់ & បើកថតប្រាក់' : 'Confirm & Open Register Drawer'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* TAB 2: ACTIVE SHIFT DASHBOARD (X-REPORT & CASH MOVEMENTS)    */}
          {/* ============================================================ */}
          {currentMode === 'ACTIVE' && activeShift && (
            <div className="space-y-4">
              {/* Top Shift Status Card */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-extrabold text-stone-200 uppercase tracking-wider">
                      {activeShift.shiftNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-bold">
                      {activeShift.registerName}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    Operator: <strong className="text-stone-200">{activeShift.staffName}</strong> • Elapsed: <strong>{elapsedTimeStr}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'ចាប់ផ្តើមលក់ក្នុង POS' : 'Go to POS'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintSlip}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print X-Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMode('CLOSE');
                      setCloseStep(1);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Close Shift</span>
                  </button>
                </div>
              </div>

              {/* 4 Live Shift KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                    Gross Revenue
                  </span>
                  <span className="text-lg font-black font-mono text-amber-400 block mt-0.5">
                    ${(activeShift.totalGrossSales || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {activeShift.totalOrders || 0} tickets
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                    Cash in Drawer
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-400 block mt-0.5">
                    ${expectedCashAmount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Float: ${(activeShift.startingFloat || 0).toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                    Bakong KHQR
                  </span>
                  <span className="text-lg font-black font-mono text-rose-400 block mt-0.5">
                    ${(activeShift.qrSales || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    NBC Integrated
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                    Card Sales
                  </span>
                  <span className="text-lg font-black font-mono text-sky-400 block mt-0.5">
                    ${(activeShift.cardSales || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    Terminal POS
                  </span>
                </div>
              </div>

              {/* Cash Movements Ledger & Quick Drop / Add Action */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                      {isKhmer ? 'ចលនាទឹកប្រាក់ក្នុងថត (Cash Drops & Payouts)' : 'Cash Drawer Movements'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCashMovementForm(!showCashMovementForm)}
                    className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>{showCashMovementForm ? 'Hide Form' : '+ Record Cash Drop / In'}</span>
                  </button>
                </div>

                {showCashMovementForm && (
                  <form onSubmit={handleCashMovementSubmit} className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-2.5 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold block mb-1">Type</span>
                        <select
                          value={movementType}
                          onChange={(e) => setMovementType(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1.5 text-xs font-bold text-stone-200"
                        >
                          <option value="CASH_OUT">Cash Drop / Pay-Out (-)</option>
                          <option value="CASH_IN">Cash In / Float Top-Up (+)</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-stone-400 font-bold block mb-1">Amount ($)</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={movementAmount}
                          onChange={(e) => setMovementAmount(e.target.value)}
                          placeholder="e.g. 50.00"
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1.5 text-xs font-bold font-mono text-amber-400"
                          required
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-stone-400 font-bold block mb-1">Reason / Notes</span>
                        <input
                          type="text"
                          value={movementReason}
                          onChange={(e) => setMovementReason(e.target.value)}
                          placeholder="e.g. Safe deposit drop"
                          className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1.5 text-xs text-stone-200"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowCashMovementForm(false)}
                        className="px-3 py-1 rounded-lg text-xs text-stone-400 hover:text-stone-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-sm cursor-pointer"
                      >
                        Save Movement
                      </button>
                    </div>
                  </form>
                )}

                {/* History of movements */}
                <div className="text-xs">
                  {(!activeShift.cashMovements || activeShift.cashMovements.length === 0) ? (
                    <p className="text-stone-500 text-[11px] italic py-1">
                      No cash drops or payouts recorded for this shift yet.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {activeShift.cashMovements.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-stone-900/60 border border-stone-800/80">
                          <div className="flex items-center gap-2">
                            {m.type === 'CASH_IN' ? (
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            <div>
                              <span className="font-bold text-stone-200 block text-[11px]">{m.reason}</span>
                              <span className="text-[9px] text-stone-500 font-mono">By {m.performedBy}</span>
                            </div>
                          </div>
                          <span className={`font-mono font-bold text-xs ${
                            m.type === 'CASH_IN' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {m.type === 'CASH_IN' ? `+$${Number(m.amount).toFixed(2)}` : `-$${Number(m.amount).toFixed(2)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: STEP-BY-STEP GUIDED CLOSE SHIFT (Z-REPORT)             */}
          {/* ============================================================ */}
          {currentMode === 'CLOSE' && activeShift && (
            <div className="space-y-4">
              {/* Step Wizard Progress Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-xs">
                <div className={`flex items-center gap-2 ${closeStep >= 1 ? 'text-amber-400 font-bold' : 'text-stone-500'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                    closeStep >= 1 ? 'bg-amber-600 text-stone-950' : 'bg-stone-800 text-stone-400'
                  }`}>1</span>
                  <span>1. Sales Review</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-600" />
                <div className={`flex items-center gap-2 ${closeStep >= 2 ? 'text-amber-400 font-bold' : 'text-stone-500'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                    closeStep >= 2 ? 'bg-amber-600 text-stone-950' : 'bg-stone-800 text-stone-400'
                  }`}>2</span>
                  <span>2. Cash Count & Variance</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-600" />
                <div className={`flex items-center gap-2 ${closeStep >= 3 ? 'text-emerald-400 font-bold' : 'text-stone-500'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                    closeStep >= 3 ? 'bg-emerald-600 text-stone-950' : 'bg-stone-800 text-stone-400'
                  }`}>3</span>
                  <span>3. Official Z-Report</span>
                </div>
              </div>

              {/* STEP 1: REVIEW SALES & TENDERS */}
              {closeStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2 text-xs">
                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">
                      Tender & Revenue Summary
                    </span>
                    <div className="flex justify-between py-1 border-b border-stone-800/80">
                      <span className="text-stone-400">Gross Sales Revenue:</span>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        ${(activeShift.totalGrossSales || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-800/80">
                      <span className="text-stone-400">Total Customer Tickets:</span>
                      <span className="font-mono text-stone-200">{activeShift.totalOrders || 0} tickets</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-800/80">
                      <span className="text-stone-400 flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-emerald-400" /> Cash Sales:
                      </span>
                      <span className="font-mono text-stone-200">+${(activeShift.cashSales || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-800/80">
                      <span className="text-stone-400 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-rose-400" /> Bakong KHQR Sales:
                      </span>
                      <span className="font-mono text-stone-200">${(activeShift.qrSales || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-400 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-sky-400" /> Credit / Debit Card:
                      </span>
                      <span className="font-mono text-stone-200">${(activeShift.cardSales || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Cash Drawer Balancing Formula */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-stone-300">
                      <span>Starting Cash Float:</span>
                      <span>${(activeShift.startingFloat || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>+ Cash Sales Collected:</span>
                      <span>+${(activeShift.cashSales || 0).toFixed(2)}</span>
                    </div>
                    {(activeShift.payIns || 0) > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>+ Cash In / Float Top-up:</span>
                        <span>+${(activeShift.payIns || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {(activeShift.payOuts || 0) > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>- Cash Drops / Payouts:</span>
                        <span>-${(activeShift.payOuts || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-amber-500/30 flex justify-between items-center text-sm font-black text-amber-300">
                      <span>= System Expected Cash in Drawer:</span>
                      <span className="text-base">${expectedCashAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentMode('ACTIVE')}
                      className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCloseStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <span>Proceed to Cash Drawer Count</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PHYSICAL CASH COUNT & LIVE VARIANCE */}
              {closeStep === 2 && (
                <form onSubmit={handleCloseShiftSubmit} className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-200">
                      {isKhmer ? 'រាប់ប្រាក់ជាក់ស្តែងក្នុងថត (Physical Drawer Count)' : 'Count Physical Cash in Drawer'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setCloseUseDenom(!closeUseDenom)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{closeUseDenom ? 'Enter Dual Currency' : 'Use Bill Breakdown Counter'}</span>
                    </button>
                  </div>

                  {!closeUseDenom ? (
                    <div className="grid grid-cols-2 gap-3 p-4 bg-stone-950 rounded-2xl border border-stone-800">
                      <div>
                        <span className="text-[11px] text-stone-400 block mb-1 font-semibold">USD Cash ($)</span>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold">$</span>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            value={closeCashUSD}
                            onChange={(e) => setCloseCashUSD(e.target.value)}
                            placeholder={expectedCashAmount.toFixed(2)}
                            className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-xl py-2 pl-8 pr-3 text-lg font-mono font-bold text-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-stone-400 block mb-1 font-semibold">Khmer Riel Cash (៛)</span>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold">៛</span>
                          <input
                            type="number"
                            step="500"
                            min="0"
                            value={closeCashKHR}
                            onChange={(e) => setCloseCashKHR(e.target.value)}
                            placeholder="0"
                            className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-xl py-2 pl-8 pr-3 text-lg font-mono font-bold text-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="col-span-2 pt-2 border-t border-stone-800 flex justify-between text-xs">
                        <span className="text-stone-400">Total Counted (USD equivalent):</span>
                        <span className="font-mono font-extrabold text-amber-400 text-sm">
                          ${totalClosePhysicalUSD.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Bill Denomination Breakdown */
                    <div className="space-y-3 p-4 bg-stone-950 rounded-2xl border border-stone-800">
                      <span className="text-[11px] text-stone-400 block font-semibold">USD Currency Notes</span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[
                          { key: 'b100', label: '$100' },
                          { key: 'b50', label: '$50' },
                          { key: 'b20', label: '$20' },
                          { key: 'b10', label: '$10' },
                          { key: 'b5', label: '$5' },
                          { key: 'b1', label: '$1' }
                        ].map((d) => (
                          <div key={d.key} className="p-2 rounded-xl bg-stone-900 border border-stone-800">
                            <span className="text-[10px] text-stone-400 font-bold block">{d.label}</span>
                            <input
                              type="number"
                              min="0"
                              value={closeDenoms[d.key] || ''}
                              onChange={(e) => setCloseDenoms((prev) => ({ ...prev, [d.key]: parseInt(e.target.value) || 0 }))}
                              className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1 text-xs font-mono font-bold text-stone-100 mt-1"
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>

                      <span className="text-[11px] text-stone-400 block font-semibold mt-2">Khmer Riel Currency (៛)</span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[
                          { key: 'k50000', label: '50,000៛' },
                          { key: 'k20000', label: '20,000៛' },
                          { key: 'k10000', label: '10,000៛' },
                          { key: 'k5000', label: '5,000៛' },
                          { key: 'k1000', label: '1,000៛' },
                          { key: 'k500', label: '500៛' }
                        ].map((d) => (
                          <div key={d.key} className="p-2 rounded-xl bg-stone-900 border border-stone-800">
                            <span className="text-[10px] text-stone-400 font-bold block">{d.label}</span>
                            <input
                              type="number"
                              min="0"
                              value={closeDenoms[d.key] || ''}
                              onChange={(e) => setCloseDenoms((prev) => ({ ...prev, [d.key]: parseInt(e.target.value) || 0 }))}
                              className="w-full bg-stone-950 border border-stone-700 rounded-lg p-1 text-xs font-mono font-bold text-stone-100 mt-1"
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-stone-800 flex justify-between text-xs">
                        <span className="text-stone-400">Total Counted:</span>
                        <span className="font-mono font-extrabold text-amber-400 text-sm">${totalClosePhysicalUSD.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Variance Real-Time Banner */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    currentVariance === 0
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : currentVariance > 0
                      ? 'bg-sky-950/40 border-sky-500/50 text-sky-300'
                      : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      {currentVariance === 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className={`w-5 h-5 shrink-0 ${currentVariance > 0 ? 'text-sky-400' : 'text-rose-400'}`} />
                      )}
                      <div>
                        <span className="text-xs font-extrabold block">
                          {currentVariance === 0 
                            ? 'Drawer Perfectly Balanced ($0.00)' 
                            : currentVariance > 0 
                            ? 'Cash Drawer Overage Detected' 
                            : 'Cash Drawer Shortage Detected'}
                        </span>
                        <span className="text-[10px] opacity-80 font-mono">
                          Physical: ${totalClosePhysicalUSD.toFixed(2)} vs Expected: ${expectedCashAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xl font-mono font-black">
                      {currentVariance >= 0 ? `+$${currentVariance.toFixed(2)}` : `-$${Math.abs(currentVariance).toFixed(2)}`}
                    </span>
                  </div>

                  {/* Discrepancy explanation & sign-off */}
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      {currentVariance !== 0 
                        ? 'Variance Explanation Note (Required)' 
                        : 'Reconciliation Notes & Handover Sign-off'}
                    </label>
                    <input
                      type="text"
                      value={closeNotes}
                      onChange={(e) => setCloseNotes(e.target.value)}
                      placeholder={currentVariance !== 0 ? 'Explain reason for variance (e.g. tip jar drop or miscounted bill)' : 'e.g. Register drawer counted and sealed for evening bank deposit.'}
                      className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={isSupervisorConfirmed}
                      onChange={(e) => setIsSupervisorConfirmed(e.target.checked)}
                      className="rounded border-stone-700 bg-stone-950 text-amber-500 focus:ring-0"
                    />
                    <span>I verify that the cash in drawer was counted accurately and ready for handover.</span>
                  </label>

                  <div className="flex justify-between items-center pt-3 border-t border-stone-800">
                    <button
                      type="button"
                      onClick={() => setCloseStep(1)}
                      className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
                    >
                      Back to Review
                    </button>
                    <button
                      type="submit"
                      disabled={!isSupervisorConfirmed}
                      className={`px-6 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer ${
                        isSupervisorConfirmed
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      <span>Finalize & Seal Shift (Z-Report)</span>
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: OFFICIAL Z-REPORT COMPLETED */}
              {closeStep === 3 && reportShift && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-600/50 text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                    <h4 className="text-base font-extrabold text-stone-100">
                      Shift Successfully Closed & Sealed!
                    </h4>
                    <p className="text-xs text-stone-400 font-mono">
                      Shift #{reportShift.shiftNumber} • {reportShift.registerName}
                    </p>
                  </div>

                  {/* Summary Slip Card */}
                  <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-stone-800">
                      <span className="text-stone-400">Total Gross Sales:</span>
                      <span className="font-mono font-bold text-amber-400">${(reportShift.totalGrossSales || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-800">
                      <span className="text-stone-400">Expected Cash:</span>
                      <span className="font-mono text-stone-200">${(reportShift.expectedCash || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-800">
                      <span className="text-stone-400">Actual Cash Counted:</span>
                      <span className="font-mono text-stone-200">${(reportShift.actualCashCount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-800">
                      <span className="text-stone-400">Final Variance:</span>
                      <span className={`font-mono font-bold ${reportShift.variance === 0 ? 'text-emerald-400' : reportShift.variance > 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                        {reportShift.variance >= 0 ? `+$${(reportShift.variance || 0).toFixed(2)}` : `-$${Math.abs(reportShift.variance || 0).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-400">Closed By:</span>
                      <span className="text-stone-200">{reportShift.closedBy}</span>
                    </div>
                  </div>

                  {/* Export & Print Center */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={handlePrintSlip}
                      className="p-3 rounded-2xl bg-stone-950 hover:bg-stone-850 border border-stone-800 text-stone-200 text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer"
                    >
                      <Printer className="w-5 h-5 text-amber-400" />
                      <span>Print Z-Report</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportExcel(reportShift)}
                      className="p-3 rounded-2xl bg-stone-950 hover:bg-stone-850 border border-stone-800 text-stone-200 text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                      <span>Export Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportCSV(reportShift)}
                      className="p-3 rounded-2xl bg-stone-950 hover:bg-stone-850 border border-stone-800 text-stone-200 text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-5 h-5 text-sky-400" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setReportShift(null);
                        setCurrentMode('OPEN');
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Open Next Shift (Handover)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        lockScreen();
                      }}
                      className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300 hover:text-stone-100 text-xs font-semibold cursor-pointer"
                    >
                      Lock Terminal Screen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: HISTORICAL AUDIT LOG (VIEW PAST SHIFTS)               */}
          {/* ============================================================ */}
          {currentMode === 'HISTORY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Past Shift Records ({shifts.length})
                </span>
                <span className="text-[11px] text-stone-500">
                  Click any shift to view or reprint Z-Report
                </span>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {shifts.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setReportShift(s);
                      setCurrentMode('CLOSE');
                      setCloseStep(3);
                    }}
                    className="p-3.5 rounded-2xl bg-stone-950/70 hover:bg-stone-950 border border-stone-800/80 hover:border-amber-500/40 transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-stone-200">{s.shiftNumber}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          s.status === 'OPEN'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : 'bg-stone-800 text-stone-400'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-stone-400 text-[11px] mt-0.5">
                        {s.staffName} ({s.staffRole}) • {s.registerName}
                      </p>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {s.openedAt ? s.openedAt.replace('T', ' ').substring(0, 16) : '—'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-400 block text-sm">
                        ${(s.totalGrossSales || 0).toFixed(2)}
                      </span>
                      <span className={`text-[10px] font-mono font-bold ${
                        (s.variance || 0) === 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        Var: {(s.variance || 0) >= 0 ? `+$${(s.variance || 0).toFixed(2)}` : `-$${Math.abs(s.variance || 0).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
