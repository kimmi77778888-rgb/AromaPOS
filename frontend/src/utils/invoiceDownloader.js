/**
 * Aroma Coffee & Roastery Official POS Thermal Receipt Invoice Downloader
 * Renders the EXACT same thermal slip invoice design as in the POS (ReceiptModal.jsx)
 */

export const generateInvoiceHtml = (order = {}) => {
  const orderNum = order.orderNumber || order.id || `ORD-${Date.now().toString().slice(-6)}`;
  const dateStr = order.createdAt 
    ? new Date(order.createdAt).toLocaleString('km-KH', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : new Date().toLocaleString('km-KH', { dateStyle: 'medium', timeStyle: 'short' });

  const totalNum = Number(order.total || order.grandTotal || 0);
  const totalUsd = totalNum.toFixed(2);
  const subtotalUsd = Number(order.subtotal || order.total || totalNum).toFixed(2);
  const discountNum = Number(order.discount || 0);
  const discountUsd = discountNum.toFixed(2);
  const deliveryFeeNum = Number(order.deliveryFee || 0);
  const deliveryFeeUsd = deliveryFeeNum.toFixed(2);
  const taxUsd = Number(order.tax || (totalNum * 0.08 / 1.08)).toFixed(2);
  const totalRiel = Math.round(totalNum * 4100).toLocaleString();

  const customerName = order.customerName || 'ភ្ញៀវទូទៅ (Walk-in)';
  const customerPhone = order.customerPhone || '';
  const isDelivery = order.orderType === 'DELIVERY';
  const deliveryAddress = order.deliveryAddress || (isDelivery ? 'ភ្នំពេញ (Phnom Penh Delivery)' : '');
  const cashierName = order.cashierName || 'Liam Vance';
  
  const paymentMethod = order.paymentMethod === 'KHQR' || order.paymentMethod === 'QR_CODE'
    ? 'Bakong KHQR'
    : (order.paymentMethod === 'CASH' ? 'សាច់ប្រាក់ (CASH)' : (order.paymentMethod === 'CARD' ? 'កាតធនាគារ (CARD)' : (order.paymentMethod || 'Bakong KHQR')));

  const orderTypeDisplay = isDelivery
    ? '🛵 ដឹកជញ្ជូន (DELIVERY)'
    : (order.orderType === 'DINE_IN' ? '🍽️ ញ៉ាំនៅហាង (DINE IN)' : '🥡 ខ្ចប់ទៅក្រៅ (TAKEAWAY)');

  const items = order.items || [];
  const itemsHtml = items.map((it) => {
    const itemDisplayName = it.productNameKm || it.nameKm || it.productName || it.name || 'ភេសជ្ជៈកាហ្វេ (Coffee)';
    const qty = it.quantity || 1;
    const unitPrice = Number(it.unitPrice || it.price || 0).toFixed(2);
    const lineTotal = (Number(it.unitPrice || it.price || 0) * qty).toFixed(2);

    // Modifiers list
    const modifiersList = [];
    if (it.modifiers && typeof it.modifiers === 'object') {
      Object.values(it.modifiers).forEach((v) => { if (v) modifiersList.push(v); });
    } else {
      if (it.size) modifiersList.push(it.size);
      if (it.sweetness) modifiersList.push(`${it.sweetness} Sugar`);
      if (it.ice) modifiersList.push(`${it.ice} Ice`);
      if (it.milk && it.milk !== 'Fresh Whole Milk') modifiersList.push(it.milk);
      if (it.addons && it.addons.length > 0) {
        it.addons.forEach((a) => modifiersList.push(typeof a === 'string' ? a : (a.name || 'Addon')));
      }
    }
    const modifiersStr = modifiersList.join(' • ');
    const noteStr = it.notes || it.specialNote || '';

    return `
      <div style="margin-bottom: 7px; line-height: 1.35;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 11px;">
          <span style="font-weight: 700; color: #1c1917; max-width: 175px; word-break: break-word;">${itemDisplayName}</span>
          <span style="color: #57534e; font-size: 10.5px; padding: 0 4px;">${qty} @ $${unitPrice}</span>
          <span style="font-weight: 700; color: #1c1917; font-size: 11.5px;">$${lineTotal}</span>
        </div>
        ${modifiersStr ? `<div style="font-size: 10px; color: #78716c; padding-left: 8px; margin-top: 1px;">↳ ${modifiersStr}</div>` : ''}
        ${noteStr ? `<div style="font-size: 9.5px; color: #b45309; font-style: italic; padding-left: 8px; margin-top: 1px;">↳ ចំណាំ: ${noteStr}</div>` : ''}
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>វិក្កយបត្រ #${orderNum} - Aroma Roasters</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700&family=JetBrains+Mono:wght@400;600;800&display=swap');

    @page {
      size: 80mm auto;
      margin: 3mm 4mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: #292524;
      color: #1c1917;
      font-family: 'JetBrains Mono', 'Kantumruy Pro', Courier, monospace;
      padding: 24px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    /* Print / Action Buttons Bar */
    .action-bar {
      width: 100%;
      max-width: 360px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .btn {
      flex: 1;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease;
      font-family: 'Kantumruy Pro', sans-serif;
    }

    .btn-print {
      background: #f59e0b;
      color: #1c1917;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
    }
    .btn-print:hover { background: #d97706; }

    .btn-close {
      background: #44403c;
      color: #e7e5e4;
      border: 1px solid #57534e;
    }
    .btn-close:hover { background: #57534e; color: #ffffff; }

    /* Thermal Receipt Card (Exact Match to POS ReceiptModal) */
    .receipt-paper {
      width: 100%;
      max-width: 360px;
      background: #fafaf9;
      color: #1c1917;
      border: 1px solid #d6d3d1;
      border-radius: 16px;
      padding: 22px 18px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
      position: relative;
    }

    .divider-dashed {
      border-bottom: 1px dashed #a8a29e;
      margin: 10px 0;
    }

    .divider-double {
      border-bottom: 2px dashed #78716c;
      margin: 10px 0;
    }

    .barcode-strip {
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5px;
      opacity: 0.85;
      margin: 6px 0 3px;
    }

    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .action-bar {
        display: none !important;
      }
      .receipt-paper {
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 4px 2px !important;
        max-width: 100% !important;
        width: 100% !important;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <!-- Print & Close Bar -->
  <div class="action-bar">
    <button onclick="window.print()" class="btn btn-print">
      🖨️ បោះពុម្ពវិក្កយបត្រ (Print)
    </button>
    <button onclick="window.close()" class="btn btn-close">
      ✕ បិទ (Close)
    </button>
  </div>

  <!-- EXACT POS THERMAL RECEIPT SLIP -->
  <div class="receipt-paper">
    <!-- Store Logo & Header -->
    <div style="text-align: center; padding-bottom: 8px;">
      <div style="display: flex; justify-content: center; margin-bottom: 6px;">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 38px; height: 38px;">
          <circle cx="50" cy="50" r="46" stroke="#000000" stroke-width="3.5" fill="none" />
          <path d="M42 28C39 22 45 18 42 14" stroke="#000000" stroke-width="2.5" stroke-linecap="round" />
          <path d="M50 26C47 20 53 16 50 12" stroke="#000000" stroke-width="3" stroke-linecap="round" />
          <path d="M58 28C55 22 61 18 58 14" stroke="#000000" stroke-width="2.5" stroke-linecap="round" />
          <path d="M28 38H72V58C72 70 62 76 50 76C38 76 28 70 28 58V38Z" fill="#000000" />
          <rect x="25" y="35" width="50" height="5" rx="2.5" fill="#000000" />
          <path d="M70 42C79 42 83 48 83 54C83 60 78 64 70 64" stroke="#000000" stroke-width="4" stroke-linecap="round" />
          <path d="M22 82C34 86 66 86 78 82" stroke="#000000" stroke-width="3.5" stroke-linecap="round" />
        </svg>
      </div>
      <h2 style="font-size: 15px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #0c0a09;">AROMA ROASTERS</h2>
      <p style="font-size: 10px; color: #57534e; margin-top: 2px;">742 Artisan Ave, Bean District, BKK1, Phnom Penh</p>
      <p style="font-size: 10px; color: #57534e;">Tel: +855 23 888 777 • VAT: K002-98421098</p>
    </div>

    <div class="divider-dashed"></div>

    <!-- Order Info -->
    <div style="font-size: 11px; color: #57534e; line-height: 1.45;">
      <div style="display: flex; justify-content: space-between; color: #1c1917; font-weight: 700;">
        <span>វិក្កយបត្រ #:</span>
        <span style="font-family: monospace; font-size: 12px; color: #0c0a09;">${orderNum}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>កាលបរិច្ឆេទ/ម៉ោង:</span>
        <span>${dateStr}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>អ្នកឆុង/បេឡា:</span>
        <span>${cashierName}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>អតិថិជន:</span>
        <span style="font-weight: 700; color: #1c1917;">${customerName}</span>
      </div>
      ${customerPhone ? `
      <div style="display: flex; justify-content: space-between;">
        <span>លេខទូរស័ព្ទ:</span>
        <span style="font-family: monospace;">${customerPhone}</span>
      </div>` : ''}
      <div style="display: flex; justify-content: space-between;">
        <span>ប្រភេទ:</span>
        <span style="font-weight: 700; color: #1c1917;">${orderTypeDisplay}</span>
      </div>
      ${isDelivery && deliveryAddress ? `
      <div style="display: flex; justify-content: space-between; margin-top: 1px;">
        <span>អាសយដ្ឋាន:</span>
        <span style="max-width: 190px; text-align: right; word-break: break-word; color: #1c1917;">${deliveryAddress}</span>
      </div>` : ''}
    </div>

    <div class="divider-dashed"></div>

    <!-- Items Header -->
    <div style="display: flex; justify-content: space-between; font-size: 9.5px; font-weight: 800; color: #57534e; text-transform: uppercase; margin-bottom: 6px;">
      <span>ទំនិញ & បន្ថែម</span>
      <span>ចំនួន x តម្លៃ</span>
      <span>សរុប</span>
    </div>

    <!-- Items List -->
    <div style="margin-bottom: 4px;">
      ${itemsHtml}
    </div>

    <div class="divider-dashed"></div>

    <!-- Totals Breakdown -->
    <div style="font-size: 11px; color: #57534e; line-height: 1.5;">
      <div style="display: flex; justify-content: space-between;">
        <span>សរុបរង (Subtotal):</span>
        <span>$${subtotalUsd}</span>
      </div>
      ${discountNum > 0 ? `
      <div style="display: flex; justify-content: space-between; color: #be123c; font-weight: 700;">
        <span>បានបញ្ចុះតម្លៃ (Discount):</span>
        <span>-$${discountUsd}</span>
      </div>` : ''}
      ${isDelivery && deliveryFeeNum > 0 ? `
      <div style="display: flex; justify-content: space-between;">
        <span>ថ្លៃដឹកជញ្ជូន (Delivery Fee):</span>
        <span>+$${deliveryFeeUsd}</span>
      </div>` : ''}
      <div style="display: flex; justify-content: space-between;">
        <span>ពន្ធអាករ / Sales Tax (8%):</span>
        <span>$${taxUsd}</span>
      </div>
      <div class="divider-double"></div>
      <div style="display: flex; justify-content: space-between; align-items: baseline; padding-top: 2px;">
        <div>
          <span style="font-size: 11px; font-weight: 800; color: #1c1917; text-transform: uppercase;">សរុបត្រូវទូទាត់:</span>
          <span style="display: block; font-size: 11.5px; font-weight: 700; color: #b45309;">${totalRiel} ៛</span>
        </div>
        <span style="font-size: 17px; font-weight: 900; color: #0c0a09; font-family: monospace;">$${totalUsd}</span>
      </div>
    </div>

    <div class="divider-dashed"></div>

    <!-- Payment Details -->
    <div style="font-size: 10.5px; color: #57534e; line-height: 1.45;">
      <div style="display: flex; justify-content: space-between;">
        <span>វិធីសាស្ត្រទូទាត់:</span>
        <span style="font-weight: 700; color: #1c1917; text-transform: uppercase;">${paymentMethod}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>ប្រាក់ទទួលបាន:</span>
        <span>$${totalUsd}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: 700; color: #1c1917;">
        <span>ប្រាក់អាប់:</span>
        <span>$0.00</span>
      </div>
    </div>

    <div class="divider-dashed"></div>

    <!-- Barcode & Wi-Fi -->
    <div style="text-align: center; padding-top: 2px;">
      <div class="barcode-strip">
        ${[4, 2, 6, 1, 3, 5, 2, 7, 2, 4, 1, 3, 6, 2, 5, 1, 4, 3, 2, 5, 2, 4, 2, 6, 1, 3].map((w) => `
          <span style="height: 100%; width: ${w}px; background: #1c1917; display: inline-block;"></span>
        `).join('')}
      </div>
      <p style="font-size: 10px; color: #57534e; font-family: monospace; letter-spacing: 2px; margin-top: 2px;">
        ${orderNum}
      </p>
      <p style="font-size: 9.5px; color: #57534e; font-family: monospace; padding-top: 6px; margin-top: 6px; border-top: 1px dashed #d6d3d1;">
        📶 Wi-Fi: <strong style="color: #1c1917;">Aroma-Guest-5G</strong> | Pass: <strong style="color: #1c1917;">aroma2026</strong>
      </p>
      <p style="font-size: 10px; color: #78716c; font-style: italic; margin-top: 6px; line-height: 1.35;">
        កាហ្វេកិន និងឆុងស្រស់ៗដោយក្តីស្រលាញ់។ សូមពិសាដោយរីករាយ!<br>
        Freshly ground & roasted with passion. Enjoy your coffee!
      </p>
    </div>
  </div>

  <script>
    // Auto-trigger print dialog after small render delay
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.print();
        } catch (e) {}
      }, 400);
    });
  </script>
</body>
</html>`;
};

/**
 * Downloads or prints the official thermal invoice for an order
 */
export const downloadInvoice = (order) => {
  if (!order) return;
  const html = generateInvoiceHtml(order);

  // 1. Try opening a clean printable window popup
  const printWindow = window.open('', '_blank', 'width=460,height=750,resizable=yes,scrollbars=yes');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    return;
  }

  // 2. Fallback: Direct HTML file download
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice-${order.orderNumber || order.id || 'Aroma'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
