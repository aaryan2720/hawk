
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPEmailService } from "../smtp-email-service.ts";
import { SMSService } from "../sms-service.ts";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export class ScanNotificationHandler {
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private emailService: SMTPEmailService,
    private smsService: SMSService
  ) {}
  
  async handleScanNotification(body: any): Promise<Response> {
    try {
      console.log("=== Scan Notification Handler Started ===");
      console.log("Request body:", JSON.stringify(body, null, 2));
      
      const { userId, scanResults, scanType, severity } = body;
      
      if (!userId || !scanResults) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: userId or scanResults" }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Get user settings
      const { data: userSystem, error: settingsError } = await this.supabase
        .from('user_systems')
        .select('monitoring_settings')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (settingsError) {
        console.error("Error fetching user settings:", settingsError);
        throw new Error("Failed to fetch user settings");
      }
      
      let notificationPreferences: any = {};
      if (userSystem?.monitoring_settings) {
        const monSettings = typeof userSystem.monitoring_settings === 'string' 
          ? JSON.parse(userSystem.monitoring_settings) 
          : userSystem.monitoring_settings;
        notificationPreferences = monSettings.notificationPreferences || {};
      }
      
      console.log("User notification preferences:", notificationPreferences);
      
      const response: any = {
        success: true,
        email_sent: false,
        sms_sent: false,
        provider_used: null
      };
      
      // Send email if enabled
      if (notificationPreferences.emailEnabled && notificationPreferences.emailAddress) {
        try {
          console.log("Sending vulnerability alert email to:", notificationPreferences.emailAddress);
          const { subject, html } = this.emailService.generateVulnerabilityAlertEmail(severity || 'medium', scanResults);
          const emailResult = await this.emailService.sendEmail(
            notificationPreferences.emailAddress,
            subject,
            html
          );
          
          response.email_sent = true;
          response.provider_used = "SMTP";
          response.email_details = emailResult;
          console.log("Vulnerability alert email sent successfully via SMTP");
        } catch (emailError) {
          console.error("Failed to send vulnerability alert email:", emailError);
          response.email_error = emailError.message;
        }
      }
      
      // Send SMS if enabled
      if (notificationPreferences.smsEnabled && notificationPreferences.phoneNumber) {
        try {
          const smsMessage = `🚨 HAWK Security Alert: ${severity?.toUpperCase() || 'MEDIUM'} vulnerability detected. ${scanResults.length} vulnerabilities found. Check your email for details.`;
          console.log("Sending vulnerability alert SMS to:", notificationPreferences.phoneNumber);
          const smsResult = await this.smsService.sendSMS(
            notificationPreferences.phoneNumber,
            smsMessage
          );
          
          response.sms_sent = smsResult.success;
          response.sms_details = smsResult;
          console.log("Vulnerability alert SMS sent successfully");
        } catch (smsError) {
          console.error("Failed to send vulnerability alert SMS:", smsError);
          response.sms_error = smsError.message;
        }
      }
      
      // Create in-app notification
      try {
        const { error: insertError } = await this.supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: `${severity?.toUpperCase() || 'MEDIUM'} Vulnerability Alert`,
            content: `Scan detected ${scanResults.length} vulnerabilities in your system.`,
            type: 'vulnerability_alert',
            is_read: false,
            metadata: {
              scanType,
              severity,
              vulnerabilityCount: scanResults.length,
              scanResults: scanResults.slice(0, 5), // Store first 5 for preview
              timestamp: new Date().toISOString(),
              email_sent: response.email_sent,
              sms_sent: response.sms_sent,
              provider_used: response.provider_used
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
      
      console.log("=== Scan Notification Handler Completed ===");
      console.log("Final response:", response);
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: corsHeaders
      });
    } catch (error) {
      console.error("=== Scan Notification Handler Error ===");
      console.error("Error details:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message || "Unknown error in scan notification handler"
        }),
        { 
          status: 500, 
          headers: corsHeaders 
        }
      );
    }
  }
}
