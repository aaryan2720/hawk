
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Database, Shield, Users, Bell, Activity, Zap, Globe, Lock, Server, Cloud, GitBranch, Monitor, Cpu, HardDrive } from 'lucide-react';

interface UserDot {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  role: string;
  currentComponent: string;
  velocity: { x: number; y: number };
  lastUpdate: number;
}

interface FlowData {
  id: string;
  user_id: string;
  flow_path: string[];
  user_role: string;
  last_activity: string;
  status: string;
}

interface SystemComponent {
  id: string;
  name: string;
  icon: any;
  x: number;
  y: number;
  status: string;
  color: string;
  category: string;
  connections: string[];
  metrics: {
    cpu: number;
    memory: number;
    requests: number;
    latency: number;
  };
}

const InteractiveSystemDiagram = () => {
  const [userDots, setUserDots] = useState<UserDot[]>([]);
  const [realTimeStats, setRealTimeStats] = useState({
    activeUsers: 0,
    totalSessions: 0,
    systemLoad: 0,
    throughput: 0
  });

  const [systemComponents] = useState<SystemComponent[]>([
    {
      id: 'frontend',
      name: 'React Frontend',
      icon: Globe,
      x: 200,
      y: 80,
      status: 'healthy',
      color: 'text-blue-500',
      category: 'client',
      connections: ['auth', 'api-gateway'],
      metrics: { cpu: 45, memory: 62, requests: 1250, latency: 120 }
    },
    {
      id: 'auth',
      name: 'Supabase Auth',
      icon: Lock,
      x: 100,
      y: 200,
      status: 'healthy',
      color: 'text-red-500',
      category: 'security',
      connections: ['users', 'api-gateway'],
      metrics: { cpu: 23, memory: 34, requests: 890, latency: 85 }
    },
    {
      id: 'api-gateway',
      name: 'API Gateway',
      icon: Server,
      x: 200,
      y: 200,
      status: 'healthy',
      color: 'text-green-500',
      category: 'backend',
      connections: ['database', 'functions', 'realtime'],
      metrics: { cpu: 67, memory: 78, requests: 3200, latency: 95 }
    },
    {
      id: 'database',
      name: 'PostgreSQL DB',
      icon: Database,
      x: 300,
      y: 200,
      status: 'healthy',
      color: 'text-purple-500',
      category: 'storage',
      connections: ['api-gateway', 'realtime', 'scanner'],
      metrics: { cpu: 56, memory: 82, requests: 2100, latency: 45 }
    },
    {
      id: 'scanner',
      name: 'Vulnerability Scanner',
      icon: Shield,
      x: 400,
      y: 200,
      status: 'healthy',
      color: 'text-orange-500',
      category: 'security',
      connections: ['database', 'external', 'notifications'],
      metrics: { cpu: 78, memory: 65, requests: 450, latency: 200 }
    },
    {
      id: 'functions',
      name: 'Edge Functions',
      icon: Zap,
      x: 100,
      y: 320,
      status: 'healthy',
      color: 'text-yellow-500',
      category: 'compute',
      connections: ['api-gateway', 'external'],
      metrics: { cpu: 34, memory: 45, requests: 780, latency: 150 }
    },
    {
      id: 'realtime',
      name: 'Real-time Engine',
      icon: Activity,
      x: 200,
      y: 320,
      status: 'healthy',
      color: 'text-cyan-500',
      category: 'messaging',
      connections: ['database', 'notifications', 'frontend'],
      metrics: { cpu: 89, memory: 67, requests: 5600, latency: 25 }
    },
    {
      id: 'notifications',
      name: 'Notification Hub',
      icon: Bell,
      x: 300,
      y: 320,
      status: 'healthy',
      color: 'text-pink-500',
      category: 'messaging',
      connections: ['realtime', 'scanner', 'users'],
      metrics: { cpu: 45, memory: 38, requests: 1100, latency: 110 }
    },
    {
      id: 'external',
      name: 'External APIs',
      icon: Cloud,
      x: 400,
      y: 320,
      status: 'warning',
      color: 'text-indigo-500',
      category: 'external',
      connections: ['functions', 'scanner'],
      metrics: { cpu: 12, memory: 25, requests: 340, latency: 800 }
    },
    {
      id: 'users',
      name: 'User Management',
      icon: Users,
      x: 500,
      y: 200,
      status: 'healthy',
      color: 'text-teal-500',
      category: 'identity',
      connections: ['auth', 'notifications'],
      metrics: { cpu: 29, memory: 41, requests: 690, latency: 75 }
    },
    {
      id: 'monitoring',
      name: 'System Monitor',
      icon: Monitor,
      x: 100,
      y: 440,
      status: 'healthy',
      color: 'text-emerald-500',
      category: 'ops',
      connections: ['database', 'realtime'],
      metrics: { cpu: 15, memory: 28, requests: 120, latency: 50 }
    },
    {
      id: 'cache',
      name: 'Redis Cache',
      icon: HardDrive,
      x: 300,
      y: 440,
      status: 'healthy',
      color: 'text-rose-500',
      category: 'storage',
      connections: ['api-gateway', 'database'],
      metrics: { cpu: 22, memory: 55, requests: 8900, latency: 5 }
    }
  ]);

  useEffect(() => {
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(updateUserDots, 50);
    return () => clearInterval(interval);
  }, [userDots]);

  const fetchRealTimeData = async () => {
    try {
      console.log('Fetching real-time architecture data...');

      // Get active user flows from the database
      const { data: flowData, error: flowError } = await supabase
        .from('user_flow_tracking')
        .select('*')
        .eq('status', 'active')
        .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Active in last 5 minutes
        .order('last_activity', { ascending: false });

      if (flowError) {
        console.error('Error fetching flow data:', flowError);
        return;
      }

      console.log('Fetched flow data:', flowData?.length || 0, 'active users');

      // Get recent sessions for additional metrics
      const { data: sessionData, error: sessionError } = await supabase
        .from('architecture_sessions')
        .select('*')
        .gte('created_at', new Date(Date.now() - 2 * 60 * 1000).toISOString()) // Last 2 minutes
        .order('created_at', { ascending: false });

      if (sessionError) {
        console.error('Error fetching session data:', sessionError);
      }

      const flows: FlowData[] = flowData || [];
      const sessions = sessionData || [];

      // Update real-time stats
      const uniqueUsers = new Set(flows.map(f => f.user_id)).size;
      const totalSessions = new Set(sessions.map(s => s.session_id)).size;
      
      setRealTimeStats({
        activeUsers: uniqueUsers,
        totalSessions,
        systemLoad: Math.floor(Math.random() * 30) + 40, // Simulated system load
        throughput: sessions.length * 10 // Actions per minute
      });

      // Create user dots based on real data
      const newUserDots: UserDot[] = flows.map((flow, index) => {
        const component = getComponentForPath(flow.flow_path[flow.flow_path.length - 1] || '/');
        const roleColor = getRoleColor(flow.user_role);
        const existingDot = userDots.find(dot => dot.id === flow.user_id);
        
        return {
          id: flow.user_id,
          x: existingDot?.x || Math.random() * 600 + 50,
          y: existingDot?.y || Math.random() * 400 + 50,
          targetX: component.x + (Math.random() - 0.5) * 60,
          targetY: component.y + (Math.random() - 0.5) * 60,
          color: roleColor,
          role: flow.user_role,
          currentComponent: component.name,
          velocity: existingDot?.velocity || { x: 0, y: 0 },
          lastUpdate: Date.now()
        };
      });

      setUserDots(newUserDots);
      console.log('Updated user dots:', newUserDots.length);

    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  };

  const getComponentForPath = (path: string) => {
    if (path.includes('auth') || path.includes('login')) return systemComponents.find(c => c.id === 'auth') || systemComponents[0];
    if (path.includes('dashboard')) return systemComponents.find(c => c.id === 'frontend') || systemComponents[0];
    if (path.includes('alerts')) return systemComponents.find(c => c.id === 'notifications') || systemComponents[0];
    if (path.includes('profile')) return systemComponents.find(c => c.id === 'users') || systemComponents[0];
    if (path.includes('scanner')) return systemComponents.find(c => c.id === 'scanner') || systemComponents[0];
    if (path.includes('architecture')) return systemComponents.find(c => c.id === 'monitoring') || systemComponents[0];
    return systemComponents[Math.floor(Math.random() * systemComponents.length)];
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'premium': return '#3b82f6';
      case 'architecture': return '#8b5cf6';
      default: return '#10b981';
    }
  };

  const updateUserDots = () => {
    setUserDots(prevDots => 
      prevDots.map(dot => {
        const now = Date.now();
        const dt = Math.min(now - dot.lastUpdate, 100) / 1000; // Delta time in seconds
        
        const dx = dot.targetX - dot.x;
        const dy = dot.targetY - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 10) {
          // Reached target, pick new target
          const newComponent = systemComponents[Math.floor(Math.random() * systemComponents.length)];
          return {
            ...dot,
            targetX: newComponent.x + (Math.random() - 0.5) * 60,
            targetY: newComponent.y + (Math.random() - 0.5) * 60,
            currentComponent: newComponent.name,
            lastUpdate: now
          };
        }
        
        // Smooth movement with acceleration
        const acceleration = 100; // pixels per second²
        const maxSpeed = 80; // pixels per second
        
        const forceX = (dx / distance) * acceleration;
        const forceY = (dy / distance) * acceleration;
        
        const newVelX = Math.max(-maxSpeed, Math.min(maxSpeed, dot.velocity.x + forceX * dt));
        const newVelY = Math.max(-maxSpeed, Math.min(maxSpeed, dot.velocity.y + forceY * dt));
        
        return {
          ...dot,
          x: dot.x + newVelX * dt,
          y: dot.y + newVelY * dt,
          velocity: { x: newVelX * 0.9, y: newVelY * 0.9 }, // Add damping
          lastUpdate: now
        };
      })
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'border-green-500 bg-green-50 shadow-green-200';
      case 'warning': return 'border-yellow-500 bg-yellow-50 shadow-yellow-200';
      case 'error': return 'border-red-500 bg-red-50 shadow-red-200';
      default: return 'border-gray-500 bg-gray-50 shadow-gray-200';
    }
  };

  const getMetricColor = (value: number, type: string) => {
    if (type === 'latency') {
      if (value > 500) return 'text-red-500';
      if (value > 200) return 'text-yellow-500';
      return 'text-green-500';
    }
    if (value > 80) return 'text-red-500';
    if (value > 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  const connections = [
    { from: 'frontend', to: 'auth' },
    { from: 'frontend', to: 'api-gateway' },
    { from: 'auth', to: 'users' },
    { from: 'api-gateway', to: 'database' },
    { from: 'api-gateway', to: 'functions' },
    { from: 'api-gateway', to: 'cache' },
    { from: 'database', to: 'realtime' },
    { from: 'scanner', to: 'database' },
    { from: 'functions', to: 'external' },
    { from: 'realtime', to: 'notifications' },
    { from: 'realtime', to: 'frontend' },
    { from: 'notifications', to: 'users' },
    { from: 'scanner', to: 'notifications' },
    { from: 'monitoring', to: 'database' },
    { from: 'monitoring', to: 'realtime' },
    { from: 'cache', to: 'database' }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
              Live HAWK System Architecture
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                {realTimeStats.activeUsers} Active Users
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                {realTimeStats.totalSessions} Sessions
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                {realTimeStats.systemLoad}% Load
              </span>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 animate-pulse">
            Real-time Data • {realTimeStats.throughput} req/min
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] w-full">
          <div className="relative w-full bg-gradient-to-br from-background via-muted/20 to-background border rounded-lg mx-4 mb-4" style={{ minWidth: '700px', minHeight: '600px' }}>
            {/* Grid background */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Connection lines with data flow */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
              {connections.map((conn, index) => {
                const fromComponent = systemComponents.find(c => c.id === conn.from);
                const toComponent = systemComponents.find(c => c.id === conn.to);
                if (!fromComponent || !toComponent) return null;
                
                return (
                  <g key={index}>
                    <line
                      x1={fromComponent.x}
                      y1={fromComponent.y}
                      x2={toComponent.x}
                      y2={toComponent.y}
                      stroke="hsl(var(--border))"
                      strokeWidth="2"
                      strokeDasharray="4,2"
                      opacity="0.6"
                    />
                    
                    {/* Data flow animation */}
                    <circle r="3" fill="hsl(var(--primary))" opacity="0.8">
                      <animateMotion
                        dur={`${2 + Math.random() * 2}s`}
                        repeatCount="indefinite"
                        path={`M${fromComponent.x},${fromComponent.y} L${toComponent.x},${toComponent.y}`}
                      />
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* System Components */}
            {systemComponents.map(component => {
              const IconComponent = component.icon;
              return (
                <div
                  key={component.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${getStatusColor(component.status)} transition-all duration-300 hover:scale-105`}
                  style={{ 
                    left: `${component.x}px`, 
                    top: `${component.y}px`,
                    zIndex: 10
                  }}
                >
                  <div className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl shadow-lg min-w-24 backdrop-blur-sm bg-white/90 ${component.color}`}>
                    <div className="relative">
                      <IconComponent className="h-8 w-8" />
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse ${component.status === 'healthy' ? 'bg-green-500' : component.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className="text-xs font-bold text-center whitespace-nowrap text-foreground">
                      {component.name}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between gap-2">
                        <span>CPU:</span>
                        <span className={getMetricColor(component.metrics.cpu, 'cpu')}>{component.metrics.cpu}%</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>Req:</span>
                        <span className="text-blue-500">{component.metrics.requests}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>Lat:</span>
                        <span className={getMetricColor(component.metrics.latency, 'latency')}>{component.metrics.latency}ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Real User Dots */}
            {userDots.map(dot => (
              <div
                key={dot.id}
                className="absolute w-4 h-4 rounded-full shadow-lg transition-all duration-100 z-20 animate-pulse"
                style={{
                  left: `${dot.x}px`,
                  top: `${dot.y}px`,
                  backgroundColor: dot.color,
                  boxShadow: `0 0 12px ${dot.color}60`
                }}
                title={`${dot.role} user (${dot.id.slice(0, 8)}) at ${dot.currentComponent}`}
              >
                <div className="absolute w-8 h-8 rounded-full animate-ping opacity-30" style={{ backgroundColor: dot.color, left: '-8px', top: '-8px' }}></div>
              </div>
            ))}

            {/* System Status Panel */}
            <div className="absolute top-4 right-4 z-30">
              <div className="flex flex-col gap-2 bg-background/95 backdrop-blur-sm p-3 rounded-lg border shadow-lg">
                <div className="text-xs font-semibold text-foreground mb-1">System Status</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Online: {systemComponents.filter(c => c.status === 'healthy').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span>Warning: {systemComponents.filter(c => c.status === 'warning').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Load: {realTimeStats.systemLoad}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span>TPS: {Math.floor(realTimeStats.throughput/60)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Legend */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>Regular Users ({userDots.filter(d => d.role === 'user').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Premium Users ({userDots.filter(d => d.role === 'premium').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span>Admin Users ({userDots.filter(d => d.role === 'admin').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span>Architecture Team ({userDots.filter(d => d.role === 'architecture').length})</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveSystemDiagram;
