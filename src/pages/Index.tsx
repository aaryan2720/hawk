
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirect based on authentication status and user type
  if (user) {
    // Special redirect for architecture team
    if (user.email === 'architecture@hawk.com') {
      return <Navigate to="/architecture" replace />;
    }
    // Regular users go to dashboard
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/" replace />;
  }
};

export default Index;
