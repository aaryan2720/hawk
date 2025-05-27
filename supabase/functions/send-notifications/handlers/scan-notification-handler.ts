
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EmailService } from "../email-service.ts";
import { SMSService } from "../sms-service.ts";
import { UserNotificationPreferences, NotificationDeliveryStatus } from "../types.ts";

export class ScanNotificationHandler {
  constructor(
    private supabase: ReturnType<typeof createClient>,
    private emailService: EmailService,
    private smsService: SMSService
  ) {}
  
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
      
      let notificationPrefs: UserNotificationPreferences = {
        emailEnabled: false,
        smsEnabled: false, // SMS disabled
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
        // Force email as verified and SMS as disabled
        notificationPrefs.emailVerified = true;
        notificationPrefs.smsEnabled = false;
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
            email_only: true,
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
      const deliveryStatus: NotificationDeliveryStatus = {
        email: false,
        sms: false // SMS disabled
      };
      
      // Send email notification if enabled and applicable to this severity
      if (notificationPrefs.emailEnabled && notificationPrefs.emailAddress) {
        // Check if the severity meets the user's alert level threshold
        const shouldSendEmail = 
          (notificationPrefs.alertLevel === 'all') ||
          (notificationPrefs.alertLevel === 'high' && (severity === 'high' || severity === 'critical')) ||
          (notificationPrefs.alertLevel === 'critical' && severity === 'critical');
        
        if (shouldSendEmail) {
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
      
      // SMS is disabled, so we skip SMS sending
      console.log('SMS notification disabled - email only mode');
      deliveryStatus.sms = false;
      
      // Update the notification with delivery status
      if (deliveryStatus.email) {
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
          sms_sent: deliveryStatus.sms,
          sms_disabled: true
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
