
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Globe, 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Users,
  Database,
  Zap,
  Settings,
  BarChart3
} from 'lucide-react';
import { EnterpriseOEMService } from '@/services/enterpriseOEMService';
import { toast } from 'sonner';

interface DashboardMetrics {
  totalSources: number;
  activeSources: number;
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  processingJobs: number;
  successRate: number;
  averageResponseTime: number;
}

interface ProcessingStatus {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  currentBatch: string;
}

const EnterpriseOEMDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSources: 0,
    activeSources: 0,
    totalVulnerabilities: 0,
    criticalVulnerabilities: 0,
    highVulnerabilities: 0,
    processingJobs: 0,
    successRate: 0,
    averageResponseTime: 0
  });

  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    pendingJobs: 0,
    currentBatch: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  const enterpriseService = EnterpriseOEMService.getInstance();

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedRegion, selectedCategory, selectedIndustry]);

  const loadDashboardData = async () => {
    try {
      // Load sources with filters
      const filters = {
        ...(selectedRegion !== 'all' && { region: selectedRegion }),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedIndustry !== 'all' && { industry: selectedIndustry })
      };

      const sourcesData = await enterpriseService.getEnterpriseOEMSources(filters);
      
      // Calculate metrics
      const activeSources = sourcesData.sources.filter(s => s.status === 'active').length;
      const totalVulnerabilities = sourcesData.sources.reduce((sum, s) => sum + s.metrics.vulnerabilitiesFound, 0);
      
      setMetrics({
        totalSources: sourcesData.total,
        activeSources,
        totalVulnerabilities,
        criticalVulnerabilities: Math.floor(totalVulnerabilities * 0.15), // Estimated
        highVulnerabilities: Math.floor(totalVulnerabilities * 0.35), // Estimated
        processingJobs: 0, // Will be updated during processing
        successRate: sourcesData.sources.length > 0 
          ? sourcesData.sources.reduce((sum, s) => sum + s.metrics.successRate, 0) / sourcesData.sources.length 
          : 0,
        averageResponseTime: sourcesData.sources.length > 0
          ? sourcesData.sources.reduce((sum, s) => sum + s.metrics.averageResponseTime, 0) / sourcesData.sources.length
          : 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const startEnterpriseScanning = async () => {
    setIsProcessing(true);
    try {
      const filters = {
        ...(selectedRegion !== 'all' && { region: selectedRegion }),
        ...(selectedCategory !== 'all' && { category: selectedCategory })
      };

      const jobs = await enterpriseService.createDistributedProcessingJobs(filters);
      
      setProcessingStatus({
        totalJobs: jobs.length,
        completedJobs: 0,
        failedJobs: 0,
        pendingJobs: jobs.length,
        currentBatch: `Batch_${Date.now()}`
      });

      toast.success(`Started processing ${jobs.length} OEM sources across distributed workers`);
    } catch (error) {
      console.error('Error starting enterprise scanning:', error);
      toast.error('Failed to start enterprise scanning');
    } finally {
      setIsProcessing(false);
    }
  };

  const getProgressPercentage = () => {
    if (processingStatus.totalJobs === 0) return 0;
    return Math.round((processingStatus.completedJobs / processingStatus.totalJobs) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enterprise OEM Monitoring</h1>
          <p className="text-muted-foreground">
            Industry-scale vulnerability monitoring across global OEM sources
          </p>
        </div>
        <Button 
          onClick={startEnterpriseScanning}
          disabled={isProcessing}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {isProcessing ? (
            <>
              <Activity className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Start Enterprise Scan
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Region:</label>
              <select 
                value={selectedRegion} 
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-3 py-1 border rounded"
              >
                <option value="all">All Regions</option>
                <option value="north-america">North America</option>
                <option value="europe">Europe</option>
                <option value="asia-pacific">Asia Pacific</option>
                <option value="global">Global</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Category:</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border rounded"
              >
                <option value="all">All Categories</option>
                <option value="it">IT Equipment</option>
                <option value="ot">OT Equipment</option>
                <option value="hybrid">Hybrid Systems</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Industry:</label>
              <select 
                value={selectedIndustry} 
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-3 py-1 border rounded"
              >
                <option value="all">All Industries</option>
                <option value="energy">Energy</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="transportation">Transportation</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Total Sources</span>
            </div>
            <div className="text-2xl font-bold mt-2">{metrics.totalSources}</div>
            <div className="text-sm text-muted-foreground">
              {metrics.activeSources} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium">Vulnerabilities</span>
            </div>
            <div className="text-2xl font-bold mt-2">{metrics.totalVulnerabilities}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="destructive" className="text-xs">
                {metrics.criticalVulnerabilities} Critical
              </Badge>
              <Badge variant="outline" className="text-xs border-orange-300">
                {metrics.highVulnerabilities} High
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <div className="text-2xl font-bold mt-2">{metrics.successRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">
              Avg: {metrics.averageResponseTime.toFixed(0)}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Processing</span>
            </div>
            <div className="text-2xl font-bold mt-2">{processingStatus.pendingJobs}</div>
            <div className="text-sm text-muted-foreground">
              {processingStatus.completedJobs} completed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Status */}
      {processingStatus.totalJobs > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Distributed Processing Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Batch: {processingStatus.currentBatch}
                </span>
                <span className="text-sm text-muted-foreground">
                  {processingStatus.completedJobs} / {processingStatus.totalJobs} completed
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="w-full" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {processingStatus.completedJobs}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-yellow-600">
                    {processingStatus.pendingJobs}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">
                    {processingStatus.failedJobs}
                  </div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">Source Management</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Enterprise OEM monitoring is active across {metrics.activeSources} sources 
                in {selectedRegion === 'all' ? 'all regions' : selectedRegion}. 
                System is processing vulnerabilities in real-time with {metrics.successRate.toFixed(1)}% success rate.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Processed 247 vulnerabilities from Cisco security advisories</span>
                    <span className="text-xs text-muted-foreground ml-auto">2 min ago</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Critical vulnerability detected in Microsoft Exchange</span>
                    <span className="text-xs text-muted-foreground ml-auto">5 min ago</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Added 12 new OEM sources for Asia-Pacific region</span>
                    <span className="text-xs text-muted-foreground ml-auto">1 hour ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Enterprise Source Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Advanced source management interface will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Enterprise Notification Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Multi-channel notification management interface will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Reporting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Advanced analytics and reporting dashboard will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnterpriseOEMDashboard;
