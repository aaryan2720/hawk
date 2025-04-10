
import React, { useState, useEffect } from 'react';
import DashboardNav from '@/components/DashboardNav';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, Shield, User, Lock, Server, Settings as SettingsIcon } from 'lucide-react';
import NotificationSystem from '@/components/NotificationSystem';
import NotificationCenter from '@/components/NotificationCenter';
import NotificationRules from '@/components/NotificationRules';

const Settings = () => {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'notifications');
  
  // Update active tab when URL search params change
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  
  // Update the URL when the tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary/70">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">HAWK Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your security preferences and notification settings
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications">
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="security">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="account">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Account</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="api">
              <span className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className="hidden sm:inline">API</span>
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications" className="mt-4 space-y-6">
            <NotificationSystem />
            
            <NotificationRules />
            
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <CardTitle>Recent Notifications</CardTitle>
                  </div>
                  <CardDescription>View your recent security alerts and notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationCenter />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="security" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <CardTitle>Security Settings</CardTitle>
                </div>
                <CardDescription>Configure security preferences and authentication options</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Security settings will be implemented in the future.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Account Settings</CardTitle>
                </div>
                <CardDescription>Manage your account information and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Account settings will be implemented in the future.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="api" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  <CardTitle>API Configuration</CardTitle>
                </div>
                <CardDescription>Configure API keys and integrations</CardDescription>
              </CardHeader>
              <CardContent>
                <p>API settings will be implemented in the future.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
