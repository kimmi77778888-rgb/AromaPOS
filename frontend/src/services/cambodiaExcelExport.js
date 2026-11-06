import * as XLSX from 'xlsx';

/**
 * Official Cambodia Administrative Standard Reference (25 Provinces & Capital)
 * Compliant with National Institute of Statistics (NIS) & Ministry of Interior Cambodia
 */
export const CAMBODIA_PROVINCES_STANDARD = [
  { code: 'KH-12', nameKm: 'រាជធានីភ្នំពេញ', nameEn: 'Phnom Penh Capital', typeKm: 'រាជធានី', typeEn: 'Capital', postalCode: '12000', districtsCount: 14, capitalTown: 'Phnom Penh' },
  { code: 'KH-01', nameKm: 'ខេត្តបន្ទាយមានជ័យ', nameEn: 'Banteay Meanchey', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '01000', districtsCount: 9, capitalTown: 'Serei Saophoan' },
  { code: 'KH-02', nameKm: 'ខេត្តបាត់ដំបង', nameEn: 'Battambang', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '02000', districtsCount: 14, capitalTown: 'Battambang' },
  { code: 'KH-03', nameKm: 'ខេត្តកំពង់ចាម', nameEn: 'Kampong Cham', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '03000', districtsCount: 10, capitalTown: 'Kampong Cham' },
  { code: 'KH-04', nameKm: 'ខេត្តកំពង់ឆ្នាំង', nameEn: 'Kampong Chhnang', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '04000', districtsCount: 8, capitalTown: 'Kampong Chhnang' },
  { code: 'KH-05', nameKm: 'ខេត្តកំពង់ស្ពឺ', nameEn: 'Kampong Speu', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '05000', districtsCount: 8, capitalTown: 'Chbar Mon' },
  { code: 'KH-06', nameKm: 'ខេត្តកំពង់ធំ', nameEn: 'Kampong Thom', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '06000', districtsCount: 9, capitalTown: 'Stung Saen' },
  { code: 'KH-07', nameKm: 'ខេត្តកំពត', nameEn: 'Kampot', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '07000', districtsCount: 9, capitalTown: 'Kampot' },
  { code: 'KH-08', nameKm: 'ខេត្តកណ្តាល', nameEn: 'Kandal', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '08000', districtsCount: 11, capitalTown: 'Ta Khmau' },
  { code: 'KH-09', nameKm: 'ខេត្តកោះកុង', nameEn: 'Koh Kong', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '09000', districtsCount: 7, capitalTown: 'Khemarak Phoumin' },
  { code: 'KH-10', nameKm: 'ខេត្តក្រចេះ', nameEn: 'Kratie', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '10000', districtsCount: 6, capitalTown: 'Kratie' },
  { code: 'KH-11', nameKm: 'ខេត្តមណ្ឌលគិរី', nameEn: 'Mondulkiri', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '11000', districtsCount: 5, capitalTown: 'Sen Monorom' },
  { code: 'KH-13', nameKm: 'ខេត្តព្រះវិហារ', nameEn: 'Preah Vihear', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '13000', districtsCount: 8, capitalTown: 'Tbeng Meanchey' },
  { code: 'KH-14', nameKm: 'ខេត្តព្រៃវែង', nameEn: 'Prey Veng', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '14000', districtsCount: 13, capitalTown: 'Prey Veng' },
  { code: 'KH-15', nameKm: 'ខេត្តពោធិ៍សាត់', nameEn: 'Pursat', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '15000', districtsCount: 7, capitalTown: 'Pursat' },
  { code: 'KH-16', nameKm: 'ខេត្តរតនគិរី', nameEn: 'Ratanakiri', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '16000', districtsCount: 9, capitalTown: 'Banlung' },
  { code: 'KH-17', nameKm: 'ខេត្តសៀមរាប', nameEn: 'Siem Reap', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '17000', districtsCount: 12, capitalTown: 'Siem Reap' },
  { code: 'KH-18', nameKm: 'ខេត្តព្រះសីហនុ', nameEn: 'Preah Sihanouk', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '18000', districtsCount: 5, capitalTown: 'Preah Sihanouk' },
  { code: 'KH-19', nameKm: 'ខេត្តស្ទឹងត្រែង', nameEn: 'Stung Treng', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '19000', districtsCount: 6, capitalTown: 'Stung Treng' },
  { code: 'KH-20', nameKm: 'ខេត្តស្វាយរៀង', nameEn: 'Svay Rieng', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '20000', districtsCount: 8, capitalTown: 'Svay Rieng' },
  { code: 'KH-21', nameKm: 'ខេត្តតាកែវ', nameEn: 'Takeo', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '21000', districtsCount: 10, capitalTown: 'Doun Kaev' },
  { code: 'KH-22', nameKm: 'ខេត្តឧត្តរមានជ័យ', nameEn: 'Oddar Meanchey', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '22000', districtsCount: 5, capitalTown: 'Samraong' },
  { code: 'KH-23', nameKm: 'ខេត្តកែប', nameEn: 'Kep', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '23000', districtsCount: 2, capitalTown: 'Kep' },
  { code: 'KH-24', nameKm: 'ខេត្តប៉ៃលិន', nameEn: 'Pailin', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '24000', districtsCount: 2, capitalTown: 'Pailin' },
  { code: 'KH-25', nameKm: 'ខេត្តត្បូងឃ្មុំ', nameEn: 'Tboung Khmum', typeKm: 'ខេត្ត', typeEn: 'Province', postalCode: '25000', districtsCount: 7, capitalTown: 'Suong' }
];

