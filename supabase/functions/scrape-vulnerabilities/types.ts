
export interface Vulnerability {
  cve: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  system: string;
  mitigation?: string;
  patchLink?: string;
  details?: Record<string, any>;
}

export type DataSource = 'nvd' | 'cveDetails' | 'cisaKev';

export interface SourceMap {
  [key: string]: string;
}
