// High-fidelity Coffee Shop data with recipe mappings, raw ingredients, modifiers, and staff PINs

export const INITIAL_INGREDIENTS = [
  { id: "ing-1", name: "House Espresso Blend Beans", unit: "g", stock: 3200, minThreshold: 500, costPerUnit: 0.03 },
  { id: "ing-2", name: "Ethiopian Guji Heirloom Beans", unit: "g", stock: 2400, minThreshold: 400, costPerUnit: 0.04 },
  { id: "ing-3", name: "Organic Whole Milk", unit: "ml", stock: 6000, minThreshold: 1000, costPerUnit: 0.003 },
  { id: "ing-4", name: "Barista Edition Oat Milk", unit: "ml", stock: 5000, minThreshold: 800, costPerUnit: 0.005 },
  { id: "ing-5", name: "Artisan Almond Frangipane", unit: "pcs", stock: 14, minThreshold: 4, costPerUnit: 1.80 },
  { id: "ing-6", name: "Cardamom Brioche Knots", unit: "pcs", stock: 12, minThreshold: 4, costPerUnit: 1.50 },
  { id: "ing-7", name: "Dark Brown Sugar Syrup", unit: "ml", stock: 1800, minThreshold: 300, costPerUnit: 0.015 },
  { id: "ing-8", name: "Madagascar Vanilla Syrup", unit: "ml", stock: 1400, minThreshold: 250, costPerUnit: 0.018 },
  { id: "ing-9", name: "Salted Caramel Sauce", unit: "ml", stock: 950, minThreshold: 200, costPerUnit: 0.02 },
  { id: "ing-10", name: "Ceremonial Uji Matcha Powder", unit: "g", stock: 650, minThreshold: 120, costPerUnit: 0.12 },
  { id: "ing-11", name: "Compostable Hot Cups (12oz)", unit: "cups", stock: 180, minThreshold: 30, costPerUnit: 0.08 },
  { id: "ing-12", name: "Cold Beverage Cups (16oz)", unit: "cups", stock: 160, minThreshold: 30, costPerUnit: 0.10 }
];

