
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
    
    // Filter results based on user alert level preference
    let filteredResults = scanResults;
    if (notificationSettings.alertLevel === "critical") {
      filteredResults = scanResults.filter(result => result.severity === "critical");
    } else if (notificationSettings.alertLevel === "high") {
      filteredResults = scanResults.filter(result => 
        result.severity === "critical" || result.severity === "high"
      );
    }
    
    if (filteredResults.length === 0) {
      console.log("No vulnerabilities match the user's alert level preferences");
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
    
    // Store notification in database for history
    const notificationsToInsert = filteredResults.map(result => ({
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
    
    // Send email notifications if enabled
    if (notificationSettings.emailEnabled && notificationSettings.emailAddress) {
      const subject = `HAWK Security Alert: ${filteredResults.length} new ${severity} vulnerability alerts`;
      let body = `Dear User,\n\nHAWK Security has detected ${filteredResults.length} new vulnerability alerts in your recent ${scanType} scan.\n\n`;
      
      // Add top 5 vulnerabilities to the email
      body += "Top Vulnerabilities:\n";
      filteredResults.slice(0, 5).forEach((result, index) => {
        body += `\n${index + 1}. ${result.title || result.cve || "Unknown"} (${result.severity})\n`;
        body += `   Description: ${result.description || "No description available"}\n`;
        if (result.system) {
          body += `   System: ${result.system}\n`;
        }
      });
      
      if (filteredResults.length > 5) {
        body += `\n...and ${filteredResults.length - 5} more vulnerabilities.\n`;
      }
      
      body += "\nPlease log in to your HAWK Security Dashboard to view full details.\n\nStay Secure,\nHAWK Security Team";
      
      await sendEmailNotification(notificationSettings.emailAddress, subject, body);
    }
    
    // Send SMS notifications if enabled
    if (notificationSettings.smsEnabled && notificationSettings.phoneNumber) {
      const message = `HAWK Security Alert: ${filteredResults.length} new ${severity} vulnerability alerts detected. Log in to your dashboard for details.`;
      await sendSMSNotification(notificationSettings.phoneNumber, message);
    }
    
    console.log(`Successfully processed ${filteredResults.length} notifications`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: filteredResults.length,
        notificationMethods: {
          email: notificationSettings.emailEnabled,
          sms: notificationSettings.smsEnabled
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
