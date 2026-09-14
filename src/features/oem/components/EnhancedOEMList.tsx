
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Monitor, 
  CheckCircle, 
  AlertTriangle, 
  Trash2,
  ExternalLink,
  Cpu,
  HardDrive,
  Network
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { fetchUserOEMSources, deleteOEMSource, testOEMSource } from '@/features/oem/services/oemService';
import { toast } from 'sonner';
import type { OEMSource } from '@/types';

interface EnhancedOEMListProps {
  onSourceAdded?: () => void;
}

const EnhancedOEMList: React.FC<EnhancedOEMListProps> = ({ onSourceAdded }) => {
  const { user } = useAuth();
  const [sources, setSources] = useState<OEMSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingSource, setTestingSource] = useState<string | null>(null);

  useEffect(() => {
    loadSources();
  }, [user, onSourceAdded]);

  const loadSources = async () => {
    if (!user) return;
    
    try {
      const userSources = await fetchUserOEMSources(user.id);
      setSources(userSources);
    } catch (error) {
      console.error('Error loading OEM sources:', error);
      toast.error('Failed to load OEM sources');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    try {
      await deleteOEMSource(sourceId);
      setSources(prev => prev.filter(s => s.id !== sourceId));
      toast.success('OEM source removed');
    } catch (error) {
      console.error('Error deleting source:', error);
      toast.error('Failed to remove OEM source');
    }
  };

  const handleTestSource = async (source: OEMSource) => {
    setTestingSource(source.id);
    try {
      await testOEMSource(source);
    } catch (error) {
      console.error('Error testing source:', error);
    } finally {
      setTestingSource(null);
    }
  };

  const getSystemTypeIcon = (systemType: string) => {
    const type = systemType.toLowerCase();
    if (type.includes('cpu') || type.includes('processor')) return <Cpu className="h-4 w-4" />;
    if (type.includes('network') || type.includes('router')) return <Network className="h-4 w-4" />;
    if (type.includes('storage') || type.includes('disk')) return <HardDrive className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const getStatusColor = (isActive: boolean, lastChecked?: string) => {
    if (!isActive) return 'bg-gray-500';
    if (!lastChecked) return 'bg-yellow-500';
    
    const lastCheck = new Date(lastChecked);
    const hoursSinceCheck = (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCheck < 24) return 'bg-green-500';
    if (hoursSinceCheck < 72) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatLastChecked = (lastChecked?: string) => {
    if (!lastChecked) return 'Never checked';
    
    const date = new Date(lastChecked);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;
    if (diffHours < 72) return `${Math.floor(diffHours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading OEM sources...</div>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          No OEM sources configured yet. Use the WinAudit-style detector above to automatically configure monitoring for your system's components.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Configured OEM Sources ({sources.length})</h4>
        <Badge variant="outline" className="text-xs">
          {sources.filter(s => s.is_active).length} Active
        </Badge>
      </div>

      <div className="grid gap-3">
        {sources.map((source) => (
          <Card key={source.id} className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Status Indicator */}
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div 
                      className={`w-3 h-3 rounded-full ${getStatusColor(source.is_active, source.last_checked)}`}
                      title={source.is_active ? 'Active' : 'Inactive'}
                    />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getSystemTypeIcon(source.system_type)}
                      <h5 className="font-medium text-sm truncate">{source.name}</h5>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {source.system_type}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-2 space-y-1">
                      <div className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{source.url}</span>
                      </div>
                      <div>
                        Last checked: {formatLastChecked(source.last_checked)}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestSource(source)}
                        disabled={testingSource === source.id}
                        className="text-xs px-2 py-1 h-7"
                      >
                        {testingSource === source.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Test
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(source.url, '_blank')}
                        className="text-xs px-2 py-1 h-7"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Visit
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSource(source.id)}
                        className="text-xs px-2 py-1 h-7 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-semibold text-green-600">
              {sources.filter(s => s.is_active).length}
            </div>
            <div className="text-xs text-muted-foreground">Active Sources</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-semibold text-blue-600">
              {sources.filter(s => s.last_checked).length}
            </div>
            <div className="text-xs text-muted-foreground">Recently Checked</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-semibold text-orange-600">
              {new Set(sources.map(s => s.system_type)).size}
            </div>
            <div className="text-xs text-muted-foreground">System Types</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedOEMList;
