export class TelegramService {
  private static botToken = process.env.TELEGRAM_BOT_TOKEN;
  private static chatId = process.env.TELEGRAM_CHAT_ID;

  static async sendNotification(message: string) {
    if (!this.botToken || !this.chatId) {
      console.warn('Telegram bot token or chat ID not configured');
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Telegram notification error:', error);
    }
  }

  // Add this method for visitor notifications
  static async sendVisitorNotification(message: string) {
    await this.sendNotification(message);
  }

  // Add this new method for registration notifications
  static async sendRegistrationNotification(userName: string, userEmail: string) {
    const message = `
👤 <b>New User Registration</b>

<b>Name:</b> ${userName}
<b>Email:</b> ${userEmail}
<b>Date:</b> ${new Date().toLocaleString()}

<a href="${process.env.NEXTAUTH_URL}/admin/users">View Users</a>
    `;
    
    await this.sendNotification(message);
  }

  static async sendApplicationNotification(applicationId: string, businessName: string, amount: number) {
    const message = `
🏢 <b>New Grant Application</b>

<b>Application ID:</b> ${applicationId}
<b>Business:</b> ${businessName}
<b>Requested Amount:</b> $${amount.toLocaleString()}

<a href="${process.env.NEXTAUTH_URL}/admin/applications">Review Application</a>
    `;
    
    await this.sendNotification(message);
  }

  static async sendDepositNotification(
    depositId: string,
    userName: string,
    userEmail: string,
    amount: number,
    paymentMethod: string,
    applicationId: string,
    accountDetails: Record<string, any>
  ) {
    const detailLines = Object.entries(accountDetails)
      .filter(([key]) => key !== 'instructions')
      .map(([key, value]) => `<b>${key.replace(/([A-Z])/g, ' $1').trim()}:</b> ${value}`)
      .join('\n');

    const message = `
💳 <b>New Deposit Initiated</b>

<b>User:</b> ${userName} (${userEmail})
<b>Application:</b> ${applicationId}
<b>Amount:</b> $${amount.toLocaleString()}
<b>Method:</b> ${paymentMethod.toUpperCase()}

${detailLines ? `<b>Deposit Details:</b>\n${detailLines}` : ''}

<a href="${process.env.NEXTAUTH_URL}/admin/deposits">Review Deposits</a>
    `;

    await this.sendNotification(message);
  }

  static async sendDepositStatusNotification(
    depositId: string,
    userName: string,
    amount: number,
    paymentMethod: string,
    status: 'approved' | 'rejected',
    adminNotes?: string
  ) {
    const emoji = status === 'approved' ? '✅' : '❌';
    const message = `
${emoji} <b>Deposit ${status.charAt(0).toUpperCase() + status.slice(1)}</b>

<b>User:</b> ${userName}
<b>Amount:</b> $${amount.toLocaleString()}
<b>Method:</b> ${paymentMethod.toUpperCase()}
<b>Status:</b> ${status.toUpperCase()}
${adminNotes ? `<b>Notes:</b> ${adminNotes}` : ''}

<a href="${process.env.NEXTAUTH_URL}/admin/deposits">View Deposits</a>
    `;

    await this.sendNotification(message);
  }

  static async sendReceiptUploadNotification(
    userName: string,
    amount: number,
    paymentMethod: string
  ) {
    const message = `
📎 <b>Receipt Uploaded</b>

<b>User:</b> ${userName}
<b>Amount:</b> $${amount.toLocaleString()}
<b>Method:</b> ${paymentMethod.toUpperCase()}

A deposit receipt has been uploaded and is awaiting review.

<a href="${process.env.NEXTAUTH_URL}/admin/deposits">Review Now</a>
    `;

    await this.sendNotification(message);
  }

  static async sendWithdrawalNotification(
    withdrawalId: string, 
    amount: number, 
    businessName: string,
    userName: string,
    userEmail: string,
    paymentMethod: string,
    accountDetails: Record<string, any>
  ) {
    const detailLines = Object.entries(accountDetails)
      .map(([key, value]) => `<b>${key.replace(/([A-Z])/g, ' $1').trim()}:</b> ${value}`)
      .join('\n');

    const message = `
💰 <b>New Withdrawal Request</b>

<b>Withdrawal ID:</b> ${withdrawalId}
<b>User:</b> ${userName} (${userEmail})
<b>Business:</b> ${businessName}
<b>Amount:</b> $${amount.toLocaleString()}
<b>Method:</b> ${paymentMethod.toUpperCase()}

${detailLines ? `<b>Account Details:</b>\n${detailLines}` : ''}

<a href="${process.env.NEXTAUTH_URL}/admin/withdrawals">Review Withdrawal</a>
    `;
    
    await this.sendNotification(message);
  }
}