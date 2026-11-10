import XLSX from 'xlsx-js-style';

/**
 * Professional Coffee Shop & Cambodian Accounting Color Palette for Excel
 */
export const EXCEL_PALETTE = {
  // Brand Header
  BRAND_DARK: '3E2723',      // Espresso Dark Roast (#3E2723)
  BRAND_AMBER: '78350F',     // Warm Amber Coffee (#78350F)
  BRAND_GOLD: 'B45309',      // Golden Bronze (#B45309)
  
  // Section Headers
  SECTION_BG: 'FEF3C7',      // Soft Amber Light Tint (#FEF3C7)
  SECTION_TEXT: '78350F',    // Dark Amber Text (#78350F)
  SECTION_BORDER: 'D97706',  // Amber Accent Border (#D97706)
  
  // Table Headers
  TABLE_HEADER_BG: '292524', // Dark Charcoal Slate (#292524)
  TABLE_HEADER_TEXT: 'FFFFFF',// Crisp White Text
  TABLE_HEADER_BORDER: '57534E',
  
  // Summary / Total Rows
  TOTAL_BG: 'FEF9C3',        // Soft Gold Highlight (#FEF9C3)
  TOTAL_TEXT: '78350F',      // Amber Brown Bold
  TOTAL_BORDER: 'B45309',    // Accent Border
  
  // Zebra Striping
  ZEBRA_EVEN: 'FFFFFF',      // Pure White
  ZEBRA_ODD: 'FBFBFB',       // Very subtle off-white
  GRID_BORDER: 'E7E5E4',     // Light Stone Border
  
  // Status Colors
  STATUS_GREEN_BG: 'DCFCE7',
  STATUS_GREEN_TEXT: '15803D',
  STATUS_RED_BG: 'FEE2E2',
  STATUS_RED_TEXT: 'B91C1C',
  STATUS_AMBER_BG: 'FEF3C7',
  STATUS_AMBER_TEXT: 'B45309',
  
  // Signature Box
  SIGN_CARD_BG: 'F5F5F4',    // Neutral Stone Header
  SIGN_BORDER: 'A8A29E',     // Medium Stone Border
  SIGN_DOTTED: 'D6D3D1'
};

/**
 * Clean Black & White / Printer-Friendly Monochrome Accounting Palette for Excel
 * Ideal for physical laser printouts, photocopying, official tax filing, and toner ink saving
 */
export const EXCEL_BW_PALETTE = {
  // Brand Header
  BRAND_DARK: '000000',      // Solid Pure Black (#000000)
  BRAND_AMBER: '1F1F1F',     // Deep Charcoal (#1F1F1F)
  BRAND_GOLD: '333333',      // Dark Neutral (#333333)
  
  // Section Headers
  SECTION_BG: 'F5F5F5',      // Clean Neutral Light Gray (#F5F5F5)
  SECTION_TEXT: '000000',    // Pitch Black Bold Text
  SECTION_BORDER: '000000',  // Sharp Solid Black Border
  
  // Table Headers
  TABLE_HEADER_BG: '000000', // Pitch Black (#000000)
  TABLE_HEADER_TEXT: 'FFFFFF',// Pure White Text
  TABLE_HEADER_BORDER: '000000',
  
  // Summary / Total Rows
  TOTAL_BG: 'FFFFFF',        // Pure White (Paper Friendly)
  TOTAL_TEXT: '000000',      // Pitch Black Bold
  TOTAL_BORDER: '000000',    // Solid Black Accent Border
  
  // Zebra Striping
  ZEBRA_EVEN: 'FFFFFF',      // Pure White
  ZEBRA_ODD: 'F9F9F9',       // Clean Paper Off-White
  GRID_BORDER: 'BDBDBD',     // Crisp Clear Monochrome Border (#BDBDBD)
  
  // Status Colors (Monochrome high readability)
  STATUS_GREEN_BG: 'F5F5F5',
  STATUS_GREEN_TEXT: '000000',
  STATUS_RED_BG: 'EBEBEB',
  STATUS_RED_TEXT: '000000',
  STATUS_AMBER_BG: 'F0F0F0',
  STATUS_AMBER_TEXT: '000000',
  
  // Signature Box
  SIGN_CARD_BG: 'F5F5F5',    // Light Neutral Gray Header
  SIGN_BORDER: '000000',     // Pitch Black Solid Frame
  SIGN_DOTTED: '737373'      // Crisp Dotted Gray
};



