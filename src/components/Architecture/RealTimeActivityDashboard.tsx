
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Clock, User, MapPin } from 'lucide-react';

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
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalSessions: 0,
    topPages: [] as { page: string; count: number }[],
    recentActions: [] as string[]
  });

  useEffect(() => {
    fetchActivityData();
    const interval = setInterval(fetchActivityData, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchActivityData = async () => {
    try {
      const { data, error } = await supabase
        .from('architecture_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setSessions(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: SessionData[]) => {
    const uniqueUsers = new Set(data.map(s => s.user_id)).size;
    const totalSessions = new Set(data.map(s => s.session_id)).size;
    
    const pageCount = data.reduce((acc, session) => {
      acc[session.current_page] = (acc[session.current_page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topPages = Object.entries(pageCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([page, count]) => ({ page, count }));

    const recentActions = data
      .slice(0, 10)
      .map(s => s.action_type);

    setStats({
      activeUsers: uniqueUsers,
      totalSessions,
      topPages,
      recentActions
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login': return 'text-green-500';
      case 'logout': return 'text-red-500';
      case 'scan': return 'text-blue-500';
      case 'alert': return 'text-orange-500';
      case 'navigation': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const getBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-500">{stats.activeUsers}</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold text-blue-500">{stats.totalSessions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Activities</p>
                <p className="text-2xl font-bold text-purple-500">{sessions.length}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Page</p>
                <p className="text-sm font-bold text-orange-500">
                  {stats.topPages[0]?.page || 'N/A'}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent User Activities</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-3">
            {sessions.slice(0, 20).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Activity className={`h-4 w-4 ${getActionColor(session.action_type)}`} />
                    <span className="text-sm font-medium">{session.action_type}</span>
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
                  {new Date(session.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm font-medium">{page.page}</span>
                </div>
                <Badge variant="secondary">{page.count} visits</Badge>
              </div>
            ))}
            {stats.topPages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No page data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealTimeActivityDashboard;
