
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EnterpriseOEMSource {
  id: string;
  name: string;
  type: 'rss' | 'api' | 'scraper' | 'webhook';
  endpoint: string;
  category: 'it' | 'ot' | 'hybrid';
  priority: 'critical' | 'high' | 'medium' | 'low';
  region: string;
  industry: string[];
  authentication?: {
    type: 'api_key' | 'oauth' | 'basic' | 'certificate';
    credentials: Record<string, string>;
  };
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    backoffStrategy: 'exponential' | 'linear' | 'fixed';
  };
  processingConfig: {
    batchSize: number;
    retryAttempts: number;
    timeout: number;
    enabledSeverities: string[];
  };
  monitoringConfig: {
    healthCheckInterval: number;
    alertThreshold: number;
    enableMetrics: boolean;
  };
  lastProcessed?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  metrics: {
    successRate: number;
    averageResponseTime: number;
    vulnerabilitiesFound: number;
    lastError?: string;
  };
}

interface VulnerabilityProcessingJob {
  id: string;
  sourceId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
  priority: number;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  retryAttempt: number;
  maxRetries: number;
  results?: {
    vulnerabilitiesProcessed: number;
    newVulnerabilities: number;
    duplicatesSkipped: number;
    errors: number;
  };
}

interface EnterpriseNotificationRule {
  id: string;
  organizationId: string;
  name: string;
  conditions: {
    severities: string[];
    oemSources: string[];
    categories: string[];
    industries: string[];
    keywords: string[];
    excludeKeywords: string[];
  };
  channels: Array<{
    type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams' | 'siem';
    config: Record<string, any>;
    priority: number;
  }>;
  escalation: {
    enabled: boolean;
    steps: Array<{
      delay: number;
      channels: string[];
      conditions: Record<string, any>;
    }>;
  };
  schedule: {
    enabled: boolean;
    timezone: string;
    activeHours: { start: string; end: string };
    activeDays: number[];
  };
  rateLimit: {
    maxNotificationsPerHour: number;
    cooldownPeriod: number;
  };
}

// Type for raw database response
interface RawEnterpriseOEMSource {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  category: string;
  priority: string;
  region: string;
  industry: string[];
  authentication: any;
  rate_limits: any;
  processing_config: any;
  monitoring_config: any;
  last_processed: string | null;
  status: string;
  metrics: any;
  created_at: string;
  updated_at: string;
}

interface RawEnterpriseNotificationRule {
  id: string;
  organization_id: string;
  name: string;
  conditions: any;
  channels: any;
  escalation: any;
  schedule: any;
  rate_limit: any;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export class EnterpriseOEMService {
  private static instance: EnterpriseOEMService;
  private processingQueue: Map<string, VulnerabilityProcessingJob> = new Map();
  private rateLimiters: Map<string, { requests: number; resetTime: number }> = new Map();
  private notificationRateLimiters: Map<string, { notifications: number; resetTime: number }> = new Map();

  static getInstance(): EnterpriseOEMService {
    if (!EnterpriseOEMService.instance) {
      EnterpriseOEMService.instance = new EnterpriseOEMService();
    }
    return EnterpriseOEMService.instance;
  }

  /**
   * Get all enterprise OEM sources with filtering and pagination
   */
  async getEnterpriseOEMSources(filters?: {
    category?: string;
    region?: string;
    industry?: string;
    status?: string;
    priority?: string;
  }, pagination?: { page: number; limit: number }): Promise<{
    sources: EnterpriseOEMSource[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Build the query with proper type casting
      let query = supabase
        .from('enterprise_oem_sources')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.region) query = query.eq('region', filters.region);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.priority) query = query.eq('priority', filters.priority);
      if (filters?.industry) query = query.contains('industry', [filters.industry]);

      // Apply pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 50;
      const offset = (page - 1) * limit;
      
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching enterprise OEM sources:', error);
        return { sources: [], total: 0, page: 1, totalPages: 0 };
      }

