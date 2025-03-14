
import React from 'react';
import DashboardNav from '@/components/DashboardNav';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import OEMMonitorList from '@/components/OEMMonitor/OEMMonitorList';

const SystemMonitor = () => {
  const { user, loading } = useAuth();
  
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
          <h1 className="text-3xl font-bold">System Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your OEM websites and system components
          </p>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <OEMMonitorList />
        </div>
      </main>
    </div>
  );
};

export default SystemMonitor;
