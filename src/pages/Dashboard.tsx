import React, { useEffect, useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import DashboardNav from '@/components/DashboardNav';
import StatusOverview from '@/components/StatusOverview';
import AlertsList from '@/components/AlertsList';
import TrendChart from '@/components/TrendChart';
import SearchFilters from '@/components/SearchFilters';
import VulnerabilityScraper from '@/components/VulnerabilityScraper';
import RealTimeScanner from '@/components/RealTimeScanner';
import RiskAnalyzer from '@/components/RiskAnalyzer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Alert, AlertsStats, SystemStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

const Dashboard: React.FC = () => {
  const [alertsData, setAlertsData] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AlertsStats>({
    total: 0,
    bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
    resolved: 0,
    new: 0,
    acknowledged: 0,
  });

  const fetchAlertsData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('alerts')
        .select('*');

      if (error) throw error;

      const formattedAlerts: Alert[] = data.map(alert => ({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
        date: alert.date,
        system: alert.system,
        cve: alert.cve || undefined,
        status: alert.status as 'new' | 'acknowledged' | 'resolved',
        mitigation: alert.mitigation || undefined,
        patchLink: alert.patch_link || undefined,
        details: alert.details as Record<string, any> | undefined,
      }));

      setAlertsData(formattedAlerts);
      
      const total = formattedAlerts.length;
      const critical = formattedAlerts.filter(a => a.severity === 'critical').length;
      const high = formattedAlerts.filter(a => a.severity === 'high').length;
      const medium = formattedAlerts.filter(a => a.severity === 'medium').length;
      const low = formattedAlerts.filter(a => a.severity === 'low').length;
      const resolved = formattedAlerts.filter(a => a.status === 'resolved').length;
      const newAlerts = formattedAlerts.filter(a => a.status === 'new').length;
      const acknowledged = formattedAlerts.filter(a => a.status === 'acknowledged').length;
      
      setStats({
        total,
        bySeverity: { critical, high, medium, low },
        resolved,
        new: newAlerts,
        acknowledged,
      });

      const systems = Array.from(new Set(formattedAlerts.map(alert => alert.system)));
      const systemStatusData: SystemStatus[] = systems.map(system => {
        const systemAlerts = formattedAlerts.filter(alert => alert.system === system);
        const highSeverityCount = systemAlerts.filter(alert => 
          alert.severity === 'high' || alert.severity === 'critical'
        ).length;
        
        let status: 'operational' | 'degraded' | 'critical' | 'maintenance' = 'operational';
        if (highSeverityCount > 5) {
          status = 'critical';
        } else if (highSeverityCount > 0) {
          status = 'degraded';
        }
        
        return {
          name: system,
          status,
          alertsCount: systemAlerts.length,
          highSeverityCount
        };
      });
      
      setSystemStatus(systemStatusData);
    } catch (error) {
      console.error('Error fetching alerts data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, []);

  useEffect(() => {
    let filtered = [...alertsData];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.title.toLowerCase().includes(term) || 
        alert.description.toLowerCase().includes(term) ||
        (alert.cve?.toLowerCase().includes(term) || false)
      );
    }
    
    if (selectedSeverities.length > 0) {
      filtered = filtered.filter(alert => selectedSeverities.includes(alert.severity));
    }
    
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(alert => selectedStatuses.includes(alert.status));
    }
    
    if (selectedSystems.length > 0) {
      filtered = filtered.filter(alert => selectedSystems.includes(alert.system));
    }
    
    setFilteredAlerts(filtered);
  }, [alertsData, searchTerm, selectedSeverities, selectedStatuses, selectedSystems]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filters: { severity: string[]; status: string[] }) => {
    setSelectedSeverities(filters.severity);
    setSelectedStatuses(filters.status);
  };

  const handleRefresh = async () => {
    await fetchAlertsData();
    toast.success('Dashboard data refreshed');
  };
  
  return (
    <>
      <DashboardNav />
      <div className="p-4 sm:p-6 space-y-6">
        <DashboardHeader title="Security Dashboard" subtitle="Monitor and manage security alerts" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatusOverview />
          <RiskAnalyzer />
        </div>
        
        <Tabs defaultValue="alerts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="tools">Scanner Tools</TabsTrigger>
          </TabsList>
          
          <TabsContent value="alerts" className="space-y-4">
            <Card className="p-4">
              <SearchFilters 
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
              />
            </Card>
            
            <AlertsList />
          </TabsContent>
          
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <RealTimeScanner onScanComplete={handleRefresh} />
              <VulnerabilityScraper onScanComplete={handleRefresh} />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Vulnerability Trends</h2>
            <TrendChart />
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
