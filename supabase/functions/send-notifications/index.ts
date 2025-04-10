
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  scanResults?: any[];
  scanType?: string;
  severity?: string;
  action?: string;
  email?: string;
}

interface UserNotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailAddress: string;
  phoneNumber: string;
  alertLevel: string;
  emailVerified?: boolean;
  frequency?: string;
  timeframe?: string;
}

interface NotificationRule {
  id: string;
  name: string;
  condition: string;
  severity?: string;
  system?: string;
  enabled: boolean;
  actions: string[];
}

// Function to send email notifications
async function sendEmailNotification(email: string, subject: string, body: string) {
  console.log(`Sending email to ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  
  try {
    // Check if we have SendGrid or Resend API key available
    const emailApiKey = Deno.env.get("SENDGRID_API_KEY") || Deno.env.get("RESEND_API_KEY");
    
    if (!emailApiKey) {
      console.log("No email service API key found - email would be sent if configured");
      // For demo purposes, simulate successful sending
      return { success: true, message: "Email sending simulation successful (no API key configured)" };
    }
    
    // Here we would typically connect to SendGrid, Resend etc.
    // For this demo, we'll simulate a successful send
    console.log("Email would be sent with API key available");
    return { success: true, message: "Email sent successfully (simulated)" };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}

// Function to send SMS notifications
async function sendSMSNotification(phoneNumber: string, message: string) {
  console.log(`Sending SMS to ${phoneNumber}`);
  console.log(`Message: ${message}`);
  
  try {
    // Check if we have Twilio API keys available
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    
    if (!twilioSid || !twilioToken) {
      console.log("No SMS service API keys found - SMS would be sent if configured");
      // For demo purposes, simulate successful sending
      return { success: true, message: "SMS sending simulation successful (no API keys configured)" };
    }
    
    // Here we would typically connect to Twilio 
    // For this demo, we'll simulate a successful send
    console.log("SMS would be sent with API keys available");
    return { success: true, message: "SMS sent successfully (simulated)" };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
}

// Verify an email address by sending a verification link
async function sendVerificationEmail(email: string, userId: string, supabaseClient: any) {
  console.log(`Sending verification email to ${email} for user ${userId}`);
  
  try {
    // Generate a verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration
    
    try {
      // Store verification token
      const { error } = await supabaseClient
        .from("verification_tokens")
        .insert({
          user_id: userId,
          email: email,
          token: verificationToken,
          expires_at: expiresAt.toISOString(),
          type: "email_verification"
        });
      
      if (error) {
        console.log("Error storing verification token:", error);
        // Continue anyway for demo purposes
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
      // For demo, continue even if database operation fails
    }
    
    // Create verification URL (should point to your frontend)
    const verificationUrl = `https://b1a74c8c-51c3-46a2-ae25-be24252b3af1.lovableproject.com/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    
    const subject = "Verify your email for HAWK Security notifications";
    const body = `
      Hello,
      
      Please verify this email address to receive HAWK Security notifications.
      
      Click the link below to verify:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't request this verification, please ignore this email.
      
      HAWK Security Team
    `;
    
    // Send the verification email
    return await sendEmailNotification(email, subject, body);
  } catch (error) {
    console.error("Error in sendVerificationEmail:", error);
    return { success: false, error: error.message };
  }
}

// Matches a vulnerability result against notification rules
function matchesRule(result: any, rule: NotificationRule): boolean {
  if (!rule.enabled) return false;
  
  switch (rule.condition) {
    case 'severity':
      return result.severity === rule.severity;
    case 'system':
      return result.system?.toLowerCase().includes(rule.system?.toLowerCase() || '');
    case 'cve':
      return result.cve === rule.system; // Using 'system' field to store the CVE value in rules
    default:
      return false;
  }
}

