
import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, Edit, Loader, Plus, RefreshCw, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { OEMSource } from '@/types';
import { useAuth } from '@/hooks/useAuth';

const OEMMonitorList = () => {
  const { user } = useAuth();
  const [sources, setSources] = useState<OEMSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingSource, setIsTestingSource] = useState<string | null>(null);
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    system_type: '',
  });
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<OEMSource | null>(null);

  const fetchSources = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('oem_sources')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSources(data as OEMSource[]);
    } catch (error) {
      console.error('Error fetching OEM sources:', error);
      toast.error('Failed to load OEM sources');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [user]);

  const handleAddSource = async () => {
    try {
      setIsAddingSource(true);
      
      if (!newSource.name || !newSource.url || !newSource.system_type) {
        toast.error('Please fill in all fields');
        return;
      }
      
      if (!user) {
        toast.error('You must be logged in to add sources');
        return;
      }

      const { data, error } = await supabase
        .from('oem_sources')
        .insert({
          user_id: user.id,
          name: newSource.name,
          url: newSource.url,
          system_type: newSource.system_type,
          is_active: true
        })
        .select('*')
        .single();

      if (error) throw error;
      
      setSources(prev => [data as OEMSource, ...prev]);
      
      setNewSource({
        name: '',
        url: '',
        system_type: '',
      });
      
      setIsDialogOpen(false);
      toast.success('OEM source added successfully');
    } catch (error) {
      console.error('Error adding OEM source:', error);
      toast.error('Failed to add OEM source');
    } finally {
      setIsAddingSource(false);
    }
  };

  const handleUpdateSource = async (sourceId: string, updates: Partial<OEMSource>) => {
    try {
      const { error } = await supabase
        .from('oem_sources')
        .update(updates)
        .eq('id', sourceId);

      if (error) throw error;
      
      setSources(prev => 
        prev.map(source => 
          source.id === sourceId ? { ...source, ...updates } : source
        )
      );
      
      toast.success('OEM source updated');
    } catch (error) {
      console.error('Error updating OEM source:', error);
      toast.error('Failed to update OEM source');
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    try {
      const { error } = await supabase
        .from('oem_sources')
        .delete()
        .eq('id', sourceId);

      if (error) throw error;
      
      setSources(prev => prev.filter(source => source.id !== sourceId));
      toast.success('OEM source deleted');
    } catch (error) {
      console.error('Error deleting OEM source:', error);
      toast.error('Failed to delete OEM source');
    }
  };

  const testOEMSource = async (source: OEMSource) => {
    try {
      setIsTestingSource(source.id);
      
      // Call Edge Function to test the OEM source
      const response = await fetch('https://eogwxywiidsnnlaybbdd.supabase.co/functions/v1/test-oem-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          url: source.url,
          name: source.name,
          system_type: source.system_type
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to test source');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Test successful: Found ${result.vulnerabilitiesCount || 0} potential vulnerabilities`);
      } else {
        toast.error(`Test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error testing OEM source:', error);
      toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingSource(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSource) return;
    
    await handleUpdateSource(editingSource.id, {
      name: editingSource.name,
      url: editingSource.url,
      system_type: editingSource.system_type
    });
    
    setEditingSource(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">OEM Websites Monitoring</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add Source
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add OEM Source</DialogTitle>
              <DialogDescription>
                Add a vendor website to monitor for security vulnerabilities
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Source Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Microsoft Windows Updates" 
                  value={newSource.name}
                  onChange={(e) => setNewSource({...newSource, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">Website URL</Label>
                <Input 
                  id="url" 
                  placeholder="e.g. https://msrc.microsoft.com/update-guide" 
                  value={newSource.url}
                  onChange={(e) => setNewSource({...newSource, url: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="system_type">System Type</Label>
                <Input 
                  id="system_type" 
                  placeholder="e.g. Windows" 
                  value={newSource.system_type}
                  onChange={(e) => setNewSource({...newSource, system_type: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleAddSource} 
                disabled={isAddingSource || !newSource.name || !newSource.url || !newSource.system_type}
              >
                {isAddingSource ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Source
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sources.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No OEM Sources Added</h3>
            <p className="text-muted-foreground mb-4">
              Add vendor websites to monitor for security vulnerabilities relevant to your systems.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(true)} 
              className="mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Your First Source
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sources.map((source) => (
            <Card key={source.id}>
              {editingSource?.id === source.id ? (
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`edit-name-${source.id}`}>Name</Label>
                      <Input 
                        id={`edit-name-${source.id}`}
                        value={editingSource.name}
                        onChange={(e) => setEditingSource({...editingSource, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-url-${source.id}`}>URL</Label>
                      <Input 
                        id={`edit-url-${source.id}`}
                        value={editingSource.url}
                        onChange={(e) => setEditingSource({...editingSource, url: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-system-${source.id}`}>System Type</Label>
                      <Input 
                        id={`edit-system-${source.id}`}
                        value={editingSource.system_type}
                        onChange={(e) => setEditingSource({...editingSource, system_type: e.target.value})}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setEditingSource(null)}>Cancel</Button>
                      <Button onClick={handleSaveEdit}>Save</Button>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{source.name}</span>
                      <div className="flex items-center gap-1">
                        <Switch 
                          checked={source.is_active}
                          onCheckedChange={(checked) => handleUpdateSource(source.id, { is_active: checked })}
                        />
                      </div>
                    </CardTitle>
                    <CardDescription className="truncate">{source.url}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">System Type:</span>
                        <span className="font-medium">{source.system_type}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-muted-foreground">Last Checked:</span>
                        <span className="font-medium">
                          {source.last_checked 
                            ? new Date(source.last_checked).toLocaleString() 
                            : 'Never'}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`font-medium ${source.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                          {source.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => setEditingSource(source)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSource(source.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testOEMSource(source)}
                      disabled={isTestingSource === source.id}
                    >
                      {isTestingSource === source.id ? (
                        <Loader className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Test Source
                    </Button>
                  </CardFooter>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OEMMonitorList;
