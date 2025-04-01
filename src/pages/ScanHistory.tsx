import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DashboardNav from '@/components/DashboardNav';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Shield, AlertTriangle, CheckCircle, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ScanHistoryItem, Json } from '@/types';

const ScanHistory = () => {
  const { user, loading } = useAuth();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchScanHistory = async () => {
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
          monitoring_settings: item.monitoring_settings as ScanHistoryItem['monitoring_settings']
        }));
        
        setHistory(formattedData);
      } catch (error) {
        console.error('Error fetching scan history:', error);
        toast.error('Failed to fetch scan history');
      } finally {
        setIsLoading(false);
      }
    };
    
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Scan History</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your past vulnerability scans
          </p>
        </div>
        
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
      </main>
    </div>
  );
};

export default ScanHistory;
