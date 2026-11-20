import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './common/LanguageSwitcher';
import { ThemeSwitcher } from './common/ThemeSwitcher';
import { 
  Clock, 
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
  Menu,
  Bike,
  SlidersHorizontal
} from 'lucide-react';
import { soundService } from '../services/soundService';

export const Header = ({ onOpenAddProduct }) => {
  const { 
    activeTab, 
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    openCustomerDisplayWindow,
    setIsCustomerPreviewOpen,
    isPosFocusMode,
    setIsPosFocusMode,
    activeShift,
    openShiftModal
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
          title: isKhmer ? 'ផ្ទាំងគ្រប់គ្រងអាជីវកម្ម' : 'Store Dashboard',
          subtitle: isKhmer ? 'ចំណូលសរុប & ស្ថិតិលក់ជាក់ស្តែង' : 'Real-time sales & performance metrics'
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
      case 'delivery':
        return {
          icon: Bike,
          title: isKhmer ? 'ផែនទីដឹកជញ្ជូន (Delivery)' : 'Delivery Fleet',
          subtitle: isKhmer ? 'តាមដានអ្នកដឹកជញ្ជូនជាក់ស្តែង' : 'Live courier dispatch & tracking'
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
      case 'slideshow':
        return {
          icon: SlidersHorizontal,
          title: isKhmer ? 'គ្រប់គ្រង Slideshow & Footer' : 'Slideshow & Footer Manager',
          subtitle: isKhmer ? 'កែប្រែផ្ទាំងរូបភាពស្លាយ អក្សររត់ & ព័ត៌មានខាងក្រោម' : 'Homepage showcase banners, marquee ticker & footer details'
        };
      default:
        return { 
          icon: Coffee,
          title: isKhmer ? 'ប្រព័ន្ធគ្រប់គ្រង' : 'Aroma Suite', 
          subtitle: 'Artisan Cafe Management' 
        };
    }
  };

  const { icon: TabIcon, title, subtitle } = getTabInfo();

  return (
    <header className="h-16 bg-stone-950/95 backdrop-blur-xl border-b border-stone-850 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left: Mobile Drawer Toggle + Clear Tab Title & Subtitle */}
      <div className="flex items-center gap-3 min-w-0 pr-4">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-400 hover:bg-stone-850 transition cursor-pointer shrink-0"
          title="Open Navigation Menu"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
          <TabIcon className="w-4 h-4 stroke-[2.2]" />
        </div>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate leading-tight">
            {title}
          </h1>
          <p className="text-xs text-stone-400 font-medium truncate hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Clean, Uncluttered, Standard POS Toolbar */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Full POS Focus Mode Toggle (Only on POS tab) */}
        {activeTab === 'pos' && (
          <button
            type="button"
            onClick={() => setIsPosFocusMode(!isPosFocusMode)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-amber-400 border border-stone-800 transition cursor-pointer"
            title="Toggle Full POS Screen Mode"
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>{isKhmer ? 'អេក្រង់ពេញ' : 'Focus'}</span>
          </button>
        )}

        {/* Register Shift Status Pill */}
        <button
          type="button"
          onClick={() => openShiftModal(activeShift ? 'ACTIVE' : 'OPEN')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
            activeShift
              ? 'bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border-emerald-600/40 shadow-sm'
              : 'bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border-amber-600/40'
          }`}
          title={activeShift ? 'Active Register Shift' : 'Click to Open Shift'}
        >
          {activeShift ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="hidden md:inline font-sans">{activeShift.staffName || 'Active'}</span>
              <span className="hidden md:inline text-stone-500">•</span>
              <span className="font-mono text-emerald-400 font-black">
                ${(activeShift.expectedCash || (activeShift.startingFloat + (activeShift.cashSales || 0))).toFixed(2)}
              </span>
            </>
          ) : (
            <>
              <Lock className="w-3 h-3 text-amber-400" />
              <span className="font-sans">{isKhmer ? 'បើកវេន' : 'Open Shift'}</span>
            </>
          )}
        </button>

        {/* Customer Screen Trigger */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={openCustomerDisplayWindow}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-l-xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-amber-400 border border-stone-800 transition text-xs font-semibold cursor-pointer"
            title="Open Customer Facing Display window"
          >
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{isKhmer ? 'អេក្រង់អតិថិជន' : 'Customer Display'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCustomerPreviewOpen(true)}
            className="px-2 py-1.5 rounded-r-xl bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-amber-400 border-y border-r border-stone-800 transition text-xs cursor-pointer"
            title="Preview customer screen"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Digital Monospace Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900/70 border border-stone-800 text-stone-300 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* Theme Switcher */}
        <ThemeSwitcher size="sm" variant="pill" />

        {/* Language Switcher */}
        <LanguageSwitcher size="sm" />
      </div>
    </header>
  );
};
