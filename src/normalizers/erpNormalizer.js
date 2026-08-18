import { parseAmount, parseDate, parsePaymentTerms, parseDiscount, cleanString } from '../utils/normalizerUtils.js';

export function normalizeERP(erpJson) {
  if (!erpJson) return null;

  const entity = erpJson.entity || {};
  const currency = erpJson.currency || {};
  const terms = erpJson.terms || {};

  const header = {
    customer_name: cleanString(entity.companyName || entity.name || erpJson.customerName),
    contract_currency: cleanString(currency.symbol || currency.code || erpJson.currency || 'USD'),
    total_contract_value: parseAmount(erpJson.total || erpJson.totalAmount),
    payment_terms: parsePaymentTerms(terms.name || erpJson.terms),
    contract_start_date: parseDate(erpJson.startDate || erpJson.start_date),
    contract_end_date: parseDate(erpJson.endDate || erpJson.end_date),
    signature_date: parseDate(erpJson.signatureDate || erpJson.signedDate),
    quote_id: cleanString(erpJson.quoteId || erpJson.quote_id),
    bill_to_address: cleanString(erpJson.billingAddress || erpJson.billToAddress),
    ship_to_address: cleanString(erpJson.shippingAddress || erpJson.shipToAddress),
  };

  const rawItems = erpJson.items || erpJson.lineItems || [];
  
  const line_items = rawItems
    .filter(item => true)
    .map((item) => ({
      product: cleanString(item.itemCode || item.name || item.description),
      quantity: parseAmount(item.qty || item.quantity || 0),
      unit_price: parseAmount(item.rate || item.unitPrice || 0),
      discount: parseDiscount(item.discountPct || item.discount || 0),
      is_tax: String(item.itemCode || '').toUpperCase().includes('TAX'),
      start_date: parseDate(item.startDate || header.contract_start_date),
      end_date: parseDate(item.endDate || header.contract_end_date),
    }));

  return {
    source: 'ERP',
    header,
    line_items,
  };
}
