
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Database, Shield, Users, Bell, Activity, Zap, Globe, Lock, 
  Server, Cloud, Monitor, Cpu, HardDrive, GitBranch, Network,
  ArrowRight, Circle, TrendingUp, AlertTriangle
} from 'lucide-react';

interface UserDot {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  role: string;
  currentPage: string;
  sessionId: string;
  velocity: { x: number; y: number };
  lastUpdate: number;
  isActive: boolean;
}

interface SystemMetrics {
  activeUsers: number;
  totalSessions: number;
  apiRequests: number;
  systemLoad: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
}

interface ArchitectureNode {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'security' | 'external' | 'monitoring';
  icon: any;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'healthy' | 'warning' | 'critical';
  color: string;
  connections: string[];
  metrics: {
    cpu: number;
    memory: number;
    requests: number;
    latency: number;
    errors: number;
  };
  description: string;
}

const LiveSystemArchitecture = () => {
  const [userDots, setUserDots] = useState<UserDot[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    activeUsers: 0,
    totalSessions: 0,
    apiRequests: 0,
    systemLoad: 0,
    responseTime: 0,
    errorRate: 0,
    uptime: 99.9
  });
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number>();

  const architectureNodes: ArchitectureNode[] = [
    {
      id: 'client',
      name: 'Client Applications',
      type: 'frontend',
      icon: Globe,
      x: 150,
      y: 100,
      width: 180,
      height: 120,
      status: 'healthy',
      color: '#3b82f6',
      connections: ['auth-gateway', 'cdn'],
      metrics: { cpu: 45, memory: 62, requests: 1250, latency: 120, errors: 2 },
      description: 'React Frontend & Mobile Apps'
    },
    {
      id: 'cdn',
      name: 'CDN & Load Balancer',
      type: 'external',
      icon: Network,
      x: 150,
      y: 280,
      width: 180,
      height: 80,
      status: 'healthy',
      color: '#10b981',
      connections: ['api-gateway'],
      metrics: { cpu: 15, memory: 25, requests: 3500, latency: 45, errors: 0 },
      description: 'Content Delivery & Traffic Distribution'
    },
    {
      id: 'auth-gateway',
      name: 'Authentication Gateway',
      type: 'security',
      icon: Lock,
      x: 450,
      y: 100,
      width: 180,
      height: 120,
      status: 'healthy',
      color: '#ef4444',
      connections: ['user-service', 'api-gateway'],
      metrics: { cpu: 23, memory: 34, requests: 890, latency: 85, errors: 1 },
      description: 'Supabase Auth & JWT Management'
    },
    {
      id: 'api-gateway',
      name: 'API Gateway',
      type: 'backend',
      icon: Server,
      x: 450,
      y: 280,
      width: 180,
      height: 120,
      status: 'healthy',
      color: '#8b5cf6',
      connections: ['microservices', 'database', 'cache'],
      metrics: { cpu: 67, memory: 78, requests: 3200, latency: 95, errors: 5 },
      description: 'Request Routing & Rate Limiting'
    },
    {
      id: 'microservices',
      name: 'Microservices Cluster',
      type: 'backend',
      icon: GitBranch,
      x: 750,
      y: 100,
      width: 200,
      height: 180,
      status: 'warning',
      color: '#f59e0b',
      connections: ['database', 'message-queue', 'external-apis'],
      metrics: { cpu: 78, memory: 85, requests: 2800, latency: 150, errors: 12 },
      description: 'Scanner, Analyzer & Notification Services'
    },
    {
      id: 'database',
      name: 'PostgreSQL Cluster',
      type: 'database',
      icon: Database,
      x: 450,
      y: 450,
      width: 180,
      height: 120,
      status: 'healthy',
      color: '#06b6d4',
      connections: ['cache', 'backup'],
      metrics: { cpu: 56, memory: 82, requests: 2100, latency: 45, errors: 0 },
      description: 'Primary Database & Replicas'
    },
    {
      id: 'cache',
      name: 'Redis Cache',
      type: 'database',
      icon: Zap,
      x: 150,
      y: 450,
      width: 180,
      height: 80,
      status: 'healthy',
      color: '#f97316',
      connections: ['api-gateway'],
      metrics: { cpu: 22, memory: 55, requests: 8900, latency: 5, errors: 0 },
      description: 'Session & Query Caching'
    },
    {
      id: 'message-queue',
      name: 'Message Queue',
      type: 'backend',
      icon: Activity,
      x: 750,
      y: 320,
      width: 200,
      height: 80,
      status: 'healthy',
      color: '#ec4899',
      connections: ['notification-service', 'external-apis'],
      metrics: { cpu: 34, memory: 45, requests: 1500, latency: 25, errors: 0 },
      description: 'Event Processing & Pub/Sub'
    },
    {
      id: 'notification-service',
      name: 'Notification Hub',
      type: 'backend',
      icon: Bell,
      x: 1050,
      y: 200,
      width: 180,
      height: 120,
      status: 'healthy',
      color: '#8b5cf6',
      connections: ['external-apis'],
      metrics: { cpu: 45, memory: 38, requests: 1100, latency: 110, errors: 2 },
      description: 'Email, SMS & Push Notifications'
    },
    {
      id: 'user-service',
      name: 'User Management',
      type: 'backend',
      icon: Users,
      x: 750,
      y: 450,
      width: 180,
      height: 120,
      status: 'healthy',
      color: '#059669',
      connections: ['database'],
      metrics: { cpu: 29, memory: 41, requests: 690, latency: 75, errors: 1 },
      description: 'Profile & Permission Management'
    },
    {
      id: 'monitoring',
      name: 'Monitoring & Logging',
      type: 'monitoring',
      icon: Monitor,
      x: 150,
      y: 600,
      width: 200,
      height: 100,
      status: 'healthy',
      color: '#10b981',
      connections: [],
      metrics: { cpu: 15, memory: 28, requests: 120, latency: 50, errors: 0 },
      description: 'System Metrics & Log Aggregation'
    },
    {
      id: 'security-scanner',
      name: 'Security Scanner',
      type: 'security',
      icon: Shield,
      x: 450,
      y: 600,
      width: 180,
      height: 100,
      status: 'healthy',
      color: '#dc2626',
      connections: ['external-apis'],
      metrics: { cpu: 65, memory: 70, requests: 450, latency: 200, errors: 3 },
      description: 'Vulnerability Detection & Analysis'
    },
    {
      id: 'external-apis',
      name: 'External APIs',
      type: 'external',
      icon: Cloud,
      x: 1050,
      y: 450,
      width: 180,
      height: 120,
      status: 'warning',
      color: '#6366f1',
      connections: [],
      metrics: { cpu: 12, memory: 25, requests: 340, latency: 800, errors: 8 },
      description: 'CVE Database, Threat Intel & OEM Sources'
    },
    {
      id: 'backup',
      name: 'Backup & Recovery',
      type: 'database',
      icon: HardDrive,
      x: 750,
      y: 600,
      width: 180,
      height: 100,
      status: 'healthy',
      color: '#7c3aed',
      connections: [],
      metrics: { cpu: 8, memory: 15, requests: 50, latency: 30, errors: 0 },
      description: 'Data Backup & Disaster Recovery'
    }
  ];

  useEffect(() => {
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    animateUserDots();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [userDots]);

  const fetchRealTimeData = async () => {
    try {
      console.log('Fetching real-time architecture data...');

      // Get active user flows
      const { data: flowData, error: flowError } = await supabase
        .from('user_flow_tracking')
        .select('*')
        .eq('status', 'active')
        .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('last_activity', { ascending: false });

      if (flowError) {
        console.error('Error fetching flow data:', flowError);
        return;
      }

      // Get recent sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('architecture_sessions')
        .select('*')
        .gte('created_at', new Date(Date.now() - 2 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (sessionError) {
        console.error('Error fetching session data:', sessionError);
      }

      const flows = flowData || [];
      const sessions = sessionData || [];

      console.log(`Fetched ${flows.length} flows and ${sessions.length} sessions`);

      // Update system metrics
      const uniqueUsers = new Set(flows.map(f => f.user_id)).size;
      const totalSessions = new Set(sessions.map(s => s.session_id)).size;
      
      setSystemMetrics({
        activeUsers: uniqueUsers,
        totalSessions,
        apiRequests: sessions.length * 15,
        systemLoad: Math.min(45 + (sessions.length * 2), 85),
        responseTime: 80 + Math.random() * 40,
        errorRate: Math.max(0, Math.random() * 2),
        uptime: 99.8 + Math.random() * 0.2
      });

      // Create user dots from real data
      const newUserDots: UserDot[] = flows.map((flow) => {
        const currentPage = flow.flow_path[flow.flow_path.length - 1] || '/';
        const targetNode = getNodeForPage(currentPage);
        const roleColor = getRoleColor(flow.user_role);
        const existingDot = userDots.find(dot => dot.id === flow.user_id);
        
        return {
          id: flow.user_id,
          x: existingDot?.x || Math.random() * 800 + 200,
          y: existingDot?.y || Math.random() * 400 + 150,
          targetX: targetNode.x + targetNode.width / 2 + (Math.random() - 0.5) * 100,
          targetY: targetNode.y + targetNode.height / 2 + (Math.random() - 0.5) * 80,
          color: roleColor,
          role: flow.user_role,
          currentPage,
          sessionId: flow.session_id,
          velocity: existingDot?.velocity || { x: 0, y: 0 },
          lastUpdate: Date.now(),
          isActive: new Date(flow.last_activity).getTime() > Date.now() - 60000
        };
      });

      setUserDots(newUserDots);

    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  };

  const getNodeForPage = (page: string) => {
    if (page.includes('auth') || page.includes('login')) return architectureNodes.find(n => n.id === 'auth-gateway') || architectureNodes[0];
    if (page.includes('dashboard')) return architectureNodes.find(n => n.id === 'client') || architectureNodes[0];
    if (page.includes('alerts')) return architectureNodes.find(n => n.id === 'notification-service') || architectureNodes[0];
    if (page.includes('scanner') || page.includes('vulnerability')) return architectureNodes.find(n => n.id === 'security-scanner') || architectureNodes[0];
    if (page.includes('architecture')) return architectureNodes.find(n => n.id === 'monitoring') || architectureNodes[0];
    return architectureNodes[Math.floor(Math.random() * architectureNodes.length)];
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'premium': return '#3b82f6';
      case 'architecture': return '#8b5cf6';
      default: return '#10b981';
    }
  };

  const animateUserDots = () => {
    const animate = () => {
      setUserDots(prevDots => 
        prevDots.map(dot => {
          const now = Date.now();
          const dt = Math.min(now - dot.lastUpdate, 100) / 1000;
          
          const dx = dot.targetX - dot.x;
          const dy = dot.targetY - dot.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 20) {
            // Reached target, pick new target
            const newNode = architectureNodes[Math.floor(Math.random() * architectureNodes.length)];
            return {
              ...dot,
              targetX: newNode.x + newNode.width / 2 + (Math.random() - 0.5) * 100,
              targetY: newNode.y + newNode.height / 2 + (Math.random() - 0.5) * 80,
              lastUpdate: now
            };
          }
          
          // Smooth movement
          const speed = 60; // pixels per second
          const moveX = (dx / distance) * speed * dt;
          const moveY = (dy / distance) * speed * dt;
          
          return {
            ...dot,
            x: dot.x + moveX,
            y: dot.y + moveY,
            lastUpdate: now
          };
        })
      );
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConnectionPath = (from: ArchitectureNode, to: ArchitectureNode) => {
    const fromX = from.x + from.width / 2;
    const fromY = from.y + from.height / 2;
    const toX = to.x + to.width / 2;
    const toY = to.y + to.height / 2;
    
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    
    return `M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`;
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-background via-muted/20 to-background overflow-hidden">
      {/* Header Stats */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="flex items-center justify-between bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500 animate-pulse" />
              <span className="font-semibold">HAWK Live Architecture</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Circle className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                {systemMetrics.activeUsers} Active Users
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Server className="w-3 h-3 mr-1" />
                {systemMetrics.totalSessions} Sessions
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <TrendingUp className="w-3 h-3 mr-1" />
                {systemMetrics.apiRequests} Req/min
              </Badge>
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                <Cpu className="w-3 h-3 mr-1" />
                {systemMetrics.systemLoad}% Load
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Uptime: {systemMetrics.uptime.toFixed(1)}%</span>
            <span>•</span>
            <span>RT: {Math.round(systemMetrics.responseTime)}ms</span>
            <span>•</span>
            <span className={systemMetrics.errorRate > 1 ? 'text-red-500' : 'text-green-500'}>
              Errors: {systemMetrics.errorRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Architecture Diagram */}
      <div className="pt-20 h-full overflow-auto">
        <svg
          ref={svgRef}
          className="w-full min-w-[1400px] min-h-[800px]"
          viewBox="0 0 1400 800"
          style={{ background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 40 0 L 0 0 0 40" fill="none" stroke="%23f1f5f9" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)"/%3E%3C/svg%3E")' }}
        >
          {/* Connection Lines */}
          {architectureNodes.map(node => 
            node.connections.map(connectionId => {
              const targetNode = architectureNodes.find(n => n.id === connectionId);
              if (!targetNode) return null;
              
              return (
                <g key={`${node.id}-${connectionId}`}>
                  <path
                    d={getConnectionPath(node, targetNode)}
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="8,4"
                    opacity="0.6"
                  />
                  {/* Data flow animation */}
                  <circle r="4" fill="hsl(var(--primary))" opacity="0.8">
                    <animateMotion
                      dur={`${3 + Math.random() * 2}s`}
                      repeatCount="indefinite"
                      path={getConnectionPath(node, targetNode)}
                    />
                  </circle>
                </g>
              );
            })
          )}

          {/* Architecture Nodes */}
          {architectureNodes.map(node => {
            const IconComponent = node.icon;
            return (
              <g key={node.id}>
                {/* Node Background */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  fill="white"
                  stroke={getStatusColor(node.status)}
                  strokeWidth="2"
                  rx="12"
                  className="drop-shadow-lg"
                />
                
                {/* Status Indicator */}
                <circle
                  cx={node.x + node.width - 15}
                  cy={node.y + 15}
                  r="6"
                  fill={getStatusColor(node.status)}
                  className="animate-pulse"
                />
                
                {/* Node Content */}
                <foreignObject x={node.x + 10} y={node.y + 10} width={node.width - 20} height={node.height - 20}>
                  <div className="h-full flex flex-col justify-between p-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${node.color}20`, color: node.color }}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">{node.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{node.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span>CPU:</span>
                        <span className={node.metrics.cpu > 80 ? 'text-red-500' : node.metrics.cpu > 60 ? 'text-yellow-600' : 'text-green-600'}>
                          {node.metrics.cpu}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mem:</span>
                        <span className={node.metrics.memory > 80 ? 'text-red-500' : node.metrics.memory > 60 ? 'text-yellow-600' : 'text-green-600'}>
                          {node.metrics.memory}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Req/m:</span>
                        <span className="text-blue-600">{node.metrics.requests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lat:</span>
                        <span className={node.metrics.latency > 200 ? 'text-red-500' : node.metrics.latency > 100 ? 'text-yellow-600' : 'text-green-600'}>
                          {node.metrics.latency}ms
                        </span>
                      </div>
                    </div>
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* Real User Dots */}
          {userDots.map(dot => (
            <g key={dot.id}>
              <circle
                cx={dot.x}
                cy={dot.y}
                r="8"
                fill={dot.color}
                className="drop-shadow-lg animate-pulse"
                opacity={dot.isActive ? 1 : 0.6}
              />
              <circle
                cx={dot.x}
                cy={dot.y}
                r="16"
                fill={dot.color}
                opacity="0.3"
                className="animate-ping"
              />
              <title>{`${dot.role} user on ${dot.currentPage} (${dot.id.slice(0, 8)})`}</title>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h3 className="font-semibold text-sm">Live User Activity</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Regular ({userDots.filter(d => d.role === 'user').length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Premium ({userDots.filter(d => d.role === 'premium').length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Admin ({userDots.filter(d => d.role === 'admin').length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>Architecture ({userDots.filter(d => d.role === 'architecture').length})</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Healthy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Critical</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSystemArchitecture;
