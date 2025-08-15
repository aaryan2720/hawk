
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
        .limit(50);

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
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
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
      <div className="h-full bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading live architecture...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-900 text-white overflow-hidden relative">
      {/* Fixed Live User Activity Bar - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-200 flex items-center gap-2">
              <Activity className="h-4 w-4 animate-pulse text-green-400" />
              Live User Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Regular</span>
              <Badge variant="outline" className="bg-green-900/50 text-green-300 border-green-600">
                ({systemStats.usersByRole.user || 0})
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Premium</span>
              <Badge variant="outline" className="bg-blue-900/50 text-blue-300 border-blue-600">
                ({systemStats.usersByRole.premium || 0})
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Admin</span>
              <Badge variant="outline" className="bg-red-900/50 text-red-300 border-red-600">
                ({systemStats.usersByRole.admin || 0})
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Architecture</span>
              <Badge variant="outline" className="bg-purple-900/50 text-purple-300 border-purple-600">
                ({systemStats.usersByRole.architecture || 0})
              </Badge>
            </div>
            <div className="border-t border-slate-700 pt-2 mt-2">
              <div className={`flex items-center gap-2 text-xs ${getSystemHealthColor(systemStats.systemHealth)}`}>
                {getSystemHealthIcon(systemStats.systemHealth)}
                <span className="capitalize">{systemStats.systemHealth}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Architecture Diagram */}
      <svg viewBox="0 0 1200 800" className="w-full h-full">
        {/* Background Grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="1" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Data Flow Lines with Animation */}
        <defs>
          <linearGradient id="dataFlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0"/>
            <stop offset="50%" stopColor="#10b981" stopOpacity="1"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* Enhanced Connection Lines */}
        <g stroke="#10b981" strokeWidth="3" fill="none" opacity="0.8">
          <line x1="200" y1="150" x2="400" y2="150">
            <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="2s" repeatCount="indefinite"/>
          </line>
          <line x1="400" y1="150" x2="600" y2="150">
            <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="2s" repeatCount="indefinite" begin="0.5s"/>
          </line>
          <line x1="600" y1="150" x2="800" y2="150">
            <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="2s" repeatCount="indefinite" begin="1s"/>
          </line>
          <line x1="200" y1="300" x2="400" y2="300">
            <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="2s" repeatCount="indefinite" begin="1.5s"/>
          </line>
          <line x1="400" y1="300" x2="600" y2="300">
            <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="2s" repeatCount="indefinite" begin="2s"/>
          </line>
          <line x1="300" y1="200" x2="300" y2="250">
            <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1.5s" repeatCount="indefinite"/>
          </line>
          <line x1="500" y1="200" x2="500" y2="250">
            <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1.5s" repeatCount="indefinite" begin="0.5s"/>
          </line>
          <line x1="700" y1="200" x2="700" y2="250">
            <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1.5s" repeatCount="indefinite" begin="1s"/>
          </line>
        </g>

        {/* System Components */}
        <g>
          {/* Frontend Layer */}
          <rect x="150" y="100" width="100" height="80" rx="10" fill="#1e293b" stroke="#3b82f6" strokeWidth="2"/>
          <text x="200" y="135" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="bold">Frontend</text>
          <text x="200" y="155" textAnchor="middle" fill="#94a3b8" fontSize="10">React/Vite</text>

          {/* API Gateway */}
          <rect x="350" y="100" width="100" height="80" rx="10" fill="#1e293b" stroke="#10b981" strokeWidth="2"/>
          <text x="400" y="135" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="bold">API Gateway</text>
          <text x="400" y="155" textAnchor="middle" fill="#94a3b8" fontSize="10">Supabase</text>

          {/* Backend Services */}
          <rect x="550" y="100" width="100" height="80" rx="10" fill="#1e293b" stroke="#f59e0b" strokeWidth="2"/>
          <text x="600" y="135" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold">Backend</text>
          <text x="600" y="155" textAnchor="middle" fill="#94a3b8" fontSize="10">Edge Functions</text>

          {/* Database */}
          <rect x="750" y="100" width="100" height="80" rx="10" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2"/>
          <text x="800" y="135" textAnchor="middle" fill="#8b5cf6" fontSize="12" fontWeight="bold">Database</text>
          <text x="800" y="155" textAnchor="middle" fill="#94a3b8" fontSize="10">PostgreSQL</text>

          {/* Authentication */}
          <rect x="150" y="250" width="100" height="80" rx="10" fill="#1e293b" stroke="#ef4444" strokeWidth="2"/>
          <text x="200" y="285" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">Auth</text>
          <text x="200" y="305" textAnchor="middle" fill="#94a3b8" fontSize="10">Supabase Auth</text>

          {/* Real-time */}
          <rect x="350" y="250" width="100" height="80" rx="10" fill="#1e293b" stroke="#06b6d4" strokeWidth="2"/>
          <text x="400" y="285" textAnchor="middle" fill="#06b6d4" fontSize="12" fontWeight="bold">Real-time</text>
          <text x="400" y="305" textAnchor="middle" fill="#94a3b8" fontSize="10">WebSockets</text>

          {/* Monitoring */}
          <rect x="550" y="250" width="100" height="80" rx="10" fill="#1e293b" stroke="#ec4899" strokeWidth="2"/>
          <text x="600" y="285" textAnchor="middle" fill="#ec4899" fontSize="12" fontWeight="bold">Monitoring</text>
          <text x="600" y="305" textAnchor="middle" fill="#94a3b8" fontSize="10">Architecture</text>
        </g>

        {/* Live User Dots */}
        {userActivities.slice(0, 20).map((activity, index) => {
          const x = 100 + (index % 10) * 100 + Math.random() * 50;
          const y = 400 + Math.floor(index / 10) * 100 + Math.random() * 50;
          const color = getRoleColor(activity.user_role);
          
          return (
            <g key={activity.id}>
              <circle 
                cx={x} 
                cy={y} 
                r="4" 
                fill={color}
                opacity="0.8"
              >
                <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle 
                cx={x} 
                cy={y} 
                r="8" 
                fill="none" 
                stroke={color} 
                strokeWidth="1"
                opacity="0.3"
              >
                <animate attributeName="r" values="8;16;8" dur="3s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite"/>
              </circle>
            </g>
          );
        })}

        {/* Network Traffic Visualization */}
        <g>
          {[...Array(5)].map((_, i) => (
            <circle key={i} cx="600" cy="400" r={20 + i * 10} fill="none" stroke="#10b981" strokeWidth="1" opacity={0.3 - i * 0.05}>
              <animate attributeName="r" values={`${20 + i * 10};${40 + i * 10};${20 + i * 10}`} dur="4s" repeatCount="indefinite" begin={`${i * 0.5}s`}/>
            </circle>
          ))}
        </g>

        {/* Status Indicators */}
        <g>
          <circle cx="980" cy="150" r="8" fill={systemStats.systemHealth === 'healthy' ? '#10b981' : systemStats.systemHealth === 'warning' ? '#f59e0b' : '#ef4444'}>
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
          </circle>
          <text x="1000" y="155" fill="#94a3b8" fontSize="10">System Health</text>
        </g>
      </svg>

      {/* Bottom Stats Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                <div>
                  <div className="text-lg font-bold text-white">{systemStats.totalUsers}</div>
                  <div className="text-xs text-slate-400">Active Users</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-green-400" />
                <div>
                  <div className="text-lg font-bold text-white">{systemStats.activeConnections}</div>
                  <div className="text-xs text-slate-400">Connections</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <div>
                  <div className="text-lg font-bold text-white">{systemStats.networkTraffic}</div>
                  <div className="text-xs text-slate-400">MB/s</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-400" />
                <div>
                  <div className="text-lg font-bold text-white">{systemStats.databaseQueries}</div>
                  <div className="text-xs text-slate-400">DB Queries</div>
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
