
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
    // Create a verification token (store in user_systems since we don't have a verification_tokens table)
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours
    
    // Store the verification info in user_systems
    const { data: userSystem, error: userSystemError } = await supabase
      .from('user_systems')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (userSystemError && userSystemError.code !== 'PGRST116') {
      throw userSystemError;
    }
    
    if (!userSystem) {
      // Create a new user_system entry if one doesn't exist
      await supabase.from('user_systems').insert({
        user_id: userId,
        system_name: 'Default System',
        monitoring_settings: {
          pendingVerification: {
            email,
            token,
            expiresAt: expiresAt.toISOString(),
          }
        }
      });
    } else {
      // Update the existing user_system entry
      const monitoringSettings = userSystem.monitoring_settings || {};
      monitoringSettings.pendingVerification = {
        email,
        token,
        expiresAt: expiresAt.toISOString(),
      };
      
      await supabase
        .from('user_systems')
        .update({ monitoring_settings: monitoringSettings })
        .eq('id', userSystem.id);
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
    
    // Send verification email (simulated here - would use a real email service)
    console.log(`Would send verification email to ${email} with link: ${verificationLink}`);
    
    // For demo purposes, we're returning the verification link
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent',
        debugLink: verificationLink
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
    
    if (!userSystem || !userSystem.monitoring_settings) {
      console.log('No notification preferences found, using defaults');
    }
    
    const notificationPrefs = userSystem?.monitoring_settings?.notificationPreferences || {
      emailEnabled: true,
      smsEnabled: false,
      emailAddress: email || '',
      alertLevel: 'critical'
    };
    
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
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (notificationError) {
      throw notificationError;
    }
    
    // Send email notification if enabled and applicable to this severity
    let emailSent = false;
    if (notificationPrefs.emailEnabled && notificationPrefs.emailAddress) {
      // Check if the severity meets the user's alert level threshold
      const shouldSendEmail = 
        (notificationPrefs.alertLevel === 'all') ||
        (notificationPrefs.alertLevel === 'high' && (severity === 'high' || severity === 'critical')) ||
        (notificationPrefs.alertLevel === 'critical' && severity === 'critical');
      
      if (shouldSendEmail) {
        // Check if email is verified
        const isVerified = notificationPrefs.emailAddress === email || notificationPrefs.emailVerified;
        
        if (isVerified) {
          // In a real app, send an actual email here
          console.log(`Would send email to ${notificationPrefs.emailAddress} about ${severity} vulnerability`);
          emailSent = true;
        } else {
          console.log(`Email ${notificationPrefs.emailAddress} is not verified, not sending email`);
        }
      }
    }
    
    // Send SMS notification if enabled
    let smsSent = false;
    if (notificationPrefs.smsEnabled && notificationPrefs.phoneNumber) {
      // Check if the severity meets the user's alert level threshold
      const shouldSendSMS = 
        (notificationPrefs.alertLevel === 'all') ||
        (notificationPrefs.alertLevel === 'high' && (severity === 'high' || severity === 'critical')) ||
        (notificationPrefs.alertLevel === 'critical' && severity === 'critical');
      
      if (shouldSendSMS) {
        // In a real app, send an actual SMS here
        console.log(`Would send SMS to ${notificationPrefs.phoneNumber} about ${severity} vulnerability`);
        smsSent = true;
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        notification_id: notification.id,
        email_sent: emailSent,
        sms_sent: smsSent
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
