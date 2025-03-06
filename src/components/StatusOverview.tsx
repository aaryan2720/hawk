
import React from 'react';
import { Check, AlertTriangle, XCircle, Clock } from 'lucide-react';
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
        <div className="flex space-x-2">
          <span className="text-sm px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
            {operationalCount} Operational
          </span>
          <span className="text-sm px-2 py-1 rounded-full bg-amber-100 text-amber-800">
            {degradedCount} Degraded
          </span>
          <span className="text-sm px-2 py-1 rounded-full bg-red-100 text-red-800">
            {criticalCount} Critical
          </span>
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
              <span className="text-sm text-gray-500">
                {system.alertsCount} {system.alertsCount === 1 ? 'alert' : 'alerts'}
              </span>
              {system.highSeverityCount > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                  {system.highSeverityCount} high severity
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusOverview;
