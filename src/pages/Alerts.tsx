
import React from 'react';
import DashboardNav from '@/components/layout/DashboardNav';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AlertsList from '@/features/alerts/components/AlertsList';
import MultiSourceVulnerabilityScanner from '@/features/scanning/components/MultiSourceVulnerabilityScanner';
import { Shield, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Alerts = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="text-primary/70 font-medium">Loading Security Dashboard...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <DashboardNav />
      <main className="container mx-auto py-8 px-4">
        {/* Enhanced Header Section */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-3xl blur-xl"></div>
          <Card className="relative backdrop-blur-sm bg-white/80 border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Security Alert Center
                      </h1>
                      <p className="text-lg text-gray-600 mt-1">
                        Real-time vulnerability monitoring for your registered OEM devices
                      </p>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:flex space-x-4">
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <Activity className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-green-800">Live Monitoring</div>
                    <div className="text-xs text-green-600">Active</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-blue-800">Coverage</div>
                    <div className="text-xs text-blue-600">Multi-Source</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
                    <AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-orange-800">Filtering</div>
                    <div className="text-xs text-orange-600">OEM-Based</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Enhanced Scanner Section */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-2xl blur-lg"></div>
            <div className="relative">
              <MultiSourceVulnerabilityScanner showSourcesList={false} />
            </div>
          </div>
        </div>
        
        {/* Enhanced Alerts List Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-blue-600/5 rounded-2xl blur-lg"></div>
          <div className="relative">
            <AlertsList />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Alerts;