export const INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    name: "Artisan Pour Over",
    nameKm: "កាហ្វេតម្រង Artisan Pour Over",
    category: "Hot Coffee",
    categoryKm: "កាហ្វេក្តៅ",
    price: 4.75,
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    description: "Single-origin Ethiopian Yirgacheffe with floral jasmine & bright citrus notes.",
    sku: "SKU-HCF-001",
    recipe: [
      { ingredientId: "ing-2", ingredientName: "Ethiopian Guji Heirloom Beans", quantity: 18, unit: "g" },
      { ingredientId: "ing-11", ingredientName: "Compostable Hot Cups (12oz)", quantity: 1, unit: "cups" }
    ]
  },
  {
    id: "prod-2",
    name: "Velvety Flat White",
    nameKm: "កាហ្វេទឹកដោះគោ Flat White",
    category: "Hot Coffee",
    categoryKm: "កាហ្វេក្តៅ",
    price: 4.50,
    stock: 14,
    imageUrl: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=600&q=80",
    description: "Double ristretto espresso folded with micro-textured steamed whole milk.",
    sku: "SKU-HCF-002",
    recipe: [
      { ingredientId: "ing-1", ingredientName: "House Espresso Blend Beans", quantity: 18, unit: "g" },
      { ingredientId: "ing-3", ingredientName: "Organic Whole Milk", quantity: 180, unit: "ml" },
      { ingredientId: "ing-11", ingredientName: "Compostable Hot Cups (12oz)", quantity: 1, unit: "cups" }
    ]
  },
  {
    id: "prod-3",
    name: "Caramel Brûlée Macchiato",
    nameKm: "ម៉ាគីយ៉ាតូ Caramel Brûlée",
    category: "Hot Coffee",
    categoryKm: "កាហ្វេក្តៅ",
    price: 5.25,
    stock: 4, // Low stock indicator
    imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80",
    description: "Vanilla steamed milk marked with rich espresso and house salted caramel crunch.",
    sku: "SKU-HCF-003",
    recipe: [
      { ingredientId: "ing-1", ingredientName: "House Espresso Blend Beans", quantity: 18, unit: "g" },
      { ingredientId: "ing-3", ingredientName: "Organic Whole Milk", quantity: 160, unit: "ml" },
      { ingredientId: "ing-9", ingredientName: "Salted Caramel Sauce", quantity: 25, unit: "ml" },
      { ingredientId: "ing-11", ingredientName: "Compostable Hot Cups (12oz)", quantity: 1, unit: "cups" }
    ]
  },
  {
    id: "prod-4",
    name: "Smoked Spanish Cortado",
    nameKm: "កាហ្វេ Cortado",
    category: "Hot Coffee",
    categoryKm: "កាហ្វេក្តៅ",
    price: 4.25,
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80",
    description: "1:1 ratio of intense espresso and silky warm milk in a Gibraltar glass.",
    sku: "SKU-HCF-004",
    recipe: [
      { ingredientId: "ing-1", ingredientName: "House Espresso Blend Beans", quantity: 18, unit: "g" },
      { ingredientId: "ing-3", ingredientName: "Organic Whole Milk", quantity: 90, unit: "ml" },
      { ingredientId: "ing-11", ingredientName: "Compostable Hot Cups (12oz)", quantity: 1, unit: "cups" }
    ]
  },
  {
    id: "prod-5",
    name: "Nitro Cold Brew Reserve",
    nameKm: "កាហ្វេត្រជាក់ Nitro Cold Brew",
    category: "Iced Coffee",
    categoryKm: "កាហ្វេទឹកកក",
    price: 5.50,
    stock: 8,
    imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
    description: "20-hour steeped cold brew infused with nitrogen for a Guinness-like velvety crema.",
    sku: "SKU-ICF-001",
    recipe: [
      { ingredientId: "ing-1", ingredientName: "House Espresso Blend Beans", quantity: 25, unit: "g" },
      { ingredientId: "ing-12", ingredientName: "Cold Beverage Cups (16oz)", quantity: 1, unit: "cups" }
    ]
  },
  {
    id: "prod-6",
    name: "Iced Brown Sugar Oat Shaken",
    nameKm: "កាហ្វេ Iced Brown Sugar Oat",
    category: "Iced Coffee",
    categoryKm: "កាហ្វេទឹកកក",
    price: 5.75,
    stock: 3, // Low stock indicator
    imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80",
    description: "Blonde espresso vigorously shaken with dark muscovado sugar, cinnamon, and oat milk.",
    sku: "SKU-ICF-002",
    recipe: [
      { ingredientId: "ing-1", ingredientName: "House Espresso Blend Beans", quantity: 18, unit: "g" },
      { ingredientId: "ing-4", ingredientName: "Barista Edition Oat Milk", quantity: 200, unit: "ml" },
      { ingredientId: "ing-7", ingredientName: "Dark Brown Sugar Syrup", quantity: 30, unit: "ml" },
      { ingredientId: "ing-12", ingredientName: "Cold Beverage Cups (16oz)", quantity: 1, unit: "cups" }
    ]
  },
  {
    id: "prod-7",
    name: "Pistachio Cold Cream Brew",
    nameKm: "កាហ្វេ Pistachio Cold Cream",
    category: "Iced Coffee",
    categoryKm: "កាហ្វេទឹកកក",
    price: 5.95,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?auto=format&fit=crop&w=600&q=80",
    description: "Smooth iced coffee topped with hand-whipped roasted pistachio sweet cream.",
    sku: "SKU-ICF-003",
    recipe: [
      { ingredientId: "ing-1", ingredientName: "House Espresso Blend Beans", quantity: 20, unit: "g" },
      { ingredientId: "ing-3", ingredientName: "Organic Whole Milk", quantity: 100, unit: "ml" },
      { ingredientId: "ing-12", ingredientName: "Cold Beverage Cups (16oz)", quantity: 1, unit: "cups" }
    ]
  },
  {
    id: "prod-8",
    name: "Kyoto Slow Drip on Ice",
    nameKm: "កាហ្វេជប៉ុន Kyoto Slow Drip",
    category: "Iced Coffee",
    categoryKm: "កាហ្វេទឹកកក",
    price: 6.25,
    stock: 6,
    imageUrl: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80",
    description: "Extracted drop by drop over 12 hours with Japanese towers; complex and winey.",
    sku: "SKU-ICF-004",
    recipe: [
      { ingredientId: "ing-2", ingredientName: "Ethiopian Guji Heirloom Beans", quantity: 25, unit: "g" },
      { ingredientId: "ing-12", ingredientName: "Cold Beverage Cups (16oz)", quantity: 1, unit: "cups" }
    ]
  },
  {
    id: "prod-9",
    name: "Flaky Almond Croissant",
    nameKm: "នំក្រូសង់អាល់ម៉ុន Flaky Croissant",
    category: "Pastries",
    categoryKm: "នំបុ័ង & នំខេក",
    price: 4.50,
    stock: 2, // Low stock indicator
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
    description: "Double-baked pure French butter croissant filled with almond frangipane.",
    sku: "SKU-PST-001",
    recipe: [
      { ingredientId: "ing-5", ingredientName: "Artisan Almond Frangipane", quantity: 1, unit: "pcs" }
    ]
  },
  {
    id: "prod-10",
    name: "Cardamom Cinnamon Swirl",
    nameKm: "នំ Cardamom Brioche Swirl",
    category: "Pastries",
    categoryKm: "នំបុ័ង & នំខេក",
    price: 4.25,
    stock: 9,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    description: "Scandinavian style brioche knot spiced with crushed cardamom & pearl sugar.",
    sku: "SKU-PST-002",
    recipe: [
      { ingredientId: "ing-6", ingredientName: "Cardamom Brioche Knots", quantity: 1, unit: "pcs" }
    ]
  },
  {
    id: "prod-13",
    name: "Ethiopian Guji Heirloom (340g)",
    nameKm: "គ្រាប់កាហ្វេ Ethiopian Guji (340g)",
    category: "Beans",
    categoryKm: "គ្រាប់កាហ្វេ",
    price: 18.50,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=600&q=80",
    description: "Whole beans. Natural processed heirloom varietals with wild berry & lilac notes.",
    sku: "SKU-BNS-001",
    recipe: [
      { ingredientId: "ing-2", ingredientName: "Ethiopian Guji Heirloom Beans", quantity: 340, unit: "g" }
    ]
  },
  {
    id: "prod-16",
    name: "Uji Ceremonial Matcha Latte",
    nameKm: "តែបៃតងជប៉ុន Ceremonial Matcha",
    category: "Specialty",
    categoryKm: "ភេសជ្ជៈពិសេស",
    price: 5.75,
    stock: 10,
    imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80",
    description: "Stone-ground ceremonial grade green tea whisked fresh with oat milk & honey.",
    sku: "SKU-SPC-001",
    recipe: [
      { ingredientId: "ing-10", ingredientName: "Ceremonial Uji Matcha Powder", quantity: 6, unit: "g" },
      { ingredientId: "ing-4", ingredientName: "Barista Edition Oat Milk", quantity: 220, unit: "ml" },
      { ingredientId: "ing-11", ingredientName: "Compostable Hot Cups (12oz)", quantity: 1, unit: "cups" }
    ]
  }
];

