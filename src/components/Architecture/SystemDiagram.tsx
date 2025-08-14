
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Shield, Users, Bell, Activity, Zap, Globe, Lock, Server, Cloud } from 'lucide-react';

const SystemDiagram = () => {
  const components = [
    { id: 'frontend', name: 'React Frontend', icon: Globe, x: 50, y: 20, status: 'healthy', connections: ['api-gateway'] },
    { id: 'api-gateway', name: 'API Gateway', icon: Server, x: 50, y: 40, status: 'healthy', connections: ['auth', 'database', 'functions'] },
    { id: 'auth', name: 'Authentication', icon: Lock, x: 20, y: 60, status: 'healthy', connections: ['database'] },
    { id: 'database', name: 'PostgreSQL', icon: Database, x: 50, y: 80, status: 'healthy', connections: ['realtime'] },
    { id: 'functions', name: 'Edge Functions', icon: Zap, x: 80, y: 60, status: 'healthy', connections: ['external'] },
    { id: 'realtime', name: 'Real-time Engine', icon: Activity, x: 20, y: 100, status: 'healthy', connections: [] },
    { id: 'external', name: 'External APIs', icon: Cloud, x: 100, y: 80, status: 'warning', connections: [] },
    { id: 'scanner', name: 'Vulnerability Scanner', icon: Shield, x: 80, y: 100, status: 'healthy', connections: ['external'] },
    { id: 'notifications', name: 'Notification System', icon: Bell, x: 50, y: 120, status: 'healthy', connections: ['users'] },
    { id: 'users', name: 'User Management', icon: Users, x: 20, y: 140, status: 'healthy', connections: [] }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500 border-green-500';
      case 'warning': return 'text-yellow-500 border-yellow-500';
      case 'error': return 'text-red-500 border-red-500';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'outline';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Architecture Diagram</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-96 bg-gradient-to-br from-background to-muted/20 rounded-lg border overflow-hidden">
          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            {components.map(component => 
              component.connections.map(targetId => {
                const target = components.find(c => c.id === targetId);
                if (!target) return null;
                return (
                  <line
                    key={`${component.id}-${targetId}`}
                    x1={`${component.x}%`}
                    y1={`${component.y}%`}
                    x2={`${target.x}%`}
                    y2={`${target.y}%`}
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.6"
                  />
                );
              })
            )}
          </svg>

          {/* Components */}
          {components.map(component => {
            const IconComponent = component.icon;
            return (
              <div
                key={component.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${getStatusColor(component.status)}`}
                style={{ 
                  left: `${component.x}%`, 
                  top: `${component.y}%`,
                  zIndex: 2
                }}
              >
                <div className="flex flex-col items-center gap-1 p-2 bg-background border-2 rounded-lg shadow-lg min-w-24">
                  <IconComponent className="h-6 w-6" />
                  <div className="text-xs font-medium text-center whitespace-nowrap">
                    {component.name}
                  </div>
                  <Badge variant={getStatusBadge(component.status)} className="text-xs">
                    {component.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm">Error</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemDiagram;
