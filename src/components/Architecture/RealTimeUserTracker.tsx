
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Activity, Clock, MapPin, Eye, Monitor, 
  Zap, Globe, Smartphone, Laptop, Shield, Database
} from 'lucide-react';

interface UserSession {
  id: string;
  user_id: string;
  session_id: string;
  current_page: string;
  action_type: string;
  created_at: string;
  user_agent: string | null;
  ip_address: string | null;
  user_role: string;
  metadata: any;
}

interface UserFlow {
  id: string;
  user_id: string;
  session_id: string;
  flow_path: string[];
  current_level: number;
  user_role: string;
  status: string;
  last_activity: string;
}

interface ActivityStats {
  totalActiveUsers: number;
  uniqueSessions: number;
  actionsPerMinute: number;
  averageSessionDuration: number;
  topPages: Array<{ page: string; count: number }>;
  userRoleDistribution: Record<string, number>;
  deviceTypes: Record<string, number>;
  recentActions: UserSession[];
}

const RealTimeUserTracker = () => {
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    totalActiveUsers: 0,
    uniqueSessions: 0,
    actionsPerMinute: 0,
    averageSessionDuration: 0,
    topPages: [],
    userRoleDistribution: {},
    deviceTypes: {},
    recentActions: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserActivity();
    const interval = setInterval(fetchUserActivity, 1500); // Update every 1.5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUserActivity = async () => {
    try {
      console.log('Fetching real-time user activity...');

      // Get recent sessions (last 10 minutes)
      const { data: sessionData, error: sessionError } = await supabase
        .from('architecture_sessions')
        .select('*')
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (sessionError) {
        console.error('Session fetch error:', sessionError);
        return;
      }

      // Get active user flows
      const { data: flowData, error: flowError } = await supabase
        .from('user_flow_tracking')
        .select('*')
        .eq('status', 'active')
        .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('last_activity', { ascending: false });

      if (flowError) {
        console.error('Flow fetch error:', flowError);
      }

      const sessions = sessionData || [];
      const flows = flowData || [];

      console.log(`Processing ${sessions.length} sessions and ${flows.length} flows`);

      // Enhance sessions with user roles from flows
      const enhancedSessions = sessions.map(session => {
        const userFlow = flows.find(flow => flow.user_id === session.user_id);
        return {
          ...session,
          user_role: userFlow?.user_role || getUserRoleFromUserId(session.user_id) || 'user'
        };
      });

      // Calculate comprehensive stats
      const stats = calculateActivityStats(enhancedSessions, flows);
      setActivityStats(stats);
      setIsLoading(false);

    } catch (error) {
      console.error('Error fetching user activity:', error);
      setIsLoading(false);
    }
  };

  const getUserRoleFromUserId = (userId: string) => {
    // Fallback role detection based on user ID patterns
    if (userId.includes('architecture')) return 'architecture';
    if (userId.includes('admin')) return 'admin';
    if (userId.includes('premium')) return 'premium';
    return 'user';
  };

  const calculateActivityStats = (sessions: UserSession[], flows: UserFlow[]): ActivityStats => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const fiveMinutesAgo = now - 300000;

    // Calculate unique active users (last 5 minutes)
    const recentSessions = sessions.filter(s => 
      new Date(s.created_at).getTime() > fiveMinutesAgo
    );
    const totalActiveUsers = new Set(recentSessions.map(s => s.user_id)).size;

    // Calculate unique sessions
    const uniqueSessions = new Set(sessions.map(s => s.session_id)).size;

    // Calculate actions per minute
    const actionsLastMinute = sessions.filter(s => 
      new Date(s.created_at).getTime() > oneMinuteAgo
    ).length;

    // Calculate top pages
    const pageCount = sessions.reduce((acc, session) => {
      acc[session.current_page] = (acc[session.current_page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPages = Object.entries(pageCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([page, count]) => ({ page, count }));

    // Calculate user role distribution
    const userRoleDistribution = recentSessions.reduce((acc, session) => {
      acc[session.user_role] = (acc[session.user_role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate device types from user agent
    const deviceTypes = sessions.reduce((acc, session) => {
      const deviceType = getDeviceType(session.user_agent);
      acc[deviceType] = (acc[deviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average session duration
    const sessionDurations = flows.map(flow => {
      const lastActivity = new Date(flow.last_activity).getTime();
      const timeDiff = now - lastActivity;
      return Math.min(timeDiff / 1000 / 60, 30); // Cap at 30 minutes
    });
    const averageSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length 
      : 0;

    return {
      totalActiveUsers,
      uniqueSessions,
      actionsPerMinute: actionsLastMinute,
      averageSessionDuration: Math.round(averageSessionDuration),
      topPages,
      userRoleDistribution,
      deviceTypes,
      recentActions: sessions.slice(0, 50) // Latest 50 actions
    };
  };

  const getDeviceType = (userAgent: string | null): string => {
    if (!userAgent) return 'Unknown';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) return 'Mobile';
    if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
    if (ua.includes('desktop') || ua.includes('windows') || ua.includes('macintosh')) return 'Desktop';
    return 'Browser';
  };

  const getBrowserInfo = (userAgent: string | null): string => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'premium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'architecture': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'navigation': return <MapPin className="h-3 w-3" />;
      case 'scan': return <Shield className="h-3 w-3" />;
      case 'login': return <Users className="h-3 w-3" />;
      case 'monitor': return <Monitor className="h-3 w-3" />;
      case 'api_call': return <Zap className="h-3 w-3" />;
      case 'dashboard_access': return <Activity className="h-3 w-3" />;
      case 'tab_change': return <Eye className="h-3 w-3" />;
      default: return <Globe className="h-3 w-3" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    if (diff < 1000) return 'just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'Mobile': return <Smartphone className="h-4 w-4" />;
      case 'Tablet': return <Smartphone className="h-4 w-4" />;
      case 'Desktop': return <Laptop className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold text-blue-600">{activityStats.totalActiveUsers}</p>
                <p className="text-xs text-muted-foreground">Last 5 minutes</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-3xl font-bold text-green-600">{activityStats.uniqueSessions}</p>
                <p className="text-xs text-muted-foreground">Unique sessions</p>
              </div>
              <Activity className="h-8 w-8 text-green-600 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actions/Min</p>
                <p className="text-3xl font-bold text-purple-600">{activityStats.actionsPerMinute}</p>
                <p className="text-xs text-muted-foreground">Real-time rate</p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Session</p>
                <p className="text-3xl font-bold text-orange-600">{activityStats.averageSessionDuration}m</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activityStats.topPages.map(({ page, count }, index) => (
                <div key={page} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium bg-primary text-primary-foreground rounded px-2 py-1">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium truncate">{page}</span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              {activityStats.topPages.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">No page data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              User Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(activityStats.userRoleDistribution).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleColor(role)} variant="outline">
                      {role}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium">{count} users</span>
                </div>
              ))}
              {Object.keys(activityStats.userRoleDistribution).length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">No role data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-purple-500" />
              Device Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(activityStats.deviceTypes).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(device)}
                    <span className="text-sm font-medium">{device}</span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
              {Object.keys(activityStats.deviceTypes).length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">No device data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500 animate-pulse" />
            Live Activity Stream
            <Badge variant="outline" className="ml-2">
              {activityStats.recentActions.length} Recent Actions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {activityStats.recentActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-background border rounded-md text-primary">
                      {getActionIcon(action.action_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium capitalize">{action.action_type}</span>
                        <Badge variant="outline" className="text-xs truncate max-w-32">
                          {action.current_page}
                        </Badge>
                        <Badge className={`text-xs ${getRoleColor(action.user_role)}`}>
                          {action.user_role}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <span>User: {action.user_id.slice(0, 8)}...</span>
                        <span>•</span>
                        <span>Session: {action.session_id.slice(0, 6)}...</span>
                        {action.user_agent && (
                          <>
                            <span>•</span>
                            <span>{getBrowserInfo(action.user_agent)}</span>
                          </>
                        )}
                        {action.ip_address && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{action.ip_address}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {formatTimeAgo(action.created_at)}
                  </div>
                </div>
              ))}
              {activityStats.recentActions.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <Activity className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No Recent Activity</p>
                  <p className="text-sm">User activities will appear here in real-time</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeUserTracker;