export const CATEGORIES = [
  { id: "all", name: "All Items", nameKm: "ទាំងអស់", icon: "Coffee", color: "amber" },
  { id: "Hot Coffee", name: "Hot Coffee", nameKm: "កាហ្វេក្តៅ", icon: "Flame", color: "orange" },
  { id: "Iced Coffee", name: "Iced Coffee", nameKm: "កាហ្វេទឹកកក", icon: "Snowflake", color: "sky" },
  { id: "Pastries", name: "Pastries", nameKm: "នំបុ័ង & នំខេក", icon: "Croissant", color: "amber" },
  { id: "Beans", name: "Coffee Beans", nameKm: "គ្រាប់កាហ្វេ", icon: "Sparkles", color: "emerald" },
  { id: "Specialty", name: "Specialty Drinks", nameKm: "ភេសជ្ជៈពិសេស", icon: "CupSoda", color: "purple" }
];

export const INITIAL_ORDERS = [
  {
    id: "ord-1",
    orderNumber: "#ORD-1036",
    items: [
      { productId: "prod-1", productName: "Artisan Pour Over", unitPrice: 4.75, quantity: 2, subtotal: 9.50, notes: "Oat milk on side" },
      { productId: "prod-9", productName: "Flaky Almond Croissant", unitPrice: 4.50, quantity: 1, subtotal: 4.50, notes: "" }
    ],
    subtotal: 14.00,
    tax: 1.12,
    discount: 0.0,
    total: 15.12,
    paymentMethod: "CARD",
    amountPaid: 15.12,
    change: 0.0,
    orderType: "DINE_IN",
    cashierName: "Liam Vance",
    customerName: "Emma Watson",
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    status: "COMPLETED"
  },
  {
    id: "ord-2",
    orderNumber: "#ORD-1037",
    items: [
      { productId: "prod-5", productName: "Nitro Cold Brew Reserve", unitPrice: 5.50, quantity: 2, subtotal: 11.00, notes: "Extra ice" }
    ],
    subtotal: 11.00,
    tax: 0.88,
    discount: 1.0,
    total: 10.88,
    paymentMethod: "QR_CODE",
    amountPaid: 20.00,
    change: 9.12,
    orderType: "TAKEAWAY",
    cashierName: "Liam Vance",
    customerName: "Alex Rivera",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    status: "COMPLETED"
  },
  {
    id: "ord-3",
    orderNumber: "#ORD-1038",
    items: [
      { productId: "prod-2", productName: "Velvety Flat White", unitPrice: 4.50, quantity: 2, subtotal: 9.00, notes: "Extra hot" }
    ],
    subtotal: 9.00,
    tax: 0.72,
    discount: 0.0,
    total: 9.72,
    paymentMethod: "CASH",
    amountPaid: 20.00,
    change: 10.28,
    orderType: "DINE_IN",
    cashierName: "Sophia Bennett",
    customerName: "David Miller",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: "COMPLETED"
  },
  {
    id: "ord-4",
    orderNumber: "#ORD-1039",
    items: [
      { productId: "prod-6", productName: "Iced Brown Sugar Oat Shaken", unitPrice: 5.75, quantity: 3, subtotal: 17.25, notes: "Light ice" }
    ],
    subtotal: 17.25,
    tax: 1.38,
    discount: 0.0,
    total: 18.63,
    paymentMethod: "CARD",
    amountPaid: 18.63,
    change: 0.0,
    orderType: "TAKEAWAY",
    cashierName: "Marcus Thorne",
    customerName: "Alex Rivera",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: "COMPLETED"
  },
  {
    id: "ord-5",
    orderNumber: "#ORD-1040",
    items: [
      { productId: "prod-3", productName: "Spanish Caramel Latte", unitPrice: 5.25, quantity: 1, subtotal: 5.25, notes: "Extra drizzle" },
      { productId: "prod-9", productName: "Flaky Almond Croissant", unitPrice: 4.50, quantity: 1, subtotal: 4.50, notes: "" }
    ],
    subtotal: 9.75,
    tax: 0.78,
    discount: 0.0,
    total: 10.53,
    paymentMethod: "QR_CODE",
    amountPaid: 10.53,
    change: 0.0,
    orderType: "DINE_IN",
    cashierName: "Chloe Chen",
    customerName: "Michael Scott",
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    status: "COMPLETED"
  }
];

