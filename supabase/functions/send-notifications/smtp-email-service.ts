interface EmailResult {
  success: boolean;
  provider: string;
  result: any;
}

export class SMTPEmailService {
  private serviceId: string;
  private templateId: string;
  private publicKey: string;
  
  constructor() {
    console.log("SMTP Email Service initialized with EmailJS (server-side enabled)");
    this.serviceId = Deno.env.get("EMAILJS_SERVICE_ID") || "";
    this.templateId = Deno.env.get("EMAILJS_TEMPLATE_ID") || "";
    this.publicKey = Deno.env.get("EMAILJS_PUBLIC_KEY") || "";
    
    if (!this.serviceId || !this.templateId || !this.publicKey) {
      throw new Error("EmailJS configuration missing. Please set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, and EMAILJS_PUBLIC_KEY");
    }
  }
  
  public async sendEmail(to: string, subject: string, htmlContent: string): Promise<EmailResult> {
    console.log("=== EMAILJS EMAIL SERVICE ===");
    console.log(`Sending email via EmailJS to: ${to}`);
    console.log(`Subject: ${subject}`);

    try {
      const emailData = {
        service_id: this.serviceId,
        template_id: this.templateId,
        user_id: this.publicKey,
        template_params: {
          email: to,
          user_name: to.split('@')[0],
          alert_type: "Security Alert",
          severity: "High",
          timestamp: new Date().toLocaleString(),
          alert_details: "System security notification",
          action_url: `${Deno.env.get("PUBLIC_URL") || "http://localhost:8080"}/alerts`
        }
      };

      console.log("Sending request to EmailJS API with template params:", emailData.template_params);
      
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HAWK-Security-Server/1.0',
          'Origin': 'https://hawk-security.com',
          'Referer': 'https://hawk-security.com'
        },
        body: JSON.stringify(emailData)
      });

      console.log("EmailJS response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('EmailJS API error:', errorText);
        throw new Error(`EmailJS API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.text();
      console.log("EmailJS response:", result);
      
      return { 
        success: true, 
        provider: 'EmailJS', 
        result: {
          messageId: result,
          to,
          subject,
          status: response.status
        }
      };
    } catch (error) {
      console.error('EmailJS email failed:', error);
      throw new Error(`EmailJS email send failed: ${error.message}`);
    }
  }
  
  public generateWelcomeEmail(email: string): { subject: string, html: string } {
    const emailSubject = 'Welcome to HAWK Security Notifications';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #333; text-align: center;">Welcome to HAWK Security</h1>
        <p>Hello,</p>
        <p>Your email <strong>${email}</strong> has been successfully set up to receive security notifications from HAWK Security. You'll now receive important alerts about vulnerabilities and security issues.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get("PUBLIC_URL") || "http://localhost:8080"}/settings" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Settings</a>
        </div>
        <p>If you did not set this up, please contact support immediately.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
          <p>© ${new Date().getFullYear()} HAWK Security. All rights reserved.</p>
        </div>
      </div>
    `;
    
    return { subject: emailSubject, html: emailHtml };
  }
  
  public generateTestEmail(): { subject: string, html: string } {
    const emailSubject = 'RealHawk Security - Test Notification';
    const emailHtml = `Test notification content`;
    return { subject: emailSubject, html: emailHtml };
  }
  
  public generateVulnerabilityAlertEmail(severity: string, scanResults: any[]): { subject: string, html: string } {
    const emailSubject = `RealHawk Security - ${severity.toUpperCase()} Vulnerability Alert`;
    const emailHtml = `Vulnerability alert content`;
    return { subject: emailSubject, html: emailHtml };
  }
}
