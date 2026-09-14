
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Users, Activity, Clock, MapPin, Eye, Monitor, Zap } from 'lucide-react';

interface UserActivity {
  id: string;
  user_id: string;
  session_id: string;
  current_page: string;
  action_type: string;
  created_at: string;
  user_role: string;
  metadata: any;
  user_agent: string | null;
  ip_address: string | null;
}

interface RealTimeStats {
  totalUsers: number;
  activeNow: number;
  actionsPerMinute: number;
  topPage: string;
  uniqueSessions: number;
  avgSessionTime: number;
}

const RealTimeUserActivity = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [stats, setStats] = useState<RealTimeStats>({
    totalUsers: 0,
    activeNow: 0,
    actionsPerMinute: 0,
    topPage: '',
    uniqueSessions: 0,
    avgSessionTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 1500);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      console.log('Fetching real-time user activities...');

      // Get recent architecture sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('architecture_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (sessionError) {
        console.error('Session fetch error:', sessionError);
        return;
      }

      // Get active user flows for role information
      const { data: flowData, error: flowError } = await supabase
        .from('user_flow_tracking')
        .select('user_id, user_role, last_activity, session_id')
        .eq('status', 'active')
        .gte('last_activity', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // Active in last 10 minutes

      if (flowError) {
        console.error('Flow fetch error:', flowError);
      }

      console.log(`Fetched ${sessionData?.length || 0} sessions and ${flowData?.length || 0} flows`);

      // Combine session data with user roles
      const combinedActivities = (sessionData || []).map(session => {
        const userFlow = flowData?.find(flow => flow.user_id === session.user_id);
        return {
          ...session,
          user_role: userFlow?.user_role || getUserRoleFromEmail(session.user_id) || 'user',
          ip_address: session.ip_address ? String(session.ip_address) : null
        };
      });

      setActivities(combinedActivities);
      calculateStats(combinedActivities, flowData || []);
      setIsLoading(false);

    } catch (error) {
      console.error('Error fetching activities:', error);
      setIsLoading(false);
    }
  };

  const getUserRoleFromEmail = (userId: string) => {
    // This is a fallback - in real implementation, you'd fetch from profiles table
    if (userId.includes('architecture')) return 'architecture';
    if (userId.includes('admin')) return 'admin';
    return 'user';
  };

  const calculateStats = (activities: UserActivity[], flows: any[]) => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const fiveMinutesAgo = now - 300000;

    // Calculate unique users
    const uniqueUsers = new Set(activities.map(a => a.user_id)).size;
    
    // Calculate active users (activity in last 5 minutes)
    const recentActivities = activities.filter(a => 
      new Date(a.created_at).getTime() > fiveMinutesAgo
    );
    const activeNow = new Set(recentActivities.map(a => a.user_id)).size;
    
    // Calculate actions per minute (last minute)
    const actionsLastMinute = activities.filter(a => 
      new Date(a.created_at).getTime() > oneMinuteAgo
    ).length;
    
    // Calculate top page
    const pageCount = activities.reduce((acc, activity) => {
      acc[activity.current_page] = (acc[activity.current_page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topPage = Object.entries(pageCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    // Calculate unique sessions
    const uniqueSessions = new Set(activities.map(a => a.session_id)).size;

    // Calculate average session time (simplified)
    const sessionTimes = flows.map(flow => {
      const lastActivity = new Date(flow.last_activity).getTime();
      const timeDiff = now - lastActivity;
      return Math.min(timeDiff / 1000 / 60, 60); // Cap at 60 minutes
    });
    const avgSessionTime = sessionTimes.length > 0 
      ? sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length 
      : 0;

    setStats({
      totalUsers: uniqueUsers,
      activeNow,
      actionsPerMinute: actionsLastMinute,
      topPage,
      uniqueSessions,
      avgSessionTime: Math.round(avgSessionTime)
    });

    console.log('Calculated stats:', { uniqueUsers, activeNow, actionsLastMinute, topPage, uniqueSessions });
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
      case 'scan': return <Activity className="h-3 w-3" />;
      case 'login': return <Users className="h-3 w-3" />;
      case 'monitor': return <Monitor className="h-3 w-3" />;
      case 'api_call': return <Zap className="h-3 w-3" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'navigation': return 'text-blue-600';
      case 'scan': return 'text-orange-600';
      case 'login': return 'text-green-600';
      case 'logout': return 'text-red-600';
      case 'api_call': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    if (diff < 1000) return 'just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const getBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {[...Array(4)].map((_, i) => (
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
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Enhanced Stats Cards */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">All time activity</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeNow}</p>
                <p className="text-xs text-muted-foreground">Last 5 minutes</p>
              </div>
              <Activity className="h-8 w-8 text-green-600 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actions/Min</p>
                <p className="text-2xl font-bold text-purple-600">{stats.actionsPerMinute}</p>
                <p className="text-xs text-muted-foreground">Real-time rate</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Top Page</p>
              <p className="text-sm font-bold text-orange-600 truncate">{stats.topPage || 'N/A'}</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Sessions:</span>
                  <span className="font-medium">{stats.uniqueSessions}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Avg Time:</span>
                  <span className="font-medium">{stats.avgSessionTime}m</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Activity Feed */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500 animate-pulse" />
            Live User Activity Stream
            <Badge variant="outline" className="ml-2">
              {activities.length} Records
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {activities.length > 0 ? activities.slice(0, 50).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200 group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 bg-background border rounded-md ${getActionColor(activity.action_type)}`}>
                      {getActionIcon(activity.action_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium capitalize">{activity.action_type}</span>
                        <Badge variant="outline" className="text-xs truncate max-w-32">
                          {activity.current_page}
                        </Badge>
                        <Badge className={`text-xs ${getRoleColor(activity.user_role)}`}>
                          {activity.user_role}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <span>User: {activity.user_id.slice(0, 8)}...</span>
                        <span>•</span>
                        <span>Session: {activity.session_id.slice(0, 6)}...</span>
                        {activity.user_agent && (
                          <>
                            <span>•</span>
                            <span>{getBrowserInfo(activity.user_agent)}</span>
                          </>
                        )}
                        {activity.ip_address && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{activity.ip_address}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {formatTimeAgo(activity.created_at)}
                  </div>
                </div>
              )) : (
                <div className="text-center text-muted-foreground py-12">
                  <Activity className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No User Activity Yet</p>
                  <p className="text-sm">Real-time user activities will appear here</p>
                  <p className="text-xs mt-2">Try navigating through the app to generate activity</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeUserActivity;
