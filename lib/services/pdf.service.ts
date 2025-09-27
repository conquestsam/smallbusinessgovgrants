// NEW FILE: PDF generation service for receipts and reports
export class PDFService {
  static generateWithdrawalReceipt(withdrawal: any, user: any) {
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { max-width: 200px; }
          .receipt-info { background: #f8f9fa; padding: 20px; border-radius: 8px; }
          .amount { font-size: 24px; font-weight: bold; color: #005ea2; }
          .footer { margin-top: 40px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://www.sba.gov/themes/custom/sba/dist/img/logo-horizontal.svg" alt="SBA Logo" class="logo">
          <h1>Withdrawal Receipt</h1>
        </div>
        
        <div class="receipt-info">
          <h3>Transaction Details</h3>
          <p><strong>Withdrawal ID:</strong> ${withdrawal.withdrawalId}</p>
          <p><strong>Amount:</strong> <span class="amount">$${withdrawal.amount.toLocaleString()}</span></p>
          <p><strong>Date:</strong> ${new Date(withdrawal.processedAt).toLocaleDateString()}</p>
          <p><strong>Bank:</strong> ${withdrawal.bankName}</p>
          <p><strong>Account:</strong> ****${withdrawal.accountNumber.slice(-4)}</p>
          <p><strong>Status:</strong> Completed</p>
        </div>
        
        <div class="receipt-info" style="margin-top: 20px;">
          <h3>Recipient Information</h3>
          <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Account Holder:</strong> ${withdrawal.accountHolderName}</p>
        </div>
        
        <div class="footer">
          <p>This is an official receipt from the Small Business Administration</p>
          <p>For questions, contact support at support@sba.gov</p>
        </div>
      </body>
      </html>
    `;
    
    return receiptHTML;
  }
}