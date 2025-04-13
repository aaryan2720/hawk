
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import sgMail from "npm:@sendgrid/mail";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize SendGrid with API key
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

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

async function sendEmail(to, subject, htmlContent) {
  if (!SENDGRID_API_KEY) {
    console.log(`Would send email to ${to} with subject: ${subject}`);
    return { success: true, message: 'Email would be sent (SendGrid API key not configured)' };
  }

  try {
    const msg = {
      to,
      from: 'security@hawksecurity.example.com', // Using the hawk security email domain
      subject,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email with SendGrid:', error);
    throw error;
  }
}

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
    
    // Actually send an email with SendGrid
    const emailSubject = 'Verify Your Email Address - HAWK Security';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #333; text-align: center;">Email Verification</h1>
        <p>Hello,</p>
        <p>Thank you for setting up notifications with HAWK Security. To ensure you receive important security alerts, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationLink}</p>
        <p>This verification link will expire in 24 hours.</p>
        <p>If you did not request this verification, please ignore this email.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
          <p>© ${new Date().getFullYear()} HAWK Security. All rights reserved.</p>
        </div>
      </div>
    `;
    
    const emailResult = await sendEmail(email, emailSubject, emailHtml);
    console.log(`Verification email result:`, emailResult);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent',
        debugLink: verificationLink,
        userSystemId,
        emailSent: emailResult.success
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
        // Send actual email with SendGrid
        const emailSubject = 'HAWK Security - Test Notification';
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h1 style="color: #333; text-align: center;">Test Notification</h1>
            <p>Hello,</p>
            <p>This is a test notification from HAWK Security to verify your notification settings.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h2 style="color: #4F46E5; margin-top: 0; font-size: 18px;">Notification Details</h2>
              <p><strong>Type:</strong> Test</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Status:</strong> Successfully delivered</p>
            </div>
            <p>You are receiving this because you requested a test notification in your security settings.</p>
            <p>If you did not request this test, please review your notification settings in the HAWK Security dashboard.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} HAWK Security. All rights reserved.</p>
            </div>
          </div>
        `;
        
        try {
          await sendEmail(prefs.emailAddress, emailSubject, emailHtml);
          result.email_sent = true;
        } catch (emailError) {
          console.error(`Error sending test email to ${prefs.emailAddress}:`, emailError);
          result.email_error = emailError.message;
        }
      } else {
        console.log(`Email ${prefs.emailAddress} is not verified, not sending test email`);
        result.email_not_verified = true;
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
          // Format scan results for email
          let vulnerabilitiesList = '';
          if (Array.isArray(scanResults)) {
            vulnerabilitiesList = scanResults.map(vuln => `
              <div style="margin-bottom: 15px; padding: 10px; border-left: 4px solid ${vuln.severity === 'critical' ? '#dc2626' : vuln.severity === 'high' ? '#ea580c' : '#eab308'}; background-color: #f8fafc;">
                <h3 style="margin-top: 0; margin-bottom: 5px; color: #1e293b;">${vuln.title || 'Untitled Vulnerability'}</h3>
                <p style="margin-top: 0; color: #334155;">${vuln.description || 'No description provided'}</p>
                <div style="font-size: 12px; color: #64748b;">
                  <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background-color: ${vuln.severity === 'critical' ? '#fee2e2' : vuln.severity === 'high' ? '#ffedd5' : '#fef9c3'}; color: ${vuln.severity === 'critical' ? '#b91c1c' : vuln.severity === 'high' ? '#c2410c' : '#a16207'}; margin-right: 8px;">${vuln.severity}</span>
                  ${vuln.system ? `<span>System: ${vuln.system}</span>` : ''}
                  ${vuln.cve ? `<span style="margin-left: 8px;">CVE: ${vuln.cve}</span>` : ''}
                </div>
              </div>
            `).join('');
          } else {
            vulnerabilitiesList = '<p>Vulnerability details not available</p>';
          }

          // Send actual email with SendGrid
          const emailSubject = `HAWK Security - ${severity.toUpperCase()} Vulnerability Alert`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h1 style="color: #333; text-align: center;">Security Alert</h1>
              <div style="background-color: ${severity === 'critical' ? '#fee2e2' : severity === 'high' ? '#ffedd5' : '#fef9c3'}; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <h2 style="color: ${severity === 'critical' ? '#b91c1c' : severity === 'high' ? '#c2410c' : '#a16207'}; margin-top: 0; font-size: 18px;">
                  ${severity.toUpperCase()} Security Vulnerability Detected
                </h2>
                <p>A recent scan has detected ${scanResults?.length || 'new'} ${severity} vulnerabilities in your system.</p>
              </div>
              
              <h3 style="color: #4F46E5;">Vulnerability Details</h3>
              ${vulnerabilitiesList}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get("PUBLIC_URL") || "http://localhost:8080"}/alerts" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Details in Dashboard</a>
              </div>
              
              <p>Please review these vulnerabilities as soon as possible and take appropriate action to secure your systems.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
                <p>© ${new Date().getFullYear()} HAWK Security. All rights reserved.</p>
                <p>You're receiving this email because you've enabled security notifications in your HAWK Security settings.</p>
              </div>
            </div>
          `;
          
          try {
            await sendEmail(notificationPrefs.emailAddress, emailSubject, emailHtml);
            deliveryStatus.email = true;
          } catch (emailError) {
            console.error(`Error sending vulnerability notification email:`, emailError);
          }
        } else {
          console.log(`Email ${notificationPrefs.emailAddress} is not verified, not sending email`);
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
