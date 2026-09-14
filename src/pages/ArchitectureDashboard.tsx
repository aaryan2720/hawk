
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useArchitectureTracking } from '@/features/architecture/hooks/useArchitectureTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import UserFlowVisualization from '@/features/architecture/components/UserFlowVisualization';
import SystemArchitectureMap from '@/features/architecture/components/SystemArchitectureMap';
import RealTimeActivityDashboard from '@/features/architecture/components/RealTimeActivityDashboard';
import UserLevelIndicators from '@/features/architecture/components/UserLevelIndicators';
import ArchitectureMetrics from '@/features/architecture/components/ArchitectureMetrics';
import SystemDiagram from '@/features/architecture/components/SystemDiagram';
import NetworkTrafficVisualization from '@/features/architecture/components/NetworkTrafficVisualization';
import LiveSystemArchitecture from '@/features/architecture/components/LiveSystemArchitecture';
import RealTimeUserTracker from '@/features/architecture/components/RealTimeUserTracker';
import { 
  Activity, Users, Map, BarChart3, TrendingUp, Network, Zap, 
  Maximize2, Minimize2, Monitor, Shield
} from 'lucide-react';

const ArchitectureDashboard = () => {
  const { user, loading } = useAuth();
  const { trackAction } = useArchitectureTracking();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    trackAction('fullscreen_toggle', {
      fullscreen: !isFullScreen,
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

  // Full screen live architecture view
  if (isFullScreen) {
    return (
      <div className="relative">
        <Button
          onClick={toggleFullScreen}
          className="absolute top-4 right-4 z-30"
          variant="outline"
          size="sm"
        >
          <Minimize2 className="h-4 w-4 mr-2" />
          Exit Full Screen
        </Button>
        <LiveSystemArchitecture />
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
            <p className="text-muted-foreground">Real-time system architecture and user flow monitoring</p>
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
          <div className="flex items-center gap-2">
            <Button onClick={toggleFullScreen} variant="outline" size="sm">
              <Maximize2 className="h-4 w-4 mr-2" />
              Full Screen View
            </Button>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Architecture Team Access
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="live-architecture" className="space-y-6" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="live-architecture" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Live System
            </TabsTrigger>
            <TabsTrigger value="user-tracking" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Tracking
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
            <TabsTrigger value="levels" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              User Levels
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live-architecture" className="space-y-6">
            <div className="h-[600px] border rounded-lg overflow-hidden">
              <LiveSystemArchitecture />
            </div>
          </TabsContent>

          <TabsContent value="user-tracking" className="space-y-6">
            <RealTimeUserTracker />
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

          <TabsContent value="levels" className="space-y-6">
            <UserLevelIndicators />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArchitectureDashboard;
