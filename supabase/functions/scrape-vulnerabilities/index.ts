import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { DataSource, SourceMap, Vulnerability } from "./types.ts";
import { parseNVD, parseCVEDetails, parseCISA } from "./parsers.ts";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced multi-source configuration
const sources: SourceMap = {
  nvd: "https://services.nvd.nist.gov/rest/json/cves/2.0",
  'cisa-kev': "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
  'mitre-cve': "https://cve.mitre.org/data/downloads/allitems.csv",
  'vulndb-community': "https://vulndb.cyberriskanalytics.com/api/v1/vulnerabilities",
  'opencve': "https://www.opencve.io/api/cve",
  'osv-dev': "https://api.osv.dev/v1/vulns",
  'github-advisory': "https://api.github.com/advisories",
  'exploit-db': "https://www.exploit-db.com/rss.xml",
  'vulners': "https://vulners.com/api/v3/search/lucene/",
  'security-tracker': "https://security-tracker.debian.org/tracker/data/json"
};

// Enhanced CISA KEV parsing for real-time data
const fetchCISAKnownExploited = async (limit: number): Promise<Vulnerability[]> => {
  try {
    const response = await fetch("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json");
    if (!response.ok) throw new Error(`CISA API failed: ${response.status}`);
    
    const data = await response.json();
    const vulnerabilities: Vulnerability[] = [];
    
    if (data.vulnerabilities) {
      for (const vuln of data.vulnerabilities.slice(0, limit)) {
        vulnerabilities.push({
          cve: vuln.cveID || 'N/A',
          title: `${vuln.vendorProject} ${vuln.product}: ${vuln.shortDescription || vuln.vulnerabilityName}`,
          description: vuln.shortDescription || vuln.vulnerabilityName || 'Known exploited vulnerability',
          severity: 'critical', // CISA KEV are all high priority
          system: `${vuln.vendorProject} ${vuln.product}`,
          mitigation: `Apply vendor patch immediately. Due date: ${vuln.dueDate}`,
          details: {
            source: "CISA Known Exploited Vulnerabilities",
            vendor: vuln.vendorProject,
            product: vuln.product,
            published: vuln.dateAdded,
            dueDate: vuln.dueDate,
            notes: vuln.notes,
            zeroDay: true,
            hasExploit: true,
            threatLevel: 'immediate'
          }
        });
      }
    }
    
    return vulnerabilities;
  } catch (error) {
    console.error("Error fetching CISA KEV data:", error);
    return [];
  }
};

// Fetch from GitHub Security Advisory Database
const fetchGitHubAdvisories = async (limit: number): Promise<Vulnerability[]> => {
  try {
    const response = await fetch(`https://api.github.com/advisories?per_page=${limit}&sort=published&direction=desc`);
    if (!response.ok) throw new Error(`GitHub API failed: ${response.status}`);
    
    const data = await response.json();
    const vulnerabilities: Vulnerability[] = [];
    
    for (const advisory of data) {
      const severity = advisory.severity?.toLowerCase() || 'medium';
      
      vulnerabilities.push({
        cve: advisory.cve_id || advisory.ghsa_id,
        title: advisory.summary || advisory.title,
        description: advisory.description || 'GitHub Security Advisory',
        severity: severity,
        system: advisory.package?.name || 'Multiple packages',
        mitigation: `Review GitHub advisory: ${advisory.html_url}`,
        details: {
          source: "GitHub Security Advisory Database",
          published: advisory.published_at,
          updated: advisory.updated_at,
          url: advisory.html_url,
          ghsa_id: advisory.ghsa_id,
          package: advisory.package?.name,
          ecosystem: advisory.package?.ecosystem
        }
      });
    }
    
    return vulnerabilities;
  } catch (error) {
    console.error("Error fetching GitHub advisories:", error);
    return [];
  }
};

