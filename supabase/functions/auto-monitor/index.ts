
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting automatic vulnerability monitoring...");
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Get all users with automatic monitoring enabled
    const { data: usersToMonitor, error: userError } = await supabaseClient
      .from("user_systems")
      .select("*")
      .contains('monitoring_settings', { autoScanEnabled: true });
      
    if (userError) {
      throw userError;
    }
    
    console.log(`Found ${usersToMonitor?.length || 0} users with automatic monitoring enabled`);
    
    if (!usersToMonitor || usersToMonitor.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No users with automatic monitoring enabled"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const now = new Date();
    const results = [];
    
    // Process each user
    for (const user of usersToMonitor) {
      const settings = user.monitoring_settings || {};
      const lastScanTime = settings.lastScanTime ? new Date(settings.lastScanTime) : null;
      const scanInterval = settings.scanInterval || 24; // Default to 24 hours
      
      // Skip if last scan was less than the configured interval ago
      if (lastScanTime) {
        const nextScanTime = new Date(lastScanTime);
        nextScanTime.setHours(nextScanTime.getHours() + scanInterval);
        
        if (now < nextScanTime) {
          console.log(`Skipping scan for user ${user.user_id}, next scan at ${nextScanTime.toISOString()}`);
          continue;
        }
      }
      
      console.log(`Running scan for user ${user.user_id}`);
      
      try {
        // Set up request for real-time-scraper edge function
        const scanRequest = {
          source: settings.criticalOnly ? 'critical' : 'all',
          userId: user.user_id
        };
        
        // Call the real-time-scraper
        const { data, error } = await supabaseClient.functions.invoke('real-time-scraper', {
          body: scanRequest
        });
        
        if (error) {
          console.error(`Error running scan for user ${user.user_id}:`, error);
          results.push({
            userId: user.user_id,
            scanTime: now.toISOString(),
            status: 'error',
            error: error.message
          });
          continue;
        }
        
        console.log(`Scan completed for user ${user.user_id}: ${data.count} vulnerabilities found`);
        
        // Update results
        results.push({
          userId: user.user_id,
          scanTime: now.toISOString(),
          status: 'success',
          vulnerabilitiesFound: data.count,
          usedMockData: data.usedMockData || false
        });
      } catch (scanError) {
        console.error(`Exception during scan for user ${user.user_id}:`, scanError);
        results.push({
          userId: user.user_id,
          scanTime: now.toISOString(),
          status: 'error',
          error: scanError instanceof Error ? scanError.message : String(scanError)
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Automatic monitoring completed",
        scansCompleted: results.length,
        results 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in auto-monitor function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
