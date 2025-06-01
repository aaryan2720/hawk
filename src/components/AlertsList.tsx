
import React, { useState, useCallback, useEffect } from 'react';
import AlertCard from './AlertCard';
import SearchFilters from './SearchFilters';
import { Alert } from '../types';
import { supabase } from '../integrations/supabase/client';
import { AlertCircle, Loader, RefreshCw, Shield, Info } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AlertsList = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{ severity: string[]; status: string[] }>({
    severity: [],
    status: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userOEMSources, setUserOEMSources] = useState<any[]>([]);

  const fetchUserOEMSources = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('oem_sources')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setUserOEMSources(data || []);
    } catch (error) {
      console.error('Error fetching OEM sources:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      // Transform data to match our Alert type
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

      setAlerts(formattedAlerts);
      console.log(`Fetched ${formattedAlerts.length} alerts from database`);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load alerts data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterAlerts = useCallback(() => {
    let result = [...alerts];
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(alert => 
        alert.title.toLowerCase().includes(query) || 
        alert.system.toLowerCase().includes(query) || 
        (alert.cve && alert.cve.toLowerCase().includes(query)) ||
        alert.description.toLowerCase().includes(query)
      );
    }
    
    // Apply severity filter
    if (filters.severity.length > 0) {
      result = result.filter(alert => filters.severity.includes(alert.severity));
    }
    
    // Apply status filter
    if (filters.status.length > 0) {
      result = result.filter(alert => filters.status.includes(alert.status));
    }
    
    return result;
  }, [searchQuery, filters, alerts]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFilterChange = useCallback((newFilters: { severity: string[]; status: string[] }) => {
    setFilters(newFilters);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAlerts();
    fetchUserOEMSources();
  };

  const handleStatusChange = async (alertId: string, newStatus: 'new' | 'acknowledged' | 'resolved') => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: newStatus })
        .eq('id', alertId);

      if (error) throw error;

      // Update the local state
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: newStatus } 
            : alert
        )
      );
      
      toast.success(`Alert status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating alert status:', error);
      toast.error('Failed to update alert status');
    }
  };

  // Update filtered alerts when dependencies change
  useEffect(() => {
    setFilteredAlerts(filterAlerts());
  }, [searchQuery, filters, filterAlerts, alerts]);

  // Initial data fetch
  useEffect(() => {
    fetchAlerts();
    fetchUserOEMSources();
    
    // Set up real-time subscription for new alerts
    const channel = supabase
      .channel('public:alerts')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'alerts' 
      }, (payload) => {
        console.log('Real-time alert update:', payload);
        fetchAlerts(); // Refresh all alerts when changes occur
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const oemFilteredAlerts = filteredAlerts.filter(alert => {
    // If user has no OEM sources registered, show all alerts
    if (userOEMSources.length === 0) return true;
    
    // Check if alert is marked as user-filtered (from the new system)
    if (alert.details?.userFiltered) return true;
    
    // For existing alerts, apply OEM filtering
    const alertSystem = alert.system.toLowerCase();
    const alertDescription = alert.description.toLowerCase();
    
    return userOEMSources.some(oemSource => {
      const oemName = oemSource.name.toLowerCase();
      const systemType = oemSource.system_type.toLowerCase();
      
      return alertSystem.includes(oemName) || 
             alertDescription.includes(oemName) ||
             alertSystem.includes(systemType) ||
             alertDescription.includes(systemType);
    });
  });

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Alerts</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{oemFilteredAlerts.length} alerts</span>
          <button 
            onClick={handleRefresh}
            className={`p-1.5 rounded-md text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors`}
            disabled={isLoading || isRefreshing}
          >
            {isRefreshing ? <Loader className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* OEM Filtering Info */}
      {userOEMSources.length > 0 && (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  OEM-Filtered Alerts Active
                </h3>
                <p className="text-xs text-blue-800 mb-3">
                  You're only seeing alerts for your registered OEM sources. This helps reduce noise from irrelevant vulnerabilities.
                </p>
                <div className="flex flex-wrap gap-1">
                  {userOEMSources.map((oem, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      {oem.name} ({oem.system_type})
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {userOEMSources.length === 0 && (
        <Card className="mb-4 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-900 mb-1">
                  No OEM Sources Registered
                </h3>
                <p className="text-xs text-amber-800">
                  You're seeing all alerts. Register your OEM sources in System Monitor to get targeted alerts for your specific systems only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <SearchFilters onSearch={handleSearch} onFilterChange={handleFilterChange} />
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 glass-card rounded-lg">
          <Loader className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-gray-500">Loading alerts...</p>
        </div>
      ) : oemFilteredAlerts.length > 0 ? (
        <div className="space-y-4">
          {oemFilteredAlerts.map((alert, index) => (
            <div 
              key={alert.id}
              className="animate-slide-up"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <AlertCard 
                alert={alert} 
                onStatusChange={(newStatus) => handleStatusChange(alert.id, newStatus)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-lg p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
          <p className="text-gray-500 font-medium mb-1">No alerts matching the current filters</p>
          <p className="text-sm text-gray-400 mb-4">Try changing your search or filter criteria</p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setFilters({ severity: [], status: [] });
            }}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertsList;
