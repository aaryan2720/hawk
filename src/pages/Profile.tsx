import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SubscriptionPlans from '@/components/SubscriptionPlans';
import { User, Shield, Settings, Bell, CreditCard, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import DashboardNav from '@/components/DashboardNav';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('account');

  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      try {
        if (!user) throw new Error("No user found.");

        let { data, error, status } = await supabase
          .from('profiles')
          .select(`role`)
          .eq('id', user.id)
          .single();

        if (error && status !== 406) {
          throw error;
        }

        if (data) {
          setRole(data.role);
        }
      } catch (error: any) {
        console.error(error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="p-10 max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <Shield className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign in Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to view your profile information</p>
            <Button asChild>
              <a href="/auth/login">Sign In</a>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8 mb-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">My Account</h1>
          <p className="text-blue-100">Manage your account settings and subscription</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <Card className="p-4 sticky top-24">
              <nav className="space-y-1">
                <Button 
                  variant={activeTab === 'account' ? 'default' : 'ghost'} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('account')}
                >
                  <User className="mr-2 h-5 w-5" />
                  Account Details
                </Button>
                <Button 
                  variant={activeTab === 'subscription' ? 'default' : 'ghost'} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('subscription')}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Subscription
                </Button>
                <Button 
                  variant={activeTab === 'security' ? 'default' : 'ghost'} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('security')}
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Security
                </Button>
                <Button 
                  variant={activeTab === 'notifications' ? 'default' : 'ghost'} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('notifications')}
                >
                  <Bell className="mr-2 h-5 w-5" />
                  Notifications
                </Button>
                <Button 
                  variant={activeTab === 'settings' ? 'default' : 'ghost'} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="mr-2 h-5 w-5" />
                  Settings
                </Button>
              </nav>
            </Card>
          </div>
          
          <div className="col-span-1 md:col-span-3">
            {activeTab === 'account' && (
              <Card className="p-8">
                <h2 className="text-2xl font-semibold mb-6">Account Details</h2>
                <Separator className="mb-6" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Profile Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                        <p className="text-lg">{user.email}</p>
                      </div>
                      
                      {user.user_metadata?.full_name && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                          <p className="text-lg">{user.user_metadata.full_name}</p>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Account Type</label>
                        <p className="text-lg capitalize">{role || 'Standard User'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
                        <p className="text-lg">{new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mb-4">
                      {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-16 w-16 text-gray-400" />
                      )}
                    </div>
                    <Button className="mt-2">Update Profile</Button>
                  </div>
                </div>
              </Card>
            )}
            
            {activeTab === 'subscription' && (
              <div className="space-y-8">
                <Card className="p-8">
                  <h2 className="text-2xl font-semibold mb-6">Subscription Management</h2>
                  <Separator className="mb-6" />
                  <SubscriptionPlans currentUserRole={role || 'user'} />
                </Card>
              </div>
            )}
            
            {activeTab === 'security' && (
              <Card className="p-8">
                <h2 className="text-2xl font-semibold mb-6">Security Settings</h2>
                <Separator className="mb-6" />
                <p className="text-gray-500 mb-4">Manage your security preferences and account protection.</p>
                {/* Security settings would go here */}
                <Button className="mt-4">Change Password</Button>
              </Card>
            )}
            
            {activeTab === 'notifications' && (
              <Card className="p-8">
                <h2 className="text-2xl font-semibold mb-6">Notification Preferences</h2>
                <Separator className="mb-6" />
                <p className="text-gray-500 mb-4">Control how you receive alerts and updates.</p>
                {/* Notification settings would go here */}
              </Card>
            )}
            
            {activeTab === 'settings' && (
              <Card className="p-8">
                <h2 className="text-2xl font-semibold mb-6">General Settings</h2>
                <Separator className="mb-6" />
                <p className="text-gray-500 mb-4">Customize your account experience.</p>
                {/* General settings would go here */}
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
