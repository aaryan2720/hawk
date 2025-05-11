
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EmailService } from "../email-service.ts";
import { SMSService } from "../sms-service.ts";
import { NotificationResponse } from "../types.ts";

export class TestNotificationHandler {
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private emailService: EmailService,
    private smsService: SMSService
  ) {}
  
  async handleTestNotification(userId: string, body: any): Promise<Response> {
    try {
      const { email, phone, notificationPreferences } = body;
      console.log(`Sending test notification for user ${userId}`);
      
      // Get user notification preferences
      const { data: userSystem, error: userSystemError } = await this.supabase
        .from('user_systems')
        .select('monitoring_settings')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (userSystemError) {
        throw userSystemError;
      }
      
      let prefs = notificationPreferences;
      
      if (!prefs && userSystem?.monitoring_settings) {
        const settings = typeof userSystem.monitoring_settings === 'string'
          ? JSON.parse(userSystem.monitoring_settings)
          : userSystem.monitoring_settings;
          
        prefs = settings.notificationPreferences;
      }
      
      if (!prefs) {
        // Create default preferences if none exist
        prefs = {
          emailEnabled: true,
          emailAddress: email || '',
          emailVerified: true, // Auto-verified
          smsEnabled: false,
          phoneNumber: phone || '',
          alertLevel: 'all'
        };
      }
      
      console.log('Using notification preferences:', prefs);
      
      // Create a test notification
      const { data: notification, error: notificationError } = await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Test Notification',
          content: 'This is a test notification to verify your notification settings.',
          type: 'system',
          is_read: false,
          metadata: {
            test: true,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();
      
      if (notificationError) {
        throw notificationError;
      }
      
      // Prepare response data
      const result: NotificationResponse = {
        success: true,
        notification_id: notification.id,
        email_sent: false,
        sms_sent: false
      };
      
      // Send email notification if enabled
      if (prefs.emailEnabled && prefs.emailAddress) {
        // Always send email, regardless of verification status
        const { subject, html } = this.emailService.generateTestEmail();
        
        try {
          console.log(`Attempting to send test email to ${prefs.emailAddress}`);
          const emailResponse = await this.emailService.sendEmail(prefs.emailAddress, subject, html);
          console.log(`Test email response:`, emailResponse);
          result.email_sent = true;
          result.email_details = emailResponse;
        } catch (emailError) {
          console.error(`Error sending test email to ${prefs.emailAddress}:`, emailError);
          result.email_error = emailError.message;
        }
      }
      
      // Send SMS notification if enabled
      if (prefs.smsEnabled && prefs.phoneNumber) {
        try {
          console.log(`Attempting to send test SMS to ${prefs.phoneNumber}`);
          const smsMessage = this.smsService.generateTestSMS();
          const smsResponse = await this.smsService.sendSMS(prefs.phoneNumber, smsMessage);
          console.log(`Test SMS response:`, smsResponse);
          result.sms_sent = true;
          result.sms_details = smsResponse;
        } catch (smsError) {
          console.error(`Error sending test SMS to ${prefs.phoneNumber}:`, smsError);
          result.sms_error = smsError.message;
        }
      }
      
      return new Response(
        JSON.stringify(result),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", 
          } 
        }
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }
}
