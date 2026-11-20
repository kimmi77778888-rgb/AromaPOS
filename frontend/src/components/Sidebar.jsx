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
  BarChart3, 
  ChefHat, 
  Users, 
  Volume2, 
  VolumeX, 
  PanelLeftClose, 
  PanelLeftOpen,
  Globe,
  Bike,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ROLE_PERMISSIONS } from '../services/coffeeData';
import { soundService } from '../services/soundService';
import { UserAvatar } from './common/UserAvatar';
import { StoreLogo } from './common/StoreLogo';

export const Sidebar = () => {
  const { 
    activeTab, 
    setActiveTab, 
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    cartTotals, 
    lowStockProducts = [], 
    lowStockIngredients = [], 
    orders = [], 
    user, 
    logout, 
    lockScreen,
    setIsProfileModalOpen,
    showToast,
    storeInfo,
    setIsStoreSettingsOpen,
    changeAppMode
  } = useApp();

  const { isKhmer } = useLanguage();
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
    setIsCollapsed((prev) => {
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
      showToast(
        next 
          ? (isKhmer ? '🔊 បើកសំឡេង POS' : '🔊 POS Audio Enabled') 
          : (isKhmer ? '🔇 បិទសំឡេង POS' : '🔇 POS Audio Muted'), 
        'info'
      );
    }
  };

  const totalAlerts = (lowStockProducts?.length || 0) + (lowStockIngredients?.length || 0);
  const userRole = (user?.role || 'ADMIN').toUpperCase();
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.CASHIER;

  // Active deliveries count
  const activeDeliveriesCount = orders.filter((o) => 
    (o.orderType === 'DELIVERY' || o.fulfillmentType === 'DELIVERY') &&
    o.status !== 'COMPLETED' &&
    o.status !== 'CANCELLED' &&
    o.status !== 'REFUNDED'
  ).length;

  // Curated Navigation Sections
  const navSections = [
    {
      id: 'sales',
      title: 'Sales & Orders',
      titleKm: 'ការលក់ & ការកុម្ម៉ង់',
      items: [
        {
          id: 'pos',
          label: 'POS Register',
          labelKm: 'ស្ថានីយគិតប្រាក់ (POS)',
          icon: ShoppingCart,
          badge: cartTotals?.itemCount > 0 ? cartTotals.itemCount : null,
          badgeColor: 'bg-amber-500 text-stone-950 font-bold'
        },
        {
          id: 'orders',
          label: 'Order History',
          labelKm: 'ប្រវត្តិការកុម្ម៉ង់',
          icon: Receipt,
          badge: orders.length > 0 ? orders.length : null,
          badgeColor: 'bg-stone-800 text-stone-300'
        }
      ]
    },
    {
      id: 'operations',
      title: 'Operations',
      titleKm: 'ផ្ទះបាយ & ស្តុក',
      items: [
        {
          id: 'kds',
          label: 'Kitchen Display (KDS)',
          labelKm: 'អេក្រង់ផ្ទះបាយ (KDS)',
          icon: ChefHat,
          badge: orders.filter((o) => o.status === 'PENDING' || o.status === 'IN_PREPARATION').length || null,
          badgeColor: 'bg-emerald-600 text-white animate-pulse'
        },
        {
          id: 'delivery',
          label: 'Live Delivery Map',
          labelKm: 'ផែនទីដឹកជញ្ជូន (GPS)',
          icon: Bike,
          badge: activeDeliveriesCount > 0 ? activeDeliveriesCount : null,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
        },
        {
          id: 'inventory',
          label: 'Inventory & Recipes',
          labelKm: 'ស្តុក & រូបមន្តផ្សំ',
          icon: Boxes,
          badge: totalAlerts > 0 ? totalAlerts : null,
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
        }
      ]
    },
    {
      id: 'management',
      title: 'Management',
      titleKm: 'ការគ្រប់គ្រង',
      items: [
        {
          id: 'dashboard',
          label: 'Store Dashboard',
          labelKm: 'ផ្ទាំងគ្រប់គ្រងអាជីវកម្ម',
          icon: LayoutDashboard,
          badge: null
        },
        {
          id: 'slideshow',
          label: 'Slideshow & Footer',
          labelKm: 'គ្រប់គ្រង Slideshow & Footer',
          icon: SlidersHorizontal,
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
          badge: null
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 bg-stone-950 border-r border-stone-850 flex flex-col justify-between shrink-0 h-screen select-none transition-all duration-300 ease-in-out font-sans
          lg:static lg:h-screen lg:z-30 lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Top Header & Brand Bar */}
        <div className="flex flex-col min-h-0">
          {isCollapsed ? (
            <div className="p-3 border-b border-stone-850 flex flex-col items-center gap-3 shrink-0">
              <div 
                onClick={() => setIsStoreSettingsOpen(true)}
                className="cursor-pointer hover:scale-105 transition"
                title={`${storeInfo?.name || 'Aroma Coffee'} - Customize Logo`}
              >
                <StoreLogo size="md" />
              </div>
              <button
                type="button"
                onClick={toggleCollapse}
                className="w-8 h-8 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-amber-400 flex items-center justify-center transition cursor-pointer"
                title="Expand Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-4 border-b border-stone-850 flex items-center justify-between shrink-0">
              <div 
                onClick={() => setIsStoreSettingsOpen(true)}
                className="flex items-center gap-3 overflow-hidden cursor-pointer group"
                title="Customize Store Profile & Logo"
              >
                <StoreLogo size="md" />
                <div className="overflow-hidden">
                  <span className="font-black text-base tracking-tight text-white group-hover:text-amber-400 transition truncate block leading-tight">
                    {storeInfo?.name || 'Aroma POS'}
                  </span>
                  <p className="text-[10px] text-amber-400/90 font-bold tracking-wider uppercase truncate mt-0.5">
                    {isKhmer ? (storeInfo?.taglineKhmer || 'ហាងកាហ្វេ Artisan Roastery') : (storeInfo?.tagline || 'Artisan Roastery')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleCollapse}
                  className="hidden lg:flex w-7 h-7 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-amber-400 items-center justify-center transition cursor-pointer shrink-0"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="lg:hidden p-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-rose-400 flex items-center justify-center transition cursor-pointer shrink-0"
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Link to Public E-Commerce Storefront */}
          {changeAppMode && (
            !isCollapsed ? (
              <div className="px-3 pt-3 shrink-0">
                <button
                  type="button"
                  onClick={() => changeAppMode('ecommerce')}
                  className="w-full py-2 px-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 text-amber-300 font-bold text-xs flex items-center justify-between transition cursor-pointer group shadow-sm"
                  title="Switch to Online E-Commerce Storefront"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                    <span>{isKhmer ? 'ហាងអនឡាញ' : 'Online Storefront'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400/70" />
                </button>
              </div>
            ) : (
              <div className="pt-3 flex justify-center shrink-0">
                <button
                  type="button"
                  onClick={() => changeAppMode('ecommerce')}
                  className="w-9 h-9 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 flex items-center justify-center transition cursor-pointer"
                  title="Switch to Online E-Commerce Storefront"
                >
                  <Globe className="w-4 h-4" />
                </button>
              </div>
            )
          )}

          {/* Clean Scrollable Navigation Menu */}
          <div className="overflow-y-auto overflow-x-hidden p-3 space-y-4 mt-2 flex-1 scrollbar-thin">
            {navSections.map((section) => {
              const visibleItems = section.items.filter((item) => 
                permissions.allowedTabs.includes(item.id)
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={section.id} className="space-y-1">
                  {!isCollapsed ? (
                    <div className="px-2 pb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                        {isKhmer ? section.titleKm : section.title}
                      </span>
                    </div>
                  ) : (
                    <div className="my-2 border-t border-stone-850 w-6 mx-auto" />
                  )}

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
                              isCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5'
                            } rounded-2xl font-bold text-xs transition-all duration-150 cursor-pointer ${
                              isActive
                                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/40 font-black'
                                : 'text-stone-400 hover:text-white hover:bg-stone-900'
                            }`}
                            title={isCollapsed ? itemLabel : undefined}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Icon
                                className={`w-4 h-4 shrink-0 transition-transform ${
                                  isActive ? 'text-stone-950 stroke-[2.5]' : 'text-stone-400 group-hover:text-amber-400'
                                }`}
                              />
                              {!isCollapsed && (
                                <span className="truncate">{itemLabel}</span>
                              )}
                            </div>

                            {!isCollapsed ? (
                              item.badge !== null && (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                                    isActive 
                                      ? 'bg-stone-950 text-amber-400' 
                                      : (item.badgeColor || 'bg-stone-800 text-stone-300')
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )
                            ) : (
                              item.badge !== null && (
                                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-stone-950" />
                              )
                            )}
                          </button>

                          {/* Collapsed Tooltip */}
                          {isCollapsed && (
                            <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-stone-900 border border-stone-800 text-stone-100 text-xs font-bold rounded-xl shadow-2xl whitespace-nowrap z-50 flex items-center gap-2">
                              <span>{itemLabel}</span>
                              {item.badge !== null && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-amber-500 text-stone-950 font-black">
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

        {/* Bottom Clean Unified Operator & Station Card */}
        <div className={`p-3 border-t border-stone-850 bg-stone-950 shrink-0 ${isCollapsed ? 'flex flex-col items-center gap-2' : 'space-y-2.5'}`}>
          {!isCollapsed ? (
            <div className="p-2.5 rounded-2xl bg-stone-900/60 border border-stone-850 flex items-center justify-between gap-3">
              <div 
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                title="Edit Account Profile"
              >
                <div className="relative shrink-0">
                  <UserAvatar user={user} size="sm" shape="rounded-xl" showBadge />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-stone-950" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-white group-hover:text-amber-400 transition truncate leading-tight">
                    {user?.name || 'Administrator'}
                  </p>
                  <span className="text-[9px] font-black uppercase text-amber-400 font-mono tracking-wider">
                    {user?.role || 'OWNER'}
                  </span>
                </div>
              </div>

              {/* Station Tools: Sound, Lock, Logout */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
                    isSoundOn 
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25' 
                      : 'bg-stone-850 border-stone-800 text-stone-500 hover:text-stone-300'
                  }`}
                  title={isSoundOn ? 'Audio Sound Active' : 'Audio Sound Muted'}
                >
                  {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={lockScreen}
                  className="p-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-amber-400 transition cursor-pointer"
                  title="Lock Station PIN"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-rose-400 transition cursor-pointer"
                  title={isKhmer ? 'ចាកចេញ' : 'Sign Out'}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div 
                onClick={() => setIsProfileModalOpen(true)}
                className="cursor-pointer"
                title={`${user?.name || 'Staff'} (${user?.role || 'OWNER'})`}
              >
                <UserAvatar user={user} size="sm" shape="rounded-xl" showBadge />
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-amber-400 transition cursor-pointer"
                title={isSoundOn ? 'Sound: ON' : 'Sound: MUTED'}
              >
                {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={lockScreen}
                className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-amber-400 transition cursor-pointer"
                title="Lock Terminal"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-400 transition cursor-pointer"
                title={isKhmer ? 'ចាកចេញ' : 'Sign Out'}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
