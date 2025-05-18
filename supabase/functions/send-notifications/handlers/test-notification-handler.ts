
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
    const corsHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };
    
    try {
      const { email, phone } = body;
      console.log(`Sending test notification for user ${userId}`);
      console.log(`Email: ${email || 'Not provided'}, Phone: ${phone || 'Not provided'}`);
      
      // Get user notification preferences
      const { data: userSystem, error: userSystemError } = await this.supabase
        .from('user_systems')
        .select('monitoring_settings')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (userSystemError) {
        console.error("Error fetching user system:", userSystemError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Error fetching user preferences: ${userSystemError.message}` 
          }),
          { status: 500, headers: corsHeaders }
        );
      }
      
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
        console.error("Error creating notification:", notificationError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Error creating notification: ${notificationError.message}` 
          }),
          { status: 500, headers: corsHeaders }
        );
      }
      
      // Prepare response data
      const result: NotificationResponse = {
        success: true,
        notification_id: notification.id,
        email_sent: false,
        sms_sent: false
      };
      
      // Extract user preferences from monitoring_settings
      let prefs = null;
      
      if (userSystem?.monitoring_settings) {
        let settings: any;
        
        if (typeof userSystem.monitoring_settings === 'string') {
          try {
            settings = JSON.parse(userSystem.monitoring_settings);
          } catch (e) {
            console.error("Error parsing monitoring_settings:", e);
            settings = {};
          }
        } else {
          settings = userSystem.monitoring_settings;
        }
          
        prefs = settings.notificationPreferences;
        console.log('Using notification preferences from database:', prefs);
      } else {
        // Create default preferences from body if none exist
        prefs = {
          emailEnabled: Boolean(email),
          emailAddress: email || '',
          emailVerified: true, // Auto-verified
          smsEnabled: Boolean(phone),
          phoneNumber: phone || '',
          alertLevel: 'all'
        };
        console.log('Using default notification preferences:', prefs);
      }
      
      // Send email notification if enabled
      if ((prefs?.emailEnabled || email) && (prefs?.emailAddress || email)) {
        // Use the provided email or fallback to the stored one
        const emailToUse = email || prefs.emailAddress || '';
        
        if (emailToUse) {
          try {
            console.log(`Attempting to send test email to ${emailToUse}`);
            const { subject, html } = this.emailService.generateTestEmail();
            
            const emailResponse = await this.emailService.sendEmail(emailToUse, subject, html);
            console.log(`Test email response:`, emailResponse);
            result.email_sent = true;
            result.email_details = emailResponse;
          } catch (emailError: any) {
            console.error(`Error sending test email to ${emailToUse}:`, emailError);
            result.email_error = emailError.message || 'Unknown email error';
          }
        } else {
          console.log('No valid email address available');
          result.email_error = 'No valid email address provided';
        }
      } else {
        console.log('Email notification not enabled or no email address provided');
      }
      
      // Send SMS notification if enabled
      if ((prefs?.smsEnabled || phone) && (prefs?.phoneNumber || phone)) {
        // Use the provided phone number or fallback to the stored one
        const phoneToUse = phone || prefs.phoneNumber || '';
        
        if (phoneToUse) {
          try {
            console.log(`Attempting to send test SMS to ${phoneToUse}`);
            const smsMessage = this.smsService.generateTestSMS();
            const smsResponse = await this.smsService.sendSMS(phoneToUse, smsMessage);
            console.log(`Test SMS response:`, smsResponse);
            result.sms_sent = true;
            result.sms_details = smsResponse;
          } catch (smsError: any) {
            console.error(`Error sending test SMS to ${phoneToUse}:`, smsError);
            result.sms_error = smsError.message || 'Unknown SMS error';
          }
        } else {
          console.log('No valid phone number available');
          result.sms_error = 'No valid phone number provided';
        }
      } else {
        console.log('SMS notification not enabled or no phone number provided');
      }
      
      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message || 'Unknown error in test notification handler'
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  }
}
