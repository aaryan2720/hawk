
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EmailService } from "./email-service.ts";

export interface UserNotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailAddress: string;
  phoneNumber: string;
  alertLevel: string;
  emailVerified: boolean;
}

export class NotificationHandlers {
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private emailService: EmailService
  ) {}
  
  async handleAutoVerification(userId: string, email: string): Promise<Response> {
    if (!email) {
      throw new Error('Email is required for verification');
    }
    
    console.log(`Auto-verifying email ${email} for user ${userId}`);
    
    try {
      // Get existing user system or create a new one
      const { data: userSystem, error: userSystemError } = await this.supabase
        .from('user_systems')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (userSystemError) {
        throw userSystemError;
      }
      
      let monitoringSettings = {};
      let userSystemId = null;
      
      if (!userSystem) {
        // Create a new user_system entry with auto-verified email
        const { data: newSystem, error: createError } = await this.supabase
          .from('user_systems')
          .insert({
            user_id: userId,
            system_name: 'Default System',
            monitoring_settings: {
              notificationPreferences: {
                emailEnabled: true,
                emailAddress: email,
                emailVerified: true, // Auto-verified
                smsEnabled: false,
                phoneNumber: '',
                alertLevel: 'all'
              }
            }
          })
          .select()
          .single();
          
        if (createError) {
          throw createError;
        }
        
        userSystemId = newSystem.id;
        monitoringSettings = newSystem.monitoring_settings;
      } else {
        // Update the existing user_system entry
        monitoringSettings = userSystem.monitoring_settings || {};
        
        if (typeof monitoringSettings === 'string') {
          monitoringSettings = JSON.parse(monitoringSettings);
        }
        
        // Initialize notification preferences if they don't exist
        if (!monitoringSettings.notificationPreferences) {
          monitoringSettings.notificationPreferences = {
            emailEnabled: true,
            emailAddress: email,
            emailVerified: true, // Auto-verified
            smsEnabled: false,
            phoneNumber: '',
            alertLevel: 'all'
          };
        } else {
          // Update email address and auto-verify it
          monitoringSettings.notificationPreferences.emailAddress = email;
          monitoringSettings.notificationPreferences.emailVerified = true;
        }
        
        // Remove any pending verification data
        delete monitoringSettings.pendingVerification;
        
        const { error: updateError } = await this.supabase
          .from('user_systems')
          .update({ monitoring_settings: monitoringSettings })
          .eq('id', userSystem.id);
          
        if (updateError) {
          throw updateError;
        }
        
        userSystemId = userSystem.id;
      }
      
      // Create an in-app notification about the successful setup
      await this.supabase.from('notifications').insert({
        user_id: userId,
        title: 'Email Notifications Set Up',
        content: `Your email address (${email}) has been set up to receive security notifications.`,
        type: 'system',
        is_read: false
      });
      
      // Send a welcome email
      const { subject, html } = this.emailService.generateWelcomeEmail(email);
      
      try {
        const emailResult = await this.emailService.sendEmail(email, subject, html);
        console.log(`Welcome email result:`, emailResult);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Email auto-verified and welcome message sent',
            userSystemId,
            emailSent: emailResult.success
          }),
          { 
            status: 200, 
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", 
            } 
          }
        );
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the entire operation if just the email fails
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Email auto-verified but welcome message failed to send',
            userSystemId,
            emailSent: false,
            emailError: emailError.message
          }),
          { 
            status: 200, 
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", 
            } 
          }
        );
      }
    } catch (error) {
      console.error('Error auto-verifying email:', error);
      throw error;
    }
  }
  
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
      const result = {
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
      
      // Send SMS notification if enabled (placeholder for SMS integration)
      if (prefs.smsEnabled && prefs.phoneNumber) {
        // Here we would integrate with an SMS service like Twilio
        console.log(`Would send test SMS to ${prefs.phoneNumber}`);
        result.sms_sent = false; // Set to true when SMS service is actually integrated
        result.sms_integration_pending = true;
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
  
  async handleScanNotification(body: any): Promise<Response> {
    const { userId, scanResults, scanType, severity, email } = body;
    
    console.log(`Handling scan notification for user ${userId}`);
    
    try {
      // Get user notification preferences
      const { data: userSystem, error: userSystemError } = await this.supabase
        .from('user_systems')
        .select('monitoring_settings')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (userSystemError) {
        throw userSystemError;
      }
      
      let notificationPrefs = {
        emailEnabled: false,
        smsEnabled: false,
        emailAddress: '',
        phoneNumber: '',
        alertLevel: 'critical',
        emailVerified: true // Default to verified
      };
      
      if (userSystem?.monitoring_settings) {
        const settings = typeof userSystem.monitoring_settings === 'string'
          ? JSON.parse(userSystem.monitoring_settings)
          : userSystem.monitoring_settings;
          
        notificationPrefs = settings.notificationPreferences || notificationPrefs;
        // Force email as verified
        notificationPrefs.emailVerified = true;
      }
      
      console.log('User notification preferences:', notificationPrefs);
      
      // Create a notification in the database
      const { data: notification, error: notificationError } = await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: `New ${severity} vulnerability detected`,
          content: `A scan has detected new ${severity} vulnerabilities in your system.`,
          type: scanType || 'vulnerability',
          is_read: false,
          metadata: {
            scanResults,
            severity,
            timestamp: new Date().toISOString(),
            delivered: {
              email: false,
              sms: false
            }
          }
        })
        .select()
        .single();
      
      if (notificationError) {
        throw notificationError;
      }
      
      // Create deliveryStatus to track what was sent
      const deliveryStatus = {
        email: false,
        sms: false
      };
      
      // Send email notification if enabled and applicable to this severity
      if (notificationPrefs.emailEnabled && notificationPrefs.emailAddress) {
        // Check if the severity meets the user's alert level threshold
        const shouldSendEmail = 
          (notificationPrefs.alertLevel === 'all') ||
          (notificationPrefs.alertLevel === 'high' && (severity === 'high' || severity === 'critical')) ||
          (notificationPrefs.alertLevel === 'critical' && severity === 'critical');
        
        if (shouldSendEmail) {
          // Always send email regardless of verification status
          const { subject, html } = this.emailService.generateVulnerabilityAlertEmail(severity, scanResults);
          
          try {
            console.log(`Attempting to send vulnerability alert email to ${notificationPrefs.emailAddress}`);
            const emailResponse = await this.emailService.sendEmail(notificationPrefs.emailAddress, subject, html);
            console.log('Security alert email response:', emailResponse);
            deliveryStatus.email = true;
          } catch (emailError) {
            console.error(`Error sending vulnerability notification email:`, emailError);
          }
        }
      }
      
      // Send SMS notification if enabled (placeholder for SMS integration)
      if (notificationPrefs.smsEnabled && notificationPrefs.phoneNumber) {
        // Check if the severity meets the user's alert level threshold
        const shouldSendSMS = 
          (notificationPrefs.alertLevel === 'all') ||
          (notificationPrefs.alertLevel === 'high' && (severity === 'high' || severity === 'critical')) ||
          (notificationPrefs.alertLevel === 'critical' && severity === 'critical');
        
        if (shouldSendSMS) {
          // Here we would integrate with an SMS service like Twilio
          console.log(`Would send SMS to ${notificationPrefs.phoneNumber} about ${severity} vulnerability`);
          // deliveryStatus.sms = true; // Uncomment when SMS is implemented
        }
      }
      
      // Update the notification with delivery status
      if (deliveryStatus.email || deliveryStatus.sms) {
        await this.supabase
          .from('notifications')
          .update({
            metadata: {
              ...notification.metadata,
              delivered: deliveryStatus
            }
          })
          .eq('id', notification.id);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          notification_id: notification.id,
          email_sent: deliveryStatus.email,
          sms_sent: deliveryStatus.sms
        }),
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
      console.error('Error handling scan notification:', error);
      throw error;
    }
  }
}