      // Transform the raw data to match our interface
      const sources: EnterpriseOEMSource[] = (data as RawEnterpriseOEMSource[] || []).map((source) => ({
        id: source.id,
        name: source.name,
        type: source.type as 'rss' | 'api' | 'scraper' | 'webhook',
        endpoint: source.endpoint,
        category: source.category as 'it' | 'ot' | 'hybrid',
        priority: source.priority as 'critical' | 'high' | 'medium' | 'low',
        region: source.region,
        industry: source.industry,
        authentication: source.authentication,
        rateLimits: source.rate_limits,
        processingConfig: source.processing_config,
        monitoringConfig: source.monitoring_config,
        lastProcessed: source.last_processed || undefined,
        status: source.status as 'active' | 'inactive' | 'maintenance' | 'error',
        metrics: source.metrics
      }));

      return {
        sources,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching enterprise OEM sources:', error);
      return { sources: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  /**
   * Create distributed processing jobs for all active sources
   */
  async createDistributedProcessingJobs(sourceFilters?: {
    priority?: string;
    category?: string;
    region?: string;
  }): Promise<VulnerabilityProcessingJob[]> {
    try {
      const { sources } = await this.getEnterpriseOEMSources({
        status: 'active',
        ...sourceFilters
      });

      const jobs: VulnerabilityProcessingJob[] = sources.map(source => ({
        id: `job_${source.id}_${Date.now()}`,
        sourceId: source.id,
        status: 'pending',
        priority: this.getPriorityValue(source.priority),
        scheduledAt: new Date().toISOString(),
        retryAttempt: 0,
        maxRetries: source.processingConfig.retryAttempts
      }));

      // Sort by priority (higher number = higher priority)
      jobs.sort((a, b) => b.priority - a.priority);

      // Store jobs in processing queue
      jobs.forEach(job => {
        this.processingQueue.set(job.id, job);
      });

      // Invoke distributed processing
      await this.startDistributedProcessing(jobs);

      return jobs;
    } catch (error) {
      console.error('Error creating distributed processing jobs:', error);
      return [];
    }
  }

  /**
   * Start distributed processing across multiple workers
   */
  private async startDistributedProcessing(jobs: VulnerabilityProcessingJob[]): Promise<void> {
    const batchSize = 10; // Process 10 jobs simultaneously
    const batches = this.chunkArray(jobs, batchSize);

    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(job => this.processJob(job))
      );
    }
  }

  /**
   * Process individual vulnerability scanning job
   */
  private async processJob(job: VulnerabilityProcessingJob): Promise<void> {
    try {
      // Update job status
      job.status = 'processing';
      job.startedAt = new Date().toISOString();
      this.processingQueue.set(job.id, job);

      // Get source configuration
      const { data: rawSource } = await supabase
        .from('enterprise_oem_sources')
        .select('*')
        .eq('id', job.sourceId)
        .single();

      if (!rawSource) {
        throw new Error(`Source ${job.sourceId} not found`);
      }

      // Transform source data
      const source = rawSource as RawEnterpriseOEMSource;
      const transformedSource: EnterpriseOEMSource = {
        id: source.id,
        name: source.name,
        type: source.type as 'rss' | 'api' | 'scraper' | 'webhook',
        endpoint: source.endpoint,
        category: source.category as 'it' | 'ot' | 'hybrid',
        priority: source.priority as 'critical' | 'high' | 'medium' | 'low',
        region: source.region,
        industry: source.industry,
        authentication: source.authentication,
        rateLimits: source.rate_limits,
        processingConfig: source.processing_config,
        monitoringConfig: source.monitoring_config,
        lastProcessed: source.last_processed || undefined,
        status: source.status as 'active' | 'inactive' | 'maintenance' | 'error',
        metrics: source.metrics
      };

      // Check rate limits
      await this.enforceRateLimit(transformedSource);

      // Process vulnerabilities based on source type
      const results = await this.processSourceVulnerabilities(transformedSource);

      // Update job with results
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.results = results;

      // Update source metrics
      await this.updateSourceMetrics(transformedSource.id, results, true);

      console.log(`Job ${job.id} completed successfully:`, results);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      
      job.status = 'failed';
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      job.retryAttempt++;

      // Schedule retry if attempts remaining
      if (job.retryAttempt < job.maxRetries) {
        job.status = 'retry';
        setTimeout(() => this.processJob(job), this.getRetryDelay(job.retryAttempt));
      }

      // Update source metrics
      await this.updateSourceMetrics(job.sourceId, null, false);
    } finally {
      this.processingQueue.set(job.id, job);
    }
  }

