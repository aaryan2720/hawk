
import React, { useEffect, useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import StatusOverview from '@/components/StatusOverview';
import AlertsList from '@/components/AlertsList';
import TrendChart from '@/components/TrendChart';
import SearchFilters from '@/components/SearchFilters';
import VulnerabilityScraper from '@/components/VulnerabilityScraper';
import RealTimeScanner from '@/components/RealTimeScanner';
import RiskAnalyzer from '@/components/RiskAnalyzer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { mockAlertsData, mockSystemsStatusData, mockAlertsStats } from '@/utils/mockData';
import { Alert } from '@/types';

const Dashboard: React.FC = () => {
  const [alertsData, setAlertsData] = useState<Alert[]>(mockAlertsData);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>(mockAlertsData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);

  useEffect(() => {
    // Filter alerts based on search and filter selections
    let filtered = [...alertsData];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.title.toLowerCase().includes(term) || 
        alert.description.toLowerCase().includes(term) ||
        alert.cve?.toLowerCase().includes(term)
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

  const handleFilterChange = (
    type: 'severity' | 'status' | 'system',
    values: string[]
  ) => {
    switch (type) {
      case 'severity':
        setSelectedSeverities(values);
        break;
      case 'status':
        setSelectedStatuses(values);
        break;
      case 'system':
        setSelectedSystems(values);
        break;
    }
  };
  
  const uniqueSystems = Array.from(new Set(alertsData.map(alert => alert.system)));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <DashboardHeader stats={mockAlertsStats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatusOverview systems={mockSystemsStatusData} className="lg:col-span-2" />
        <RiskAnalyzer alerts={alertsData} />
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
              systems={uniqueSystems}
            />
          </Card>
          
          <AlertsList alerts={filteredAlerts} />
        </TabsContent>
        
        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RealTimeScanner />
            <VulnerabilityScraper />
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
  );
};

export default Dashboard;
