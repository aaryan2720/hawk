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
  cisaKev: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
  "cisa-kev": "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
  "mitre-attack": "https://attack.mitre.org/",
  "exploit-db": "https://www.exploit-db.com/",
  "vulndb": "https://vulndb.cyberriskanalytics.com/"
};

// NVD API endpoint
const NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";

// Enhanced vulnerability detection with zero-day identification
const enhanceVulnerabilityData = (vulnerability: Vulnerability): Vulnerability => {
  const description = vulnerability.description.toLowerCase();
  const now = new Date();
  const publishedDate = vulnerability.details?.published ? new Date(vulnerability.details.published) : now;
  const daysSincePublished = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Zero-day detection keywords
  const zeroKeywords = ['zero-day', '0-day', 'no patch', 'unpatched', 'in-the-wild', 'active exploitation'];
  const isZeroDay = zeroKeywords.some(keyword => description.includes(keyword)) || 
                   (daysSincePublished <= 1 && vulnerability.severity === 'critical');
  
  // Exploit detection keywords
  const exploitKeywords = ['exploit', 'poc', 'proof of concept', 'metasploit', 'remote code execution'];
  const hasExploit = exploitKeywords.some(keyword => description.includes(keyword));
  
  // Enhanced details
  const enhancedDetails = {
    ...vulnerability.details,
    zeroDay: isZeroDay,
    hasExploit: hasExploit,
    daysSincePublished,
    threatLevel: isZeroDay ? 'immediate' : vulnerability.severity === 'critical' ? 'urgent' : 'standard',
    enhancedScoring: {
      baseScore: getBaseCVSSScore(vulnerability),
      customScore: calculateCustomScore(vulnerability, isZeroDay, hasExploit, daysSincePublished),
      riskFactors: {
        zeroDay: isZeroDay,
        hasExploit: hasExploit,
        recentDiscovery: daysSincePublished <= 7,
        criticalSystem: isHighImpactSystem(vulnerability.system)
      }
    }
  };
  
  return {
    ...vulnerability,
    details: enhancedDetails
  };
};

const getBaseCVSSScore = (vulnerability: Vulnerability): number => {
  if (vulnerability.details?.cvssScore) {
    return Number(vulnerability.details.cvssScore);
  }
  
  // Default scoring based on severity
  switch (vulnerability.severity) {
    case 'critical': return 9.5;
    case 'high': return 7.5;
    case 'medium': return 5.0;
    case 'low': return 2.5;
    default: return 5.0;
  }
};

const calculateCustomScore = (vulnerability: Vulnerability, isZeroDay: boolean, hasExploit: boolean, daysSince: number): number => {
  let baseScore = getBaseCVSSScore(vulnerability);
  
  // Zero-day boost
  if (isZeroDay) baseScore *= 1.5;
  
  // Exploit availability boost
  if (hasExploit) baseScore *= 1.3;
  
  // Recency boost
  if (daysSince <= 1) baseScore *= 1.2;
  else if (daysSince <= 7) baseScore *= 1.1;
  
  // System criticality boost
  if (isHighImpactSystem(vulnerability.system)) baseScore *= 1.2;
  
  return Math.min(baseScore, 10);
};

