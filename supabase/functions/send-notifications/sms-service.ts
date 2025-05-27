
// SMS Service disabled - focusing on email notifications only
export class SMSService {
  private initialized: boolean = false;
  
  constructor() {
    console.log("SMS Service: Disabled - using email notifications only");
    this.initialized = false;
  }
  
  public initialize(): void {
    console.log("SMS Service: Not initializing - disabled");
  }
  
  public async sendSMS(to: string, message: string): Promise<any> {
    console.log(`SMS Service: Would send SMS to ${to} with message: ${message} (SMS disabled)`);
    return { success: true, message: 'SMS service disabled - email only' };
  }
  
  public generateTestSMS(): string {
    return "SMS Service: Test message (SMS disabled - email only)";
  }
  
  public generateVulnerabilityAlertSMS(severity: string): string {
    return `SMS Service: ${severity} alert (SMS disabled - email only)`;
  }
}
