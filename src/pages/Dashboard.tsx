
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DashboardNav from '@/components/DashboardNav';
import StatusOverview from '@/components/StatusOverview';
import RiskAnalyzer from '@/components/RiskAnalyzer';
import TrendChart from '@/components/TrendChart';
import VulnerabilityDistribution from '@/components/VulnerabilityDistribution';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Shield, Clock, Bell, Target, Activity, Zap } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MonitoringSettings } from '@/types';
import { toast } from 'sonner';
import SecurityScannerVisual from '@/components/SecurityScannerVisual';
import AlertStatusSummary from '@/components/AlertStatusSummary';
import EnhancedVulnerabilityScanner from '@/components/EnhancedVulnerabilityScanner';

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
  const [showEnhancedScanner, setShowEnhancedScanner] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-r-transparent"></div>
          </div>
          <div className="text-primary/70 font-medium text-sm">Loading Security Dashboard...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  const totalAlerts = severityCounts.critical + severityCounts.high + severityCounts.medium + severityCounts.low;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <DashboardNav />
      <main className="container mx-auto py-4 px-4 lg:px-6 space-y-4">
        
        {/* Compact Header Section */}
        <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent">
                    HAWK Security Dashboard
                  </h1>
                  <p className="text-xs text-gray-600">Real-time security monitoring</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-1 text-xs font-medium shadow-md">
                  <Activity className="h-3 w-3 mr-1 animate-pulse" />
                  Live
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 text-xs font-medium shadow-md">
                  <Zap className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
                <Button 
                  variant={showEnhancedScanner ? "default" : "outline"} 
                  onClick={() => setShowEnhancedScanner(!showEnhancedScanner)}
                  size="sm"
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md border-0 text-xs px-3 py-1"
                >
                  <Target className="h-3 w-3 mr-1" />
                  Scanner
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Enhanced Scanner Section */}
        {showEnhancedScanner && (
          <div className="animate-slide-down">
            <EnhancedVulnerabilityScanner />
          </div>
        )}
        
        {/* Critical Alerts Notification */}
        {showNotification && severityCounts.critical > 0 && (
          <Alert className="backdrop-blur-sm bg-red-50/90 border-red-200 shadow-md rounded-lg" variant="destructive">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-red-500 rounded-md">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <AlertTitle className="text-base font-semibold">🚨 Critical Vulnerabilities Detected</AlertTitle>
                <AlertDescription className="mt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                    <span className="text-red-800">
                      <strong>{severityCounts.critical}</strong> critical vulnerabilities require immediate attention.
                    </span>
                    <div className="flex gap-2">
                      <Link to="/alerts">
                        <Button size="sm" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md text-xs px-3 py-1">
                          View Alerts
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={handleDismissNotification} className="border-red-300 text-red-600 hover:bg-red-50 text-xs px-3 py-1">
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Last Scan Information */}
        {lastScanTime && (
          <Alert className="backdrop-blur-sm bg-blue-50/90 border-blue-200 shadow-md rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-blue-500 rounded-md">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <AlertTitle className="font-medium text-sm">Last Scan: {new Date(lastScanTime).toLocaleString()}</AlertTitle>
                <AlertDescription className="mt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                    <span className="text-blue-800">Automatic scans run hourly with OEM filtering.</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={handleManualScan} className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs px-2 py-1 h-6">
                        Scan Now
                      </Button>
                      <Link to="/system-monitor">
                        <Button variant="outline" size="sm" className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs px-2 py-1 h-6">
                          Configure
                        </Button>
                      </Link>
                    </div>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
        
        {/* Main Dashboard Grid - Compact Layout */}
        <div className="space-y-4">
          
          {/* Alert Status Summary - Compact */}
          <div className="animate-fade-in">
            <AlertStatusSummary severityCounts={severityCounts} />
          </div>
          
          {/* System Status and Charts Row - Tighter spacing */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1 animate-fade-in">
              <StatusOverview />
            </div>
            <div className="lg:col-span-2 animate-fade-in">
              <TrendChart />
            </div>
          </div>
          
          {/* Analytics Row - Compact */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="animate-fade-in">
              <VulnerabilityDistribution 
                data={severityCounts} 
                isLoading={isLoading}
              />
            </div>
            <div className="animate-fade-in">
              <RiskAnalyzer />
            </div>
          </div>
          
          {/* Security Scanner Visual - Compact */}
          <div className="animate-fade-in">
            <SecurityScannerVisual />
          </div>

          {/* Quick Actions - Compact */}
          <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                <Link to="/settings">
                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md text-xs px-3 py-1.5">
                    <Bell className="h-3 w-3 mr-1" />
                    Notifications
                  </Button>
                </Link>
                <Link to="/system-monitor">
                  <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50 text-xs px-3 py-1.5">
                    <Shield className="h-3 w-3 mr-1" />
                    Monitor
                  </Button>
                </Link>
                <Link to="/reports">
                  <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50 text-xs px-3 py-1.5">
                    <Activity className="h-3 w-3 mr-1" />
                    Reports
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
