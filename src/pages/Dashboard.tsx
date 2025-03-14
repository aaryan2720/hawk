
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardNav from '@/components/DashboardNav';
import StatusOverview from '@/components/StatusOverview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, History, Database, Shield, ArrowUpRight, Scan, BarChart } from 'lucide-react';
import TrendChart from '@/components/TrendChart';
import RiskAnalyzer from '@/components/RiskAnalyzer';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your security posture and recent activity
          </p>
        </div>
        
        <div className="mb-8">
          <StatusOverview />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                Alerts Center
              </CardTitle>
              <CardDescription>Monitor and respond to security alerts</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-2xl font-semibold">12</p>
              <p className="text-sm text-muted-foreground">Active alerts requiring attention</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/alerts')}>
                <span>View Alerts</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Scan className="h-5 w-5 mr-2 text-blue-500" />
                Vulnerability Scans
              </CardTitle>
              <CardDescription>Recent system vulnerability scans</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-2xl font-semibold">8</p>
              <p className="text-sm text-muted-foreground">Scans completed in the last 7 days</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/scan-history')}>
                <span>View Scan History</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Database className="h-5 w-5 mr-2 text-purple-500" />
                System Monitoring
              </CardTitle>
              <CardDescription>OEM and component monitoring</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-2xl font-semibold">5</p>
              <p className="text-sm text-muted-foreground">Systems being actively monitored</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/system-monitor')}>
                <span>Manage Systems</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-blue-500" />
                Security Trends
              </CardTitle>
              <CardDescription>
                Vulnerability trends over the past 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-500" />
                Risk Analysis
              </CardTitle>
              <CardDescription>
                Current security risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RiskAnalyzer />
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="recent">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <TabsList>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="scans">Scans</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="recent" className="space-y-4">
            <ActivityItem 
              title="Critical Vulnerability CVE-2023-45678" 
              description="New critical vulnerability detected in system XYZ."
              time="2 hours ago"
              icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            />
            <ActivityItem 
              title="System Scan Completed" 
              description="Routine scan completed with 3 medium vulnerabilities detected."
              time="Yesterday"
              icon={<Scan className="h-5 w-5 text-blue-500" />}
            />
            <ActivityItem 
              title="OEM Update Available" 
              description="New firmware update available for Router-X."
              time="2 days ago"
              icon={<Database className="h-5 w-5 text-purple-500" />}
            />
          </TabsContent>
          
          <TabsContent value="alerts" className="space-y-4">
            <ActivityItem 
              title="Critical Vulnerability CVE-2023-45678" 
              description="New critical vulnerability detected in system XYZ."
              time="2 hours ago"
              icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            />
            <ActivityItem 
              title="Medium Severity Alert" 
              description="Unusual network activity detected on port 8080."
              time="1 day ago"
              icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            />
          </TabsContent>
          
          <TabsContent value="scans" className="space-y-4">
            <ActivityItem 
              title="System Scan Completed" 
              description="Routine scan completed with 3 medium vulnerabilities detected."
              time="Yesterday"
              icon={<Scan className="h-5 w-5 text-blue-500" />}
            />
            <ActivityItem 
              title="Manual Scan Initiated" 
              description="User initiated manual scan of Server-01."
              time="3 days ago"
              icon={<Scan className="h-5 w-5 text-blue-500" />}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Activity Item component for the dashboard
const ActivityItem = ({ 
  title, 
  description, 
  time, 
  icon 
}: { 
  title: string; 
  description: string; 
  time: string; 
  icon: React.ReactNode;
}) => {
  return (
    <div className="flex items-start p-4 rounded-lg border hover:bg-slate-50 transition-colors">
      <div className="flex-shrink-0 mr-4">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
        {time}
      </div>
    </div>
  );
};

export default Dashboard;
