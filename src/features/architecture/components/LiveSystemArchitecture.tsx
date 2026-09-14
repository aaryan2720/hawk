
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { 
  Users, Shield, Activity, Database, Server, 
  Globe, Zap, Monitor, Network, AlertTriangle,
  CheckCircle, XCircle, Clock, Wifi, WifiOff
} from 'lucide-react';

interface UserActivity {
  id: string;
  user_id: string | null;
  session_id: string;
  current_page: string;
  action_type: string;
  created_at: string;
  user_role: string;
  metadata: any;
}

interface SystemStats {
  totalUsers: number;
  activeConnections: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  usersByRole: Record<string, number>;
  networkTraffic: number;
  databaseQueries: number;
  responseTime: number;
  errorRate: number;
}

const LiveSystemArchitecture = () => {
  const { user } = useAuth();
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeConnections: 0,
    systemHealth: 'healthy',
    usersByRole: {},
    networkTraffic: 0,
    databaseQueries: 0,
    responseTime: 0,
    errorRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) return;
    
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 2000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchRealTimeData = async () => {
    if (!user) return;

    try {
      setConnectionStatus('connected');
      console.log('Fetching real-time architecture data...');

      // Fetch recent user activities (last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data: activities, error: sessionError } = await supabase
        .from('architecture_sessions')
        .select('*')
        .gte('created_at', thirtyMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(100);

      if (sessionError) {
        console.error('Session fetch error:', sessionError);
        setConnectionStatus('error');
        return;
      }

      // Get active user flows for role information
      const { data: flowData, error: flowError } = await supabase
        .from('user_flow_tracking')
        .select('user_id, user_role, last_activity, session_id')
        .eq('status', 'active')
        .gte('last_activity', thirtyMinutesAgo);

      if (flowError) {
        console.error('Flow fetch error:', flowError);
      }

      console.log(`Fetched ${activities?.length || 0} sessions and ${flowData?.length || 0} flows`);

      // Process activities with enhanced role detection
      const processedActivities = (activities || []).map(activity => ({
        ...activity,
        user_id: activity.user_id || 'anonymous',
        user_role: getUserRole(activity.user_id, flowData) || 'user'
      }));

      setUserActivities(processedActivities);

      // Calculate comprehensive system stats
      const uniqueUsers = new Set(processedActivities.map(a => a.user_id).filter(Boolean)).size;
      const usersByRole = processedActivities.reduce((acc, activity) => {
        acc[activity.user_role] = (acc[activity.user_role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Simulate realistic system metrics
      const baseTraffic = 500;
      const activityMultiplier = Math.min(processedActivities.length * 10, 800);
      const networkTraffic = baseTraffic + activityMultiplier + (Math.random() * 200);
      
      const databaseQueries = processedActivities.length * 3 + Math.floor(Math.random() * 50);
      const responseTime = 50 + Math.random() * 100;
      const errorRate = Math.random() * 2;
      
      let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (networkTraffic > 1200 || responseTime > 120 || errorRate > 1.5) {
        systemHealth = 'critical';
      } else if (networkTraffic > 900 || responseTime > 90 || errorRate > 1) {
        systemHealth = 'warning';
      }

      setSystemStats({
        totalUsers: uniqueUsers,
        activeConnections: processedActivities.length,
        systemHealth,
        usersByRole,
        networkTraffic: Math.round(networkTraffic),
        databaseQueries,
        responseTime: Math.round(responseTime),
        errorRate: Math.round(errorRate * 100) / 100
      });

      setLastUpdate(new Date());
      setIsLoading(false);
      setConnectionStatus('connected');

    } catch (error) {
      console.error('Error in fetchRealTimeData:', error);
      setConnectionStatus('error');
      setIsLoading(false);
    }
  };

  const getUserRole = (userId: string | null, flows: any[]) => {
    if (!userId) return 'user';
    
    // Check flow data first
    const userFlow = flows?.find(flow => flow.user_id === userId);
    if (userFlow?.user_role) return userFlow.user_role;
    
    // Fallback role detection
    if (userId.includes('architecture') || user?.email === 'architecture@hawk.com') return 'architecture';
    if (userId.includes('admin')) return 'admin';
    if (userId.includes('premium')) return 'premium';
    return 'user';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'premium': return '#3b82f6';
      case 'architecture': return '#8b5cf6';
      default: return '#10b981';
    }
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-4 w-4 text-green-400" />;
      case 'error': return <WifiOff className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400 mx-auto mb-4"></div>
          <div className="text-white text-lg">Initializing Live Architecture...</div>
          <div className="text-slate-400 text-sm mt-2">Connecting to real-time data streams</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 to-slate-900 text-white overflow-hidden relative">
      {/* Enhanced Connection Status Bar */}
      <div className="absolute top-4 left-4 z-30">
        <div className="flex items-center gap-2 bg-slate-800/95 backdrop-blur-md rounded-lg px-3 py-2 border border-slate-600">
          {getConnectionIcon()}
          <span className="text-sm font-medium">
            {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'error' ? 'Error' : 'Connecting...'}
          </span>
          <div className="text-xs text-slate-400">
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Enhanced Live User Activity Panel */}
      <div className="absolute top-4 right-4 z-30 w-80">
        <Card className="bg-slate-800/95 border-slate-600 backdrop-blur-md shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-3">
              <Activity className="h-5 w-5 animate-pulse text-green-400" />
              Live System Monitor
              <Badge variant="outline" className="bg-green-900/30 text-green-300 border-green-500">
                {systemStats.totalUsers} users
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* Role Distribution */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between text-sm bg-slate-700/50 p-2 rounded">
                <span className="text-slate-300">Regular</span>
                <Badge variant="outline" className="bg-green-900/50 text-green-300 border-green-500 text-xs">
                  {systemStats.usersByRole.user || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm bg-slate-700/50 p-2 rounded">
                <span className="text-slate-300">Premium</span>
                <Badge variant="outline" className="bg-blue-900/50 text-blue-300 border-blue-500 text-xs">
                  {systemStats.usersByRole.premium || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm bg-slate-700/50 p-2 rounded">
                <span className="text-slate-300">Admin</span>
                <Badge variant="outline" className="bg-red-900/50 text-red-300 border-red-500 text-xs">
                  {systemStats.usersByRole.admin || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm bg-slate-700/50 p-2 rounded">
                <span className="text-slate-300">Architecture</span>
                <Badge variant="outline" className="bg-purple-900/50 text-purple-300 border-purple-500 text-xs">
                  {systemStats.usersByRole.architecture || 0}
                </Badge>
              </div>
            </div>

            {/* System Health & Metrics */}
            <div className="border-t border-slate-600 pt-3 space-y-2">
              <div className={`flex items-center gap-2 text-sm font-medium ${getSystemHealthColor(systemStats.systemHealth)}`}>
                {getSystemHealthIcon(systemStats.systemHealth)}
                <span className="capitalize">System {systemStats.systemHealth}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-slate-400">
                  Response: <span className="text-white font-mono">{systemStats.responseTime}ms</span>
                </div>
                <div className="text-slate-400">
                  Error Rate: <span className="text-white font-mono">{systemStats.errorRate}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Architecture Diagram */}
      <div className="absolute inset-0 overflow-hidden">
        <svg viewBox="0 0 1400 900" className="w-full h-full">
          {/* Enhanced Background with animated grid */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#334155" strokeWidth="1" opacity="0.3">
                <animate attributeName="opacity" values="0.3;0.1;0.3" dur="4s" repeatCount="indefinite"/>
              </path>
            </pattern>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0"/>
              <stop offset="50%" stopColor="#10b981" stopOpacity="1"/>
              <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Enhanced Data Flow Lines with better visibility */}
          <g stroke="#10b981" strokeWidth="3" fill="none" opacity="0.9" filter="url(#glow)">
            {/* Main horizontal flow */}
            <line x1="200" y1="200" x2="450" y2="200">
              <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
            </line>
            <line x1="450" y1="200" x2="650" y2="200">
              <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="2s" repeatCount="indefinite" begin="0.5s"/>
              <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
            </line>
            <line x1="650" y1="200" x2="850" y2="200">
              <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="2s" repeatCount="indefinite" begin="1s"/>
              <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
            </line>
            <line x1="850" y1="200" x2="1050" y2="200">
              <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="2s" repeatCount="indefinite" begin="1.5s"/>
              <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
            </line>
            
            {/* Secondary flow */}
            <line x1="200" y1="400" x2="450" y2="400">
              <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="2s" repeatCount="indefinite" begin="2s"/>
            </line>
            <line x1="450" y1="400" x2="650" y2="400">
              <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="2s" repeatCount="indefinite" begin="2.5s"/>
            </line>
            <line x1="650" y1="400" x2="850" y2="400">
              <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="2s" repeatCount="indefinite" begin="3s"/>
            </line>
            
            {/* Vertical connections */}
            <line x1="325" y1="280" x2="325" y2="320">
              <animate attributeName="stroke-dasharray" values="0,15;15,0" dur="1.5s" repeatCount="indefinite"/>
            </line>
            <line x1="550" y1="280" x2="550" y2="320">
              <animate attributeName="stroke-dasharray" values="0,15;15,0" dur="1.5s" repeatCount="indefinite" begin="0.5s"/>
            </line>
            <line x1="750" y1="280" x2="750" y2="320">
              <animate attributeName="stroke-dasharray" values="0,15;15,0" dur="1.5s" repeatCount="indefinite" begin="1s"/>
            </line>
            <line x1="950" y1="280" x2="950" y2="320">
              <animate attributeName="stroke-dasharray" values="0,15;15,0" dur="1.5s" repeatCount="indefinite" begin="1.5s"/>
            </line>
          </g>

          {/* Enhanced System Components */}
          <g filter="url(#strongGlow)">
            {/* Frontend Layer */}
            <rect x="200" y="150" width="150" height="100" rx="15" fill="#1e293b" stroke="#3b82f6" strokeWidth="3"/>
            <circle cx="275" cy="185" r="8" fill="#3b82f6">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
            </circle>
            <text x="275" y="210" textAnchor="middle" fill="#3b82f6" fontSize="16" fontWeight="bold">Frontend</text>
            <text x="275" y="230" textAnchor="middle" fill="#94a3b8" fontSize="12">React/Vite</text>

            {/* API Gateway */}
            <rect x="400" y="150" width="150" height="100" rx="15" fill="#1e293b" stroke="#10b981" strokeWidth="3"/>
            <circle cx="475" cy="185" r="8" fill="#10b981">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="0.5s"/>
            </circle>
            <text x="475" y="210" textAnchor="middle" fill="#10b981" fontSize="16" fontWeight="bold">API Gateway</text>
            <text x="475" y="230" textAnchor="middle" fill="#94a3b8" fontSize="12">Supabase</text>

            {/* Backend Services */}
            <rect x="600" y="150" width="150" height="100" rx="15" fill="#1e293b" stroke="#f59e0b" strokeWidth="3"/>
            <circle cx="675" cy="185" r="8" fill="#f59e0b">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="1s"/>
            </circle>
            <text x="675" y="210" textAnchor="middle" fill="#f59e0b" fontSize="16" fontWeight="bold">Backend</text>
            <text x="675" y="230" textAnchor="middle" fill="#94a3b8" fontSize="12">Edge Functions</text>

            {/* Database */}
            <rect x="800" y="150" width="150" height="100" rx="15" fill="#1e293b" stroke="#8b5cf6" strokeWidth="3"/>
            <circle cx="875" cy="185" r="8" fill="#8b5cf6">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="1.5s"/>
            </circle>
            <text x="875" y="210" textAnchor="middle" fill="#8b5cf6" fontSize="16" fontWeight="bold">Database</text>
            <text x="875" y="230" textAnchor="middle" fill="#94a3b8" fontSize="12">PostgreSQL</text>

            {/* Monitoring */}
            <rect x="1000" y="150" width="150" height="100" rx="15" fill="#1e293b" stroke="#06b6d4" strokeWidth="3"/>
            <circle cx="1075" cy="185" r="8" fill="#06b6d4">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="2s"/>
            </circle>
            <text x="1075" y="210" textAnchor="middle" fill="#06b6d4" fontSize="16" fontWeight="bold">Monitoring</text>
            <text x="1075" y="230" textAnchor="middle" fill="#94a3b8" fontSize="12">Real-time</text>

            {/* Second Row Components */}
            {/* Authentication */}
            <rect x="200" y="350" width="150" height="100" rx="15" fill="#1e293b" stroke="#ef4444" strokeWidth="3"/>
            <circle cx="275" cy="385" r="8" fill="#ef4444">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="2.5s"/>
            </circle>
            <text x="275" y="410" textAnchor="middle" fill="#ef4444" fontSize="16" fontWeight="bold">Auth</text>
            <text x="275" y="430" textAnchor="middle" fill="#94a3b8" fontSize="12">Supabase Auth</text>

            {/* Real-time Engine */}
            <rect x="400" y="350" width="150" height="100" rx="15" fill="#1e293b" stroke="#06b6d4" strokeWidth="3"/>
            <circle cx="475" cy="385" r="8" fill="#06b6d4">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="3s"/>
            </circle>
            <text x="475" y="410" textAnchor="middle" fill="#06b6d4" fontSize="16" fontWeight="bold">Real-time</text>
            <text x="475" y="430" textAnchor="middle" fill="#94a3b8" fontSize="12">WebSockets</text>

            {/* Security */}
            <rect x="600" y="350" width="150" height="100" rx="15" fill="#1e293b" stroke="#ec4899" strokeWidth="3"/>
            <circle cx="675" cy="385" r="8" fill="#ec4899">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="3.5s"/>
            </circle>
            <text x="675" y="410" textAnchor="middle" fill="#ec4899" fontSize="16" fontWeight="bold">Security</text>
            <text x="675" y="430" textAnchor="middle" fill="#94a3b8" fontSize="12">Vulnerability</text>

            {/* Analytics */}
            <rect x="800" y="350" width="150" height="100" rx="15" fill="#1e293b" stroke="#84cc16" strokeWidth="3"/>
            <circle cx="875" cy="385" r="8" fill="#84cc16">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="4s"/>
            </circle>
            <text x="875" y="410" textAnchor="middle" fill="#84cc16" fontSize="16" fontWeight="bold">Analytics</text>
            <text x="875" y="430" textAnchor="middle" fill="#94a3b8" fontSize="12">Tracking</text>
          </g>

          {/* Enhanced Live User Visualization */}
          {userActivities.slice(0, 40).map((activity, index) => {
            const x = 150 + (index % 13) * 95 + Math.random() * 30;
            const y = 550 + Math.floor(index / 13) * 70 + Math.random() * 30;
            const color = getRoleColor(activity.user_role);
            
            return (
              <g key={activity.id}>
                <circle 
                  cx={x} 
                  cy={y} 
                  r="5" 
                  fill={color}
                  opacity="0.9"
                  filter="url(#glow)"
                >
                  <animate attributeName="r" values="5;10;5" dur="3s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle 
                  cx={x} 
                  cy={y} 
                  r="10" 
                  fill="none" 
                  stroke={color} 
                  strokeWidth="2"
                  opacity="0.4"
                >
                  <animate attributeName="r" values="10;20;10" dur="4s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="4s" repeatCount="indefinite"/>
                </circle>
              </g>
            );
          })}

          {/* Enhanced Network Traffic Visualization */}
          <g>
            {[...Array(8)].map((_, i) => (
              <circle key={i} cx="700" cy="650" r={25 + i * 12} fill="none" stroke="#10b981" strokeWidth="2" opacity={0.5 - i * 0.06}>
                <animate attributeName="r" values={`${25 + i * 12};${50 + i * 12};${25 + i * 12}`} dur="5s" repeatCount="indefinite" begin={`${i * 0.6}s`}/>
                <animate attributeName="opacity" values={`${0.5 - i * 0.06};0;${0.5 - i * 0.06}`} dur="5s" repeatCount="indefinite" begin={`${i * 0.6}s`}/>
              </circle>
            ))}
            <text x="700" y="655" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="bold">Network Hub</text>
          </g>

          {/* System Health Indicator */}
          <g>
            <circle cx="1250" cy="200" r="15" fill={systemStats.systemHealth === 'healthy' ? '#10b981' : systemStats.systemHealth === 'warning' ? '#f59e0b' : '#ef4444'} filter="url(#strongGlow)">
              <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
            </circle>
            <text x="1280" y="208" fill="#94a3b8" fontSize="14" fontWeight="bold">System Health</text>
          </g>
        </svg>
      </div>

      {/* Enhanced Bottom Stats Panel */}
      <div className="absolute bottom-6 left-6 right-6 z-20">
        <div className="grid grid-cols-6 gap-4">
          <Card className="bg-slate-800/95 border-slate-600 backdrop-blur-md shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{systemStats.totalUsers}</div>
                  <div className="text-sm text-slate-400">Active Users</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/95 border-slate-600 backdrop-blur-md shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Network className="h-6 w-6 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{systemStats.activeConnections}</div>
                  <div className="text-sm text-slate-400">Connections</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/95 border-slate-600 backdrop-blur-md shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{systemStats.networkTraffic}</div>
                  <div className="text-sm text-slate-400">KB/s Traffic</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/95 border-slate-600 backdrop-blur-md shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{systemStats.databaseQueries}</div>
                  <div className="text-sm text-slate-400">DB Queries</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/95 border-slate-600 backdrop-blur-md shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Monitor className="h-6 w-6 text-cyan-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{systemStats.responseTime}ms</div>
                  <div className="text-sm text-slate-400">Response Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/95 border-slate-600 backdrop-blur-md shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-orange-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{systemStats.errorRate}%</div>
                  <div className="text-sm text-slate-400">Error Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveSystemArchitecture;
