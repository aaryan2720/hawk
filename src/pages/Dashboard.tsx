
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DashboardNav from '@/components/DashboardNav';
import StatusOverview from '@/components/StatusOverview';
import RealTimeScanner from '@/components/RealTimeScanner';
import RiskAnalyzer from '@/components/RiskAnalyzer';
import TrendChart from '@/components/TrendChart';
import VulnerabilityDistribution from '@/components/VulnerabilityDistribution';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Shield, Clock } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MonitoringSettings } from '@/types';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [severityCounts, setSeverityCounts] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchAlertCounts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('alerts')
          .select('severity')
          .in('status', ['new', 'in_progress'])
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        const counts = {
          critical: data.filter(alert => alert.severity === 'critical').length,
          high: data.filter(alert => alert.severity === 'high').length,
          medium: data.filter(alert => alert.severity === 'medium').length,
          low: data.filter(alert => alert.severity === 'low').length
        };
        
        setSeverityCounts(counts);
        
        // Get last scan time
        const { data: userSystem } = await supabase
          .from('user_systems')
          .select('monitoring_settings')
          .eq('user_id', user.id)
          .single();
          
        if (userSystem) {
          const monitoringSettings = userSystem.monitoring_settings as MonitoringSettings;
          if (monitoringSettings && monitoringSettings.lastScanTime) {
            setLastScanTime(monitoringSettings.lastScanTime);
          }
        }
      } catch (error) {
        console.error('Error fetching alert counts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlertCounts();
  }, [user]);

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor all your systems security in real-time
          </p>
        </div>
        
        {lastScanTime && (
          <Alert className="mb-6" variant="warning">
            <Clock className="h-4 w-4" />
            <AlertTitle>Last Scan: {new Date(lastScanTime).toLocaleString()}</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>Automatic scans are configured to run hourly.</span>
              <Link to="/system-monitor">
                <Button variant="outline" size="sm">Configure Monitoring</Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <StatusOverview />
          
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                Overview of current security alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <div className="flex flex-col p-3 bg-red-50 border border-red-100 rounded-lg">
                  <span className="text-sm text-red-800 font-medium">Critical</span>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-2xl font-bold text-red-600">{severityCounts.critical}</span>
                    <Shield className="h-5 w-5 text-red-600/80 mb-0.5" />
                  </div>
                </div>
                
                <div className="flex flex-col p-3 bg-orange-50 border border-orange-100 rounded-lg">
                  <span className="text-sm text-orange-800 font-medium">High</span>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-2xl font-bold text-orange-600">{severityCounts.high}</span>
                    <AlertTriangle className="h-5 w-5 text-orange-600/80 mb-0.5" />
                  </div>
                </div>
                
                <div className="flex flex-col p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                  <span className="text-sm text-yellow-800 font-medium">Medium</span>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-2xl font-bold text-yellow-600">{severityCounts.medium}</span>
                    <AlertTriangle className="h-5 w-5 text-yellow-600/80 mb-0.5" />
                  </div>
                </div>
                
                <div className="flex flex-col p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <span className="text-sm text-blue-800 font-medium">Low</span>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-2xl font-bold text-blue-600">{severityCounts.low}</span>
                    <AlertTriangle className="h-5 w-5 text-blue-600/80 mb-0.5" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Link to="/alerts">
                  <Button variant="outline" size="sm">
                    View All Alerts
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <VulnerabilityDistribution 
            data={severityCounts} 
            isLoading={isLoading}
          />
          
          <div className="col-span-1 md:col-span-1 lg:col-span-2">
            <TrendChart />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <RiskAnalyzer />
          <RealTimeScanner />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