const isHighImpactSystem = (system: string): boolean => {
  const highImpactKeywords = ['authentication', 'admin', 'root', 'kernel', 'database', 'web server'];
  return highImpactKeywords.some(keyword => system.toLowerCase().includes(keyword));
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
            zeroDay: true, // CISA KEV implies active exploitation
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

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { source, limit = 5, sendNotifications = true, userId = null } = await req.json();
    
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

    console.log(`Enhanced scanning from ${source} source with zero-day detection`);

    // Enhanced source handling
    if (sourceType === 'cisa-kev') {
      vulnerabilities = await fetchCISAKnownExploited(limit);
    } else {
      // Current date for query parameters
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      // Format dates for NVD API
      const pubStartDate = sevenDaysAgo.toISOString().split('T')[0];
      const pubEndDate = today.toISOString().split('T')[0];

      // Try to get real data from NVD API first
      try {
        const nvdApiKey = Deno.env.get("NVD_API_KEY");
        
        const queryParams = new URLSearchParams({
          pubStartDate,
          pubEndDate,
          resultsPerPage: String(limit || 10)
        });
        
        if (sourceType === 'cisaKev') {
          queryParams.append('cvssV3Severity', 'CRITICAL');
        }
        
        const apiUrl = `${NVD_API_URL}?${queryParams.toString()}`;
        console.log(`Enhanced API Request URL: ${apiUrl}`);

        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };
        
        if (nvdApiKey) {
          headers['apiKey'] = nvdApiKey;
        }

        const response = await fetch(apiUrl, { headers });

        if (response.ok) {
          const data = await response.json();
          
          if (data && data.vulnerabilities) {
            console.log(`Found ${data.vulnerabilities.length} vulnerabilities from enhanced NVD API`);
            
            for (const item of data.vulnerabilities) {
              // ... keep existing code (CVE parsing logic)
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
              } else if (cve.metrics?.cvssMetricV30) {
                const cvssData = cve.metrics.cvssMetricV30[0]?.cvssData;
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
              
              let systems = "";
              if (cve.configurations && cve.configurations.length > 0) {
                // ... keep existing code (systems extraction)
                for (const config of cve.configurations) {
                  if (config.nodes && config.nodes.length > 0) {
                    for (const node of config.nodes) {
                      if (node.cpeMatch && node.cpeMatch.length > 0) {
                        for (const cpe of node.cpeMatch) {
                          if (cpe.criteria) {
                            const cpeParts = cpe.criteria.split(':');
                            if (cpeParts.length >= 5) {
                              const vendor = cpeParts[3];
                              const product = cpeParts[4];
                              if (vendor && product) {
                                systems += `${vendor} ${product}, `;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              
              systems = systems.replace(/,\s*$/, "");
              if (!systems) {
                systems = sourceType === 'nvd' ? "NVD Database" : 
                         sourceType === 'cveDetails' ? "CVE Details Database" : 
                         "CISA Known Exploited Vulnerabilities";
              }
              
              const baseVuln: Vulnerability = {
                cve: cveId,
                title: title,
                description: description,
                severity: severity,
                system: systems,
                mitigation: "Check vendor website for patches and mitigation strategies.",
                details: {
                  source: sourceType,
                  published: publishedDate,
                  lastModified: cve.lastModified || publishedDate,
                  cvssScore: score
                }
              };
              
              // Apply enhanced detection
              vulnerabilities.push(enhanceVulnerabilityData(baseVuln));
            }
          }
        } else {
          throw new Error(`NVD API responded with status: ${response.status}`);
        }
      } catch (apiError) {
        console.error("Error fetching from enhanced API:", apiError);
        
        // Fallback to web scraping
        console.log(`Falling back to web scraping from ${source}: ${sources[source]}`);
        const url = sources[source];
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }

        const html = await response.text();
        const parser = new DOMParser();
        const document = parser.parseFromString(html, "text/html");

        switch (sourceType) {
          case "nvd":
            vulnerabilities = parseNVD(document, limit).map(enhanceVulnerabilityData);
            break;
          case "cveDetails":
            vulnerabilities = parseCVEDetails(document, limit).map(enhanceVulnerabilityData);
            break;
          case "cisaKev":
            vulnerabilities = parseCISA(document, limit).map(enhanceVulnerabilityData);
            break;
        }
      }
    }

    // Store enhanced vulnerabilities in the database
    let count = 0;
    let zeroDayCount = 0;
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
          console.error("Error storing enhanced vulnerability:", error);
        } else {
          count++;
          if (vuln.details?.zeroDay) {
            zeroDayCount++;
          }
        }
      }
    }

    // Enhanced notification for zero-day vulnerabilities
    if (sendNotifications && userId && vulnerabilities.length > 0) {
      try {
        const zeroDayVulns = vulnerabilities.filter(v => v.details?.zeroDay);
        const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical');
        
        let notificationSeverity = 'all';
        if (zeroDayVulns.length > 0) {
          notificationSeverity = 'critical';
        } else if (criticalVulns.length > 0) {
          notificationSeverity = 'critical';
        }
        
        await supabaseClient.functions.invoke('send-notifications', {
          body: {
            userId,
            scanResults: vulnerabilities,
            scanType: 'enhanced',
            severity: notificationSeverity,
            zeroDayCount,
            enhancedScan: true
          }
        });
        console.log(`Enhanced notifications sent to user ${userId} (${zeroDayCount} zero-day detected)`);
      } catch (notifError) {
        console.error("Error sending enhanced notifications:", notifError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count,
        vulnerabilities,
        zeroDayCount,
        enhancedFeatures: {
          customScoring: true,
          zeroDetection: true,
          multiSource: true
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in enhanced scrape-vulnerabilities function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
