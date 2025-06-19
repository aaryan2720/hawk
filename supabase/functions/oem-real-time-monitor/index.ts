
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OEMVulnerability {
  cve: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  productName: string;
  productVersion?: string;
  oemName: string;
  mitigation?: string;
  mitigationUrl?: string;
  publishedDate: string;
  uniqueId: string;
}

// OEM RSS and API endpoints
const OEM_SOURCES = [
  {
    name: 'Cisco',
    rssUrl: 'https://sec.cloudapps.cisco.com/security/center/rss2_advisory.xml',
    type: 'rss'
  },
  {
    name: 'Microsoft',
    rssUrl: 'https://api.msrc.microsoft.com/cvrf/v2.0/updates',
    type: 'api'
  },
  {
    name: 'Adobe',
    rssUrl: 'https://helpx.adobe.com/security.rss',
    type: 'rss'
  },
  {
    name: 'VMware',
    rssUrl: 'https://www.vmware.com/security/advisories.xml',
    type: 'rss'
  },
  {
    name: 'Intel',
    rssUrl: 'https://www.intel.com/content/www/us/en/security-center/advisory.rss',
    type: 'rss'
  }
];

async function parseRSSFeed(url: string, oemName: string): Promise<OEMVulnerability[]> {
  try {
    console.log(`Parsing RSS feed for ${oemName}: ${url}`);
    
    // Use RSS2JSON service to parse RSS feeds
    const rssApiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
    const response = await fetch(rssApiUrl);
    
    if (!response.ok) {
      throw new Error(`RSS API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'ok') {
      console.error(`RSS parsing failed for ${oemName}:`, data.message);
      return [];
    }
    
    const vulnerabilities: OEMVulnerability[] = [];
    
    for (const item of data.items || []) {
      const vulnerability = extractVulnerabilityFromRSSItem(item, oemName);
      if (vulnerability) {
        vulnerabilities.push(vulnerability);
      }
    }
    
    console.log(`Found ${vulnerabilities.length} vulnerabilities for ${oemName}`);
    return vulnerabilities;
  } catch (error) {
    console.error(`Error parsing RSS feed for ${oemName}:`, error);
    return [];
  }
}

function extractVulnerabilityFromRSSItem(item: any, oemName: string): OEMVulnerability | null {
  try {
    const title = item.title || '';
    const description = item.description || item.content || '';
    const content = `${title} ${description}`.toLowerCase();
    
    // Check if it's security/vulnerability related
    const securityKeywords = ['vulnerability', 'security', 'cve-', 'critical', 'high', 'patch', 'update', 'advisory', 'exploit'];
    const isSecurityRelated = securityKeywords.some(keyword => content.includes(keyword));
    
    if (!isSecurityRelated) {
      return null;
    }
    
    // Extract CVE ID
    const cveMatch = content.match(/cve-\d{4}-\d{4,}/i);
    const cveId = cveMatch ? cveMatch[0].toUpperCase() : `${oemName.toUpperCase()}-${Date.now()}`;
    
    // Determine severity
    let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    if (content.includes('critical')) severity = 'critical';
    else if (content.includes('high')) severity = 'high';
    else if (content.includes('medium')) severity = 'medium';
    else if (content.includes('low')) severity = 'low';
    
    // Extract product name
    const productMatch = title.match(/(\w+(?:\s+\w+)?)\s+(?:vulnerability|security|advisory|update)/i);
    const productName = productMatch ? productMatch[1] : `${oemName} Product`;
    
    // Extract version if available
    const versionMatch = content.match(/version\s+([0-9]+(?:\.[0-9]+)*)/i);
    const productVersion = versionMatch ? versionMatch[1] : undefined;
    
    return {
      cve: cveId,
      title: title,
      description: description,
      severity,
      productName,
      productVersion,
      oemName,
      mitigation: `Check ${oemName} security advisory for detailed mitigation steps`,
      mitigationUrl: item.link || item.url,
      publishedDate: item.pubDate || new Date().toISOString(),
      uniqueId: cveId
    };
  } catch (error) {
    console.error('Error extracting vulnerability from RSS item:', error);
    return null;
  }
}

async function storeVulnerability(vulnerability: OEMVulnerability, supabaseClient: any): Promise<boolean> {
  try {
    // Check if vulnerability already exists
    const { data: existing } = await supabaseClient
      .from('alerts')
      .select('id')
      .eq('cve', vulnerability.cve)
      .maybeSingle();
    
    if (existing) {
      return false; // Already exists
    }
    
    // Store new vulnerability
    const { error } = await supabaseClient
      .from('alerts')
      .insert({
        title: vulnerability.title,
        description: vulnerability.description,
        system: `${vulnerability.oemName} ${vulnerability.productName}`,
        severity: vulnerability.severity,
        cve: vulnerability.cve,
        date: new Date().toISOString(),
        status: 'new',
        mitigation: vulnerability.mitigation,
        patch_link: vulnerability.mitigationUrl,
        details: {
          source: 'OEM Direct Scraping',
          oemName: vulnerability.oemName,
          productName: vulnerability.productName,
          productVersion: vulnerability.productVersion,
          publishedDate: vulnerability.publishedDate,
          mitigationUrl: vulnerability.mitigationUrl,
          scrapedAt: new Date().toISOString(),
          rssSource: true
        }
      });
    
    if (error) {
      console.error('Error storing vulnerability:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in storeVulnerability:', error);
    return false;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting OEM real-time monitoring');
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const allVulnerabilities: OEMVulnerability[] = [];
    let newVulnerabilities = 0;
    
    // Process each OEM source
    for (const source of OEM_SOURCES) {
      try {
        if (source.type === 'rss') {
          const vulnerabilities = await parseRSSFeed(source.rssUrl, source.name);
          
          for (const vulnerability of vulnerabilities) {
            // Only process Critical and High severity vulnerabilities
            if (vulnerability.severity === 'critical' || vulnerability.severity === 'high') {
              const stored = await storeVulnerability(vulnerability, supabaseClient);
              if (stored) {
                newVulnerabilities++;
                allVulnerabilities.push(vulnerability);
                
                // Send notification for critical/high vulnerabilities
                console.log(`New ${vulnerability.severity} vulnerability found: ${vulnerability.cve}`);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error processing ${source.name}:`, error);
      }
    }
    
    // Send summary notification if new vulnerabilities found
    if (newVulnerabilities > 0) {
      try {
        await supabaseClient.functions.invoke('send-notifications', {
          body: {
            type: 'oem_monitoring_summary',
            title: `🚨 ${newVulnerabilities} New Critical/High Vulnerabilities Detected`,
            content: `Real-time OEM monitoring detected ${newVulnerabilities} new Critical/High severity vulnerabilities from manufacturer sources.`,
            vulnerabilities: allVulnerabilities
          }
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        newVulnerabilities,
        totalScanned: allVulnerabilities.length,
        sourcesProcessed: OEM_SOURCES.length,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in OEM real-time monitor:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
