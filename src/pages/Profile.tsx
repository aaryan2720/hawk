
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertCircle, Check, Loader, Plus, Save, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OEMMonitorList from '@/components/OEMMonitorList';
import SubscriptionPlans from '@/components/SubscriptionPlans';
import { UserProfile, UserSystem } from '@/types';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [systems, setSystems] = useState<string[]>([]);
  const [newSystem, setNewSystem] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingSystems, setIsLoadingSystems] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isAddingSystem, setIsAddingSystem] = useState(false);
  const [editedProfile, setEditedProfile] = useState<{
    full_name?: string;
    organization?: string;
  }>({});

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        
        // Get user profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const userProfile: UserProfile = {
          id: data.id,
          email: user.email || '',
          full_name: data.full_name || '',
          organization: data.organization || '',
          role: data.role as 'admin' | 'user' | 'guest',
          created_at: data.created_at
        };
        
        setProfile(userProfile);
        setEditedProfile({
          full_name: userProfile.full_name,
          organization: userProfile.organization
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    const fetchSystems = async () => {
      try {
        setIsLoadingSystems(true);
        
        // Get user systems
        const { data, error } = await supabase
          .from('user_systems')
          .select('system_name')
          .eq('user_id', user.id);

        if (error) throw error;

        const systemNames = data.map(item => item.system_name);
        setSystems(systemNames);
      } catch (error) {
        console.error('Error fetching systems:', error);
        toast.error('Failed to load systems data');
      } finally {
        setIsLoadingSystems(false);
      }
    };

    fetchProfile();
    fetchSystems();
  }, [user, navigate]);

  const handleUpdateProfile = async () => {
    try {
      if (!user) return;
      
      setIsUpdatingProfile(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.full_name,
          organization: editedProfile.organization,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      if (profile) {
        setProfile({
          ...profile,
          full_name: editedProfile.full_name,
          organization: editedProfile.organization
        });
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddSystem = async () => {
    try {
      if (!user || !newSystem.trim()) return;
      
      setIsAddingSystem(true);
      
      const { error } = await supabase
        .from('user_systems')
        .insert({
          user_id: user.id,
          system_name: newSystem.trim()
        });

      if (error) {
        if (error.code === '23505') { // unique violation
          toast.error('This system is already in your list');
        } else {
          throw error;
        }
        return;
      }
      
      setSystems([...systems, newSystem.trim()]);
      setNewSystem('');
      toast.success('System added successfully');
    } catch (error) {
      console.error('Error adding system:', error);
      toast.error('Failed to add system');
    } finally {
      setIsAddingSystem(false);
    }
  };

  const handleRemoveSystem = async (systemName: string) => {
    try {
      if (!user) return;
      
      const { error } = await supabase
        .from('user_systems')
        .delete()
        .eq('user_id', user.id)
        .eq('system_name', systemName);

      if (error) throw error;
      
      setSystems(systems.filter(s => s !== systemName));
      toast.success('System removed successfully');
    } catch (error) {
      console.error('Error removing system:', error);
      toast.error('Failed to remove system');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen pb-12">
      <Navbar />
      
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your account and monitoring preferences</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src="" alt={profile?.full_name || 'User'} />
                    <AvatarFallback className="text-lg">
                      {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-center">{profile?.full_name || 'User'}</CardTitle>
                  <CardDescription className="text-center">{profile?.email}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Organization:</span>
                    <span className="font-medium">{profile?.organization || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Role:</span>
                    <span className="font-medium capitalize">{profile?.role || 'User'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Member Since:</span>
                    <span className="font-medium">
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString() 
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut} 
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="settings">
              <TabsList className="mb-6">
                <TabsTrigger value="settings">Account Settings</TabsTrigger>
                <TabsTrigger value="systems">My Systems</TabsTrigger>
                <TabsTrigger value="oem">OEM Monitoring</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
              </TabsList>
              
              {/* Account Settings Tab */}
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Update your profile information and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingProfile ? (
                      <div className="flex justify-center items-center p-8">
                        <Loader className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input 
                            id="email" 
                            value={profile?.email || ''} 
                            disabled 
                            className="bg-muted"
                          />
                          <p className="text-sm text-muted-foreground">
                            Contact support to change your email address
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input 
                            id="fullName" 
                            value={editedProfile.full_name || ''} 
                            onChange={(e) => setEditedProfile({...editedProfile, full_name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="organization">Organization</Label>
                          <Input 
                            id="organization" 
                            value={editedProfile.organization || ''} 
                            onChange={(e) => setEditedProfile({...editedProfile, organization: e.target.value})}
                          />
                        </div>
                        <div className="pt-4 flex justify-end">
                          <Button 
                            onClick={handleUpdateProfile}
                            disabled={isUpdatingProfile}
                          >
                            {isUpdatingProfile ? (
                              <Loader className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Save Changes
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* My Systems Tab */}
              <TabsContent value="systems">
                <Card>
                  <CardHeader>
                    <CardTitle>My Systems</CardTitle>
                    <CardDescription>
                      Manage the systems you want to receive security alerts for
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSystems ? (
                      <div className="flex justify-center items-center p-8">
                        <Loader className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Add a system (e.g. Windows 11, Ubuntu Server, etc.)" 
                            value={newSystem}
                            onChange={(e) => setNewSystem(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newSystem.trim()) {
                                e.preventDefault();
                                handleAddSystem();
                              }
                            }}
                          />
                          <Button 
                            onClick={handleAddSystem}
                            disabled={isAddingSystem || !newSystem.trim()}
                          >
                            {isAddingSystem ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        {systems.length === 0 ? (
                          <div className="bg-muted/50 rounded-lg p-6 text-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Systems Added</h3>
                            <p className="text-muted-foreground">
                              Add systems you want to monitor for security vulnerabilities
                            </p>
                          </div>
                        ) : (
                          <div className="border rounded-md divide-y">
                            {systems.map((system, index) => (
                              <div 
                                key={index} 
                                className="flex justify-between items-center p-3"
                              >
                                <span>{system}</span>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => handleRemoveSystem(system)}
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* OEM Monitoring Tab */}
              <TabsContent value="oem">
                <Card>
                  <CardHeader>
                    <CardTitle>OEM Website Monitoring</CardTitle>
                    <CardDescription>
                      Configure vendor websites to be continuously monitored for security alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OEMMonitorList />
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Subscription Tab */}
              <TabsContent value="subscription">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Plans</CardTitle>
                    <CardDescription>
                      Choose a plan that fits your security monitoring needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SubscriptionPlans />
                  </CardContent>
                </Card>
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
