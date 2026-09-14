
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Activity, Clock, User, MapPin, TrendingUp, Zap } from 'lucide-react';

interface SessionData {
  id: string;
  user_id: string;
  session_id: string;
  current_page: string;
  previous_page: string | null;
  action_type: string;
  metadata: any;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
}

const RealTimeActivityDashboard = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalSessions: 0,
    topPages: [] as { page: string; count: number }[],
    recentActions: [] as string[],
    actionsPerMinute: 0
  });

  useEffect(() => {
    if (!user) return;
    
    fetchActivityData();
    const interval = setInterval(fetchActivityData, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchActivityData = async () => {
    if (!user) return;

    try {
      console.log('Fetching activity dashboard data...');

      const { data, error } = await supabase
        .from('architecture_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('Error fetching activity data:', error);
        setLoading(false);
        return;
      }
      
      // Transform the data to match our interface
      const transformedData: SessionData[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        session_id: item.session_id,
        current_page: item.current_page,
        previous_page: item.previous_page,
        action_type: item.action_type,
        metadata: item.metadata,
        user_agent: item.user_agent,
        ip_address: item.ip_address ? String(item.ip_address) : null,
        created_at: item.created_at
      }));
      
      console.log(`Fetched ${transformedData.length} activity records`);
      setSessions(transformedData);
      calculateStats(transformedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching activity data:', error);
      setLoading(false);
    }
  };

  const calculateStats = (data: SessionData[]) => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const fiveMinutesAgo = now - 300000;

    // Calculate unique users (active in last 5 minutes)
    const recentSessions = data.filter(s => 
      new Date(s.created_at).getTime() > fiveMinutesAgo
    );
    const uniqueUsers = new Set(recentSessions.map(s => s.user_id)).size;
    
    // Calculate total unique sessions
    const totalSessions = new Set(data.map(s => s.session_id)).size;
    
    // Calculate page popularity
    const pageCount = data.reduce((acc, session) => {
      acc[session.current_page] = (acc[session.current_page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topPages = Object.entries(pageCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([page, count]) => ({ page, count }));

    // Calculate recent actions
    const recentActions = data
      .slice(0, 10)
      .map(s => s.action_type);

    // Calculate actions per minute
    const actionsLastMinute = data.filter(s => 
      new Date(s.created_at).getTime() > oneMinuteAgo
    ).length;

    setStats({
      activeUsers: uniqueUsers,
      totalSessions,
      topPages,
      recentActions,
      actionsPerMinute: actionsLastMinute
    });

    console.log('Activity stats calculated:', { uniqueUsers, totalSessions, actionsLastMinute });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login': return 'text-green-500';
      case 'logout': return 'text-red-500';
      case 'scan': return 'text-blue-500';
      case 'alert': return 'text-orange-500';
      case 'navigation': return 'text-purple-500';
      case 'dashboard_access': return 'text-cyan-500';
      default: return 'text-gray-500';
    }
  };

  const getBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    if (diff < 1000) return 'just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
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
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Last 5 minutes</p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Unique sessions</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actions/Min</p>
                <p className="text-3xl font-bold text-purple-600">{stats.actionsPerMinute}</p>
                <p className="text-xs text-muted-foreground">Current rate</p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Page</p>
                <p className="text-sm font-bold text-orange-600 truncate">
                  {stats.topPages[0]?.page || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.topPages[0]?.count || 0} visits
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed and Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500 animate-pulse" />
              Recent User Activities
              <Badge variant="outline" className="ml-2">
                {sessions.length} Records
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-3">
            {sessions.length > 0 ? sessions.slice(0, 20).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Activity className={`h-4 w-4 ${getActionColor(session.action_type)}`} />
                    <span className="text-sm font-medium capitalize">{session.action_type}</span>
                    <Badge variant="outline" className="text-xs">
                      {session.current_page}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>User: {session.user_id.slice(0, 8)}...</span>
                    <span>•</span>
                    <span>{getBrowserInfo(session.user_agent)}</span>
                    {session.ip_address && (
                      <>
                        <span>•</span>
                        <span>{session.ip_address}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeAgo(session.created_at)}
                </div>
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-8">
                <Activity className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No Activity Data</p>
                <p className="text-sm">Activity data will appear here as users interact with the system</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Popular Pages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' :
                    'bg-blue-500'
                  }`}></div>
                  <span className="text-sm font-medium">{page.page}</span>
                </div>
                <Badge variant="secondary">{page.count} visits</Badge>
              </div>
            ))}
            {stats.topPages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <MapPin className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No Page Data</p>
                <p className="text-sm">Page statistics will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealTimeActivityDashboard;
