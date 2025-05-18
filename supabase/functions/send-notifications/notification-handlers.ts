
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EmailService } from "./email-service.ts";
import { SMSService } from "./sms-service.ts";
import { AutoVerificationHandler } from "./handlers/auto-verification-handler.ts";
import { TestNotificationHandler } from "./handlers/test-notification-handler.ts";
import { ScanNotificationHandler } from "./handlers/scan-notification-handler.ts";
import { NotificationResponse } from "./types.ts";

export class NotificationHandlers {
  private autoVerificationHandler: AutoVerificationHandler;
  private testNotificationHandler: TestNotificationHandler;
  private scanNotificationHandler: ScanNotificationHandler;
  
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private emailService: EmailService,
    private smsService: SMSService
  ) {
    this.autoVerificationHandler = new AutoVerificationHandler(supabase, emailService);
    this.testNotificationHandler = new TestNotificationHandler(supabase, emailService, smsService);
    this.scanNotificationHandler = new ScanNotificationHandler(supabase, emailService, smsService);
  }
  
  async handleAutoVerification(userId: string, email: string): Promise<Response> {
    try {
      return await this.autoVerificationHandler.handleAutoVerification(userId, email);
    } catch (error) {
      console.error("Error in handleAutoVerification:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Unknown error in auto verification" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }
  }
  
  async handleTestNotification(userId: string, body: any): Promise<Response> {
    try {
      return await this.testNotificationHandler.handleTestNotification(userId, body);
    } catch (error) {
      console.error("Error in handleTestNotification:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Unknown error in test notification" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }
  }
  
  async handleScanNotification(body: any): Promise<Response> {
    try {
      return await this.scanNotificationHandler.handleScanNotification(body);
    } catch (error) {
      console.error("Error in handleScanNotification:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Unknown error in scan notification" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }
  }
}
