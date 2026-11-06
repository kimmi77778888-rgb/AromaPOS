'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { CambodiaFlag } from '../common/FlagIcons';
import { 
  CAMBODIA_PROVINCES_STANDARD, 
  calculateProductCost,
  exportCambodiaStandardCatalog 
} from '../../services/cambodiaExcelExport';
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  Printer, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Coffee, 
  Boxes, 
  History, 
  ShieldCheck, 
  Coins, 
  Building2, 
  MapPin, 
  Info,
  ChevronRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export const CambodiaExcelInterface = () => {
  const { 
    products, 
    ingredients, 
    stockMovements, 
    storeInfo, 
    user, 
    khrExchangeRate, 
    showToast 
  } = useApp();
  const { isKhmer } = useLanguage();

  const rate = Number(khrExchangeRate) || 4100;

  // Active Excel Sheet Tab: 'provinces' | 'catalog' | 'inventory' | 'movements'
  const [activeSheet, setActiveSheet] = useState('provinces');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [provinceTypeFilter, setProvinceTypeFilter] = useState('ALL'); // 'ALL' | 'Capital' | 'Province'
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Interactive Excel Selected Cell State
  const [selectedCell, setSelectedCell] = useState({ ref: 'B4', value: 'រាជធានីភ្នំពេញ / Phnom Penh Capital' });

  // Loading indicator for export
  const [isExporting, setIsExporting] = useState(false);

  // Filtered 25 Provinces
  const filteredProvinces = useMemo(() => {
    return CAMBODIA_PROVINCES_STANDARD.filter((p) => {
      const matchSearch = 
        !searchQuery ||
        p.nameKm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.postalCode.includes(searchQuery) ||
        p.capitalTown.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = 
        provinceTypeFilter === 'ALL' || 
        p.typeEn === provinceTypeFilter;

      return matchSearch && matchType;
    });
  }, [searchQuery, provinceTypeFilter]);

  // Categories list for products
  const productCategories = useMemo(() => {
    const set = new Set((products || []).map((p) => p.category || 'General'));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filtered Products Catalog
  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      const matchSearch =
        !searchQuery ||
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.nameKm || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, categoryFilter]);

  // Filtered Raw Ingredients
  const filteredIngredients = useMemo(() => {
    return (ingredients || []).filter((ing) => {
      if (!searchQuery) return true;
      return (
        (ing.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ing.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ing.unit || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [ingredients, searchQuery]);

  // Handle Export triggers
  const handleExport = (mode = 'all') => {
    setIsExporting(true);
    try {
      const result = exportCambodiaStandardCatalog({
        products,
        ingredients,
        stockMovements,
        storeInfo,
        user,
        exchangeRate: rate,
        mode
      });
      if (showToast) {
        showToast(
          isKhmer 
            ? `✅ បានទាញយកឯកសារ Excel: ${result.filename}` 
            : `✅ Downloaded Excel: ${result.filename}`,
          'success'
        );
      }
    } catch (err) {
      console.error('Export failed:', err);
      if (showToast) {
        showToast(isKhmer ? '❌ ការទាញយកឯកសារបរាជ័យ' : '❌ Export failed', 'error');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Cell click handler for formula bar
  const handleCellClick = (cellRef, cellValue) => {
    setSelectedCell({ ref: cellRef, value: String(cellValue) });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-950 text-stone-100">
      {/* =====================================================================
          EXCEL TOP BANNER & ACTION RIBBON
         ===================================================================== */}
      <div className="bg-emerald-900 border-b border-emerald-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg select-none">
        {/* Left Brand & Workbook Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-emerald-800 flex items-center justify-center font-black shadow-md border border-emerald-400">
            <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight font-sans">
                {isKhmer ? 'តារាងស្តង់ដារកម្ពុជា & Excel Master' : 'Cambodia Standard Excel Master'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-200 border border-emerald-600">
                <CambodiaFlag className="w-3.5 h-2.5 rounded-xs" />
                <span>NIS & NBC Compliant</span>
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/90 font-mono">
              AromaPOS_Cambodia_Standard_Master.xlsx • $1 = {rate.toLocaleString()} KHR • VAT 10%
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export Full Master Workbook */}
          <button
            type="button"
            onClick={() => handleExport('all')}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition cursor-pointer disabled:opacity-50"
            title={isKhmer ? 'ទាញយកឯកសារ Excel ពេញលេញទាំង៤សន្លឹក' : 'Download Complete 4-Sheet Excel Master (.xlsx)'}
          >
            <Download className="w-4 h-4" />
            <span>{isKhmer ? 'ទាញយក Excel ទាំង៤សន្លឹក (.xlsx)' : 'Download Full Master Excel (.xlsx)'}</span>
          </button>

          {/* Export Current Active Sheet */}
          <button
            type="button"
            onClick={() => handleExport(activeSheet === 'provinces' ? 'provinces' : activeSheet)}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 font-medium text-xs transition cursor-pointer disabled:opacity-50"
            title={isKhmer ? 'ទាញយកតែសន្លឹកបច្ចុប្បន្ន' : 'Download Current Sheet Only (.xlsx)'}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isKhmer ? 'ទាញយកសន្លឹកនេះ' : 'Export Active Sheet'}</span>
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 border border-emerald-600/60 transition cursor-pointer"
            title={isKhmer ? 'បោះពុម្ព' : 'Print'}
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          EXCEL FORMULA BAR (Authentic Spreadsheet Experience)
         ===================================================================== */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-1.5 flex items-center gap-3 shrink-0 text-xs font-mono select-none">
        {/* Cell Coordinate Box */}
        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-stone-950 border border-stone-700 text-emerald-400 font-bold min-w-[50px] justify-center">
          <span>{selectedCell.ref}</span>
        </div>

        {/* fx symbol */}
        <div className="text-stone-400 font-serif italic font-bold select-none">
          fx
        </div>

        {/* Formula / Cell Content Display */}
        <div className="flex-1 bg-stone-950 border border-stone-800 rounded px-2.5 py-0.5 text-stone-200 overflow-hidden text-ellipsis whitespace-nowrap">
          {selectedCell.value}
        </div>

        {/* Real-time Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] text-stone-400 select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{isKhmer ? 'ទិន្នន័យផ្សារភ្ជាប់ផ្ទាល់' : 'Live Sync'}</span>
        </div>
      </div>

      {/* =====================================================================
          SEARCH & FILTER TOOLBAR
         ===================================================================== */}
      <div className="bg-stone-900/60 border-b border-stone-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Search Input */}
        <div className="relative min-w-[240px] max-w-sm flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeSheet === 'provinces'
                ? (isKhmer ? 'ស្វែងរកឈ្មោះខេត្ត-ក្រុង ឬកូដ...' : 'Search province, code, postal...')
                : activeSheet === 'catalog'
                ? (isKhmer ? 'ស្វែងរកមុខទំនិញ ឬកូដ SKU...' : 'Search menu item or SKU...')
                : activeSheet === 'inventory'
                ? (isKhmer ? 'ស្វែងរកវត្ថុធាតុដើម...' : 'Search raw ingredient...')
                : (isKhmer ? 'ស្វែងរកប្រតិបត្តិការ...' : 'Search movements...')
            }
            className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters according to active sheet */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {activeSheet === 'provinces' && (
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
              <button
                type="button"
                onClick={() => setProvinceTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                  provinceTypeFilter === 'ALL'
                    ? 'bg-emerald-600 text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isKhmer ? 'ទាំងអស់ (២៥)' : 'All 25'}
              </button>
              <button
                type="button"
                onClick={() => setProvinceTypeFilter('Capital')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                  provinceTypeFilter === 'Capital'
                    ? 'bg-emerald-600 text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isKhmer ? 'រាជធានី (១)' : 'Capital (1)'}
              </button>
              <button
                type="button"
                onClick={() => setProvinceTypeFilter('Province')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                  provinceTypeFilter === 'Province'
                    ? 'bg-emerald-600 text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isKhmer ? 'ខេត្ត (២៤)' : 'Provinces (24)'}
              </button>
            </div>
          )}

          {activeSheet === 'catalog' && (
            <div className="flex items-center gap-2">
              <span className="text-stone-400 text-xs">{isKhmer ? 'ប្រភេទ:' : 'Category:'}</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
              >
                {productCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Rate indicator badge */}
          <div className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 font-mono text-xs flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span>NBC Rate: $1 = {rate.toLocaleString()} ៛</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          EXCEL DATA GRID CONTAINER (With Row & Column Headers)
         ===================================================================== */}
      <div className="flex-1 overflow-auto bg-stone-950 relative">
        {/* =================================================================
            VIEW 1: CAMBODIA 25 PROVINCES & NATIONAL REGULATIONS
           ================================================================= */}
        {activeSheet === 'provinces' && (
          <div className="min-w-[900px] p-4 select-text">
            {/* Excel Sheet Header Banner */}
            <div className="bg-stone-900 border border-emerald-800/60 rounded-xl p-4 mb-4 text-stone-100 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <CambodiaFlag className="w-7 h-5 rounded-xs" />
                  <div>
                    <h2 className="text-sm font-black tracking-wide text-white">
                      🇰🇭 ព្រះរាជាណាចក្រកម្ពុជា • KINGDOM OF CAMBODIA
                    </h2>
                    <p className="text-xs text-emerald-400 font-medium">
                      តារាងស្តង់ដាររាជធានី-ខេត្ត និងកូដប្រៃសណីយ៍ផ្លូវការ • OFFICIAL CAMBODIA ADMINISTRATIVE & POSTAL CODES
                    </p>
                  </div>
                </div>
                <div className="text-right text-[11px] text-stone-400">
                  <p>ប្រភពទិន្នន័យ: ក្រសួងមហាផ្ទៃ & វិទ្យាស្ថានជាតិស្ថិតិ (NIS)</p>
                  <p className="text-emerald-400 font-bold">អនុលោមតាមស្ដង់ដារ ISO 3166-2:KH</p>
                </div>
              </div>

              {/* National Compliance Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-3 border-t border-stone-800 text-xs">
                <div className="bg-stone-950/80 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-emerald-400 font-bold flex items-center gap-1 mb-1">
                    <Coins className="w-3.5 h-3.5" />
                    <span>១. រូបិយវត្ថុ & អត្រាប្តូរប្រាក់ (NBC)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    បង្ហាញតម្លៃជា ២ រូបិយប័ណ្ណ ($ USD & ៛ KHR)។ អត្រាទីផ្សារស្ដង់ដារ: <strong className="text-stone-200">$1 = {rate.toLocaleString()} ៛</strong>
                  </p>
                </div>

                <div className="bg-stone-950/80 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-emerald-400 font-bold flex items-center gap-1 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>២. ការទូទាត់ឌីជីថល (KHQR)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    ស្ដង់ដារកូដ Bakong KHQR ជាតិ អនុលោមតាម EMVCo ISO 20022 ស្កេនទូទាត់បានគ្រប់ធនាគារក្នុងប្រទេសកម្ពុជា។
                  </p>
                </div>

                <div className="bg-stone-950/80 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-emerald-400 font-bold flex items-center gap-1 mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>៣. ពន្ធលើតម្លៃបន្ថែម (GDT VAT)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    អាករលើតម្លៃបន្ថែម (VAT) ស្តង់ដារ ១០% (10%) លើទំនិញ និងសេវាក្នុងស្រុក ស្របតាមអគ្គនាយកដ្ឋានពន្ធដារ។
                  </p>
                </div>

                <div className="bg-stone-950/80 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-emerald-400 font-bold flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>៤. ក្បួនបង្គត់ប្រាក់រៀល</span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    ការទូទាត់ជាសាច់ប្រាក់សុទ្ធជារៀល ត្រូវបង្គត់ទៅជិតបំផុតត្រឹម ១០០ រៀល ដើម្បីសម្រួលដល់ការអាប់ប្រាក់។
                  </p>
                </div>
              </div>
            </div>

            {/* Authentic Excel Table Format */}
            <div className="border border-stone-800 rounded-lg overflow-hidden bg-stone-950">
              <table className="w-full border-collapse text-xs font-sans">
                {/* Excel Column Letters Header */}
                <thead>
                  <tr className="bg-stone-900 text-stone-400 text-[11px] border-b border-stone-800 font-mono select-none">
                    <th className="w-12 py-1 px-2 border-r border-stone-800 text-center font-normal bg-stone-900/90">#</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center font-normal">A</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center font-normal">B</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center font-normal">C</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center font-normal">D</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center font-normal">E</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center font-normal">F</th>
                    <th className="py-1 px-3 text-center font-normal">G</th>
                  </tr>
                  {/* Clean Business Column Labels */}
                  <tr className="bg-emerald-950/80 text-emerald-200 border-b border-emerald-800 text-xs font-bold">
                    <th className="py-2 px-2 border-r border-stone-800 text-center font-mono">Row</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">
                      កូដខេត្ត<br/><span className="text-[10px] text-emerald-400 font-normal">ISO Code</span>
                    </th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">
                      រាជធានី-ខេត្ត (ភាសាខ្មែរ)<br/><span className="text-[10px] text-emerald-400 font-normal">Province (Khmer)</span>
                    </th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">
                      រាជធានី-ខេត្ត (អង់គ្លេស)<br/><span className="text-[10px] text-emerald-400 font-normal">Province (English)</span>
                    </th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">
                      ប្រភេទរដ្ឋបាល<br/><span className="text-[10px] text-emerald-400 font-normal">Admin Type</span>
                    </th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">
                      ទីរួមខេត្ត / រាជធានី<br/><span className="text-[10px] text-emerald-400 font-normal">Capital Town</span>
                    </th>
                    <th className="py-2 px-3 border-r border-stone-800 text-center">
                      កូដប្រៃសណីយ៍<br/><span className="text-[10px] text-emerald-400 font-normal">Postal Code</span>
                    </th>
                    <th className="py-2 px-3 text-right">
                      ចំនួនក្រុង-ស្រុក-ខណ្ឌ<br/><span className="text-[10px] text-emerald-400 font-normal">Districts Count</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850">
                  {filteredProvinces.map((p, idx) => {
                    const rowNumber = idx + 1;
                    return (
                      <tr 
                        key={p.code}
                        className="hover:bg-emerald-950/30 transition group cursor-pointer"
                        onClick={() => handleCellClick(`B${rowNumber}`, `${p.nameKm} / ${p.nameEn}`)}
                      >
                        {/* Row Index */}
                        <td className="py-2 px-2 text-center text-stone-500 font-mono text-[11px] bg-stone-900/40 border-r border-stone-800 select-none">
                          {rowNumber}
                        </td>
                        {/* ISO Code */}
                        <td 
                          className="py-2 px-3 border-r border-stone-800 font-mono font-bold text-amber-400"
                          onClick={(e) => { e.stopPropagation(); handleCellClick(`A${rowNumber}`, p.code); }}
                        >
                          {p.code}
                        </td>
                        {/* Khmer Name */}
                        <td 
                          className="py-2 px-3 border-r border-stone-800 font-bold text-stone-100"
                          onClick={(e) => { e.stopPropagation(); handleCellClick(`B${rowNumber}`, p.nameKm); }}
                        >
                          {p.nameKm}
                        </td>
                        {/* English Name */}
                        <td 
                          className="py-2 px-3 border-r border-stone-800 text-stone-300 font-medium"
                          onClick={(e) => { e.stopPropagation(); handleCellClick(`C${rowNumber}`, p.nameEn); }}
                        >
                          {p.nameEn}
                        </td>
                        {/* Admin Type */}
                        <td 
                          className="py-2 px-3 border-r border-stone-800 text-stone-400"
                          onClick={(e) => { e.stopPropagation(); handleCellClick(`D${rowNumber}`, `${p.typeKm} / ${p.typeEn}`); }}
                        >
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            p.typeEn === 'Capital' 
                              ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                              : 'bg-stone-800 text-stone-300'
                          }`}>
                            {p.typeKm} ({p.typeEn})
                          </span>
                        </td>
                        {/* Capital Town */}
                        <td 
                          className="py-2 px-3 border-r border-stone-800 text-stone-300"
                          onClick={(e) => { e.stopPropagation(); handleCellClick(`E${rowNumber}`, p.capitalTown); }}
                        >
                          {p.capitalTown}
                        </td>
                        {/* Postal Code */}
                        <td 
                          className="py-2 px-3 border-r border-stone-800 text-center font-mono font-bold text-emerald-400"
                          onClick={(e) => { e.stopPropagation(); handleCellClick(`F${rowNumber}`, p.postalCode); }}
                        >
                          {p.postalCode}
                        </td>
                        {/* Districts Count */}
                        <td 
                          className="py-2 px-3 text-right font-mono font-bold text-stone-200"
                          onClick={(e) => { e.stopPropagation(); handleCellClick(`G${rowNumber}`, p.districtsCount); }}
                        >
                          {p.districtsCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Excel Summary Row */}
                <tfoot>
                  <tr className="bg-stone-900 border-t-2 border-emerald-600 font-bold text-xs">
                    <td className="py-2.5 px-2 text-center text-stone-500 font-mono border-r border-stone-800">Σ</td>
                    <td className="py-2.5 px-3 border-r border-stone-800 font-mono text-emerald-400">TOTAL</td>
                    <td className="py-2.5 px-3 border-r border-stone-800 text-stone-100" colSpan={2}>
                      ២៥ រាជធានី-ខេត្តផ្លូវការ (25 Official Administrative Divisions)
                    </td>
                    <td className="py-2.5 px-3 border-r border-stone-800 text-stone-400">
                      1 Capital • 24 Provinces
                    </td>
                    <td className="py-2.5 px-3 border-r border-stone-800 text-stone-400">
                      Cambodia Standard NIS
                    </td>
                    <td className="py-2.5 px-3 border-r border-stone-800 text-center font-mono text-emerald-400">
                      25 Codes
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-300">
                      {filteredProvinces.reduce((sum, p) => sum + p.districtsCount, 0)} ក្រុង-ស្រុក-ខណ្ឌ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================
            VIEW 2: MENU PRODUCTS CATALOG
           ================================================================= */}
        {activeSheet === 'catalog' && (
          <div className="min-w-[1100px] p-4 select-text">
            <div className="border border-stone-800 rounded-lg overflow-hidden bg-stone-950">
              <table className="w-full border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-stone-900 text-stone-400 text-[11px] border-b border-stone-800 font-mono select-none">
                    <th className="w-12 py-1 px-2 border-r border-stone-800 text-center bg-stone-900/90">#</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">A</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">B</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">C</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">D</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">E</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">F</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">G</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">H</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">I</th>
                    <th className="py-1 px-3 text-center">J</th>
                  </tr>
                  <tr className="bg-emerald-950/80 text-emerald-200 border-b border-emerald-800 text-xs font-bold">
                    <th className="py-2 px-2 border-r border-stone-800 text-center font-mono">Row</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">SKU Code</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">Product Name (Khmer & English)</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">Category</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-right">Retail ($)</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-right">Retail (KHR ៛)</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-right">BOM Cost ($)</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-right">Margin ($)</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-right">Margin (%)</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-right">In-Stock</th>
                    <th className="py-2 px-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850">
                  {filteredProducts.map((p, idx) => {
                    const rowNumber = idx + 1;
                    const price = Number(p.price) || 0;
                    const priceKHR = Math.round(price * rate);
                    const cost = calculateProductCost(p, ingredients);
                    const margin = Math.round((price - cost) * 100) / 100;
                    const marginPct = price > 0 ? `${Math.round(((price - cost) / price) * 100)}%` : '0%';
                    const stock = Number(p.stock) || 0;

                    return (
                      <tr 
                        key={p.id || idx}
                        className="hover:bg-emerald-950/30 transition group cursor-pointer"
                        onClick={() => handleCellClick(`B${rowNumber}`, `${p.nameKm || p.name} ($${price.toFixed(2)})`)}
                      >
                        <td className="py-2 px-2 text-center text-stone-500 font-mono text-[11px] bg-stone-900/40 border-r border-stone-800 select-none">
                          {rowNumber}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 font-mono text-amber-400 font-bold">
                          {p.sku || `SKU-${String(rowNumber).padStart(3, '0')}`}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800">
                          <p className="font-bold text-stone-100">{p.nameKm || p.name}</p>
                          <p className="text-[11px] text-stone-400">{p.name}</p>
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-stone-300">
                          {p.category}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-right font-mono font-bold text-emerald-400">
                          ${price.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-right font-mono text-stone-300">
                          {priceKHR.toLocaleString()} ៛
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-right font-mono text-stone-400">
                          ${cost.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-right font-mono font-bold text-sky-400">
                          ${margin.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-right font-mono text-stone-300">
                          {marginPct}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-right font-mono font-bold text-stone-200">
                          {stock}
                        </td>
                        <td className="py-2 px-3 text-stone-300">
                          {stock <= 0 ? (
                            <span className="text-rose-400 font-bold">អស់ស្តុក (Out of Stock)</span>
                          ) : stock <= 5 ? (
                            <span className="text-amber-400 font-bold">ស្តុកទាប ({stock})</span>
                          ) : (
                            <span className="text-emerald-400">គ្រប់គ្រាន់ (In Stock)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================
            VIEW 3: RAW INGREDIENTS INVENTORY
           ================================================================= */}
        {activeSheet === 'inventory' && (
          <div className="min-w-[1000px] p-4 select-text">
            <div className="border border-stone-800 rounded-lg overflow-hidden bg-stone-950">
              <table className="w-full border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-stone-900 text-stone-400 text-[11px] border-b border-stone-800 font-mono select-none">
                    <th className="w-12 py-1 px-2 border-r border-stone-800 text-center bg-stone-900/90">#</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">A</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">B</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">C</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">D</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">E</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">F</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">G</th>
                    <th className="py-1 px-3 text-center">H</th>
                  </tr>
                  <tr className="bg-emerald-950/80 text-emerald-200 border-b border-emerald-800 text-xs font-bold">
                    <th className="py-2 px-2 border-r border-stone-800 text-center font-mono">Row</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">Material ID</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">Ingredient Name</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">Unit (UOM)</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-right">Current Stock</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-right">Safety Min</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-right">Unit Cost ($)</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-right">Total Asset ($)</th>
                    <th className="py-2 px-3 text-left">Depletion Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850">
                  {filteredIngredients.map((ing, idx) => {
                    const rowNumber = idx + 1;
                    const stock = Number(ing.stock) || 0;
                    const min = Number(ing.minThreshold) || 0;
                    const cost = Number(ing.costPerUnit) || 0;
                    const totalAsset = Math.round(stock * cost * 100) / 100;
                    const isLow = stock <= min && stock > 0;
                    const isDepleted = stock <= 0;

                    return (
                      <tr 
                        key={ing.id || idx}
                        className="hover:bg-emerald-950/30 transition group cursor-pointer"
                        onClick={() => handleCellClick(`B${rowNumber}`, `${ing.name}: ${stock} ${ing.unit}`)}
                      >
                        <td className="py-2 px-2 text-center text-stone-500 font-mono text-[11px] bg-stone-900/40 border-r border-stone-800 select-none">
                          {rowNumber}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 font-mono text-amber-400 font-bold">
                          {ing.id}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 font-bold text-stone-100">
                          {ing.name}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-stone-300">
                          {ing.unit}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-right font-mono font-bold text-stone-100">
                          {stock}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-right font-mono text-stone-400">
                          {min}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-right font-mono text-stone-300">
                          ${cost.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-right font-mono font-bold text-emerald-400">
                          ${totalAsset.toFixed(2)}
                        </td>
                        <td className="py-2 px-3">
                          {isDepleted ? (
                            <span className="text-rose-400 font-bold">⚠️ អស់ពីស្តុក / Depleted</span>
                          ) : isLow ? (
                            <span className="text-amber-400 font-bold">⚡ ស្តុកទាប / Low Stock</span>
                          ) : (
                            <span className="text-emerald-400 font-medium">គ្រប់គ្រាន់ / Plentiful</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================
            VIEW 4: STOCK MOVEMENTS AUDIT
           ================================================================= */}
        {activeSheet === 'movements' && (
          <div className="min-w-[1000px] p-4 select-text">
            <div className="border border-stone-800 rounded-lg overflow-hidden bg-stone-950">
              <table className="w-full border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-stone-900 text-stone-400 text-[11px] border-b border-stone-800 font-mono select-none">
                    <th className="w-12 py-1 px-2 border-r border-stone-800 text-center bg-stone-900/90">#</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">A</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">B</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">C</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">D</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">E</th>
                    <th className="py-1 px-3 border-r border-stone-800 text-center">F</th>
                    <th className="py-1 px-3 text-center">G</th>
                  </tr>
                  <tr className="bg-emerald-950/80 text-emerald-200 border-b border-emerald-800 text-xs font-bold">
                    <th className="py-2 px-2 border-r border-stone-800 text-center font-mono">Row</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">Ref ID</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">Timestamp</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">Movement Type</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">Product / Material</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-right">Quantity</th>
                    <th className="py-2 px-3 border-r border-stone-800 text-left">Reason / Notes</th>
                    <th className="py-2 px-3 text-left">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850">
                  {(stockMovements || []).map((mov, idx) => {
                    const rowNumber = idx + 1;
                    const qty = Number(mov.quantity) || 0;
                    return (
                      <tr 
                        key={mov.id || idx}
                        className="hover:bg-emerald-950/30 transition group cursor-pointer"
                        onClick={() => handleCellClick(`B${rowNumber}`, `${mov.productName}: ${qty}`)}
                      >
                        <td className="py-2 px-2 text-center text-stone-500 font-mono text-[11px] bg-stone-900/40 border-r border-stone-800 select-none">
                          {rowNumber}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 font-mono text-amber-400 font-bold">
                          {mov.id || `MOV-${String(rowNumber).padStart(4, '0')}`}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-stone-400">
                          {mov.timestamp ? new Date(mov.timestamp).toLocaleString('en-GB') : '-'}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-stone-200 font-medium">
                          {mov.type}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 font-bold text-stone-100">
                          {mov.productName || '-'}
                        </td>
                        <td className={`py-2 px-3 border-r border-stone-800 text-right font-mono font-bold ${
                          qty > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {qty > 0 ? `+${qty}` : qty} {mov.unit || ''}
                        </td>
                        <td className="py-2 px-3 border-r border-stone-800 text-stone-300">
                          {mov.reason || mov.notes || '-'}
                        </td>
                        <td className="py-2 px-3 text-stone-400">
                          {mov.operator || 'Staff'}
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

      {/* =====================================================================
          EXCEL WORKBOOK BOTTOM SHEET TABS (Authentic Excel Footer Tabs)
         ===================================================================== */}
      <div className="bg-stone-900 border-t border-stone-800 px-3 py-1 flex items-center justify-between gap-2 shrink-0 select-none">
        {/* Left Sheet Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {/* Sheet 4: Cambodia Standard (Provinces & Compliance) */}
          <button
            type="button"
            onClick={() => {
              setActiveSheet('provinces');
              setSelectedCell({ ref: 'B4', value: 'រាជធានីភ្នំពេញ / Phnom Penh Capital' });
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-t-lg font-sans text-xs transition border-t-2 cursor-pointer ${
              activeSheet === 'provinces'
                ? 'bg-stone-950 text-white font-bold border-emerald-500 shadow'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border-transparent hover:bg-stone-850'
            }`}
          >
            <CambodiaFlag className="w-3.5 h-2.5 rounded-xs" />
            <span>4_Cambodia_Standard_ស្តង់ដារ</span>
          </button>

          {/* Sheet 1: Menu Catalog */}
          <button
            type="button"
            onClick={() => {
              setActiveSheet('catalog');
              setSelectedCell({ ref: 'B1', value: 'Menu Catalog ($ & ៛)' });
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-t-lg font-sans text-xs transition border-t-2 cursor-pointer ${
              activeSheet === 'catalog'
                ? 'bg-stone-950 text-white font-bold border-emerald-500 shadow'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border-transparent hover:bg-stone-850'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>1_Menu_Catalog_បញ្ជីទំនិញ</span>
          </button>

          {/* Sheet 2: Raw Inventory */}
          <button
            type="button"
            onClick={() => {
              setActiveSheet('inventory');
              setSelectedCell({ ref: 'B1', value: 'Raw Materials & Depletion' });
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-t-lg font-sans text-xs transition border-t-2 cursor-pointer ${
              activeSheet === 'inventory'
                ? 'bg-stone-950 text-white font-bold border-emerald-500 shadow'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border-transparent hover:bg-stone-850'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-blue-400" />
            <span>2_Raw_Inventory_វត្ថុធាតុដើម</span>
          </button>

          {/* Sheet 3: Stock Movements */}
          <button
            type="button"
            onClick={() => {
              setActiveSheet('movements');
              setSelectedCell({ ref: 'B1', value: 'Stock Movements & Audit Ledger' });
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-t-lg font-sans text-xs transition border-t-2 cursor-pointer ${
              activeSheet === 'movements'
                ? 'bg-stone-950 text-white font-bold border-emerald-500 shadow'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border-transparent hover:bg-stone-850'
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span>3_Stock_Movements_ចលនាស្តុក</span>
          </button>
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-3 text-[11px] text-stone-400 font-mono">
          <span>READY</span>
          <span>100% Zoom</span>
        </div>
      </div>
    </div>
  );
};
export default CambodiaExcelInterface;
