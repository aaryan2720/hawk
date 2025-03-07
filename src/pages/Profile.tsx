
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfile } from '@/types';
import { Bell, Shield, Settings, Box, Zap } from 'lucide-react';
import OEMMonitorList from '@/components/OEMMonitorList';
import SubscriptionPlans from '@/components/SubscriptionPlans';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [systems, setUserSystems] = useState<string[]>([]);
  const [newSystem, setNewSystem] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate('/auth/login');
        return;
      }
      
      // Fetch user profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } else {
        setProfile({
          id: profileData.id,
          email: data.session.user.email || '',
          full_name: profileData.full_name,
          organization: profileData.organization,
          role: profileData.role,
          created_at: profileData.created_at
        });
      }

      // Fetch user systems
      const { data: systemsData, error: systemsError } = await supabase
        .from('user_systems')
        .select('system_name')
        .eq('user_id', data.session.user.id);

      if (!systemsError && systemsData) {
        setUserSystems(systemsData.map(s => s.system_name));
      }

      setLoading(false);
    };

    checkAuth();
    document.title = 'HAWK - User Profile';
    document.body.classList.add('bg-gradient-to-br', 'from-gray-50', 'to-blue-50');
    
    return () => {
      document.body.classList.remove('bg-gradient-to-br', 'from-gray-50', 'to-blue-50');
    };
  }, [navigate]);

  const updateProfile = async (field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', profile?.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, [field]: value } : null);
      toast.success(`Updated ${field} successfully`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const addSystem = async () => {
    if (!newSystem.trim()) return;
    
    try {
      const { error } = await supabase
        .from('user_systems')
        .insert({ 
          user_id: profile?.id, 
          system_name: newSystem
        });

      if (error) throw error;
      
      setUserSystems(prev => [...prev, newSystem]);
      setNewSystem('');
      toast.success('System added successfully');
    } catch (error) {
      console.error('Error adding system:', error);
      toast.error('Failed to add system');
    }
  };

  const removeSystem = async (system: string) => {
    try {
      const { error } = await supabase
        .from('user_systems')
        .delete()
        .eq('user_id', profile?.id)
        .eq('system_name', system);

      if (error) throw error;
      
      setUserSystems(prev => prev.filter(s => s !== system));
      toast.success('System removed successfully');
    } catch (error) {
      console.error('Error removing system:', error);
      toast.error('Failed to remove system');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <Navbar />
      
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Card className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">
                    {profile?.full_name?.charAt(0) || profile?.email?.charAt(0)}
                  </span>
                </div>
                <h2 className="text-xl font-semibold">{profile?.full_name}</h2>
                <p className="text-gray-500">{profile?.email}</p>
                <div className="mt-2 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  {profile?.role}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Organization</p>
                  <p className="font-medium">{profile?.organization || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
                  <Shield className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>
            </Card>
          </div>
          
          <div className="md:col-span-3">
            <Tabs defaultValue="settings">
              <TabsList className="mb-4">
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Profile Settings
                </TabsTrigger>
                <TabsTrigger value="systems">
                  <Box className="h-4 w-4 mr-2" />
                  My Systems
                </TabsTrigger>
                <TabsTrigger value="monitoring">
                  <Bell className="h-4 w-4 mr-2" />
                  OEM Monitoring
                </TabsTrigger>
                <TabsTrigger value="subscription">
                  <Zap className="h-4 w-4 mr-2" />
                  Subscription
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <div className="flex mt-1">
                          <Input 
                            id="fullName" 
                            defaultValue={profile?.full_name || ''} 
                            className="rounded-r-none"
                          />
                          <Button 
                            onClick={(e) => {
                              const input = document.getElementById('fullName') as HTMLInputElement;
                              updateProfile('full_name', input.value);
                            }}
                            className="rounded-l-none"
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="organization">Organization</Label>
                        <div className="flex mt-1">
                          <Input 
                            id="organization" 
                            defaultValue={profile?.organization || ''} 
                            className="rounded-r-none"
                          />
                          <Button 
                            onClick={(e) => {
                              const input = document.getElementById('organization') as HTMLInputElement;
                              updateProfile('organization', input.value);
                            }}
                            className="rounded-l-none"
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select 
                          defaultValue={profile?.role || 'user'} 
                          onValueChange={(value) => updateProfile('role', value)}
                        >
                          <SelectTrigger id="role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="user">Standard User</SelectItem>
                            <SelectItem value="guest">Guest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="systems">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">My Systems</h3>
                  <p className="text-gray-500 mb-4">
                    Add the systems you want to monitor for vulnerabilities. You will receive alerts specific to these systems.
                  </p>
                  
                  <div className="flex gap-2 mb-6">
                    <Input 
                      placeholder="Add a system (e.g., Windows 11, Ubuntu 22.04)" 
                      value={newSystem}
                      onChange={(e) => setNewSystem(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={addSystem}>Add</Button>
                  </div>
                  
                  {systems.length > 0 ? (
                    <div className="space-y-2">
                      {systems.map((system) => (
                        <div key={system} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span>{system}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeSystem(system)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No systems added yet. Add systems to receive targeted vulnerability alerts.
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="monitoring">
                <OEMMonitorList userSystems={systems} userId={profile?.id || ''} />
              </TabsContent>
              
              <TabsContent value="subscription">
                <SubscriptionPlans currentUserRole={profile?.role || 'user'} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
