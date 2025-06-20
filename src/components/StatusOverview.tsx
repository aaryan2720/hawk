
import React, { useEffect, useState } from 'react';
import { Check, AlertTriangle, XCircle, Clock, Activity, RefreshCw, Shield, TrendingUp } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { capitalize } from '../utils/formatters';
import { SystemStatus } from '../types';
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
        return <Check className="h-4 w-4 text-emerald-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <Clock className="h-4 w-4 text-blue-500" />;
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
      <Card className="glass-card border-0 shadow-xl rounded-2xl h-full">
        <CardContent className="flex flex-col items-center justify-center p-8 h-full min-h-[400px]">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg mb-4">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-white border-r-transparent"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading System Status</h3>
          <p className="text-gray-600 text-center text-sm">Fetching real-time system data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-0 shadow-xl rounded-2xl hover-scale h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-green-500/5 to-indigo-500/5 rounded-2xl"></div>
      
      <CardHeader className="relative pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold gradient-text">System Status</CardTitle>
              <p className="text-sm text-gray-600 mt-0.5">Real-time monitoring</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1.5 font-semibold shadow-lg">
            <TrendingUp className="h-3 w-3 mr-1" />
            {formatTimeAgo(lastUpdated)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Status Grid - Responsive */}
        <div className="grid grid-cols-2 gap-3">
          <StatusTile
            icon={<Check className="h-5 w-5 text-emerald-500" />}
            label="Operational"
            count={operationalCount}
            bgColor="bg-gradient-to-br from-emerald-50 to-emerald-100"
            textColor="text-emerald-700"
            borderColor="border-emerald-200"
          />
          <StatusTile
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            label="Degraded"
            count={degradedCount}
            bgColor="bg-gradient-to-br from-amber-50 to-amber-100"
            textColor="text-amber-700"
            borderColor="border-amber-200"
          />
          <StatusTile
            icon={<XCircle className="h-5 w-5 text-red-500" />}
            label="Critical"
            count={criticalCount}
            bgColor="bg-gradient-to-br from-red-50 to-red-100"
            textColor="text-red-700"
            borderColor="border-red-200"
          />
          <StatusTile
            icon={<Clock className="h-5 w-5 text-blue-500" />}
            label="Maintenance"
            count={maintenanceCount}
            bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
            textColor="text-blue-700"
            borderColor="border-blue-200"
          />
        </div>

        {/* Systems List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {systems.map((system, index) => (
            <div 
              key={system.name} 
              className="flex items-center justify-between p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 hover:bg-white/90 hover:shadow-md transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(system.status)}
                <div>
                  <span className="font-medium text-gray-900 text-sm">{system.name}</span>
                  {system.highSeverityCount > 0 && (
                    <p className="text-xs text-red-600 font-medium">
                      {system.highSeverityCount} high severity alerts
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs px-2 py-1 font-medium ${getStatusBadgeClass(system.status)}`}>
                  {capitalize(system.status)}
                </Badge>
                <span className="text-xs text-gray-500 hidden sm:block">
                  {system.alertsCount} alerts
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Refresh Button */}
        <div className="pt-3 border-t border-gray-100">
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="w-full bg-white/50 border-gray-300 hover:bg-white/80 text-gray-700 transition-all duration-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
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
    <div className={`flex flex-col items-center p-3 ${bgColor} border ${borderColor} rounded-xl transition-all duration-300 hover:shadow-md hover:scale-105`}>
      <div className="mb-2">{icon}</div>
      <span className={`text-xs font-semibold ${textColor} uppercase tracking-wide text-center`}>{label}</span>
      <span className={`text-xl font-bold ${textColor} mt-1`}>{count}</span>
    </div>
  );
};

export default StatusOverview;
