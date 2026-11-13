/**
 * Aroma Coffee & Roastery Official Invoice Generator & Downloader
 */

export const generateInvoiceHtml = (order) => {
  const dateStr = order.createdAt 
    ? new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString();

  const totalUsd = Number(order.total || 0).toFixed(2);
  const subtotalUsd = Number(order.subtotal || order.total || 0).toFixed(2);
  const discountUsd = Number(order.discount || 0).toFixed(2);
  const deliveryFeeUsd = Number(order.deliveryFee || 0).toFixed(2);
  const totalRiel = Math.round(Number(order.total || 0) * 4100).toLocaleString();

  const itemsHtml = (order.items || []).map((it, idx) => {
    const specs = [
      it.size,
      it.sweetness ? `${it.sweetness} Sugar` : null,
      it.ice ? `${it.ice} Ice` : null,
      it.milk && it.milk !== 'Fresh Whole Milk' ? it.milk : null,
      it.addons && it.addons.length > 0 ? it.addons.map(a => a.name).join(', ') : null,
      it.specialNote ? `"${it.specialNote}"` : null
    ].filter(Boolean).join(' • ');

    const lineTotal = (Number(it.price || it.unitPrice || 0) * (it.quantity || 1)).toFixed(2);

    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 8px; text-align: center; color: #64748b; font-size: 12px;">${idx + 1}</td>
        <td style="padding: 10px 8px;">
          <strong style="color: #0f172a; font-size: 13px; display: block;">${it.nameKm || it.name}</strong>
          ${it.name && it.nameKm && it.name !== it.nameKm ? `<span style="font-size: 11px; color: #64748b;">${it.name}</span><br/>` : ''}
          ${specs ? `<span style="font-size: 11px; color: #b45309; line-height: 1.4;">${specs}</span>` : ''}
        </td>
        <td style="padding: 10px 8px; text-align: center; font-weight: bold; font-family: monospace; font-size: 13px;">${it.quantity || 1}</td>
        <td style="padding: 10px 8px; text-align: right; font-family: monospace; font-size: 13px;">$${Number(it.price || it.unitPrice || 0).toFixed(2)}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: bold; font-family: monospace; font-size: 13px; color: #0f172a;">$${lineTotal}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="km">
    <head>
      <meta charset="UTF-8">
      <title>Invoice #${order.orderNumber || order.id} - Aroma Coffee Roasters</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 24px;
          color: #1e293b;
          background: #ffffff;
          line-height: 1.5;
        }
        .invoice-box {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        @media print {
          body { padding: 0; background: #fff; }
          .invoice-box { border: none; box-shadow: none; padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="max-width: 800px; margin: 0 auto 16px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; color: #64748b;">Aroma Coffee Official Tax Invoice</span>
        <button onclick="window.print()" style="background: #d97706; color: #fff; border: none; padding: 10px 20px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 13px; box-shadow: 0 2px 8px rgba(217,119,6,0.3);">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div class="invoice-box">
        <!-- Header -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="vertical-align: top;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 32px;">☕</span>
                <div>
                  <h1 style="margin: 0; font-size: 24px; color: #0f172a; font-weight: 900; letter-spacing: -0.5px;">
                    Aroma<span style="color: #d97706;">Coffee</span> Roastery
                  </h1>
                  <p style="margin: 2px 0 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">
                    Artisan Roasters & Café • Phnom Penh
                  </p>
                </div>
              </div>
              <p style="margin: 8px 0 0; font-size: 11px; color: #475569; line-height: 1.4;">
                #42, Street 57, Sangkat Boeng Keng Kang 1, Phnom Penh<br/>
                Tel: +855 23 999 881 • VAT TIN: K002-98421098
              </p>
            </td>
            <td style="vertical-align: top; text-align: right;">
              <span style="display: inline-block; padding: 4px 12px; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; border-radius: 20px; text-transform: uppercase; margin-bottom: 6px;">
                OFFICIAL INVOICE
              </span>
              <h2 style="margin: 0; font-size: 18px; color: #0f172a; font-family: monospace;">
                #${order.orderNumber || order.id}
              </h2>
              <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">
                Date: <strong>${dateStr}</strong>
              </p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #047857; font-weight: bold;">
                Status: ${order.paymentStatus || 'PAID'} (${order.paymentMethod || 'Bakong KHQR'})
              </p>
            </td>
          </tr>
        </table>

        <!-- Billed To Box -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #f8fafc; border-radius: 12px; padding: 16px;">
          <tr>
            <td style="padding: 14px; vertical-align: top; width: 50%;">
              <strong style="font-size: 11px; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px;">Customer Details:</strong>
              <div style="font-size: 14px; font-weight: 900; color: #0f172a;">${order.customerName || 'Customer'}</div>
              <div style="font-size: 12px; color: #475569; font-family: monospace;">📞 ${order.customerPhone || 'N/A'}</div>
            </td>
            <td style="padding: 14px; vertical-align: top; width: 50%; border-left: 1px solid #e2e8f0;">
              <strong style="font-size: 11px; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px;">Fulfillment Type:</strong>
              <div style="font-size: 13px; font-weight: 800; color: #d97706;">
                ${order.orderType === 'DELIVERY' ? '🛵 Phnom Penh City Delivery' : '🛍️ Store Pickup at Roastery'}
              </div>
              <div style="font-size: 12px; color: #475569; margin-top: 2px;">
                ${order.deliveryAddress || 'Flagship Store, BKK1, Phnom Penh'}
              </div>
            </td>
          </tr>
        </table>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff;">
              <th style="padding: 10px 8px; text-align: center; font-size: 11px; text-transform: uppercase; border-top-left-radius: 8px;">#</th>
              <th style="padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase;">Beverage / Food Description</th>
              <th style="padding: 10px 8px; text-align: center; font-size: 11px; text-transform: uppercase;">Qty</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 11px; text-transform: uppercase;">Unit Price</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 11px; text-transform: uppercase; border-top-right-radius: 8px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Summary Totals -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="width: 55%; vertical-align: top; padding-right: 20px;">
              <div style="border: 1px dashed #cbd5e1; border-radius: 12px; padding: 14px; background: #fffbeb;">
                <div style="font-size: 12px; font-weight: bold; color: #92400e; margin-bottom: 4px;">
                  🇰🇭 Bakong KHQR Verified Payment
                </div>
                <div style="font-size: 11px; color: #78350f; line-height: 1.4;">
                  Directly verified with the National Bank of Cambodia (NBC Bakong Network). All goods inclusive of applicable VAT.
                </div>
              </div>
            </td>
            <td style="width: 45%; vertical-align: top;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Subtotal:</td>
                  <td style="padding: 4px 0; text-align: right; font-family: monospace; font-weight: bold;">$${subtotalUsd}</td>
                </tr>
                ${Number(discountUsd) > 0 ? `
                <tr>
                  <td style="padding: 4px 0; color: #059669;">Promo Discount:</td>
                  <td style="padding: 4px 0; text-align: right; font-family: monospace; font-weight: bold; color: #059669;">-$${discountUsd}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Delivery Fee:</td>
                  <td style="padding: 4px 0; text-align: right; font-family: monospace; font-weight: bold;">
                    ${Number(deliveryFeeUsd) === 0 ? '<span style="color:#059669">FREE</span>' : `$${deliveryFeeUsd}`}
                  </td>
                </tr>
                <tr style="border-top: 2px solid #0f172a;">
                  <td style="padding: 10px 0 2px; font-size: 15px; font-weight: 900; color: #0f172a;">Total USD:</td>
                  <td style="padding: 10px 0 2px; text-align: right; font-size: 18px; font-weight: 900; font-family: monospace; color: #d97706;">
                    $${totalUsd}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 0 6px; font-size: 11px; color: #64748b;">Total KHR:</td>
                  <td style="padding: 0 0 6px; text-align: right; font-size: 13px; font-weight: bold; font-family: monospace; color: #475569;">
                    ≈ ${totalRiel} ៛
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Footer Notice -->
        <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px;">
          <p style="margin: 0;">Thank you for enjoying Aroma Coffee! Roasted micro-batch in Phnom Penh.</p>
          <p style="margin: 2px 0 0;">For delivery or billing inquiries, please call +855 23 999 881.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Triggers a clean printable window or offline download
 */
export const downloadInvoice = (order) => {
  const html = generateInvoiceHtml(order);

  // Open in new print window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    // Fallback: download as .html file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${order.orderNumber || order.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

