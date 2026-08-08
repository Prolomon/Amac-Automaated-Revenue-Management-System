import * as Print from 'expo-print';

export interface ReceiptData {
  reference: string;
  amount: number | string;
  paymentType: 'CARD' | 'CASH' | 'WALLET' | 'DIRECT' | string;
  memberName?: string;
  memberId?: string;
  businessName?: string;
  category?: string;
  narration?: string;
  date?: string;
  status?: string;
  agentName?: string;
  agentId?: string;
  company?: string;
  center?: string;
}

export async function printReceipt(data: ReceiptData): Promise<void> {
  const formattedAmount = Number(data.amount || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedDate = data.date
    ? new Date(data.date).toLocaleString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Payment Receipt</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
            padding: 10px;
            color: #111827;
            font-size: 12px;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .header {
            border-bottom: 2px dashed #94a3b8;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .title {
            font-size: 15px;
            font-weight: bold;
            color: #0ea360;
            margin-bottom: 2px;
          }
          .subtitle {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 10px;
            margin-top: 4px;
            background-color: #dcfce7;
            color: #15803d;
          }
          .section {
            border-bottom: 1px dashed #cbd5e1;
            padding: 8px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .label { color: #64748b; font-size: 11px; }
          .value { font-weight: 600; font-size: 11px; text-align: right; }
          .total-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px;
            margin: 10px 0;
          }
          .total-amount {
            font-size: 18px;
            font-weight: 800;
            color: #0ea360;
          }
          .footer {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px dashed #94a3b8;
            font-size: 9px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <div class="title">AMAC REVENUE MANAGEMENT</div>
          <div class="subtitle">Official Payment Receipt</div>
          <div class="badge">${(data.paymentType || 'PAYMENT').toUpperCase()}</div>
        </div>

        <div class="total-box text-center">
          <div class="label">AMOUNT PAID</div>
          <div class="total-amount">&#8358;${formattedAmount}</div>
          <div class="badge" style="background-color: #dcfce7; color: #15803d;">${(data.status || 'SUCCESSFUL').toUpperCase()}</div>
        </div>

        <div class="section">
          <div class="row">
            <span class="label">Reference:</span>
            <span class="value bold">${data.reference || '-'}</span>
          </div>
          <div class="row">
            <span class="label">Payment Type:</span>
            <span class="value">${(data.paymentType || 'CASH').toUpperCase()}</span>
          </div>
          <div class="row">
            <span class="label">Date & Time:</span>
            <span class="value">${formattedDate}</span>
          </div>
        </div>

        <div class="section">
          ${data.memberName ? `
          <div class="row">
            <span class="label">Payer Name:</span>
            <span class="value">${data.memberName}</span>
          </div>` : ''}
          ${data.memberId ? `
          <div class="row">
            <span class="label">Payer ID:</span>
            <span class="value">${data.memberId}</span>
          </div>` : ''}
          ${data.businessName ? `
          <div class="row">
            <span class="label">Business:</span>
            <span class="value">${data.businessName}</span>
          </div>` : ''}
          ${data.narration || data.category ? `
          <div class="row">
            <span class="label">Description:</span>
            <span class="value">${data.narration || data.category}</span>
          </div>` : ''}
        </div>

        ${data.agentName || data.center ? `
        <div class="section">
          ${data.agentName ? `
          <div class="row">
            <span class="label">Collected By:</span>
            <span class="value">${data.agentName}</span>
          </div>` : ''}
          ${data.center ? `
          <div class="row">
            <span class="label">Revenue Center:</span>
            <span class="value">${data.center}</span>
          </div>` : ''}
        </div>` : ''}

        <div class="footer text-center">
          <p class="bold">Thank you for your payment!</p>
          <p>Keep this receipt for official verification purposes.</p>
          <p>Generated by AMAC Automated Revenue System</p>
        </div>
      </body>
    </html>
  `;

  await Print.printAsync({ html });
}
