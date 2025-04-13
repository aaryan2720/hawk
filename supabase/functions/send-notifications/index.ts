
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the auth context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body));
    
    // Extract user information from the request body
    const { userId, action, email } = body;
    
    if (!userId) {
      throw new Error('Missing userId in request');
    }
    
    // Handle different actions
    if (action === 'verify-email') {
      return await handleEmailVerification(supabase, userId, email, authHeader);
    } else if (action === 'test-notification') {
      return await handleTestNotification(supabase, userId, body);
    } else {
      // Default behavior: send notification about scan results
      return await handleScanNotification(supabase, body);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function handleEmailVerification(supabase, userId, email, authHeader) {
  if (!email) {
    throw new Error('Email is required for verification');
  }
  
  console.log(`Handling email verification for user ${userId} and email ${email}`);
  
  try {
    // Create a verification token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours
    
    // Store the verification info in user_systems
    const { data: userSystem, error: userSystemError } = await supabase
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
      // Create a new user_system entry if one doesn't exist
      const { data: newSystem, error: createError } = await supabase
        .from('user_systems')
        .insert({
          user_id: userId,
          system_name: 'Default System',
          monitoring_settings: {
            pendingVerification: {
              email,
              token,
              expiresAt: expiresAt.toISOString(),
            },
            notificationPreferences: {
              emailEnabled: true,
              emailAddress: email,
              emailVerified: false,
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
          emailVerified: false,
          smsEnabled: false,
          phoneNumber: '',
          alertLevel: 'all'
        };
      } else {
        // Update email address
        monitoringSettings.notificationPreferences.emailAddress = email;
        monitoringSettings.notificationPreferences.emailVerified = false;
      }
      
      // Add pending verification data
      monitoringSettings.pendingVerification = {
        email,
        token,
        expiresAt: expiresAt.toISOString(),
      };
      
      const { error: updateError } = await supabase
        .from('user_systems')
        .update({ monitoring_settings: monitoringSettings })
        .eq('id', userSystem.id);
        
      if (updateError) {
        throw updateError;
      }
      
      userSystemId = userSystem.id;
    }
    
    // Create email verification link
    const verificationLink = `${Deno.env.get("PUBLIC_URL") || "http://localhost:8080"}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    
    // Create an in-app notification about the verification
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Email Verification Required',
      content: `Please verify your email address (${email}) to receive security notifications.`,
      type: 'system',
      is_read: false,
      metadata: {
        verification: true,
        email: email,
        verificationLink
      }
    });
    
    // Here we would actually send an email - in a real implementation
    console.log(`Would send verification email to ${email} with link: ${verificationLink}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent',
        debugLink: verificationLink,
        userSystemId,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error('Error handling email verification:', error);
    throw error;
  }
}

async function handleTestNotification(supabase, userId, body) {
  try {
    const { email, phone, notificationPreferences } = body;
    console.log(`Sending test notification for user ${userId}`);
    
    // Get user notification preferences
    const { data: userSystem, error: userSystemError } = await supabase
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
      throw new Error('No notification preferences found');
    }
    
    console.log('Using notification preferences:', prefs);
    
    // Create a test notification
    const { data: notification, error: notificationError } = await supabase
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
      if (prefs.emailVerified) {
        // Here we would actually send an email - in a real implementation
        console.log(`Would send test email to ${prefs.emailAddress}`);
        result.email_sent = true;
      } else {
        console.log(`Email ${prefs.emailAddress} is not verified, not sending test email`);
        result.email_not_verified = true;
      }
    }
    
    // Send SMS notification if enabled
    if (prefs.smsEnabled && prefs.phoneNumber) {
      // Here we would actually send an SMS - in a real implementation
      console.log(`Would send test SMS to ${prefs.phoneNumber}`);
      result.sms_sent = true;
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
}

async function handleScanNotification(supabase, body) {
  const { userId, scanResults, scanType, severity, email } = body;
  
  console.log(`Handling scan notification for user ${userId}`);
  
  try {
    // Get user notification preferences
    const { data: userSystem, error: userSystemError } = await supabase
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
      emailVerified: false
    };
    
    if (userSystem?.monitoring_settings) {
      const settings = typeof userSystem.monitoring_settings === 'string'
        ? JSON.parse(userSystem.monitoring_settings)
        : userSystem.monitoring_settings;
        
      notificationPrefs = settings.notificationPreferences || notificationPrefs;
    }
    
    console.log('User notification preferences:', notificationPrefs);
    
    // Create a notification in the database
    const { data: notification, error: notificationError } = await supabase
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
        // Check if email is verified
        if (notificationPrefs.emailVerified) {
          // In a real app, send an actual email here
          console.log(`Would send email to ${notificationPrefs.emailAddress} about ${severity} vulnerability`);
          deliveryStatus.email = true;
        } else {
          console.log(`Email ${notificationPrefs.emailAddress} is not verified, not sending email`);
        }
      }
    }
    
    // Send SMS notification if enabled
    if (notificationPrefs.smsEnabled && notificationPrefs.phoneNumber) {
      // Check if the severity meets the user's alert level threshold
      const shouldSendSMS = 
        (notificationPrefs.alertLevel === 'all') ||
        (notificationPrefs.alertLevel === 'high' && (severity === 'high' || severity === 'critical')) ||
        (notificationPrefs.alertLevel === 'critical' && severity === 'critical');
      
      if (shouldSendSMS) {
        // In a real app, send an actual SMS here
        console.log(`Would send SMS to ${notificationPrefs.phoneNumber} about ${severity} vulnerability`);
        deliveryStatus.sms = true;
      }
    }
    
    // Update the notification with delivery status
    if (deliveryStatus.email || deliveryStatus.sms) {
      await supabase
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
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error('Error handling scan notification:', error);
    throw error;
  }
}
