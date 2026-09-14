
import React, { useEffect, useState } from 'react';
import { Check, AlertTriangle, XCircle, Clock, Activity, RefreshCw, Shield, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { capitalize } from '@/utils/formatters';
import { SystemStatus } from '@/types';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const StatusOverview = () => {
  const [systems, setSystems] = useState<SystemStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Get count of systems by status
  const operationalCount = systems.filter(s => s.status === 'operational').length;
  const degradedCount = systems.filter(s => s.status === 'degraded').length;
  const criticalCount = systems.filter(s => s.status === 'critical').length;
  const maintenanceCount = systems.filter(s => s.status === 'maintenance').length;

  const fetchSystems = async () => {
    try {
      const { data: systemsData, error: systemsError } = await supabase
        .from('systems')
        .select('*');

      if (systemsError) throw systemsError;

      // Get alert counts for each system
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('system, severity, status');

      if (alertsError) throw alertsError;

      // Process the data to match our SystemStatus type
      const processedSystems: SystemStatus[] = systemsData.map(system => {
        const systemAlerts = alertsData.filter(alert => alert.system === system.name);
        const alertsCount = systemAlerts.length;
        const highSeverityCount = systemAlerts.filter(
          alert => (alert.severity === 'high' || alert.severity === 'critical') && alert.status !== 'resolved'
        ).length;

        return {
          name: system.name,
          status: system.status as 'operational' | 'degraded' | 'critical' | 'maintenance',
          alertsCount,
          highSeverityCount
        };
      });

      setSystems(processedSystems);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching systems:', error);
      toast.error('Failed to load system status data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSystems();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSystems();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <Check className="h-3 w-3 text-emerald-500" />;
      case 'degraded':
        return <AlertTriangle className="h-3 w-3 text-amber-500" />;
      case 'critical':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'maintenance':
        return <Clock className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300';
      case 'degraded':
        return 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300';
      case 'critical':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300';
      case 'maintenance':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-lg rounded-xl h-full">
        <CardContent className="flex flex-col items-center justify-center p-6 h-full min-h-[300px]">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md mb-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Loading System Status</h3>
          <p className="text-gray-600 text-center text-xs">Fetching real-time data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-md">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">
                System Status
              </CardTitle>
              <p className="text-xs text-gray-600">Real-time monitoring</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-1 text-xs font-medium shadow-md">
            <TrendingUp className="h-3 w-3 mr-1" />
            {formatTimeAgo(lastUpdated)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status Grid - Compact */}
        <div className="grid grid-cols-2 gap-2">
          <StatusTile
            icon={<Check className="h-4 w-4 text-emerald-500" />}
            label="Operational"
            count={operationalCount}
            bgColor="bg-gradient-to-br from-emerald-50 to-emerald-100"
            textColor="text-emerald-700"
            borderColor="border-emerald-200"
          />
          <StatusTile
            icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
            label="Degraded"
            count={degradedCount}
            bgColor="bg-gradient-to-br from-amber-50 to-amber-100"
            textColor="text-amber-700"
            borderColor="border-amber-200"
          />
          <StatusTile
            icon={<XCircle className="h-4 w-4 text-red-500" />}
            label="Critical"
            count={criticalCount}
            bgColor="bg-gradient-to-br from-red-50 to-red-100"
            textColor="text-red-700"
            borderColor="border-red-200"
          />
          <StatusTile
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            label="Maintenance"
            count={maintenanceCount}
            bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
            textColor="text-blue-700"
            borderColor="border-blue-200"
          />
        </div>

        {/* Systems List - Compact */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {systems.map((system, index) => (
            <div 
              key={system.name} 
              className="flex items-center justify-between p-2 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white/90 hover:shadow-sm transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <div className="flex items-center space-x-2">
                {getStatusIcon(system.status)}
                <div>
                  <span className="font-medium text-gray-900 text-xs">{system.name}</span>
                  {system.highSeverityCount > 0 && (
                    <p className="text-xs text-red-600 font-medium">
                      {system.highSeverityCount} high priority
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Badge className={`text-xs px-1.5 py-0.5 font-medium ${getStatusBadgeClass(system.status)}`}>
                  {capitalize(system.status)}
                </Badge>
                <span className="text-xs text-gray-500 hidden sm:block">
                  {system.alertsCount}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Refresh Button - Compact */}
        <div className="pt-2 border-t border-gray-100">
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="w-full bg-white/50 border-gray-300 hover:bg-white/80 text-gray-700 transition-all duration-300 text-xs py-1.5"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface StatusTileProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const StatusTile: React.FC<StatusTileProps> = ({ icon, label, count, bgColor, textColor, borderColor }) => {
  return (
    <div className={`flex flex-col items-center p-2 ${bgColor} border ${borderColor} rounded-lg transition-all duration-300 hover:shadow-sm hover:scale-105`}>
      <div className="mb-1">{icon}</div>
      <span className={`text-xs font-semibold ${textColor} uppercase tracking-wide text-center`}>{label}</span>
      <span className={`text-lg font-bold ${textColor} mt-0.5`}>{count}</span>
    </div>
  );
};

export default StatusOverview;
