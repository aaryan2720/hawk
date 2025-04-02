
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DashboardNav from '@/components/DashboardNav';
import StatusOverview from '@/components/StatusOverview';
import RiskAnalyzer from '@/components/RiskAnalyzer';
import TrendChart from '@/components/TrendChart';
import VulnerabilityDistribution from '@/components/VulnerabilityDistribution';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Shield, Clock, Bell } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MonitoringSettings } from '@/types';
import { toast } from 'sonner';
import SecurityScannerVisual from '@/components/SecurityScannerVisual';
import AlertStatusSummary from '@/components/AlertStatusSummary';

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
  const [showNotification, setShowNotification] = useState(true);

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

  const handleDismissNotification = () => {
    setShowNotification(false);
  };

  const handleManualScan = async () => {
    if (!user) return;
    
    toast.info("Starting manual vulnerability scan...");
    
    try {
      const { data, error } = await supabase.functions.invoke('real-time-scraper', {
        body: { 
          user_id: user.id,
          source: 'all'
        }
      });
      
      if (error) throw error;
      
      toast.success("Scan completed successfully");
    } catch (error) {
      console.error('Error during manual scan:', error);
      toast.error("Scan failed. Please try again later.");
    }
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

  const totalAlerts = severityCounts.critical + severityCounts.high + severityCounts.medium + severityCounts.low;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold animate-fade-in">HAWK Security Dashboard</h1>
          <p className="text-muted-foreground mt-1 animate-fade-in" style={{animationDelay: '0.1s'}}>
            Monitor all your systems security in real-time
          </p>
        </div>
        
        {showNotification && severityCounts.critical > 0 && (
          <Alert className="mb-6 animate-slide-down" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Critical Vulnerabilities Detected</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <span>There are {severityCounts.critical} critical vulnerabilities requiring immediate attention.</span>
              <div className="flex gap-2">
                <Link to="/alerts">
                  <Button variant="destructive" size="sm">View Alerts</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleDismissNotification}>Dismiss</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {lastScanTime && (
          <Alert className="mb-6 animate-slide-down" style={{animationDelay: '0.2s'}} variant="warning">
            <Clock className="h-4 w-4" />
            <AlertTitle>Last Scan: {new Date(lastScanTime).toLocaleString()}</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>Automatic scans are configured to run hourly.</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleManualScan}>Run Manual Scan</Button>
                <Link to="/system-monitor">
                  <Button variant="outline" size="sm">Configure Monitoring</Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="col-span-1 lg:col-span-1 animate-fade-in" style={{animationDelay: '0.3s'}}>
            <StatusOverview />
          </div>
          
          <div className="col-span-1 md:col-span-1 lg:col-span-3 animate-fade-in" style={{animationDelay: '0.4s'}}>
            <AlertStatusSummary severityCounts={severityCounts} />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="animate-fade-in" style={{animationDelay: '0.5s'}}>
            <VulnerabilityDistribution 
              data={severityCounts} 
              isLoading={isLoading}
            />
          </div>
          
          <div className="col-span-1 md:col-span-1 lg:col-span-2 animate-fade-in" style={{animationDelay: '0.6s'}}>
            <TrendChart />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="animate-fade-in" style={{animationDelay: '0.7s'}}>
            <RiskAnalyzer />
          </div>
          <div className="animate-fade-in" style={{animationDelay: '0.8s'}}>
            <SecurityScannerVisual />
          </div>
        </div>

        <div className="mb-6 animate-fade-in" style={{animationDelay: '0.9s'}}>
          <Link to="/settings">
            <Button variant="outline" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Configure Notification Settings
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
