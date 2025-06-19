
-- Create enterprise OEM sources table
CREATE TABLE public.enterprise_oem_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rss', 'api', 'scraper', 'webhook')),
  endpoint TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('it', 'ot', 'hybrid')),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  region TEXT NOT NULL,
  industry TEXT[] NOT NULL DEFAULT '{}',
  authentication JSONB,
  rate_limits JSONB NOT NULL DEFAULT '{
    "requestsPerMinute": 60,
    "requestsPerHour": 1000,
    "backoffStrategy": "exponential"
  }'::jsonb,
  processing_config JSONB NOT NULL DEFAULT '{
    "batchSize": 100,
    "retryAttempts": 3,
    "timeout": 30000,
    "enabledSeverities": ["critical", "high", "medium", "low"]
  }'::jsonb,
  monitoring_config JSONB NOT NULL DEFAULT '{
    "healthCheckInterval": 300,
    "alertThreshold": 5,
    "enableMetrics": true
  }'::jsonb,
  last_processed TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'error')),
  metrics JSONB NOT NULL DEFAULT '{
    "successRate": 100,
    "averageResponseTime": 0,
    "vulnerabilitiesFound": 0
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enterprise notification rules table
CREATE TABLE public.enterprise_notification_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{
    "severities": [],
    "oemSources": [],
    "categories": [],
    "industries": [],
    "keywords": [],
    "excludeKeywords": []
  }'::jsonb,
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  escalation JSONB NOT NULL DEFAULT '{
    "enabled": false,
    "steps": []
  }'::jsonb,
  schedule JSONB NOT NULL DEFAULT '{
    "enabled": false,
    "timezone": "UTC",
    "activeHours": {"start": "00:00", "end": "23:59"},
    "activeDays": [0,1,2,3,4,5,6]
  }'::jsonb,
  rate_limit JSONB NOT NULL DEFAULT '{
    "maxNotificationsPerHour": 100,
    "cooldownPeriod": 300
  }'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert some sample enterprise OEM sources
INSERT INTO public.enterprise_oem_sources (name, type, endpoint, category, priority, region, industry, metrics) VALUES
('Cisco Security Advisories', 'rss', 'https://sec.cloudapps.cisco.com/security/center/rss2_advisory.xml', 'it', 'critical', 'global', '{"energy", "finance", "healthcare"}', '{"successRate": 98.5, "averageResponseTime": 1200, "vulnerabilitiesFound": 245}'),
('Microsoft Security Response', 'api', 'https://api.msrc.microsoft.com/cvrf/v2.0/updates', 'it', 'critical', 'global', '{"finance", "healthcare", "manufacturing"}', '{"successRate": 99.2, "averageResponseTime": 800, "vulnerabilitiesFound": 189}'),
('Schneider Electric Advisories', 'rss', 'https://www.se.com/us/en/download/document/Security_Bulletin_RSS/', 'ot', 'high', 'global', '{"energy", "manufacturing"}', '{"successRate": 96.8, "averageResponseTime": 1500, "vulnerabilitiesFound": 87}'),
('Siemens CERT', 'scraper', 'https://cert-portal.siemens.com/productcert/html/ssa.html', 'ot', 'high', 'europe', '{"manufacturing", "energy"}', '{"successRate": 94.3, "averageResponseTime": 2100, "vulnerabilitiesFound": 156}'),
('VMware Security Advisories', 'rss', 'https://www.vmware.com/security/advisories.xml', 'it', 'high', 'global', '{"finance", "healthcare", "manufacturing"}', '{"successRate": 97.1, "averageResponseTime": 950, "vulnerabilitiesFound": 132}');

-- Enable Row Level Security
ALTER TABLE public.enterprise_oem_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_notification_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - can be restricted later)
CREATE POLICY "Allow all operations on enterprise_oem_sources" 
  ON public.enterprise_oem_sources 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on enterprise_notification_rules" 
  ON public.enterprise_notification_rules 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
