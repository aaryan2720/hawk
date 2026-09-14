
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WinAuditSystemDetector from '@/features/oem/components/WinAuditSystemDetector';
import EnhancedOEMList from '@/features/oem/components/EnhancedOEMList';
import AddSourceDialog from '@/features/oem/components/AddSourceDialog';
import AutoDetectOEMs from '@/features/oem/components/AutoDetectOEMs';
import RealTimeOEMScanner from '@/features/oem/components/RealTimeOEMScanner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { addOEMSource } from '@/features/oem/services/oemService';
import { toast } from 'sonner';

const OEMMonitorList: React.FC = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAddingSource, setIsAddingSource] = useState(false);

  const handleSourceAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddSource = async (name: string, url: string, systemType: string) => {
    if (!user) return;
    
    setIsAddingSource(true);
    try {
      await addOEMSource(user.id, name, url, systemType);
      toast.success(`Added OEM source: ${name}`);
      handleSourceAdded();
    } catch (error) {
      console.error('Error adding OEM source:', error);
      toast.error('Failed to add OEM source');
    } finally {
      setIsAddingSource(false);
    }
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
            <AddSourceDialog 
              isAddingSource={isAddingSource} 
              onAddSource={handleAddSource}
            />
            <AutoDetectOEMs onDetectionComplete={handleSourceAdded} />
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