export const MODIFIER_GROUPS = [
  {
    id: "size",
    name: "Cup Size",
    required: true,
    options: [
      { id: "sz-sm", name: "Small (8oz)", price: 0.00 },
      { id: "sz-reg", name: "Medium (12oz)", price: 0.50 },
      { id: "sz-lrg", name: "Large (16oz)", price: 1.00 }
    ]
  },
  {
    id: "sweetness",
    name: "Sweetness Score",
    required: false,
    options: [
      { id: "sw-100", name: "100% Regular Sweet", price: 0.00 },
      { id: "sw-50", name: "50% Half Sweet", price: 0.00 },
      { id: "sw-0", name: "0% Sugar Free", price: 0.00 },
      { id: "sw-120", name: "120% Extra Sweet", price: 0.00 }
    ]
  },
  {
    id: "ice",
    name: "Ice Level Score",
    required: false,
    options: [
      { id: "ice-100", name: "100% Regular Ice", price: 0.00 },
      { id: "ice-50", name: "50% Less Ice", price: 0.00 },
      { id: "ice-0", name: "0% No Ice", price: 0.00 },
      { id: "ice-extra", name: "Extra Ice", price: 0.00 }
    ]
  },
  {
    id: "milk",
    name: "Milk Selection",
    required: false,
    options: [
      { id: "m-whole", name: "Organic Whole Milk", price: 0.00 },
      { id: "m-oat", name: "Barista Edition Oat Milk", price: 0.75 },
      { id: "m-almond", name: "Artisan Almond Milk", price: 0.75 },
      { id: "m-breve", name: "Half & Half Breve", price: 0.80 },
      { id: "m-none", name: "No Milk (Black)", price: 0.00 }
    ]
  },
  {
    id: "shots",
    name: "Espresso Intensity",
    required: false,
    options: [
      { id: "s-standard", name: "Standard Shot(s)", price: 0.00 },
      { id: "s-extra1", name: "+1 Extra Ristretto Shot", price: 0.95 },
      { id: "s-extra2", name: "+2 Extra Double Shot", price: 1.80 }
    ]
  },
  {
    id: "syrup",
    name: "Artisan Syrup Infusion",
    required: false,
    options: [
      { id: "syr-none", name: "No Syrup", price: 0.00 },
      { id: "syr-vanilla", name: "Madagascar Vanilla", price: 0.60 },
      { id: "syr-caramel", name: "Salted Caramel", price: 0.60 },
      { id: "syr-brownsugar", name: "Dark Brown Sugar", price: 0.60 },
      { id: "syr-hazelnut", name: "Roasted Hazelnut", price: 0.60 }
    ]
  }
];

