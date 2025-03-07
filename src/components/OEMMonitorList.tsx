
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader, Globe, Trash2, Plus } from 'lucide-react';

interface OEMMonitorListProps {
  userSystems: string[];
  userId: string;
}

interface OEMSource {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  system_type: string;
  last_checked: string | null;
}

const OEMMonitorList: React.FC<OEMMonitorListProps> = ({ userSystems, userId }) => {
  const [sources, setSources] = useState<OEMSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    system_type: userSystems[0] || ''
  });
  const [testingScrape, setTestingScrape] = useState<string | null>(null);

  useEffect(() => {
    const fetchSources = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('oem_sources')
          .select('*')
          .eq('user_id', userId);
          
        if (error) throw error;
        setSources(data || []);
      } catch (error) {
        console.error('Error fetching OEM sources:', error);
        toast.error('Failed to load OEM sources');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSources();
  }, [userId]);

  const addOEMSource = async () => {
    if (!newSource.name.trim() || !newSource.url.trim() || !newSource.system_type) {
      toast.error('Please fill all fields');
      return;
    }
    
    if (!newSource.url.startsWith('http')) {
      toast.error('URL must start with http:// or https://');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('oem_sources')
        .insert({
          user_id: userId,
          name: newSource.name,
          url: newSource.url,
          system_type: newSource.system_type,
          is_active: true,
          last_checked: null
        })
        .select();
        
      if (error) throw error;
      
      setSources(prev => [...prev, data[0]]);
      setNewSource({ name: '', url: '', system_type: userSystems[0] || '' });
      toast.success('OEM source added successfully');
    } catch (error) {
      console.error('Error adding OEM source:', error);
      toast.error('Failed to add OEM source');
    }
  };
  
  const toggleSourceStatus = async (id: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('oem_sources')
        .update({ is_active: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      setSources(prev => prev.map(source => 
        source.id === id ? { ...source, is_active: newStatus } : source
      ));
      
      toast.success(`Source ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating source status:', error);
      toast.error('Failed to update source status');
    }
  };
  
  const deleteSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('oem_sources')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setSources(prev => prev.filter(source => source.id !== id));
      toast.success('Source deleted successfully');
    } catch (error) {
      console.error('Error deleting source:', error);
      toast.error('Failed to delete source');
    }
  };
  
  const testScraping = async (id: string) => {
    setTestingScrape(id);
    try {
      const source = sources.find(s => s.id === id);
      if (!source) return;
      
      const { data, error } = await supabase.functions.invoke('test-oem-scraper', {
        body: { url: source.url, system_type: source.system_type }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Successfully scraped ${data.count || 0} vulnerabilities`);
        
        // Update last checked timestamp
        await supabase
          .from('oem_sources')
          .update({ last_checked: new Date().toISOString() })
          .eq('id', id);
          
        setSources(prev => prev.map(source => 
          source.id === id ? { ...source, last_checked: new Date().toISOString() } : source
        ));
      } else {
        toast.error(data.error || 'Failed to test scraping');
      }
    } catch (error) {
      console.error('Error testing scraper:', error);
      toast.error('Failed to test scraping');
    } finally {
      setTestingScrape(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-48">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">OEM Source Monitoring</h3>
      <p className="text-gray-500 mb-6">
        Add manufacturer (OEM) websites to monitor for security advisories and vulnerability announcements.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="sourceNameInput">Source Name</Label>
          <Input 
            id="sourceNameInput"
            placeholder="Microsoft Security" 
            value={newSource.name}
            onChange={e => setNewSource({...newSource, name: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="sourceUrlInput">Source URL</Label>
          <Input 
            id="sourceUrlInput"
            placeholder="https://example.com/security" 
            value={newSource.url}
            onChange={e => setNewSource({...newSource, url: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="systemTypeSelect">System Type</Label>
          <select
            id="systemTypeSelect"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={newSource.system_type}
            onChange={e => setNewSource({...newSource, system_type: e.target.value})}
          >
            <option value="" disabled>Select a system</option>
            {userSystems.map(system => (
              <option key={system} value={system}>{system}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-end mb-8">
        <Button onClick={addOEMSource} disabled={!newSource.name || !newSource.url || !newSource.system_type}>
          <Plus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </div>
      
      {sources.length > 0 ? (
        <div className="space-y-4">
          {sources.map(source => (
            <div key={source.id} className="border rounded-md p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium">{source.name}</h4>
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center"
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    {source.url}
                  </a>
                  <div className="text-xs text-gray-500 mt-1">
                    System: {source.system_type} • 
                    {source.last_checked 
                      ? ` Last checked: ${new Date(source.last_checked).toLocaleString()}`
                      : ' Never checked'}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id={`active-${source.id}`}
                      checked={source.is_active}
                      onCheckedChange={(checked) => toggleSourceStatus(source.id, checked)}
                    />
                    <Label htmlFor={`active-${source.id}`} className="text-sm">
                      {source.is_active ? 'Active' : 'Inactive'}
                    </Label>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => testScraping(source.id)}
                    disabled={testingScrape !== null}
                  >
                    {testingScrape === source.id ? (
                      <Loader className="h-3 w-3 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => deleteSource(source.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 border rounded-md">
          No OEM sources added yet. Add sources to monitor for vulnerabilities.
        </div>
      )}
    </Card>
  );
};

export default OEMMonitorList;
