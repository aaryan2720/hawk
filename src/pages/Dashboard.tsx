
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import DashboardHeader from '@/components/DashboardHeader';
import StatusOverview from '@/components/StatusOverview';
import AlertsList from '@/components/AlertsList';
import Footer from '@/components/Footer';
import TrendChart from '@/components/TrendChart';
import VulnerabilityScraper from '@/components/VulnerabilityScraper';
import RiskAnalyzer from '@/components/RiskAnalyzer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate('/auth/login');
      }
    };

    checkAuth();
    document.title = 'HAWK - Security Dashboard';
    document.body.classList.add('bg-gradient-to-br', 'from-gray-50', 'to-blue-50');
    
    return () => {
      document.body.classList.remove('bg-gradient-to-br', 'from-gray-50', 'to-blue-50');
    };
  }, [navigate]);

  return (
    <div className="min-h-screen pb-12">
      <Navbar />
      
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        <DashboardHeader 
          title="Security Dashboard" 
          subtitle="Monitor and manage security alerts in real-time" 
        />
        
        <section id="trends" className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Vulnerability Trends</h2>
          <TrendChart />
        </section>
        
        <Tabs defaultValue="alerts" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="scraper">Web Scraping</TabsTrigger>
            <TabsTrigger value="analyzer">Risk Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="alerts">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2" id="alerts">
                <AlertsList />
              </div>
              <div id="systems">
                <StatusOverview />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="scraper">
            <VulnerabilityScraper />
          </TabsContent>
          
          <TabsContent value="analyzer">
            <RiskAnalyzer />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
