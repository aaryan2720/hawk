
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import SubscriptionPlans from '@/components/SubscriptionPlans';
import UserRoleCard from '@/components/UserRoleCard';
import { User, Shield, Settings, Bell, CreditCard, ArrowLeft, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import DashboardNav from '@/components/DashboardNav';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user } = useAuth();
  const { profile, loading: roleLoading, userRole, subscriptionPlan, isHawkDomain } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('account');

  useEffect(() => {
    if (!roleLoading) {
      setLoading(false);
    }
  }, [roleLoading]);

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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'architecture':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><Crown className="h-3 w-3 mr-1" />Architecture</Badge>;
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'premium':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Premium</Badge>;
      case 'basic':
        return <Badge variant="outline">Basic</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'company':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Company</Badge>;
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Premium</Badge>;
      case 'basic':
        return <Badge variant="outline">Basic</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Account</h1>
              <p className="text-blue-100">Manage your account settings and subscription</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getRoleBadge(userRole)}
              {getPlanBadge(subscriptionPlan)}
              {isHawkDomain() && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  HAWK Domain
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* User Role and Capabilities Card */}
        <UserRoleCard />
        
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
                      
                      {profile?.full_name && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                          <p className="text-lg">{profile.full_name}</p>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">User Role</label>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(userRole)}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Subscription Plan</label>
                        <div className="flex items-center gap-2">
                          {getPlanBadge(subscriptionPlan)}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
                        <p className="text-lg">{new Date(user.created_at).toLocaleDateString()}</p>
                      </div>

                      {profile?.organization && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Organization</label>
                          <p className="text-lg">{profile.organization}</p>
                        </div>
                      )}

                      {isHawkDomain() && (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            <strong>HAWK Domain Access:</strong> You have premium features and architecture team access.
                          </p>
                        </div>
                      )}
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
                <SubscriptionPlans />
              </div>
            )}
            
            {activeTab === 'security' && (
              <Card className="p-8">
                <h2 className="text-2xl font-semibold mb-6">Security Settings</h2>
                <Separator className="mb-6" />
                <p className="text-gray-500 mb-4">Manage your security preferences and account protection.</p>
                <Button className="mt-4">Change Password</Button>
              </Card>
            )}
            
            {activeTab === 'notifications' && (
              <Card className="p-8">
                <h2 className="text-2xl font-semibold mb-6">Notification Preferences</h2>
                <Separator className="mb-6" />
                <p className="text-gray-500 mb-4">Control how you receive alerts and updates.</p>
              </Card>
            )}
            
            {activeTab === 'settings' && (
              <Card className="p-8">
                <h2 className="text-2xl font-semibold mb-6">General Settings</h2>
                <Separator className="mb-6" />
                <p className="text-gray-500 mb-4">Customize your account experience.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
