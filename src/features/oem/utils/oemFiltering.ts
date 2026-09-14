
// Helper functions for enhanced OEM matching
export const getOEMVariations = (oemName: string): string[] => {
  const variations = [oemName];
  
  const aliases: Record<string, string[]> = {
    'microsoft': ['windows', 'ms', 'msft', 'azure', 'office'],
    'intel': ['cpu', 'processor', 'chipset'],
    'amd': ['ryzen', 'radeon', 'epyc'],
    'apple': ['macos', 'ios', 'safari'],
    'google': ['chrome', 'android'],
    'cisco': ['ios', 'nx-os', 'asa'],
    'dell': ['emc', 'poweredge'],
    'hp': ['hewlett', 'packard', 'enterprise'],
    'vmware': ['vsphere', 'vcenter', 'esxi'],
    'oracle': ['java', 'mysql', 'solaris']
  };
  
  if (aliases[oemName]) {
    variations.push(...aliases[oemName]);
  }
  
  return variations;
};

export const getSystemTypeVariations = (systemType: string): string[] => {
  const variations = [systemType];
  
  const typeAliases: Record<string, string[]> = {
    'operating system': ['os', 'kernel', 'system'],
    'network': ['router', 'switch', 'firewall'],
    'server': ['rack', 'blade', 'datacenter'],
    'desktop': ['pc', 'workstation'],
    'laptop': ['notebook', 'portable'],
    'storage': ['san', 'nas', 'disk'],
    'security': ['antivirus', 'endpoint'],
    'database': ['sql', 'rdbms', 'db']
  };
  
  if (typeAliases[systemType]) {
    variations.push(...typeAliases[systemType]);
  }
  
  return variations;
};

export const isProductFamilyMatch = (alertText: string, oemName: string, systemType: string): boolean => {
  const productPatterns: Record<string, string[]> = {
    'microsoft': ['windows 10', 'windows 11', 'server 2019', 'server 2022'],
    'intel': ['core i3', 'core i5', 'core i7', 'xeon'],
    'amd': ['ryzen 3', 'ryzen 5', 'ryzen 7'],
    'cisco': ['catalyst', 'nexus', 'meraki'],
    'dell': ['poweredge r', 'latitude', 'optiplex']
  };
  
  if (productPatterns[oemName]) {
    return productPatterns[oemName].some(pattern => alertText.includes(pattern));
  }
  
  return false;
};

export const filterAlertsByOEM = (alerts: any[], userOEMSources: any[]) => {
  return alerts.filter(alert => {
    // If user has no OEM sources registered, show message but no alerts
    if (userOEMSources.length === 0) return false;
    
    // Check if alert is marked as user-filtered (from enhanced system)
    if (alert.details && typeof alert.details === 'object' && 'userFiltered' in alert.details) {
      return alert.details.userFiltered;
    }
    
    // Enhanced OEM filtering with better matching
    const alertSystem = alert.system.toLowerCase();
    const alertDescription = alert.description.toLowerCase();
    const alertTitle = alert.title.toLowerCase();
    const alertText = `${alertTitle} ${alertDescription} ${alertSystem}`;
    
    return userOEMSources.some(oemSource => {
      const oemName = oemSource.name.toLowerCase();
      const systemType = oemSource.system_type.toLowerCase();
      
      // Direct name matching
      if (alertText.includes(oemName) || alertText.includes(systemType)) {
        return true;
      }
      
      // Enhanced pattern matching for common OEM variations
      const oemVariations = getOEMVariations(oemName);
      const systemVariations = getSystemTypeVariations(systemType);
      
      return oemVariations.some(variation => alertText.includes(variation)) ||
             systemVariations.some(variation => alertText.includes(variation)) ||
             isProductFamilyMatch(alertText, oemName, systemType);
    });
  });
};
