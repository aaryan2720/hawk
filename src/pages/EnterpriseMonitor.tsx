
import React from 'react';
import DashboardNav from '@/components/layout/DashboardNav';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import EnterpriseOEMDashboard from '@/features/enterprise/components/EnterpriseOEMDashboard';

const EnterpriseMonitor = () => {
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
        <EnterpriseOEMDashboard />
      </main>
    </div>
  );
};

export default EnterpriseMonitor;
