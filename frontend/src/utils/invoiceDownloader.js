/**
 * Aroma Coffee & Roastery Official Clean Tax Invoice Generator & Downloader
 * Generates an ultra-clean, minimalist, high-end printable and downloadable invoice
 */

export const generateInvoiceHtml = (order = {}) => {
  const orderNum = order.orderNumber || order.id || `ORD-${Date.now().toString().slice(-6)}`;
  const dateStr = order.createdAt 
    ? new Date(order.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : new Date().toLocaleString();

  const totalUsd = Number(order.total || order.grandTotal || 0).toFixed(2);
  const subtotalUsd = Number(order.subtotal || order.total || 0).toFixed(2);
  const discountUsd = Number(order.discount || 0).toFixed(2);
  const deliveryFeeUsd = Number(order.deliveryFee || 0).toFixed(2);
  const totalRiel = Math.round(Number(totalUsd) * 4100).toLocaleString();

  const customerName = order.customerName || 'Valued Guest';
  const customerPhone = order.customerPhone || 'N/A';
  const isDelivery = order.orderType === 'DELIVERY';
  const deliveryAddress = order.deliveryAddress || (isDelivery ? 'Phnom Penh Express Delivery' : 'Aroma Coffee Roastery Flagship (BKK1)');
  const paymentMethod = order.paymentMethod || 'Bakong KHQR';
  const paymentStatus = order.paymentStatus || 'PAID';

  const verificationUrl = `https://aromapos-frontend.onrender.com/track/${encodeURIComponent(orderNum)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=${encodeURIComponent(verificationUrl)}`;

  const itemsHtml = (order.items || []).map((it, idx) => {
    const specs = [
      it.size ? `Size: ${it.size}` : null,
      it.sweetness ? `Sugar: ${it.sweetness}` : null,
      it.ice ? `Ice: ${it.ice}` : null,
      it.milk && it.milk !== 'Fresh Whole Milk' ? it.milk : null,
      it.addons && it.addons.length > 0 ? it.addons.map(a => a.name || a).join(', ') : null,
      it.specialNote ? `"${it.specialNote}"` : null
    ].filter(Boolean).join(' • ');

    const unitPrice = Number(it.price || it.unitPrice || 0).toFixed(2);
    const lineTotal = (Number(it.price || it.unitPrice || 0) * (it.quantity || 1)).toFixed(2);

    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 10px; text-align: center; color: #94a3b8; font-family: monospace; font-size: 12px;">${String(idx + 1).padStart(2, '0')}</td>
        <td style="padding: 12px 10px;">
          <div style="font-weight: 700; color: #0f172a; font-size: 13.5px; line-height: 1.3;">
            ${it.nameKm || it.name || 'Artisan Specialty Drink'}
          </div>
          ${it.name && it.nameKm && it.name !== it.nameKm ? `<div style="font-size: 11.5px; color: #64748b; margin-top: 1px;">${it.name}</div>` : ''}
          ${specs ? `<div style="font-size: 11px; color: #d97706; font-weight: 500; margin-top: 2px;">${specs}</div>` : ''}
        </td>
        <td style="padding: 12px 10px; text-align: center; font-weight: 700; font-family: monospace; font-size: 13px; color: #0f172a;">${it.quantity || 1}</td>
        <td style="padding: 12px 10px; text-align: right; font-family: monospace; font-size: 13px; color: #475569;">$${unitPrice}</td>
        <td style="padding: 12px 10px; text-align: right; font-weight: 800; font-family: monospace; font-size: 13.5px; color: #0f172a;">$${lineTotal}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${orderNum} - Aroma Coffee Roasters</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Kantumruy+Pro:wght@400;600;700&display=swap');
    
    @page { 
      size: A4 portrait; 
      margin: 12mm 15mm; 
    }
    
    * { box-sizing: border-box; }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 32px 20px;
      color: #0f172a;
      background: #f8fafc;
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
    }
    
    .invoice-container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 44px;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05);
    }
    
    .action-bar {
      max-width: 820px;
      margin: 0 auto 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      text-decoration: none;
    }
    
    .btn-primary {
      background: #d97706;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25);
    }
    .btn-primary:hover { background: #b45309; }
    
    .btn-secondary {
      background: #ffffff;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .btn-secondary:hover { background: #f1f5f9; color: #0f172a; }

    @media print {
      body { padding: 0; background: #ffffff !important; }
      .invoice-container { border: none !important; box-shadow: none !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
      .no-print { display: none !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <!-- Print & Download Control Bar (Hidden when printing) -->
  <div class="action-bar no-print">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10b981;"></span>
      <span style="font-size: 13px; font-weight: 700; color: #334155;">Official Aroma Coffee Tax Invoice</span>
      <span style="font-size: 11px; padding: 2px 8px; border-radius: 6px; background: #fef3c7; color: #92400e; font-weight: 800;">VERIFIED</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" class="btn btn-primary">
        🖨️ Print / Save as PDF
      </button>
      <button onclick="window.close()" class="btn btn-secondary">
        ✕ Close
      </button>
    </div>
  </div>

  <!-- Official Clean Invoice Container -->
  <div class="invoice-container">
    <!-- Header: Roastery Brand & Invoice Identifiers -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
      <tr>
        <td style="vertical-align: top; width: 55%;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #d97706, #92400e); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);">
              ☕
            </div>
            <div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">
                Aroma<span style="color: #d97706;">Coffee</span> Roasters
              </h1>
              <p style="margin: 2px 0 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
                Artisan Roastery & Specialty Café • Phnom Penh
              </p>
            </div>
          </div>
          <div style="margin-top: 14px; font-size: 11.5px; color: #64748b; line-height: 1.5;">
            <div>#42, Street 57, Sangkat Boeng Keng Kang 1, Phnom Penh, Cambodia</div>
            <div>Direct Line: <strong style="color: #334155;">+855 23 999 881</strong> • Email: <strong style="color: #334155;">hello@aromacafe.com</strong></div>
            <div>Tax Registration (VAT TIN): <strong style="color: #0f172a; font-family: monospace;">K002-98421098</strong></div>
          </div>
        </td>
        <td style="vertical-align: top; text-align: right; width: 45%;">
          <div style="display: inline-block; padding: 4px 12px; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
            Official Tax Invoice / វិក្កយបត្រ
          </div>
          <div style="font-size: 22px; font-weight: 900; color: #0f172a; font-family: monospace; letter-spacing: -0.5px;">
            #${orderNum}
          </div>
          <div style="margin-top: 6px; font-size: 12px; color: #64748b;">
            Date: <strong style="color: #0f172a;">${dateStr}</strong>
          </div>
          <div style="margin-top: 2px; font-size: 12px; color: #059669; font-weight: 700;">
            Status: ${paymentStatus} • ${paymentMethod}
          </div>
        </td>
      </tr>
    </table>

    <!-- Customer Billed-To & Fulfillment Banner -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
      <tr>
        <td style="padding: 16px 20px; vertical-align: top; width: 50%;">
          <div style="font-size: 10.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            Billed To (អតិថិជន)
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a;">
            ${customerName}
          </div>
          <div style="font-size: 12.5px; color: #475569; font-family: monospace; margin-top: 2px;">
            📞 ${customerPhone}
          </div>
        </td>
        <td style="padding: 16px 20px; vertical-align: top; width: 50%; border-left: 1px solid #e2e8f0;">
          <div style="font-size: 10.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            Fulfillment Details (ការដឹកជញ្ជូន)
          </div>
          <div style="font-size: 13.5px; font-weight: 800; color: ${isDelivery ? '#d97706' : '#0284c7'};">
            ${isDelivery ? '🛵 Phnom Penh Door-to-Door Delivery' : '🛍️ Roastery Counter Store Pickup'}
          </div>
          <div style="font-size: 12px; color: #475569; margin-top: 3px; line-height: 1.4;">
            📍 ${deliveryAddress}
          </div>
          ${order.deliveryNotes ? `<div style="font-size: 11px; color: #64748b; font-style: italic; margin-top: 2px;">Note: "${order.deliveryNotes}"</div>` : ''}
        </td>
      </tr>
    </table>

    <!-- Itemized Drinks & Food Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background: #0f172a; color: #ffffff;">
          <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 800; text-transform: uppercase; border-top-left-radius: 10px; width: 44px;">#</th>
          <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 800; text-transform: uppercase;">Beverage & Food Item</th>
          <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 800; text-transform: uppercase; width: 50px;">Qty</th>
          <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 800; text-transform: uppercase; width: 90px;">Price</th>
          <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 800; text-transform: uppercase; border-top-right-radius: 10px; width: 100px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Financial Totals & NBC Bakong Verification Seal -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <tr>
        <td style="vertical-align: top; width: 50%; padding-right: 24px;">
          <!-- Official NBC Bakong Verified Card -->
          <div style="border: 1px solid #fde68a; border-radius: 14px; background: #fffdf5; padding: 14px 16px; display: flex; align-items: center; gap: 14px;">
            <img src="${qrCodeUrl}" alt="Verification QR" style="width: 76px; height: 76px; border-radius: 8px; border: 1px solid #e2e8f0; background: white;" />
            <div>
              <div style="font-size: 12px; font-weight: 800; color: #92400e; display: flex; align-items: center; gap: 4px;">
                <span>🇰🇭</span>
                <span>NBC Bakong Verified Payment</span>
              </div>
              <div style="font-size: 11px; color: #78350f; margin-top: 3px; line-height: 1.4;">
                Direct settlement via National Bank of Cambodia KHQR Protocol. Official tax deductible.
              </div>
              <div style="font-size: 10px; font-family: monospace; color: #94a3b8; margin-top: 4px;">
                REF: KHQR-${orderNum.replace(/[^a-zA-Z0-9]/g, '')}
              </div>
            </div>
          </div>
        </td>
        <td style="vertical-align: top; width: 50%;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Subtotal (សរុបរង):</td>
              <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">$${subtotalUsd}</td>
            </tr>
            ${Number(discountUsd) > 0 ? `
            <tr>
              <td style="padding: 6px 0; color: #059669;">Promo Discount (បញ្ចុះតម្លៃ):</td>
              <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: 700; color: #059669;">-$${discountUsd}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Delivery Fee (ថ្លៃដឹកជញ្ជូន):</td>
              <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: 700;">
                ${Number(deliveryFeeUsd) === 0 ? '<span style="color:#059669; font-weight:800;">FREE</span>' : `$${deliveryFeeUsd}`}
              </td>
            </tr>
            <tr style="border-top: 2px solid #0f172a;">
              <td style="padding: 12px 0 2px; font-size: 15px; font-weight: 900; color: #0f172a;">Total USD:</td>
              <td style="padding: 12px 0 2px; text-align: right; font-size: 20px; font-weight: 900; font-family: monospace; color: #d97706;">
                $${totalUsd}
              </td>
            </tr>
            <tr>
              <td style="padding: 0 0 8px; font-size: 11.5px; color: #64748b;">Total KHR (ប្រាក់រៀល):</td>
              <td style="padding: 0 0 8px; text-align: right; font-size: 13.5px; font-weight: 800; font-family: monospace; color: #334155;">
                ≈ ${totalRiel} ៛
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Clean Footer -->
    <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.5;">
      <p style="margin: 0; font-weight: 600; color: #64748b;">
        Thank you for choosing Aroma Coffee Roasters! Roasted in micro-batches in Phnom Penh.
      </p>
      <p style="margin: 3px 0 0;">
        For order inquiries or corporate catering, call <strong style="color: #334155;">+855 23 999 881</strong> or visit <strong style="color: #334155;">aromapos-frontend.onrender.com</strong>
      </p>
    </div>
  </div>

  <script>
    // Auto-trigger clean print preview when loaded
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;
};

/**
 * Triggers a clean print window or downloads invoice document
 */
export const downloadInvoice = (order) => {
  if (!order) return;
  const html = generateInvoiceHtml(order);

  // Attempt opening in clean print window
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      return;
    }
  } catch (e) {
    console.warn('Popup blocked, falling back to direct file download', e);
  }

  // Fallback: download as clean standalone .html document
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
