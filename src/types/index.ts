// Add or update these types to fix the TypeScript errors
export interface ScanHistoryItem {
  id: string;
  created_at: string;
  system_name: string;
  user_id: string;
  monitoring_settings: {
    lastScanTime?: string;
    scanInterval?: number;
    criticalOnly?: boolean;
    autoScanEnabled?: boolean;
  };
}

export interface MonitoringSettings {
  lastScanTime?: string;
  scanInterval?: number;
  criticalOnly?: boolean;
  autoScanEnabled?: boolean;
  [key: string]: any; // This makes it compatible with Json type
}
