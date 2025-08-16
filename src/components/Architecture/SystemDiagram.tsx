
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Shield, Users, Bell, Activity, Zap, Globe, Lock, Server, Cloud } from 'lucide-react';

interface SystemComponent {
  id: string;
  name: string;
  icon: any;
  x: number;
  y: number;
  status: 'healthy' | 'warning' | 'error';
  connections: string[];
  description: string;
  metrics: {
    uptime: number;
    load: number;
    responseTime: number;
  };
}

const SystemDiagram = () => {
  const [components, setComponents] = useState<SystemComponent[]>([
    { 
      id: 'frontend', 
      name: 'React Frontend', 
      icon: Globe, 
      x: 15, 
      y: 20, 
      status: 'healthy', 
      connections: ['api-gateway'],
      description: 'User interface built with React and Vite',
      metrics: { uptime: 99.9, load: 45, responseTime: 120 }
    },
    { 
      id: 'api-gateway', 
      name: 'API Gateway', 
      icon: Server, 
      x: 50, 
      y: 20, 
      status: 'healthy', 
      connections: ['auth', 'database', 'functions'],
      description: 'Supabase API gateway handling all requests',
      metrics: { uptime: 99.8, load: 67, responseTime: 85 }
    },
    { 
      id: 'auth', 
      name: 'Authentication', 
      icon: Lock, 
      x: 20, 
      y: 50, 
      status: 'healthy', 
      connections: ['database'],
      description: 'User authentication and authorization',
      metrics: { uptime: 99.95, load: 32, responseTime: 95 }
    },
    { 
      id: 'database', 
      name: 'PostgreSQL', 
      icon: Database, 
      x: 50, 
      y: 50, 
      status: 'healthy', 
      connections: ['realtime'],
      description: 'Primary database for all application data',
      metrics: { uptime: 99.99, load: 58, responseTime: 45 }
    },
    { 
      id: 'functions', 
      name: 'Edge Functions', 
      icon: Zap, 
      x: 80, 
      y: 35, 
      status: 'healthy', 
      connections: ['external'],
      description: 'Serverless functions for business logic',
      metrics: { uptime: 99.7, load: 73, responseTime: 150 }
    },
    { 
      id: 'realtime', 
      name: 'Real-time Engine', 
      icon: Activity, 
      x: 20, 
      y: 80, 
      status: 'healthy', 
      connections: [],
      description: 'WebSocket connections for live updates',
      metrics: { uptime: 99.6, load: 41, responseTime: 25 }
    },
    { 
      id: 'external', 
      name: 'External APIs', 
      icon: Cloud, 
      x: 80, 
      y: 65, 
      status: 'warning', 
      connections: [],
      description: 'Third-party integrations and services',
      metrics: { uptime: 98.5, load: 89, responseTime: 280 }
    },
    { 
      id: 'scanner', 
      name: 'Vulnerability Scanner', 
      icon: Shield, 
      x: 85, 
      y: 80, 
      status: 'healthy', 
      connections: ['external'],
      description: 'Security scanning and monitoring',
      metrics: { uptime: 99.4, load: 52, responseTime: 190 }
    },
    { 
      id: 'notifications', 
      name: 'Notification System', 
      icon: Bell, 
      x: 50, 
      y: 80, 
      status: 'healthy', 
      connections: ['users'],
      description: 'Multi-channel notification delivery',
      metrics: { uptime: 99.2, load: 34, responseTime: 110 }
    },
    { 
      id: 'users', 
      name: 'User Management', 
      icon: Users, 
      x: 15, 
      y: 65, 
      status: 'healthy', 
      connections: [],
      description: 'User profiles and role management',
      metrics: { uptime: 99.8, load: 29, responseTime: 75 }
    }
  ]);

  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setComponents(prev => prev.map(comp => ({
        ...comp,
        metrics: {
          ...comp.metrics,
          load: Math.max(10, Math.min(95, comp.metrics.load + (Math.random() - 0.5) * 10)),
          responseTime: Math.max(20, Math.min(500, comp.metrics.responseTime + (Math.random() - 0.5) * 20))
        }
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 border-green-400';
      case 'warning': return 'text-yellow-400 border-yellow-400';
      case 'error': return 'text-red-400 border-red-400';
      default: return 'text-gray-400 border-gray-400';
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

  const getLoadColor = (load: number) => {
    if (load < 50) return 'text-green-400';
    if (load < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Live System Architecture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-[500px] bg-gradient-to-br from-slate-950 to-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            {/* Enhanced Grid Background */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#475569" strokeWidth="1" opacity="0.3"/>
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Enhanced Connection Lines */}
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
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      strokeDasharray="8,4"
                      opacity="0.6"
                      filter="url(#glow)"
                    >
                      <animate attributeName="stroke-dashoffset" values="0;12" dur="2s" repeatCount="indefinite"/>
                    </line>
                  );
                })
              )}
            </svg>

            {/* Enhanced Components */}
            {components.map(component => {
              const IconComponent = component.icon;
              return (
                <div
                  key={component.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                    hoveredComponent === component.id ? 'scale-110 z-30' : 'z-20'
                  } ${getStatusColor(component.status)}`}
                  style={{ 
                    left: `${component.x}%`, 
                    top: `${component.y}%`
                  }}
                  onMouseEnter={() => setHoveredComponent(component.id)}
                  onMouseLeave={() => setHoveredComponent(null)}
                >
                  <div className="flex flex-col items-center gap-2 p-4 bg-slate-800/90 border-2 rounded-xl shadow-2xl min-w-32 backdrop-blur">
                    <IconComponent className="h-8 w-8" />
                    <div className="text-sm font-bold text-center text-white whitespace-nowrap">
                      {component.name}
                    </div>
                    <Badge variant={getStatusBadge(component.status)} className="text-xs">
                      {component.status}
                    </Badge>
                    
                    {/* Metrics on hover */}
                    {hoveredComponent === component.id && (
                      <div className="absolute top-full mt-2 bg-slate-900/95 border border-slate-600 rounded-lg p-3 text-xs space-y-1 min-w-48 shadow-xl">
                        <div className="text-slate-300 font-medium">{component.description}</div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <span className="text-slate-400">Uptime:</span>
                            <span className="text-green-400 ml-1">{component.metrics.uptime}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Load:</span>
                            <span className={`ml-1 ${getLoadColor(component.metrics.load)}`}>
                              {Math.round(component.metrics.load)}%
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-400">Response:</span>
                            <span className="text-blue-400 ml-1">{Math.round(component.metrics.responseTime)}ms</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-white font-medium">Healthy Systems</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {components.filter(c => c.status === 'healthy').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-white font-medium">Warnings</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {components.filter(c => c.status === 'warning').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-white font-medium">Critical</span>
            </div>
            <div className="text-2xl font-bold text-red-400">
              {components.filter(c => c.status === 'error').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-white font-medium">Avg Response</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {Math.round(components.reduce((acc, c) => acc + c.metrics.responseTime, 0) / components.length)}ms
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemDiagram;
