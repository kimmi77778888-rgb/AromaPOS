'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ShoppingCart, 
  Receipt, 
  ChefHat, 
  Menu,
  Boxes
} from 'lucide-react';

export const MobileBottomNav = () => {
  const { 
    activeTab, 
    setActiveTab, 
    cartTotals, 
    orders, 
    lowStockProducts, 
    lowStockIngredients,
    setIsMobileMenuOpen 
  } = useApp();
  const { isKhmer } = useLanguage();

  const totalAlerts = (lowStockProducts?.length || 0) + (lowStockIngredients?.length || 0);

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-xl border-t border-stone-850 px-2 py-1.5 flex items-center justify-around shadow-2xl select-none"
    >
      {/* 1. POS Register */}
      <button
        type="button"
        onClick={() => setActiveTab('pos')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer relative ${
          activeTab === 'pos'
            ? 'text-amber-400 font-bold'
            : 'text-stone-400 hover:text-stone-200'
        }`}
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {cartTotals.itemCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] rounded-full bg-amber-500 text-stone-950 text-[10px] font-black flex items-center justify-center px-1 ring-2 ring-stone-950 animate-bounce">
              {cartTotals.itemCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium mt-0.5">
          {isKhmer ? 'គិតប្រាក់' : 'POS'}
        </span>
      </button>

      {/* 2. Order History */}
      <button
        type="button"
        onClick={() => setActiveTab('orders')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer relative ${
          activeTab === 'orders'
            ? 'text-amber-400 font-bold'
            : 'text-stone-400 hover:text-stone-200'
        }`}
      >
        <div className="relative">
          <Receipt className="w-5 h-5" />
          {orders.length > 0 && (
            <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] rounded-full bg-stone-700 text-stone-200 text-[9px] font-mono flex items-center justify-center px-0.5">
              {orders.length}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium mt-0.5">
          {isKhmer ? 'ប្រវត្តិ' : 'Orders'}
        </span>
      </button>

      {/* 3. Kitchen Display (KDS) */}
      <button
        type="button"
        onClick={() => setActiveTab('kds')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer relative ${
          activeTab === 'kds'
            ? 'text-emerald-400 font-bold'
            : 'text-stone-400 hover:text-stone-200'
        }`}
      >
        <ChefHat className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-0.5">
          {isKhmer ? 'ផ្ទះបាយ' : 'KDS'}
        </span>
      </button>

      {/* 4. More / Menu Drawer Toggle */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer relative text-stone-400 hover:text-stone-200"
      >
        <div className="relative">
          <Menu className="w-5 h-5" />
          {totalAlerts > 0 && (
            <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-stone-950 animate-pulse" />
          )}
        </div>
        <span className="text-[10px] font-medium mt-0.5">
          {isKhmer ? 'ម៉ឺនុយ' : 'Menu'}
        </span>
      </button>
    </nav>
  );
};
export default MobileBottomNav;

