
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  scanResults: any[];
  scanType: string;
  severity: string;
}

interface UserNotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailAddress: string;
  phoneNumber: string;
  alertLevel: string;
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

// Function to send email notifications using a mock service (in production, use actual email service)
async function sendEmailNotification(email: string, subject: string, body: string) {
  console.log(`MOCK: Sending email to ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  
  // In a real implementation, we would use a service like SendGrid, Resend, or AWS SES
  // For now, we'll just log the email details
  return { success: true, message: "Email sent successfully (mock)" };
}

// Function to send SMS notifications using a mock service (in production, use actual SMS service)
async function sendSMSNotification(phoneNumber: string, message: string) {
  console.log(`MOCK: Sending SMS to ${phoneNumber}`);
  console.log(`Message: ${message}`);
  
  // In a real implementation, we would use a service like Twilio, Vonage, or AWS SNS
  // For now, we'll just log the SMS details
  return { success: true, message: "SMS sent successfully (mock)" };
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

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: NotificationRequest = await req.json();
    const { userId, scanResults, scanType, severity } = requestData;
    
    console.log(`Processing notifications for user ${userId} with ${scanResults.length} results`);
    
    if (!userId || !scanResults || !scanResults.length) {
      throw new Error("Missing required parameters");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );
    
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
      alertLevel: "critical"
    };
    
    // Apply user settings if available
    if (userSettings?.monitoring_settings) {
      const settings = userSettings.monitoring_settings;
      if (settings.notificationPreferences) {
        notificationSettings.emailEnabled = !!settings.notificationPreferences.emailEnabled;
        notificationSettings.smsEnabled = !!settings.notificationPreferences.smsEnabled;
        notificationSettings.phoneNumber = settings.notificationPreferences.phoneNumber || '';
        notificationSettings.alertLevel = settings.notificationPreferences.alertLevel || 'critical';
      }
    }
    
    // Get custom notification rules
    const notificationRules: NotificationRule[] = 
      userSettings?.monitoring_settings?.notificationRules || [];
    
    // Get user email
    const { data: userProfile, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
    if (userError) {
      throw userError;
    }
    
    const userEmail = userProfile.user?.email || "";
    notificationSettings.emailAddress = userEmail;
    
    console.log(`Will send email notifications to: ${notificationSettings.emailAddress}`);
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
          system: result.system
        }
      }));
      
      const { error: insertError } = await supabaseClient
        .from("notifications")
        .insert(notificationsToInsert);
      
      if (insertError) {
        console.error("Error inserting notifications:", insertError);
        // Continue despite error to at least try sending notifications via email/SMS
      }
    }
    
    // Send email notifications if there are any
    if (emailNotifications.length > 0 && notificationSettings.emailAddress) {
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
      
      await sendEmailNotification(notificationSettings.emailAddress, subject, body);
    }
    
    // Send SMS notifications if there are any
    if (smsNotifications.length > 0 && notificationSettings.smsEnabled && notificationSettings.phoneNumber) {
      const message = `HAWK Security Alert: ${smsNotifications.length} new vulnerability alerts detected. Log in to your dashboard for details.`;
      await sendSMSNotification(notificationSettings.phoneNumber, message);
    }
    
    console.log(`Successfully processed notifications:
      - App: ${appNotifications.length}
      - Email: ${emailNotifications.length}
      - SMS: ${smsNotifications.length}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: {
          app: appNotifications.length,
          email: emailNotifications.length,
          sms: smsNotifications.length
        },
        notificationMethods: {
          email: notificationSettings.emailEnabled && emailNotifications.length > 0,
          sms: notificationSettings.smsEnabled && smsNotifications.length > 0,
          app: appNotifications.length > 0
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
