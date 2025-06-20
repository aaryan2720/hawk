
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-r-transparent"></div>
          </div>
          <div className="text-primary/70 font-medium">Loading Security Dashboard...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  const totalAlerts = severityCounts.critical + severityCounts.high + severityCounts.medium + severityCounts.low;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <DashboardNav />
      <main className="container mx-auto py-6 px-4 lg:px-8">
        
        {/* Enhanced Header Section */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-3xl blur-xl"></div>
          <Card className="relative backdrop-blur-sm bg-white/90 border-0 shadow-2xl rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
            <CardContent className="relative p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent animate-fade-in">
                        HAWK Security Dashboard
                      </h1>
                      <p className="text-lg text-gray-600 mt-2 animate-fade-in" style={{animationDelay: '0.1s'}}>
                        Advanced real-time security monitoring and threat intelligence
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 font-bold shadow-lg">
                    <Activity className="h-4 w-4 mr-2 animate-pulse" />
                    Live Monitoring
                  </Badge>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 font-bold shadow-lg">
                    <Zap className="h-4 w-4 mr-2" />
                    AI-Powered
                  </Badge>
                  <Button 
                    variant={showEnhancedScanner ? "default" : "outline"} 
                    onClick={() => setShowEnhancedScanner(!showEnhancedScanner)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg border-0"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Enhanced Scanner
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Enhanced Scanner Section */}
        {showEnhancedScanner && (
          <div className="mb-8 animate-slide-down">
            <EnhancedVulnerabilityScanner />
          </div>
        )}
        
        {/* Critical Alerts Notification */}
        {showNotification && severityCounts.critical > 0 && (
          <div className="mb-8 animate-slide-down">
            <Alert className="glass-effect border-red-200 shadow-2xl rounded-2xl" variant="destructive">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-500 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <AlertTitle className="text-lg font-bold">🚨 Critical Security Vulnerabilities Detected</AlertTitle>
                  <AlertDescription className="mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <span className="text-red-800">
                        There are <strong>{severityCounts.critical}</strong> critical vulnerabilities requiring immediate attention to prevent potential security breaches.
                      </span>
                      <div className="flex gap-2">
                        <Link to="/alerts">
                          <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg">
                            View Critical Alerts
                          </Button>
                        </Link>
                        <Button variant="outline" onClick={handleDismissNotification} className="border-red-300 text-red-600 hover:bg-red-50">
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        )}

        {/* Last Scan Information */}
        {lastScanTime && (
          <div className="mb-8 animate-slide-down" style={{animationDelay: '0.2s'}}>
            <Alert className="glass-effect border-blue-200 shadow-lg rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <AlertTitle className="font-semibold">Last Security Scan: {new Date(lastScanTime).toLocaleString()}</AlertTitle>
                  <AlertDescription className="mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className="text-blue-800">Automatic vulnerability scans are configured to run every hour.</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleManualScan} className="border-blue-300 text-blue-600 hover:bg-blue-50">
                          Run Manual Scan
                        </Button>
                        <Link to="/system-monitor">
                          <Button variant="outline" size="sm" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                            Configure Monitoring
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        )}
        
        {/* Main Dashboard Grid - Responsive Layout */}
        <div className="space-y-8">
          
          {/* Alert Status Summary - Full Width */}
          <div className="animate-fade-in" style={{animationDelay: '0.3s'}}>
            <AlertStatusSummary severityCounts={severityCounts} />
          </div>
          
          {/* System Status and Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <StatusOverview />
            </div>
            <div className="lg:col-span-2 animate-fade-in" style={{animationDelay: '0.5s'}}>
              <TrendChart />
            </div>
          </div>
          
          {/* Analytics Row */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="animate-fade-in" style={{animationDelay: '0.6s'}}>
              <VulnerabilityDistribution 
                data={severityCounts} 
                isLoading={isLoading}
              />
            </div>
            <div className="animate-fade-in" style={{animationDelay: '0.7s'}}>
              <RiskAnalyzer />
            </div>
          </div>
          
          {/* Security Scanner Visual */}
          <div className="animate-fade-in" style={{animationDelay: '0.8s'}}>
            <SecurityScannerVisual />
          </div>

          {/* Quick Actions */}
          <div className="animate-fade-in" style={{animationDelay: '0.9s'}}>
            <Card className="glass-card border-0 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 gradient-text">
                  <Bell className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Configure and manage your security settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Link to="/settings">
                    <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg">
                      <Bell className="h-4 w-4 mr-2" />
                      Notification Settings
                    </Button>
                  </Link>
                  <Link to="/system-monitor">
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                      <Shield className="h-4 w-4 mr-2" />
                      System Monitor
                    </Button>
                  </Link>
                  <Link to="/reports">
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                      <Activity className="h-4 w-4 mr-2" />
                      Security Reports
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