export const DEMO_CUSTOMERS = [
  {
    id: "cust-1",
    name: "Sophea Kem",
    phone: "012888999",
    email: "sophea.kem@gmail.com",
    tier: "Gold VIP",
    points: 280,
    stamps: 8, // 8 of 10 coffee stamps collected (Buy 9 Get 1 Free)
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    visits: 24,
    favoriteDrink: "Iced Brown Sugar Oat Shaken"
  },
  {
    id: "cust-2",
    name: "David Miller",
    phone: "098765432",
    email: "david.miller@yahoo.com",
    tier: "Silver Member",
    points: 150,
    stamps: 9, // 9 of 10 coffee stamps - 1 FREE REWARD DRINK READY!
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    visits: 12,
    favoriteDrink: "Velvety Flat White"
  },
  {
    id: "cust-3",
    name: "Emma Watson",
    phone: "077123456",
    email: "emma.watson@artisan.org",
    tier: "Platinum Roaster",
    points: 450,
    stamps: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    visits: 38,
    favoriteDrink: "Ceremonial Uji Matcha Latte"
  },
  {
    id: "cust-4",
    name: "Alex Rivera",
    phone: "010555666",
    email: "alex.rivera@techflow.io",
    tier: "Bronze Member",
    points: 80,
    stamps: 3,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
    visits: 5,
    favoriteDrink: "Nitro Cold Brew Reserve"
  }
];

