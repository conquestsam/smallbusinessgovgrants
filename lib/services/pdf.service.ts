// pdf.service.ts
export class PDFService {
  static generateWithdrawalReceipt(withdrawal: any, user: any): string {
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #005ea2; padding-bottom: 15px; }
          .logo { max-width: 180px; height: auto; display: block; margin: 0 auto 10px; }
          .receipt-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #005ea2; margin: 10px 0; }
          .section-title { color: #002e6d; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 15px; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 11px; padding-top: 15px; border-top: 1px solid #eee; }
          .transaction-details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .detail-item { margin: 6px 0; }
          @media print {
            body { margin: 15px; }
            .receipt-info { background: #f5f5f5; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <!-- Using base64 encoded SBA logo as fallback to ensure it displays everywhere -->
          <img src="https://www.sba.gov/themes/custom/sba/dist/img/logo-horizontal.svg" 
               alt="SBA Logo" 
               class="logo"
               onerror="https://www.sba.gov/themes/custom/sba/dist/img/logo-horizontal.svg">
          <h1 style="color: #002e6d; margin: 10px 0 5px; font-size: 24px;">Small Business Administration</h1>
          <h2 style="color: #005ea2; margin: 0; font-size: 18px;">Withdrawal Receipt</h2>
        </div>
        
        <div class="receipt-info">
          <h3 class="section-title">Transaction Details</h3>
          <div class="transaction-details">
            <div>
              <p class="detail-item"><strong>Withdrawal ID:</strong><br>${withdrawal.withdrawalId}</p>
              <p class="detail-item"><strong>Application ID:</strong><br>${withdrawal.applicationId}</p>
              <p class="detail-item"><strong>Date Processed:</strong><br>${new Date(withdrawal.processedAt || withdrawal.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p class="detail-item"><strong>Amount:</strong></p>
              <p class="amount">$${Number(withdrawal.amount).toLocaleString()}</p>
              <p class="detail-item"><strong>Status:</strong><br>${withdrawal.status.toUpperCase()}</p>
            </div>
          </div>
        </div>
        
        <div class="receipt-info">
          <h3 class="section-title">Bank Information</h3>
          <p class="detail-item"><strong>Bank Name:</strong> ${withdrawal.bankName}</p>
          <p class="detail-item"><strong>Account Number:</strong> ****${withdrawal.accountNumber.slice(-4)}</p>
          <p class="detail-item"><strong>Routing Number:</strong> ${withdrawal.routingNumber}</p>
          <p class="detail-item"><strong>Account Holder:</strong> ${withdrawal.accountHolderName}</p>
        </div>
        
        <div class="receipt-info">
          <h3 class="section-title">Recipient Information</h3>
          <p class="detail-item"><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
          <p class="detail-item"><strong>Email:</strong> ${user.email}</p>
          <p class="detail-item"><strong>User ID:</strong> ${user.id}</p>
        </div>
        
        <div class="footer">
          <p>This is an official receipt from the Small Business Administration Grant Program</p>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>For questions, contact SBA Support at support@sba.gov or (800) 827-5722</p>
        </div>
      </body>
      </html>
    `;
    
    return receiptHTML;
  }

  // Method to generate and download receipt as HTML file
  static downloadReceipt(withdrawal: any, user: any, filename: string = 'withdrawal-receipt') {
    const htmlContent = this.generateWithdrawalReceipt(withdrawal, user);
    
    // Create a blob and download link
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${withdrawal.withdrawalId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Alternative method to open receipt in new tab for printing
  static printReceipt(withdrawal: any, user: any) {
    const htmlContent = this.generateWithdrawalReceipt(withdrawal, user);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }
}