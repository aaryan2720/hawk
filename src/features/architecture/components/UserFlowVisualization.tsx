
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Circle } from 'lucide-react';

interface FlowData {
  id: string;
  user_id: string;
  session_id: string;
  flow_path: string[];
  current_level: number;
  user_role: string;
  status: string;
  last_activity: string;
}

const UserFlowVisualization = () => {
  const [flowData, setFlowData] = useState<FlowData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlowData();
    const interval = setInterval(fetchFlowData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchFlowData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_flow_tracking')
        .select('*')
        .eq('status', 'active')
        .order('last_activity', { ascending: false })
        .limit(50);

      if (error) throw error;
      setFlowData(data || []);
    } catch (error) {
      console.error('Error fetching flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-500';
      case 'premium': return 'text-blue-500';
      case 'architecture': return 'text-purple-500';
      default: return 'text-green-500';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'premium': return 'default';
      case 'architecture': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Flow Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Circle className="h-5 w-5 text-green-500 animate-pulse" />
            Live User Flows ({flowData.length} active)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {flowData.map((flow) => (
            <div key={flow.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={getRoleBadgeVariant(flow.user_role)}>
                  {flow.user_role}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Level {flow.current_level}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Circle className={`h-3 w-3 ${getRoleColor(flow.user_role)}`} />
                <span className="font-medium">User: {flow.user_id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                {flow.flow_path.map((page, index) => (
                  <React.Fragment key={index}>
                    <span className="bg-secondary px-2 py-1 rounded">{page}</span>
                    {index < flow.flow_path.length - 1 && <ArrowRight className="h-3 w-3" />}
                  </React.Fragment>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Last seen: {new Date(flow.last_activity).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {flowData.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No active user flows detected
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flow Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-green-500">
                {flowData.filter(f => f.user_role === 'user').length}
              </div>
              <div className="text-sm text-muted-foreground">Regular Users</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-blue-500">
                {flowData.filter(f => f.user_role === 'premium').length}
              </div>
              <div className="text-sm text-muted-foreground">Premium Users</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-red-500">
                {flowData.filter(f => f.user_role === 'admin').length}
              </div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-purple-500">
                {flowData.filter(f => f.user_role === 'architecture').length}
              </div>
              <div className="text-sm text-muted-foreground">Architecture</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserFlowVisualization;