export const SYSTEM_PERMISSIONS = [
  { id: 'canAccessPos', label: 'POS Terminal & Register', category: 'Sales & POS', description: 'Take orders, apply discounts, and tender checkout' },
  { id: 'canAccessKds', label: 'Kitchen Display System (KDS)', category: 'Kitchen & Bar', description: 'View and mark drinks as completed in preparation queue' },
  { id: 'canAccessDashboard', label: 'Live Executive Dashboard', category: 'Analytics', description: 'View real-time sales revenue, charts, and metrics' },
  { id: 'canAccessInventory', label: 'Inventory & BOM Recipes', category: 'Operations', description: 'Inspect stock levels, manage recipes, and receive supplies' },
  { id: 'canAccessOrders', label: 'Order History & Receipts', category: 'Sales & POS', description: 'View transaction ledger, receipts, re-print, and void' },
  { id: 'canAccessReports', label: 'Management Reports & BI', category: 'Financials', description: 'View COGS, peak heatmaps, spoilage, and Z-reports' },
  { id: 'canPerformOverrides', label: 'POS Manager Overrides', category: 'Authorizations', description: 'Authorize item voids, refunds, and discounts > 15%' },
  { id: 'canSeeExpectedCash', label: 'Expected Cash Reconciliation', category: 'Financials', description: 'View expected drawer balance (Disable for Blind Drop)' },
  { id: 'canManageStaff', label: 'User & Permission Management', category: 'Administration', description: 'Add/edit staff, set wages, PINs, and grant permissions' },
  { id: 'canEditInventory', label: 'Modify Stock & Supplies', category: 'Operations', description: 'Adjust stock quantities, write off damaged goods' },
  { id: 'canEditMenu', label: 'Menu Catalog Management', category: 'Operations', description: 'Add, edit, or delete beverages, prices, and categories' }
];

export const ROLE_PERMISSIONS = {
  ADMIN: {
    role: "ADMIN",
    title: "Admin / Owner",
    badgeColor: "bg-purple-950/80 text-purple-300 border-purple-800",
    description: "Unrestricted access. Manages staff, financial reports, system configuration, menus, and inventory.",
    allowedTabs: ['pos', 'dashboard', 'inventory', 'orders', 'reports', 'kds', 'staff', 'cambodia-excel'],
    canPerformOverrides: true,
    canSeeExpectedCash: true,
    canManageStaff: true,
    canEditInventory: true,
    canEditMenu: true,
    permissions: [
      'canAccessPos', 'canAccessKds', 'canAccessDashboard', 'canAccessInventory', 
      'canAccessOrders', 'canAccessReports', 'canPerformOverrides', 'canSeeExpectedCash', 
      'canManageStaff', 'canEditInventory', 'canEditMenu'
    ]
  },
  MANAGER: {
    role: "MANAGER",
    title: "Store Manager",
    badgeColor: "bg-amber-950/80 text-amber-300 border-amber-800",
    description: "Access to daily reports, inventory receiving, KDS, staff shift roster, and manager authorization overrides.",
    allowedTabs: ['pos', 'dashboard', 'inventory', 'orders', 'reports', 'kds', 'staff', 'cambodia-excel'],
    canPerformOverrides: true,
    canSeeExpectedCash: true,
    canManageStaff: true,
    canEditInventory: true,
    canEditMenu: false,
    permissions: [
      'canAccessPos', 'canAccessKds', 'canAccessDashboard', 'canAccessInventory', 
      'canAccessOrders', 'canAccessReports', 'canPerformOverrides', 'canSeeExpectedCash', 
      'canManageStaff', 'canEditInventory'
    ]
  },
  CASHIER: {
    role: "CASHIER",
    title: "Cashier",
    badgeColor: "bg-sky-950/80 text-sky-300 border-sky-800",
    description: "Restricted strictly to POS ordering screen and shift reconciliation. Cannot access backend reports.",
    allowedTabs: ['pos', 'orders', 'cambodia-excel'],
    canPerformOverrides: false,
    canSeeExpectedCash: false, // Blind cash drop
    canManageStaff: false,
    canEditInventory: false,
    canEditMenu: false,
    permissions: [
      'canAccessPos', 'canAccessOrders'
    ]
  },
  BARISTA: {
    role: "BARISTA",
    title: "Barista / Kitchen",
    badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
    description: "Restricted to Kitchen Display System (KDS) drink preparation queue and order fulfillment.",
    allowedTabs: ['kds', 'orders', 'cambodia-excel'],
    canPerformOverrides: false,
    canSeeExpectedCash: false,
    canManageStaff: false,
    canEditInventory: false,
    canEditMenu: false,
    permissions: [
      'canAccessKds', 'canAccessOrders'
    ]
  },
  SECURITY: {
    role: "SECURITY",
    title: "Security & Compliance Officer",
    badgeColor: "bg-blue-950/80 text-blue-300 border-blue-800",
    description: "Monitors security audit trails, cashier voids, manager overrides, shift discrepancies, and user access.",
    allowedTabs: ['pos', 'dashboard', 'orders', 'reports', 'staff'],
    canPerformOverrides: true,
    canSeeExpectedCash: true,
    canManageStaff: true,
    canEditInventory: false,
    canEditMenu: false,
    permissions: [
      'canAccessPos', 'canAccessDashboard', 'canAccessOrders', 'canAccessReports', 
      'canPerformOverrides', 'canSeeExpectedCash', 'canManageStaff'
    ]
  }
};

