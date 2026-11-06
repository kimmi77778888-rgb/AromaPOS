'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { api, getStoredUser, saveStoredUser, getStoredCategories, saveStoredIngredients } from '../services/api';
import { DEMO_USERS, DEMO_CUSTOMERS, ROLE_PERMISSIONS } from '../services/coffeeData';
import { storage } from '../utils/storage';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation & Auth
  const [user, setUser] = useState(() => getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredUser()));
  const [activeTab, setActiveTab] = useState('pos'); // pos, kds, dashboard, inventory, orders, reports, staff
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // RBAC Role Separation & Permissions
  const userRole = useMemo(() => (user?.role || 'ADMIN').toUpperCase(), [user]);

  const permissions = useMemo(() => {
    const base = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.CASHIER;

    // User custom assigned permissions list
    const userPermList = Array.isArray(user?.permissions) && user.permissions.length > 0 
      ? user.permissions 
      : (base.permissions || []);

    // Dynamically derive allowedTabs from both base role and explicit permissions
    const allowedTabsSet = new Set(base.allowedTabs || []);

    if (userRole === 'ADMIN') {
      ['pos', 'dashboard', 'inventory', 'orders', 'reports', 'kds', 'staff'].forEach((t) => allowedTabsSet.add(t));
    } else {
      if (userPermList.includes('canAccessPos')) allowedTabsSet.add('pos');
      if (userPermList.includes('canAccessKds')) allowedTabsSet.add('kds');
      if (userPermList.includes('canAccessDashboard')) allowedTabsSet.add('dashboard');
      if (userPermList.includes('canAccessInventory')) allowedTabsSet.add('inventory');
      if (userPermList.includes('canAccessReports')) allowedTabsSet.add('reports');
      if (userPermList.includes('canAccessOrders')) allowedTabsSet.add('orders');
      if (userPermList.includes('canManageStaff')) allowedTabsSet.add('staff');
    }

    return {
      ...base,
      allowedTabs: Array.from(allowedTabsSet),
      canPerformOverrides: userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SECURITY' || userPermList.includes('canPerformOverrides') || Boolean(base.canPerformOverrides),
      canSeeExpectedCash: userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SECURITY' || userPermList.includes('canSeeExpectedCash') || Boolean(base.canSeeExpectedCash),
      canManageStaff: userRole === 'ADMIN' || userRole === 'MANAGER' || userPermList.includes('canManageStaff') || Boolean(base.canManageStaff),
      canEditInventory: userRole === 'ADMIN' || userRole === 'MANAGER' || userPermList.includes('canEditInventory') || Boolean(base.canEditInventory),
      canEditMenu: userRole === 'ADMIN' || userPermList.includes('canEditMenu') || Boolean(base.canEditMenu),
      permissions: userPermList
    };
  }, [user, userRole]);

  const isManagerOrAdmin = userRole === 'MANAGER' || userRole === 'ADMIN' || userRole === 'SECURITY' || Boolean(permissions.canPerformOverrides);
  const isAdmin = userRole === 'ADMIN';
  const isCashier = userRole === 'CASHIER';
  const isBarista = userRole === 'BARISTA';
  const isSecurity = userRole === 'SECURITY';

  // Screen Lock & Seamless Handover
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [startingFloat, setStartingFloat] = useState(200.00);
  const [isZReportOpen, setIsZReportOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftModalMode, setShiftModalMode] = useState('AUTO');

  // Staff Register Shifts (Open & Close Lifecycle)
  const [shifts, setShifts] = useState([]);
  const [activeShift, setActiveShift] = useState(null);

  // Staff Roster & Audit Ledger State
  const [staffList, setStaffList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Manager Override Modal State
  const [overrideModal, setOverrideModal] = useState({
    isOpen: false,
    action: '',
    details: '',
    amount: 0,
    onSuccess: null,
    onCancel: null
  });

  // Products & Raw Ingredients
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Dynamic Categories Management
  const [categories, setCategories] = useState(() => getStoredCategories());

  // Dynamic Coffee Store Profile & Logo
  const [storeInfo, setStoreInfo] = useState(() => {
    try {
      const saved = storage.getItem('aromapos_store_info');
      return saved ? JSON.parse(saved) : {
        name: 'Aroma Coffee & Bakery',
        nameKhmer: 'អាហ្រូម៉ា កាហ្វេ & ប៊េកឃឺរី',
        tagline: 'Artisan Roastery & Espresso Bar',
        taglineKhmer: 'ហាងកាហ្វេ Artisan Roastery',
        logo: '',
        presetLogoId: 'artisan-cup',
        phone: '+855 23 888 777',
        address: '742 Artisan Ave, Phnom Penh, Cambodia',
        addressKhmer: 'ផ្លូវ ៧៤២ មហាវិថីសិល្បៈ រាជធានីភ្នំពេញ',
        wifiSsid: 'Aroma_Guest_WiFi',
        wifiPassword: 'coffeeartisan',
        taxId: 'K002-9023412',
        currencyRate: 4100
      };
    } catch (e) {
      return {
        name: 'Aroma Coffee & Bakery',
        nameKhmer: 'អាហ្រូម៉ា កាហ្វេ & ប៊េកឃឺរី',
        tagline: 'Artisan Roastery & Espresso Bar',
        taglineKhmer: 'ហាងកាហ្វេ Artisan Roastery',
        logo: '',
        presetLogoId: 'artisan-cup',
        phone: '+855 23 888 777',
        address: '742 Artisan Ave, Phnom Penh, Cambodia',
        addressKhmer: 'ផ្លូវ ៧៤២ មហាវិថីសិល្បៈ រាជធានីភ្នំពេញ',
        wifiSsid: 'Aroma_Guest_WiFi',
        wifiPassword: 'coffeeartisan',
        taxId: 'K002-9023412',
        currencyRate: 4100
      };
    }
  });
  const [isStoreSettingsOpen, setIsStoreSettingsOpen] = useState(false);

  const updateStoreInfo = useCallback((updates) => {
    setStoreInfo((prev) => {
      const next = { ...prev, ...updates };
      try {
        storage.setItem('aromapos_store_info', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // Show Only POS Mode (Full POS Screen)
  const [isPosFocusMode, setIsPosFocusMode] = useState(false);

  // Customer Screen Dual-Window & Preview State
  const [isCustomerPreviewOpen, setIsCustomerPreviewOpen] = useState(false);
  const [checkoutModalState, setCheckoutModalState] = useState({ isOpen: false, paymentMethod: 'CASH', amountPaid: 0 });

  // Customers & Loyalty Score
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = storage.getItem('aromapos_customers');
      return saved ? JSON.parse(saved) : DEMO_CUSTOMERS;
    } catch (e) {
      return DEMO_CUSTOMERS;
    }
  });
  const [linkedCustomer, setLinkedCustomer] = useState(null);
  const [appliedPoints, setAppliedPoints] = useState(0);

  useEffect(() => {
    try {
      storage.setItem('aromapos_customers', JSON.stringify(customers));
    } catch (e) {}
  }, [customers]);

  // Cart & POS
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('DINE_IN'); // DINE_IN | TAKEAWAY
  const [customerName, setCustomerName] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Coffee Shop Specific Features: Buzzer / Table, Combos, Happy Hour & Digital Stamp Card
  const [buzzerNumber, setBuzzerNumber] = useState('');
  const [isMorningComboActive, setIsMorningComboActive] = useState(true);
  const [isHappyHourActive, setIsHappyHourActive] = useState(false);
  const [isRedeemingFreeStampDrink, setIsRedeemingFreeStampDrink] = useState(false);

  // Orders & Receipts
  const [orders, setOrders] = useState([]);
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [receiptModalView, setReceiptModalView] = useState('customer');

  // Standard Stock Movements & Audit Ledger
  const [stockMovements, setStockMovements] = useState(() => {
    const saved = storage.getItem('aroma_stock_movements');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'MOV-1001',
        date: new Date(Date.now() - 3600000 * 5).toISOString(),
        productId: 1,
        productName: 'Iced Caramel Macchiato',
        productNameKm: 'ខារ៉ាមែល ម៉ាគីយ៉ាតូ ទឹកកក',
        type: 'STOCK_IN',
        quantity: 20,
        previousStock: 10,
        newStock: 30,
        unitCost: 1.25,
        totalCost: 25.00,
        supplier: 'Angkor Beverage Supply',
        reference: 'PO-2026-081',
        operator: 'Sophia Bennett',
        notes: 'Regular weekly delivery restock'
      },
      {
        id: 'MOV-1002',
        date: new Date(Date.now() - 3600000 * 3).toISOString(),
        productId: 2,
        productName: 'Hot Americano',
        productNameKm: 'អាមេរិកខាណូ ក្តៅ',
        type: 'SALE_OUT',
        quantity: -2,
        previousStock: 25,
        newStock: 23,
        unitCost: 0.85,
        reference: 'ORD-10042',
        operator: 'Liam Vance',
        notes: 'POS Register Sale'
      },
      {
        id: 'MOV-1003',
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        productId: 3,
        productName: 'Fresh Butter Croissant',
        productNameKm: 'នំប៉័ង ក្រូសង់ ប៊ឺស្រស់',
        type: 'SPOILAGE',
        quantity: -3,
        previousStock: 15,
        newStock: 12,
        unitCost: 0.90,
        reason: 'EXPIRED',
        reference: 'WASTE-04',
        operator: 'Sophia Bennett',
        notes: 'Exceeded display freshness shelf life'
      }
    ];
  });

  useEffect(() => {
    try {
      storage.setItem('aroma_stock_movements', JSON.stringify(stockMovements));
    } catch (e) {}
  }, [stockMovements]);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3800);
  }, []);

  // Initialize data
  const loadInitialData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [prods, ings, ords] = await Promise.all([
        api.fetchProducts(),
        api.fetchIngredients(),
        api.fetchOrders()
      ]);
      setProducts(prods);
      setIngredients(ings);
      setOrders(ords);
    } catch (err) {
      console.error('Data load error', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Staff Roster & Audit Ledger Loader
  const loadStaffAndAudits = useCallback(async () => {
    try {
      const [staff, logs] = await Promise.all([
        api.fetchStaff(),
        api.fetchAuditLogs()
      ]);
      setStaffList(staff);
      setAuditLogs(logs);

      // Keep active user synchronized if their permissions or details were updated
      const currentStored = getStoredUser();
      if (currentStored && Array.isArray(staff) && staff.length > 0) {
        const matching = staff.find(
          (s) => s.id === currentStored.id || (s.email && s.email.toLowerCase() === currentStored.email?.toLowerCase())
        );
        if (matching) {
          setUser(matching);
          saveStoredUser(matching);
        }
      }
    } catch (e) {}
  }, []);

  // Staff Shift Lifecycle Loader
  const loadShifts = useCallback(async () => {
    try {
      const data = await api.fetchShifts();
      setShifts(data);
      const act = data.find((s) => s.status === 'OPEN') || null;
      setActiveShift(act);
      if (act && act.startingFloat) {
        setStartingFloat(act.startingFloat);
      }
    } catch (e) {}
  }, []);

  const handleOpenShift = async (shiftData) => {
    try {
      const created = await api.openShift(shiftData);
      await loadShifts();
      showToast(`Shift opened for ${created.staffName} ($${Number(created.startingFloat).toFixed(2)} float)`, 'success');
      return created;
    } catch (e) {
      showToast('Failed to open shift: ' + (e.message || e), 'error');
      throw e;
    }
  };

  const handleCloseShift = async (closeData) => {
    try {
      const closed = await api.closeShift(closeData);
      await loadShifts();
      showToast(`Shift ${closed.shiftNumber} closed. Variance: ${closed.variance >= 0 ? `+$${closed.variance.toFixed(2)}` : `-$${Math.abs(closed.variance).toFixed(2)}`}`, 'info');
      return closed;
    } catch (e) {
      showToast('Failed to close shift: ' + (e.message || e), 'error');
      throw e;
    }
  };

  const handleRecordCashMovement = async (payload) => {
    try {
      const updated = await api.recordCashMovement(payload);
      await loadShifts();
      return updated;
    } catch (e) {
      showToast('Failed to record cash movement: ' + (e.message || e), 'error');
      throw e;
    }
  };

  const openShiftModal = useCallback((mode = 'AUTO') => {
    setShiftModalMode(mode);
    setIsShiftModalOpen(true);
  }, []);

  useEffect(() => {
    loadInitialData();
    loadStaffAndAudits();
    loadShifts();
  }, [loadInitialData, loadStaffAndAudits, loadShifts]);

  // Dynamic Route Guard: Prevents unauthorized roles from accessing restricted views
  useEffect(() => {
    if (permissions && permissions.allowedTabs) {
      if (!permissions.allowedTabs.includes(activeTab)) {
        const fallback = permissions.allowedTabs[0] || 'pos';
        setActiveTab(fallback);
        showToast(`Route Guard: Access restricted for ${permissions.title}. Switched to ${fallback.toUpperCase()}.`, 'warning');
      }
    }
  }, [user, activeTab, permissions, showToast]);

  // Manager Override Authorization Handler
  const requestManagerOverride = ({ action, details, amount = 0, onSuccess, onCancel }) => {
    if (isManagerOrAdmin) {
      if (onSuccess) onSuccess({ authorized: true, managerName: user?.name, managerRole: user?.role });
      return;
    }
    setOverrideModal({
      isOpen: true,
      action,
      details,
      amount,
      onSuccess,
      onCancel
    });
  };

  const closeManagerOverride = () => {
    if (overrideModal.onCancel) overrideModal.onCancel();
    setOverrideModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Auth & Handover Functions
  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      setIsAuthenticated(true);
      showToast(`Welcome back, ${res.user.name}! ☕`, 'success');
      return true;
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const logout = () => {
    saveStoredUser(null);
    setUser(null);
    setIsAuthenticated(false);
    showToast('Signed out successfully', 'info');
  };

  const switchUser = (newUser) => {
    saveStoredUser(newUser);
    setUser(newUser);
    setIsAuthenticated(true);
    api.shiftHandover(newUser.name);
    showToast(`Active operator switched to ${newUser.name} (${newUser.role})`, 'info');
  };

  const faceLogin = async (staffId) => {
    try {
      const res = await api.faceLogin(staffId);
      if (res && res.user) {
        setUser(res.user);
        setIsAuthenticated(true);
        setIsScreenLocked(false);
        showToast(`Welcome back, ${res.user.name}! (Biometric Face ID)`, 'success');
        return res.user;
      }
    } catch (err) {
      showToast(err.message || 'Face login failed', 'error');
      throw err;
    }
  };

  const enrollFaceForStaff = async (staffId, facePhoto, faceHash = '', faceBiometrics = null) => {
    try {
      const res = await api.enrollFace(staffId, facePhoto, faceHash, faceBiometrics);
      if (user && user.id === staffId) {
        const updatedUser = { 
          ...user, 
          faceEnrolled: true, 
          facePhoto, 
          faceHash: faceHash || user.faceHash,
          faceBiometrics: faceBiometrics || user.faceBiometrics,
          avatar: facePhoto || user.avatar 
        };
        setUser(updatedUser);
        saveStoredUser(updatedUser);
      }
      if (loadStaffAndAudits) await loadStaffAndAudits();
      showToast(isKhmer ? 'បានរក្សាទុក Face ID ជោគជ័យ!' : 'Face ID enrolled and saved successfully!', 'success');
      return res;
    } catch (err) {
      showToast(err.message || 'Face enrollment failed', 'error');
      throw err;
    }
  };

  // Screen Lock & Seamless Handover with PIN
  const lockScreen = () => {
    setIsScreenLocked(true);
  };

  const unlockScreen = (staffMember) => {
    setIsScreenLocked(false);
    setUser(staffMember);
    saveStoredUser(staffMember);
    api.shiftHandover(staffMember.name);
    showToast(`Handover complete! Register now operated by ${staffMember.name} (${staffMember.role})`, 'success');
  };

  // User Profile Edit & Face ID Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Global Quick Face Scanner Modal ("Scan Face & Save for Me")
  const [isFaceEnrollModalOpen, setIsFaceEnrollModalOpen] = useState(false);
  const [faceEnrollTarget, setFaceEnrollTarget] = useState(null);

  const openFaceScannerForCurrentUser = (customTarget = null) => {
    setFaceEnrollTarget(customTarget || user);
    setIsFaceEnrollModalOpen(true);
  };

  const updateUserProfile = async (profileData) => {
    try {
      const targetId = profileData.id || user?.id;
      const res = await api.updateStaff(targetId, profileData);
      const updatedUser = { ...user, ...(res || {}), ...profileData };
      setUser(updatedUser);
      saveStoredUser(updatedUser);
      if (loadStaffAndAudits) await loadStaffAndAudits();
      showToast(`Account profile updated for ${updatedUser.name}!`, 'success');
      return updatedUser;
    } catch (err) {
      showToast(err.message || 'Failed to update account', 'error');
      throw err;
    }
  };

  // Dynamic Product Auto-Disabling:
  // Evaluates each product against raw ingredient levels
  const evaluatedProducts = useMemo(() => {
    return products.map((prod) => {
      if (prod.stock <= 0) {
        return { ...prod, isAutoDisabled: true, disabledReason: 'Sold Out' };
      }
      if (prod.recipe && prod.recipe.length > 0) {
        for (const item of prod.recipe) {
          const ing = ingredients.find((i) => i.id === item.ingredientId);
          if (ing && ing.stock < item.quantity) {
            return {
              ...prod,
              isAutoDisabled: true,
              disabledReason: `Out of: ${ing.name}`
            };
          }
        }
      }
      return { ...prod, isAutoDisabled: false, disabledReason: '' };
    });
  }, [products, ingredients]);

  // Cart Management with Modifiers
  const addToCart = (product, customizedData = null) => {
    // Check if auto-disabled due to ingredient shortage
    const evaluated = evaluatedProducts.find((p) => p.id === product.id);
    if (evaluated?.isAutoDisabled) {
      showToast(`"${product.name}" is unavailable: ${evaluated.disabledReason}`, 'error');
      return;
    }

    const unitPrice = customizedData?.finalUnitPrice || product.price;
    const modifiers = customizedData?.modifiers || {};
    const modifierLabels = customizedData?.modifierLabels || [];
    const notes = customizedData?.notes || '';

    // Generate unique cart key based on product id + modifiers
    const cartItemId = `${product.id}-${JSON.stringify(modifiers)}`;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.cartItemId === cartItemId);
      const currentQtyInCart = existing ? existing.quantity : 0;

      if (currentQtyInCart + 1 > product.stock) {
        showToast(`Only ${product.stock} units of ${product.name} available in stock!`, 'warning');
        return prevCart;
      }

      if (existing) {
        return prevCart.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prevCart,
        {
          cartItemId,
          product,
          unitPrice,
          quantity: 1,
          modifiers,
          modifierLabels,
          notes
        }
      ];
    });

    showToast(`Added ${product.name} to ticket`, 'success');
  };

  const updateCartQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      voidCartItem(cartItemId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const updateItemNotes = (cartItemId, notes) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.cartItemId === cartItemId ? { ...item, notes } : item
      )
    );
  };

  const removeFromCart = (cartItemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartItemId !== cartItemId));
  };

  const duplicateCartItem = (cartItemId) => {
    setCart((prevCart) => {
      const item = prevCart.find((i) => i.cartItemId === cartItemId);
      if (!item) return prevCart;
      const stockLimit = item.product?.stock !== undefined ? item.product.stock : 999;
      if (item.quantity + 1 > stockLimit) {
        showToast(`Cannot duplicate: Only ${stockLimit} units of ${item.product?.name || 'item'} available!`, 'warning');
        return prevCart;
      }
      return prevCart.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i
      );
    });
    showToast('Item duplicated in ticket (+1) / បានចម្លងមុខទំនិញ (+1)', 'success');
  };

  // RBAC Manager Override for Voids
  const voidCartItem = (cartItemId) => {
    const item = cart.find((i) => i.cartItemId === cartItemId);
    if (!item) return;

    if (isCashier) {
      requestManagerOverride({
        action: 'VOID_ITEM',
        details: `Void 1x "${item.product.name}" from active transaction ticket`,
        amount: item.unitPrice * item.quantity,
        onSuccess: () => {
          removeFromCart(cartItemId);
          showToast(`Voided ${item.product.name} with manager authorization`, 'info');
        }
      });
    } else {
      removeFromCart(cartItemId);
      showToast(`Removed ${item.product.name}`, 'info');
    }
  };

  // RBAC Manager Override for Large Discounts (>15%)
  const setAuthorizedDiscount = (pct) => {
    if (pct > 15 && isCashier) {
      requestManagerOverride({
        action: 'DISCOUNT_OVERRIDE',
        details: `Authorize ${pct}% promotional discount on current ticket`,
        amount: (cartTotals.subtotal * (pct / 100)),
        onSuccess: () => {
          setDiscountPercent(pct);
          showToast(`Applied ${pct}% discount with manager authorization`, 'success');
        }
      });
    } else {
      setDiscountPercent(pct);
    }
  };

  const clearCart = () => {
    if (cart.length > 0 && isCashier) {
      requestManagerOverride({
        action: 'VOID_ALL_ITEMS',
        details: `Void entire active ticket (${cart.length} items)`,
        amount: cartTotals.total,
        onSuccess: () => {
          setCart([]);
          setCustomerName('');
          setDiscountPercent(0);
          setLinkedCustomer(null);
          setAppliedPoints(0);
          showToast('Ticket cleared with manager authorization', 'info');
        }
      });
    } else {
      setCart([]);
      setCustomerName('');
      setDiscountPercent(0);
      setLinkedCustomer(null);
      setAppliedPoints(0);
    }
  };

  // Customer Loyalty Functions
  const linkCustomer = (queryOrCustomer) => {
    if (typeof queryOrCustomer === 'object' && queryOrCustomer?.id) {
      setLinkedCustomer(queryOrCustomer);
      setCustomerName(queryOrCustomer.name);
      setAppliedPoints(0);
      showToast(`Linked VIP Member: ${queryOrCustomer.name} (${queryOrCustomer.points} pts)`, 'info');
      return queryOrCustomer;
    }
    const clean = String(queryOrCustomer).trim().toLowerCase();
    const found = customers.find(
      (c) => c.phone.includes(clean) || c.name.toLowerCase().includes(clean)
    );
    if (found) {
      setLinkedCustomer(found);
      setCustomerName(found.name);
      setAppliedPoints(0);
      showToast(`Linked VIP Member: ${found.name} (${found.points} pts)`, 'info');
      return found;
    } else {
      showToast(`No profile found for "${queryOrCustomer}". Created walk-in guest.`, 'warning');
      setCustomerName(queryOrCustomer);
      return null;
    }
  };

  const unlinkCustomer = () => {
    setLinkedCustomer(null);
    setAppliedPoints(0);
    showToast('Customer unlinked from ticket', 'info');
  };

  const applyLoyaltyPoints = (points) => {
    if (!linkedCustomer) {
      showToast('Please link a customer first to apply reward points', 'warning');
      return;
    }
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const maxPointsSpendable = Math.min(linkedCustomer.points, Math.floor(subtotal * 100));
    const targetPoints = Math.max(0, Math.min(maxPointsSpendable, points));
    setAppliedPoints(targetPoints);
    if (targetPoints > 0) {
      showToast(`Applied ${targetPoints} Points (-$${(targetPoints / 100).toFixed(2)})`, 'success');
    } else {
      showToast('Removed loyalty points discount', 'info');
    }
  };

  // Live Totals Calculations with Loyalty Points, Combos, Happy Hour & Stamp Card Free Drink
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const percentageDiscount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
    const loyaltyDiscountAmount = Math.round((appliedPoints / 100) * 100) / 100;

    // 1. Morning Coffee + Pastry Combo Bundle ($1.50 OFF when buying Coffee + Bakery)
    const hasCoffee = cart.some(item => ['Hot Coffee', 'Iced Coffee', 'Specialty'].includes(item.product?.category));
    const hasBakery = cart.some(item => (item.product?.category || '').toLowerCase().includes('bakery') || (item.product?.category || '').toLowerCase().includes('pastry'));
    const isComboApplicable = isMorningComboActive && hasCoffee && hasBakery;
    const comboDiscount = isComboApplicable ? 1.50 : 0;

    // 2. Happy Hour Discount (15% OFF coffee drinks)
    const happyHourDiscount = isHappyHourActive && hasCoffee
      ? Math.round(cart.filter(item => ['Hot Coffee', 'Iced Coffee', 'Specialty'].includes(item.product?.category))
          .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 0.15 * 100) / 100
      : 0;

    // 3. Digital Stamp Card: Free 10th Cup Reward
    let freeDrinkDiscount = 0;
    if (isRedeemingFreeStampDrink && hasCoffee) {
      const coffeeItems = cart.filter(item => ['Hot Coffee', 'Iced Coffee', 'Specialty'].includes(item.product?.category));
      if (coffeeItems.length > 0) {
        const highestPriced = Math.max(...coffeeItems.map(i => i.unitPrice));
        freeDrinkDiscount = highestPriced;
      }
    }

    const totalDiscount = Math.min(
      subtotal, 
      Math.round((percentageDiscount + loyaltyDiscountAmount + comboDiscount + happyHourDiscount + freeDrinkDiscount) * 100) / 100
    );
    const taxableSubtotal = Math.max(0, subtotal - totalDiscount);
    const tax = Math.round(taxableSubtotal * 0.08 * 100) / 100; // 8% sales tax
    const total = Math.round((taxableSubtotal + tax) * 100) / 100;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const earnedPoints = Math.floor(total);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: totalDiscount,
      percentageDiscount,
      loyaltyDiscountAmount,
      comboDiscount,
      isComboApplicable,
      happyHourDiscount,
      freeDrinkDiscount,
      isRedeemingFreeStampDrink,
      hasCoffee,
      hasBakery,
      appliedPoints,
      discountPercent,
      tax,
      total,
      itemCount,
      earnedPoints
    };
  }, [cart, discountPercent, appliedPoints, isMorningComboActive, isHappyHourActive, isRedeemingFreeStampDrink]);

  // Checkout with immediate raw ingredient deduction, loyalty score awards, and recipe sync
  const processCheckout = async (paymentMethod, amountPaid) => {
    if (!activeShift) {
      const isKm = storage.getItem('aroma_lang') === 'km';
      showToast(
        isKm 
          ? 'មិនអាចគិតប្រាក់បានទេ៖ សូមបើកហាង/វេនជាមុនសិន!' 
          : 'Cannot complete sale: Store is closed. Please open store first!',
        'error'
      );
      openShiftModal('OPEN');
      return null;
    }

    if (cart.length === 0) {
      showToast('Cart is empty!', 'error');
      return null;
    }

    const earnedPoints = cartTotals.earnedPoints;
    const usedPoints = appliedPoints;

    const checkoutPayload = {
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        imageUrl: item.product.imageUrl || '',
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: Math.round(item.unitPrice * item.quantity * 100) / 100,
        notes: item.notes || '',
        modifiers: item.modifiers || {}
      })),
      paymentMethod,
      amountPaid: Number(amountPaid) || cartTotals.total,
      discount: cartTotals.discountAmount,
      orderType,
      customerName: customerName.trim() || 'Walk-in Guest',
      customerPhone: linkedCustomer?.phone || '',
      buzzerNumber: buzzerNumber || '',
      loyaltyPointsUsed: usedPoints,
      loyaltyPointsEarned: earnedPoints
    };

    try {
      const order = await api.checkout(checkoutPayload, user?.name || 'Staff Barista');

      // Update customer loyalty score and stamp card
      if (linkedCustomer) {
        const coffeeDrinksCount = cart
          .filter(i => ['Hot Coffee', 'Iced Coffee', 'Specialty'].includes(i.product?.category))
          .reduce((sum, i) => sum + i.quantity, 0);

        let newStamps = linkedCustomer.stamps || 0;
        if (isRedeemingFreeStampDrink) {
          newStamps = 0; // Redeemed free reward drink!
          showToast('🎉 Redeemed 1 Free Coffee Reward! Stamps reset to 0.', 'success');
        } else {
          newStamps = newStamps + coffeeDrinksCount;
          if (newStamps >= 9) {
            showToast(`☕ Customer reached ${newStamps} stamps! Free Drink Reward unlocked!`, 'success');
          }
        }

        const updatedBalance = Math.max(0, linkedCustomer.points - usedPoints) + earnedPoints;
        const updatedCust = {
          ...linkedCustomer,
          points: updatedBalance,
          stamps: newStamps,
          visits: (linkedCustomer.visits || 0) + 1
        };
        setCustomers((prev) =>
          prev.map((c) => (c.id === linkedCustomer.id ? updatedCust : c))
        );
        setLinkedCustomer(updatedCust);
        setIsRedeemingFreeStampDrink(false);
      }
      setBuzzerNumber('');

      // Deduct product stock immediately
      setProducts((prev) =>
        prev.map((p) => {
          const item = checkoutPayload.items.find((i) => i.productId === p.id);
          if (item) {
            return { ...p, stock: Math.max(0, p.stock - item.quantity) };
          }
          return p;
        })
      );

      // Record standard stock movement ledger entries for POS sale
      try {
        const saleLogs = checkoutPayload.items.map((item) => {
          const p = products.find((prod) => prod.id === item.productId);
          const pStock = p?.stock || 0;
          return {
            id: `MOV-${Date.now().toString().slice(-6)}-${item.productId}`,
            date: new Date().toISOString(),
            productId: item.productId,
            productName: p?.name || item.name,
            productNameKm: p?.nameKm || item.name,
            type: 'SALE_OUT',
            quantity: -item.quantity,
            previousStock: pStock,
            newStock: Math.max(0, pStock - item.quantity),
            unitCost: p?.cost || 0,
            totalCost: Math.round((p?.cost || 0) * item.quantity * 100) / 100,
            reference: order.orderNumber,
            operator: user?.name || 'Cashier',
            notes: `POS Register Sale (${order.orderType})`
          };
        });
        setStockMovements((prev) => [...saleLogs, ...prev]);
      } catch (e) {}

      // Deduct raw ingredients according to recipes
      setIngredients((prevIngs) => {
        let lowIngredientTriggered = null;
        const updated = prevIngs.map((ing) => {
          let needed = 0;
          checkoutPayload.items.forEach((item) => {
            const prod = products.find((p) => p.id === item.productId);
            if (prod?.recipe) {
              const rItem = prod.recipe.find((r) => r.ingredientId === ing.id);
              if (rItem) {
                needed += rItem.quantity * item.quantity;
              }
            }
          });
          const newStock = Math.max(0, Math.round((ing.stock - needed) * 100) / 100);
          if (newStock <= ing.minThreshold && ing.stock > ing.minThreshold) {
            lowIngredientTriggered = ing.name;
          }
          return { ...ing, stock: newStock };
        });

        if (lowIngredientTriggered) {
          showToast(`⚠️ Low stock alert triggered for raw material: ${lowIngredientTriggered}`, 'warning');
        }
        return updated;
      });

      const orderWithLoyalty = {
        ...order,
        linkedCustomer: linkedCustomer ? { ...linkedCustomer } : null,
        customerPhone: linkedCustomer?.phone || '',
        loyaltyPointsUsed: usedPoints,
        loyaltyPointsEarned: earnedPoints,
        newLoyaltyBalance: linkedCustomer
          ? Math.max(0, linkedCustomer.points - usedPoints) + earnedPoints
          : 0
      };

      // Add to orders
      setOrders((prev) => [orderWithLoyalty, ...prev]);

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D97706', '#B45309', '#F59E0B', '#78350F']
        });
      } catch (e) {}

      showToast(`Order ${order.orderNumber} completed! Logged by ${user?.name}`, 'success');
      clearCart();
      setReceiptModalOrder(orderWithLoyalty);
      loadShifts();
      return orderWithLoyalty;
    } catch (err) {
      showToast(err.message || 'Checkout failed', 'error');
      throw err;
    }
  };

  const handleRefundOrder = async (orderId, reason = 'Customer requested refund') => {
    try {
      const updated = await api.refundOrder(orderId, reason);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast(`Order ${updated?.orderNumber || orderId} refunded successfully`, 'info');
      return updated;
    } catch (err) {
      showToast('Refund error: ' + (err.message || err), 'error');
      throw err;
    }
  };

  const duplicateOrder = (order) => {
    if (!order || !order.items || order.items.length === 0) {
      showToast('No items found in this order to duplicate', 'warning');
      return;
    }

    const newCart = [];
    for (const oi of order.items) {
      const prod = products.find((p) => p.id === oi.productId) || {
        id: oi.productId || 'prod-' + Math.floor(Math.random() * 10000),
        name: oi.productName || 'Beverage Item',
        nameKm: oi.productNameKm || oi.productName || 'ភេសជ្ជៈ',
        price: oi.unitPrice || 0,
        stock: 999,
        imageUrl: oi.imageUrl || ''
      };

      const modifiers = oi.modifiers || {};
      const modifierLabels = oi.modifierLabels || [];
      const notes = oi.notes || '';
      const cartItemId = `${prod.id}-${JSON.stringify(modifiers)}-${Date.now()}-${Math.random()}`;

      newCart.push({
        cartItemId,
        product: prod,
        unitPrice: oi.unitPrice || prod.price,
        quantity: oi.quantity || 1,
        modifiers,
        modifierLabels,
        notes
      });
    }

    setCart(newCart);
    if (order.customerName) setCustomerName(order.customerName);
    if (order.orderType) setOrderType(order.orderType);
    setActiveTab('pos');
    showToast(`Duplicated Order #${order.orderNumber || order.id} to POS cart / បានចម្លងកម្មង់ទៅកន្ត្រក POS`, 'success');
  };

  // Inventory & Ingredient Actions
  const addProduct = async (productData) => {
    try {
      const newProduct = await api.createProduct(productData);
      setProducts((prev) => [newProduct, ...prev]);
      showToast(`Product "${newProduct.name}" added to catalog!`, 'success');
      return newProduct;
    } catch (err) {
      showToast('Failed to add product', 'error');
      throw err;
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const updated = await api.updateProduct(id, productData);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast(`Product "${updated.name}" updated successfully!`, 'success');
      return updated;
    } catch (err) {
      showToast('Failed to update product', 'error');
      throw err;
    }
  };

  const restockProduct = async (id, delta = 10) => {
    try {
      const updated = await api.restockProduct(id, delta);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast(`Restocked ${delta} units of "${updated.name}" (Now: ${updated.stock})`, 'success');
      return updated;
    } catch (err) {
      showToast('Restock failed', 'error');
      throw err;
    }
  };

  const recordStockIn = async ({ productId, ingredientId, quantity, unitCost, supplier, reference, notes, uom }) => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) throw new Error('Valid stock-in quantity is required');

    // Case 1: Raw Ingredient
    if (ingredientId || (!productId && ingredients.some((i) => i.id === ingredientId))) {
      const ing = ingredients.find((i) => i.id === ingredientId);
      if (!ing) throw new Error('Raw Material not found');
      const previousStock = Number(ing.stock) || 0;
      const newStock = Math.round((previousStock + qty) * 100) / 100;
      const cost = unitCost !== undefined ? parseFloat(unitCost) : (ing.costPerUnit || 0);

      const updatedIng = { ...ing, stock: newStock, costPerUnit: cost };
      setIngredients((prev) => prev.map((i) => (i.id === ingredientId ? updatedIng : i)));
      saveStoredIngredients(ingredients.map((i) => (i.id === ingredientId ? updatedIng : i)));

      const newMovement = {
        id: `MOV-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        itemId: ingredientId,
        productId: ingredientId,
        productName: ing.name,
        productNameKm: ing.nameKm || ing.name,
        sku: ing.id,
        type: 'STOCK_IN',
        quantity: qty,
        unit: ing.unit || 'g',
        previousStock,
        newStock,
        unitCost: cost,
        totalCost: Math.round(cost * qty * 100) / 100,
        supplier: supplier || 'Mondulkiri Farm / Local Wholesale',
        reference: reference || `PO-${Date.now().toString().slice(-4)}`,
        operator: user?.name || 'Store Manager',
        notes: notes || 'Raw material receiving'
      };

      setStockMovements((prev) => [newMovement, ...prev]);
      showToast(`✅ នាំចូល ${qty}${ing.unit} "${ing.name}" (ស្តុកសរុប: ${newStock}${ing.unit})`, 'success');
      return updatedIng;
    }

    // Case 2: Menu Product
    const prod = products.find((p) => p.id === productId);
    if (!prod) throw new Error('Product not found');

    const previousStock = prod.stock || 0;
    const newStock = previousStock + qty;
    const cost = unitCost !== undefined ? parseFloat(unitCost) : (prod.cost || 0);

    const updatedProd = { ...prod, stock: newStock, cost };
    setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProd : p)));

    const newMovement = {
      id: `MOV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      itemId: productId,
      productId,
      productName: prod.name,
      productNameKm: prod.nameKm || prod.name,
      sku: prod.sku || `SKU-${prod.id}`,
      type: 'STOCK_IN',
      quantity: qty,
      unit: uom || prod.uom || 'Cup',
      previousStock,
      newStock,
      unitCost: cost,
      totalCost: Math.round(cost * qty * 100) / 100,
      supplier: supplier || 'Local Supplier',
      reference: reference || `PO-${Date.now().toString().slice(-4)}`,
      operator: user?.name || 'Store Manager',
      notes: notes || 'Stock replenishment'
    };

    setStockMovements((prev) => [newMovement, ...prev]);
    showToast(`✅ នាំចូល ${qty} ${prod.uom || 'កែវ/ដប'} សម្រាប់ "${prod.name}" (ស្តុកសរុប: ${newStock})`, 'success');
    return updatedProd;
  };

  const recordStockAdjustment = async ({ productId, ingredientId, quantity, reason, reference, notes }) => {
    const qty = parseFloat(quantity);
    if (!qty || qty === 0) throw new Error('Valid adjustment quantity is required');

    // Case 1: Raw Ingredient
    if (ingredientId || (!productId && ingredients.some((i) => i.id === ingredientId))) {
      const ing = ingredients.find((i) => i.id === ingredientId);
      if (!ing) throw new Error('Raw Material not found');
      const previousStock = Number(ing.stock) || 0;
      const newStock = Math.max(0, Math.round((previousStock + qty) * 100) / 100);

      const updatedIng = { ...ing, stock: newStock };
      setIngredients((prev) => prev.map((i) => (i.id === ingredientId ? updatedIng : i)));
      saveStoredIngredients(ingredients.map((i) => (i.id === ingredientId ? updatedIng : i)));

      const isSpoilage = qty < 0 && (reason === 'DAMAGED' || reason === 'EXPIRED' || reason === 'SPOILAGE' || reason === 'SPILLAGE');
      const movementType = isSpoilage ? 'SPOILAGE' : 'ADJUSTMENT';

      const newMovement = {
        id: `MOV-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        itemId: ingredientId,
        productId: ingredientId,
        productName: ing.name,
        productNameKm: ing.nameKm || ing.name,
        sku: ing.id,
        type: movementType,
        quantity: qty,
        unit: ing.unit || 'g',
        previousStock,
        newStock,
        unitCost: ing.costPerUnit || 0,
        totalCost: Math.round((ing.costPerUnit || 0) * Math.abs(qty) * 100) / 100,
        reason: reason || 'INVENTORY_AUDIT',
        reference: reference || `ADJ-${Date.now().toString().slice(-4)}`,
        operator: user?.name || 'Store Manager',
        notes: notes || 'Raw material adjustment'
      };

      setStockMovements((prev) => [newMovement, ...prev]);
      showToast(`កែសម្រួលស្តុក "${ing.name}" ចំនួន ${qty > 0 ? '+' + qty : qty}${ing.unit} (ស្តុកសរុប: ${newStock}${ing.unit})`, 'info');
      return updatedIng;
    }

    // Case 2: Menu Product
    const prod = products.find((p) => p.id === productId);
    if (!prod) throw new Error('Product not found');

    const previousStock = prod.stock || 0;
    const newStock = Math.max(0, previousStock + qty);

    const updatedProd = { ...prod, stock: newStock };
    setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProd : p)));

    const isSpoilage = qty < 0 && (reason === 'DAMAGED' || reason === 'EXPIRED' || reason === 'SPOILAGE');
    const movementType = isSpoilage ? 'SPOILAGE' : 'ADJUSTMENT';

    const newMovement = {
      id: `MOV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      itemId: productId,
      productId,
      productName: prod.name,
      productNameKm: prod.nameKm || prod.name,
      sku: prod.sku || `SKU-${prod.id}`,
      type: movementType,
      quantity: qty,
      unit: prod.uom || 'Cup',
      previousStock,
      newStock,
      unitCost: prod.cost || 0,
      totalCost: Math.round((prod.cost || 0) * Math.abs(qty) * 100) / 100,
      reason: reason || 'INVENTORY_AUDIT',
      reference: reference || `ADJ-${Date.now().toString().slice(-4)}`,
      operator: user?.name || 'Store Manager',
      notes: notes || 'Stock count adjustment'
    };

    setStockMovements((prev) => [newMovement, ...prev]);
    showToast(`កែសម្រួលស្តុក "${prod.name}" ចំនួន ${qty > 0 ? '+' + qty : qty} (ស្តុកសរុប: ${newStock})`, 'info');
    return updatedProd;
  };

  const createIngredient = async (ingredientData) => {
    const newId = `ing-${Date.now().toString().slice(-4)}`;
    const newIng = {
      id: newId,
      name: ingredientData.name || 'New Raw Material',
      nameKm: ingredientData.nameKm || ingredientData.name || 'វត្ថុធាតុដើមថ្មី',
      unit: ingredientData.unit || 'g',
      category: ingredientData.category || 'Coffee Beans',
      stock: parseFloat(ingredientData.stock) || 0,
      minThreshold: parseFloat(ingredientData.minThreshold) || 100,
      costPerUnit: parseFloat(ingredientData.costPerUnit) || 0.05,
      supplier: ingredientData.supplier || 'Standard Supplier'
    };

    const updatedList = [...ingredients, newIng];
    setIngredients(updatedList);
    saveStoredIngredients(updatedList);
    showToast(`បានបង្កើតវត្ថុធាតុដើម "${newIng.name}" ដោយជោគជ័យ!`, 'success');
    return newIng;
  };

  const updateIngredient = async (id, updatedData) => {
    const updatedList = ingredients.map((i) => {
      if (i.id === id) {
        return {
          ...i,
          ...updatedData,
          stock: updatedData.stock !== undefined ? parseFloat(updatedData.stock) : i.stock,
          minThreshold: updatedData.minThreshold !== undefined ? parseFloat(updatedData.minThreshold) : i.minThreshold,
          costPerUnit: updatedData.costPerUnit !== undefined ? parseFloat(updatedData.costPerUnit) : i.costPerUnit
        };
      }
      return i;
    });

    setIngredients(updatedList);
    saveStoredIngredients(updatedList);
    showToast(`បានកែប្រែព័ត៌មានវត្ថុធាតុដើមដោយជោគជ័យ!`, 'success');
    return updatedList.find((i) => i.id === id);
  };

  const deleteIngredient = async (id) => {
    const ing = ingredients.find((i) => i.id === id);
    const updatedList = ingredients.filter((i) => i.id !== id);
    setIngredients(updatedList);
    saveStoredIngredients(updatedList);
    showToast(`បានលុប "${ing?.name || 'Ingredient'}" ចេញពីបញ្ជីវត្ថុធាតុដើម`, 'info');
    return true;
  };

  const restockIngredient = async (id, delta = 500) => {
    try {
      const updated = await api.restockIngredient(id, delta);
      setIngredients((prev) => prev.map((i) => (i.id === id ? updated : i)));
      showToast(`Restocked ${delta}${updated.unit} of "${updated.name}" (Now: ${updated.stock}${updated.unit})`, 'success');
      return updated;
    } catch (err) {
      showToast('Restock ingredient failed', 'error');
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    const prod = products.find((p) => p.id === id);
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast(`"${prod?.name || 'Product'}" removed from catalog`, 'info');
      return true;
    } catch (err) {
      showToast('Delete failed', 'error');
      throw err;
    }
  };

  const lowStockProducts = useMemo(
    () => evaluatedProducts.filter((p) => p.stock > 0 && p.stock <= 5),
    [evaluatedProducts]
  );

  const lowStockIngredients = useMemo(
    () => ingredients.filter((i) => i.stock <= i.minThreshold),
    [ingredients]
  );

  // Category Management Methods
  const addCategory = async (catData) => {
    try {
      const saved = await api.createCategory(catData);
      setCategories((prev) => [...prev, saved]);
      showToast(`Category "${saved.name}" created!`, 'success');
      return saved;
    } catch (e) {
      showToast(e.message || 'Failed to create category', 'error');
      throw e;
    }
  };

  const updateCategory = async (id, catData) => {
    try {
      const updated = await api.updateCategory(id, catData);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast(`Category "${updated.name}" updated!`, 'success');
      return updated;
    } catch (e) {
      showToast('Failed to update category', 'error');
      throw e;
    }
  };

  const deleteCategory = async (id) => {
    try {
      await api.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast('Category deleted', 'info');
      return true;
    } catch (e) {
      showToast(e.message || 'Cannot delete category', 'error');
      throw e;
    }
  };

  // Real-Time Dual-Screen Customer Display Broadcaster
  const broadcastCustomerDisplay = useCallback((extraState = {}) => {
    const payload = {
      cart,
      orderType,
      customerName: customerName.trim() || 'Walk-in Guest',
      linkedCustomer,
      cartTotals,
      checkoutState: checkoutModalState,
      storeInfo,
      timestamp: Date.now(),
      ...extraState
    };
    try {
      storage.setItem('aroma_customer_state', JSON.stringify(payload));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('aroma_customer_channel');
        bc.postMessage({ type: 'SYNC_STATE', payload });
        bc.close();
      }
    } catch (e) {}
  }, [cart, orderType, customerName, linkedCustomer, cartTotals, checkoutModalState, storeInfo]);

  useEffect(() => {
    broadcastCustomerDisplay();
  }, [cart, orderType, customerName, linkedCustomer, cartTotals, checkoutModalState, storeInfo, broadcastCustomerDisplay]);

  const openCustomerDisplayWindow = () => {
    const url = window.location.origin + '/customer';
    window.open(url, 'AromaCustomerDisplay', 'width=1150,height=820,menubar=no,toolbar=no,location=no');
    showToast('Customer Display opened in new window! Drag to 2nd monitor.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        storeInfo,
        updateStoreInfo,
        isStoreSettingsOpen,
        setIsStoreSettingsOpen,
        user,
        userRole,
        permissions,
        isManagerOrAdmin,
        isAdmin,
        isCashier,
        isBarista,
        isSecurity,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        isPosFocusMode,
        setIsPosFocusMode,
        isCustomerPreviewOpen,
        setIsCustomerPreviewOpen,
        checkoutModalState,
        setCheckoutModalState,
        broadcastCustomerDisplay,
        openCustomerDisplayWindow,
        staffList,
        auditLogs,
        loadStaffAndAudits,
        overrideModal,
        requestManagerOverride,
        closeManagerOverride,
        voidCartItem,
        setAuthorizedDiscount,
        isAuthenticated,
        login,
        faceLogin,
        enrollFaceForStaff,
        logout,
        switchUser,
        isScreenLocked,
        lockScreen,
        unlockScreen,
        startingFloat,
        setStartingFloat,
        isZReportOpen,
        setIsZReportOpen,
        isShiftModalOpen,
        setIsShiftModalOpen,
        shiftModalMode,
        setShiftModalMode,
        openShiftModal,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isFaceEnrollModalOpen,
        setIsFaceEnrollModalOpen,
        faceEnrollTarget,
        setFaceEnrollTarget,
        openFaceScannerForCurrentUser,
        updateUserProfile,
        shifts,
        activeShift,
        loadShifts,
        openShift: handleOpenShift,
        closeShift: handleCloseShift,
        recordCashMovement: handleRecordCashMovement,
        activeTab,
        setActiveTab,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        products: evaluatedProducts,
        ingredients,
        loadingData,
        cart,
        orderType,
        setOrderType,
        customerName,
        setCustomerName,
        discountPercent,
        setDiscountPercent,
        customers,
        linkedCustomer,
        appliedPoints,
        linkCustomer,
        unlinkCustomer,
        applyLoyaltyPoints,
        cartTotals,
        buzzerNumber,
        setBuzzerNumber,
        isMorningComboActive,
        setIsMorningComboActive,
        isHappyHourActive,
        setIsHappyHourActive,
        isRedeemingFreeStampDrink,
        setIsRedeemingFreeStampDrink,
        addToCart,
        duplicateCartItem,
        updateCartQuantity,
        updateItemNotes,
        removeFromCart,
        clearCart,
        processCheckout,
        orders,
        receiptModalOrder,
        setReceiptModalOrder,
        receiptModalView,
        setReceiptModalView,
        refundOrder: handleRefundOrder,
        duplicateOrder,
        addProduct,
        updateProduct,
        restockProduct,
        recordStockIn,
        recordStockAdjustment,
        stockMovements,
        restockIngredient,
        deleteProduct,
        createIngredient,
        updateIngredient,
        deleteIngredient,
        lowStockProducts,
        lowStockIngredients,
        toast,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
