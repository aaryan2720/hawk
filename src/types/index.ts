
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

// Alert related types
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  date: string;
  system: string;
  status: 'new' | 'acknowledged' | 'resolved';
  cve?: string;
  mitigation?: string;
  patchLink?: string;
  details?: Record<string, any>;
}

export interface AlertsStats {
  total: number;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  resolved: number;
  new: number;
  acknowledged: number;
}

// System status types
export interface SystemStatus {
  name: string;
  status: 'operational' | 'degraded' | 'critical' | 'maintenance';
  alertsCount: number;
  highSeverityCount: number;
}

// OEM Source types
export interface OEMSource {
  id: string;
  user_id: string;
  name: string;
  url: string;
  system_type: string;
  is_active: boolean;
  created_at?: string;
  last_checked?: string;
}

// User System type
export interface UserSystem {
  id: string;
  user_id: string;
  system_name: string;
  created_at: string;
  monitoring_settings?: MonitoringSettings;
}

// Json type for compatibility with database types
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
