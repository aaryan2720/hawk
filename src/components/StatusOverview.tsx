
import React from 'react';
import { Check, AlertTriangle, XCircle, Clock, Activity, RefreshCw } from 'lucide-react';
import { mockSystemStatus } from '../utils/mockData';
import { capitalize } from '../utils/formatters';

const StatusOverview = () => {
  // Get count of systems by status
  const operationalCount = mockSystemStatus.filter(s => s.status === 'operational').length;
  const degradedCount = mockSystemStatus.filter(s => s.status === 'degraded').length;
  const criticalCount = mockSystemStatus.filter(s => s.status === 'critical').length;
  const maintenanceCount = mockSystemStatus.filter(s => s.status === 'maintenance').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <Check className="h-5 w-5 text-emerald-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-alert-critical" />;
      case 'maintenance':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-emerald-100 text-emerald-800';
      case 'degraded':
        return 'bg-amber-100 text-amber-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="glass-card rounded-lg p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">System Status</h2>
        <div className="flex text-xs text-gray-500 items-center">
          <RefreshCw className="h-3 w-3 mr-1" />
          Updated 2 min ago
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="flex flex-col items-center rounded-lg bg-green-50 p-3">
          <Check className="h-6 w-6 text-emerald-500 mb-1" />
          <span className="text-xs text-gray-600">Operational</span>
          <span className="font-semibold text-emerald-700">{operationalCount}</span>
        </div>
        <div className="flex flex-col items-center rounded-lg bg-amber-50 p-3">
          <AlertTriangle className="h-6 w-6 text-amber-500 mb-1" />
          <span className="text-xs text-gray-600">Degraded</span>
          <span className="font-semibold text-amber-700">{degradedCount}</span>
        </div>
        <div className="flex flex-col items-center rounded-lg bg-red-50 p-3">
          <XCircle className="h-6 w-6 text-red-500 mb-1" />
          <span className="text-xs text-gray-600">Critical</span>
          <span className="font-semibold text-red-700">{criticalCount}</span>
        </div>
        <div className="flex flex-col items-center rounded-lg bg-blue-50 p-3">
          <Clock className="h-6 w-6 text-blue-500 mb-1" />
          <span className="text-xs text-gray-600">Maintenance</span>
          <span className="font-semibold text-blue-700">{maintenanceCount}</span>
        </div>
      </div>

      <div className="space-y-4">
        {mockSystemStatus.map((system, index) => (
          <div 
            key={system.name} 
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 animate-slide-up"
            style={{ animationDelay: `${0.1 + index * 0.05}s` }}
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon(system.status)}
              <span className="font-medium">{system.name}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(system.status)}`}>
                {capitalize(system.status)}
              </span>
              <div className="flex flex-col items-end">
                <span className="text-sm text-gray-500">
                  {system.alertsCount} {system.alertsCount === 1 ? 'alert' : 'alerts'}
                </span>
                {system.highSeverityCount > 0 && (
                  <span className="text-xs text-red-600">
                    {system.highSeverityCount} high severity
                  </span>
                )}
              </div>
              <Activity className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-center">
        <button className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center">
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Refresh Status
        </button>
      </div>
    </div>
  );
};

export default StatusOverview;
