
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { DataSource, SourceMap } from "./types.ts";
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

    // Get source URL
    const url = sources[source];
    console.log(`Scraping vulnerabilities from ${source}: ${url}`);

    // Fetch the page
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const document = parser.parseFromString(html, "text/html");

    let vulnerabilities = [];

    // Different parsing logic for each source
    switch (source as DataSource) {
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

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Store vulnerabilities in the database
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
            system: vuln.system || "Unknown",
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
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: vulnerabilities.length,
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
