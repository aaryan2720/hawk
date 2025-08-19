
import React from 'react';
import DashboardNav from '@/components/DashboardNav';
import DevelopmentRoadmap from '@/components/Roadmap/DevelopmentRoadmap';

const DevelopmentRoadmapPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8">
        <DevelopmentRoadmap />
      </div>
    </div>
  );
};

export default DevelopmentRoadmapPage;
