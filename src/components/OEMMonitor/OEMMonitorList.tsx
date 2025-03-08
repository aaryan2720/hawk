
import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { OEMSource } from '@/types';
import { 
  fetchUserOEMSources, 
  addOEMSource, 
  updateOEMSource, 
  deleteOEMSource, 
  testOEMSource 
} from '@/services/oemService';
import AddSourceDialog from './AddSourceDialog';
import SourceCard from './SourceCard';
import EditSourceForm from './EditSourceForm';
import EmptyState from './EmptyState';

const OEMMonitorList: React.FC = () => {
  const { user } = useAuth();
  const [sources, setSources] = useState<OEMSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingSource, setIsTestingSource] = useState<string | null>(null);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<OEMSource | null>(null);

  const loadSources = async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await fetchUserOEMSources(user.id);
    setSources(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadSources();
  }, [user]);

  const handleAddSource = async (name: string, url: string, systemType: string) => {
    try {
      setIsAddingSource(true);
      
      if (!name || !url || !systemType) {
        return;
      }
      
      if (!user) {
        return;
      }

      const newSource = await addOEMSource(user.id, name, url, systemType);
      
      if (newSource) {
        setSources(prev => [newSource, ...prev]);
      }
      
    } finally {
      setIsAddingSource(false);
    }
  };

  const handleToggleActive = async (sourceId: string, isActive: boolean) => {
    const success = await updateOEMSource(sourceId, { is_active: isActive });
    
    if (success) {
      setSources(prev => 
        prev.map(source => 
          source.id === sourceId ? { ...source, is_active: isActive } : source
        )
      );
    }
  };

  const handleUpdateSource = async (updatedSource: OEMSource) => {
    const { id, name, url, system_type } = updatedSource;
    const success = await updateOEMSource(id, { name, url, system_type });
    
    if (success) {
      setSources(prev => 
        prev.map(source => 
          source.id === id ? updatedSource : source
        )
      );
    }
    
    setEditingSource(null);
  };

  const handleDeleteSource = async (sourceId: string) => {
    const success = await deleteOEMSource(sourceId);
    
    if (success) {
      setSources(prev => prev.filter(source => source.id !== sourceId));
    }
  };

  const handleTestSource = async (source: OEMSource) => {
    setIsTestingSource(source.id);
    await testOEMSource(source);
    setIsTestingSource(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">OEM Websites Monitoring</h3>
        <AddSourceDialog 
          isAddingSource={isAddingSource}
          onAddSource={handleAddSource}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sources.length === 0 ? (
        <EmptyState onAddFirst={() => setIsDialogOpen(true)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sources.map((source) => (
            editingSource?.id === source.id ? (
              <EditSourceForm 
                key={source.id}
                source={editingSource}
                onUpdate={handleUpdateSource}
                onCancel={() => setEditingSource(null)}
              />
            ) : (
              <SourceCard 
                key={source.id}
                source={source}
                isTestingSource={isTestingSource}
                onEdit={setEditingSource}
                onDelete={handleDeleteSource}
                onToggleActive={handleToggleActive}
                onTest={handleTestSource}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default OEMMonitorList;