/**
 * Calculate BOM recipe unit cost for a given product
 */
export const calculateProductCost = (product, ingredients = []) => {
  if (!product) return 0;
  if (Array.isArray(product.recipe) && product.recipe.length > 0) {
    const calculated = product.recipe.reduce((total, item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      const unitCost = ing?.costPerUnit || 0;
      return total + unitCost * (item.quantity || 0);
    }, 0);
    if (calculated > 0) return Math.round(calculated * 100) / 100;
  }
  if (product.cost !== undefined && product.cost > 0) return Number(product.cost);
  // Default benchmark: ~28% food/drink cost in artisan cafes
  return Math.round((product.price || 0) * 0.28 * 100) / 100;
};

/**
 * Apply styling, column widths, row heights, and number formats
 */
const formatCambodianWorksheet = (ws, merges = [], colWidths = [], rowHeights = []) => {
  if (merges.length > 0) ws['!merges'] = merges;
  if (colWidths.length > 0) ws['!cols'] = colWidths.map((w) => ({ wch: w }));
  if (rowHeights.length > 0) ws['!rows'] = rowHeights.map((h) => ({ hpt: h }));

  Object.keys(ws).forEach((ref) => {
    if (ref.startsWith('!')) return;
    const cell = ws[ref];
    if (cell && typeof cell.v === 'number') {
      cell.t = 'n';
      // Format decimals as currency or whole numbers
      if (cell.v % 1 !== 0) {
        cell.z = '"$"#,##0.00';
      } else {
        cell.z = '#,##0';
      }
    }
  });
  return ws;
};

/**
 * Export Products & Inventory Catalog to Clean Cambodia Standard Excel (.xlsx)
 */
