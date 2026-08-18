/**
 * Normalization utilities for Dates, Numbers, Currency, Payment Terms, and Discounts
 */

/**
 * Converts formatted currency strings (e.g. "$2,400,000.00") or raw numbers into a clean float number.
 * @param {string | number} val 
 * @returns {number | null}
 */
export function parseAmount(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/[\$,\s]/g, '').trim();
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Standardizes date strings (e.g. "June 5, 2025", "06/05/2025") to ISO format "YYYY-MM-DD".
 * @param {string} dateStr 
 * @returns {string | null}
 */
export function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const cleaned = dateStr.trim();
  if (!cleaned) return null;

  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // Support US slash format MM/DD/YYYY or M/D/YYYY
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Handle general textual dates like "June 5, 2025"
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Standardizes payment terms (e.g. "30 days from invoice date", "NET 30") to "Net 30".
 * @param {string} termsStr 
 * @returns {string | null}
 */
export function parsePaymentTerms(termsStr) {
  if (!termsStr || typeof termsStr !== 'string') return null;
  const cleaned = termsStr.trim();
  if (!cleaned) return null;

  if (/due\s+on\s+receipt|immediate/i.test(cleaned)) {
    return "Due on Receipt";
  }

  const match = cleaned.match(/\bnet\s*(\d+)\b|\b(\d+)\s*days\b/i);
  if (match) {
    const days = match[1] || match[2];
    return `Net ${days}`;
  }

  return null;
}

/**
 * Normalizes percentage strings ("10%") or decimals (0.10, -0.10) to a positive fraction (0.10).
 * @param {string | number} discountVal 
 * @returns {number}
 */
export function parseDiscount(discountVal) {
  if (discountVal === null || discountVal === undefined || discountVal === '') {
    return 0;
  }

  if (typeof discountVal === 'string') {
    const trimmed = discountVal.trim();
    if (!trimmed) return 0;
    if (trimmed.includes('%')) {
      const num = parseFloat(trimmed.replace(/[%,\s]/g, ''));
      if (isNaN(num)) return 0;
      return Math.abs(num) / 100;
    }
    const num = parseFloat(trimmed.replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return 0;
    const absNum = Math.abs(num);
    return absNum > 1 ? absNum / 100 : absNum;
  }

  if (typeof discountVal === 'number') {
    if (isNaN(discountVal)) return 0;
    const absNum = Math.abs(discountVal);
    return absNum > 1 ? absNum / 100 : absNum;
  }

  return 0;
}

/**
 * Trims strings and replaces multiple consecutive spaces/newlines with a single space.
 * @param {string} str 
 * @returns {string | null}
 */
export function cleanString(str) {
  if (str === null || str === undefined) return null;
  const s = typeof str === 'string' ? str : String(str);
  const cleaned = s.trim().replace(/\s+/g, ' ');
  return cleaned.length > 0 ? cleaned : null;
}

