
import React, { useState } from 'react';
import DashboardNav from '@/components/layout/DashboardNav';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import OEMMonitorList from '@/features/oem/components/OEMMonitorList';
import UserSystemMonitor from '@/features/oem/components/AutoMonitor/UserSystemMonitor';
import VulnerabilityScraper from '@/features/scanning/components/VulnerabilityScraper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Shield, History } from 'lucide-react';

const SystemMonitor = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('systems');
  
  const handleScanComplete = () => {
    toast.success("Scan completed successfully", {
      description: "Results have been saved to your scan history"
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary/70">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">HAWK System Monitor</h1>
            <p className="text-muted-foreground mt-1">
              Monitor your OEM websites and system components
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link to="/scan-history">
              <Button variant="outline" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                View Scan History
              </Button>
            </Link>
          </div>
        </div>
        
        <Tabs defaultValue="systems" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="systems">System Monitor</TabsTrigger>
            <TabsTrigger value="oem">OEM Sources</TabsTrigger>
            <TabsTrigger value="scan">Manual Scan</TabsTrigger>
          </TabsList>
          
          <TabsContent value="systems" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Set up automatic monitoring for your systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserSystemMonitor />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="oem" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>OEM Vulnerability Sources</CardTitle>
                <CardDescription>
                  Track vulnerabilities from original equipment manufacturers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OEMMonitorList />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="scan" className="mt-4">
            <VulnerabilityScraper onScanComplete={handleScanComplete} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SystemMonitor;
