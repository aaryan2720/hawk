
import { Client } from "npm:twilio@4.19.0";

export class SMSService {
  private twilio: any | null = null;
  private initialized: boolean = false;
  private fromNumber: string = "";
  
  constructor(
    private accountSid?: string,
    private authToken?: string,
    private twilioNumber?: string
  ) {
    if (accountSid && authToken && twilioNumber) {
      this.initialize(accountSid, authToken, twilioNumber);
    }
  }
  
  public initialize(accountSid: string, authToken: string, twilioNumber: string): void {
    try {
      this.twilio = new Client(accountSid, authToken);
      this.fromNumber = twilioNumber;
      this.initialized = true;
      console.log("Twilio client initialized successfully with number:", twilioNumber);
    } catch (error) {
      console.error("Failed to initialize Twilio client:", error);
      this.initialized = false;
    }
  }
  
  public async sendSMS(to: string, message: string): Promise<any> {
    if (!this.initialized) {
      console.log(`Would send SMS to ${to} with message: ${message}`);
      return { success: true, message: 'SMS would be sent (Twilio not configured)' };
    }

    try {
      console.log(`Preparing to send SMS to ${to}`);
      
      if (!to || !to.match(/^\+?[1-9]\d{1,14}$/)) {
        throw new Error("Invalid phone number format. Must be in E.164 format (e.g., +1234567890)");
      }
      
      // Clean the phone number to ensure E.164 format
      const formattedNumber = to.startsWith('+') ? to : `+${to}`;
      
      const response = await this.twilio.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedNumber
      });
      
      console.log(`SMS sent successfully to ${to}, Twilio SID:`, response.sid);
      
      return { success: true, sid: response.sid, status: response.status };
    } catch (error) {
      console.error('Error sending SMS with Twilio:', error);
      
      if (error.code) {
        console.error('Twilio error code:', error.code);
        console.error('Twilio error message:', error.message);
      }
      
      throw error;
    }
  }
  
  public generateTestSMS(): string {
    return `HAWK Security: This is a test notification to verify your SMS notification settings. ${new Date().toLocaleString()}`;
  }
  
  public generateVulnerabilityAlertSMS(severity: string): string {
    return `HAWK Security ALERT: ${severity.toUpperCase()} vulnerability detected in your system. Please check your dashboard for details.`;
  }
}
