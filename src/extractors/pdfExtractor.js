import fs from 'fs';
import { createRequire } from 'module';
import { parseAmount, parseDate, parsePaymentTerms, parseDiscount, cleanString } from '../utils/normalizerUtils.js';

const require = createRequire(import.meta.url);

export function parsePDFText(rawText) {
  const text = rawText || '';

  // Extract Header Fields safely
  const quoteIdMatch = text.match(/(?:Quote Reference|Quote Number|Quote ID):\s*([^\r\n\t]+)/i);
  const quote_id = quoteIdMatch ? cleanString(quoteIdMatch[1]) : null;

  let customer_name = null;
  const companyMatches = [...text.matchAll(/Company:\s*([^\r\n\t]+)/gi)];
  if (companyMatches.length > 0) {
    const custInfoIdx = text.search(/Customer Information|Bill To/i);
    if (custInfoIdx !== -1) {
      const textAfterCust = text.slice(custInfoIdx);
      const m = textAfterCust.match(/Company:\s*([^\r\n\t]+)/i);
      if (m) customer_name = cleanString(m[1]);
    }
    if (!customer_name) {
      customer_name = cleanString(companyMatches[0][1]);
    }
  }

  const currencyMatch = text.match(/Currency:\s*([^\r\n\t]+)/i);
  const contract_currency = currencyMatch ? cleanString(currencyMatch[1]) : 'USD';

  const startDateMatch = text.match(/Start Date:\s*([^\r\n\t]+)/i);
  const contract_start_date = startDateMatch ? parseDate(startDateMatch[1]) : null;

  const endDateMatch = text.match(/End Date:\s*([^\r\n\t]+)/i);
  const contract_end_date = endDateMatch ? parseDate(endDateMatch[1]) : null;

  const paymentTermsMatch = text.match(/Payment\s*Terms:\s*([^\r\n\t]+)/i) || 
                             text.match(/Net\s*\d+/i);
  const payment_terms = paymentTermsMatch ? parsePaymentTerms(paymentTermsMatch[1] || paymentTermsMatch[0]) : null;

  const totalAmountMatch = text.match(/(?:TOTAL AMOUNT|Total Amount|TOTAL CONTRACT VALUE):\s*\$?([\d,]+\.?\d*)/i);
  const total_contract_value = totalAmountMatch ? parseAmount(totalAmountMatch[1]) : null;

  // Extract Line Items (handles both tabbed & concatenated pdf-parse output)
  const line_items = [];
  const lines = text.split(/\r?\n/);

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes('$')) continue;

    // Handles format like "3Incident3601.00$20,000.00$20,000.00" or tabbed lines
    if (/^\d+/.test(trimmed)) {
      const parts = trimmed.split('$');
      if (parts.length >= 3) {
        const unitPriceStr = parts[parts.length - 2];
        const prefix = parts[0]; // e.g. "3Incident3601.00"

        const itemMatch = prefix.match(/^(\d+)\s*(.*?)(1\.00|2\.00|3\.00|4\.00|5\.00|10\.00|\b\d+\.\d{2})$/);
        if (itemMatch) {
          line_items.push({
            product: cleanString(itemMatch[2]),
            quantity: parseAmount(itemMatch[3]),
            unit_price: parseAmount(unitPriceStr),
            discount: 0
          });
        }
      }
    }
  }

  return {
    source: 'PDF',
    header: {
      customer_name,
      contract_currency,
      total_contract_value,
      payment_terms,
      contract_start_date,
      contract_end_date,
      quote_id
    },
    line_items
  };
}

export async function extractPDF(pdfPath) {
  let text = '';
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    let pdfModule = require('pdf-parse');

    if (pdfModule && pdfModule.PDFParse) {
      const uint8 = new Uint8Array(dataBuffer);
      const parser = new pdfModule.PDFParse(uint8);
      const res = await parser.getText();
      text = res ? res.text : '';
    } else if (typeof pdfModule === 'function') {
      const res = await pdfModule(dataBuffer);
      text = res ? res.text : '';
    }
  } catch (err) {
    console.error(`Error reading PDF file at ${pdfPath}:`, err);
    text = '';
  }

  return parsePDFText(text);
}
