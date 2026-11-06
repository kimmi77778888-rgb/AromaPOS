import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Boxes, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Coffee, 
  XCircle,
  Layers,
  Sparkles,
  Package,
  Milk,
  Flame,
  Wheat,
  FileSpreadsheet,
  ChevronDown,
  Download,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  X,
  Tag,
  TrendingUp,
  AlertOctagon,
  Check,
  Truck,
  FileText,
  Filter,
  Calendar,
  User,
  Percent,
  RefreshCw,
  ShoppingBag,
  Scale,
  Copy
} from 'lucide-react';
import { CATEGORIES } from '../../services/coffeeData';
import { ProductFormModal } from './ProductFormModal';
import { IngredientFormModal } from './IngredientFormModal';
import { StockOperationModal } from './StockOperationModal';
import { DailyWasteModal } from './DailyWasteModal';
import { StocktakeAuditModal } from './StocktakeAuditModal';
import { CambodiaFlag } from '../common/FlagIcons';
import { exportCambodiaStandardCatalog } from '../../services/cambodiaExcelExport';
import { soundService } from '../../services/soundService';

export const InventoryManagement = ({ onOpenAddModal }) => {
  const { 
    products, 
    ingredients, 
    restockProduct, 
    restockIngredient, 
    deleteProduct, 
    lowStockProducts, 
    lowStockIngredients,
    storeInfo,
    user,
    showToast,
    stockMovements = [],
    recordStockIn,
    recordStockAdjustment,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    setActiveTab
  } = useApp();

  const { isKhmer, khrExchangeRate, formatUSD, formatKHR } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState('products'); // 'products' | 'ingredients' | 'movements'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Standard Universal Stock Operation Modal (Stock In / Adjustment for both Products & Ingredients)
  const [isStockOpModalOpen, setIsStockOpModalOpen] = useState(false);
  const [stockOpMode, setStockOpMode] = useState('STOCK_IN'); // 'STOCK_IN' | 'ADJUSTMENT'
  const [stockOpTarget, setStockOpTarget] = useState(null);

  // Raw Ingredient Create & Edit Modal
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);

  // F&B Standard Inventory Flow Modals
  const [isDailyWasteModalOpen, setIsDailyWasteModalOpen] = useState(false);
  const [isStocktakeAuditModalOpen, setIsStocktakeAuditModalOpen] = useState(false);

  const [movementFilterType, setMovementFilterType] = useState('all');

  const exportMenuRef = useRef(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.nameKm && p.nameKm.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || p.category === selectedCategory;
      const threshold = p.minStock || 5;
      const matchesLowStock = filterLowStockOnly ? (p.stock <= threshold || p.isAutoDisabled) : true;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, searchQuery, selectedCategory, filterLowStockOnly]);

  // Filtered Ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLow = filterLowStockOnly ? ing.stock <= ing.minThreshold : true;
      return matchesSearch && matchesLow;
    });
  }, [ingredients, searchQuery, filterLowStockOnly]);

  // Filtered Stock Movements
  const filteredMovements = useMemo(() => {
    return (stockMovements || []).filter((mov) => {
      const matchesSearch =
        (mov.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mov.productNameKm || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mov.reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mov.supplier || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mov.operator || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType =
        movementFilterType === 'all' ||
        mov.type === movementFilterType ||
        (movementFilterType === 'SPOILAGE' && (mov.type === 'SPOILAGE' || mov.reason === 'DAMAGED' || mov.reason === 'EXPIRED'));

      return matchesSearch && matchesType;
    });
  }, [stockMovements, searchQuery, movementFilterType]);

  // Financial Inventory Valuation Metrics
  const catalogValuation = useMemo(() => {
    const rate = khrExchangeRate || 4100;
    const totalRetailUSD = products.reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.price) || 0), 0);
    const totalCostUSD = products.reduce((sum, p) => {
      const unitCost = p.cost !== undefined && p.cost > 0 ? Number(p.cost) : Number(p.price || 0) * 0.35;
      return sum + (Number(p.stock) || 0) * unitCost;
    }, 0);
    const totalUnits = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    const totalKHR = Math.round(totalRetailUSD * rate);
    const marginPercent = totalRetailUSD > 0 ? (((totalRetailUSD - totalCostUSD) / totalRetailUSD) * 100).toFixed(1) : '0';

    return { totalRetailUSD, totalCostUSD, totalKHR, totalUnits, marginPercent };
  }, [products, khrExchangeRate]);

  // Financial Inventory Valuation for Raw Ingredients
  const ingredientsValuation = useMemo(() => {
    const rate = khrExchangeRate || 4100;
    const totalCostUSD = ingredients.reduce((sum, ing) => {
      const unitCost = Number(ing.costPerUnit) || 0;
      return sum + (Number(ing.stock) || 0) * unitCost;
    }, 0);
    const totalUnits = ingredients.reduce((sum, ing) => sum + (Number(ing.stock) || 0), 0);
    return {
      totalCostUSD: Math.round(totalCostUSD * 100) / 100,
      totalCostKHR: Math.round(totalCostUSD * rate),
      totalUnits
    };
  }, [ingredients, khrExchangeRate]);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDuplicate = (product) => {
    const cloned = {
      ...product,
      id: null,
      isDuplicate: true,
      name: `${product.name} (Copy)`,
      nameKm: product.nameKm ? `${product.nameKm} (ចម្លង)` : `${product.name} (Copy)`
    };
    setEditingProduct(cloned);
    setIsModalOpen(true);
    if (showToast) {
      showToast(isKhmer ? `បានចម្លងគំរូ "${product.name}" សម្រាប់បង្កើតថ្មី` : `Duplicated "${product.name}" template for new product`, 'info');
    }
  };

  const handleDelete = (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}" from catalog?`)) {
      deleteProduct(product.id);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // Handle Universal Stock In (Product or Ingredient)
  const handleOpenStockIn = (item = null) => {
    setStockOpMode('STOCK_IN');
    setStockOpTarget(item || null);
    setIsStockOpModalOpen(true);
  };

  // Handle Universal Stock Adjustment / Spoilage (Product or Ingredient)
  const handleOpenAdjustment = (item = null) => {
    setStockOpMode('ADJUSTMENT');
    setStockOpTarget(item || null);
    setIsStockOpModalOpen(true);
  };

  // Handle Raw Ingredient Create / Edit / Delete
  const handleOpenAddIngredient = () => {
    setEditingIngredient(null);
    setIsIngredientModalOpen(true);
  };

  const handleEditIngredient = (ing) => {
    setEditingIngredient(ing);
    setIsIngredientModalOpen(true);
  };

  const handleDuplicateIngredient = (ing) => {
    const cloned = {
      ...ing,
      id: null,
      name: `${ing.name} (Copy)`,
      nameKm: ing.nameKm ? `${ing.nameKm} (ចម្លង)` : `${ing.name} (Copy)`
    };
    setEditingIngredient(cloned);
    setIsIngredientModalOpen(true);
    if (showToast) {
      showToast(isKhmer ? `បានចម្លងគំរូ "${ing.name}"` : `Duplicated "${ing.name}" specs`, 'info');
    }
  };

  // Quick One-Tap Restock for Ingredients
  const handleQuickRestockIngredient = (ing) => {
    let amount = 50;
    if (ing.unit === 'g') amount = 500;
    else if (ing.unit === 'ml') amount = 1000;
    else if (ing.unit === 'cups' || ing.unit === 'pcs') amount = 50;

    restockIngredient(ing.id, amount);
    try {
      soundService.playSuccessSound();
    } catch {
      // ignore
    }
    if (showToast) {
      showToast(
        isKhmer
          ? `បានបន្ថែមស្តុក +${amount.toLocaleString()} ${ing.unit} ដល់ "${ing.name}"`
          : `Quick added +${amount.toLocaleString()} ${ing.unit} to "${ing.name}"`,
        'success'
      );
    }
  };

  // Quick One-Tap Restock for Products
  const handleQuickRestockProduct = (product, qty = 10) => {
    restockProduct(product.id, qty);
    try {
      soundService.playSuccessSound();
    } catch {
      // ignore
    }
    if (showToast) {
      showToast(
        isKhmer
          ? `បានបន្ថែមស្តុក +${qty} ដល់ "${product.name}"`
          : `Quick added +${qty} to "${product.name}"`,
        'success'
      );
    }
  };

  const handleDeleteIngredient = (ing) => {
    if (window.confirm(isKhmer 
      ? `តើអ្នកប្រាកដជាចង់លុប "${ing.name}" ពីបញ្ជីវត្ថុធាតុដើមមែនទេ?` 
      : `Are you sure you want to delete "${ing.name}" from raw materials?`)) {
      deleteIngredient(ing.id);
    }
  };

  // Export to Clean Cambodia Standard Excel (.xlsx)
  const handleExportExcel = (mode = 'all') => {
    setIsExportMenuOpen(false);
    try {
      soundService.playPaymentSuccessSound();
      const exportProductsList = (filterLowStockOnly || searchQuery || selectedCategory !== 'all') ? filteredProducts : products;
      const exportIngredientsList = (filterLowStockOnly || searchQuery) ? filteredIngredients : ingredients;
      const exportMovementsList = (searchQuery || movementFilterType !== 'ALL') ? filteredMovements : (stockMovements || []);

      const result = exportCambodiaStandardCatalog({
        products: exportProductsList,
        ingredients: exportIngredientsList,
        stockMovements: exportMovementsList,
        storeInfo,
        user,
        exchangeRate: khrExchangeRate || 4100,
        mode
      });

      if (showToast) {
        showToast(
          isKhmer
            ? `បាននាំចេញឯកសារ Excel ស្តង់ដារកម្ពុជា (${result.filename}) ដោយជោគជ័យ!`
            : `Exported clean Cambodia standard Excel (${result.filename}) successfully!`,
          'success'
        );
      }
    } catch (err) {
      console.error('Export Excel failed:', err);
      if (showToast) {
        showToast(isKhmer ? 'បរាជ័យក្នុងការនាំចេញឯកសារ Excel' : 'Failed to export Excel file', 'error');
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-stone-900/40">
      {/* Modern Header Navigation & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800/80 pb-5">
        <div className="segmented-tab-container inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-stone-950/80 border border-stone-800/80 shadow-inner">
          {/* Sub-Tab 1: Menu Products */}
          <button
            onClick={() => setActiveSubTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'products'
                ? 'segmented-tab-active shadow-md'
                : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900/60'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>{isKhmer ? 'បញ្ជីមុខទំនិញ' : 'Menu Catalog'}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeSubTab === 'products' ? 'bg-stone-950/20 text-stone-950' : 'bg-stone-850 text-stone-400'
            }`}>
              {products.length}
            </span>
          </button>

          {/* Sub-Tab 2: Raw Ingredients & BOM */}
          <button
            onClick={() => setActiveSubTab('ingredients')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer relative ${
              activeSubTab === 'ingredients'
                ? 'segmented-tab-active shadow-md'
                : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isKhmer ? 'វត្ថុធាតុដើម & រូបមន្ត' : 'Raw Materials & BOM'}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeSubTab === 'ingredients' ? 'bg-stone-950/20 text-stone-950' : 'bg-stone-850 text-stone-400'
            }`}>
              {ingredients.length}
            </span>
            {lowStockIngredients.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5"></span>
            )}
          </button>

          {/* Sub-Tab 3: Stock Movement & Audit Ledger */}
          <button
            onClick={() => setActiveSubTab('movements')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'movements'
                ? 'segmented-tab-active shadow-md'
                : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{isKhmer ? 'ប្រវត្តិនាំចេញ-ចូលស្តុក' : 'Movements & Audit'}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeSubTab === 'movements' ? 'bg-stone-950/20 text-stone-950' : 'bg-stone-850 text-stone-400'
            }`}>
              {stockMovements.length}
            </span>
          </button>
        </div>

        {/* Action Group: Cambodia Standard Excel Export & Stock Operations */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Cambodia Standard Excel (.xlsx) Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-850 border border-emerald-500/40 hover:border-emerald-400 text-stone-100 font-bold text-xs shadow-md shadow-emerald-950/30 transition active:scale-95 cursor-pointer group"
              title={isKhmer ? 'នាំចេញ Excel ស្តង់ដារកម្ពុជា' : 'Export clean Cambodia standard Excel (.xlsx)'}
            >
              <CambodiaFlag className="w-4 h-3 rounded-xs shadow-xs shrink-0" />
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition shrink-0" />
              <span className="font-sans">{isKhmer ? 'នាំចេញ Excel ស្តង់ដារកម្ពុជា' : 'Cambodia Standard Excel'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-stone-900/95 backdrop-blur-xl border border-stone-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-stone-800 text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CambodiaFlag className="w-3.5 h-2.5 rounded-xs" />
                    <span>{isKhmer ? 'ជម្រើសនាំចេញ Excel' : 'Cambodia Standard Exports'}</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">$1 = {khrExchangeRate || 4100}៛</span>
                </div>

                <div className="space-y-1 pt-1.5">
                  <button
                    type="button"
                    onClick={() => handleExportExcel('catalog')}
                    className="w-full p-2.5 rounded-xl hover:bg-emerald-950/40 text-left transition flex items-start gap-2.5 group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Coffee className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-100 group-hover:text-emerald-300">
                        {isKhmer ? '១. បញ្ជីមុខទំនិញស្តង់ដារកម្ពុជា (.xlsx)' : '1. Menu Items Catalog (.xlsx)'}
                      </p>
                      <p className="text-[11px] text-stone-400 leading-tight mt-0.5">
                        {isKhmer
                          ? 'កូដទំនិញ ឈ្មោះខ្មែរ-អង់គ្លេស តម្លៃ ($/៛) ថ្លៃដើម BOM & ស្ថានភាពស្តុក'
                          : 'Bilingual names, USD ($) & KHR (៛), BOM recipe cost & stock status'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportExcel('inventory')}
                    className="w-full p-2.5 rounded-xl hover:bg-stone-800 text-left transition flex items-start gap-2.5 group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-200 group-hover:text-amber-300">
                        {isKhmer ? '២. បញ្ជីស្តុកវត្ថុធាតុដើម & រូបមន្ត (.xlsx)' : '2. Raw Materials & Recipes (.xlsx)'}
                      </p>
                      <p className="text-[11px] text-stone-400 leading-tight mt-0.5">
                        {isKhmer
                          ? 'ស្តុកគ្រឿងផ្សំ តម្លៃក្នុង១ខ្នាត និងការព្យាករណ៍ទិញបន្ថែម'
                          : 'Ingredient stock levels, unit costs, and reorder forecasts'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportExcel('movements')}
                    className="w-full p-2.5 rounded-xl hover:bg-blue-950/40 text-left transition flex items-start gap-2.5 group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-200 group-hover:text-blue-300">
                        {isKhmer ? '៣. ប្រវត្តិនាំចូល និងកែសម្រួលស្តុក (.xlsx)' : '3. Stock Movements & Audit Ledger (.xlsx)'}
                      </p>
                      <p className="text-[11px] text-stone-400 leading-tight mt-0.5">
                        {isKhmer
                          ? 'កំណត់ត្រានាំចូល ខូចខាត ចាក់ចោល និងកែតម្រូវស្តុកជាក់ស្តែង'
                          : 'Stock-in, spoilage, adjustments with timestamps, units & operator'}
                      </p>
                    </div>
                  </button>

                  <div className="my-1 border-t border-stone-800/80"></div>

                  <button
                    type="button"
                    onClick={() => handleExportExcel('all')}
                    className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-stone-900 hover:from-emerald-900/60 hover:to-stone-850 text-left transition flex items-start gap-2.5 group cursor-pointer border border-emerald-500/30"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500 text-stone-950 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-emerald-300 group-hover:text-emerald-200 flex items-center gap-1.5">
                        <span>{isKhmer ? '៤. កញ្ចប់ពេញលេញ ៤ សន្លឹក (.xlsx)' : '4. Complete 4-Sheet Cambodian Workbook'}</span>
                      </p>
                      <p className="text-[11px] text-stone-400 leading-tight mt-0.5">
                        {isKhmer
                          ? 'រួមបញ្ចូលទាំង បញ្ជីទំនិញ + វត្ថុធាតុដើម + ចលនាស្តុក + ស្តង់ដារ ២៥ ខេត្ត-ក្រុង'
                          : 'Full master workbook: Catalog + Raw Inventory + Movements Audit + 25 Provinces NIS standard'}
                      </p>
                    </div>
                  </button>

                  <div className="my-1 border-t border-stone-800/80"></div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      setActiveTab('cambodia-excel');
                    }}
                    className="w-full p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-left transition flex items-center justify-between group cursor-pointer border border-emerald-500/40 text-emerald-300"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold">
                      <CambodiaFlag className="w-4 h-3 rounded-xs" />
                      <span>{isKhmer ? 'បើកផ្ទាំងតារាង Excel ស្តង់ដារកម្ពុជា' : 'Open Cambodia Excel Interface'}</span>
                    </span>
                    <span className="text-xs group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Universal Stock In Receiving */}
          <button
            type="button"
            onClick={() => handleOpenStockIn(null)}
            className="px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-100 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
            title={isKhmer ? 'កត់ត្រានាំចូលស្តុក' : 'Receive Stock In'}
          >
            <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
            <span>{isKhmer ? '📥 នាំចូលស្តុក' : '📥 Stock In'}</span>
          </button>

          {/* F&B Standard Daily Waste / Dial-In Button */}
          <button
            type="button"
            onClick={() => setIsDailyWasteModalOpen(true)}
            className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-100 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
            title={isKhmer ? 'កត់ត្រាការខូចខាត & កិនសាកល្បងម៉ាស៊ីនកាហ្វេ' : 'Log Daily Barista Dial-In & Spoilage Waste'}
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>{isKhmer ? '☕ កិនសាកល្បង & ខូច' : '☕ Dial-In & Waste'}</span>
          </button>

          {/* F&B Standard Physical Stocktake Audit Button */}
          <button
            type="button"
            onClick={() => setIsStocktakeAuditModalOpen(true)}
            className="px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-100 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
            title={isKhmer ? 'ផ្ទៀងផ្ទាត់ និងរាប់ស្តុកជាក់ស្តែង (Stocktake)' : 'Periodic Physical Stock Count & Variance Audit'}
          >
            <Scale className="w-4 h-4 text-amber-400" />
            <span>{isKhmer ? '📋 រាប់ស្តុកជាក់ស្តែង' : '📋 Stocktake Audit'}</span>
          </button>

          {/* Add Menu Product or Ingredient */}
          <button
            type="button"
            onClick={activeSubTab === 'products' ? handleOpenAdd : handleOpenAddIngredient}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-xs flex items-center gap-2 shadow-md shadow-amber-950/40 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{activeSubTab === 'products' ? (isKhmer ? 'បន្ថែមមុខទំនិញ' : 'New Product') : (isKhmer ? 'បន្ថែមគ្រឿងផ្សំ' : 'New Ingredient')}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row: Standard Financial & Operational Stock Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Products / Ingredients */}
        <div className="modern-kpi-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                {activeSubTab === 'products' 
                  ? (isKhmer ? 'មុខទំនិញ' : 'Menu Items') 
                  : activeSubTab === 'ingredients'
                  ? (isKhmer ? 'វត្ថុធាតុដើម' : 'Raw Materials')
                  : (isKhmer ? 'ប្រតិបត្តិការ' : 'Total Logs')}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20" title="Retail Valuation">
              ${activeSubTab === 'ingredients'
                ? ingredientsValuation.totalCostUSD.toFixed(0)
                : catalogValuation.totalRetailUSD.toFixed(0)}
            </span>
          </div>
          <p className="text-2xl font-black text-stone-100 font-mono mt-2 tracking-tight">
            {activeSubTab === 'products' 
              ? products.length 
              : activeSubTab === 'ingredients' 
              ? ingredients.length 
              : stockMovements.length}
          </p>
          <p className="text-xs text-stone-400 font-medium mt-1 leading-relaxed">
            {activeSubTab === 'ingredients' 
              ? `${ingredients.length} ${isKhmer ? 'មុខគ្រឿងផ្សំក្នុងស្តុក' : 'ingredients in catalog'}`
              : `${catalogValuation.totalUnits} ${isKhmer ? 'ឯកតាក្នុងស្តុក' : 'total units in stock'}`}
          </p>
        </div>

        {/* Card 2: Cost of Goods (COGS) / Inventory Asset Valuation */}
        <div className="modern-kpi-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                {activeSubTab === 'ingredients'
                  ? (isKhmer ? 'តម្លៃដើមស្តុក' : 'Raw Asset')
                  : (isKhmer ? 'ថ្លៃដើម (COGS)' : 'Inventory Cost')}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {activeSubTab === 'ingredients'
                ? `${ingredients.length} items`
                : `${catalogValuation.marginPercent}% ${isKhmer ? 'ចំណេញ' : 'Margin'}`}
            </span>
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono mt-2 tracking-tight">
            ${activeSubTab === 'ingredients'
              ? ingredientsValuation.totalCostUSD.toFixed(0)
              : catalogValuation.totalCostUSD.toFixed(0)}
          </p>
          <p className="text-xs text-stone-400 font-medium mt-1 leading-relaxed">
            ៛{(activeSubTab === 'ingredients'
              ? ingredientsValuation.totalCostKHR
              : Math.round(catalogValuation.totalCostUSD * (khrExchangeRate || 4100))).toLocaleString()}
          </p>
        </div>

        {/* Card 3: Adequate Stock */}
        <div className="modern-kpi-card">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              {isKhmer ? 'ស្តុកគ្រប់គ្រាន់' : 'Adequate Stock'}
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-2 tracking-tight">
            {activeSubTab === 'products'
              ? products.filter((p) => p.stock > (p.minStock || 5) && !p.isAutoDisabled).length
              : ingredients.filter((i) => i.stock > i.minThreshold).length}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400 font-medium">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isKhmer ? 'ត្រៀមបម្រើការលក់' : 'Ready for sale'}</span>
          </div>
        </div>

        {/* Card 4: Low Stock Warnings */}
        <div
          onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
          className={`modern-kpi-card cursor-pointer ${
            (activeSubTab === 'products' ? lowStockProducts.length : lowStockIngredients.length) > 0
              ? 'ring-1 ring-rose-500/50 bg-rose-950/30'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                {isKhmer ? 'ការព្រមានស្តុកតិច' : 'Low Stock Alert'}
              </span>
            </div>
            {(activeSubTab === 'products' ? lowStockProducts.length : lowStockIngredients.length) > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </div>
          <p className="text-2xl font-black text-rose-400 font-mono mt-2 tracking-tight">
            {activeSubTab === 'products' ? lowStockProducts.length : lowStockIngredients.length}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-rose-400/90 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'ចុចដើម្បីត្រងមើល' : 'Click to filter'}</span>
          </div>
        </div>

        {/* Card 5: Disabled / Depleted Items */}
        <div className="modern-kpi-card">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              {activeSubTab === 'movements' 
                ? (isKhmer ? 'កត់ត្រានាំចូល' : 'Stock In Logs') 
                : (isKhmer ? 'ទំនិញត្រូវបានផ្អាក' : 'Auto-Disabled')}
            </span>
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono mt-2 tracking-tight">
            {activeSubTab === 'movements'
              ? stockMovements.filter((m) => m.type === 'STOCK_IN').length
              : products.filter((p) => p.isAutoDisabled).length}
          </p>
          <p className="text-xs text-stone-400 font-medium mt-1 leading-relaxed">
            {activeSubTab === 'movements' 
              ? `${stockMovements.filter((m) => m.type === 'SPOILAGE').length} ${isKhmer ? 'កំណត់ត្រាខូចខាត' : 'spoilage logs'}`
              : (isKhmer ? 'ខ្វះគ្រឿងផ្សំរូបមន្ត' : 'BOM recipe depleted')}
          </p>
        </div>
      </div>

      {/* Modern Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 backdrop-blur-md shadow-lg">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeSubTab === 'products'
                ? (isKhmer ? 'ស្វែងរកទំនិញតាមឈ្មោះ ខ្មែរ/អង់គ្លេស SKU...' : 'Filter products by name, Khmer name, category, SKU...')
                : activeSubTab === 'ingredients'
                ? (isKhmer ? 'ស្វែងរកវត្ថុធាតុដើម (beans, milk, cups)...' : 'Search raw ingredients (beans, milk, cups)...')
                : (isKhmer ? 'ស្វែងរកលេខយោង ឈ្មោះទំនិញ អ្នកកត់ត្រា...' : 'Search movement ref, product name, operator...')
            }
            className="w-full bg-stone-900/90 border border-stone-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-12 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none transition shadow-inner font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 text-xs px-1.5 py-0.5 rounded hover:bg-stone-800 transition"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeSubTab === 'products' && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-stone-900 border border-stone-800 text-stone-200 text-xs font-medium rounded-xl py-2 px-3 focus:outline-none focus:border-amber-500 transition cursor-pointer"
            >
              <option value="all">{isKhmer ? 'គ្រប់ប្រភេទទាំងអស់' : 'All Categories'}</option>
              {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {activeSubTab === 'movements' && (
            <div className="flex items-center gap-1 bg-stone-900/90 p-1 rounded-xl border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setMovementFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  movementFilterType === 'all' ? 'bg-amber-500 text-stone-950 shadow-sm' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isKhmer ? 'ទាំងអស់' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setMovementFilterType('STOCK_IN')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  movementFilterType === 'STOCK_IN' ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-400 hover:text-emerald-300'
                }`}
              >
                📥 {isKhmer ? 'នាំចូល' : 'Stock In'}
              </button>
              <button
                type="button"
                onClick={() => setMovementFilterType('SALE_OUT')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  movementFilterType === 'SALE_OUT' ? 'bg-sky-600 text-white shadow-sm' : 'text-stone-400 hover:text-sky-300'
                }`}
              >
                🛒 {isKhmer ? 'លក់ចេញ' : 'Sales'}
              </button>
              <button
                type="button"
                onClick={() => setMovementFilterType('SPOILAGE')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  movementFilterType === 'SPOILAGE' ? 'bg-rose-600 text-white shadow-sm' : 'text-stone-400 hover:text-rose-300'
                }`}
              >
                🍂 {isKhmer ? 'ខូចខាត' : 'Spoilage'}
              </button>
              <button
                type="button"
                onClick={() => setMovementFilterType('ADJUSTMENT')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  movementFilterType === 'ADJUSTMENT' ? 'bg-amber-500 text-stone-950 shadow-sm' : 'text-stone-400 hover:text-amber-300'
                }`}
              >
                📋 {isKhmer ? 'កែសម្រួល' : 'Adjust'}
              </button>
            </div>
          )}

          {activeSubTab !== 'movements' && (
            <button
              type="button"
              onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                filterLowStockOnly
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50 ring-1 ring-rose-400'
                  : 'bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 hover:text-stone-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{isKhmer ? 'ត្រងស្តុកទាប' : 'Low Stock Only'}</span>
            </button>
          )}

          {/* Quick Export Button */}
          <button
            type="button"
            onClick={() => handleExportExcel(activeSubTab === 'products' ? 'catalog' : 'inventory')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer bg-stone-900 hover:bg-emerald-950/60 text-stone-200 hover:text-emerald-300 border border-stone-800 hover:border-emerald-600/50"
            title={isKhmer ? 'ទាញយក Excel បញ្ជីនេះ' : 'Quick export this view to Excel (.xlsx)'}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isKhmer ? 'ទាញយក Excel' : 'Quick Export'}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Menu Products Catalog Table with Standard Stock Actions */}
      {activeSubTab === 'products' && (
        <div className="rounded-2xl border border-stone-800/80 bg-stone-900/70 overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950/95 border-b border-stone-800 uppercase tracking-wider text-[11px] text-stone-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">{isKhmer ? 'មុខទំនិញ' : 'Product'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'ប្រភេទ' : 'Category'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'ថ្លៃដើម / តម្លៃលក់ / ចំណេញ' : 'Cost / Price / Margin'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'ស្តុក & ខ្នាត' : 'Physical Stock & UOM'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'កម្រិតប្រកាស' : 'Min Alert'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'ស្ថានភាព POS' : 'Terminal Status'}</th>
                  <th className="py-3.5 px-4 text-right">{isKhmer ? 'សកម្មភាពស្តុក & កែប្រែ' : 'Stock Actions & Edit'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                {filteredProducts.map((product) => {
                  const minThreshold = product.minStock || 5;
                  const isLow = product.stock > 0 && product.stock <= minThreshold;
                  const isDepleted = product.stock <= 0;
                  const isAutoDisabled = product.isAutoDisabled;
                  const unitCost = product.cost !== undefined ? Number(product.cost) : Number(product.price) * 0.35;
                  const marginPct = product.price > 0 ? (((product.price - unitCost) / product.price) * 100).toFixed(0) : '0';

                  return (
                    <tr key={product.id} className="hover:bg-stone-800/40 transition group modern-table-row">
                      {/* Product Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover ring-1 ring-stone-800 shrink-0 shadow-md"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-stone-100 text-sm group-hover:text-amber-400 transition truncate max-w-xs">
                              {product.name}
                            </p>
                            {product.nameKm && product.nameKm !== product.name && (
                              <p className="text-xs text-amber-300/90 font-medium truncate max-w-xs mt-0.5">
                                {product.nameKm}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-stone-400 font-mono bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">
                                {product.sku}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-stone-950 text-stone-300 border border-stone-800 text-[11px] font-medium whitespace-nowrap">
                          {product.categoryKm ? `${product.categoryKm} (${product.category})` : product.category}
                        </span>
                      </td>

                      {/* Cost / Price / Margin */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400 text-sm">
                              ${product.price.toFixed(2)}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                              +{marginPct}%
                            </span>
                          </div>
                          <span className="text-xs text-stone-300 block">
                            ៛{(Math.round(product.price * (khrExchangeRate || 4100))).toLocaleString()}
                          </span>
                          <span className="text-[11px] text-stone-500 block">
                            {isKhmer ? 'ថ្លៃដើម' : 'COGS'}: ${unitCost.toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* Stock Count & UOM */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => restockProduct(product.id, -1)}
                              disabled={product.stock <= 0}
                              className="w-6 h-6 rounded-lg bg-stone-950 border border-stone-800 hover:border-amber-500 text-stone-400 hover:text-stone-100 flex items-center justify-center transition disabled:opacity-30 cursor-pointer font-bold"
                              title="Decrease 1"
                            >
                              -
                            </button>
                            <span
                              className={`min-w-[40px] text-center font-mono font-bold text-sm ${
                                isDepleted ? 'text-rose-500 font-extrabold line-through' : isLow ? 'text-rose-400 font-extrabold' : 'text-stone-100'
                              }`}
                            >
                              {product.stock}
                            </span>
                            <button
                              onClick={() => restockProduct(product.id, 1)}
                              className="w-6 h-6 rounded-lg bg-stone-950 border border-stone-800 hover:border-amber-500 text-stone-400 hover:text-stone-100 flex items-center justify-center transition cursor-pointer font-bold"
                              title="Increase 1"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleQuickRestockProduct(product, 10)}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 transition ml-0.5 cursor-pointer"
                              title="Quick +10 units"
                            >
                              +10
                            </button>
                          </div>
                          <span className="inline-block px-2 py-0.5 rounded-full bg-stone-950 text-stone-400 border border-stone-800 text-[10px] font-medium">
                            {product.uom || 'Cup'}
                          </span>
                        </div>
                      </td>

                      {/* Minimum Alert Threshold */}
                      <td className="py-3 px-4 font-mono">
                        <span className={`text-xs ${product.stock <= minThreshold ? 'text-rose-400 font-bold' : 'text-stone-400'}`}>
                          &le; {minThreshold} {product.uom || 'Cup'}
                        </span>
                      </td>

                      {/* POS Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isAutoDisabled ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-600 text-[11px] font-extrabold shadow-sm">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>Auto-Disabled</span>
                          </span>
                        ) : isDepleted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-700 text-[11px] font-extrabold">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>Out of Stock</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600 text-white font-extrabold text-[11px] animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low ({product.stock} left)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Live on POS</span>
                          </span>
                        )}
                      </td>

                      {/* Actions: Stock In, Adjustment, Duplicate, Edit, Delete */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Stock In Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenStockIn(product)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                            title={isKhmer ? 'កត់ត្រានាំចូលស្តុក' : 'Receive Stock In'}
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                            <span>{isKhmer ? 'នាំចូល' : '+ In'}</span>
                          </button>

                          {/* Adjustment / Spoilage Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustment(product)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                            title={isKhmer ? 'កែសម្រួល / ខូចខាត' : 'Record Spoilage / Adjustment'}
                          >
                            <AlertOctagon className="w-3.5 h-3.5" />
                            <span>{isKhmer ? 'ខូច/កែ' : 'Adjust'}</span>
                          </button>

                          {/* Action Icon Cluster */}
                          <div className="flex items-center gap-1 bg-stone-950/70 p-1 rounded-xl border border-stone-800/80">
                            {/* Duplicate Product Specs */}
                            <button
                              onClick={() => handleDuplicate(product)}
                              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                              title={isKhmer ? "ចម្លងគំរូទំនិញនេះ (Duplicate)" : "Duplicate Product Specs"}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Product Master */}
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-amber-400 transition cursor-pointer"
                              title="Edit Product Specs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(product)}
                              className="p-1.5 rounded-lg hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 transition cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Raw Ingredients & Recipe BOM Table */}
      {activeSubTab === 'ingredients' && (
        <div className="rounded-2xl border border-stone-800/80 bg-stone-900/70 overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950/95 border-b border-stone-800 uppercase tracking-wider text-[11px] text-stone-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">{isKhmer ? 'វត្ថុធាតុដើម & រូបមន្ត' : 'Raw Material & Recipes'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'ខ្នាត & ប្រភេទ' : 'UOM & Category'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'ស្តុកបច្ចុប្បន្ន' : 'Current Physical Stock'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'កម្រិតសុវត្ថិភាព' : 'Safety Min Alert'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'ថ្លៃដើម & តម្លៃស្តុក' : 'Unit Cost & Asset Val'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'ស្ថានភាព' : 'Status Alert'}</th>
                  <th className="py-3.5 px-4 text-right">{isKhmer ? 'សកម្មភាពបំពេញស្តុក & គ្រប់គ្រង' : 'Stock Restock & Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                {filteredIngredients.map((ing) => {
                  const isLow = ing.stock <= ing.minThreshold && ing.stock > 0;
                  const isDepleted = ing.stock <= 0;
                  const unitCost = Number(ing.costPerUnit) || 0;
                  const totalValUSD = Math.round(unitCost * (Number(ing.stock) || 0) * 100) / 100;
                  const totalValKHR = Math.round(totalValUSD * (khrExchangeRate || 4100));

                  // Find which menu products use this ingredient in their recipe BOM
                  const linkedProducts = products.filter(
                    (p) => Array.isArray(p.recipe) && p.recipe.some((r) => r.ingredientId === ing.id)
                  );

                  return (
                    <tr key={ing.id} className="hover:bg-stone-800/40 transition group modern-table-row">
                      {/* Name, Khmer Name, SKU & Linked Recipes */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-950/70 to-stone-900 border border-amber-800/50 flex items-center justify-center text-amber-500 font-bold shrink-0 text-lg shadow-sm">
                            {ing.unit === 'g' ? '🫘' : ing.unit === 'ml' ? '🥛' : ing.unit === 'cups' ? '🥤' : '🥐'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-stone-100 text-sm group-hover:text-amber-400 transition">
                              {ing.name}
                            </p>
                            {ing.nameKm && ing.nameKm !== ing.name && (
                              <p className="text-xs text-amber-300/90 font-medium mt-0.5">
                                {ing.nameKm}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] text-stone-400 font-mono bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">
                                {ing.id}
                              </span>
                              {linkedProducts.length > 0 ? (
                                <span className="text-[11px] text-amber-400/90 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50 flex items-center gap-1 font-medium">
                                  <Coffee className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>
                                    {isKhmer ? `ប្រើក្នុង ${linkedProducts.length} មុខ:` : `Used in ${linkedProducts.length} drinks:`} {linkedProducts.map((p) => p.name).slice(0, 2).join(', ')}{linkedProducts.length > 2 ? '...' : ''}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-500 italic">
                                  {isKhmer ? 'មិនទាន់ភ្ជាប់ក្នុងរូបមន្ត' : 'Not linked to recipes yet'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Unit */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-stone-950 text-stone-300 border border-stone-800 text-[11px] font-medium whitespace-nowrap">
                          {ing.category || 'General'} ({ing.unit})
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-sm whitespace-nowrap">
                        <span className={isDepleted ? 'text-rose-500 line-through' : isLow ? 'text-rose-400' : 'text-stone-100'}>
                          {(Number(ing.stock) || 0).toLocaleString()} <span className="text-xs text-stone-400 font-normal">{ing.unit}</span>
                        </span>
                      </td>

                      {/* Safety Min Alert */}
                      <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                        <span className={ing.stock <= ing.minThreshold ? 'text-rose-400 font-bold' : 'text-stone-400'}>
                          &le; {(Number(ing.minThreshold) || 0).toLocaleString()} {ing.unit}
                        </span>
                      </td>

                      {/* Cost & Asset Valuation */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-emerald-400 block">
                          ${totalValUSD.toFixed(2)}
                        </span>
                        <span className="text-xs text-stone-400 block mt-0.5">
                          ៛{totalValKHR.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          @${unitCost.toFixed(3)}/{ing.unit}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isDepleted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-700 text-[11px] font-extrabold shadow-sm">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>{isKhmer ? '❌ អស់ពីស្តុក' : 'Depleted'}</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600 text-white font-extrabold text-[11px] animate-pulse shadow-sm">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{isKhmer ? '⚠️ ស្តុកទាប' : 'Low Stock'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isKhmer ? '✓ គ្រប់គ្រាន់' : 'Plentiful'}</span>
                          </span>
                        )}
                      </td>

                      {/* Standard Workflow Actions: Quick Restock Chip + Actions Cluster */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Quick One-Tap Restock Chip */}
                          <button
                            type="button"
                            onClick={() => handleQuickRestockIngredient(ing)}
                            className="quick-restock-chip"
                            title={isKhmer ? `ចុចដើម្បីបន្ថែមស្តុក +${ing.unit === 'g' ? '500g' : ing.unit === 'ml' ? '1,000ml' : '50 units'}` : `Quick restock +${ing.unit === 'g' ? '500g' : ing.unit === 'ml' ? '1,000ml' : '50 units'}`}
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            <span>
                              +{ing.unit === 'g' ? '500g' : ing.unit === 'ml' ? '1,000ml' : '50 units'}
                            </span>
                          </button>

                          {/* Workflow Action Buttons Cluster */}
                          <div className="flex items-center gap-1 bg-stone-950/70 p-1 rounded-xl border border-stone-800/80">
                            {/* Receive Stock In Modal */}
                            <button
                              type="button"
                              onClick={() => handleOpenStockIn(ing)}
                              className="p-1.5 rounded-lg hover:bg-emerald-950/60 text-stone-400 hover:text-emerald-400 transition cursor-pointer"
                              title={isKhmer ? 'កត់ត្រានាំចូលស្តុកលម្អិត (+ In)' : 'Receive Detailed Stock In'}
                            >
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                            </button>

                            {/* Adjustment / Spoilage Modal */}
                            <button
                              type="button"
                              onClick={() => handleOpenAdjustment(ing)}
                              className="p-1.5 rounded-lg hover:bg-amber-950/60 text-stone-400 hover:text-amber-400 transition cursor-pointer"
                              title={isKhmer ? 'កែសម្រួលស្តុក ឬខូចខាត (Adjust)' : 'Record Spoilage / Adjustment'}
                            >
                              <Scale className="w-3.5 h-3.5" />
                            </button>

                            {/* Duplicate Ingredient */}
                            <button
                              type="button"
                              onClick={() => handleDuplicateIngredient(ing)}
                              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                              title={isKhmer ? 'ចម្លងគំរូគ្រឿងផ្សំនេះ (Duplicate)' : 'Duplicate Ingredient Specs'}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Master Details */}
                            <button
                              type="button"
                              onClick={() => handleEditIngredient(ing)}
                              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-amber-400 transition cursor-pointer"
                              title={isKhmer ? 'កែសម្រួលព័ត៌មាន (Edit)' : 'Edit Ingredient Specs'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteIngredient(ing)}
                              className="p-1.5 rounded-lg hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 transition cursor-pointer"
                              title={isKhmer ? 'លុបចេញពីបញ្ជី (Delete)' : 'Delete Ingredient'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Stock Movements & Audit Ledger */}
      {activeSubTab === 'movements' && (
        <div className="rounded-2xl border border-stone-800/80 bg-stone-900/70 overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950/95 border-b border-stone-800 uppercase tracking-wider text-[11px] text-stone-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">{isKhmer ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Date & Time'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'ប្រភេទប្រតិបត្តិការ' : 'Movement Type'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'មុខទំនិញ' : 'Product'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'បរិមាណ' : 'Qty Delta'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'ស្តុកនៅសល់' : 'Balance'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'តម្លៃ / ថ្លៃដើម' : 'Cost / Value'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'លេខយោង & មូលហេតុ' : 'Reference & Reason'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'អ្នកកត់ត្រា' : 'Operator'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-stone-500">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-semibold">{isKhmer ? 'មិនមានប្រវត្តិប្រតិបត្តិការស្តុកនៅឡើយទេ' : 'No stock movements recorded yet'}</p>
                      <p className="text-xs text-stone-500 mt-1">{isKhmer ? 'រាល់ការលក់ ការនាំចូលស្តុក ឬការខូចខាតនឹងបង្ហាញនៅទីនេះ' : 'All POS sales, receiving stock-in, and waste adjustments will log here automatically'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((mov) => {
                    const isPositive = mov.quantity > 0;
                    return (
                      <tr key={mov.id} className="hover:bg-stone-800/40 transition modern-table-row">
                        {/* Timestamp */}
                        <td className="py-3 px-4 font-mono text-stone-400 whitespace-nowrap">
                          {new Date(mov.date).toLocaleDateString()} {new Date(mov.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        {/* Movement Type */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {mov.type === 'STOCK_IN' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[11px] font-bold">
                              <ArrowDownToLine className="w-3 h-3" />
                              <span>{isKhmer ? 'នាំចូលស្តុក' : 'Stock In'}</span>
                            </span>
                          )}
                          {mov.type === 'SALE_OUT' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950 text-sky-400 border border-sky-800/60 text-[11px] font-bold">
                              <ShoppingBag className="w-3 h-3" />
                              <span>{isKhmer ? 'លក់ចេញ' : 'Sale Out'}</span>
                            </span>
                          )}
                          {mov.type === 'SPOILAGE' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800/60 text-[11px] font-bold">
                              <AlertOctagon className="w-3 h-3" />
                              <span>{isKhmer ? 'ខូចខាត / ហួសកាល' : 'Spoilage / Waste'}</span>
                            </span>
                          )}
                          {mov.type === 'ADJUSTMENT' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60 text-[11px] font-bold">
                              <History className="w-3 h-3" />
                              <span>{isKhmer ? 'កែសម្រួលស្តុក' : 'Adjustment'}</span>
                            </span>
                          )}
                        </td>

                        {/* Product */}
                        <td className="py-3 px-4">
                          <p className="font-bold text-stone-100 text-sm">{mov.productName}</p>
                          {mov.productNameKm && mov.productNameKm !== mov.productName && (
                            <p className="text-xs text-amber-300/90 font-medium mt-0.5">{mov.productNameKm}</p>
                          )}
                        </td>

                        {/* Quantity Delta */}
                        <td className="py-3 px-4 font-mono font-bold text-sm">
                          <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                            {isPositive ? `+${mov.quantity}` : mov.quantity}
                          </span>
                        </td>

                        {/* Balance */}
                        <td className="py-3 px-4 font-mono text-stone-300">
                          {mov.newStock}
                        </td>

                        {/* Cost & Total Value */}
                        <td className="py-3 px-4 font-mono">
                          {mov.unitCost ? (
                            <div>
                              <span className="text-emerald-400 font-bold block">${Number(mov.totalCost || (mov.unitCost * Math.abs(mov.quantity))).toFixed(2)}</span>
                              <span className="text-[11px] text-stone-500 block">@${Number(mov.unitCost).toFixed(2)}/u</span>
                            </div>
                          ) : (
                            <span className="text-stone-500">-</span>
                          )}
                        </td>

                        {/* Reference / Supplier / Reason */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            {mov.reference && (
                              <span className="text-[10px] font-mono font-bold text-amber-400 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 inline-block">
                                {mov.reference}
                              </span>
                            )}
                            {mov.supplier && (
                              <p className="text-xs text-stone-300 flex items-center gap-1">
                                <Truck className="w-3 h-3 text-stone-500" />
                                <span>{mov.supplier}</span>
                              </p>
                            )}
                            {mov.reason && (
                              <p className="text-xs text-stone-400 italic">
                                {mov.reason}
                              </p>
                            )}
                            {mov.notes && (
                              <p className="text-xs text-stone-500">
                                {mov.notes}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Operator */}
                        <td className="py-3 px-4 font-medium text-stone-300 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <User className="w-3 h-3 text-stone-500" />
                            <span>{mov.operator || 'System'}</span>
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
      )}

      {/* Universal Stock Operations Modal (Handles Stock In + Spoilage/Adjustment for both Products & Ingredients) */}
      <StockOperationModal
        isOpen={isStockOpModalOpen}
        onClose={() => {
          setIsStockOpModalOpen(false);
          setStockOpTarget(null);
        }}
        initialMode={stockOpMode}
        targetItem={stockOpTarget}
      />

      {/* Raw Ingredient Create / Edit Modal */}
      <IngredientFormModal
        isOpen={isIngredientModalOpen}
        onClose={() => {
          setIsIngredientModalOpen(false);
          setEditingIngredient(null);
        }}
        ingredientToEdit={editingIngredient}
      />

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={editingProduct}
      />

      {/* F&B Standard Daily Waste & Dial-In Logger Modal */}
      <DailyWasteModal
        isOpen={isDailyWasteModalOpen}
        onClose={() => setIsDailyWasteModalOpen(false)}
      />

      {/* F&B Standard Physical Stocktake & Variance Audit Modal */}
      <StocktakeAuditModal
        isOpen={isStocktakeAuditModalOpen}
        onClose={() => setIsStocktakeAuditModalOpen(false)}
      />
    </div>
  );
};
