export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type Json = 
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  date: string;
  system: string;
  cve?: string;
  status: 'new' | 'acknowledged' | 'resolved';
  mitigation?: string;
  patchLink?: string;
  details?: Record<string, any> | Json;
}

export interface SystemStatus {
  name: string;
  status: 'operational' | 'degraded' | 'critical' | 'maintenance';
  alertsCount: number;
  highSeverityCount: number;
}

export interface AlertsStats {
  total: number;
  bySeverity: Record<AlertSeverity, number>;
  resolved: number;
  new: number;
  acknowledged: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  organization?: string;
  role: 'admin' | 'user' | 'guest';
  created_at: string;
}

export interface MonitoringSettings {
  autoScanEnabled?: boolean;
  scanInterval?: number; 
  criticalOnly?: boolean;
  lastScanTime?: string | null;
}

export interface UserSystem {
  id: string;
  user_id: string;
  system_name: string;
  created_at: string;
  monitoring_settings: MonitoringSettings | null;
}

export interface OEMSource {
  id: string;
  user_id: string;
  name: string;
  url: string;
  system_type: string;
  is_active: boolean;
  last_checked: string | null;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  max_systems: number;
  max_oem_sources: number;
  realtime_alerts: boolean;
  ai_analysis: boolean;
  created_at: string;
}
