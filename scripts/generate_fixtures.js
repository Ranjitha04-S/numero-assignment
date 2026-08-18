import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generateCleanPDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawText = (text, x, y, size = 12, isBold = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: isBold ? boldFont : font,
      color: rgb(0.1, 0.1, 0.1),
    });
  };

  // Header
  drawText('ORDER FORM', 50, 740, 20, true);
  drawText('Quote Reference: Q-00041', 400, 740, 12, true);

  // Customer Info
  drawText('Customer Information', 50, 700, 14, true);
  drawText('Company: Acme Corporation', 50, 680);
  drawText('Currency: USD', 50, 660);
  drawText('Payment Terms: Net 30', 50, 640);
  drawText('Start Date: 2026-04-01', 50, 620);
  drawText('End Date: 2029-03-31', 50, 600);

  // Addresses
  drawText('Bill To:', 50, 560, 12, true);
  drawText('123 Business Plaza Drive, Anytown, ST 12345', 50, 544);

  drawText('Ship To:', 300, 560, 12, true);
  drawText('123 Business Plaza Drive, Anytown, ST 12345', 300, 544);

  // Products
  drawText('Products & Services', 50, 500, 14, true);
  drawText('Product: Meridian Analytics Pro', 50, 475);
  drawText('Quantity: 2500', 50, 455);
  drawText('Unit Price: $720.00', 50, 435);
  drawText('Discount: 10%', 50, 415);
  drawText('Total Amount: $2,400,000.00', 50, 385, 14, true);

  // Signatures
  drawText('Customer Authorization', 50, 330, 12, true);
  drawText('Signed By: Rebecca Thompson', 50, 310);
  drawText('Date: 2026-03-04', 50, 290);

  const pdfBytes = await pdfDoc.save();
  const dir = path.join(process.cwd(), 'fixtures', '01-clean');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'order-form.pdf'), pdfBytes);
  console.log('Successfully generated fixtures/01-clean/order-form.pdf');
}

generateCleanPDF().catch(console.error);
