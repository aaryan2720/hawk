
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
