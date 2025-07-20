
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPEmailService } from "../smtp-email-service.ts";
import { SMSService } from "../sms-service.ts";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export class TestNotificationHandler {
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private emailService: SMTPEmailService,
    private smsService: SMSService
  ) {}
  
  async handleTestNotification(userId: string, body: any): Promise<Response> {
    try {
      console.log("=== Test Notification Handler Started ===");
      console.log("User ID:", userId);
      console.log("Request body:", JSON.stringify(body, null, 2));
      
      // Get the email address directly from the request body first
      let targetEmailAddress = body.email || '';
      console.log("Email from request body:", targetEmailAddress);
      
      // If no email in request body, get from user settings
      if (!targetEmailAddress) {
        const { data: userSystem, error: settingsError } = await this.supabase
          .from('user_systems')
          .select('monitoring_settings')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error("Error fetching user settings:", settingsError);
          throw new Error("Failed to fetch user settings");
        }
        
        let notificationPreferences: any = {};
        if (userSystem?.monitoring_settings) {
          const monSettings = typeof userSystem.monitoring_settings === 'string' 
            ? JSON.parse(userSystem.monitoring_settings) 
            : userSystem.monitoring_settings;
          notificationPreferences = monSettings.notificationPreferences || {};
          targetEmailAddress = notificationPreferences.emailAddress || '';
        }
      }
      
      console.log("Final target email address:", targetEmailAddress);
      
      const response: any = {
        success: true,
        email_sent: false,
        sms_sent: false,
        provider_used: null,
        target_email: targetEmailAddress
      };
      
      // Send email if we have an email address
      if (targetEmailAddress) {
        try {
          console.log("Sending test email to:", targetEmailAddress);
          const { subject, html } = this.emailService.generateTestEmail();
          const emailResult = await this.emailService.sendEmail(
            targetEmailAddress,
            subject,
            html
          );
          
          response.email_sent = true;
          response.provider_used = emailResult.provider || "EmailService";
          response.email_details = emailResult;
          response.email_sent_to = targetEmailAddress;
          console.log("Test email sent successfully to:", targetEmailAddress);
        } catch (emailError) {
          console.error("Failed to send test email:", emailError);
          response.email_error = emailError.message;
        }
      } else {
        console.log("No email address configured for sending");
        response.email_error = "No email address configured";
      }
      
      // Send SMS if phone number is provided
      const phoneNumber = body.phone || '';
      if (phoneNumber) {
        try {
          console.log("Sending test SMS to:", phoneNumber);
          const smsResult = await this.smsService.sendSMS(
            phoneNumber,
            "🚨 HAWK Security Test: Your SMS notifications are working! This is a test message to verify your notification settings."
          );
          
          response.sms_sent = smsResult.success;
          response.sms_details = smsResult;
          console.log("Test SMS sent successfully");
        } catch (smsError) {
          console.error("Failed to send test SMS:", smsError);
          response.sms_error = smsError.message;
        }
      } else {
        console.log("SMS not enabled or no phone number configured");
      }
      
      // Create in-app notification
      try {
        const { error: insertError } = await this.supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'Test Notification',
            content: 'This is a test notification from HAWK Security.',
            type: 'test',
            is_read: false,
            metadata: {
              test: true,
              timestamp: new Date().toISOString(),
              email_sent: response.email_sent,
              sms_sent: response.sms_sent,
              provider_used: response.provider_used,
              email_sent_to: response.email_sent_to || null,
              target_email: targetEmailAddress
            }
          });
        
        if (insertError) {
          console.error("Failed to create in-app notification:", insertError);
        } else {
          console.log("In-app notification created successfully");
        }
      } catch (notificationError) {
        console.error("Error creating in-app notification:", notificationError);
      }
      
      console.log("=== Test Notification Handler Completed ===");
      console.log("Final response:", response);
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: corsHeaders
      });
    } catch (error) {
      console.error("=== Test Notification Handler Error ===");
      console.error("Error details:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message || "Unknown error in test notification handler"
        }),
        { 
          status: 500, 
          headers: corsHeaders 
        }
      );
    }
  }
}
