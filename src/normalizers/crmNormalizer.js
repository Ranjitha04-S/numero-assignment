import { parseAmount, parseDate, parsePaymentTerms, parseDiscount, cleanString } from '../utils/normalizerUtils.js';

export function normalizeCRM(crmJson) {
  if (!crmJson) return null;

  const header = {
    customer_name: cleanString(crmJson.Account_Name__c || crmJson.AccountName || crmJson.Customer),
    contract_currency: cleanString(crmJson.CurrencyIsoCode || crmJson.Currency || 'USD'),
    total_contract_value: parseAmount(crmJson.Amount || crmJson.TotalAmount),
    payment_terms: parsePaymentTerms(crmJson.Payment_Terms__c || crmJson.PaymentTerms),
    contract_start_date: parseDate(crmJson.Subscription_Start__c || crmJson.StartDate),
    contract_end_date: parseDate(crmJson.Subscription_End__c || crmJson.EndDate),
    signature_date: parseDate(crmJson.Signature_Date__c || crmJson.SignedDate),
    quote_id: cleanString(crmJson.Quote_Number__c || crmJson.Quote_Id__c || crmJson.QuoteId),
    bill_to_address: cleanString(crmJson.Billing_Address__c || crmJson.BillToAddress),
    ship_to_address: cleanString(crmJson.Shipping_Address__c || crmJson.ShipToAddress),
  };

  const rawItems = crmJson.LineItems || crmJson.items || [];
  const line_items = rawItems.map((item) => ({
    product: cleanString(item['Product2.Name'] || item.ProductName || item.Product || item.itemCode),
    quantity: parseAmount(item.Quantity || item.qty || 0),
    unit_price: parseAmount(item.UnitPrice || item.rate || 0),
    discount: parseDiscount(item.Discount || item.discountPct || 0),
    start_date: parseDate(item.ServiceDate || item.StartDate || header.contract_start_date),
    end_date: parseDate(item.EndDate || header.contract_end_date),
  }));

  return {
    source: 'CRM',
    header,
    line_items,
  };
}
