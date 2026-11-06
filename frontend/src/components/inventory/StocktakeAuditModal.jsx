import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  RotateCcw, 
  TrendingDown, 
  TrendingUp, 
  Boxes, 
  Coffee, 
  Layers, 
  Check, 
  Calendar,
  User,
  DollarSign
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { soundService } from '../../services/soundService';
import { CambodiaFlag } from '../common/FlagIcons';

export const StocktakeAuditModal = ({ isOpen, onClose }) => {
  const { 
    ingredients = [], 
    products = [], 
    recordStockAdjustment, 
    user, 
    storeInfo, 
    showToast 
  } = useApp();

  const { isKhmer, khrExchangeRate = 4100, formatUSD, formatKHR } = useLanguage();

  // Audit state: mapping of itemId -> { physicalCount, notes }
  const [counts, setCounts] = useState({});
  const [itemTypeFilter, setItemTypeFilter] = useState('all'); // 'all' | 'ingredients' | 'products'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVarianceOnly, setFilterVarianceOnly] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  // Combine items into a unified audit list
  const allAuditItems = useMemo(() => {
    const ingItems = ingredients.map(i => ({
      id: i.id,
      name: i.name,
      nameKm: i.nameKm || i.name,
      type: 'ingredient',
      category: i.category || 'Raw Ingredient',
      unit: i.unit || 'g',
      expectedStock: Number(i.stock) || 0,
      unitCost: Number(i.costPerUnit) || 0,
      rawItem: i
    }));

    const prodItems = products.map(p => ({
      id: p.id,
      name: p.name,
      nameKm: p.nameKm || p.name,
      type: 'product',
      category: p.category || 'Menu Item',
      unit: p.uom || 'pcs',
      expectedStock: Number(p.stock) || 0,
      unitCost: p.cost !== undefined && p.cost > 0 ? Number(p.cost) : Number(p.price || 0) * 0.35,
      rawItem: p
    }));

    return [...ingItems, ...prodItems];
  }, [ingredients, products]);

  // Initialize count inputs to expected stock when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const initialCounts = {};
    allAuditItems.forEach(item => {
      initialCounts[item.id] = {
        physicalCount: String(item.expectedStock),
        notes: ''
      };
    });
    setCounts(initialCounts);
  }, [isOpen, allAuditItems]);

  if (!isOpen) return null;

  // Filtered Items for Display
  const filteredAuditItems = allAuditItems.filter(item => {
    if (itemTypeFilter === 'ingredients' && item.type !== 'ingredient') return false;
    if (itemTypeFilter === 'products' && item.type !== 'product') return false;

    const matchSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameKm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (filterVarianceOnly) {
      const physical = parseFloat(counts[item.id]?.physicalCount);
      const isDifferent = !isNaN(physical) && physical !== item.expectedStock;
      return isDifferent;
    }

    return true;
  });

  // Calculate Variance Metrics
  const auditMetrics = useMemo(() => {
    let totalItemsAudited = 0;
    let itemsWithVariance = 0;
    let netVarianceValueUSD = 0;
    let totalLossUSD = 0;
    let totalSurplusUSD = 0;

    allAuditItems.forEach(item => {
      const entry = counts[item.id];
      if (!entry) return;
      const physical = parseFloat(entry.physicalCount);
      if (isNaN(physical)) return;

      totalItemsAudited++;
      const variance = Math.round((physical - item.expectedStock) * 100) / 100;
      if (variance !== 0) {
        itemsWithVariance++;
        const costImpact = Math.round(variance * item.unitCost * 100) / 100;
        netVarianceValueUSD += costImpact;
        if (costImpact < 0) {
          totalLossUSD += Math.abs(costImpact);
        } else {
          totalSurplusUSD += costImpact;
        }
      }
    });

    return {
      totalItemsAudited,
      itemsWithVariance,
      netVarianceValueUSD: Math.round(netVarianceValueUSD * 100) / 100,
      totalLossUSD: Math.round(totalLossUSD * 100) / 100,
      totalSurplusUSD: Math.round(totalSurplusUSD * 100) / 100
    };
  }, [allAuditItems, counts]);

  const handleCountChange = (itemId, value) => {
    setCounts(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        physicalCount: value
      }
    }));
  };

  const handleNotesChange = (itemId, value) => {
    setCounts(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes: value
      }
    }));
  };

  const handleResetToExpected = () => {
    const resetCounts = {};
    allAuditItems.forEach(item => {
      resetCounts[item.id] = {
        physicalCount: String(item.expectedStock),
        notes: ''
      };
    });
    setCounts(resetCounts);
    if (showToast) showToast('Reset all counts to expected system stock', 'info');
  };

  // Execute Reconcile & Apply All Counts
  const handleApplyReconciliation = async () => {
    if (auditMetrics.itemsWithVariance === 0) {
      if (showToast) showToast(isKhmer ? 'ស្តុកទាំងអស់ត្រូវគ្នាល្អឥតខ្ចោះ គ្មានភាពខុសគ្នាទេ' : 'All items are balanced (0 variance)', 'info');
      return;
    }

    const confirmMsg = isKhmer
      ? `តើអ្នកចង់អនុវត្តការកែតម្រូវស្តុកចំនួន ${auditMetrics.itemsWithVariance} មុខទំនិញដែលមានភាពខុសគ្នា (ផលប៉ះពាល់ថវិកា: $${auditMetrics.netVarianceValueUSD.toFixed(2)}) ឬទេ?`
      : `Apply physical stock adjustment for ${auditMetrics.itemsWithVariance} items with variance (Financial impact: $${auditMetrics.netVarianceValueUSD.toFixed(2)})?`;

    if (!window.confirm(confirmMsg)) return;

    setIsReconciling(true);
    const auditBatchRef = `AUDIT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;

    try {
      soundService.playPaymentSuccessSound();

      let reconciledCount = 0;
      for (const item of allAuditItems) {
        const entry = counts[item.id];
        if (!entry) continue;
        const physical = parseFloat(entry.physicalCount);
        if (isNaN(physical)) continue;

        const diff = Math.round((physical - item.expectedStock) * 100) / 100;
        if (diff !== 0) {
          await recordStockAdjustment({
            productId: item.type === 'product' ? item.id : null,
            ingredientId: item.type === 'ingredient' ? item.id : null,
            quantity: diff, // Positive adds, negative deducts
            reason: diff < 0 ? 'SPOILAGE' : 'ADJUST_CORRECTION',
            reference: auditBatchRef,
            notes: `[Stocktake Audit] ${entry.notes || 'Periodic physical count variance reconciliation'}`.trim()
          });
          reconciledCount++;
        }
      }

      if (showToast) {
        showToast(
          isKhmer
            ? `បានកែសម្រួលនិងផ្ទៀងផ្ទាត់ស្តុកចំនួន ${reconciledCount} មុខទំនិញដោយជោគជ័យ!`
            : `Reconciled ${reconciledCount} stock items successfully under ${auditBatchRef}!`,
          'success'
        );
      }
      onClose();
    } catch (err) {
      console.error('Audit reconciliation error:', err);
      if (showToast) showToast(err.message || 'Failed to reconcile audit', 'error');
    } finally {
      setIsReconciling(false);
    }
  };

  // Export Audit Worksheet to Clean Cambodia Standard Excel (.xlsx)
  const handleExportAuditExcel = () => {
    try {
      soundService.playPaymentSuccessSound();
      const wb = XLSX.utils.book_new();
      const rate = khrExchangeRate || 4100;

      const headerData = [
        ['AROMA POS - OFFICIAL PHYSICAL STOCKTAKE AUDIT REPORT'],
        ['របាយការណ៍ផ្ទៀងផ្ទាត់ និងរាប់ស្តុកជាក់ស្តែង ស្តង់ដារកម្ពុជា'],
        ['Store / Branch:', storeInfo?.name || 'Aroma Coffee & Roastery', 'Audited By:', user?.name || 'Store Auditor'],
        ['Audit Date & Time:', new Date().toLocaleString(), 'Exchange Rate:', `1 USD = ${rate} KHR`],
        ['Total Items Counted:', auditMetrics.totalItemsAudited, 'Items with Discrepancy:', auditMetrics.itemsWithVariance],
        ['Net Discrepancy USD:', `$${auditMetrics.netVarianceValueUSD.toFixed(2)}`, 'Net Discrepancy KHR:', `${Math.round(auditMetrics.netVarianceValueUSD * rate).toLocaleString()} KHR`],
        []
      ];

      const tableHeaders = [
        'No. (ល.រ)',
        'Item SKU / ID',
        'English Name',
        'Khmer Name (ឈ្មោះខ្មែរ)',
        'Type (ប្រភេទ)',
        'Unit (ខ្នាត)',
        'System Expected Stock',
        'Actual Physical Count',
        'Variance (ភាពលម្អៀង)',
        'Variance Status',
        'Unit Cost USD ($)',
        'Variance Cost USD ($)',
        'Variance Cost KHR (៛)',
        'Auditor Notes / Reason'
      ];

      const tableRows = allAuditItems.map((item, idx) => {
        const entry = counts[item.id] || { physicalCount: String(item.expectedStock), notes: '' };
        const physical = isNaN(parseFloat(entry.physicalCount)) ? item.expectedStock : parseFloat(entry.physicalCount);
        const variance = Math.round((physical - item.expectedStock) * 100) / 100;
        const varianceCostUSD = Math.round(variance * item.unitCost * 100) / 100;
        const varianceCostKHR = Math.round(varianceCostUSD * rate);

        let statusStr = 'BALANCED (ត្រឹមត្រូវ)';
        if (variance < 0) statusStr = 'SHORTAGE / LOSS (ខ្វះស្តុក)';
        if (variance > 0) statusStr = 'SURPLUS (លើសស្តុក)';

        return [
          idx + 1,
          item.id,
          item.name,
          item.nameKm || item.name,
          item.type === 'ingredient' ? 'Raw Material' : 'Bakery/Retail',
          item.unit,
          item.expectedStock,
          physical,
          variance,
          statusStr,
          item.unitCost,
          varianceCostUSD,
          varianceCostKHR,
          entry.notes || ''
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([...headerData, tableHeaders, ...tableRows]);

      ws['!cols'] = [
        { wch: 8 },  // No
        { wch: 14 }, // SKU
        { wch: 28 }, // EN Name
        { wch: 24 }, // KM Name
        { wch: 15 }, // Type
        { wch: 8 },  // Unit
        { wch: 16 }, // Expected
        { wch: 16 }, // Counted
        { wch: 14 }, // Variance
        { wch: 20 }, // Status
        { wch: 14 }, // Unit Cost
        { wch: 16 }, // Variance USD
        { wch: 18 }, // Variance KHR
        { wch: 30 }  // Notes
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Stocktake_Audit');
      const filename = `AromaPOS_Stocktake_Audit_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);

      if (showToast) {
        showToast(
          isKhmer ? `បានទាញយកតារាង Excel រាប់ស្តុក: ${filename}` : `Exported stocktake audit report: ${filename}`,
          'success'
        );
      }
    } catch (err) {
      console.error('Failed to export audit Excel:', err);
      if (showToast) showToast('Failed to export audit Excel file', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-md">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-stone-100">
                  {isKhmer ? 'ការរាប់ស្តុកជាក់ស្តែង & ផ្ទៀងផ្ទាត់ (Stocktake Audit)' : 'Physical Stocktake & Variance Audit'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  CYCLE COUNT
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {isKhmer 
                  ? 'ផ្ទៀងផ្ទាត់ចំនួនស្តុកលើធ្នើធៀបនឹងការកាត់ស្តុកស្វ័យប្រវត្តិ POS ដើម្បីរកឃើញភាពខ្វះខាត និងខាតបង់'
                  : 'Reconcile shelf inventory against POS auto-depletion to catch shrinkage, spills, and portion drift'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar & Quick Tools */}
        <div className="p-4 bg-stone-950/60 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isKhmer ? 'ស្វែងរកមុខទំនិញ...' : 'Search item name / category...'}
                className="bg-stone-900 border border-stone-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 w-48 sm:w-60"
              />
            </div>

            <div className="inline-flex rounded-xl bg-stone-900 p-1 border border-stone-800">
              <button
                type="button"
                onClick={() => setItemTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  itemTypeFilter === 'all' ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                All Items ({allAuditItems.length})
              </button>
              <button
                type="button"
                onClick={() => setItemTypeFilter('ingredients')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  itemTypeFilter === 'ingredients' ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Raw Ingredients ({ingredients.length})
              </button>
              <button
                type="button"
                onClick={() => setItemTypeFilter('products')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  itemTypeFilter === 'products' ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Bakery & Retail ({products.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setFilterVarianceOnly(!filterVarianceOnly)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterVarianceOnly
                  ? 'bg-rose-950/80 text-rose-300 border-rose-600'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Show Discrepancies Only ({auditMetrics.itemsWithVariance})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToExpected}
              className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 font-semibold transition cursor-pointer flex items-center gap-1"
              title="Reset all physical count fields to match expected system stock"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset (= Expected)</span>
            </button>

            <button
              type="button"
              onClick={handleExportAuditExcel}
              className="px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-300 font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Audit Excel</span>
            </button>
          </div>
        </div>

        {/* Audit Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="overflow-x-auto border border-stone-800 rounded-2xl bg-stone-950/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-900/90 border-b border-stone-800 text-stone-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Item & Category</th>
                  <th className="py-3 px-3 text-center">Unit</th>
                  <th className="py-3 px-3 text-right">System Expected</th>
                  <th className="py-3 px-3 text-center">Actual Physical Count</th>
                  <th className="py-3 px-3 text-right">Variance</th>
                  <th className="py-3 px-3 text-right">Cost Impact ($)</th>
                  <th className="py-3 px-3">Variance Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-sans">
                {filteredAuditItems.map((item) => {
                  const entry = counts[item.id] || { physicalCount: String(item.expectedStock), notes: '' };
                  const physicalVal = parseFloat(entry.physicalCount);
                  const isNum = !isNaN(physicalVal);
                  const variance = isNum ? Math.round((physicalVal - item.expectedStock) * 100) / 100 : 0;
                  const costImpact = Math.round(variance * item.unitCost * 100) / 100;

                  const hasDiscrepancy = isNum && variance !== 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-stone-900/50 transition ${
                        hasDiscrepancy 
                          ? variance < 0 ? 'bg-rose-950/15' : 'bg-blue-950/15' 
                          : ''
                      }`}
                    >
                      {/* Name & Badge */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-stone-100 flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.type === 'ingredient' ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-950 text-amber-400 border border-amber-800 font-mono">
                              RAW
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                              RETAIL
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {item.nameKm} • {item.category}
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-stone-400">
                        {item.unit}
                      </td>

                      {/* System Expected */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-300">
                        {item.expectedStock}
                      </td>

                      {/* Physical Count Input */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            value={entry.physicalCount}
                            onChange={(e) => handleCountChange(item.id, e.target.value)}
                            className="w-24 bg-stone-900 border border-stone-750 focus:border-amber-500 rounded-lg py-1 px-2 text-center font-mono font-extrabold text-xs text-stone-100 focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Variance */}
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold">
                        {variance === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/70 text-emerald-400 border border-emerald-800 text-[10px]">
                            <Check className="w-3 h-3 stroke-[3]" /> 0.00
                          </span>
                        ) : variance < 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-700 text-[10px]">
                            <TrendingDown className="w-3 h-3" /> {variance}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-700 text-[10px]">
                            <TrendingUp className="w-3 h-3" /> +{variance}
                          </span>
                        )}
                      </td>

                      {/* Cost Impact */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {costImpact === 0 ? (
                          <span className="text-stone-500">$0.00</span>
                        ) : costImpact < 0 ? (
                          <span className="text-rose-400">-${Math.abs(costImpact).toFixed(2)}</span>
                        ) : (
                          <span className="text-blue-400">+${costImpact.toFixed(2)}</span>
                        )}
                      </td>

                      {/* Notes / Reason */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={entry.notes}
                          onChange={(e) => handleNotesChange(item.id, e.target.value)}
                          placeholder="e.g. Broken packaging, dialed-in calibration"
                          className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1 px-2 text-[11px] text-stone-300 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Metrics & Reconcile Bar */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Summary KPIs */}
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div>
              <span className="text-stone-500 block text-[10px] uppercase font-bold">Audited Items</span>
              <span className="font-mono font-extrabold text-stone-200">
                {auditMetrics.totalItemsAudited} of {allAuditItems.length}
              </span>
            </div>

            <div className="border-l border-stone-800 pl-4">
              <span className="text-stone-500 block text-[10px] uppercase font-bold">Discrepancies Found</span>
              <span className={`font-mono font-extrabold ${auditMetrics.itemsWithVariance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {auditMetrics.itemsWithVariance} items
              </span>
            </div>

            <div className="border-l border-stone-800 pl-4">
              <span className="text-stone-500 block text-[10px] uppercase font-bold">Net Financial Variance</span>
              <div className="flex items-center gap-1.5">
                <span className={`font-mono font-black text-sm ${
                  auditMetrics.netVarianceValueUSD < 0 
                    ? 'text-rose-400' 
                    : auditMetrics.netVarianceValueUSD > 0 
                    ? 'text-blue-400' 
                    : 'text-emerald-400'
                }`}>
                  {auditMetrics.netVarianceValueUSD < 0 ? '-' : auditMetrics.netVarianceValueUSD > 0 ? '+' : ''}${Math.abs(auditMetrics.netVarianceValueUSD).toFixed(2)}
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  ({formatKHR(Math.abs(auditMetrics.netVarianceValueUSD))})
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isReconciling}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleApplyReconciliation}
              disabled={isReconciling || auditMetrics.itemsWithVariance === 0}
              className={`flex-1 sm:flex-none py-2.5 px-5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                auditMetrics.itemsWithVariance > 0
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-950/60 active:scale-95'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {isReconciling 
                  ? 'Reconciling Inventory...' 
                  : `Apply Count & Reconcile (${auditMetrics.itemsWithVariance})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
