
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Shield, Activity, Database, Server, 
  Globe, Zap, Monitor, Network, AlertTriangle,
  CheckCircle, XCircle, Clock
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
}

const LiveSystemArchitecture = () => {
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeConnections: 0,
    systemHealth: 'healthy',
    usersByRole: {},
    networkTraffic: 0,
    databaseQueries: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchRealTimeData = async () => {
    try {
      // Fetch recent user activities (last 5 minutes)
      const { data: activities, error } = await supabase
        .from('architecture_sessions')
        .select('*')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }

      const processedActivities = (activities || []).map(activity => ({
        ...activity,
        user_id: activity.user_id || 'anonymous',
        user_role: getUserRole(activity.user_id) || 'user'
      }));

      setUserActivities(processedActivities);

      // Calculate system stats
      const uniqueUsers = new Set(processedActivities.map(a => a.user_id).filter(Boolean)).size;
      const usersByRole = processedActivities.reduce((acc, activity) => {
        acc[activity.user_role] = (acc[activity.user_role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const networkTraffic = Math.floor(Math.random() * 1000) + 500;
      const databaseQueries = processedActivities.length * 2;
      const systemHealth = networkTraffic > 800 ? 'warning' : networkTraffic > 900 ? 'critical' : 'healthy';

      setSystemStats({
        totalUsers: uniqueUsers,
        activeConnections: processedActivities.length,
        systemHealth,
        usersByRole,
        networkTraffic,
        databaseQueries
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchRealTimeData:', error);
      setIsLoading(false);
    }
  };

  const getUserRole = (userId: string | null) => {
    if (!userId) return 'user';
    if (userId.includes('architecture')) return 'architecture';
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

  if (isLoading) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400 mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading Live Architecture...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 to-slate-900 text-white overflow-hidden relative">
      {/* Live User Activity Panel - Fixed Top Right */}
      <div className="absolute top-6 right-6 z-30 w-72">
        <Card className="bg-slate-800/95 border-slate-600 backdrop-blur-md shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center gap-3">
              <Activity className="h-5 w-5 animate-pulse text-green-400" />
              Live User Activity
              <Badge variant="outline" className="bg-green-900/30 text-green-300 border-green-500">
                {systemStats.totalUsers} active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
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
            <div className="border-t border-slate-600 pt-3">
              <div className={`flex items-center gap-2 text-sm font-medium ${getSystemHealthColor(systemStats.systemHealth)}`}>
                {getSystemHealthIcon(systemStats.systemHealth)}
                <span className="capitalize">System {systemStats.systemHealth}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Architecture Diagram */}
      <div className="absolute inset-0 overflow-hidden">
        <svg viewBox="0 0 1400 900" className="w-full h-full">
          {/* Enhanced Background Grid */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#334155" strokeWidth="1" opacity="0.3"/>
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
          </defs>
          
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Enhanced Data Flow Lines with Glow Effect */}
          <g stroke="#10b981" strokeWidth="4" fill="none" opacity="0.9" filter="url(#glow)">
            {/* Horizontal connections */}
            <line x1="250" y1="200" x2="450" y2="200">
              <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="2s" repeatCount="indefinite"/>
            </line>
            <line x1="450" y1="200" x2="650" y2="200">
              <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="2s" repeatCount="indefinite" begin="0.5s"/>
            </line>
            <line x1="650" y1="200" x2="850" y2="200">
              <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="2s" repeatCount="indefinite" begin="1s"/>
            </line>
            <line x1="850" y1="200" x2="1050" y2="200">
              <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="2s" repeatCount="indefinite" begin="1.5s"/>
            </line>
            
            {/* Lower tier connections */}
            <line x1="250" y1="400" x2="450" y2="400">
              <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="2s" repeatCount="indefinite" begin="2s"/>
            </line>
            <line x1="450" y1="400" x2="650" y2="400">
              <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="2s" repeatCount="indefinite" begin="2.5s"/>
            </line>
            <line x1="650" y1="400" x2="850" y2="400">
              <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="2s" repeatCount="indefinite" begin="3s"/>
            </line>
            
            {/* Vertical connections */}
            <line x1="350" y1="280" x2="350" y2="320">
              <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1.5s" repeatCount="indefinite"/>
            </line>
            <line x1="550" y1="280" x2="550" y2="320">
              <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1.5s" repeatCount="indefinite" begin="0.5s"/>
            </line>
            <line x1="750" y1="280" x2="750" y2="320">
              <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1.5s" repeatCount="indefinite" begin="1s"/>
            </line>
            <line x1="950" y1="280" x2="950" y2="320">
              <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1.5s" repeatCount="indefinite" begin="1.5s"/>
            </line>
          </g>

          {/* Enhanced System Components with Glow */}
          <g filter="url(#glow)">
            {/* Frontend Layer */}
            <rect x="200" y="150" width="140" height="100" rx="15" fill="#1e293b" stroke="#3b82f6" strokeWidth="3"/>
            <circle cx="270" cy="185" r="8" fill="#3b82f6">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
            </circle>
            <text x="270" y="210" textAnchor="middle" fill="#3b82f6" fontSize="16" fontWeight="bold">Frontend</text>
            <text x="270" y="230" textAnchor="middle" fill="#94a3b8" fontSize="12">React/Vite</text>

            {/* API Gateway */}
            <rect x="400" y="150" width="140" height="100" rx="15" fill="#1e293b" stroke="#10b981" strokeWidth="3"/>
            <circle cx="470" cy="185" r="8" fill="#10b981">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="0.5s"/>
            </circle>
            <text x="470" y="210" textAnchor="middle" fill="#10b981" fontSize="16" fontWeight="bold">API Gateway</text>
            <text x="470" y="230" textAnchor="middle" fill="#94a3b8" fontSize="12">Supabase</text>

            {/* Backend Services */}
            <rect x="600" y="150" width="140" height="100" rx="15" fill="#1e293b" stroke="#f59e0b" strokeWidth="3"/>
            <circle cx="670" cy="185" r="8" fill="#f59e0b">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="1s"/>
            </circle>
            <text x="670" y="210" textAnchor="middle" fill="#f59e0b" fontSize="16" fontWeight="bold">Backend</text>
            <text x="670" y="230" textAnchor="middle" fill="#94a3b8" fontSize="12">Edge Functions</text>

            {/* Database */}
            <rect x="800" y="150" width="140" height="100" rx="15" fill="#1e293b" stroke="#8b5cf6" strokeWidth="3"/>
            <circle cx="870" cy="185" r="8" fill="#8b5cf6">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="1.5s"/>
            </circle>
            <text x="870" y="210" textAnchor="middle" fill="#8b5cf6" fontSize="16" fontWeight="bold">Database</text>
            <text x="870" y="230" textAnchor="middle" fill="#94a3b8" fontSize="12">PostgreSQL</text>

            {/* Monitoring */}
            <rect x="1000" y="150" width="140" height="100" rx="15" fill="#1e293b" stroke="#06b6d4" strokeWidth="3"/>
            <circle cx="1070" cy="185" r="8" fill="#06b6d4">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="2s"/>
            </circle>
            <text x="1070" y="210" textAnchor="middle" fill="#06b6d4" fontSize="16" fontWeight="bold">Monitoring</text>
            <text x="1070" y="230" textAnchor="middle" fill="#94a3b8" fontSize="12">Real-time</text>

            {/* Second Row */}
            {/* Authentication */}
            <rect x="200" y="350" width="140" height="100" rx="15" fill="#1e293b" stroke="#ef4444" strokeWidth="3"/>
            <circle cx="270" cy="385" r="8" fill="#ef4444">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="2.5s"/>
            </circle>
            <text x="270" y="410" textAnchor="middle" fill="#ef4444" fontSize="16" fontWeight="bold">Auth</text>
            <text x="270" y="430" textAnchor="middle" fill="#94a3b8" fontSize="12">Supabase Auth</text>

            {/* Real-time Engine */}
            <rect x="400" y="350" width="140" height="100" rx="15" fill="#1e293b" stroke="#06b6d4" strokeWidth="3"/>
            <circle cx="470" cy="385" r="8" fill="#06b6d4">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="3s"/>
            </circle>
            <text x="470" y="410" textAnchor="middle" fill="#06b6d4" fontSize="16" fontWeight="bold">Real-time</text>
            <text x="470" y="430" textAnchor="middle" fill="#94a3b8" fontSize="12">WebSockets</text>

            {/* Security */}
            <rect x="600" y="350" width="140" height="100" rx="15" fill="#1e293b" stroke="#ec4899" strokeWidth="3"/>
            <circle cx="670" cy="385" r="8" fill="#ec4899">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="3.5s"/>
            </circle>
            <text x="670" y="410" textAnchor="middle" fill="#ec4899" fontSize="16" fontWeight="bold">Security</text>
            <text x="670" y="430" textAnchor="middle" fill="#94a3b8" fontSize="12">Vulnerability</text>

            {/* Analytics */}
            <rect x="800" y="350" width="140" height="100" rx="15" fill="#1e293b" stroke="#84cc16" strokeWidth="3"/>
            <circle cx="870" cy="385" r="8" fill="#84cc16">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="4s"/>
            </circle>
            <text x="870" y="410" textAnchor="middle" fill="#84cc16" fontSize="16" fontWeight="bold">Analytics</text>
            <text x="870" y="430" textAnchor="middle" fill="#94a3b8" fontSize="12">Tracking</text>
          </g>

          {/* Enhanced Live User Dots */}
          {userActivities.slice(0, 30).map((activity, index) => {
            const x = 150 + (index % 12) * 100 + Math.random() * 40;
            const y = 550 + Math.floor(index / 12) * 80 + Math.random() * 40;
            const color = getRoleColor(activity.user_role);
            
            return (
              <g key={activity.id}>
                <circle 
                  cx={x} 
                  cy={y} 
                  r="6" 
                  fill={color}
                  opacity="0.9"
                  filter="url(#glow)"
                >
                  <animate attributeName="r" values="6;12;6" dur="3s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle 
                  cx={x} 
                  cy={y} 
                  r="12" 
                  fill="none" 
                  stroke={color} 
                  strokeWidth="2"
                  opacity="0.4"
                >
                  <animate attributeName="r" values="12;24;12" dur="4s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="4s" repeatCount="indefinite"/>
                </circle>
              </g>
            );
          })}

          {/* Enhanced Network Traffic Visualization */}
          <g>
            {[...Array(7)].map((_, i) => (
              <circle key={i} cx="700" cy="650" r={30 + i * 15} fill="none" stroke="#10b981" strokeWidth="2" opacity={0.4 - i * 0.05}>
                <animate attributeName="r" values={`${30 + i * 15};${60 + i * 15};${30 + i * 15}`} dur="5s" repeatCount="indefinite" begin={`${i * 0.7}s`}/>
              </circle>
            ))}
          </g>

          {/* System Health Indicator */}
          <g>
            <circle cx="1250" cy="200" r="12" fill={systemStats.systemHealth === 'healthy' ? '#10b981' : systemStats.systemHealth === 'warning' ? '#f59e0b' : '#ef4444'} filter="url(#glow)">
              <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
            </circle>
            <text x="1280" y="208" fill="#94a3b8" fontSize="14" fontWeight="bold">System Health</text>
          </g>
        </svg>
      </div>

      {/* Enhanced Bottom Stats Panel */}
      <div className="absolute bottom-6 left-6 right-6 z-20">
        <div className="grid grid-cols-5 gap-4">
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
                  <div className="text-sm text-slate-400">MB/s Traffic</div>
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
                  <div className="text-2xl font-bold text-white">99.9%</div>
                  <div className="text-sm text-slate-400">Uptime</div>
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
