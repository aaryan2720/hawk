
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { DataSource, SourceMap, Vulnerability } from "./types.ts";
import { parseNVD, parseCVEDetails, parseCISA } from "./parsers.ts";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sources: SourceMap = {
  nvd: "https://nvd.nist.gov/vuln/data-feeds",
  cveDetails: "https://www.cvedetails.com/vulnerability-list/",
  cisaKev: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
};

// NVD API endpoint
const NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { source, limit = 5 } = await req.json();
    
    if (!source || !Object.keys(sources).includes(source)) {
      throw new Error("Invalid or missing source parameter");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    let vulnerabilities: Vulnerability[] = [];
    let sourceType = source as DataSource;

    console.log(`Fetching vulnerabilities from ${source} source`);

    // Current date for query parameters
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Format dates for NVD API
    const pubStartDate = sevenDaysAgo.toISOString().split('T')[0];
    const pubEndDate = today.toISOString().split('T')[0];

    // First try to get real data from NVD API
    try {
      // Build the URL with query parameters
      const queryParams = new URLSearchParams({
        pubStartDate,
        pubEndDate,
        resultsPerPage: String(limit || 10)
      });
      
      // Add severity filter if specified
      if (sourceType === 'cisaKev') {
        queryParams.append('cvssV3Severity', 'CRITICAL');
      }
      
      const apiUrl = `${NVD_API_URL}?${queryParams.toString()}`;
      console.log(`API Request URL: ${apiUrl}`);

      // Fetch vulnerabilities from NVD API
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`NVD API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.vulnerabilities) {
        console.log(`Found ${data.vulnerabilities.length} vulnerabilities from NVD API`);
        
        for (const item of data.vulnerabilities) {
          const cve = item.cve;
          const cveId = cve.id;
          const description = cve.descriptions?.find(d => d.lang === 'en')?.value || 
                             'No description available';
          
          let severity = 'medium';
          if (cve.metrics?.cvssMetricV31) {
            const cvssData = cve.metrics.cvssMetricV31[0]?.cvssData;
            if (cvssData) {
              const score = cvssData.baseScore || 0;
              if (score >= 9.0) severity = 'critical';
              else if (score >= 7.0) severity = 'high';
              else if (score >= 4.0) severity = 'medium';
              else severity = 'low';
            }
          }
          
          const title = `${cveId}: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`;
          const publishedDate = cve.published || new Date().toISOString();
          
          vulnerabilities.push({
            cve: cveId,
            title: title,
            description: description,
            severity: severity,
            system: cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria || 
                   (sourceType === 'nvd' ? "NVD Database" : 
                    sourceType === 'cveDetails' ? "CVE Details Database" : 
                    "CISA Known Exploited Vulnerabilities"),
            mitigation: "Check vendor website for patches and mitigation strategies.",
            details: {
              source: sourceType,
              published: publishedDate,
              lastModified: cve.lastModified || publishedDate,
              cvssScore: cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 0
            }
          });
        }
      }
    } catch (apiError) {
      console.error("Error fetching from NVD API:", apiError);
      
      // If real API fails, use web scraping as fallback
      // Get source URL
      const url = sources[source];
      console.log(`Falling back to web scraping from ${source}: ${url}`);

      // Fetch the page
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const document = parser.parseFromString(html, "text/html");

      // Different parsing logic for each source
      switch (sourceType) {
        case "nvd":
          vulnerabilities = parseNVD(document, limit);
          break;
        case "cveDetails":
          vulnerabilities = parseCVEDetails(document, limit);
          break;
        case "cisaKev":
          vulnerabilities = parseCISA(document, limit);
          break;
      }
    }

    // Store vulnerabilities in the database
    let count = 0;
    for (const vuln of vulnerabilities) {
      // Check if vulnerability already exists
      const { data: existing } = await supabaseClient
        .from("alerts")
        .select("id")
        .eq("cve", vuln.cve)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabaseClient.from("alerts").insert([
          {
            title: vuln.title,
            description: vuln.description,
            system: vuln.system,
            severity: vuln.severity,
            cve: vuln.cve,
            date: new Date().toISOString(),
            status: "new",
            mitigation: vuln.mitigation,
            patch_link: vuln.patchLink,
            details: vuln.details
          }
        ]);

        if (error) {
          console.error("Error storing vulnerability:", error);
        } else {
          count++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count,
        vulnerabilities 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in scrape-vulnerabilities function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
