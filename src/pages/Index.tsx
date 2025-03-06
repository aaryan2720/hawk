
import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import DashboardHeader from '../components/DashboardHeader';
import StatusOverview from '../components/StatusOverview';
import AlertsList from '../components/AlertsList';

const Index = () => {
  // Add a slight delay to create a staggered animation effect
  useEffect(() => {
    document.body.classList.add('bg-gradient-to-br', 'from-gray-50', 'to-blue-50');
    
    return () => {
      document.body.classList.remove('bg-gradient-to-br', 'from-gray-50', 'to-blue-50');
    };
  }, []);

  return (
    <div className="min-h-screen pb-12">
      <Navbar />
      
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        <DashboardHeader />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <AlertsList />
          </div>
          <div>
            <StatusOverview />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
