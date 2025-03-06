
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

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
  details?: {
    [key: string]: string | number | boolean;
  };
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
