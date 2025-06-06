
import React from 'react';
import DashboardNav from '@/components/DashboardNav';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AlertsList from '@/components/AlertsList';
import MultiSourceVulnerabilityScanner from '@/components/MultiSourceVulnerabilityScanner';

const Alerts = () => {
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
          <h1 className="text-3xl font-bold">Security Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage all security alerts from multiple free sources
          </p>
        </div>
        
        <div className="mb-8">
          <MultiSourceVulnerabilityScanner />
        </div>
        
        <div className="mb-8">
          <AlertsList />
        </div>
      </main>
    </div>
  );
};

export default Alerts;
