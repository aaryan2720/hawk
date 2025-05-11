
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EmailService } from "../email-service.ts";

export class AutoVerificationHandler {
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
}
