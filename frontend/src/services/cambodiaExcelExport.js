import * as XLSX from 'xlsx';

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
        p.categoryKm && p.categoryKm !== p.category ? `${p.categoryKm} (${p.category})` : (p.categoryKm || p.category || 'General'),
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

  // Trigger Excel File Download
  const filename = customFileName || (
    mode === 'catalog'
      ? `AromaPOS_Catalog_${dateISO}.xlsx`
      : mode === 'inventory'
      ? `AromaPOS_Inventory_${dateISO}.xlsx`
      : mode === 'movements'
      ? `AromaPOS_Stock_Movements_${dateISO}.xlsx`
      : `AromaPOS_Master_Workbook_${dateISO}.xlsx`
  );

  XLSX.writeFile(wb, filename);
  return { success: true, filename };
};
