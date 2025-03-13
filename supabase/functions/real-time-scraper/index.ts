
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// NVD API endpoint
const NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting real-time vulnerability fetching from NVD API...");
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Get request data
    const { source, limit = 18 } = await req.json().catch(() => ({}));
    
    // Create a new Date object for the current date
    const currentDate = new Date();
    // Create a new Date object for 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Format dates for the NVD API (YYYY-MM-DD)
    const pubStartDate = sevenDaysAgo.toISOString().split('T')[0];
    const pubEndDate = currentDate.toISOString().split('T')[0];
    
    console.log(`Fetching vulnerabilities from ${pubStartDate} to ${pubEndDate}, limit: ${limit}`);
    
    // Construct URL with query parameters
    let apiUrl = `${NVD_API_URL}?pubStartDate=${pubStartDate}T00:00:00.000&pubEndDate=${pubEndDate}T23:59:59.999`;
    
    // Add CVSS severity filter if provided in the source parameter
    if (source === "critical") {
      apiUrl += "&cvssV3Severity=CRITICAL";
    } else if (source === "high") {
      apiUrl += "&cvssV3Severity=HIGH";
    } else if (source === "medium") {
      apiUrl += "&cvssV3Severity=MEDIUM";
    } else if (source === "low") {
      apiUrl += "&cvssV3Severity=LOW";
    }
    
    // Limit results
    apiUrl += `&resultsPerPage=${limit}`;
    
    console.log(`Requesting data from: ${apiUrl}`);
    
    // Prepare headers for NVD API request
    const headers: HeadersInit = {};
    
    // Add API key if available from environment
    const nvdApiKey = Deno.env.get("NVD_API_KEY");
    if (nvdApiKey) {
      console.log("Using NVD API key from environment");
      headers["apiKey"] = nvdApiKey;
    }
    
    // Fetch data from NVD API
    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch from NVD API: ${response.status} ${response.statusText}`);
      console.error(`Error details: ${errorText}`);
      throw new Error(`Failed to fetch from NVD API: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Received ${data.vulnerabilities?.length || 0} vulnerabilities from NVD API`);
    
    // Process vulnerabilities from the NVD API response
    const results = [];
    
    for (const item of data.vulnerabilities || []) {
      const cve = item.cve;
      
      if (!cve) continue;
      
      // Extract CVE ID
      const cveId = cve.id;
      
      // Extract description
      let description = "No description available";
      if (cve.descriptions && cve.descriptions.length > 0) {
        // Find English description
        const englishDesc = cve.descriptions.find(d => d.lang === 'en');
        if (englishDesc) {
          description = englishDesc.value;
        }
      }
      
      // Extract CVSS data for severity
      let severity = "medium";
      let cvssScore = 0;
      
      if (cve.metrics) {
        // Prefer CVSS 3.x over 2.0
        if (cve.metrics.cvssMetricV31) {
          const cvssData = cve.metrics.cvssMetricV31[0];
          severity = cvssData.cvssData.baseSeverity.toLowerCase();
          cvssScore = cvssData.cvssData.baseScore;
        } else if (cve.metrics.cvssMetricV30) {
          const cvssData = cve.metrics.cvssMetricV30[0];
          severity = cvssData.cvssData.baseSeverity.toLowerCase();
          cvssScore = cvssData.cvssData.baseScore;
        } else if (cve.metrics.cvssMetricV2) {
          const cvssData = cve.metrics.cvssMetricV2[0];
          cvssScore = cvssData.cvssData.baseScore;
          // Convert CVSS 2.0 score to severity
          if (cvssScore >= 7.0) severity = "high";
          else if (cvssScore >= 4.0) severity = "medium";
          else severity = "low";
        }
      }
      
      // Extract affected systems
      let systems = "Unknown System";
      if (cve.configurations && cve.configurations.length > 0) {
        const nodes = cve.configurations[0].nodes;
        if (nodes && nodes.length > 0) {
          const cpeMatches = nodes[0].cpeMatch;
          if (cpeMatches && cpeMatches.length > 0) {
            // Extract vendor and product info from CPE
            const cpe = cpeMatches[0].criteria;
            if (cpe) {
              const parts = cpe.split(':');
              if (parts.length >= 5) {
                systems = `${parts[3]} ${parts[4]}`;
              }
            }
          }
        }
      }
      
      // Format date
      const publishedDate = cve.published ? new Date(cve.published).toISOString() : new Date().toISOString();
      
      // Check if this CVE already exists in our database
      const { data: existing } = await supabaseClient
        .from("alerts")
        .select("id")
        .eq("cve", cveId)
        .maybeSingle();
        
      if (existing) {
        console.log(`CVE ${cveId} already exists in database, skipping`);
        continue;
      }
      
      // Create the vulnerability object
      const vulnerability = {
        cve: cveId,
        title: `${cveId} - ${systems} Vulnerability`,
        description: description,
        severity: severity as 'low' | 'medium' | 'high' | 'critical',
        system: systems,
        date: publishedDate,
        status: "new",
        mitigation: "Check vendor website for patches and mitigation strategies.",
        details: {
          source: "NVD API",
          cvssScore: cvssScore,
          publishedDate: publishedDate,
          discoveryDate: publishedDate,
          additionalInfo: `Retrieved from NVD API during real-time scan`
        }
      };
      
      // Insert into database
      const { error } = await supabaseClient
        .from("alerts")
        .insert([vulnerability]);

      if (error) {
        console.error(`Error storing CVE ${cveId}:`, error);
      } else {
        console.log(`Successfully stored CVE ${cveId} from NVD API`);
        results.push({ 
          cve: cveId, 
          source: "NVD API", 
          severity: severity,
          description: description.length > 60 ? description.substring(0, 60) + '...' : description
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Real-time vulnerability fetching completed",
        count: results.length,
        results 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in real-time-scraper function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
