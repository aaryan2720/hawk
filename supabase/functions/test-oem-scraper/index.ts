
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
    // Get request data
    const { url, name, system_type } = await req.json();
    
    if (!url) {
      throw new Error("URL is required");
    }

    console.log(`Testing OEM source: ${name} (${url})`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // In a real implementation, we would scrape the URL for vulnerabilities
    // For this example, we'll simulate a successful test with random data
    const isValidURL = url.startsWith('http://') || url.startsWith('https://');
    
    if (!isValidURL) {
      throw new Error("Invalid URL format. URL must start with http:// or https://");
    }
    
    // Simulate scraping time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a random number of vulnerabilities found
    const vulnerabilitiesCount = Math.floor(Math.random() * 5);
    
    // Update the last_checked timestamp for this source if it exists
    if (req.headers.get('Authorization')) {
      try {
        // Extract user information from the JWT token
        const authHeader = req.headers.get('Authorization') || '';
        const token = authHeader.replace('Bearer ', '');
        
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        
        if (authError || !user) {
          console.error("Auth error:", authError);
        } else {
          // Find and update the OEM source
          const { data: sources, error: sourcesError } = await supabaseClient
            .from('oem_sources')
            .select('id')
            .eq('user_id', user.id)
            .eq('url', url)
            .eq('name', name);
            
          if (!sourcesError && sources && sources.length > 0) {
            await supabaseClient
              .from('oem_sources')
              .update({ last_checked: new Date().toISOString() })
              .eq('id', sources[0].id);
          }
        }
      } catch (err) {
        console.error("Error updating last_checked timestamp:", err);
        // Continue anyway, as this is just an additional feature
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        vulnerabilitiesCount,
        message: `Successfully tested "${name}" OEM source` 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in test-oem-scraper function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
