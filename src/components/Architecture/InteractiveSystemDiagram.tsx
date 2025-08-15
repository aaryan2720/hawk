
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Database, Shield, Users, Bell, Activity, Zap, Globe, Lock, Server, Cloud, Circle } from 'lucide-react';

interface UserDot {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  role: string;
  currentComponent: string;
}

interface FlowData {
  id: string;
  user_id: string;
  flow_path: string[];
  user_role: string;
  last_activity: string;
}

const InteractiveSystemDiagram = () => {
  const [userDots, setUserDots] = useState<UserDot[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [systemComponents] = useState([
    { id: 'frontend', name: 'React Frontend', icon: Globe, x: 150, y: 50, status: 'healthy', color: 'text-blue-500' },
    { id: 'auth', name: 'Authentication', icon: Lock, x: 50, y: 150, status: 'healthy', color: 'text-red-500' },
    { id: 'api-gateway', name: 'API Gateway', icon: Server, x: 150, y: 150, status: 'healthy', color: 'text-green-500' },
    { id: 'database', name: 'PostgreSQL', icon: Database, x: 250, y: 150, status: 'healthy', color: 'text-purple-500' },
    { id: 'scanner', name: 'Vulnerability Scanner', icon: Shield, x: 350, y: 150, status: 'healthy', color: 'text-orange-500' },
    { id: 'functions', name: 'Edge Functions', icon: Zap, x: 50, y: 250, status: 'healthy', color: 'text-yellow-500' },
    { id: 'realtime', name: 'Real-time Engine', icon: Activity, x: 150, y: 250, status: 'healthy', color: 'text-cyan-500' },
    { id: 'notifications', name: 'Notifications', icon: Bell, x: 250, y: 250, status: 'healthy', color: 'text-pink-500' },
    { id: 'external', name: 'External APIs', icon: Cloud, x: 350, y: 250, status: 'warning', color: 'text-indigo-500' },
    { id: 'users', name: 'User Management', icon: Users, x: 450, y: 150, status: 'healthy', color: 'text-teal-500' },
  ]);

  useEffect(() => {
    fetchUserFlowData();
    const interval = setInterval(fetchUserFlowData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(updateUserDots, 100);
    return () => clearInterval(interval);
  }, [userDots]);

  const fetchUserFlowData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_flow_tracking')
        .select('*')
        .eq('status', 'active')
        .order('last_activity', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const flowData: FlowData[] = data || [];
      setActiveUsers(flowData.length);
      
      // Create user dots based on flow data
      const newUserDots: UserDot[] = flowData.map((flow, index) => {
        const component = getComponentForPath(flow.flow_path[flow.flow_path.length - 1] || '/');
        const roleColor = getRoleColor(flow.user_role);
        
        return {
          id: flow.user_id,
          x: Math.random() * 500 + 50,
          y: Math.random() * 300 + 50,
          targetX: component.x + (Math.random() - 0.5) * 40,
          targetY: component.y + (Math.random() - 0.5) * 40,
          color: roleColor,
          role: flow.user_role,
          currentComponent: component.name
        };
      });

      setUserDots(newUserDots);
    } catch (error) {
      console.error('Error fetching user flow data:', error);
    }
  };

  const getComponentForPath = (path: string) => {
    if (path.includes('auth') || path.includes('login')) return systemComponents.find(c => c.id === 'auth') || systemComponents[0];
    if (path.includes('dashboard')) return systemComponents.find(c => c.id === 'frontend') || systemComponents[0];
    if (path.includes('alerts')) return systemComponents.find(c => c.id === 'notifications') || systemComponents[0];
    if (path.includes('profile')) return systemComponents.find(c => c.id === 'users') || systemComponents[0];
    if (path.includes('scanner')) return systemComponents.find(c => c.id === 'scanner') || systemComponents[0];
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
        const dx = dot.targetX - dot.x;
        const dy = dot.targetY - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
          // Reached target, pick new target
          const newComponent = systemComponents[Math.floor(Math.random() * systemComponents.length)];
          return {
            ...dot,
            targetX: newComponent.x + (Math.random() - 0.5) * 40,
            targetY: newComponent.y + (Math.random() - 0.5) * 40,
            currentComponent: newComponent.name
          };
        }
        
        // Move towards target
        const speed = 1;
        return {
          ...dot,
          x: dot.x + (dx / distance) * speed,
          y: dot.y + (dy / distance) * speed
        };
      })
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'border-green-500 bg-green-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const connections = [
    { from: 'frontend', to: 'api-gateway' },
    { from: 'auth', to: 'api-gateway' },
    { from: 'api-gateway', to: 'database' },
    { from: 'api-gateway', to: 'functions' },
    { from: 'scanner', to: 'database' },
    { from: 'functions', to: 'external' },
    { from: 'realtime', to: 'database' },
    { from: 'notifications', to: 'realtime' },
    { from: 'users', to: 'auth' },
    { from: 'scanner', to: 'notifications' }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
            Live System Architecture ({activeUsers} active users)
          </CardTitle>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Real-time Activity
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96 w-full">
          <div className="relative w-full h-80 bg-gradient-to-br from-background to-muted/20 border rounded-lg mx-4 mb-4" style={{ minWidth: '600px', minHeight: '400px' }}>
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
              {connections.map((conn, index) => {
                const fromComponent = systemComponents.find(c => c.id === conn.from);
                const toComponent = systemComponents.find(c => c.id === conn.to);
                if (!fromComponent || !toComponent) return null;
                
                return (
                  <line
                    key={index}
                    x1={fromComponent.x}
                    y1={fromComponent.y}
                    x2={toComponent.x}
                    y2={toComponent.y}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.4"
                  />
                );
              })}
              
              {/* Data flow animation */}
              {connections.map((conn, index) => {
                const fromComponent = systemComponents.find(c => c.id === conn.from);
                const toComponent = systemComponents.find(c => c.id === conn.to);
                if (!fromComponent || !toComponent) return null;
                
                return (
                  <circle
                    key={`flow-${index}`}
                    r="2"
                    fill="hsl(var(--primary))"
                    opacity="0.7"
                  >
                    <animateMotion
                      dur="3s"
                      repeatCount="indefinite"
                      path={`M${fromComponent.x},${fromComponent.y} L${toComponent.x},${toComponent.y}`}
                    />
                  </circle>
                );
              })}
            </svg>

            {/* System Components */}
            {systemComponents.map(component => {
              const IconComponent = component.icon;
              return (
                <div
                  key={component.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${getStatusColor(component.status)}`}
                  style={{ 
                    left: `${component.x}px`, 
                    top: `${component.y}px`,
                    zIndex: 10
                  }}
                >
                  <div className={`flex flex-col items-center gap-1 p-3 border-2 rounded-lg shadow-lg min-w-20 ${component.color}`}>
                    <IconComponent className="h-6 w-6" />
                    <div className="text-xs font-medium text-center whitespace-nowrap">
                      {component.name}
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              );
            })}

            {/* User Dots */}
            {userDots.map(dot => (
              <div
                key={dot.id}
                className="absolute w-3 h-3 rounded-full shadow-lg transition-all duration-100 z-20"
                style={{
                  left: `${dot.x}px`,
                  top: `${dot.y}px`,
                  backgroundColor: dot.color,
                  boxShadow: `0 0 8px ${dot.color}40`
                }}
                title={`${dot.role} user at ${dot.currentComponent}`}
              >
                <div className="absolute w-6 h-6 rounded-full animate-ping opacity-20" style={{ backgroundColor: dot.color, left: '-6px', top: '-6px' }}></div>
              </div>
            ))}

            {/* Network Traffic Indicators */}
            <div className="absolute top-2 right-2 z-30">
              <div className="flex flex-col gap-1 bg-background/80 p-2 rounded border">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Network Traffic</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>API Calls</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>Real-time Updates</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Legend */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Regular Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Premium Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Admin Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Architecture Team</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveSystemDiagram;
