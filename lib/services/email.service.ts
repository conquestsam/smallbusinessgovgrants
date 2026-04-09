import { Resend } from 'resend';

export interface RegistrationEmailData {
  name: string
  email: string
  isSuccess: boolean
  errorMessage?: string
  appUrl?: string
}

export interface PasswordResetEmailData {
  name: string
  email: string
  temporaryPassword: string
  appUrl?: string
}

export interface ApplicationStatusEmailData {
  name: string
  email: string
  applicationNumber: string
  status: 'submitted' | 'under_review' | 'approved' | 'rejected'
  requestedAmount: number
  approvedAmount?: number
  rejectionReason?: string
  submissionDate: string
  appUrl?: string
}

export interface ApprovalNotificationEmailData {
  name: string
  email: string
  applicationId: string
  requestedAmount: number
  approvedAmount: number
  GrantPurpose: string
  repaymentTerm: number
  approvalDate: string
  availableForWithdrawal: number
  appUrl?: string
}

// NEW: Withdrawal Status Email Data Interface
export interface WithdrawalStatusEmailData {
  name: string
  email: string
  withdrawalId: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  paymentMethod: string
  processedAt: string
  notes?: string
  appUrl?: string
}

// NEW: Account Status Change Email Data
export interface AccountStatusEmailData {
  name: string
  email: string
  status: 'disabled' | 'enabled' | 'deactivated' | 'deleted'
  reason: string
  appUrl?: string
}

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {

  private static getAppUrl(): string {
    const url = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sbagovgrants.com';
    // Ensure URL always has a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  /** Debug helper — logs Resend config on first call */
  private static logEmailConfig() {
    const hasKey = !!process.env.RESEND_API_KEY;
    console.log(`[EmailService] RESEND_API_KEY present: ${hasKey}, APP_URL: ${this.getAppUrl()}`);
  }
  // NEW: Account Status Change Notification
  static async sendAccountStatusEmail(data: AccountStatusEmailData) {
    const appUrl = data.appUrl || this.getAppUrl();
    const baseStyles = this.getBaseEmailStyles();

    const statusConfig: Record<string, { title: string; color: string; bgColor: string }> = {
      disabled: { title: 'Account Temporarily Disabled', color: '#dc2626', bgColor: '#fef2f2' },
      enabled: { title: 'Account Re-Enabled', color: '#16a34a', bgColor: '#f0fdf4' },
      deactivated: { title: 'Account Deactivated', color: '#d97706', bgColor: '#fffbeb' },
      deleted: { title: 'Account Removed', color: '#dc2626', bgColor: '#fef2f2' },
    };

    const config = statusConfig[data.status] || statusConfig.disabled;

    const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${config.title}</title>
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="outline:none">
            <img 
              src="https://res.cloudinary.com/dt0xkqrvk/image/upload/v1757413998/download_k3vbjl.png"
              alt="SBA Grant Platform Logo"
              style="height: 80px; width: auto; margin-bottom: 16px; background-color: white; padding: 8px 16px; border-radius: 8px; display: block; max-width: 100%;"
            />
          </div>

          <div class="content">
            <div style="margin-bottom: 32px;">
              <p style="font-size: 18px; color: #374151;">Dear ${data.name},</p>
            </div>

            <div style="background-color: ${config.bgColor}; border-left: 4px solid ${config.color}; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="font-size: 18px; font-weight: bold; color: ${config.color}; margin-bottom: 8px;">${config.title}</h3>
              <p style="color: #374151; font-style: italic; margin: 0;">
                <em>${data.reason}</em>
              </p>
            </div>

            ${data.status === 'enabled' ? `
              <div style="text-align: center; margin-top: 32px;">
                <a href="${appUrl}/login" style="display: inline-block; background: #1e293b; color: white; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 18px;">
                  Log In to Your Account
                </a>
              </div>
            ` : `
              <p style="font-size: 16px; color: #64748b;">
                If you believe this action was taken in error, please contact our support team for assistance.
              </p>
            `}

            <div style="margin-top: 48px; text-align: center;">
              <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>Office of Disaster Assistance</em></p>
              <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>U.S. Small Business Administration.</em></p>
            </div>

            <div style="margin-top: 32px; text-align: center;">
              <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>Our address:</em></p>
              <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>409 3rd St., SW Washington, DC 20416</em></p>
            </div>
          </div>

          <div class="footer">
            <p style="font-size: 12px; margin-top: 16px; color: #6b7280;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>`;

    try {
      await resend.emails.send({
        from: 'SBA Grant System <noreply@notifications.sbasmallbusinessgrants.com>',
        to: data.email,
        subject: `Account Update — ${config.title}`,
        html,
      });
      console.log(`Account status email sent to ${data.email}: ${data.status}`);
    } catch (error) {
      console.error('Account status email error:', error);
    }
  }

  // NEW: Withdrawal Status Email Method
  static async sendWithdrawalStatusEmail(data: WithdrawalStatusEmailData) {
    const appUrl = data.appUrl || this.getAppUrl();
    const html = this.generateWithdrawalStatusEmailHTML(data, appUrl);
    
    try {
      await resend.emails.send({
        from: 'SBA Grant System <noreply@notifications.sbasmallbusinessgrants.com>',
        to: data.email,
        subject: `Withdrawal ${data.withdrawalId} Status Update`,
        html: html
      });
      console.log('Withdrawal status email sent successfully to:', data.email);
    } catch (error) {
      console.error('Withdrawal status email send error:', error);
      throw error; // Re-throw to handle in the calling function
    }
  }

  static async sendApplicationStatusEmail(data: ApplicationStatusEmailData) {
    const appUrl = data.appUrl || this.getAppUrl();
    const html = this.generateApplicationStatusEmailHTML(data, appUrl);
    
    try {
      await resend.emails.send({
        from: 'SBA Grant System <noreply@notifications.sbasmallbusinessgrants.com>',
        to: data.email,
        subject: `Application ${data.applicationNumber} Status Update`,
        html: html
      });
      console.log('Status email sent successfully to:', data.email);
    } catch (error) {
      console.error('Status email send error:', error);
    }
  }

  static async sendRegistrationEmail(data: RegistrationEmailData) { 
    this.logEmailConfig();
    const baseStyles = this.getBaseEmailStyles()
    const appUrl = data.appUrl || this.getAppUrl()
    
    try {
      await resend.emails.send({
        from: 'SBA Grant System <noreply@notifications.sbasmallbusinessgrants.com>',
        to: data.email,
        subject: `Welcome to SBA Grant Portal - Account Created Successfully!`,
        html: `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.isSuccess ? 'Welcome to SBA Grant Portal!' : 'Registration Issue - SBA Grant Portal'}</title>
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header" style="outline:none">
              <img 
                src="https://res.cloudinary.com/dt0xkqrvk/image/upload/v1757413998/download_k3vbjl.png"
                alt="SBA Grant Platform Logo"
                style="height: 80px; width: auto; margin-bottom: 16px; background-color: white; padding: 8px 16px; border-radius: 8px; display: block; max-width: 100%;"
              />
            </div>

            <div class="content">
              ${data.isSuccess ? `
                <div style="margin-bottom: 32px;">
                  <p style="font-size: 18px; color: #374151;">Dear, ${data.name}</p>
                </div>

                <div style="space-y: 24px; color: #374151; line-height: 1.6;">
                  <p style="font-size: 18px; font-style: italic; margin-bottom: 20px;">
                    <em>Welcome to the SBA Grant Portal! Your account has been successfully created and is now ready for use.</em>
                  </p>

                  <p style="font-size: 18px; font-style: italic; margin-bottom: 20px;">
                    <em>You can now access your dashboard and begin your grant application. Our secure and user-friendly platform will guide you through each step.</em>
                  </p>

                  <p style="font-size: 18px; font-style: italic; margin-bottom: 20px;">
                    <em>Please log in to your dashboard to start your grant application and upload all required documents.</em>
                  </p>

                  <p style="font-size: 20px; font-weight: bold; color: #1f2937; margin-top: 32px;">
                    <strong>Thank you for joining us and best wishes for your application process.</strong>
                  </p>
                </div>

                <div style="margin-top: 48px; text-align: center; space-y: 24px;">
                  <div style="margin-top: 32px;">
                    <a href="${appUrl}/dashboard" style="display: inline-block; background: #1e293b; color: white; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 18px;">
                      Access Your Dashboard
                    </a>
                  </div>
                  
                  <div style="padding-top: 32px; space-y: 8px;">
                    <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>Office of Disaster Assistance</em></p>
                    <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>U.S. Small Business Administration.</em></p>
                  </div>
                </div>

                <div style="margin-top: 48px; text-align: center; space-y: 8px;">
                  <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>Our address:</em></p>
                  <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>409 3rd St., SW Washington, DC 20416</em></p>
                </div>
              ` : `
                <div style="margin-bottom: 32px;">
                  <p style="font-size: 18px; color: #374151;">Dear, ${data.name}</p>
                </div>

                <div style="space-y: 24px; color: #374151; line-height: 1.6;">
                  <p style="font-size: 18px; font-style: italic;">
                    We encountered an issue while processing your SBA Grant application for <span style="font-weight: bold; font-style: normal;">${data.email}</span>.
                  </p>

                  <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 24px; border-radius: 8px;">
                    <h3 style="font-size: 18px; font-weight: bold; color: #dc2626; margin-bottom: 8px;">Registration Issue</h3>
                    <p style="color: #991b1b; font-style: italic; margin: 0;">
                    ${data.errorMessage || 'An unexpected error occurred during registration.'}
                    </p>
                  </div>

                  <p style="font-size: 18px; font-style: italic;">
                    Please try registering again or contact our support team if the issue persists. We apologize for any inconvenience this may cause.
                  </p>

                  <div style="text-align: center; margin-top: 32px;">
                    <a href="${appUrl}/register" style="display: inline-block; background: #1e293b; color: white; padding: 12px 32px; border-radius: 8px; font-weight: 600; text-decoration: none;">
                      Try Again
                    </a>
                  </div>
                </div>
              `}
            </div>

            <div class="footer">
              <p style="font-size: 18px; font-style: italic; color: #4b5563; margin-bottom: 16px;">
                <em>Want to change how you receive our commercial emails?</em>
              </p>
              <a href="#" style="font-size: 18px; font-style: italic; color: #3b82f6; text-decoration: underline; display: block; margin-bottom: 16px;">
                <em>Unsubscribe from this list.</em>
              </a>
              <div style="padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <a href="#" style="font-size: 18px; font-weight: bold; color: #374151; font-style: italic; text-decoration: none;">
                  <em><strong>Privacy Policy.</strong></em>
                </a>
              </div>
              <p style="font-size: 12px; margin-top: 16px; color: #6b7280;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>`,
      });
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  static async sendPasswordResetEmail(
  email: string, 
  name: string, 
  temporaryPassword: string
) {
  const baseStyles = this.getBaseEmailStyles();
  const appUrl = this.getAppUrl();
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - SBA Grant Portal</title>
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="outline:none">
            <img 
              src="https://res.cloudinary.com/dt0xkqrvk/image/upload/v1757413998/download_k3vbjl.png"
              alt="SBA Grant Platform Logo"
              style="height: 80px; width: auto; margin-bottom: 16px; background-color: white; padding: 8px 16px; border-radius: 8px; display: block; max-width: 100%;"
            />
          </div>

          <div class="content">
            <div style="margin-bottom: 32px;">
              <p style="font-size: 18px; color: #374151;">Dear ${name},</p>
            </div>

            <div style="space-y: 24px; color: #374151; line-height: 1.6;">
              <p style="font-size: 18px; font-style: italic; margin-bottom: 20px;">
                <em>Your password has been reset by an administrator. Please use the temporary password below to log in to your account.</em>
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 12px;">Your Temporary Password</h3>
                <p style="font-size: 24px; font-weight: bold; color: #0a0791; font-family: monospace; letter-spacing: 2px; text-align: center; background: #f1f5f9; padding: 16px; border-radius: 4px; margin: 0;">
                  ${temporaryPassword}
                </p>
              </div>

              <p style="font-size: 16px; color: #64748b;">
                <strong>Important:</strong> For security reasons, please change your password immediately after logging in.
              </p>

              <p style="font-size: 18px; font-style: italic; margin-bottom: 20px;">
                <em>If you did not request this password reset, please contact our support team immediately.</em>
              </p>
            </div>

            <div style="margin-top: 48px; text-align: center; space-y: 24px;">
              <div style="margin-top: 32px;">
                <a href="${appUrl}/login" style="display: inline-block; background: #1e293b; color: white; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 18px;">
                  Log In to Your Account
                </a>
              </div>
              
              <div style="padding-top: 32px; space-y: 8px;">
                <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>Office of Disaster Assistance</em></p>
                <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>U.S. Small Business Administration.</em></p>
              </div>
            </div>

            <div style="margin-top: 48px; text-align: center; space-y: 8px;">
              <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>Our address:</em></p>
              <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>409 3rd St., SW Washington, DC 20416</em></p>
            </div>
          </div>

          <div class="footer">
            <p style="font-size: 18px; font-style: italic; color: #4b5563; margin-bottom: 16px;">
              <em>Want to change how you receive our commercial emails?</em>
            </p>
            <a href="#" style="font-size: 18px; font-style: italic; color: #3b82f6; text-decoration: underline; display: block; margin-bottom: 16px;">
              <em>Unsubscribe from this list.</em>
            </a>
            <div style="padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <a href="#" style="font-size: 18px; font-weight: bold; color: #374151; font-style: italic; text-decoration: none;">
                <em><strong>Privacy Policy.</strong></em>
              </a>
            </div>
            <p style="font-size: 12px; margin-top: 16px; color: #6b7280;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  try {
    await resend.emails.send({
      from: 'SBA Grant System <noreply@notifications.sbasmallbusinessgrants.com>',
      to: email,
      subject: 'Password Reset - SBA Grant Portal',
      html
    });
    console.log('Password reset email sent successfully to:', email);
  } catch (error) {
    console.error('Password reset email send error:', error);
    throw error;
  }
}
  

  // Add to EmailService class in email.service.ts
static async sendNewsletter(to: string, name: string, subject: string, content: string) {
  const baseStyles = this.getBaseEmailStyles();
  const appUrl = this.getAppUrl();
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="outline:none">
            <img 
              src="https://res.cloudinary.com/dt0xkqrvk/image/upload/v1757413998/download_k3vbjl.png"
              alt="SBA Grant Platform Logo"
              style="height: 80px; width: auto; margin-bottom: 16px; background-color: white; padding: 8px 16px; border-radius: 8px; display: block; max-width: 100%;"
            />
          </div>

          <div class="content">
            <div style="margin-bottom: 32px;">
              <p style="font-size: 18px; color: #374151;">Dear ${name},</p>
            </div>

            <div style="space-y: 24px; color: #374151; line-height: 1.6;">
              ${content}
            </div>

            <div style="margin-top: 48px; text-align: center; space-y: 24px;">
              <div style="margin-top: 32px;">
                <a href="${appUrl}/dashboard" style="display: inline-block; background: #1e293b; color: white; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 18px;">
                  Access Your Dashboard
                </a>
              </div>
              
              <div style="padding-top: 32px; space-y: 8px;">
                <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>Office of Disaster Assistance</em></p>
                <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>U.S. Small Business Administration.</em></p>
              </div>
            </div>

            <div style="margin-top: 48px; text-align: center; space-y: 8px;">
              <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>Our address:</em></p>
              <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>409 3rd St., SW Washington, DC 20416</em></p>
            </div>
          </div>

          <div class="footer">
            <p style="font-size: 18px; font-style: italic; color: #4b5563; margin-bottom: 16px;">
              <em>Want to change how you receive our commercial emails?</em>
            </p>
            <a href="#" style="font-size: 18px; font-style: italic; color: #3b82f6; text-decoration: underline; display: block; margin-bottom: 16px;">
              <em>Unsubscribe from this list.</em>
            </a>
            <div style="padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <a href="#" style="font-size: 18px; font-weight: bold; color: #374151; font-style: italic; text-decoration: none;">
                <em><strong>Privacy Policy.</strong></em>
              </a>
            </div>
            <p style="font-size: 12px; margin-top: 16px; color: #6b7280;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  try {
    await resend.emails.send({
      from: 'SBA Grant System <noreply@notifications.sbasmallbusinessgrants.com>',
      to,
      subject,
      html
    });
    console.log('Newsletter email sent successfully to:', to);
  } catch (error) {
    console.error('Newsletter email send error:', error);
    throw error;
  }
}

  static async sendApplicationApproval(to: string, data: ApprovalNotificationEmailData, appUrl: string) {
    const baseStyles = this.getBaseEmailStyles()
    const formatGrantPurpose = (purpose: string) => {
      return purpose.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    const formattedPurpose = formatGrantPurpose(data.GrantPurpose);
    try {
      await resend.emails.send({
        from: 'SBA Grant System <noreply@notifications.sbasmallbusinessgrants.com>',
        to,
        subject: `Grant Application ${data.applicationId} Approved`,
        html: `
          <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SBA Grant Application Approval Letter</title>
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header" style="outline:none">
              <img 
                src="https://res.cloudinary.com/dt0xkqrvk/image/upload/v1757413998/download_k3vbjl.png"
                alt="SBA Grant Platform Logo"
                style="height: 120px; width: auto; margin-bottom: 24px; display: block; max-width: 100%; object-fit: contain;"
              />
            </div>

            <div class="content">
              <div style="margin-bottom: 32px;">
                <p style="font-size: 18px;">Dear, ${data.name}</p>
              </div>

              <div style="space-y: 24px; color: #374151; line-height: 1.6;">
                <p style="font-size: 18px; font-style: italic; margin-bottom: 20px;">
                  <em>Congratulations! We are pleased to inform you that your application for <strong>${formattedPurpose}</strong> has been approved, and you have been awarded a grant in the amount of $${data.approvedAmount.toLocaleString()}. Additionally, all your submitted documents have been successfully received and reviewed, marking an important milestone in your grant process.</em>
                </p>

                <p style="font-size: 18px; font-style: italic; margin-bottom: 20px;">
                  <em>To proceed further, please contact your assigned grant officer at your earliest convenience to arrange the payment of the acceptance fee of $400. This fee is required to finalize your grant acceptance. Moreover, kindly provide your bank account details, including your account number and routing number, to facilitate the prompt transfer of the funds.</em>
                </p>

                <p style="font-size: 20px; font-weight: bold; color: #1f2937; margin-top: 32px;">
                  <strong>Congratulations</strong>
                </p>
              </div>

              <div style="margin-top: 48px; text-align: center; space-y: 24px;">
                <p style="font-size: 16px; font-style: italic; color: #4b5563;"><em>Application ID</em></p>
                
                <p style="font-size: 28px; font-weight: bold; color: #1e293b; letter-spacing: 0.1em; font-family: monospace; margin: 16px 0;">
                  ${data.applicationId}
                </p>
                
                <div style="padding-top: 24px; space-y: 8px;">
                  <p style="font-size: 16px; font-style: italic; color: #4b5563;"><em>Office of Disaster Assistance</em></p>
                  <p style="font-size: 16px; font-style: italic; color: #4b5563;"><em>U.S. Small Business Administration.</em></p>
                </div>
              </div>

              <div style="margin-top: 32px; text-align: center; space-y: 8px;">
                <p style="font-size: 16px; font-style: italic; color: #4b5563;"><em>Our address:</em></p>
                <p style="font-size: 16px; font-style: italic; color: #4b5563;"><em>409 3rd St., SW Washington, DC 20416</em></p>
              </div>
            </div>

            <div class="footer">
              <p style="font-size: 16px; font-style: italic; color: #4b5563; margin-bottom: 16px;">
                <em>Want to change how you receive our commercial emails?</em>
              </p>
              <a href="#" style="font-size: 16px; font-style: italic; color: #3b82f6; text-decoration: underline; display: block; margin-bottom: 16px;">
                <em>Unsubscribe from this list.</em>
              </a>
              <div style="padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <a href="#" style="font-size: 16px; font-weight: bold; color: #374151; font-style: italic; text-decoration: none;">
                  <em><strong>Privacy Policy</strong></em>
                </a>
              </div>
              <p style="font-size: 12px; margin-top: 16px; color: #6b7280;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
        `,
      });
    } catch (error) {
      console.error('Email send error:', error);
    }
  }

  // NEW: Withdrawal Status Email HTML Generator
  private static generateWithdrawalStatusEmailHTML(data: WithdrawalStatusEmailData, appUrl: string): string {
    const baseStyles = this.getBaseEmailStyles()
    
    const getStatusInfo = () => {
      switch (data.status) {
        case 'approved':
          return {
            title: 'Withdrawal Successful',
            message: 'Your withdrawal request is successful.',
            badgeClass: 'status-success',
            buttonText: 'View Dashboard',
            buttonClass: 'button button-success'
          }
        case 'rejected':
          return {
            title: 'Withdrawal Request Update Required',
            message: 'Your withdrawal request requires attention. Please review the feedback below.',
            badgeClass: 'status-danger',
            buttonText: 'Contact Support',
            buttonClass: 'button button-danger'
          }
        case 'processed':
          return {
            title: 'Withdrawal Processed Successfully',
            message: 'Your withdrawal has been processed and funds have been transferred.',
            badgeClass: 'status-success',
            buttonText: 'View Dashboard',
            buttonClass: 'button button-success'
          }
        default:
          return {
            title: 'Withdrawal Update',
            message: 'There has been an update to your withdrawal request.',
            badgeClass: 'status-warning',
            buttonText: 'View Dashboard',
            buttonClass: 'button'
          }
      }
    }

    const statusInfo = getStatusInfo()

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SBA Withdrawal Status Update</title>
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header" style="outline:none">
              <img 
                src="https://res.cloudinary.com/dt0xkqrvk/image/upload/v1757413998/download_k3vbjl.png"
                alt="SBA Grant Platform Logo"
                style="height: 120px; width: auto; margin-bottom: 24px; display: block; max-width: 100%; object-fit: contain;"
              />
            </div>

            <div class="content">
              <div style="margin-bottom: 32px;">
                <p style="font-size: 18px;">Dear, ${data.name}</p>
              </div>

              <div style="space-y: 24px; color: #374151; line-height: 1.6;">
                <p style="font-size: 18px; font-style: italic; margin-bottom: 20px;">
                  <em>${statusInfo.message}</em>
                </p>

                <div class="info-card">
                  <h3>Withdrawal Details</h3>
                  <div class="info-row">
                    <span class="info-label">Withdrawal ID:</span>
                    <span class="info-value">${data.withdrawalId}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Amount:</span>
                    <span class="info-value">$${data.amount.toLocaleString()}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Payment Method:</span>
                    <span class="info-value">${data.paymentMethod}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="status-badge ${statusInfo.badgeClass}">${data.status.toUpperCase()}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Processed:</span>
                    <span class="info-value">${new Date(data.processedAt).toLocaleString()}</span>
                  </div>
                </div>

                ${data.notes ? `
                  <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 24px; border-radius: 8px;">
                    <h3 style="font-size: 18px; font-weight: bold; color: #dc2626; margin-bottom: 8px;">Admin Notes</h3>
                    <p style="color: #991b1b; font-style: italic; margin: 0;">${data.notes}</p>
                  </div>
                ` : ''}

                ${data.status === 'rejected' ? `
                  <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 24px; border-radius: 8px;">
                    <h3 style="font-size: 18px; font-weight: bold; color: #dc2626; margin-bottom: 8px;">Next Steps</h3>
                    <p style="color: #991b1b; font-style: italic; margin: 0;">
                      Please contact our support team to resolve any issues with your withdrawal request. We're here to help you complete the process successfully.
                    </p>
                  </div>
                ` : ''}

                <div style="text-align: center; margin-top: 32px;">
                  <a href="${appUrl}/dashboard" class="${statusInfo.buttonClass}">
                    ${statusInfo.buttonText}
                  </a>
                </div>
              </div>

              <div style="margin-top: 48px; text-align: center; space-y: 8px;">
                <p style="font-size: 16px; font-style: italic; color: #4b5563;"><em>Office of Disaster Assistance</em></p>
                <p style="font-size: 16px; font-style: italic; color: #4b5563;"><em>U.S. Small Business Administration.</em></p>
              </div>

              <div style="margin-top: 32px; text-align: center; space-y: 8px;">
                <p style="font-size: 16px; font-style: italic; color: #4b5563;"><em>Our address:</em></p>
                <p style="font-size: 16px; font-style: italic; color: #4b5563;"><em>409 3rd St., SW Washington, DC 20416</em></p>
              </div>
            </div>

            <div class="footer">
              <p style="font-size: 16px; font-style: italic; color: #4b5563; margin-bottom: 16px;">
                <em>Want to change how you receive our commercial emails?</em>
              </p>
              <a href="#" style="font-size: 16px; font-style: italic; color: #3b82f6; text-decoration: underline; display: block; margin-bottom: 16px;">
                <em>Unsubscribe from this list.</em>
              </a>
              <div style="padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <a href="#" style="font-size: 16px; font-weight: bold; color: #374151; font-style: italic; text-decoration: none;">
                  <em><strong>Privacy Policy</strong></em>
                </a>
              </div>
              <p style="font-size: 12px; margin-top: 16px; color: #6b7280;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private static generateApplicationStatusEmailHTML(data: ApplicationStatusEmailData, appUrl: string): string {
    const baseStyles = this.getBaseEmailStyles()
    const submissionDate = new Date(data.submissionDate)
    const deadline = new Date(submissionDate)
    deadline.setDate(deadline.getDate() + 3)
    const formattedDeadline = deadline.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    const getStatusInfo = () => {
      switch (data.status) {
        case 'submitted':
          return {
            title: 'Application Submitted Successfully',
            message: 'Your Grant application has been received and is being processed.',
            badgeClass: 'status-success',
            buttonText: 'Track Application',
            buttonClass: 'button'
          }
        case 'under_review':
          return {
            title: 'Application Under Review',
            message: 'Our team is currently reviewing your Grant application.',
            badgeClass: 'status-warning',
            buttonText: 'View Status',
            buttonClass: 'button'
          }
        case 'approved':
          return {
            title: 'Congratulations! Application Approved',
            message: 'Your Grant application has been approved. You can now request fund withdrawal.',
            badgeClass: 'status-success',
            buttonText: 'Access Funds',
            buttonClass: 'button button-success'
          }
        case 'rejected':
          return {
            title: 'Application Update Required',
            message: 'Your Grant application requires attention. Please review the feedback below.',
            badgeClass: 'status-danger',
            buttonText: 'View Details',
            buttonClass: 'button'
          }
        default:
          return {
            title: 'Application Update',
            message: 'There has been an update to your Grant application.',
            badgeClass: 'status-warning',
            buttonText: 'View Application',
            buttonClass: 'button'
          }
      }
    }

    const statusInfo = getStatusInfo()

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SBA Grant Application Confirmation Letter</title>
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header" style="outline:none">
              <img 
                src="https://res.cloudinary.com/dt0xkqrvk/image/upload/v1757413998/download_k3vbjl.png"
                alt="SBA Grant Platform Logo"
                style="height: 120px; width: auto; margin-bottom: 24px; display: block; max-width: 100%; object-fit: contain;"
              />
            </div>

            <div class="content">
              <div style="margin-bottom: 32px;">
                <p style="font-size: 18px;">Dear, ${data.name}</p>
              </div>

              <div style="space-y: 24px; color: #374151; line-height: 1.6;">
                <p style="font-size: 18px; font-style: italic; margin-bottom: 20px;">
                  <em>Congratulations on your application for the SBA Grant! We are thrilled to have the opportunity to review your submission and explore the possibility of funding your future endeavors.</em>
                </p>

                <p style="font-size: 18px; font-style: italic; margin-bottom: 20px;">
                  <em>Your SBA Application No. <span style="font-weight: bold; font-style: normal;">${data.applicationNumber}</span> is now ready for the next step in the process. Upon receipt of all the supporting documents, your application will be automatically submitted for further evaluation.</em>
                </p>

                <p style="font-size: 18px; font-style: italic; margin-bottom: 20px;">
                  <em>To proceed, please ensure that you complete the small business disaster assistance grant and submit all required tax forms via email. It is imperative that these materials reach us on or before <span style="font-weight: bold; font-style: normal;">${formattedDeadline}</span>, to avoid any delays in processing your application.</em>
                </p>

                <p style="font-size: 20px; font-weight: bold; color: #1f2937; margin-top: 32px;">
                  <strong>Thank you for your cooperation and best wishes for your continued success.</strong>
                </p>
              </div>

              <div style="margin-top: 48px; text-align: center; space-y: 24px;">
                <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>Application ID</em></p>
                
                <p style="font-size: 36px; font-weight: bold; color: #1e293b; letter-spacing: 0.1em; font-family: monospace; margin: 24px 0;">
                  ${data.applicationNumber}
                </p>
                
                <div style="padding-top: 32px; space-y: 8px;">
                  <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>Office of Disaster Assistance</em></p>
                  <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>U.S. Small Business Administration.</em></p>
                </div>
              </div>

              <div style="margin-top: 48px; text-align: center; space-y: 8px;">
                <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>Our address:</em></p>
                <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>409 3rd St., SW Washington, DC 20416</em></p>
              </div>
            </div>

            <div class="footer">
              <p style="font-size: 18px; font-style: italic; color: #4b5563; margin-bottom: 16px;">
                <em>Want to change how you receive our commercial emails?</em>
              </p>
              <a href="#" style="font-size: 18px; font-style: italic; color: #3b82f6; text-decoration: underline; display: block; margin-bottom: 16px;">
                <em>Unsubscribe from this list.</em>
              </a>
              <div style="padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <a href="#" style="font-size: 18px; font-weight: bold; color: #374151; font-style: italic; text-decoration: none;">
                  <em><strong>Privacy Policy</strong></em>
                </a>
              </div>
              <p style="font-size: 12px; margin-top: 16px; color: #6b7280;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  // Deposit Status Email — notifies user when their deposit is approved or rejected
  static async sendDepositStatusEmail(data: {
    name: string;
    email: string;
    depositAmount: number;
    paymentMethod: string;
    status: 'approved' | 'rejected';
    adminNotes?: string;
  }) {
    const appUrl = this.getAppUrl();
    const baseStyles = this.getBaseEmailStyles();
    const isApproved = data.status === 'approved';

    const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deposit ${isApproved ? 'Approved' : 'Rejected'}</title>
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="outline:none">
            <img 
              src="https://res.cloudinary.com/dt0xkqrvk/image/upload/v1757413998/download_k3vbjl.png"
              alt="SBA Grant Platform Logo"
              style="height: 80px; width: auto; margin-bottom: 16px; background-color: white; padding: 8px 16px; border-radius: 8px; display: block; max-width: 100%;"
            />
          </div>

          <div class="content">
            <div style="margin-bottom: 32px;">
              <p style="font-size: 18px; color: #374151;">Dear ${data.name},</p>
            </div>

            <div style="background-color: ${isApproved ? '#f0fdf4' : '#fef2f2'}; border-left: 4px solid ${isApproved ? '#16a34a' : '#dc2626'}; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="font-size: 18px; font-weight: bold; color: ${isApproved ? '#16a34a' : '#dc2626'}; margin-bottom: 8px;">
                Deposit ${isApproved ? 'Approved ✅' : 'Rejected ❌'}
              </h3>
              <p style="color: #374151; margin: 0;">
                ${isApproved
                  ? `Your $${data.depositAmount.toLocaleString()} deposit via <strong>${data.paymentMethod}</strong> has been verified and approved. Your grant application is now being processed.`
                  : `Your $${data.depositAmount.toLocaleString()} deposit via <strong>${data.paymentMethod}</strong> was rejected.${data.adminNotes ? ` Reason: ${data.adminNotes}` : ' Please contact support for more details.'}`
                }
              </p>
            </div>

            <div class="info-card">
              <h3>Deposit Details</h3>
              <div class="info-row">
                <span class="info-label">Amount:</span>
                <span class="info-value">$${data.depositAmount.toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Method:</span>
                <span class="info-value">${data.paymentMethod}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="status-badge ${isApproved ? 'status-success' : 'status-danger'}">${data.status.toUpperCase()}</span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 32px;">
              <a href="${appUrl}/dashboard" style="display: inline-block; background: #1e293b; color: white; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 18px;">
                View Dashboard
              </a>
            </div>

            <div style="margin-top: 48px; text-align: center;">
              <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>Office of Disaster Assistance</em></p>
              <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>U.S. Small Business Administration.</em></p>
            </div>

            <div style="margin-top: 32px; text-align: center;">
              <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>Our address:</em></p>
              <p style="font-size: 18px; font-style: italic; color: #4b5563;"><em>409 3rd St., SW Washington, DC 20416</em></p>
            </div>
          </div>

          <div class="footer">
            <p style="font-size: 12px; margin-top: 16px; color: #6b7280;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>`;

    try {
      await resend.emails.send({
        from: 'SBA Grant System <noreply@notifications.sbasmallbusinessgrants.com>',
        to: data.email,
        subject: `Deposit ${isApproved ? 'Approved' : 'Rejected'} — SBA Grant Portal`,
        html,
      });
      console.log(`Deposit status email sent to ${data.email}: ${data.status}`);
    } catch (error) {
      console.error('Deposit status email error:', error);
    }
  }

  static async sendWithdrawalSuccess(to: string, withdrawalId: string, amount: number) {
    try {
      await resend.emails.send({
        from: 'SBA Grant System <noreply@notifications.sbasmallbusinessgrants.com>',
        to,
        subject: `Withdrawal ${withdrawalId} Processed Successfully`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div class="header" style="outline:none">
              <img 
                src="https://res.cloudinary.com/dt0xkqrvk/image/upload/v1757413998/download_k3vbjl.png"
                alt="SBA Grant Platform Logo"
                style="height: 120px; width: auto; margin-bottom: 24px; display: block; max-width: 100%; object-fit: contain;"
              />
            </div>
            <div style="padding: 20px;">
              <p>Your withdrawal request <strong>${withdrawalId}</strong> has been processed successfully.</p>
              <p><strong>Amount:</strong> $${amount.toLocaleString()}</p>
              <p>The funds have been deposited to your registered bank account.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard/withdrawals" 
                   style="background: #005ea2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">
                  View Withdrawal History
                </a>
              </div>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error('Email send error:', error);
    }
  }

  static async sendNewsletterToAllUsers(subject: string, content: string, users: string[]) {
    try {
      const promises = users.map(email => 
        resend.emails.send({
          from: 'SBA Grant System <noreply@sba.gov>',
          to: email,
          subject,
          html: content,
        })
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Newsletter send error:', error);
    }
  }

  private static getBaseEmailStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #374151;
        background-color: #f9fafb;
      }
      
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .header {
        color: white;
        padding: 32px 24px;
        text-align: center;
      }
      
      .logo {
        height: 48px;
        margin-bottom: 16px;
        background-color: white;
        padding: 8px 16px;
        border-radius: 8px;
        display: inline-block;
      }
      
      .header h1 {
        font-size: 28px;
        font-weight: 700;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .content {
        padding: 32px 24px;
      }
      
      .content h2 {
        font-size: 24px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 16px;
      }
      
      .content p {
        margin-bottom: 16px;
        color: #4b5563;
        font-size: 16px;
      }
      
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        text-decoration: none;
        padding: 14px 28px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        text-align: center;
        margin: 16px 0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
      }
      
      .button:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
      }
      
      .button-success {
        background: linear-gradient(135deg, #0a0791ff 0%, #0a0791ff 100%);
      }
      
      .button-danger {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }
      
      .info-card {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
      }
      
      .info-card h3 {
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 12px;
      }
      
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .info-row:last-child {
        border-bottom: none;
      }
      
      .info-label {
        font-weight: 500;
        color: #64748b;
      }
      
      .info-value {
        font-weight: 600;
        color: #1e293b;
      }
      
      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5
  }
      
      .status-success {
        background-color: #dcfce7;
        color: #0a0791ff;
      }
      
      .status-warning {
        background-color: #fef3c7;
        color: #92400e;
      }
      
      .status-danger {
        background-color: #fee2e2;
        color: #991b1b;
      }
      
      .footer {
        background-color: #f8fafc;
        padding: 24px;
        text-align: center;
        border-top: 1px solid #e2e8f0;
      }
      
      .footer p {
        font-size: 14px;
        color: #64748b;
        margin: 4px 0;
      }
      
      .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
        margin: 24px 0;
      }
      
      @media only screen and (max-width: 600px) {
        .container {
          margin: 0;
          border-radius: 0;
        }
        
        .header, .content, .footer {
          padding: 24px 16px;
        }
        
        .header h1 {
          font-size: 24px;
        }
        
        .content h2 {
          font-size: 20px;
        }
        
        .button {
          display: block;
          text-align: center;
          width: 100%;
        }
        
        .info-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
      }
    `
  }
}