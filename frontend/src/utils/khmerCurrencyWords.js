/**
 * Converts numbers into standard spoken Khmer words
 * and formats payment announcements for POS soundbox.
 */

const KHMER_DIGITS = ['', 'មួយ', 'ពីរ', 'បី', 'បួន', 'ប្រាំ', 'ប្រាំមួយ', 'ប្រាំពីរ', 'ប្រាំបី', 'ប្រាំបួន'];
const KHMER_TENS = ['', 'ដប់', 'ម្ភៃ', 'សាមសិប', 'សែសិប', 'ហាសិប', 'ហុកសិប', 'ចិតសិប', 'ប៉ែតសិប', 'កៅសិប'];

export function numberToKhmerWords(num) {
  num = Math.floor(Math.abs(Number(num) || 0));
  if (num === 0) return 'សូន្យ';

  function convertUnder100(n) {
    if (n < 10) return KHMER_DIGITS[n];
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    if (unit === 0) return KHMER_TENS[ten];
    return KHMER_TENS[ten] + KHMER_DIGITS[unit];
  }

  function convertUnder1000(n) {
    if (n < 100) return convertUnder100(n);
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let res = KHMER_DIGITS[hundred] + 'រយ';
    if (remainder > 0) {
      res += convertUnder100(remainder);
    }
    return res;
  }

  function convertUnderMillion(n) {
    if (n < 1000) return convertUnder1000(n);

    // Millions (លាន)
    if (n >= 1000000) {
      const millions = Math.floor(n / 1000000);
      const remainder = n % 1000000;
      let res = convertUnder1000(millions) + 'លាន';
      if (remainder > 0) res += convertUnderMillion(remainder);
      return res;
    }

    // Hundred-thousands (សែន)
    if (n >= 100000) {
      const saen = Math.floor(n / 100000);
      const remainder = n % 100000;
      let res = KHMER_DIGITS[saen] + 'សែន';
      if (remainder > 0) res += convertUnderMillion(remainder);
      return res;
    }

    // Ten-thousands (ម៉ឺន)
    if (n >= 10000) {
      const meun = Math.floor(n / 10000);
      const remainder = n % 10000;
      let res = KHMER_DIGITS[meun] + 'ម៉ឺន';
      if (remainder > 0) res += convertUnderMillion(remainder);
      return res;
    }

    // Thousands (ពាន់)
    if (n >= 1000) {
      const thousand = Math.floor(n / 1000);
      const remainder = n % 1000;
      let res = KHMER_DIGITS[thousand] + 'ពាន់';
      if (remainder > 0) res += convertUnder1000(remainder);
      return res;
    }

    return convertUnder1000(n);
  }

  return convertUnderMillion(num);
}

/**
 * Formats a spoken Khmer announcement for the exact amount received:
 * e.g.
 * - 3.50 USD  -> "ទទួលបានប្រាក់ បីដុល្លារ ហាសិបសេន"
 * - 5.00 USD  -> "ទទួលបានប្រាក់ ប្រាំដុល្លារ"
 * - 0.75 USD  -> "ទទួលបានប្រាក់ ចិតសិបប្រាំសេន"
 * - 20000 KHR -> "ទទួលបានប្រាក់ ពីរម៉ឺនរៀល"
 */
export function formatKhmerAmountAnnouncement(amount, currency = 'USD') {
  const num = Math.abs(Number(amount) || 0);
  const curr = (currency || 'USD').toUpperCase();

  if (curr === 'KHR' || curr === 'RIEL') {
    const khr = Math.round(num);
    const khrWords = numberToKhmerWords(khr);
    return `ទទួលបានប្រាក់ ${khrWords}រៀល`;
  }

  // USD standard
  const dollars = Math.floor(num);
  const cents = Math.round((num - dollars) * 100);

  const parts = [];
  if (dollars > 0) {
    parts.push(`${numberToKhmerWords(dollars)}ដុល្លារ`);
  }
  if (cents > 0) {
    parts.push(`${numberToKhmerWords(cents)}សេន`);
  }

  if (parts.length === 0) {
    return 'ទទួលបានប្រាក់ សូន្យដុល្លារ';
  }

  return `ទទួលបានប្រាក់ ${parts.join(' ')}`;
}

/**
 * Bilingual / Toast label for the received payment
 */
export function formatKhmerDisplayAnnouncement(amount, currency = 'USD') {
  const num = Number(amount) || 0;
  const curr = (currency || 'USD').toUpperCase();
  const spoken = formatKhmerAmountAnnouncement(num, curr);

  if (curr === 'KHR' || curr === 'RIEL') {
    return `${spoken} (៛${Math.round(num).toLocaleString()})`;
  }
  return `${spoken} ($${num.toFixed(2)})`;
}

