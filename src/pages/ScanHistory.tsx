
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DashboardNav from '@/components/DashboardNav';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Shield, AlertTriangle, CheckCircle, Filter, Download, RefreshCw, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Json } from '@/types';

interface ScanHistoryItem {
  id: string;
  user_id: string;
  system_name: string;
  created_at: string;
  monitoring_settings: {
    lastScanTime?: string;
    scanInterval?: number;
    criticalOnly?: boolean;
    autoScanEnabled?: boolean;
    scanResults?: any[];
  } & Json;
}

interface ScanStatistics {
  totalScans: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  averageScanTime: string;
  successRate: number;
}

const ScanHistory = () => {
  const { user, loading } = useAuth();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("history");
  const [statistics, setStatistics] = useState<ScanStatistics>({
    totalScans: 0,
    criticalVulnerabilities: 0,
    highVulnerabilities: 0,
    averageScanTime: "0",
    successRate: 0
  });

  const fetchScanHistory = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch scan history from user_systems table
      const { data, error } = await supabase
        .from('user_systems')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Convert the data to ScanHistoryItem type
      const formattedData: ScanHistoryItem[] = data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        system_name: item.system_name,
        created_at: item.created_at,
        monitoring_settings: item.monitoring_settings || {}
      }));
      
      setHistory(formattedData);
      
      // Calculate statistics
      const completedScans = formattedData.filter(item => 
        item.monitoring_settings && 
        typeof item.monitoring_settings === 'object' && 
        'lastScanTime' in item.monitoring_settings
      );
      
      // Count vulnerabilities
      let criticalCount = 0;
      let highCount = 0;
      
      completedScans.forEach(scan => {
        if (scan.monitoring_settings && typeof scan.monitoring_settings === 'object') {
          const scanResults = scan.monitoring_settings.scanResults || [];
          if (Array.isArray(scanResults)) {
            criticalCount += scanResults.filter(r => r?.severity === 'critical').length;
            highCount += scanResults.filter(r => r?.severity === 'high').length;
          }
        }
      });
      
      setStatistics({
        totalScans: completedScans.length,
        criticalVulnerabilities: criticalCount,
        highVulnerabilities: highCount,
        averageScanTime: "2.3", // Mock data - would be calculated from actual scan durations
        successRate: (completedScans.length / (formattedData.length || 1)) * 100
      });
      
    } catch (error) {
      console.error('Error fetching scan history:', error);
      toast.error('Failed to fetch scan history');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchScanHistory();
  }, [user]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'PPpp');
  };
  
  const getScanStatus = (item: ScanHistoryItem) => {
    // Check if monitoring settings exist and lastScanTime exists
    if (item.monitoring_settings && typeof item.monitoring_settings === 'object' && 'lastScanTime' in item.monitoring_settings) {
      return 'Completed';
    }
    return 'Pending';
  };
  
  const getScanType = (item: ScanHistoryItem) => {
    // Check if monitoring settings exist and criticalOnly exists
    return (item.monitoring_settings && 
           typeof item.monitoring_settings === 'object' && 
           'criticalOnly' in item.monitoring_settings && 
           item.monitoring_settings.criticalOnly) ? 'Critical Only' : 'Full Scan';
  };
  
  const getLastScanTime = (item: ScanHistoryItem) => {
    return (item.monitoring_settings && 
           typeof item.monitoring_settings === 'object' && 
           'lastScanTime' in item.monitoring_settings) ? 
           formatDate(item.monitoring_settings.lastScanTime as string) : 'Never';
  };
  
  const handleRefresh = () => {
    fetchScanHistory();
    toast.success("Scan history refreshed");
  };
  
  const handleExportCSV = () => {
    try {
      // Create CSV content
      let csvContent = "ID,System Name,Scan Type,Status,Last Scan Time,Created At\n";
      
      history.forEach(item => {
        const row = [
          item.id,
          item.system_name,
          getScanType(item),
          getScanStatus(item),
          getLastScanTime(item).replace(',', ' '),
          format(new Date(item.created_at), 'PP')
        ].join(',');
        
        csvContent += row + "\n";
      });
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `HAWK_scan_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.click();
      
      toast.success("Scan history exported to CSV");
    } catch (error) {
      console.error('Error exporting scan history:', error);
      toast.error('Failed to export scan history');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary/70">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  const filterHistory = (filterType: string | null) => {
    setFilter(filterType);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scan History</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your past vulnerability scans
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="history" value={currentTab} onValueChange={setCurrentTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="history">Scan History</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button 
                variant={filter === null ? "default" : "outline"} 
                size="sm"
                onClick={() => filterHistory(null)}
              >
                All
              </Button>
              <Button 
                variant={filter === "Completed" ? "default" : "outline"} 
                size="sm"
                onClick={() => filterHistory("Completed")}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Completed
              </Button>
              <Button 
                variant={filter === "Pending" ? "default" : "outline"} 
                size="sm"
                onClick={() => filterHistory("Pending")}
              >
                <Clock className="h-4 w-4 mr-1" />
                Pending
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                  <p className="mt-2 text-gray-500">Loading scan history...</p>
                </div>
              </div>
            ) : history.length === 0 ? (
              <Card className="p-8 text-center">
                <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Scan History</h3>
                <p className="text-gray-600 mb-4">
                  You haven't performed any vulnerability scans yet.
                </p>
                <Button onClick={() => window.location.href = '/system-monitor'}>
                  Start Scanning
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {history
                  .filter(item => filter === null || getScanStatus(item) === filter)
                  .map((item) => {
                    const scanStatus = getScanStatus(item);
                    return (
                      <Card key={item.id} className="p-5 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium">{item.system_name}</h3>
                              <Badge 
                                variant="outline" 
                                className={`ml-2 ${
                                  scanStatus === 'Completed' ? 'bg-green-50 text-green-700' : 
                                  'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {scanStatus}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              <span className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                Last scan: {getLastScanTime(item)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Created: {format(new Date(item.created_at), 'PP')}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              <Filter className="h-3 w-3 mr-1" />
                              {getScanType(item)}
                            </Badge>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.location.href = '/system-monitor'}
                            >
                              <Shield className="h-3.5 w-3.5 mr-1" />
                              View System
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Scans</p>
                    <h3 className="text-2xl font-bold">{statistics.totalScans}</h3>
                  </div>
                  <BarChart2 className="h-8 w-8 text-primary opacity-75" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Critical Vulnerabilities</p>
                    <h3 className="text-2xl font-bold text-red-600">{statistics.criticalVulnerabilities}</h3>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500 opacity-75" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Scan Time</p>
                    <h3 className="text-2xl font-bold">{statistics.averageScanTime}s</h3>
                  </div>
                  <Clock className="h-8 w-8 text-primary opacity-75" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <h3 className="text-2xl font-bold">{statistics.successRate.toFixed(0)}%</h3>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500 opacity-75" />
                </div>
              </Card>
            </div>
            
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Scan Performance Overview</h3>
              <p className="text-sm text-gray-500 mb-4">
                Your scans are {statistics.successRate > 80 ? "performing well" : "experiencing some issues"}. 
                {statistics.criticalVulnerabilities > 0 && ` You have ${statistics.criticalVulnerabilities} critical vulnerabilities that need attention.`}
              </p>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  {statistics.criticalVulnerabilities > 0 && 
                    <li>Address critical vulnerabilities to improve your security posture</li>
                  }
                  {statistics.totalScans < 5 && 
                    <li>Perform more regular scans to build a comprehensive security history</li>
                  }
                  <li>Configure automatic scans in System Monitor for continuous protection</li>
                  <li>Check your notification settings to ensure you're alerted about new vulnerabilities</li>
                </ul>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ScanHistory;
