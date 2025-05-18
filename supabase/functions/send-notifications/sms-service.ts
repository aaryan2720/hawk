
// Fixed import for Twilio that works with Deno
import { Twilio } from "npm:twilio@4.19.0/lib/rest/Twilio.js";

export class SMSService {
  private client: any = null;
  private initialized: boolean = false;
  private fromNumber: string = "";
  
  constructor(
    private accountSid?: string,
    private authToken?: string,
    private phoneNumber?: string
  ) {
    if (accountSid && authToken && phoneNumber) {
      this.initialize(accountSid, authToken, phoneNumber);
    }
  }
  
  public initialize(accountSid: string, authToken: string, phoneNumber: string): void {
    try {
      this.client = new Twilio(accountSid, authToken);
      this.fromNumber = phoneNumber;
      this.initialized = true;
      console.log("Twilio client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Twilio client:", error);
    }
  }
  
  public async sendSMS(to: string, message: string): Promise<any> {
    if (!this.initialized || !this.client) {
      console.log(`Would send SMS to ${to} with message: ${message}`);
      return { success: true, message: 'SMS would be sent (Twilio not configured)' };
    }

    try {
      console.log(`Preparing to send SMS to ${to}`);
      
      // Ensure phone number is in E.164 format
      const formattedTo = this.formatPhoneNumber(to);
      
      const response = await this.client.messages.create({
        body: message,
        to: formattedTo,
        from: this.fromNumber
      });
      
      console.log(`SMS sent successfully to ${to}, Twilio SID:`, response.sid);
      
      return { success: true, sid: response.sid };
    } catch (error) {
      console.error('Error sending SMS with Twilio:', error);
      throw error;
    }
  }
  
  private formatPhoneNumber(phoneNumber: string): string {
    // Basic formatting to ensure E.164 format
    // Remove any non-digit characters except the leading +
    let formatted = phoneNumber.trim();
    
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted.replace(/\D/g, '');
    } else {
      formatted = '+' + formatted.substring(1).replace(/\D/g, '');
    }
    
    return formatted;
  }
  
  public generateTestSMS(): string {
    return "HAWK Security Test: This is a test notification to verify your notification settings.";
  }
}