export const exportCambodiaStandardCatalog = ({
  products = [],
  ingredients = [],
  stockMovements = [],
  storeInfo = {},
  user = null,
  exchangeRate = 4100,
  mode = 'all', // 'all' | 'catalog' | 'inventory' | 'movements' | 'provinces'
  customFileName = null
}) => {
  const wb = XLSX.utils.book_new();

  // Store & Audit Metadata
  const storeNameKm = storeInfo?.nameKhmer || 'អាហ្រូម៉ា កាហ្វេ & ប៊េកឃឺរី';
  const storeNameEn = storeInfo?.name || 'Aroma Coffee & Bakery';
  const storeAddress = storeInfo?.address || '742 Artisan Ave, Phnom Penh, Cambodia';
  const taxId = storeInfo?.taxId || 'K002-9023412';
  const phone = storeInfo?.phone || '+855 23 888 777';
  const rate = Number(exchangeRate) || 4100;
  const operatorName = user ? `${user.name || user.username} (${user.role || 'Staff'})` : 'Store Manager';
  const now = new Date();
  const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dateISO = now.toISOString().slice(0, 10);

  // =========================================================================
  // SHEET 1: MENU PRODUCTS CATALOG (បញ្ជីមុខទំនិញស្តង់ដារកម្ពុជា)
  // =========================================================================
  if (mode === 'all' || mode === 'catalog') {
    const totalItems = products.length;
    let sumRetailUSD = 0;
    let sumCostUSD = 0;
    let sumStockUnits = 0;
    let sumStockValUSD = 0;

    const catalogRows = [
      [`🇰🇭 ${storeNameKm} • ${storeNameEn}`],
      ['របាយការណ៍បញ្ជីមុខទំនិញ និងតម្លៃស្តង់ដារកម្ពុជា • OFFICIAL CAMBODIA STANDARD MENU CATALOG'],
      [`អាសយដ្ឋាន / Address: ${storeAddress}   |   លេខសារពើពន្ធ / VATTIN: ${taxId}   |   ទូរស័ព្ទ / Tel: ${phone}`],
      [`អត្រាប្តូរប្រាក់ / NBC Rate: $1 = ${rate.toLocaleString()} KHR   |   កាលបរិច្ឆេទ / Date: ${dateFormatted}   |   អ្នករៀបចំ / Auditor: ${operatorName}`],
      [],
      [
        'ល.រ\nNo.',
        'កូដទំនិញ\nSKU Code',
        'ឈ្មោះទំនិញ (ភាសាខ្មែរ)\nProduct Name (Khmer)',
        'ឈ្មោះទំនិញ (អង់គ្លេស)\nProduct Name (English)',
        'ប្រភេទទំនិញ\nCategory',
        'តម្លៃលក់ ($)\nRetail Price ($)',
        'តម្លៃលក់ (រៀល)\nRetail (KHR)',
        'ថ្លៃដើមផលិត ($)\nRecipe BOM Cost ($)',
        'ថ្លៃដើមផលិត (រៀល)\nBOM Cost (KHR)',
        'ប្រាក់ចំណេញ ($)\nUnit Margin ($)',
        'ភាគរយចំណេញ\nMargin (%)',
        'ចំនួនក្នុងស្តុក\nIn-Stock Qty',
        'តម្លៃស្តុកសរុប ($)\nStock Asset Val ($)',
        'តម្លៃស្តុកសរុប (រៀល)\nStock Asset (KHR)',
        'ស្ថានភាពទំនិញ\nTerminal Status'
      ]
    ];

    products.forEach((p, index) => {
      const price = Number(p.price) || 0;
      const priceKHR = Math.round(price * rate);
      const cost = calculateProductCost(p, ingredients);
      const costKHR = Math.round(cost * rate);
      const margin = Math.round((price - cost) * 100) / 100;
      const marginPct = price > 0 ? `${Math.round(((price - cost) / price) * 100)}%` : '0%';
      const stock = Number(p.stock) || 0;
      const stockValUSD = Math.round(stock * price * 100) / 100;
      const stockValKHR = Math.round(stockValUSD * rate);

      sumRetailUSD += price;
      sumCostUSD += cost;
      sumStockUnits += stock;
      sumStockValUSD += stockValUSD;

      let statusText = 'មានស្តុកគ្រប់គ្រាន់ / In Stock';
      if (p.isAutoDisabled) {
        statusText = `បិទដំណើរការ / Disabled: ${p.disabledReason || 'Stock depleted'}`;
      } else if (stock <= 0) {
        statusText = 'អស់ពីស្តុក / Out of Stock';
      } else if (stock <= 5) {
        statusText = `ស្តុកទាប / Low Stock (${stock} left)`;
      }

      catalogRows.push([
        index + 1,
        p.sku || `SKU-${String(index + 1).padStart(3, '0')}`,
        p.nameKm || p.name || '-',
        p.name || '-',
        p.categoryKm ? `${p.categoryKm} (${p.category})` : p.category || 'General',
        price,
        priceKHR,
        cost,
        costKHR,
        margin,
        marginPct,
        stock,
        stockValUSD,
        stockValKHR,
        statusText
      ]);
    });

    // Grand Total Summary Row
    const avgPriceUSD = totalItems > 0 ? Math.round((sumRetailUSD / totalItems) * 100) / 100 : 0;
    const avgMarginPct = sumRetailUSD > 0 ? `${Math.round(((sumRetailUSD - sumCostUSD) / sumRetailUSD) * 100)}%` : '0%';
    const totalStockValKHR = Math.round(sumStockValUSD * rate);

    catalogRows.push([]);
    catalogRows.push([
      'សរុបរួម',
      'STORE TOTALS',
      `${totalItems} មុខទំនិញសរុប (Catalog Items)`,
      '-',
      '-',
      avgPriceUSD,
      Math.round(avgPriceUSD * rate),
      Math.round((sumCostUSD / (totalItems || 1)) * 100) / 100,
      Math.round((sumCostUSD / (totalItems || 1)) * rate),
      Math.round((avgPriceUSD - (sumCostUSD / (totalItems || 1))) * 100) / 100,
      avgMarginPct,
      sumStockUnits,
      sumStockValUSD,
      totalStockValKHR,
      'បានផ្ទៀងផ្ទាត់ / AUDITED'
    ]);

    const wsCatalog = XLSX.utils.aoa_to_sheet(catalogRows);
    formatCambodianWorksheet(
      wsCatalog,
      [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 14 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 14 } }
      ],
      [
        8,  // No.
        16, // SKU
        30, // Name Khmer
        26, // Name English
        20, // Category
        16, // Price USD
        18, // Price KHR
        18, // Cost USD
        18, // Cost KHR
        16, // Margin USD
        14, // Margin %
        15, // Stock
        18, // Stock Val USD
        20, // Stock Val KHR
        28  // Status
      ],
      [{ hpt: 26 }, { hpt: 20 }, { hpt: 16 }, { hpt: 16 }, { hpt: 10 }, { hpt: 28 }]
    );
    XLSX.utils.book_append_sheet(wb, wsCatalog, '1_Menu_Catalog_បញ្ជីទំនិញ');
  }

  // =========================================================================
  // SHEET 2: RAW INGREDIENTS & RECIPE STOCK (វត្ថុធាតុដើម និងគ្រឿងផ្សំ)
  // =========================================================================
  if (mode === 'all' || mode === 'inventory') {
    let sumIngStockValUSD = 0;
    let sumReorderCostUSD = 0;

    const inventoryRows = [
      [`🇰🇭 ${storeNameKm} • ${storeNameEn}`],
      ['របាយការណ៍វត្ថុធាតុដើម និងស្តុកគ្រឿងផ្សំស្តង់ដារ • RAW INGREDIENTS & DEPLETION AUDIT'],
      [`អាសយដ្ឋាន / Address: ${storeAddress}   |   អត្រាប្តូរប្រាក់ / NBC Rate: $1 = ${rate.toLocaleString()} KHR`],
      [`កាលបរិច្ឆេទ / Date: ${dateFormatted}   |   ចំនួនមុខទំនិញវត្ថុធាតុដើម / Ingredients: ${ingredients.length}   |   Audited By: ${operatorName}`],
      [],
      [
        'ល.រ\nNo.',
        'លេខកូដសម្គាល់\nMaterial ID',
        'ឈ្មោះវត្ថុធាតុដើម\nIngredient Name',
        'ខ្នាតរង្វាស់\nUnit',
        'ស្តុកបច្ចុប្បន្ន\nCurrent Stock',
        'កម្រិតសុវត្ថិភាព\nSafety Min',
        'ថ្លៃដើម/ខ្នាត ($)\nUnit Cost ($)',
        'ថ្លៃដើម/ខ្នាត (រៀល)\nUnit Cost (KHR)',
        'តម្លៃស្តុកសរុប ($)\nTotal Asset ($)',
        'តម្លៃស្តុកសរុប (រៀល)\nTotal Asset (KHR)',
        'ស្ថានភាពស្តុក\nDepletion Status',
        'បរិមាណត្រូវទិញ\nSuggested Reorder',
        'ថ្លៃដើមត្រូវទិញ ($)\nReorder Cost ($)',
        'ថ្លៃដើមត្រូវទិញ (រៀល)\nReorder Cost (KHR)'
      ]
    ];

    ingredients.forEach((ing, index) => {
      const stock = Number(ing.stock) || 0;
      const minThreshold = Number(ing.minThreshold) || 0;
      const costPerUnit = Number(ing.costPerUnit) || 0;
      const costPerUnitKHR = Math.round(costPerUnit * rate);
      const totalStockValUSD = Math.round(stock * costPerUnit * 100) / 100;
      const totalStockValKHR = Math.round(totalStockValUSD * rate);

      const isLow = stock <= minThreshold && stock > 0;
      const isDepleted = stock <= 0;
      let statusText = 'គ្រប់គ្រាន់ / Plentiful';
      let reorderQty = 0;

      if (isDepleted) {
        statusText = '⚠️ អស់ពីស្តុក / DEPLETED (Urgent)';
        reorderQty = minThreshold * 3;
      } else if (isLow) {
        statusText = '⚡ ស្តុកទាប / Low Stock Warning';
        reorderQty = Math.max(minThreshold * 2 - stock, minThreshold);
      }

      const reorderCostUSD = Math.round(reorderQty * costPerUnit * 100) / 100;
      const reorderCostKHR = Math.round(reorderCostUSD * rate);

      sumIngStockValUSD += totalStockValUSD;
      sumReorderCostUSD += reorderCostUSD;

      inventoryRows.push([
        index + 1,
        ing.id,
        ing.name,
        ing.unit,
        stock,
        minThreshold,
        costPerUnit,
        costPerUnitKHR,
        totalStockValUSD,
        totalStockValKHR,
        statusText,
        reorderQty > 0 ? `${reorderQty} ${ing.unit}` : '0',
        reorderCostUSD,
        reorderCostKHR
      ]);
    });

    // Summary Row
    inventoryRows.push([]);
    inventoryRows.push([
      'សរុបរួម',
      'INVENTORY TOTALS',
      `${ingredients.length} មុខវត្ថុធាតុដើម`,
      '-',
      '-',
      '-',
      '-',
      '-',
      Math.round(sumIngStockValUSD * 100) / 100,
      Math.round(sumIngStockValUSD * rate),
      'AUDITED',
      '-',
      Math.round(sumReorderCostUSD * 100) / 100,
      Math.round(sumReorderCostUSD * rate)
    ]);

    const wsInventory = XLSX.utils.aoa_to_sheet(inventoryRows);
    formatCambodianWorksheet(
      wsInventory,
      [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 13 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 13 } }
      ],
      [
        8,  // No.
        16, // Material ID
        32, // Name
        12, // Unit
        16, // Current Stock
        16, // Safety Min
        16, // Unit Cost USD
        18, // Unit Cost KHR
        18, // Total Asset USD
        20, // Total Asset KHR
        28, // Status
        18, // Reorder
        18, // Reorder Cost USD
        20  // Reorder Cost KHR
      ],
      [{ hpt: 26 }, { hpt: 20 }, { hpt: 16 }, { hpt: 16 }, { hpt: 10 }, { hpt: 28 }]
    );
    XLSX.utils.book_append_sheet(wb, wsInventory, '2_Raw_Inventory_វត្ថុធាតុដើម');
  }

  // =========================================================================
  // SHEET 3: STOCK MOVEMENTS & AUDIT LEDGER (ប្រវត្តិនាំចូល និងកែសម្រួលស្តុក)
  // =========================================================================
  if (mode === 'all' || mode === 'movements') {
    let totalStockInQty = 0;
    let totalStockOutQty = 0;
    let totalCostImpactUSD = 0;

    const movementRows = [
      [`🇰🇭 ${storeNameKm} • ${storeNameEn}`],
      ['សៀវភៅតាមដានចលនាស្តុក និងសវនកម្ម • STOCK MOVEMENTS & AUDIT LEDGER'],
      [`អាសយដ្ឋាន / Address: ${storeAddress}   |   អត្រាប្តូរប្រាក់ / NBC Rate: $1 = ${rate.toLocaleString()} KHR`],
      [`កាលបរិច្ឆេទ / Date: ${dateFormatted}   |   ប្រតិបត្តិការសរុប / Movements: ${stockMovements.length}   |   Auditor: ${operatorName}`],
      [],
      [
        'ល.រ\nNo.',
        'លេខកូដប្រតិបត្តិការ\nReference ID',
        'កាលបរិច្ឆេទ & ម៉ោង\nTimestamp',
        'ប្រភេទប្រតិបត្តិការ\nMovement Type',
        'ឈ្មោះទំនិញ (ខ្មែរ)\nProduct Name (Khmer)',
        'ឈ្មោះទំនិញ (អង់គ្លេស)\nProduct Name (English)',
        'កូដទំនិញ / SKU\nSKU / Code',
        'បរិមាណប្រែប្រួល\nQuantity Change',
        'ខ្នាត\nUOM',
        'ស្តុកនៅសល់\nNew Balance',
        'ថ្លៃដើមឯកតា ($)\nUnit Cost ($)',
        'ថ្លៃដើមឯកតា (រៀល)\nUnit Cost (KHR)',
        'តម្លៃសរុប ($)\nTotal Cost ($)',
        'តម្លៃសរុប (រៀល)\nTotal Cost (KHR)',
        'មូលហេតុ / អ្នកផ្គត់ផ្គង់ / កំណត់សម្គាល់\nReason / Supplier / Notes',
        'បុគ្គលិកទទួលបន្ទុក\nOperator / Staff'
      ]
    ];

    stockMovements.forEach((mov, idx) => {
      const qtyChange = Number(mov.quantity) || 0;
      const unitCost = Number(mov.unitCost) || 0;
      const totalCost = Number(mov.totalCost) || Math.round(Math.abs(qtyChange) * unitCost * 100) / 100;
      const unitCostKHR = Math.round(unitCost * rate);
      const totalCostKHR = Math.round(totalCost * rate);

      if (qtyChange > 0) totalStockInQty += qtyChange;
      else totalStockOutQty += Math.abs(qtyChange);
      totalCostImpactUSD += totalCost;

      let typeBadge = mov.type || 'ADJUSTMENT';
      if (mov.type === 'STOCK_IN') typeBadge = '📥 នាំចូលស្តុក / Stock In';
      else if (mov.type === 'SPOILAGE') typeBadge = '🗑️ ខូចគុណភាព-ចាក់ចោល / Spoilage';
      else if (mov.type === 'SALE') typeBadge = '☕ បម្រើការលក់ / Sale Depletion';
      else if (mov.type === 'ADJUST_CORRECTION') typeBadge = '⚖️ កែសម្រួលចំនួន / Count Correction';
      else if (mov.type === 'RETURN') typeBadge = '↩️ ទំនិញត្រឡប់ / Return';
      else typeBadge = `⚙️ ${mov.type}`;

      const formattedTime = mov.timestamp
        ? new Date(mov.timestamp).toLocaleString('en-GB')
        : dateFormatted;

      movementRows.push([
        idx + 1,
        mov.id || `MOV-${String(idx + 1).padStart(4, '0')}`,
        formattedTime,
        typeBadge,
        mov.productNameKm || mov.productName || '-',
        mov.productName || '-',
        mov.sku || '-',
        qtyChange > 0 ? `+${qtyChange}` : qtyChange,
        mov.unit || 'កែវ (cups)',
        mov.newStock !== undefined ? mov.newStock : '-',
        unitCost,
        unitCostKHR,
        totalCost,
        totalCostKHR,
        mov.reason || mov.supplier || mov.notes || 'ស្តង់ដារប្រចាំថ្ងៃ',
        mov.operator || operatorName
      ]);
    });

    // Summary Row
    movementRows.push([]);
    movementRows.push([
      'សរុបរួម',
      'MOVEMENTS AUDIT',
      `${stockMovements.length} ប្រតិបត្តិការចលនាស្តុក`,
      '-',
      '-',
      '-',
      '-',
      `+${totalStockInQty} ចូល / -${totalStockOutQty} ចេញ`,
      'Units',
      '-',
      '-',
      '-',
      Math.round(totalCostImpactUSD * 100) / 100,
      Math.round(totalCostImpactUSD * rate),
      'បានផ្ទៀងផ្ទាត់សវនកម្ម / AUDITED',
      operatorName
    ]);

    const wsMovements = XLSX.utils.aoa_to_sheet(movementRows);
    formatCambodianWorksheet(
      wsMovements,
      [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 15 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 15 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 15 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 15 } }
      ],
      [
        8,  // No.
        16, // Ref ID
        20, // Timestamp
        24, // Type
        24, // Name Khmer
        22, // Name English
        16, // SKU
        16, // Qty Change
        12, // UOM
        14, // New Balance
        16, // Unit Cost USD
        18, // Unit Cost KHR
        18, // Total Cost USD
        20, // Total Cost KHR
        32, // Reason/Notes
        20  // Operator
      ],
      [{ hpt: 26 }, { hpt: 20 }, { hpt: 16 }, { hpt: 16 }, { hpt: 10 }, { hpt: 28 }]
    );
    const movementSheetName = mode === 'movements' ? 'Stock_Movements_ចលនាស្តុក' : '3_Stock_Movements_ចលនាស្តុក';
    XLSX.utils.book_append_sheet(wb, wsMovements, movementSheetName);
  }

  // =========================================================================
  // SHEET 4: OFFICIAL CAMBODIA ADMINISTRATIVE STANDARD (ស្តង់ដាររាជធានី-ខេត្តកម្ពុជា)
  // =========================================================================
  if (mode === 'all' || mode === 'provinces' || mode === 'standards') {
    const adminRows = [
      ['🇰🇭 ព្រះរាជាណាចក្រកម្ពុជា • KINGDOM OF CAMBODIA'],
      ['តារាងស្តង់ដាររាជធានី-ខេត្ត និងកូដប្រៃសណីយ៍ផ្លូវការ • OFFICIAL CAMBODIA ADMINISTRATIVE & POSTAL CODES STANDARD'],
      ['ឯកសារយោង: ក្រសួងមហាផ្ទៃ និងវិទ្យាស្ថានជាតិស្ថិតិ (NIS) | National Bank of Cambodia (NBC) Commercial Guidelines'],
      [],
      [
        'ល.រ\nNo.',
        'កូដខេត្ត\nISO Code',
        'រាជធានី-ខេត្ត (ភាសាខ្មែរ)\nProvince Name (Khmer)',
        'រាជធានី-ខេត្ត (អង់គ្លេស)\nProvince Name (English)',
        'ប្រភេទរដ្ឋបាល\nAdmin Type',
        'ទីរួមខេត្ត / រាជធានី\nProvincial Capital / City',
        'លេខកូដប្រៃសណីយ៍\nPostal Code',
        'ចំនួនក្រុង-ស្រុក-ខណ្ឌ\nDistricts Count'
      ]
    ];

    CAMBODIA_PROVINCES_STANDARD.forEach((p, idx) => {
      adminRows.push([
        idx + 1,
        p.code,
        p.nameKm,
        p.nameEn,
        `${p.typeKm} / ${p.typeEn}`,
        p.capitalTown,
        p.postalCode,
        p.districtsCount
      ]);
    });

    adminRows.push([]);
    adminRows.push([
      'បទប្បញ្ញត្តិពាណិជ្ជកម្មកម្ពុជា / CAMBODIA COMMERCIAL & RETAIL COMPLIANCE NOTES',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);
    adminRows.push([
      '១. រូបិយវត្ថុ & អត្រាប្តូរប្រាក់ (NBC Standard):',
      'ការបង្ហាញតម្លៃត្រូវតែមានទាំងប្រាក់ដុល្លារ ($ USD) និងប្រាក់រៀល (៛ KHR)។ អត្រាប្តូរប្រាក់ស្ដង់ដារទីផ្សារ & ធនាគារជាតិ: 1 USD = 4,100 KHR។'
    ]);
    adminRows.push([
      '២. ការទូទាត់ឌីជីថល (KHQR Bakong):',
      'ស្តង់ដារកូដ KHQR ជាតិអនុលោមតាម EMVCo ISO 20022 ដែលអាចស្កេនទូទាត់ឆ្លងធនាគារទាំងអស់នៅកម្ពុជា។'
    ]);
    adminRows.push([
      '៣. ពន្ធលើតម្លៃបន្ថែម (GDT VAT Rate):',
      'អាករលើតម្លៃបន្ថែម (VAT) ស្តង់ដារទូទៅនៅកម្ពុជាគឺ ១០% (10%) លើទំនិញ និងសេវាទូទៅក្នុងស្រុក។'
    ]);
    adminRows.push([
      '៤. ក្បួនបង្គត់ប្រាក់រៀល (Cash Rounding):',
      'ការទូទាត់ជាសាច់ប្រាក់សុទ្ធជារៀលត្រូវបង្គត់ទៅជិតបំផុតត្រឹម ១០០ រៀល (100 KHR) ដើម្បីងាយស្រួលអាប់សាច់ប្រាក់។'
    ]);

    const wsAdmin = XLSX.utils.aoa_to_sheet(adminRows);
    formatCambodianWorksheet(
      wsAdmin,
      [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
        { s: { r: 30, c: 0 }, e: { r: 30, c: 7 } },
        { s: { r: 31, c: 1 }, e: { r: 31, c: 7 } },
        { s: { r: 32, c: 1 }, e: { r: 32, c: 7 } },
        { s: { r: 33, c: 1 }, e: { r: 33, c: 7 } },
        { s: { r: 34, c: 1 }, e: { r: 34, c: 7 } }
      ],
      [
        8,  // No.
        14, // ISO Code
        26, // Name Khmer
        24, // Name English
        18, // Type
        22, // Capital
        16, // Postal Code
        18  // Districts Count
      ],
      [{ hpt: 26 }, { hpt: 20 }, { hpt: 16 }, { hpt: 10 }, { hpt: 28 }]
    );
    const adminSheetName = (mode === 'all') ? '4_Cambodia_Standard_ស្តង់ដារ' : 'Cambodia_25_Provinces_ស្តង់ដារ';
    XLSX.utils.book_append_sheet(wb, wsAdmin, adminSheetName);
  }

  // Trigger Excel File Download
  const filename = customFileName || (
    mode === 'catalog'
      ? `AromaPOS_Cambodia_Catalog_${dateISO}.xlsx`
      : mode === 'inventory'
      ? `AromaPOS_Cambodia_Inventory_${dateISO}.xlsx`
      : mode === 'movements'
      ? `AromaPOS_Stock_Movements_${dateISO}.xlsx`
      : mode === 'provinces' || mode === 'standards'
      ? `AromaPOS_Cambodia_25_Provinces_${dateISO}.xlsx`
      : `AromaPOS_Cambodia_Standard_Master_${dateISO}.xlsx`
  );

  XLSX.writeFile(wb, filename);
  return { success: true, filename };
};
