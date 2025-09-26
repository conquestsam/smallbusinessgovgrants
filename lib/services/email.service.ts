import { Resend } from 'resend';
import { eMailStyle } from './emailStyle';

export interface RegistrationEmailData {
  name: string
  email: string
  isSuccess: boolean
  errorMessage?: string
  appUrl?: string
  // applicationNumber: string
}

const resend = new Resend(process.env.RESEND_API_KEY);


export class EmailService {

private static getAppUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url.com'
  }


  static async sendRegistrationEmail(data: RegistrationEmailData) { 
    const baseStyles = this.getBaseEmailStyles()
    const appUrl = data.appUrl || this.getAppUrl()
    
    try {
      await resend.emails.send({
        from: 'SBA Grant System <noreply@notifications.sbasmallbusinessgrants.com>',
        to: data.email, // Use the email from the data object
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
            <!-- UPDATED: Simple Logo Header for Registration Success -->
            <div class="header" style="outline:none">
              <img 
                src="https://res.cloudinary.com/dt0xkqrvk/image/upload/v1757413998/download_k3vbjl.png"
                alt="SBA Grant Platform Logo"
                style="height: 80px; width: auto; margin-bottom: 16px; background-color: white; padding: 8px 16px; border-radius: 8px; display: block; max-width: 100%;"
              />
            </div>

            <!-- UPDATED: Simple Registration Success Content -->
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

                <!-- UPDATED: Address Section -->
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
      throw error; // Re-throw to handle in the API route
    }
  }
  
  static async sendApplicationApproval(to: string, applicationId: string, approvedAmount: number) {
    try {
      await resend.emails.send({
        from: 'SBA Grant System <noreply@notifications.sbasmallbusinessgrants.com>',
        to,
        subject: `Grant Application ${applicationId} Approved`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #002e6d; color: white; padding: 20px; text-align: center;">
              <h1>Grant Application Approved</h1>
            </div>
            <div style="padding: 20px;">
              <p>Congratulations! Your grant application <strong>${applicationId}</strong> has been approved.</p>
              <p><strong>Approved Amount:</strong> $${approvedAmount.toLocaleString()}</p>
              <p>You can now proceed with withdrawal requests through your dashboard.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard" 
                   style="background: #005ea2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">
                  Access Dashboard
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

  static async sendWithdrawalSuccess(to: string, withdrawalId: string, amount: number) {
    try {
      await resend.emails.send({
        from: 'SBA Grant System <noreply@notifications.sbasmallbusinessgrants.com>',
        to,
        subject: `Withdrawal ${withdrawalId} Processed Successfully`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
              <h1>Withdrawal Successful</h1>
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
        letter-spacing: 0.5px;
        background-color: #dcfce7;
        color: #0a0791ff;
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