
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid?: string;
}

export class OEMScrapingService {
  /**
   * Parse RSS feed for vulnerability information
   */
  static async parseRSSFeed(url: string, oemName: string): Promise<OEMVulnerability[]> {
    try {
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(`RSS parsing failed: ${data.message}`);
      }
      
      const vulnerabilities: OEMVulnerability[] = [];
      
      for (const item of data.items) {
        const vuln = this.extractVulnerabilityFromRSSItem(item, oemName);
        if (vuln) {
          vulnerabilities.push(vuln);
        }
      }
      
      return vulnerabilities;
    } catch (error) {
      console.error('Error parsing RSS feed:', error);
      return [];
    }
  }

  /**
   * Extract vulnerability information from RSS item
   */
  private static extractVulnerabilityFromRSSItem(item: any, oemName: string): OEMVulnerability | null {
    try {
      const title = item.title || '';
      const description = item.description || '';
      const content = `${title} ${description}`.toLowerCase();
      
      // Check if it's a security/vulnerability related item
      const securityKeywords = ['vulnerability', 'security', 'cve-', 'critical', 'high', 'patch', 'update', 'advisory'];
      const isSecurityRelated = securityKeywords.some(keyword => content.includes(keyword));
      
      if (!isSecurityRelated) {
        return null;
      }
      
      // Extract CVE ID
      const cveMatch = content.match(/cve-\d{4}-\d{4,}/i);
      const cveId = cveMatch ? cveMatch[0].toUpperCase() : `${oemName}-${Date.now()}`;
      
      // Determine severity based on keywords
      let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium';
      if (content.includes('critical')) severity = 'critical';
      else if (content.includes('high')) severity = 'high';
      else if (content.includes('medium')) severity = 'medium';
      else if (content.includes('low')) severity = 'low';
      
      // Extract product name (basic heuristic)
      const productMatch = title.match(/(\w+)\s+(vulnerability|security|advisory)/i);
      const productName = productMatch ? productMatch[1] : 'Unknown Product';
      
      return {
        cve: cveId,
        title: item.title,
        description: item.description,
        severity,
        productName,
        oemName,
        mitigation: `Check ${oemName} security advisory for detailed mitigation steps`,
        mitigationUrl: item.link,
        publishedDate: item.pubDate || new Date().toISOString(),
        uniqueId: cveId
      };
    } catch (error) {
      console.error('Error extracting vulnerability from RSS item:', error);
      return null;
    }
  }

  /**
   * Scrape specific OEM websites for vulnerabilities
   */
  static async scrapeOEMWebsites(): Promise<{success: boolean, vulnerabilities: OEMVulnerability[], error?: string}> {
    try {
      const vulnerabilities: OEMVulnerability[] = [];
      
      // Define OEM RSS feeds and direct sources
      const oemSources = [
        {
          name: 'Cisco',
          rssUrl: 'https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisoryAtomFeed.xml',
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
        }
      ];
      
      // Process each OEM source
      for (const source of oemSources) {
        try {
          if (source.type === 'rss') {
            const oemVulns = await this.parseRSSFeed(source.rssUrl, source.name);
            vulnerabilities.push(...oemVulns);
          }
        } catch (error) {
          console.error(`Error processing ${source.name}:`, error);
        }
      }
      
      return {
        success: true,
        vulnerabilities
      };
    } catch (error) {
      return {
        success: false,
        vulnerabilities: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Monitor OEM sources and trigger alerts for Critical/High vulnerabilities
   */
  static async monitorOEMSources(userId: string): Promise<void> {
    try {
      const result = await this.scrapeOEMWebsites();
      
      if (!result.success) {
        toast.error('Failed to monitor OEM sources');
        return;
      }
      
      // Filter for Critical and High severity vulnerabilities
      const criticalHighVulns = result.vulnerabilities.filter(
        vuln => vuln.severity === 'critical' || vuln.severity === 'high'
      );
      
      // Store vulnerabilities and trigger notifications
      for (const vulnerability of criticalHighVulns) {
        await this.storeAndNotifyVulnerability(vulnerability, userId);
      }
      
      if (criticalHighVulns.length > 0) {
        toast.success(`Found ${criticalHighVulns.length} Critical/High severity vulnerabilities`);
      }
    } catch (error) {
      console.error('Error monitoring OEM sources:', error);
      toast.error('Error monitoring OEM sources');
    }
  }

  /**
   * Store vulnerability and send notification
   */
  private static async storeAndNotifyVulnerability(vulnerability: OEMVulnerability, userId: string): Promise<void> {
    try {
      // Check if vulnerability already exists
      const { data: existing } = await supabase
        .from('alerts')
        .select('id')
        .eq('cve', vulnerability.cve)
        .maybeSingle();
      
      if (existing) {
        return; // Already processed
      }
      
      // Store in database
      const { error } = await supabase
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
          user_id: userId,
          details: {
            source: 'OEM Direct',
            oemName: vulnerability.oemName,
            productName: vulnerability.productName,
            productVersion: vulnerability.productVersion,
            publishedDate: vulnerability.publishedDate,
            mitigationUrl: vulnerability.mitigationUrl,
            scrapedAt: new Date().toISOString()
          }
        } as any);
      
      if (error) {
        console.error('Error storing vulnerability:', error);
        return;
      }
      
      // Send notification for Critical/High severity
      if (vulnerability.severity === 'critical' || vulnerability.severity === 'high') {
        await this.sendVulnerabilityNotification(vulnerability, userId);
      }
    } catch (error) {
      console.error('Error storing and notifying vulnerability:', error);
    }
  }

  /**
   * Send vulnerability notification email
   */
  private static async sendVulnerabilityNotification(vulnerability: OEMVulnerability, userId: string): Promise<void> {
    try {
      const emailContent = this.formatVulnerabilityEmail(vulnerability);
      
      const { error } = await supabase.functions.invoke('send-notifications', {
        body: {
          type: 'vulnerability_alert',
          userId,
          title: `🚨 ${vulnerability.severity.toUpperCase()} Vulnerability Alert: ${vulnerability.oemName}`,
          content: emailContent,
          vulnerability: vulnerability
        }
      });
      
      if (error) {
        console.error('Error sending notification:', error);
      }
    } catch (error) {
      console.error('Error in sendVulnerabilityNotification:', error);
    }
  }

  /**
   * Format vulnerability information for email
   */
  private static formatVulnerabilityEmail(vulnerability: OEMVulnerability): string {
    return `
      <h2>🚨 ${vulnerability.severity.toUpperCase()} Vulnerability Alert</h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 16px 0;">
        <h3>Vulnerability Details:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Product Name:</strong> ${vulnerability.productName}</li>
          <li><strong>Product Version:</strong> ${vulnerability.productVersion || 'Not specified'}</li>
          <li><strong>OEM Name:</strong> ${vulnerability.oemName}</li>
          <li><strong>Severity Level:</strong> ${vulnerability.severity.toUpperCase()}</li>
          <li><strong>Vulnerability:</strong> ${vulnerability.description}</li>
          <li><strong>Mitigation Strategy:</strong> ${vulnerability.mitigation}</li>
          <li><strong>Published Date:</strong> ${new Date(vulnerability.publishedDate).toLocaleDateString()}</li>
          <li><strong>Unique ID:</strong> ${vulnerability.uniqueId}</li>
        </ul>
        
        ${vulnerability.mitigationUrl ? `
          <div style="margin-top: 16px;">
            <a href="${vulnerability.mitigationUrl}" 
               style="background: #007bff; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">
              View Full Advisory
            </a>
          </div>
        ` : ''}
      </div>
      
      <p style="color: #666; font-size: 14px;">
        This alert was generated by HAWK Security Platform's real-time OEM monitoring system.
      </p>
    `;
  }
}
