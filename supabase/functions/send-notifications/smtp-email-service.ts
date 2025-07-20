
interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
}

export class SMTPEmailService {
  private config: SMTPConfig;
  
  constructor() {
    this.config = {
      host: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
      port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
      username: Deno.env.get("SMTP_USER") || "",
      password: Deno.env.get("SMTP_PASS") || "",
      from: Deno.env.get("SMTP_FROM") || Deno.env.get("SMTP_USER") || ""
    };
  }
  
  public async sendEmail(to: string, subject: string, htmlContent: string): Promise<any> {
    if (!this.config.username || !this.config.password) {
      throw new Error("SMTP configuration incomplete. Please check SMTP_USER and SMTP_PASS environment variables.");
    }

    try {
      console.log(`Sending email via SMTP to: ${to}`);
      console.log(`SMTP Config: ${this.config.host}:${this.config.port} using ${this.config.username}`);
      
      const result = await this.sendViaSMTP(to, subject, htmlContent);
      console.log(`Email sent successfully via SMTP to ${to}`);
      
      return { success: true, provider: 'SMTP', result };
    } catch (error) {
      console.error('SMTP send error:', error);
      throw new Error(`SMTP send failed: ${error.message}`);
    }
  }
  
  private async sendViaSMTP(to: string, subject: string, htmlContent: string): Promise<any> {
    let conn;
    try {
      console.log(`Connecting to SMTP server: ${this.config.host}:${this.config.port}`);
      
      // Connect to SMTP server
      conn = await Deno.connect({
        hostname: this.config.host,
        port: this.config.port,
        transport: "tcp"
      });

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Helper function to read response
      const readResponse = async (): Promise<string> => {
        const buffer = new Uint8Array(4096);
        const n = await conn!.read(buffer);
        const response = decoder.decode(buffer.subarray(0, n || 0));
        console.log('SMTP Response:', response.trim());
        return response;
      };

      // Helper function to send command
      const sendCommand = async (command: string): Promise<string> => {
        console.log('SMTP Command:', command);
        await conn!.write(encoder.encode(command + '\r\n'));
        return await readResponse();
      };

      // SMTP conversation
      let response = await readResponse(); // Initial greeting
      if (!response.startsWith('220')) {
        throw new Error(`SMTP server greeting failed: ${response}`);
      }

      // EHLO
      response = await sendCommand(`EHLO ${this.config.host}`);
      if (!response.startsWith('250')) {
        throw new Error(`EHLO failed: ${response}`);
      }

      // STARTTLS for secure connection
      response = await sendCommand('STARTTLS');
      if (!response.startsWith('220')) {
        throw new Error(`STARTTLS failed: ${response}`);
      }

      // Close connection to upgrade to TLS
      conn.close();

      // Reconnect with TLS
      console.log('Reconnecting with TLS...');
      conn = await Deno.connectTls({
        hostname: this.config.host,
        port: this.config.port,
      });

      // Re-do EHLO after TLS upgrade
      response = await sendCommand(`EHLO ${this.config.host}`);
      if (!response.startsWith('250')) {
        throw new Error(`EHLO after TLS failed: ${response}`);
      }

      // Authentication
      response = await sendCommand('AUTH LOGIN');
      if (!response.startsWith('334')) {
        throw new Error(`AUTH LOGIN failed: ${response}`);
      }

      // Send username (base64 encoded)
      response = await sendCommand(btoa(this.config.username));
      if (!response.startsWith('334')) {
        throw new Error(`Username authentication failed: ${response}`);
      }

      // Send password (base64 encoded)
      response = await sendCommand(btoa(this.config.password));
      if (!response.startsWith('235')) {
        throw new Error(`Password authentication failed: ${response}`);
      }

      // Send email
      response = await sendCommand(`MAIL FROM:<${this.config.from}>`);
      if (!response.startsWith('250')) {
        throw new Error(`MAIL FROM failed: ${response}`);
      }

      response = await sendCommand(`RCPT TO:<${to}>`);
      if (!response.startsWith('250')) {
        throw new Error(`RCPT TO failed: ${response}`);
      }

      response = await sendCommand('DATA');
      if (!response.startsWith('354')) {
        throw new Error(`DATA command failed: ${response}`);
      }

      // Create email message
      const message = [
        `From: ${this.config.from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        htmlContent,
        ``,
        `.`
      ].join('\r\n');

      // Send message content
      await conn.write(encoder.encode(message + '\r\n'));
      response = await readResponse();
      if (!response.startsWith('250')) {
        throw new Error(`Message sending failed: ${response}`);
      }

      // Quit
      await sendCommand('QUIT');
      console.log('SMTP email sent successfully');
      
      return { success: true, transport: 'SMTP' };
    } catch (error) {
      console.error('SMTP connection error:', error);
      throw error;
    } finally {
      if (conn) {
        try {
          conn.close();
        } catch (e) {
          console.log('Error closing SMTP connection:', e);
        }
      }
    }
  }
  
  public generateWelcomeEmail(email: string): { subject: string, html: string } {
    const emailSubject = 'Welcome to HAWK Security Notifications';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #333; text-align: center;">Welcome to HAWK Security</h1>
        <p>Hello,</p>
        <p>Your email has been successfully set up to receive security notifications from HAWK Security. You'll now receive important alerts about vulnerabilities and security issues.</p>
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
          <p><strong>Status:</strong> Successfully delivered via SMTP</p>
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
