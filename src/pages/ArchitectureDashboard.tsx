
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useArchitectureTracking } from '@/hooks/useArchitectureTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserFlowVisualization from '@/components/Architecture/UserFlowVisualization';
import SystemArchitectureMap from '@/components/Architecture/SystemArchitectureMap';
import RealTimeActivityDashboard from '@/components/Architecture/RealTimeActivityDashboard';
import UserLevelIndicators from '@/components/Architecture/UserLevelIndicators';
import ArchitectureMetrics from '@/components/Architecture/ArchitectureMetrics';
import SystemDiagram from '@/components/Architecture/SystemDiagram';
import RealTimeStats from '@/components/Architecture/RealTimeStats';
import NetworkTrafficVisualization from '@/components/Architecture/NetworkTrafficVisualization';
import InteractiveSystemDiagram from '@/components/Architecture/InteractiveSystemDiagram';
import RealTimeUserActivity from '@/components/Architecture/RealTimeUserActivity';
import { Activity, Users, Map, BarChart3, TrendingUp, Network, Zap } from 'lucide-react';

const ArchitectureDashboard = () => {
  const { user, loading } = useAuth();
  const { trackAction } = useArchitectureTracking();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (user && user.email === 'architecture@hawk.com') {
      setIsAuthorized(true);
      // Track that architecture dashboard was accessed
      trackAction('dashboard_access', {
        dashboard: 'architecture',
        timestamp: new Date().toISOString()
      });
    }
  }, [user, trackAction]);

  // Track tab changes
  const handleTabChange = (tabValue: string) => {
    trackAction('tab_change', {
      tab: tabValue,
      dashboard: 'architecture',
      timestamp: new Date().toISOString()
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading Architecture Dashboard...</p>
        </div>
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
            <CardTitle className="text-destructive flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">Only <code>architecture@hawk.com</code> can access this dashboard.</p>
            <p className="text-sm text-muted-foreground">Current user: <code>{user.email}</code></p>
            <p className="text-xs text-muted-foreground mt-4">This dashboard contains sensitive system architecture information.</p>
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
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary animate-pulse" />
              HAWK Architecture Dashboard
            </h1>
            <p className="text-muted-foreground">Real-time system architecture and user flow visualization</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live Data Active
              </Badge>
              <Badge variant="outline" className="text-xs">
                Last Updated: {new Date().toLocaleTimeString()}
              </Badge>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Architecture Team Access
          </Badge>
        </div>

        {/* Real-time Stats Overview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Real-time System Metrics
          </h2>
          <RealTimeStats />
        </div>

        <Tabs defaultValue="interactive" className="space-y-6" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="interactive" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Live System
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Metrics
            </TabsTrigger>
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
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Network
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Levels
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interactive" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <InteractiveSystemDiagram />
              <RealTimeUserActivity />
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <ArchitectureMetrics />
            <SystemDiagram />
          </TabsContent>

          <TabsContent value="flow" className="space-y-6">
            <UserFlowVisualization />
          </TabsContent>

          <TabsContent value="architecture" className="space-y-6">
            <SystemArchitectureMap />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <RealTimeActivityDashboard />
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <NetworkTrafficVisualization />
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
