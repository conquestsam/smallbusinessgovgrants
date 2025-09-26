 export class eMailStyle { 
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