
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WinAuditSystemDetector from './WinAuditSystemDetector';
import EnhancedOEMList from './EnhancedOEMList';
import AddSourceDialog from './AddSourceDialog';
import AutoDetectOEMs from './AutoDetectOEMs';
import RealTimeOEMScanner from './RealTimeOEMScanner';

const OEMMonitorList: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSourceAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="detector" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="detector">System Detection</TabsTrigger>
          <TabsTrigger value="sources">My Sources</TabsTrigger>
          <TabsTrigger value="add">Add Source</TabsTrigger>
          <TabsTrigger value="scanner">Live Scanner</TabsTrigger>
        </TabsList>

        <TabsContent value="detector" className="mt-6">
          <WinAuditSystemDetector />
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          <EnhancedOEMList key={refreshTrigger} onSourceAdded={handleSourceAdded} />
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <div className="space-y-6">
            <AddSourceDialog onSourceAdded={handleSourceAdded} />
            <AutoDetectOEMs onOEMsDetected={handleSourceAdded} />
          </div>
        </TabsContent>

        <TabsContent value="scanner" className="mt-6">
          <RealTimeOEMScanner />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OEMMonitorList;