// Fetch from OSV.dev (Google's Open Source Vulnerabilities)
const fetchOSVVulnerabilities = async (limit: number): Promise<Vulnerability[]> => {
  try {
    // OSV.dev query for recent vulnerabilities
    const query = {
      page_token: "",
      query: {
        timestamp: {
          end: new Date().toISOString(),
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
        }
      }
    };

    const response = await fetch('https://api.osv.dev/v1/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) throw new Error(`OSV API failed: ${response.status}`);
    
    const data = await response.json();
    const vulnerabilities: Vulnerability[] = [];
    
    if (data.vulns) {
      for (const vuln of data.vulns.slice(0, limit)) {
        const severity = vuln.database_specific?.severity || 'medium';
        
        vulnerabilities.push({
          cve: vuln.id,
          title: vuln.summary || `OSV Vulnerability ${vuln.id}`,
          description: vuln.details || vuln.summary || 'Open source vulnerability',
          severity: severity.toLowerCase(),
          system: vuln.affected?.[0]?.package?.name || 'Open source package',
          mitigation: `Check OSV for details: https://osv.dev/vulnerability/${vuln.id}`,
          details: {
            source: "OSV (Open Source Vulnerabilities)",
            published: vuln.published,
            modified: vuln.modified,
            url: `https://osv.dev/vulnerability/${vuln.id}`,
            ecosystem: vuln.affected?.[0]?.package?.ecosystem,
            package: vuln.affected?.[0]?.package?.name
          }
        });
      }
    }
    
    return vulnerabilities;
  } catch (error) {
    console.error("Error fetching OSV vulnerabilities:", error);
    return [];
  }
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { source, limit = 5, sendNotifications = true, userId = null, multiSource = false } = await req.json();
    
    console.log(`Enhanced multi-source scanning from ${source} source`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    let vulnerabilities: Vulnerability[] = [];
    let count = 0;
    let usedFallback = false;

    // Enhanced source handling with multiple free sources
    if (source === 'cisa-kev') {
      vulnerabilities = await fetchCISAKnownExploited(limit);
    } else if (source === 'github-advisory') {
      vulnerabilities = await fetchGitHubAdvisories(limit);
    } else if (source === 'osv-dev') {
      vulnerabilities = await fetchOSVVulnerabilities(limit);
    } else if (source === 'nvd') {
      // Try NVD API with fallback for rate limits
      try {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const pubStartDate = sevenDaysAgo.toISOString().split('T')[0];
        const pubEndDate = today.toISOString().split('T')[0];

        const queryParams = new URLSearchParams({
          pubStartDate,
          pubEndDate,
          resultsPerPage: String(limit || 10)
        });
        
        const apiUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?${queryParams.toString()}`;
        console.log(`NVD API Request URL: ${apiUrl}`);

        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };
        
        // Add API key if available
        const nvdApiKey = Deno.env.get("NVD_API_KEY");
        if (nvdApiKey) {
          headers['apiKey'] = nvdApiKey;
        }

        const response = await fetch(apiUrl, { headers });

        if (response.ok) {
          const data = await response.json();
          
          if (data && data.vulnerabilities) {
            console.log(`Found ${data.vulnerabilities.length} vulnerabilities from NVD API`);
            
            for (const item of data.vulnerabilities) {
              const cve = item.cve;
              const cveId = cve.id;
              const description = cve.descriptions?.find(d => d.lang === 'en')?.value || 
                                 'No description available';
              
              let severity = 'medium';
              let score = 0;
              
              // Extract CVSS score and severity
              if (cve.metrics?.cvssMetricV31) {
                const cvssData = cve.metrics.cvssMetricV31[0]?.cvssData;
                if (cvssData) {
                  score = cvssData.baseScore || 0;
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
                system: "NVD Database",
                mitigation: "Check vendor website for patches and mitigation strategies.",
                details: {
                  source: "NVD API",
                  published: publishedDate,
                  lastModified: cve.lastModified || publishedDate,
                  cvssScore: score
                }
              });
            }
          }
        } else {
          throw new Error(`NVD API responded with status: ${response.status} - Likely rate limited`);
        }
      } catch (nvdError) {
        console.error("NVD API error (likely rate limited):", nvdError);
        usedFallback = true;
        
        // Fallback to CISA KEV when NVD fails
        console.log("Falling back to CISA KEV due to NVD rate limits");
        vulnerabilities = await fetchCISAKnownExploited(limit);
      }
    } else {
      // For other sources, use fallback mock data
      console.log(`Using mock data for source: ${source}`);
      usedFallback = true;
      vulnerabilities = [
        {
          cve: `CVE-2025-${Date.now().toString().slice(-4)}`,
          title: `Mock vulnerability from ${source}`,
          description: `Sample vulnerability data from ${source} source - API unavailable`,
          severity: 'medium',
          system: `${source} System`,
          mitigation: "Mock mitigation data",
          details: {
            source: source,
            published: new Date().toISOString(),
            mock: true
          }
        }
      ];
    }

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
        vulnerabilities,
        source,
        usedFallback,
        multiSourceScan: multiSource,
        freeSource: source !== 'nvd'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in enhanced multi-source scraper:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
