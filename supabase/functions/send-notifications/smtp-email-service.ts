
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
    console.log("SMTP Email Service initialized with EmailJS");
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
          to_email: to,
          subject: subject,
          html_content: htmlContent,
          to_name: to.split('@')[0], // Extract name from email
        }
      };

      console.log("Sending request to EmailJS API");
      
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    const emailSubject = 'HAWK Security - Test Notification';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #333; text-align: center;">Test Notification</h1>
        <p>Hello,</p>
        <p>This is a test notification from HAWK Security to verify your notification settings.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <h2 style="color: #4F46E5; margin-top: 0; font-size: 18px;">Notification Details</h2>
          <p><strong>Type:</strong> Test</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Status:</strong> Successfully delivered via EmailJS</p>
        </div>
        <p>You are receiving this because you requested a test notification in your security settings.</p>
        <p>If you did not request this test, please review your notification settings in the HAWK Security dashboard.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
          <p>© ${new Date().getFullYear()} HAWK Security. All rights reserved.</p>
        </div>
      </div>
    `;
    
    return { subject: emailSubject, html: emailHtml };
  }
  
  public generateVulnerabilityAlertEmail(severity: string, scanResults: any[]): { subject: string, html: string } {
    // Format scan results for email
    let vulnerabilitiesList = '';
    if (Array.isArray(scanResults)) {
      vulnerabilitiesList = scanResults.map(vuln => `
        <div style="margin-bottom: 15px; padding: 10px; border-left: 4px solid ${vuln.severity === 'critical' ? '#dc2626' : vuln.severity === 'high' ? '#ea580c' : '#eab308'}; background-color: #f8fafc;">
          <h3 style="margin-top: 0; margin-bottom: 5px; color: #1e293b;">${vuln.title || 'Untitled Vulnerability'}</h3>
          <p style="margin-top: 0; color: #334155;">${vuln.description || 'No description provided'}</p>
          <div style="font-size: 12px; color: #64748b;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background-color: ${vuln.severity === 'critical' ? '#fee2e2' : vuln.severity === 'high' ? '#ffedd5' : '#fef9c3'}; color: ${vuln.severity === 'critical' ? '#b91c1c' : vuln.severity === 'high' ? '#c2410c' : '#a16207'}; margin-right: 8px;">${vuln.severity}</span>
            ${vuln.system ? `<span>System: ${vuln.system}</span>` : ''}
            ${vuln.cve ? `<span style="margin-left: 8px;">CVE: ${vuln.cve}</span>` : ''}
          </div>
        </div>
      `).join('');
    } else {
      vulnerabilitiesList = '<p>Vulnerability details not available</p>';
    }

    const emailSubject = `HAWK Security - ${severity.toUpperCase()} Vulnerability Alert`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #333; text-align: center;">Security Alert</h1>
        <div style="background-color: ${severity === 'critical' ? '#fee2e2' : severity === 'high' ? '#ffedd5' : '#fef9c3'}; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <h2 style="color: ${severity === 'critical' ? '#b91c1c' : severity === 'high' ? '#c2410c' : '#a16207'}; margin-top: 0; font-size: 18px;">
            ${severity.toUpperCase()} Security Vulnerability Detected
          </h2>
          <p>A recent scan has detected ${scanResults?.length || 'new'} ${severity} vulnerabilities in your system.</p>
        </div>
        
        <h3 style="color: #4F46E5;">Vulnerability Details</h3>
        ${vulnerabilitiesList}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get("PUBLIC_URL") || "http://localhost:8080"}/alerts" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Details in Dashboard</a>
        </div>
        
        <p>Please review these vulnerabilities as soon as possible and take appropriate action to secure your systems.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
          <p>© ${new Date().getFullYear()} HAWK Security. All rights reserved.</p>
          <p>You're receiving this email because you've enabled security notifications in your HAWK Security settings.</p>
        </div>
      </div>
    `;
    
    return { subject: emailSubject, html: emailHtml };
  }
}
