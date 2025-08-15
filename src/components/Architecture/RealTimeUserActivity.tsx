
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Users, Activity, Clock, MapPin, Eye } from 'lucide-react';

interface UserActivity {
  id: string;
  user_id: string;
  session_id: string;
  current_page: string;
  action_type: string;
  created_at: string;
  user_role: string;
  metadata: any;
}

const RealTimeUserActivity = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeNow: 0,
    actionsPerMinute: 0,
    topPage: ''
  });

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 1500);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      // Get recent sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('architecture_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (sessionError) throw sessionError;

      // Get flow data for user roles
      const { data: flowData, error: flowError } = await supabase
        .from('user_flow_tracking')
        .select('user_id, user_role')
        .eq('status', 'active');

      if (flowError) throw flowError;

      // Combine data
      const combined = (sessionData || []).map(session => {
        const userFlow = flowData?.find(flow => flow.user_id === session.user_id);
        return {
          ...session,
          user_role: userFlow?.user_role || 'user'
        };
      });

      setActivities(combined);
      calculateStats(combined);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const calculateStats = (data: UserActivity[]) => {
    const uniqueUsers = new Set(data.map(a => a.user_id)).size;
    const recentActivities = data.filter(a => 
      new Date(a.created_at).getTime() > Date.now() - 60000
    );
    
    const pageCount = data.reduce((acc, activity) => {
      acc[activity.current_page] = (acc[activity.current_page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topPage = Object.entries(pageCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    setStats({
      totalUsers: uniqueUsers,
      activeNow: recentActivities.length,
      actionsPerMinute: recentActivities.length,
      topPage
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'architecture': return 'bg-purple-100 text-purple-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'navigation': return <MapPin className="h-3 w-3" />;
      case 'scan': return <Activity className="h-3 w-3" />;
      case 'login': return <Users className="h-3 w-3" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stats Cards */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeNow}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actions/Min</p>
                <p className="text-2xl font-bold text-purple-600">{stats.actionsPerMinute}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Top Page</p>
              <p className="text-sm font-bold text-orange-600 truncate">{stats.topPage || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500 animate-pulse" />
            Live User Activity Stream
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-2">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-background border rounded">
                      {getActionIcon(activity.action_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{activity.action_type}</span>
                        <Badge variant="outline" className="text-xs">
                          {activity.current_page}
                        </Badge>
                        <Badge className={`text-xs ${getRoleColor(activity.user_role)}`}>
                          {activity.user_role}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        User: {activity.user_id.slice(0, 8)}... • Session: {activity.session_id.slice(0, 6)}...
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.created_at)}
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No user activity detected</p>
                  <p className="text-xs">Activity will appear here in real-time</p>
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
