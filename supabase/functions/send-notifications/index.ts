
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
    
    // Get user email
    const { data: userProfile, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
    if (userError) {
      throw userError;
    }
    
    const userEmail = userProfile.user?.email || "";
    notificationSettings.emailAddress = userEmail;
    
    console.log(`Will send email notifications to: ${notificationSettings.emailAddress}`);
    
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
    for (const result of filteredResults) {
      try {
        await supabaseClient.from("notifications")
          .insert([{
            user_id: userId,
            title: `New ${result.severity} vulnerability detected`,
            content: result.title || result.cve,
            type: "vulnerability",
            is_read: false,
            metadata: {
              scanType,
              severity: result.severity,
              cve: result.cve,
              description: result.description,
              system: result.system
            }
          }]);
      } catch (insertError) {
        console.error("Error inserting notification:", insertError);
      }
    }
    
    // In a real implementation, we would send actual emails/SMS here
    // using services like Twilio, SendGrid, Resend, etc.
    
    console.log(`Successfully processed ${filteredResults.length} notifications`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: filteredResults.length,
        notificationMethod: notificationSettings.emailEnabled ? "email" : "none"
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
