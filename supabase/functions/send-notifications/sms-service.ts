
// SMS Service for sending text messages via Twilio
export class SMSService {
  private twilioAccountSid: string;
  private twilioAuthToken: string;
  private twilioPhoneNumber: string;

  constructor(accountSid: string, authToken: string, phoneNumber: string) {
    this.twilioAccountSid = accountSid;
    this.twilioAuthToken = authToken;
    this.twilioPhoneNumber = phoneNumber;
  }

  async sendSMS(to: string, message: string): Promise<any> {
    if (!to || !message) {
      throw new Error('Phone number and message are required');
    }

    console.log(`Preparing to send SMS to ${to}`);
    
    // Format the phone number if needed
    const formattedNumber = this.formatPhoneNumber(to);
    
    // Create the request body for Twilio API
    const body = new URLSearchParams();
    body.append('To', formattedNumber);
    body.append('From', this.twilioPhoneNumber);
    body.append('Body', message);

    // Prepare authentication for Twilio API
    const auth = btoa(`${this.twilioAccountSid}:${this.twilioAuthToken}`);
    
    try {
      // Make the request to Twilio API
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error sending SMS:', data);
        throw new Error(`Twilio API error: ${data.message || 'Unknown error'}`);
      }
      
      console.log('SMS sent successfully:', data.sid);
      return {
        success: true,
        sid: data.sid,
        status: data.status,
      };
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  }

  // Helper method to format phone numbers
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-numeric characters except the + sign
    let formatted = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure the number starts with a + if it doesn't already
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    
    return formatted;
  }

  // Generate test SMS content
  generateTestSMS(): string {
    return "HAWK Security: This is a test message from your security monitoring system.";
  }

  // Generate vulnerability alert SMS content
  generateVulnerabilityAlertSMS(severity: string): string {
    return `HAWK Security Alert: A new ${severity} vulnerability has been detected in your system. Please check your dashboard for details.`;
  }
}
