
import { Resend } from "npm:resend@2.0.0";

interface EmailResult {
  success: boolean;
  provider: string;
  result: any;
}

export class SMTPEmailService {
  private resend: Resend;
  private fallbackFrom: string;
  
  constructor() {
    console.log("SMTP Email Service initialized with Resend");
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }
    this.resend = new Resend(apiKey);
    this.fallbackFrom = "onboarding@resend.dev"; // Use Resend's verified domain
  }
  
  public async sendEmail(to: string, subject: string, htmlContent: string): Promise<EmailResult> {
    console.log("=== RESEND EMAIL SERVICE ===");
    console.log(`Sending email via Resend to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From: ${this.fallbackFrom}`);

    try {
      const result = await this.resend.emails.send({
        from: this.fallbackFrom,
        to: [to],
        subject: subject,
        html: htmlContent,
      });

      console.log("Resend email sent successfully:", result);
      
      return { 
        success: true, 
        provider: 'Resend', 
        result: {
          messageId: result.data?.id || `resend-${Date.now()}`,
          to,
          from: this.fallbackFrom,
          subject,
          resendId: result.data?.id
        }
      };
    } catch (error) {
      console.error('Resend email failed:', error);
      throw new Error(`Resend email send failed: ${error.message}`);
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
          <p><strong>Status:</strong> Successfully delivered via free email service</p>
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
