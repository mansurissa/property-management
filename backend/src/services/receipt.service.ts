interface PaymentData {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  periodMonth: number;
  periodYear: number;
  notes?: string;
  tenant: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  unit: {
    unitNumber: string;
    property: {
      name: string;
      address: string;
    };
  };
  receivedBy?: {
    firstName?: string;
    lastName?: string;
  };
}

interface ReceiptData {
  receiptNumber: string;
  generatedAt: string;
  payment: PaymentData;
  html: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-RW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const generateReceiptNumber = (paymentId: string, paymentDate: string): string => {
  const date = new Date(paymentDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const shortId = paymentId.slice(-8).toUpperCase();
  return `RNT-${year}${month}-${shortId}`;
};

export const generateReceipt = (payment: PaymentData): ReceiptData => {
  const receiptNumber = generateReceiptNumber(payment.id, payment.paymentDate);
  const generatedAt = new Date().toISOString();
  const periodName = `${MONTH_NAMES[payment.periodMonth - 1]} ${payment.periodYear}`;

  const receiverName = payment.receivedBy
    ? `${payment.receivedBy.firstName || ''} ${payment.receivedBy.lastName || ''}`.trim() || 'Property Manager'
    : 'Property Manager';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Receipt - ${receiptNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f5f5f5;
          padding: 20px;
        }
        .receipt {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          font-size: 28px;
          margin-bottom: 5px;
        }
        .header p {
          opacity: 0.9;
          font-size: 14px;
        }
        .receipt-badge {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          padding: 8px 16px;
          border-radius: 20px;
          margin-top: 15px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .content {
          padding: 30px;
        }
        .receipt-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px dashed #e0e0e0;
        }
        .receipt-info div {
          font-size: 13px;
        }
        .receipt-info strong {
          display: block;
          color: #333;
          font-size: 14px;
        }
        .receipt-info span {
          color: #666;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #888;
          margin-bottom: 10px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .detail-item {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
        }
        .detail-item label {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .detail-item p {
          font-size: 15px;
          color: #333;
          margin-top: 4px;
          font-weight: 500;
        }
        .amount-section {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 2px solid #22c55e;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 25px 0;
        }
        .amount-label {
          font-size: 12px;
          color: #166534;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .amount-value {
          font-size: 32px;
          font-weight: bold;
          color: #166534;
          margin-top: 5px;
        }
        .period-badge {
          display: inline-block;
          background: #166534;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          margin-top: 10px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          border-top: 1px solid #e0e0e0;
        }
        .footer p {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        .footer .thank-you {
          font-size: 14px;
          color: #4F46E5;
          font-weight: 600;
        }
        .notes {
          background: #fffbeb;
          border-left: 3px solid #f59e0b;
          padding: 12px;
          margin-top: 20px;
          font-size: 13px;
          color: #92400e;
        }
        .notes-title {
          font-weight: 600;
          margin-bottom: 5px;
        }
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .receipt {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>Renta</h1>
          <p>Property Management</p>
          <div class="receipt-badge">Payment Receipt</div>
        </div>

        <div class="content">
          <div class="receipt-info">
            <div>
              <strong>Receipt #</strong>
              <span>${receiptNumber}</span>
            </div>
            <div style="text-align: right;">
              <strong>Date</strong>
              <span>${formatDate(payment.paymentDate)}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Tenant Information</div>
            <div class="details-grid">
              <div class="detail-item">
                <label>Name</label>
                <p>${payment.tenant.firstName} ${payment.tenant.lastName}</p>
              </div>
              <div class="detail-item">
                <label>Contact</label>
                <p>${payment.tenant.phone || payment.tenant.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Property Details</div>
            <div class="details-grid">
              <div class="detail-item">
                <label>Property</label>
                <p>${payment.unit.property.name}</p>
              </div>
              <div class="detail-item">
                <label>Unit</label>
                <p>${payment.unit.unitNumber}</p>
              </div>
              <div class="detail-item" style="grid-column: span 2;">
                <label>Address</label>
                <p>${payment.unit.property.address}</p>
              </div>
            </div>
          </div>

          <div class="amount-section">
            <div class="amount-label">Amount Paid</div>
            <div class="amount-value">${formatCurrency(payment.amount)}</div>
            <div class="period-badge">Rent for ${periodName}</div>
          </div>

          <div class="section">
            <div class="section-title">Payment Details</div>
            <div class="details-grid">
              <div class="detail-item">
                <label>Payment Method</label>
                <p>${payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1).replace('_', ' ')}</p>
              </div>
              <div class="detail-item">
                <label>Received By</label>
                <p>${receiverName}</p>
              </div>
            </div>
          </div>

          ${payment.notes ? `
          <div class="notes">
            <div class="notes-title">Notes</div>
            ${payment.notes}
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p class="thank-you">Thank you for your payment!</p>
          <p>This is an electronically generated receipt.</p>
          <p>Generated on ${new Date().toLocaleString('en-RW')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    receiptNumber,
    generatedAt,
    payment,
    html
  };
};

// Generate PDF receipt using puppeteer (if available) or html-pdf-node
export const generateReceiptPDF = async (payment: PaymentData): Promise<Buffer | null> => {
  try {
    // Try using puppeteer first (best quality)
    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      const receipt = generateReceipt(payment);
      await page.setContent(receipt.html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });

      await browser.close();
      return pdfBuffer;
    } catch (puppeteerError) {
      // Fallback to html-pdf-node
      try {
        const htmlPdf = require('html-pdf-node');
        const receipt = generateReceipt(payment);

        const file = { content: receipt.html };
        const options = {
          format: 'A4',
          printBackground: true,
          margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        };

        const pdfBuffer = await htmlPdf.generatePdf(file, options);
        return pdfBuffer;
      } catch (htmlPdfError) {
        console.warn('PDF generation libraries not available. Install puppeteer or html-pdf-node');
        return null;
      }
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    return null;
  }
};

export const generateReceiptText = (payment: PaymentData): string => {
  const receiptNumber = generateReceiptNumber(payment.id, payment.paymentDate);
  const periodName = `${MONTH_NAMES[payment.periodMonth - 1]} ${payment.periodYear}`;

  return `
===============================================
                    RENTA
            Property Management
              PAYMENT RECEIPT
===============================================

Receipt #: ${receiptNumber}
Date: ${formatDate(payment.paymentDate)}

-----------------------------------------------
TENANT INFORMATION
-----------------------------------------------
Name: ${payment.tenant.firstName} ${payment.tenant.lastName}
Contact: ${payment.tenant.phone || payment.tenant.email || 'N/A'}

-----------------------------------------------
PROPERTY DETAILS
-----------------------------------------------
Property: ${payment.unit.property.name}
Unit: ${payment.unit.unitNumber}
Address: ${payment.unit.property.address}

-----------------------------------------------
PAYMENT DETAILS
-----------------------------------------------
Amount Paid: ${formatCurrency(payment.amount)}
Period: ${periodName}
Method: ${payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1).replace('_', ' ')}
${payment.notes ? `Notes: ${payment.notes}` : ''}

===============================================
       Thank you for your payment!
===============================================
  `.trim();
};