// Initialize Supabase client
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received notification request");
    
    // Initialize Supabase client
    const supabaseClient = createSupabaseClient();
    
    const requestData: NotificationRequest = await req.json();
    const { userId, scanResults, scanType, severity, action, email } = requestData;
    
    console.log(`Processing request: userId=${userId}, action=${action}, email=${email}`);
    
    if (!userId) {
      throw new Error("Missing required userId parameter");
    }

    // Handle special actions
    if (action === "verify-email" && email) {
      console.log(`Handling verify-email action for ${email}`);
      const verificationResult = await sendVerificationEmail(email, userId, supabaseClient);
      
      return new Response(
        JSON.stringify({ success: true, message: "Verification email sent", result: verificationResult }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // For regular notifications, we need scan results
    if (!scanResults || !scanResults.length) {
      throw new Error("Missing required scan results parameters");
    }
    
    console.log(`Processing notifications for user ${userId} with ${scanResults.length} results`);
    
    // Get user profile and notification settings
    const { data: userSettings, error: settingsError } = await supabaseClient
      .from("user_systems")
      .select("monitoring_settings")
      .eq("user_id", userId)
      .maybeSingle();
      
    if (settingsError) {
      throw settingsError;
    }
    
    // Default notification settings if none found
    const notificationSettings: UserNotificationSettings = {
      emailEnabled: true,
      smsEnabled: false, 
      emailAddress: "", 
      phoneNumber: "",
      alertLevel: "critical",
      emailVerified: false,
      frequency: "immediate",
      timeframe: "any"
    };
    
    // Apply user settings if available
    if (userSettings?.monitoring_settings) {
      console.log("Found user settings:", JSON.stringify(userSettings.monitoring_settings));
      const settings = userSettings.monitoring_settings;
      if (settings.notificationPreferences) {
        notificationSettings.emailEnabled = !!settings.notificationPreferences.emailEnabled;
        notificationSettings.smsEnabled = !!settings.notificationPreferences.smsEnabled;
        notificationSettings.emailAddress = settings.notificationPreferences.emailAddress || '';
        notificationSettings.phoneNumber = settings.notificationPreferences.phoneNumber || '';
        notificationSettings.alertLevel = settings.notificationPreferences.alertLevel || 'critical';
        notificationSettings.emailVerified = !!settings.notificationPreferences.emailVerified;
        notificationSettings.frequency = settings.notificationPreferences.frequency || 'immediate';
        notificationSettings.timeframe = settings.notificationPreferences.timeframe || 'any';
      }
    }
    
    // Override email address for testing if provided
    if (email && action !== "verify-email") {
      notificationSettings.emailAddress = email;
      notificationSettings.emailVerified = true; // Assume test email is verified
      console.log(`Using test email address: ${email}`);
    }
    
    // Get custom notification rules
    const notificationRules: NotificationRule[] = 
      userSettings?.monitoring_settings?.notificationRules || [];
    
    // Get user email if not specified in notification settings
    if (!notificationSettings.emailAddress) {
      const { data: userProfile, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
      if (userError) {
        throw userError;
      }
      
      notificationSettings.emailAddress = userProfile.user?.email || "";
      notificationSettings.emailVerified = true; // Assume login email is verified
    }
    
    console.log(`Will send email notifications to: ${notificationSettings.emailAddress} (Enabled: ${notificationSettings.emailEnabled}, Verified: ${notificationSettings.emailVerified})`);
    if (notificationSettings.smsEnabled) {
      console.log(`Will send SMS notifications to: ${notificationSettings.phoneNumber}`);
    }
    
    // First filter results based on user alert level preference (if custom rules not defined)
    let filteredResults = scanResults;
    if (notificationRules.length === 0) {
      if (notificationSettings.alertLevel === "critical") {
        filteredResults = scanResults.filter(result => result.severity === "critical");
      } else if (notificationSettings.alertLevel === "high") {
        filteredResults = scanResults.filter(result => 
          result.severity === "critical" || result.severity === "high"
        );
      }
    }
    
    // Track which notifications should be sent via each channel based on rules
    const emailNotifications: any[] = [];
    const smsNotifications: any[] = [];
    const appNotifications: any[] = [];
    
    // Process each result through rules
    filteredResults.forEach(result => {
      let matchedRule = false;
      
      // Check against custom rules first
      for (const rule of notificationRules) {
        if (matchesRule(result, rule)) {
          matchedRule = true;
          
          // Add to appropriate notification channels based on rule actions
          if (rule.actions.includes('email') && notificationSettings.emailEnabled) {
            emailNotifications.push(result);
          }
          
          if (rule.actions.includes('sms') && notificationSettings.smsEnabled) {
            smsNotifications.push(result);
          }
          
          if (rule.actions.includes('notification')) {
            appNotifications.push(result);
          }
          
          // Stop after first matching rule
          break;
        }
      }
      
      // If no custom rules matched and custom rules aren't defined, use default alertLevel
      if (!matchedRule && notificationRules.length === 0) {
        appNotifications.push(result);
        
        if (notificationSettings.emailEnabled) {
          emailNotifications.push(result);
        }
        
        if (notificationSettings.smsEnabled) {
          smsNotifications.push(result);
        }
      }
    });
    
    // If nothing matched rules, exit early
    if (appNotifications.length === 0 && emailNotifications.length === 0 && smsNotifications.length === 0) {
      console.log("No vulnerabilities match the user's notification rules or alert preferences");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No notifications sent - no results match user preferences" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Track which notifications were successfully delivered
    const delivered = {
      app: false,
      email: false,
      sms: false
    };
    
    // Store app notifications in database
    if (appNotifications.length > 0) {
      const notificationsToInsert = appNotifications.map(result => ({
        user_id: userId,
        title: `New ${result.severity} vulnerability detected`,
        content: result.title || result.cve || "Unknown vulnerability",
        type: "vulnerability",
        is_read: false,
        metadata: {
          scanType,
          severity: result.severity,
          cve: result.cve,
          description: result.description,
          system: result.system,
          delivered: {
            app: true,
            email: false,
            sms: false
          }
        }
      }));
      
      try {
        const { error: insertError } = await supabaseClient
          .from("notifications")
          .insert(notificationsToInsert);
        
        if (insertError) {
          console.error("Error inserting notifications:", insertError);
        } else {
          delivered.app = true;
        }
      } catch (insertErr) {
        console.error("Exception during notification insert:", insertErr);
      }
    }
    
    // Check if this is a test notification
    const isTestNotification = scanType === "test";
    
    // Send email notifications if there are any and email is verified
    let emailSent = false;
    // Allow sending to the email that is currently being tested (even if not verified)
    const isTestEmail = email && email === notificationSettings.emailAddress;
    
    if (emailNotifications.length > 0 && notificationSettings.emailEnabled && 
        notificationSettings.emailAddress && 
        (notificationSettings.emailVerified || isTestEmail || isTestNotification)) {
      
      const subject = `HAWK Security Alert: ${emailNotifications.length} new vulnerability alerts`;
      let body = `Dear User,\n\nHAWK Security has detected ${emailNotifications.length} new vulnerability alerts in your recent ${scanType} scan.\n\n`;
      
      // Add top vulnerabilities to the email
      body += "Top Vulnerabilities:\n";
      emailNotifications.slice(0, 5).forEach((result, index) => {
        body += `\n${index + 1}. ${result.title || result.cve || "Unknown"} (${result.severity})\n`;
        body += `   Description: ${result.description || "No description available"}\n`;
        if (result.system) {
          body += `   System: ${result.system}\n`;
        }
      });
      
      if (emailNotifications.length > 5) {
        body += `\n...and ${emailNotifications.length - 5} more vulnerabilities.\n`;
      }
      
      body += "\nPlease log in to your HAWK Security Dashboard to view full details.\n\nStay Secure,\nHAWK Security Team";
      
      try {
        const emailResult = await sendEmailNotification(notificationSettings.emailAddress, subject, body);
        console.log("Email result:", emailResult);
        emailSent = emailResult.success;
        delivered.email = emailResult.success;
        
        // Update the notifications to indicate email delivery status
        if (delivered.app && emailSent) {
          try {
            const { data: notifications } = await supabaseClient
              .from("notifications")
              .select("id")
              .eq("user_id", userId)
              .eq("is_read", false)
              .order("created_at", { ascending: false })
              .limit(appNotifications.length);
              
            if (notifications && notifications.length > 0) {
              const notificationIds = notifications.map(n => n.id);
              await supabaseClient.from("notifications")
                .update({ 
                  metadata: {
                    scanType,
                    severity: severity,
                    delivered: {
                      app: true, 
                      email: emailSent, 
                      sms: false
                    }
                  } 
                })
                .in("id", notificationIds);
            }
          } catch (updateErr) {
            console.error("Error updating notification email status:", updateErr);
          }
        }
      } catch (emailErr) {
        console.error("Error sending email:", emailErr);
      }
    } else {
      console.log(`Email not sent: enabled=${notificationSettings.emailEnabled}, address=${notificationSettings.emailAddress}, verified=${notificationSettings.emailVerified}, test=${isTestEmail}`);
    }
    
    // Send SMS notifications if there are any
    let smsSent = false;
    if (smsNotifications.length > 0 && notificationSettings.smsEnabled && 
        notificationSettings.phoneNumber && (isTestNotification || !isTestNotification)) {
      const message = `HAWK Security Alert: ${smsNotifications.length} new vulnerability alerts detected. Log in to your dashboard for details.`;
      
      try {
        const smsResult = await sendSMSNotification(notificationSettings.phoneNumber, message);
        console.log("SMS result:", smsResult);
        smsSent = smsResult.success;
        delivered.sms = smsResult.success;
        
        // Update the notifications to indicate SMS delivery status
        if (delivered.app && smsSent) {
          try {
            const { data: notifications } = await supabaseClient
              .from("notifications")
              .select("id")
              .eq("user_id", userId)
              .eq("is_read", false)
              .order("created_at", { ascending: false })
              .limit(appNotifications.length);
              
            if (notifications && notifications.length > 0) {
              const notificationIds = notifications.map(n => n.id);
              await supabaseClient.from("notifications")
                .update({ 
                  metadata: {
                    scanType,
                    severity: severity,
                    delivered: {
                      app: true, 
                      email: delivered.email, 
                      sms: smsSent
                    }
                  } 
                })
                .in("id", notificationIds);
            }
          } catch (updateErr) {
            console.error("Error updating notification SMS status:", updateErr);
          }
        }
      } catch (smsErr) {
        console.error("Error sending SMS:", smsErr);
      }
    }
    
    console.log(`Successfully processed notifications:
      - App: ${appNotifications.length} (Delivered: ${delivered.app})
      - Email: ${emailNotifications.length} (Sent: ${emailSent})
      - SMS: ${smsNotifications.length} (Sent: ${smsSent})`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: {
          app: appNotifications.length,
          email: emailNotifications.length,
          sms: smsNotifications.length
        },
        delivered: {
          app: delivered.app,
          email: delivered.email,
          sms: delivered.sms
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-notifications function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
