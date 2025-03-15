
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CrawlResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export class FirecrawlService {
  /**
   * Scan an OEM website for potential vulnerabilities and product information
   * @param url The URL to scan
   * @param name The name of the OEM source
   * @param systemType The type of system this OEM produces
   */
  static async scanOEMWebsite(url: string, name: string, systemType: string): Promise<CrawlResponse> {
    try {
      console.log(`Starting OEM scan for ${name} at ${url}`);
      
      // Call the test-oem-scraper edge function
      const response = await supabase.functions.invoke('test-oem-scraper', {
        body: { 
          url, 
          name, 
          system_type: systemType 
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to scan OEM website');
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error scanning OEM website:', error);
      toast.error('Failed to scan OEM website');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Auto-detect potential OEM websites based on system type
   * @param systemType The type of system to find OEMs for
   */
  static async detectOEMWebsites(systemType: string): Promise<CrawlResponse> {
    try {
      // This is a simplified implementation - in a real application, 
      // we would use a more sophisticated approach to detect OEM websites
      
      // Common OEM domains based on system type
      const oemPatterns: Record<string, string[]> = {
        'network': ['cisco.com', 'juniper.net', 'netgear.com'],
        'storage': ['emc.com', 'netapp.com', 'seagate.com'],
        'server': ['dell.com/servers', 'hpe.com/servers', 'lenovo.com/servers'],
        'desktop': ['dell.com/desktops', 'hp.com', 'lenovo.com'],
        'security': ['mcafee.com', 'symantec.com', 'kaspersky.com'],
        'firmware': ['intel.com/firmware', 'amd.com', 'nvidia.com'],
        'database': ['oracle.com', 'microsoft.com/sql', 'mongodb.com']
      };
      
      const defaultOEMs = ['microsoft.com', 'ibm.com', 'oracle.com', 'intel.com', 'amd.com'];
      const oemDomains = oemPatterns[systemType.toLowerCase()] || defaultOEMs;
      
      const suggestedOEMs = oemDomains.map(domain => ({
        name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
        url: `https://${domain}`,
        systemType
      }));
      
      return {
        success: true,
        data: {
          suggestions: suggestedOEMs
        }
      };
    } catch (error) {
      console.error('Error detecting OEM websites:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
