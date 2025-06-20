
import React, { useState, useCallback, useEffect } from 'react';
import AlertCard from './AlertCard';
import SearchFilters from './SearchFilters';
import { Alert } from '../types';
import { supabase } from '../integrations/supabase/client';
import { AlertCircle, Loader, RefreshCw, Shield, Info, Zap, Filter } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

  // Apply OEM filtering - ENHANCED LOGIC
  const oemFilteredAlerts = filteredAlerts.filter(alert => {
    // If user has no OEM sources registered, show all alerts
    if (userOEMSources.length === 0) return true;
    
    // Check if alert is marked as user-filtered (from the new system)
    if (alert.details && typeof alert.details === 'object' && 'userFiltered' in alert.details) {
      return alert.details.userFiltered;
    }
    
    // Enhanced OEM filtering logic
    const alertSystem = alert.system.toLowerCase();
    const alertDescription = alert.description.toLowerCase();
    const alertTitle = alert.title.toLowerCase();
    
    return userOEMSources.some(oemSource => {
      const oemName = oemSource.name.toLowerCase();
      const systemType = oemSource.system_type.toLowerCase();
      
      // Check in system, description, and title
      return alertSystem.includes(oemName) || 
             alertDescription.includes(oemName) ||
             alertTitle.includes(oemName) ||
             alertSystem.includes(systemType) ||
             alertDescription.includes(systemType) ||
             alertTitle.includes(systemType);
    });
  });

  const getSeverityStats = () => {
    const stats = {
      critical: oemFilteredAlerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length,
      high: oemFilteredAlerts.filter(a => a.severity === 'high' && a.status !== 'resolved').length,
      medium: oemFilteredAlerts.filter(a => a.severity === 'medium' && a.status !== 'resolved').length,
      low: oemFilteredAlerts.filter(a => a.severity === 'low' && a.status !== 'resolved').length,
    };
    return stats;
  };

  const severityStats = getSeverityStats();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Enhanced Header with Stats */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 rounded-2xl blur-lg"></div>
        <Card className="relative backdrop-blur-sm bg-white/90 border-0 shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Active Security Alerts</h2>
                  <p className="text-gray-600 mt-1">
                    {oemFilteredAlerts.length} alerts • {userOEMSources.length} OEM sources monitored
                  </p>
                </div>
              </div>
              
              {/* Severity Stats */}
              <div className="flex flex-wrap gap-2">
                {severityStats.critical > 0 && (
                  <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 shadow-md">
                    {severityStats.critical} Critical
                  </Badge>
                )}
                {severityStats.high > 0 && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 shadow-md">
                    {severityStats.high} High
                  </Badge>
                )}
                {severityStats.medium > 0 && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 shadow-md">
                    {severityStats.medium} Medium
                  </Badge>
                )}
                {severityStats.low > 0 && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 shadow-md">
                    {severityStats.low} Low
                  </Badge>
                )}
                <Button 
                  onClick={handleRefresh}
                  disabled={isLoading || isRefreshing}
                  size="sm"
                  className="ml-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md"
                >
                  {isRefreshing ? <Loader className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced OEM Filtering Info */}
      {userOEMSources.length > 0 ? (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-md rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-md">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                  🎯 Smart OEM Filtering Active
                </h3>
                <p className="text-sm text-emerald-800 mb-3">
                  Showing only alerts relevant to your registered devices. This reduces noise and focuses on vulnerabilities that actually affect your infrastructure.
                </p>
                <div className="flex flex-wrap gap-2">
                  {userOEMSources.map((oem, index) => (
                    <Badge key={index} className="bg-white/70 text-emerald-800 border border-emerald-300 shadow-sm">
                      <Zap className="h-3 w-3 mr-1" />
                      {oem.name} ({oem.system_type})
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-md rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-md">
                <Info className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                  📢 All Alerts Visible
                </h3>
                <p className="text-sm text-amber-800">
                  You're seeing all alerts because no OEM sources are registered. Visit <strong>System Monitor</strong> to register your devices and get personalized, filtered alerts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Enhanced Search and Filters */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-xl blur-lg"></div>
        <div className="relative">
          <SearchFilters onSearch={handleSearch} onFilterChange={handleFilterChange} />
        </div>
      </div>
      
      {/* Enhanced Alerts Display */}
      {isLoading ? (
        <Card className="bg-gradient-to-br from-gray-50 to-slate-100 shadow-lg rounded-xl overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg mb-4">
              <Loader className="h-8 w-8 text-white animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Security Alerts</h3>
            <p className="text-gray-600 text-center">Fetching the latest vulnerability data from multiple sources...</p>
          </CardContent>
        </Card>
      ) : oemFilteredAlerts.length > 0 ? (
        <div className="space-y-4">
          {oemFilteredAlerts.map((alert, index) => (
            <div 
              key={alert.id}
              className="animate-slide-up relative"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-gray-100/20 rounded-xl blur-lg"></div>
              <div className="relative">
                <AlertCard 
                  alert={alert} 
                  onStatusChange={(newStatus) => handleStatusChange(alert.id, newStatus)}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-gray-50 to-slate-100 shadow-lg rounded-xl overflow-hidden">
          <CardContent className="text-center p-12">
            <div className="p-4 bg-gradient-to-br from-gray-400 to-slate-500 rounded-2xl shadow-lg mb-6 w-fit mx-auto">
              <Filter className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">No Matching Alerts Found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No alerts match your current search criteria or OEM filtering settings. 
              Try adjusting your filters or search terms.
            </p>
            <Button 
              onClick={() => {
                setSearchQuery('');
                setFilters({ severity: [], status: [] });
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md px-6 py-2 rounded-lg"
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AlertsList;