  /**
   * Process vulnerabilities from a specific source
   */
  private async processSourceVulnerabilities(source: EnterpriseOEMSource): Promise<{
    vulnerabilitiesProcessed: number;
    newVulnerabilities: number;
    duplicatesSkipped: number;
    errors: number;
  }> {
    const results = {
      vulnerabilitiesProcessed: 0,
      newVulnerabilities: 0,
      duplicatesSkipped: 0,
      errors: 0
    };

    try {
      let vulnerabilities: any[] = [];

      switch (source.type) {
        case 'rss':
          vulnerabilities = await this.processRSSSource(source);
          break;
        case 'api':
          vulnerabilities = await this.processAPISource(source);
          break;
        case 'scraper':
          vulnerabilities = await this.processScrapingSource(source);
          break;
        case 'webhook':
          vulnerabilities = await this.processWebhookSource(source);
          break;
      }

      results.vulnerabilitiesProcessed = vulnerabilities.length;

      // Process each vulnerability
      for (const vuln of vulnerabilities) {
        try {
          // Check for duplicates
          const { data: existing } = await supabase
            .from('alerts')
            .select('id')
            .eq('cve', vuln.cve)
            .eq('system', `${vuln.oemName} ${vuln.productName}`)
            .maybeSingle();

          if (existing) {
            results.duplicatesSkipped++;
            continue;
          }

          // Store new vulnerability
          const { error } = await supabase
            .from('alerts')
            .insert({
              title: vuln.title,
              description: vuln.description,
              system: `${vuln.oemName} ${vuln.productName}`,
              severity: vuln.severity,
              cve: vuln.cve,
              date: new Date().toISOString(),
              status: 'new',
              mitigation: vuln.mitigation,
              patch_link: vuln.mitigationUrl,
              details: {
                source: source.name,
                sourceId: source.id,
                category: source.category,
                region: source.region,
                industry: source.industry,
                oemName: vuln.oemName,
                productName: vuln.productName,
                productVersion: vuln.productVersion,
                publishedDate: vuln.publishedDate,
                scrapedAt: new Date().toISOString(),
                processingJobId: `job_${source.id}_${Date.now()}`
              }
            });

          if (error) {
            results.errors++;
            console.error('Error storing vulnerability:', error);
          } else {
            results.newVulnerabilities++;
            
            // Trigger enterprise notifications
            await this.triggerEnterpriseNotifications(vuln, source);
          }
        } catch (error) {
          results.errors++;
          console.error('Error processing vulnerability:', error);
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing source vulnerabilities:', error);
      throw error;
    }
  }

  /**
   * Trigger enterprise-level notifications based on rules
   */
  private async triggerEnterpriseNotifications(vulnerability: any, source: EnterpriseOEMSource): Promise<void> {
    try {
      // Get notification rules
      const { data: rawRules } = await supabase
        .from('enterprise_notification_rules')
        .select('*')
        .eq('active', true);

      if (!rawRules) return;

      for (const rawRule of rawRules as RawEnterpriseNotificationRule[]) {
        // Transform rule data
        const rule: EnterpriseNotificationRule = {
          id: rawRule.id,
          organizationId: rawRule.organization_id,
          name: rawRule.name,
          conditions: rawRule.conditions,
          channels: rawRule.channels,
          escalation: rawRule.escalation,
          schedule: rawRule.schedule,
          rateLimit: rawRule.rate_limit
        };

        // Check if vulnerability matches rule conditions
        if (this.matchesNotificationRule(vulnerability, source, rule)) {
          await this.executeNotificationRule(vulnerability, source, rule);
        }
      }
    } catch (error) {
      console.error('Error triggering enterprise notifications:', error);
    }
  }

  /**
   * Check if vulnerability matches notification rule conditions
   */
  private matchesNotificationRule(
    vulnerability: any,
    source: EnterpriseOEMSource,
    rule: EnterpriseNotificationRule
  ): boolean {
    const conditions = rule.conditions;

    // Check severity
    if (conditions.severities.length > 0 && !conditions.severities.includes(vulnerability.severity)) {
      return false;
    }

    // Check OEM sources
    if (conditions.oemSources.length > 0 && !conditions.oemSources.includes(source.id)) {
      return false;
    }

    // Check categories
    if (conditions.categories.length > 0 && !conditions.categories.includes(source.category)) {
      return false;
    }

    // Check industries
    if (conditions.industries.length > 0) {
      const hasMatchingIndustry = conditions.industries.some(industry => 
        source.industry.includes(industry)
      );
      if (!hasMatchingIndustry) return false;
    }

    // Check keywords
    if (conditions.keywords.length > 0) {
      const content = `${vulnerability.title} ${vulnerability.description}`.toLowerCase();
      const hasMatchingKeyword = conditions.keywords.some(keyword => 
        content.includes(keyword.toLowerCase())
      );
      if (!hasMatchingKeyword) return false;
    }

    // Check exclude keywords
    if (conditions.excludeKeywords.length > 0) {
      const content = `${vulnerability.title} ${vulnerability.description}`.toLowerCase();
      const hasExcludedKeyword = conditions.excludeKeywords.some(keyword => 
        content.includes(keyword.toLowerCase())
      );
      if (hasExcludedKeyword) return false;
    }

    return true;
  }

  /**
   * Execute notification rule for matched vulnerability
   */
  private async executeNotificationRule(
    vulnerability: any,
    source: EnterpriseOEMSource,
    rule: EnterpriseNotificationRule
  ): Promise<void> {
    try {
      // Check rate limits
      if (!this.checkNotificationRateLimit(rule)) {
        console.log(`Rate limit exceeded for rule ${rule.id}`);
        return;
      }

      // Check schedule
      if (!this.isWithinSchedule(rule.schedule)) {
        console.log(`Outside schedule for rule ${rule.id}`);
        return;
      }

      // Sort channels by priority
      const sortedChannels = [...rule.channels].sort((a, b) => a.priority - b.priority);

      // Send notifications
      for (const channel of sortedChannels) {
        await this.sendEnterpriseNotification(vulnerability, source, channel, rule);
      }

      // Update rate limit tracking
      this.updateNotificationRateLimit(rule);
    } catch (error) {
      console.error('Error executing notification rule:', error);
    }
  }

  /**
   * Send enterprise notification through specific channel
   */
  private async sendEnterpriseNotification(
    vulnerability: any,
    source: EnterpriseOEMSource,
    channel: any,
    rule: EnterpriseNotificationRule
  ): Promise<void> {
    try {
      const payload = {
        type: 'enterprise_vulnerability_alert',
        vulnerability,
        source,
        rule: { id: rule.id, name: rule.name },
        channel,
        timestamp: new Date().toISOString()
      };

      // Call appropriate notification service
      await supabase.functions.invoke('enterprise-notifications', {
        body: payload
      });
    } catch (error) {
      console.error(`Error sending ${channel.type} notification:`, error);
    }
  }

  // Helper methods
  private getPriorityValue(priority: string): number {
    const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorities[priority as keyof typeof priorities] || 1;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }

  private async enforceRateLimit(source: EnterpriseOEMSource): Promise<void> {
    const now = Date.now();
    const rateLimiter = this.rateLimiters.get(source.id);

    if (rateLimiter && now < rateLimiter.resetTime) {
      if (rateLimiter.requests >= source.rateLimits.requestsPerMinute) {
        const waitTime = rateLimiter.resetTime - now;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Update rate limiter
    this.rateLimiters.set(source.id, {
      requests: (rateLimiter?.requests || 0) + 1,
      resetTime: now + 60000 // Reset after 1 minute
    });
  }

  private getRetryDelay(attempt: number): number {
    return Math.pow(2, attempt) * 1000; // Exponential backoff
  }

  private checkNotificationRateLimit(rule: EnterpriseNotificationRule): boolean {
    const now = Date.now();
    const limiter = this.notificationRateLimiters.get(rule.id);

    if (limiter && now < limiter.resetTime) {
      return limiter.notifications < rule.rateLimit.maxNotificationsPerHour;
    }

    return true;
  }

  private isWithinSchedule(schedule: any): boolean {
    if (!schedule.enabled) return true;
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    
    return schedule.activeDays.includes(currentDay) &&
           currentHour >= parseInt(schedule.activeHours.start) &&
           currentHour <= parseInt(schedule.activeHours.end);
  }

  private updateNotificationRateLimit(rule: EnterpriseNotificationRule): void {
    const now = Date.now();
    const limiter = this.notificationRateLimiters.get(rule.id);

    this.notificationRateLimiters.set(rule.id, {
      notifications: (limiter?.notifications || 0) + 1,
      resetTime: now + 3600000 // Reset after 1 hour
    });
  }

  private async updateSourceMetrics(sourceId: string, results: any, success: boolean): Promise<void> {
    try {
      const metrics = {
        successRate: success ? 100 : 0,
        averageResponseTime: Date.now() % 1000, // Simplified
        vulnerabilitiesFound: results?.newVulnerabilities || 0,
        lastError: success ? undefined : 'Processing failed'
      };

      await supabase
        .from('enterprise_oem_sources')
        .update({ 
          metrics,
          last_processed: new Date().toISOString()
        })
        .eq('id', sourceId);
    } catch (error) {
      console.error('Error updating source metrics:', error);
    }
  }

  // Processing methods for different source types
  private async processRSSSource(source: EnterpriseOEMSource): Promise<any[]> {
    // Simplified mock implementation
    return [
      {
        title: `${source.name} Security Advisory`,
        description: 'Sample vulnerability from RSS feed',
        severity: 'medium',
        cve: `CVE-2024-${Math.floor(Math.random() * 10000)}`,
        oemName: source.name.split(' ')[0],
        productName: 'Enterprise System',
        productVersion: '1.0',
        publishedDate: new Date().toISOString(),
        mitigation: 'Update to latest version',
        mitigationUrl: source.endpoint
      }
    ];
  }

  private async processAPISource(source: EnterpriseOEMSource): Promise<any[]> {
    // Simplified mock implementation
    return [
      {
        title: `${source.name} API Security Update`,
        description: 'Critical vulnerability identified via API',
        severity: 'high',
        cve: `CVE-2024-${Math.floor(Math.random() * 10000)}`,
        oemName: source.name.split(' ')[0],
        productName: 'API Gateway',
        productVersion: '2.1',
        publishedDate: new Date().toISOString(),
        mitigation: 'Apply security patch',
        mitigationUrl: source.endpoint
      }
    ];
  }

  private async processScrapingSource(source: EnterpriseOEMSource): Promise<any[]> {
    // Simplified mock implementation
    return [
      {
        title: `${source.name} Scraped Advisory`,
        description: 'Security issue discovered through web scraping',
        severity: 'critical',
        cve: `CVE-2024-${Math.floor(Math.random() * 10000)}`,
        oemName: source.name.split(' ')[0],
        productName: 'Industrial Controller',
        productVersion: '3.2',
        publishedDate: new Date().toISOString(),
        mitigation: 'Emergency patch required',
        mitigationUrl: source.endpoint
      }
    ];
  }

  private async processWebhookSource(source: EnterpriseOEMSource): Promise<any[]> {
    // Simplified mock implementation
    return [
      {
        title: `${source.name} Webhook Alert`,
        description: 'Real-time vulnerability notification',
        severity: 'high',
        cve: `CVE-2024-${Math.floor(Math.random() * 10000)}`,
        oemName: source.name.split(' ')[0],
        productName: 'Webhook Service',
        productVersion: '1.5',
        publishedDate: new Date().toISOString(),
        mitigation: 'Immediate action required',
        mitigationUrl: source.endpoint
      }
    ];
  }

  /**
   * Get processing queue status
   */
  getProcessingQueueStatus(): { 
    totalJobs: number; 
    pending: number; 
    processing: number; 
    completed: number; 
    failed: number; 
  } {
    const jobs = Array.from(this.processingQueue.values());
    return {
      totalJobs: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length
    };
  }
}
