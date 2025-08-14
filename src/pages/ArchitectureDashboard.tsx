
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserFlowVisualization from '@/components/Architecture/UserFlowVisualization';
import SystemArchitectureMap from '@/components/Architecture/SystemArchitectureMap';
import RealTimeActivityDashboard from '@/components/Architecture/RealTimeActivityDashboard';
import UserLevelIndicators from '@/components/Architecture/UserLevelIndicators';
import { Activity, Users, Map, BarChart3 } from 'lucide-react';

const ArchitectureDashboard = () => {
  const { user, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (user && user.email === 'architecture@hawk.com') {
      setIsAuthorized(true);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Only architecture@hawk.com can access this dashboard.</p>
            <p className="text-sm text-muted-foreground mt-2">Current user: {user.email}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">HAWK Architecture Dashboard</h1>
            <p className="text-muted-foreground">Real-time system architecture and user flow visualization</p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            Architecture Team Access
          </Badge>
        </div>

        <Tabs defaultValue="flow" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="flow" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              User Flow
            </TabsTrigger>
            <TabsTrigger value="architecture" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              System Map
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Live Activity
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Levels
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flow" className="space-y-6">
            <UserFlowVisualization />
          </TabsContent>

          <TabsContent value="architecture" className="space-y-6">
            <SystemArchitectureMap />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <RealTimeActivityDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserLevelIndicators />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArchitectureDashboard;
