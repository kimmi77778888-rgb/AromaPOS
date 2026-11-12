import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Coffee, 
  LayoutDashboard, 
  Boxes, 
  Receipt, 
  ShoppingCart, 
  AlertTriangle, 
  LogOut, 
  ChevronRight, 
  Lock, 
  Unlock,
  Calculator, 
  BarChart3, 
  ChefHat, 
  Users, 
  User,
  Volume2, 
  VolumeX, 
  PanelLeftClose, 
  PanelLeftOpen,
  Globe,
  Sparkles,
  Store,
  FileSpreadsheet,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ROLE_PERMISSIONS } from '../services/coffeeData';
import { soundService } from '../services/soundService';
import { LanguageSwitcher } from './common/LanguageSwitcher';
import { ThemeSwitcher } from './common/ThemeSwitcher';
import { UserAvatar } from './common/UserAvatar';
import { StoreLogo } from './common/StoreLogo';

export const Sidebar = () => {
  const { 
    activeTab, 
    setActiveTab, 
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    cartTotals, 
    lowStockProducts, 
    lowStockIngredients, 
    orders, 
    user, 
    logout, 
    lockScreen,
    setIsZReportOpen,
    staffList,
    setIsProfileModalOpen,
    showToast,
    activeShift,
    openShiftModal,
    storeInfo,
    setIsStoreSettingsOpen
  } = useApp();

  const { isKhmer } = useLanguage();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(soundService.isSoundEnabled());

  // Collapsible Sidebar State (Persisted)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('aromapos_sidebar_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('aromapos_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  const toggleSound = () => {
    const next = soundService.toggleSound();
    setIsSoundOn(next);
    if (showToast) {
      showToast(next ? (isKhmer ? '🔊 បើកសំឡេង POS (សំឡេងកណ្ដឹង Ka-Ching & សំឡេងប្រកាសខ្មែរ)' : '🔊 POS Sound Enabled (Ka-Ching & Khmer Voice Active)') : (isKhmer ? '🔇 បិទសំឡេង POS' : '🔇 POS Sound Muted'), 'info');
    }
  };

  const totalAlerts = (lowStockProducts?.length || 0) + (lowStockIngredients?.length || 0);
  const userRole = (user?.role || 'ADMIN').toUpperCase();
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.CASHIER;

  // Grouped Navigation Sections
  const navSections = [
    {
      id: 'sales',
      title: 'Sales & Orders',
      titleKm: 'ការលក់ & ការកម្ម៉ង់',
      items: [
        {
          id: 'pos',
          label: 'POS Register',
          labelKm: 'ស្ថានីយគិតប្រាក់ (POS)',
          icon: ShoppingCart,
          badge: cartTotals.itemCount > 0 ? cartTotals.itemCount : null,
          badgeColor: 'bg-amber-600 text-stone-950 font-bold'
        },
        {
          id: 'orders',
          label: 'Order History',
          labelKm: 'ប្រវត្តិការកម្ម៉ង់',
          icon: Receipt,
          badge: orders.length > 0 ? orders.length : null,
          badgeColor: 'bg-stone-700 text-stone-200'
        }
      ]
    },
    {
      id: 'operations',
      title: 'Kitchen & Stock',
      titleKm: 'ផ្ទះបាយ & ស្តុកទំនិញ',
      items: [
        {
          id: 'kds',
          label: 'Kitchen Display (KDS)',
          labelKm: 'អេក្រង់ផ្ទះបាយ (KDS)',
          icon: ChefHat,
          badge: orders.length > 0 ? orders.length : null,
          badgeColor: 'bg-emerald-600 text-white animate-pulse'
        },
        {
          id: 'inventory',
          label: 'Inventory & Recipes',
          labelKm: 'ស្តុក & រូបមន្តផ្សំ',
          icon: Boxes,
          badge: totalAlerts > 0 ? totalAlerts : null,
          badgeColor: 'bg-rose-600 text-white animate-pulse'
        }
      ]
    },
    {
      id: 'management',
      title: 'Management & Staff',
      titleKm: 'ការគ្រប់គ្រង & បុគ្គលិក',
      items: [
        {
          id: 'dashboard',
          label: 'Live Dashboard',
          labelKm: 'ផ្ទាំងគ្រប់គ្រងទូទៅ',
          icon: LayoutDashboard,
          badge: null
        },
        {
          id: 'reports',
          label: 'Analytics & Reports',
          labelKm: 'របាយការណ៍គ្រប់គ្រង',
          icon: BarChart3,
          badge: null
        },
        {
          id: 'staff',
          label: 'Staff & Roles',
          labelKm: 'បុគ្គលិក & សិទ្ធិប្រើប្រាស់',
          icon: Users,
          badge: 'Manage',
          badgeColor: 'bg-amber-950 text-amber-300 border border-amber-800'
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 lg:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 bg-stone-950/98 border-r border-stone-800/80 flex flex-col justify-between shrink-0 h-screen select-none transition-all duration-300 ease-in-out
          lg:static lg:h-screen lg:z-30 lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col min-h-0">
          {/* Brand Bar */}
          {isCollapsed ? (
            <div className="p-3 border-b border-stone-800/80 flex flex-col items-center gap-2 shrink-0">
              <div 
                onClick={() => setIsStoreSettingsOpen(true)}
                className="cursor-pointer hover:scale-105 transition"
                title={`${storeInfo?.name || 'Aroma Coffee'} - Click to customize Logo`}
              >
                <StoreLogo size="md" />
              </div>
              <button
                onClick={toggleCollapse}
                className="w-8 h-8 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-amber-400 flex items-center justify-center transition cursor-pointer"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-4 border-b border-stone-800/80 flex items-center justify-between shrink-0">
              <div 
                onClick={() => setIsStoreSettingsOpen(true)}
                className="flex items-center gap-3 overflow-hidden cursor-pointer group"
                title="Click to customize Store Coffee Logo & Branding"
              >
                <StoreLogo size="md" />
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-tight text-stone-100 group-hover:text-amber-400 transition truncate">
                      {storeInfo?.name || 'Aroma POS'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 font-medium tracking-wider uppercase truncate">
                    {isKhmer ? (storeInfo?.taglineKhmer || 'ហាងកាហ្វេ Artisan Roastery') : (storeInfo?.tagline || 'Artisan Roastery')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleCollapse}
                  className="hidden lg:flex w-7 h-7 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-amber-400 items-center justify-center transition cursor-pointer shrink-0"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
                {/* Mobile Drawer Close Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="lg:hidden p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-rose-400 flex items-center justify-center transition cursor-pointer shrink-0"
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

        {/* Station Controls Pill */}
        {!isCollapsed ? (
          <div className="px-3 pt-3 pb-1 shrink-0 space-y-2">
            <div className="bg-stone-900/90 rounded-xl p-2.5 border border-stone-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-stone-300 font-medium">Terminal #01</span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Sound Toggle */}
                <button
                  onClick={toggleSound}
                  className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                    isSoundOn 
                      ? 'bg-amber-950/60 border-amber-800/60 text-amber-400 hover:bg-amber-900/60' 
                      : 'bg-stone-850 border-stone-700 text-stone-500 hover:text-stone-300'
                  }`}
                  title={isSoundOn ? 'Sound On (Click to mute)' : 'Sound Muted (Click to enable)'}
                >
                  {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                {/* Station Lock */}
                <button
                  onClick={lockScreen}
                  className="text-[11px] text-amber-400/90 font-mono bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-800/50 hover:bg-amber-900/60 transition flex items-center gap-1 cursor-pointer"
                  title="Lock station with PIN"
                >
                  <Lock className="w-3 h-3" />
                  <span>Lock</span>
                </button>
              </div>
            </div>

            {/* Clean Theme (Black / White) Switcher Row */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-900/60 border border-stone-800/80">
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-semibold tracking-wide">
                  {isKhmer ? 'ពណ៍ស្បែក' : 'Theme'}
                </span>
              </div>
              <ThemeSwitcher size="sm" variant="pill" />
            </div>

            {/* Clean Khmer / English Flag Switcher Row */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-900/60 border border-stone-800/80">
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-semibold tracking-wide">
                  {isKhmer ? 'ភាសា' : 'Language'}
                </span>
              </div>
              <LanguageSwitcher size="sm" />
            </div>
          </div>
        ) : (
          <div className="pt-2 flex flex-col items-center gap-2 shrink-0">
            {/* Audio Toggle in mini mode */}
            <button
              onClick={toggleSound}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                isSoundOn 
                  ? 'bg-amber-950/60 border-amber-800/60 text-amber-400' 
                  : 'bg-stone-900 border-stone-800 text-stone-500'
              }`}
              title={isSoundOn ? 'Audio: ON' : 'Audio: MUTED'}
            >
              {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Theme Toggle in mini mode */}
            <div className="my-0.5">
              <ThemeSwitcher size="sm" variant="button" showLabels={false} />
            </div>

            {/* Clean Mini Language Switcher in collapsed mode */}
            <div className="my-0.5">
              <LanguageSwitcher size="sm" showLabels={false} />
            </div>
          </div>
        )}

        {/* Scrollable Navigation Groups */}
        <div className="overflow-y-auto overflow-x-hidden p-2 space-y-3 mt-1 flex-1">
          {navSections.map((section) => {
            // Filter section items according to logged-in user permissions
            const visibleItems = section.items.filter((item) => 
              permissions.allowedTabs.includes(item.id)
            );

            // Hide entire group if user has no permitted tabs in it
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header */}
                {!isCollapsed ? (
                  <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-sans">
                      {isKhmer ? section.titleKm : section.title}
                    </span>
                  </div>
                ) : (
                  <div className="my-1.5 border-t border-stone-800/70 w-8 mx-auto" />
                )}

                {/* Section Items */}
                <div className={`space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const itemLabel = isKhmer && item.labelKm ? item.labelKm : item.label;

                    return (
                      <div key={item.id} className="relative w-full group">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center ${
                            isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                          } rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer relative ${
                            isActive
                              ? 'bg-gradient-to-r from-amber-600/25 to-amber-600/10 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950/50'
                              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/70 border border-transparent'
                          }`}
                          title={isCollapsed ? itemLabel : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                                isActive ? 'text-amber-400' : 'text-stone-400 group-hover:text-amber-400'
                              }`}
                            />
                            {!isCollapsed && (
                              <span className="font-sans text-xs font-semibold">{itemLabel}</span>
                            )}
                          </div>

                          {!isCollapsed ? (
                            <div className="flex items-center gap-1.5">
                              {item.badge !== null && (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    item.badgeColor || 'bg-amber-600 text-stone-950'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                              {isActive && <ChevronRight className="w-4 h-4 text-amber-400/80" />}
                            </div>
                          ) : (
                            item.badge !== null && (
                              <span
                                className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                                  item.badgeColor || 'bg-amber-600 text-stone-950'
                                }`}
                              >
                                {typeof item.badge === 'number' ? item.badge : '•'}
                              </span>
                            )
                          )}
                        </button>

                        {/* Floating Tooltip in Collapsed Mode */}
                        {isCollapsed && (
                          <div className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto scale-95 group-hover:scale-100 transition-all duration-200 absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-100 text-xs font-bold rounded-xl shadow-2xl whitespace-nowrap z-50 flex items-center gap-2">
                            <span>{itemLabel}</span>
                            {item.badge !== null && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: Shift, Z-Report & User Card */}
      <div className={`p-3 border-t border-stone-800/80 bg-stone-950/70 space-y-2 shrink-0 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        {/* Register Shift & Z-Report shortcut (Visible to Cashier, Manager, Admin) */}
        {userRole !== 'BARISTA' && (
          <button
            onClick={() => openShiftModal(activeShift ? 'ACTIVE' : 'OPEN')}
            className={`${
              isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full p-2 justify-between'
            } rounded-xl bg-stone-900 hover:bg-stone-850 border ${
              activeShift ? 'border-emerald-600/40 text-emerald-300' : 'border-amber-600/40 text-amber-300'
            } text-xs font-semibold flex items-center transition cursor-pointer relative group`}
            title={activeShift ? "Register Open - Click for Shift X/Z-Report" : "Register Closed - Click to Open Shift"}
          >
            <div className="flex items-center gap-2">
              {activeShift ? (
                <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Unlock className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              {!isCollapsed && (
                <span>
                  {activeShift 
                    ? (isKhmer ? 'របាយការណ៍បិទវេន Z-Report' : 'Shift Z-Report')
                    : (isKhmer ? 'បើកហាង/ថតប្រាក់វេនថ្មី' : 'Open Store / Shift')}
                </span>
              )}
            </div>
            {!isCollapsed && <ChevronRight className="w-3 h-3 text-stone-500" />}

            {isCollapsed && (
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none scale-95 group-hover:scale-100 transition-all duration-200 absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-100 text-xs font-bold rounded-xl shadow-2xl whitespace-nowrap z-50">
                <span>{activeShift ? (isKhmer ? 'របាយការណ៍បិទវេន' : 'Shift Z-Report') : (isKhmer ? 'បើកហាង/វេន' : 'Open Store')}</span>
              </div>
            )}
          </button>
        )}

        {/* Low Stock Warning (Restricted to Manager and Admin) */}
        {permissions.canEditInventory && totalAlerts > 0 && !isCollapsed && (
          <button
            onClick={() => setActiveTab('inventory')}
            className="w-full p-2 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2 hover:bg-rose-950/60 transition cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
            <div className="text-left flex-1 truncate">
              <span className="font-semibold block text-[11px]">
                {totalAlerts} {isKhmer ? 'មុខទំនិញជិតអស់ស្តុក' : 'items low in stock'}
              </span>
            </div>
          </button>
        )}

        {/* Current User Card with Shift Handover Popover */}
        <div className="relative w-full">
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center ${
              isCollapsed ? 'justify-center p-1.5' : 'justify-between p-2'
            } rounded-xl bg-stone-900/80 border border-stone-800/80 hover:border-amber-600/40 cursor-pointer transition`}
            title={isCollapsed ? `${user?.name || 'Staff'} (${isKhmer && permissions.titleKm ? permissions.titleKm : permissions.title}) - Click for options` : undefined}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <UserAvatar
                user={user}
                size="sm"
                shape="rounded-lg"
                showBadge
              />

              {!isCollapsed && (
                <div className="overflow-hidden text-left">
                  <p className="text-xs font-bold text-stone-200 truncate">{user?.name || 'Staff'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${permissions.badgeColor}`}>
                      {isKhmer && permissions.titleKm ? permissions.titleKm : permissions.title}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <ChevronRight
                className={`w-4 h-4 text-stone-500 transition-transform ${showUserMenu ? 'rotate-90' : ''}`}
              />
            )}
          </div>

          {/* Active Operator Account Details (Single Account Only) */}
          {showUserMenu && (
            <div className={`absolute bottom-full ${isCollapsed ? 'left-full ml-2' : 'left-0 right-0'} mb-2 p-3 bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl backdrop-blur-md z-50 text-left w-72 animate-in fade-in zoom-in-95 duration-150`}>
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <span className="text-[10px] font-bold tracking-wider uppercase text-stone-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isKhmer ? 'គណនីកំពុងដំណើរការ' : 'Active Account'}
                </span>
                <button 
                  onClick={() => setShowUserMenu(false)}
                  className="w-5 h-5 rounded-full hover:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-stone-200 text-xs cursor-pointer transition"
                >
                  ✕
                </button>
              </div>

              {/* Single Logged-In User Profile Card */}
              <div className="p-3 my-2.5 bg-stone-950/80 border border-stone-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <UserAvatar user={user} size="sm" shape="rounded-xl" />
                  <div className="truncate flex-1">
                    <p className="font-extrabold text-sm text-stone-100 truncate">{user?.name || 'Staff User'}</p>
                    <p className="text-[11px] text-stone-400 truncate">{user?.email || 'operator@cafe.com'}</p>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-stone-800/60 flex items-center justify-between">
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${permissions.badgeColor}`}>
                    {userRole} • {isKhmer && permissions.titleKm ? permissions.titleKm : permissions.title}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {isKhmer ? 'ដំណើរការ' : 'Active'}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-stone-800/60 flex items-center justify-between text-[10px] font-mono text-stone-400">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <span>🌐</span>
                    <span>{user?.lastLoginIp || '192.168.1.108'}</span>
                  </span>
                  <span className="text-stone-500 truncate max-w-[110px]" title={user?.lastLoginDevice || 'Desktop'}>
                    {user?.lastLoginDevice?.split('(')[0]?.trim() || 'Desktop'}
                  </span>
                </div>
              </div>

              {/* Management & Profile Actions */}
              <div className="space-y-1">
                {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setIsStoreSettingsOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-xl cursor-pointer transition font-semibold"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'កំណត់រូប Logo & ព័ត៌មានហាង' : 'Store Logo & Branding'}</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-stone-300 hover:text-stone-100 hover:bg-stone-800/60 rounded-xl cursor-pointer transition font-medium"
                >
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isKhmer ? 'កែប្រែប្រវត្តិរូប & ព័ត៌មាន' : 'Edit Profile & Details'}</span>
                </button>
                
                <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      lockScreen();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-750 text-xs font-semibold text-amber-300 cursor-pointer transition"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'ចាក់សោ PIN' : 'Lock PIN'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-xs font-semibold text-rose-300 hover:text-rose-200 cursor-pointer transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'ចាកចេញ' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Toggle Expand / Collapse Action Footer */}
        {!isCollapsed ? (
          <button
            onClick={toggleCollapse}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-stone-900/60 hover:bg-stone-850 border border-stone-800/80 text-stone-400 hover:text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            title="Collapse sidebar (Show less)"
          >
            <PanelLeftClose className="w-3.5 h-3.5 text-amber-500" />
            <span>{isKhmer ? 'បង្រួម Sidebar (Mini)' : 'Show Less (Mini Mode)'}</span>
          </button>
        ) : (
          <button
            onClick={toggleCollapse}
            className="w-10 h-10 mt-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-amber-400 flex items-center justify-center transition cursor-pointer relative group"
            title="Expand sidebar (Show full)"
          >
            <PanelLeftOpen className="w-4 h-4 text-amber-500" />
            <div className="opacity-0 group-hover:opacity-100 pointer-events-none scale-95 group-hover:scale-100 transition-all duration-200 absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-100 text-xs font-bold rounded-xl shadow-2xl whitespace-nowrap z-50">
              <span>{isKhmer ? 'ពង្រីក Sidebar ពេញ' : 'Show Full Sidebar'}</span>
            </div>
          </button>
        )}
      </div>
    </aside>
    </>
  );
};
