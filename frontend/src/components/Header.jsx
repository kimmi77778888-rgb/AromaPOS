import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './common/LanguageSwitcher';
import { 
  Clock, 
  PlusCircle, 
  Tv, 
  Monitor,
  Layers, 
  ShoppingCart,
  LayoutDashboard,
  Boxes,
  Receipt,
  ChefHat,
  BarChart3,
  Users,
  Coffee,
  Lock,
  Unlock,
  Store,
  FileSpreadsheet,
  Menu,
  X
} from 'lucide-react';
import { StoreLogo } from './common/StoreLogo';

export const Header = ({ onOpenAddProduct }) => {
  const { 
    activeTab, 
    user, 
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    openCustomerDisplayWindow,
    setIsCustomerPreviewOpen,
    isPosFocusMode,
    setIsPosFocusMode,
    setIsProfileModalOpen,
    activeShift,
    openShiftModal,
    storeInfo,
    setIsStoreSettingsOpen
  } = useApp();

  const { isKhmer } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Contextual icon & metadata for the active tab
  const getTabInfo = () => {
    switch (activeTab) {
      case 'pos':
        return {
          icon: ShoppingCart,
          title: isKhmer ? 'ស្ថានីយគិតប្រាក់ (POS)' : 'POS Register',
          subtitle: isKhmer ? 'ការទទួលកម្ម៉ង់រហ័ស & កាត់ស្តុក' : 'Order taking & instant checkout'
        };
      case 'dashboard':
        return {
          icon: LayoutDashboard,
          title: isKhmer ? 'ផ្ទាំងគ្រប់គ្រងទូទៅ' : 'Store Dashboard',
          subtitle: isKhmer ? 'ចំណូលសរុបប្រចាំថ្ងៃ & និន្នាការលក់' : 'Real-time sales & performance'
        };
      case 'inventory':
        return {
          icon: Boxes,
          title: isKhmer ? 'ស្តុកទំនិញ & រូបមន្តផ្សំ' : 'Inventory & Recipes',
          subtitle: isKhmer ? 'គ្រប់គ្រងគ្រាប់កាហ្វេ & គ្រឿងផ្សំ' : 'Raw ingredients & recipe catalog'
        };
      case 'orders':
        return {
          icon: Receipt,
          title: isKhmer ? 'ប្រវត្តិការកម្ម៉ង់' : 'Order History',
          subtitle: isKhmer ? 'បញ្ជីវិក្កយបត្រ & ការបោះពុម្ព' : 'Receipt lookup & transaction ledger'
        };
      case 'kds':
        return {
          icon: ChefHat,
          title: isKhmer ? 'អេក្រង់ផ្ទះបាយ (KDS)' : 'Kitchen Display (KDS)',
          subtitle: isKhmer ? 'ជួររៀបចំភេសជ្ជៈសម្រាប់ Barista' : 'Drink preparation queue'
        };
      case 'reports':
        return {
          icon: BarChart3,
          title: isKhmer ? 'របាយការណ៍គ្រប់គ្រង' : 'Analytics & Reports',
          subtitle: isKhmer ? 'របាយការណ៍លក់ ថ្លៃដើម & Z-Report' : 'Profitability, sales & shift audit'
        };
      case 'staff':
        return {
          icon: Users,
          title: isKhmer ? 'បុគ្គលិក & សិទ្ធិប្រើប្រាស់' : 'Staff & Permissions',
          subtitle: isKhmer ? 'គណនីបុគ្គលិក & កូដ PIN' : 'Shift roster & PIN codes'
        };
      case 'cambodia-excel':
        return {
          icon: FileSpreadsheet,
          title: isKhmer ? 'តារាងស្តង់ដារកម្ពុជា & Excel' : 'Cambodia Standard Excel Master',
          subtitle: isKhmer ? 'បញ្ជីរដ្ឋបាលខេត្ត-ក្រុងទាំង២៥ តម្លៃទំនិញ ($/៛) & នាំចេញ Excel' : 'Official 25 Provinces, Menu Catalog ($/៛) & Clean Excel Lists'
        };
      default:
        return { 
          icon: Coffee,
          title: isKhmer ? 'ប្រព័ន្ធគ្រប់គ្រង' : 'Coffee Suite', 
          subtitle: 'Artisan Cafe Management' 
        };
    }
  };

  const { icon: TabIcon, title, subtitle } = getTabInfo();

  return (
    <header className="h-16 bg-stone-950/85 backdrop-blur-xl border-b border-stone-800/80 px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left: Mobile/iPad Drawer Toggle + Tab Title & Icon Badge */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-400 hover:bg-stone-850 transition cursor-pointer shrink-0"
          title="Open Navigation Menu"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-500 shadow-inner shrink-0">
          <TabIcon className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2 truncate">
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-stone-100 tracking-tight truncate">
            {title}
          </h1>
          <span className="hidden md:inline-block w-1 h-1 rounded-full bg-stone-600 shrink-0" />
          <p className="text-xs text-stone-400 font-medium hidden md:inline-block truncate">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Clean, Curated Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Full POS Focus Mode Toggle (Only on POS tab) */}
        {activeTab === 'pos' && (
          <button
            type="button"
            onClick={() => setIsPosFocusMode(!isPosFocusMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-amber-400 border border-stone-800 transition cursor-pointer"
            title="Toggle Full POS Screen Mode"
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">{isKhmer ? 'អេក្រង់ POS ពេញ' : 'Focus POS'}</span>
          </button>
        )}

        {/* Global Register Drawer / Shift Status Pill */}
        <button
          type="button"
          onClick={() => openShiftModal(activeShift ? 'ACTIVE' : 'OPEN')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
            activeShift
              ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-700/60 shadow-sm'
              : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-700/60 animate-pulse'
          }`}
          title={activeShift ? 'Manage Active Register Shift & Cash Drawer' : 'Click to Open Register Shift & Float'}
        >
          {activeShift ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="hidden sm:inline font-mono">{activeShift.staffName}</span>
              <span className="hidden md:inline text-stone-500">•</span>
              <span className="font-mono text-emerald-400 font-extrabold">
                ${(activeShift.expectedCash || (activeShift.startingFloat + (activeShift.cashSales || 0))).toFixed(2)}
              </span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>{isKhmer ? 'ហាងបានបិទ (បើកហាង)' : 'Store Closed (Open Store)'}</span>
            </>
          )}
        </button>

        {/* Dynamic Store Coffee Logo & Profile Button */}
        <button
          type="button"
          onClick={() => setIsStoreSettingsOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-amber-400 border border-stone-800 transition text-xs font-semibold cursor-pointer group"
          title="Click to customize Store Coffee Logo & Profile"
        >
          <StoreLogo size="xs" />
          <span className="hidden xl:inline font-bold text-stone-200 group-hover:text-amber-300">
            {storeInfo?.name || 'Aroma Coffee'}
          </span>
        </button>

        {/* Customer Facing Dual Screen Pop-out & In-tab Preview */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={openCustomerDisplayWindow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-amber-400 border border-stone-800 transition text-xs font-semibold cursor-pointer"
            title="Open Customer Facing Display on second monitor"
          >
            <Tv className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">{isKhmer ? 'អេក្រង់អតិថិជន' : 'Customer Screen'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCustomerPreviewOpen(true)}
            className="px-2 py-1.5 rounded-r-xl bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-amber-400 border-y border-r border-stone-800 transition text-xs cursor-pointer"
            title="Preview customer screen inside this window"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Contextual Action Button (Add Product on Inventory) */}
        {activeTab === 'inventory' && onOpenAddProduct && (
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'បញ្ចូលទំនិញថ្មី' : 'New Product'}</span>
          </button>
        )}

        {/* Live Monospace Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900/60 border border-stone-800/80 text-stone-300 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* Clean Language Switcher with Vector Flags */}
        <LanguageSwitcher size="sm" />
      </div>
    </header>
  );
};

