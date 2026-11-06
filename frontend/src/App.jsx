'use client';

import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginScreen } from './components/auth/LoginScreen';
import { PosTerminal } from './components/pos/PosTerminal';
import { Dashboard } from './components/dashboard/Dashboard';
import { InventoryManagement } from './components/inventory/InventoryManagement';
import { OrderHistory } from './components/orders/OrderHistory';
import { ManagementReports } from './components/reports/ManagementReports';
import { KitchenDisplaySystem } from './components/orders/KitchenDisplaySystem';
import { StaffManagement } from './components/auth/StaffManagement';
import { ManagerOverrideModal } from './components/auth/ManagerOverrideModal';
import { Toast } from './components/Toast';
import { ProductFormModal } from './components/inventory/ProductFormModal';
import { QuickLockModal } from './components/auth/QuickLockModal';
import { ZReportModal } from './components/dashboard/ZReportModal';
import { StaffShiftModal } from './components/auth/StaffShiftModal';
import { CustomerDisplay } from './components/pos/CustomerDisplay';
import { UserAccountModal } from './components/auth/UserAccountModal';
import { StoreSettingsModal } from './components/common/StoreSettingsModal';
import { CambodiaExcelInterface } from './components/excel/CambodiaExcelInterface';
import { MobileBottomNav } from './components/common/MobileBottomNav';

export const AppContent = () => {
  const { 
    isAuthenticated, 
    activeTab, 
    isScreenLocked, 
    isZReportOpen, 
    setIsZReportOpen,
    isShiftModalOpen,
    setIsShiftModalOpen,
    shiftModalMode,
    overrideModal,
    closeManagerOverride,
    isPosFocusMode,
    isCustomerPreviewOpen,
    setIsCustomerPreviewOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    isStoreSettingsOpen,
    setIsStoreSettingsOpen,
    isFaceEnrollModalOpen,
    setIsFaceEnrollModalOpen,
    faceEnrollTarget,
    setFaceEnrollTarget,
    user
  } = useApp();

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // Check if current window was opened as a dedicated Customer Facing Display (Dual Screen)
  const isCustomerRoute = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('view') === 'customer';

  if (isCustomerRoute) {
    return <CustomerDisplay standalone={true} />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    );
  }

  // Pure POS Focus Mode: Hides Sidebar and Main Header for 100% full-screen POS terminal
  const isFocusingPos = isPosFocusMode && activeTab === 'pos';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stone-950 text-stone-100 font-sans">
      {/* Persistent Left Sidebar (Hidden when in Focus POS Mode) */}
      {!isFocusingPos && <Sidebar />}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Persistent Top Header (Hidden when in Focus POS Mode) */}
        {!isFocusingPos && (
          <Header onOpenAddProduct={() => setIsAddProductModalOpen(true)} />
        )}

        {/* Dynamic View Router with Role Protection */}
        <main className="flex-1 flex overflow-hidden relative pb-14 md:pb-0">
          {activeTab === 'pos' && <PosTerminal />}
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'inventory' && (
            <InventoryManagement onOpenAddModal={() => setIsAddProductModalOpen(true)} />
          )}
          {activeTab === 'orders' && <OrderHistory />}
          {activeTab === 'kds' && <KitchenDisplaySystem />}
          {activeTab === 'reports' && <ManagementReports />}
          {activeTab === 'staff' && <StaffManagement />}
          {activeTab === 'cambodia-excel' && <CambodiaExcelInterface />}
        </main>

        {/* Mobile Phone Bottom Navigation (Hidden on iPad & Desktop) */}
        {!isFocusingPos && <MobileBottomNav />}
      </div>

      {/* In-App Customer Display Live Preview Slide-Over / Modal */}
      {isCustomerPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-5xl h-[85vh] shadow-2xl overflow-hidden flex flex-col">
            <CustomerDisplay onClose={() => setIsCustomerPreviewOpen(false)} />
          </div>
        </div>
      )}

      {/* Global Modals */}
      <ProductFormModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
      />

      <QuickLockModal
        isOpen={isScreenLocked}
        onClose={() => {}}
      />

      {/* Universal Standard Cash Drawer / Shift Open & Close Modal */}
      <StaffShiftModal
        isOpen={isShiftModalOpen || isZReportOpen}
        onClose={() => {
          setIsShiftModalOpen(false);
          setIsZReportOpen(false);
        }}
        initialMode={isZReportOpen ? 'CLOSE' : shiftModalMode}
      />

      {/* User Account Profile Modal */}
      <UserAccountModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Coffee Store Branding & Dynamic Logo Settings Modal */}
      <StoreSettingsModal
        isOpen={isStoreSettingsOpen}
        onClose={() => setIsStoreSettingsOpen(false)}
      />

      {/* RBAC Manager Override PIN Authorization Modal */}
      <ManagerOverrideModal
        isOpen={overrideModal.isOpen}
        action={overrideModal.action}
        details={overrideModal.details}
        amount={overrideModal.amount}
        onSuccess={overrideModal.onSuccess}
        onClose={closeManagerOverride}
      />

      {/* Notification Toast */}
      <Toast />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