/**
 * Calculate column bounds for 3 signature cards based on total columns in sheet
 * @param {number} totalCols
 * @returns {{ b1: [number, number], b2: [number, number], b3: [number, number] }}
 */
export const getSignatureLayout = (totalCols = 4) => {
  if (totalCols <= 4) {
    return {
      b1: [0, 0],
      b2: [1, 2],
      b3: [3, 3]
    };
  } else if (totalCols <= 6) {
    return {
      b1: [0, 1],
      b2: [2, 3],
      b3: [4, 5]
    };
  } else if (totalCols <= 8) {
    return {
      b1: [0, 1],
      b2: [3, 4],
      b3: [6, 7]
    };
  } else if (totalCols <= 10) {
    return {
      b1: [0, 2],
      b2: [3, 5],
      b3: [6, totalCols - 1]
    };
  } else if (totalCols <= 12) {
    return {
      b1: [0, 3],
      b2: [4, 7],
      b3: [8, totalCols - 1]
    };
  } else {
    const w = Math.floor(totalCols / 3);
    return {
      b1: [0, w - 1],
      b2: [w, 2 * w - 1],
      b3: [2 * w, totalCols - 1]
    };
  }
};

/**
 * Generate Cambodian Standard 3-Tier Official Signature Block (ផ្នែកសញ្ញេរ / ហត្ថលេខាផ្លូវការ)
 * @param {Object} params
 * @param {number} params.totalCols Total columns in the worksheet to space out columns
 * @param {string} params.operatorName Name of the cashier/auditor who generated the report
 * @param {string} params.role Role of the operator (e.g. CASHIER, ADMIN)
 * @param {string} params.dateStr Date string (e.g. 10/11/2026)
 */
export const generateSignatureBlock = ({
  totalCols = 4,
  operatorName = 'Marcus Thorne',
  role = 'ADMIN',
  dateStr = ''
}) => {
  const { b1, b2, b3 } = getSignatureLayout(totalCols);

  const makeRow = (val1, val2, val3) => {
    const row = new Array(totalCols).fill('');
    row[b1[0]] = val1;
    row[b2[0]] = val2;
    row[b3[0]] = val3;
    return row;
  };

  const currentDate = dateStr || new Date().toLocaleDateString('en-GB');

  return [
    [],
    ['ហត្ថលេខា & ការអនុម័តរបាយការណ៍ហិរញ្ញវត្ថុផ្លូវការ • OFFICIAL AUDIT & SIGN-OFF APPROVAL'],
    [],
    makeRow(
      'អ្នករៀបចំរបាយការណ៍ (PREPARED BY)',
      'អ្នកត្រួតពិនិត្យ (CHECKED & VERIFIED BY)',
      'អ្នកអនុម័ត (APPROVED BY)'
    ),
    makeRow(
      'បេឡាធិការ / អ្នកកាន់វេន (Cashier / Accountant)',
      'ប្រធានគ្រប់គ្រងហាង (Store Manager)',
      'ម្ចាស់ហាង / នាយកប្រតិបត្តិ (Owner / Director)'
    ),
    makeRow(
      '(ហត្ថលេខា & ឈ្មោះ / Signature & Name)',
      '(ហត្ថលេខា & ឈ្មោះ / Signature & Name)',
      '(ហត្ថលេខា & ត្រា / Signature & Stamp)'
    ),
    makeRow('', '', ''),
    makeRow('', '', ''),
    makeRow('', '', ''),
    makeRow(
      `ឈ្មោះ: ${operatorName}`,
      'ឈ្មោះ: .................................................',
      'ឈ្មោះ: .................................................'
    ),
    makeRow(
      `តួនាទី: ${role}`,
      'តួនាទី: Store Manager',
      'តួនាទី: Owner / Managing Director'
    ),
    makeRow(
      `កាលបរិច្ឆេទ: ${currentDate}`,
      'កាលបរិច្ឆេទ: ...... / ...... / ២០២...',
      'កាលបរិច្ឆេទ: ...... / ...... / ២០២...'
    )
  ];
};

