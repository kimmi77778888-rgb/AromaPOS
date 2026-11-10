import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  Printer, 
  Receipt, 
  Calculator, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  RotateCcw, 
  Lock 
} from 'lucide-react';

export const ZReportModal = ({ isOpen, onClose }) => {
  const { orders, user, startingFloat, showToast, clearCart } = useApp();
  const { isKhmer, formatKHR } = useLanguage();

  const [physicalCountInput, setPhysicalCountInput] = useState('');
  const [denominations, setDenominations] = useState({
    b100: 0,
    b50: 0,
    b20: 0,
    b10: 0,
    b5: 0,
    b1: 0,
    coins: 0
  });
  const [useDenomCalculator, setUseDenomCalculator] = useState(false);
  const [isShiftFinalized, setIsShiftFinalized] = useState(false);

  // Compute shift financial aggregates
  const shiftMetrics = useMemo(() => {
    const cashSales = orders
      .filter((o) => o.paymentMethod === 'CASH')
      .reduce((sum, o) => sum + o.total, 0);
    const cardSales = orders
      .filter((o) => o.paymentMethod === 'CARD')
      .reduce((sum, o) => sum + o.total, 0);
    const qrSales = orders
      .filter((o) => o.paymentMethod === 'QR_CODE' || o.paymentMethod === 'KHQR')
      .reduce((sum, o) => sum + o.total, 0);
    const totalGross = orders.reduce((sum, o) => sum + o.total, 0);
    const refunds = 0.0;

    const expectedCash = Math.round((startingFloat + cashSales - refunds) * 100) / 100;

    return {
      startingFloat,
      cashSales: Math.round(cashSales * 100) / 100,
      cardSales: Math.round(cardSales * 100) / 100,
      qrSales: Math.round(qrSales * 100) / 100,
      totalGross: Math.round(totalGross * 100) / 100,
      refunds,
      expectedCash,
      ticketCount: orders.length
    };
  }, [orders, startingFloat]);

  // Calculate actual physical cash
  const actualPhysicalCash = useMemo(() => {
    if (useDenomCalculator) {
      const sum =
        denominations.b100 * 100 +
        denominations.b50 * 50 +
        denominations.b20 * 20 +
        denominations.b10 * 10 +
        denominations.b5 * 5 +
        denominations.b1 * 1 +
        parseFloat(denominations.coins || 0);
      return Math.round(sum * 100) / 100;
    }
    const parsed = parseFloat(physicalCountInput);
    return isNaN(parsed) ? shiftMetrics.expectedCash : Math.round(parsed * 100) / 100;
  }, [physicalCountInput, useDenomCalculator, denominations, shiftMetrics.expectedCash]);

  // Exact Variance Calculation: Actual - Expected
  const variance = Math.round((actualPhysicalCash - shiftMetrics.expectedCash) * 100) / 100;

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleFinalizeShift = () => {
    setIsShiftFinalized(true);
    showToast(
      isKhmer
        ? `របាយការណ៍បិទវេន Z-Report ត្រូវបានចាក់សោ។ គម្លាតសាច់ប្រាក់: ${variance >= 0 ? `+$${variance.toFixed(2)}` : `-$${Math.abs(variance).toFixed(2)}`}`
        : `Shift Z-Report locked. Variance: ${variance >= 0 ? `+$${variance.toFixed(2)}` : `-$${Math.abs(variance).toFixed(2)}`}`,
      'info'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-md">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-100">
                {isKhmer ? 'របាយការណ៍បិទវេន (End-of-Shift Z-Report)' : 'End-of-Shift Z-Report'}
              </h3>
              <p className="text-xs text-stone-400">
                {isKhmer 
                  ? 'បិទបញ្ជរគិតប្រាក់ • ផ្ទៀងផ្ទាត់សាច់ប្រាក់ក្នុងថត & ត្រួតពិនិត្យគម្លាត'
                  : 'Register Closure • Cash Drawer Reconciliation & Variance Verification'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Report Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Shift Details Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-stone-950/60 border border-stone-800 text-xs">
            <div>
              <span className="text-stone-500 uppercase tracking-wider text-[10px] block">
                {isKhmer ? 'អ្នកកាន់វេន' : 'Current Operator'}
              </span>
              <span className="font-bold text-stone-200">{user?.name}</span>
            </div>
            <div>
              <span className="text-stone-500 uppercase tracking-wider text-[10px] block">
                {isKhmer ? 'បញ្ជរ' : 'Terminal'}
              </span>
              <span className="font-bold text-stone-200">{isKhmer ? 'បញ្ជរ #01' : 'Register #01'}</span>
            </div>
            <div>
              <span className="text-stone-500 uppercase tracking-wider text-[10px] block">
                {isKhmer ? 'វិក្កយបត្រ' : 'Tickets Handled'}
              </span>
              <span className="font-bold text-stone-200">
                {isKhmer ? `${shiftMetrics.ticketCount} វិក្កយបត្រ` : `${shiftMetrics.ticketCount} orders`}
              </span>
            </div>
            <div>
              <span className="text-stone-500 uppercase tracking-wider text-[10px] block">
                {isKhmer ? 'ស្ថានភាពវេន' : 'Shift Status'}
              </span>
              <span className="font-bold text-emerald-400">
                {isKhmer ? 'កំពុងផ្ទៀងផ្ទាត់' : 'Auditing'}
              </span>
            </div>
          </div>

          {/* Cash Drawer Reconciliation Summary */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-950 to-stone-900 border border-amber-500/30 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span>{isKhmer ? 'រូបមន្តផ្ទៀងផ្ទាត់សាច់ប្រាក់' : 'Cash Balancing Formula'}</span>
            </h4>

            <div className="space-y-1.5 text-xs text-stone-300 font-mono">
              <div className="flex justify-between py-1 border-b border-stone-800">
                <span className="text-stone-400 font-sans">
                  {isKhmer ? 'សាច់ប្រាក់ដើមគ្រា (ពេលបើកវេន):' : 'Starting Float (Opening Cash):'}
                </span>
                <span className="font-bold">${shiftMetrics.startingFloat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800 text-emerald-400">
                <span className="font-sans">
                  {isKhmer ? '+ ការលក់ជាសាច់ប្រាក់សុទ្ធ:' : '+ Cash Sales Volume:'}
                </span>
                <span className="font-bold">+${shiftMetrics.cashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800 text-stone-400">
                <span className="font-sans">
                  {isKhmer ? '- សងប្រាក់ត្រឡប់ / ចំណាយ:' : '- Cash Refunds / Payouts:'}
                </span>
                <span className="font-bold">-${shiftMetrics.refunds.toFixed(2)}</span>
              </div>
              {user?.role === 'CASHIER' ? (
                <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-sky-950/40 border border-sky-800/60 text-sky-300 text-xs font-semibold">
                  <span className="flex items-center gap-2 font-sans">
                    <Lock className="w-4 h-4 text-sky-400" />
                    <span>{isKhmer ? 'សាច់ប្រាក់រំពឹងទុកក្នុងថត:' : 'Expected Cash in Drawer:'}</span>
                  </span>
                  <span className="font-mono text-stone-400 italic">
                    {isKhmer ? '🔒 លាក់សាច់ប្រាក់ (ប្រព័ន្ធ Blind Cash Drop)' : '🔒 Hidden (Blind Cash Drop)'}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between py-2 text-sm font-extrabold text-amber-400 bg-amber-950/20 px-3 rounded-xl border border-amber-800/40">
                  <span className="font-sans">
                    {isKhmer ? '= សាច់ប្រាក់រំពឹងទុកក្នុងថត:' : '= Expected Cash in Drawer:'}
                  </span>
                  <span>${shiftMetrics.expectedCash.toFixed(2)} ({formatKHR(shiftMetrics.expectedCash)})</span>
                </div>
              )}
            </div>
          </div>

          {/* Physical Cash Count Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-300">
                {isKhmer ? 'ចំនួនសាច់ប្រាក់ជាក់ស្តែងរាប់បាន ($)' : "Cashier's Physical Cash Count ($)"}
              </label>
              <button
                type="button"
                onClick={() => setUseDenomCalculator(!useDenomCalculator)}
                className="text-xs text-amber-500 hover:text-amber-400 font-semibold cursor-pointer"
              >
                {useDenomCalculator 
                  ? (isKhmer ? 'ប្តូរទៅបញ្ចូលសរុបរហ័ស' : 'Switch to Quick Total') 
                  : (isKhmer ? 'បើកតារាងរាប់ក្រដាសប្រាក់លម្អិត' : 'Open Bill Denomination Counter')}
              </button>
            </div>

            {!useDenomCalculator ? (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={physicalCountInput}
                  onChange={(e) => setPhysicalCountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl py-3 pl-9 pr-4 text-lg font-bold font-mono text-amber-400 focus:outline-none"
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { key: 'b100', label: isKhmer ? 'ក្រដាស $100' : '$100 Bills' },
                  { key: 'b50', label: isKhmer ? 'ក្រដាស $50' : '$50 Bills' },
                  { key: 'b20', label: isKhmer ? 'ក្រដាស $20' : '$20 Bills' },
                  { key: 'b10', label: isKhmer ? 'ក្រដាស $10' : '$10 Bills' },
                  { key: 'b5', label: isKhmer ? 'ក្រដាស $5' : '$5 Bills' },
                  { key: 'b1', label: isKhmer ? 'ក្រដាស $1' : '$1 Bills' }
                ].map(({ key, label }) => (
                  <div key={key}>
                    <span className="text-[10px] text-stone-400">{label}</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations[key]}
                      onChange={(e) =>
                        setDenominations({ ...denominations, [key]: parseInt(e.target.value, 10) || 0 })
                      }
                      className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1 text-center font-mono text-stone-100"
                    />
                  </div>
                ))}
                <div>
                  <span className="text-[10px] text-stone-400">
                    {isKhmer ? 'កាក់ / ប្រាក់រាយ ($)' : 'Coins Value ($)'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={denominations.coins}
                    onChange={(e) =>
                      setDenominations({ ...denominations, coins: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1 text-center font-mono text-stone-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Variance Outcome Display */}
          {user?.role === 'CASHIER' ? (
            <div className="p-4 rounded-2xl border bg-stone-950 border-stone-800 text-stone-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <h5 className="font-extrabold text-sm tracking-tight text-stone-100">
                    {isKhmer ? 'ប្រព័ន្ធសុវត្ថិភាព Blind Cash Drop កំពុងដំណើរការ' : 'Blind Cash Drop Protection Active'}
                  </h5>
                  <p className="text-xs text-stone-400">
                    {isKhmer
                      ? `ចំនួនសាច់ប្រាក់ដែលបានរាប់ ($${actualPhysicalCash.toFixed(2)}) ត្រូវបានរក្សាទុកជាការសម្ងាត់ និងបញ្ជូនទៅប្រធានហាងដើម្បីធ្វើសវនកម្ម។`
                      : `Your physical count ($${actualPhysicalCash.toFixed(2)}) is sealed and forwarded to Store Manager for shift audit.`}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-950 text-sky-300 border border-sky-800 font-mono shrink-0">
                {isKhmer ? 'BLIND DROP' : 'BLIND DROP'}
              </span>
            </div>
          ) : (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                variance === 0
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300'
                  : variance > 0
                  ? 'bg-sky-950/40 border-sky-600/50 text-sky-300'
                  : 'bg-rose-950/40 border-rose-600/60 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {variance === 0 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className={`w-6 h-6 shrink-0 ${variance > 0 ? 'text-sky-400' : 'text-rose-400'}`} />
                )}
                <div>
                  <h5 className="font-extrabold text-sm tracking-tight">
                    {variance === 0
                      ? (isKhmer ? 'សាច់ប្រាក់ត្រឹមត្រូវឥតខ្ចោះ ($0.00)' : 'Drawer Perfectly Balanced ($0.00)')
                      : variance > 0
                      ? (isKhmer ? `រកឃើញសាច់ប្រាក់លើស (+${variance.toFixed(2)})` : `Cash Overage Detected (+${variance.toFixed(2)})`)
                      : (isKhmer ? `រកឃើញសាច់ប្រាក់ខ្វះ (-$${Math.abs(variance).toFixed(2)})` : `Cash Shortage Detected (-$${Math.abs(variance).toFixed(2)})`)}
                  </h5>
                  <p className="text-xs opacity-80">
                    {isKhmer 
                      ? `រាប់ជាក់ស្តែង: $${actualPhysicalCash.toFixed(2)} vs រំពឹងទុក: $${shiftMetrics.expectedCash.toFixed(2)}`
                      : `Physical count: $${actualPhysicalCash.toFixed(2)} vs Expected: $${shiftMetrics.expectedCash.toFixed(2)}`}
                  </p>
                </div>
              </div>

              <span className="text-xl font-extrabold font-mono">
                {variance >= 0 ? `+$${variance.toFixed(2)}` : `-$${Math.abs(variance).toFixed(2)}`}
              </span>
            </div>
          )}

          {/* Digital Sales Summary */}
          <div className="grid grid-cols-2 gap-3 text-xs text-stone-400 p-3 rounded-xl bg-stone-950/50 border border-stone-800">
            <div className="flex justify-between">
              <span>{isKhmer ? 'ការលក់តាមកាត Credit/Debit:' : 'Credit/Debit Card Sales:'}</span>
              <span className="font-mono text-stone-200 font-bold">${shiftMetrics.cardSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>{isKhmer ? 'ការលក់តាម KHQR (Bakong):' : 'KHQR (Bakong) Sales:'}</span>
              <span className="font-mono text-stone-200 font-bold">${shiftMetrics.qrSales.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-4 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isKhmer ? 'បោះពុម្ព Z-Report' : 'Print Z-Report'}</span>
          </button>

          <button
            type="button"
            onClick={handleFinalizeShift}
            disabled={isShiftFinalized}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isShiftFinalized 
              ? (isKhmer ? 'វេនត្រូវបានបិទ & ផ្ទៀងផ្ទាត់រួច' : 'Shift Closed & Reconciled')
              : (isKhmer ? 'បញ្ជាក់ & បិទវេនគិតប្រាក់' : 'Confirm & Close Register Shift')}
          </button>
        </div>
      </div>
    </div>
  );
};