export const DEMO_USERS = [
  {
    id: "usr-3",
    name: "Marcus Thorne",
    email: "admin@cafe.com",
    password: "admin123",
    role: "ADMIN",
    title: "Administrator / Owner",
    pin: "3333",
    hourlyRate: 28.00,
    status: "ACTIVE",
    phone: "+855 12 345 673",
    avatar: "",
    faceEnrolled: false,
    permissions: [
      'canAccessPos', 'canAccessKds', 'canAccessDashboard', 'canAccessInventory', 
      'canAccessOrders', 'canAccessReports', 'canPerformOverrides', 'canSeeExpectedCash', 
      'canManageStaff', 'canEditInventory', 'canEditMenu'
    ]
  },
  {
    id: "usr-2",
    name: "Sophia Bennett",
    email: "manager@cafe.com",
    password: "manager123",
    role: "MANAGER",
    title: "Store Manager",
    pin: "2222",
    hourlyRate: 22.00,
    status: "ACTIVE",
    phone: "+855 12 345 672",
    avatar: "",
    faceEnrolled: false,
    permissions: [
      'canAccessPos', 'canAccessKds', 'canAccessDashboard', 'canAccessInventory', 
      'canAccessOrders', 'canAccessReports', 'canPerformOverrides', 'canSeeExpectedCash', 
      'canManageStaff', 'canEditInventory'
    ]
  },
  {
    id: "usr-4",
    name: "Chloe Chen",
    email: "cashier@cafe.com",
    password: "cashier123",
    role: "CASHIER",
    title: "Head Cashier & Register",
    pin: "4444",
    hourlyRate: 12.50,
    status: "ACTIVE",
    phone: "+855 12 345 674",
    avatar: "",
    faceEnrolled: false,
    permissions: [
      'canAccessPos', 'canAccessOrders'
    ]
  },
  {
    id: "usr-1",
    name: "Liam Vance",
    email: "barista@cafe.com",
    password: "coffee123",
    role: "BARISTA",
    title: "Lead Barista & Roaster",
    pin: "1111",
    hourlyRate: 14.00,
    status: "ACTIVE",
    phone: "+855 12 345 671",
    avatar: "",
    faceEnrolled: false,
    permissions: [
      'canAccessKds', 'canAccessOrders'
    ]
  },
  {
    id: "usr-5",
    name: "Security Officer",
    email: "security@cafe.com",
    password: "security123",
    role: "SECURITY",
    title: "Security & Compliance Officer",
    pin: "5555",
    hourlyRate: 25.00,
    status: "ACTIVE",
    phone: "+855 12 345 675",
    avatar: "",
    faceEnrolled: false,
    permissions: [
      'canAccessPos', 'canAccessDashboard', 'canAccessOrders', 'canAccessReports', 
      'canPerformOverrides', 'canSeeExpectedCash', 'canManageStaff'
    ]
  }
];

export const PHOTO_PRESETS = [
  { name: "Espresso Shot", url: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80" },
  { name: "Iced Latte", url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80" },
  { name: "Cappuccino", url: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80" },
  { name: "Pour Over", url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80" },
  { name: "Golden Croissant", url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80" },
  { name: "Coffee Bag", url: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=600&q=80" },
  { name: "Cinnamon Muffin", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80" },
  { name: "Matcha Tea", url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80" }
];