/**
 * Compute the merges required for the signature block
 * @param {number} startRow Row index where the signature block array begins
 * @param {number} totalCols Total columns in worksheet
 * @returns {Array<Object>} XLSX merge objects
 */
export const getSignatureMerges = (startRow, totalCols = 4) => {
  const { b1, b2, b3 } = getSignatureLayout(totalCols);
  const merges = [];

  // Row 1 of signature block: Section Banner across all columns
  merges.push({
    s: { r: startRow + 1, c: 0 },
    e: { r: startRow + 1, c: totalCols - 1 }
  });

  // For rows 3 through 11: merge across each box if box spans multiple columns
  const boxes = [b1, b2, b3];
  for (let rOffset = 3; rOffset <= 11; rOffset++) {
    const r = startRow + rOffset;
    boxes.forEach(([startCol, endCol]) => {
      if (endCol > startCol) {
        merges.push({
          s: { r, c: startCol },
          e: { r, c: endCol }
        });
      }
    });
  }

  return merges;
};

/**
 * Apply High-Fidelity Colors, Typography, Borders, and Number Formatting to a Worksheet
 */
export const styleCambodianWorksheet = (ws, {
  merges = [],
  colWidths = [],
  rowHeights = [],
  totalCols = 4,
  isBlackWhite = false
} = {}) => {
  const palette = isBlackWhite ? EXCEL_BW_PALETTE : EXCEL_PALETTE;
  const borderThin = { style: 'thin', color: { rgb: palette.GRID_BORDER } };
  const borderHeader = { style: 'thin', color: { rgb: palette.TABLE_HEADER_BORDER } };
  const borderTotalTop = { style: 'thin', color: { rgb: palette.TOTAL_BORDER } };
  const borderTotalBottom = { style: 'double', color: { rgb: palette.TOTAL_BORDER } };
  const borderSign = { style: 'thin', color: { rgb: palette.SIGN_BORDER } };

  // Find range of cells in sheet
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  const maxRow = range.e.r;
  const maxCol = Math.max(range.e.c, totalCols - 1);

  // Analyze rows to detect signature start row
  let signStartRow = -1;
  for (let R = range.s.r; R <= maxRow; ++R) {
    const firstCellRef = XLSX.utils.encode_cell({ r: R, c: 0 });
    const firstCell = ws[firstCellRef];
    const firstVal = firstCell ? String(firstCell.v || '') : '';

    if (firstVal.includes('OFFICIAL AUDIT & SIGN-OFF')) {
      signStartRow = R - 1; // start row includes the empty row before banner
      break;
    }
  }

  // Combine merges
  let combinedMerges = [...(merges || [])];
  if (signStartRow >= 0) {
    const signMerges = getSignatureMerges(signStartRow, totalCols);
    combinedMerges = [...combinedMerges, ...signMerges];
  }

  if (combinedMerges.length > 0) ws['!merges'] = combinedMerges;
  if (colWidths.length > 0) ws['!cols'] = colWidths.map(w => ({ wch: w }));
  if (rowHeights.length > 0) ws['!rows'] = rowHeights.map(h => ({ hpt: h }));

  const { b1, b2, b3 } = getSignatureLayout(totalCols);
  const isInsideBox = (col, [s, e]) => col >= s && col <= e;

  // Iterate all cells
  for (let R = range.s.r; R <= maxRow; ++R) {
    const firstCellRef = XLSX.utils.encode_cell({ r: R, c: 0 });
    const firstCell = ws[firstCellRef];
    const firstVal = firstCell ? String(firstCell.v || '').trim() : '';

    // Check row classifications
    const isTopBrandBanner = (R === 0);
    const isReportTitleBanner = (R === 1);
    const isMetaBanner = (R === 2);
    const isSectionHeader = /^\d+\./.test(firstVal) || 
      firstVal.includes('CORE FINANCIAL') || 
      firstVal.includes('PAYMENT TENDER') ||
      firstVal.includes('RECONCILIATION') ||
      firstVal.includes('OFFICIAL AUDIT & SIGN-OFF');
    const isTotalRow = firstVal.toUpperCase().includes('TOTAL') || 
      firstVal.includes('សរុប') || 
      firstVal.includes('STORE TOTALS') || 
      firstVal.includes('MOVEMENTS AUDIT') ||
      firstVal.includes('Total Tenders Audited');
    const isSignatureArea = (signStartRow >= 0 && R >= signStartRow + 1);

    for (let C = range.s.c; C <= maxCol; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      let cell = ws[cellRef];

      // Ensure cell exists for banners, totals, or signature blocks
      if (!cell && (isTopBrandBanner || isReportTitleBanner || isMetaBanner || isSectionHeader || isSignatureArea || isTotalRow)) {
        cell = { t: 's', v: '' };
        ws[cellRef] = cell;
      }

      if (!cell) continue;

      const val = cell.v;
      const strVal = String(val !== undefined ? val : '');

      // 1. TOP BRAND BANNER (Row 0)
      if (isTopBrandBanner) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: palette.BRAND_DARK } },
          font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: palette.TABLE_HEADER_TEXT } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
        continue;
      }

      // 2. REPORT TITLE BANNER (Row 1)
      if (isReportTitleBanner) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: palette.BRAND_AMBER } },
          font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: palette.TABLE_HEADER_TEXT } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
        continue;
      }

      // 3. METADATA SUBTITLE BANNER (Row 2)
      if (isMetaBanner) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: isBlackWhite ? 'FFFFFF' : 'F5F5F4' } },
          font: { name: 'Segoe UI', sz: 9.5, italic: true, color: { rgb: isBlackWhite ? '000000' : '44403C' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: { bottom: { style: 'thin', color: { rgb: palette.GRID_BORDER } } }
        };
        continue;
      }

      // 4. SIGNATURE & AUDIT APPROVAL BLOCK
      if (isSignatureArea) {
        const offset = R - signStartRow;
        if (offset === 1) {
          // Banner for Sign-off section
          cell.s = {
            fill: { patternType: 'solid', fgColor: { rgb: palette.SECTION_BG } },
            font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: palette.SECTION_TEXT } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'medium', color: { rgb: palette.SECTION_BORDER } },
              bottom: { style: 'medium', color: { rgb: palette.SECTION_BORDER } }
            }
          };
          continue;
        }

        // Determine if C is inside box 1, 2, or 3
        let currentBox = null;
        if (isInsideBox(C, b1)) currentBox = b1;
        else if (isInsideBox(C, b2)) currentBox = b2;
        else if (isInsideBox(C, b3)) currentBox = b3;

        if (!currentBox) {
          // Gap column between signature boxes
          cell.s = {
            fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } }
          };
          continue;
        }

        const isLeftEdge = (C === currentBox[0]);
        const isRightEdge = (C === currentBox[1]);

        if (offset === 3) {
          // Role header (PREPARED BY / CHECKED BY / APPROVED BY)
          cell.s = {
            fill: { patternType: 'solid', fgColor: { rgb: isBlackWhite ? 'E5E5E5' : 'E7E5E4' } },
            font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: isBlackWhite ? '000000' : '1C1917' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: borderSign,
              bottom: borderThin,
              left: isLeftEdge ? borderSign : undefined,
              right: isRightEdge ? borderSign : undefined
            }
          };
        } else if (offset === 4) {
          // Subtitle (Cashier / Store Manager / Director)
          cell.s = {
            fill: { patternType: 'solid', fgColor: { rgb: isBlackWhite ? 'F5F5F5' : 'F5F5F4' } },
            font: { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: isBlackWhite ? '000000' : '44403C' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              left: isLeftEdge ? borderSign : undefined,
              right: isRightEdge ? borderSign : undefined
            }
          };
        } else if (offset === 5) {
          // Action hint (Signature & Name / Stamp)
          cell.s = {
            fill: { patternType: 'solid', fgColor: { rgb: isBlackWhite ? 'F5F5F5' : 'F5F5F4' } },
            font: { name: 'Segoe UI', sz: 8.5, italic: true, color: { rgb: isBlackWhite ? '525252' : '78716C' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              left: isLeftEdge ? borderSign : undefined,
              right: isRightEdge ? borderSign : undefined,
              bottom: { style: 'dashed', color: { rgb: palette.SIGN_DOTTED } }
            }
          };
        } else if (offset >= 6 && offset <= 8) {
          // Tall empty signing box for pen signature or company stamp
          cell.s = {
            fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              left: isLeftEdge ? borderSign : undefined,
              right: isRightEdge ? borderSign : undefined
            }
          };
        } else if (offset >= 9 && offset <= 11) {
          // Bottom metadata lines: Name, Title, Date
          cell.s = {
            fill: { patternType: 'solid', fgColor: { rgb: isBlackWhite ? 'FFFFFF' : 'FAFAF9' } },
            font: { name: 'Segoe UI', sz: 9, bold: offset === 9, color: { rgb: isBlackWhite ? '000000' : '1C1917' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              left: isLeftEdge ? borderSign : undefined,
              right: isRightEdge ? borderSign : undefined,
              bottom: offset === 11 ? borderSign : undefined
            }
          };
        }
        continue;
      }

      // 5. SECTION HEADER BANDS (e.g. "1. CORE FINANCIAL PERFORMANCE METRICS")
      if (isSectionHeader) {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: palette.SECTION_BG } },
          font: { name: 'Segoe UI', sz: 10.5, bold: true, color: { rgb: palette.SECTION_TEXT } },
          alignment: { horizontal: C === 0 ? 'left' : 'right', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: palette.SECTION_BORDER } },
            bottom: { style: 'thin', color: { rgb: palette.SECTION_BORDER } }
          }
        };
        continue;
      }

      // 6. TOTAL / SUMMARY ROW (Double bottom border like real accounting ledger)
      if (isTotalRow) {
        const isNum = typeof val === 'number';
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: palette.TOTAL_BG } },
          font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: palette.TOTAL_TEXT } },
          alignment: { horizontal: isNum ? 'right' : (C === 0 ? 'left' : 'center'), vertical: 'center' },
          border: {
            top: borderTotalTop,
            bottom: borderTotalBottom,
            left: borderThin,
            right: borderThin
          }
        };

        if (isNum) {
          cell.t = 'n';
          if (val > 1000 && val % 1 === 0) {
            cell.z = '#,##0 "៛";(#,##0 "៛");"-"';
          } else if (val % 1 !== 0 || val < 1000) {
            cell.z = '"$"#,##0.00;("$"#,##0.00);"-"';
          } else {
            cell.z = '#,##0';
          }
        }
        continue;
      }

      // 7. TABLE COLUMN HEADERS (Header rows usually contain labels like "Item Name", "Price", etc.)
      const isHeaderRow = (
        strVal.includes('Price') ||
        strVal.includes('Item Name') ||
        strVal.includes('Category') ||
        strVal.includes('Revenue') ||
        strVal.includes('Receipt ID') ||
        strVal.includes('Customer') ||
        strVal.includes('Shift ID') ||
        strVal.includes('Staff Name') ||
        strVal.includes('Units Sold') ||
        strVal.includes('Amount ($)') ||
        strVal.includes('AMOUNT (USD)') ||
        strVal.includes('SKU Code') ||
        strVal.includes('Material ID') ||
        strVal.includes('Reference ID')
      );

      if (isHeaderRow && typeof val === 'string') {
        cell.s = {
          fill: { patternType: 'solid', fgColor: { rgb: palette.TABLE_HEADER_BG } },
          font: { name: 'Segoe UI', sz: 9.5, bold: true, color: { rgb: palette.TABLE_HEADER_TEXT } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: borderHeader,
            bottom: borderHeader,
            left: borderHeader,
            right: borderHeader
          }
        };
        continue;
      }

      // 8. DATA CELLS (Zebra striping, formatted numbers, borders)
      const isEvenRow = (R % 2 === 0);
      const isNum = typeof val === 'number';

      let alignH = 'left';

      if (isNum) {
        alignH = 'right';
        cell.t = 'n';
        if (strVal.includes('%') || (val <= 1 && val >= 0 && (strVal.length < 5 || C === 3 || C === 10))) {
          cell.z = '0.0%';
        } else if (val > 1000 && val % 1 === 0) {
          cell.z = '#,##0 "៛";(#,##0 "៛");"-"';
        } else if (val % 1 !== 0 || val < 1000) {
          cell.z = '"$"#,##0.00;("$"#,##0.00);"-"';
        } else {
          cell.z = '#,##0';
        }
      } else if (strVal.includes('%')) {
        alignH = 'right';
      } else if (strVal === '-' || strVal === 'N/A' || (/^\d+$/.test(strVal) && strVal.length <= 4)) {
        alignH = 'center';
      }

      // Cell border & Zebra styling
      cell.s = {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: isEvenRow ? palette.ZEBRA_EVEN : palette.ZEBRA_ODD }
        },
        font: { name: 'Segoe UI', sz: 9.5, color: { rgb: isBlackWhite ? '000000' : '1C1917' } },
        alignment: { horizontal: alignH, vertical: 'center' },
        border: {
          top: borderThin,
          bottom: borderThin,
          left: borderThin,
          right: borderThin
        }
      };

      // Status pill coloring
      if (strVal.includes('In Stock') || strVal.includes('គ្រប់គ្រាន់') || strVal.includes('PAID') || strVal.includes('COMPLETED') || strVal.includes('STAR_MARGIN')) {
        cell.s.fill = { patternType: 'solid', fgColor: { rgb: palette.STATUS_GREEN_BG } };
        cell.s.font = { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: palette.STATUS_GREEN_TEXT } };
        cell.s.alignment = { horizontal: 'center', vertical: 'center' };
      } else if (strVal.includes('Low Stock') || strVal.includes('ស្តុកទាប') || strVal.includes('HIGH_COGS') || strVal.includes('Disabled') || strVal.includes('Out of Stock') || strVal.includes('DEPLETED')) {
        cell.s.fill = { patternType: 'solid', fgColor: { rgb: palette.STATUS_RED_BG } };
        cell.s.font = { name: 'Segoe UI', sz: 9, bold: true, color: { rgb: palette.STATUS_RED_TEXT } };
        cell.s.alignment = { horizontal: 'center', vertical: 'center' };
      }
    }
  }

  // Set default row heights if not provided
  if (!ws['!rows'] || ws['!rows'].length === 0) {
    const rows = [];
    rows[0] = { hpt: 30 }; // Brand banner
    rows[1] = { hpt: 24 }; // Subtitle banner
    rows[2] = { hpt: 18 }; // Scope metadata
    ws['!rows'] = rows;
  }

  return ws;
};

export default {
  EXCEL_PALETTE,
  EXCEL_BW_PALETTE,
  getSignatureLayout,
  generateSignatureBlock,
  getSignatureMerges,
  styleCambodianWorksheet
};
