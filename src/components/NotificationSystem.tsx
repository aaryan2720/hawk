
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Clock, AlertTriangle, Save } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MonitoringSettings } from '@/types';

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailAddress: string;
  phoneNumber: string;
  alertLevel: string;
  frequency: string;
  timeframe: string;
}

const NotificationSystem: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    smsEnabled: false,
    emailAddress: user?.email || '',
    phoneNumber: '',
    alertLevel: 'critical',
    frequency: 'immediate',
    timeframe: 'any'
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('user_systems')
        .select('monitoring_settings')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user settings:', error);
        return;
      }
      
      if (data?.monitoring_settings) {
        // Parse monitoring settings safely
        const monSettings = typeof data.monitoring_settings === 'string' 
          ? JSON.parse(data.monitoring_settings) 
          : data.monitoring_settings;
        
        if (monSettings.notificationPreferences) {
          const prefs = monSettings.notificationPreferences;
          setSettings({
            emailEnabled: prefs.emailEnabled ?? true,
            smsEnabled: prefs.smsEnabled ?? false,
            emailAddress: prefs.emailAddress || user.email || '',
            phoneNumber: prefs.phoneNumber || '',
            alertLevel: prefs.alertLevel || 'critical',
            frequency: prefs.frequency || 'immediate',
            timeframe: prefs.timeframe || 'any'
          });
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEmail = () => {
    setSettings(prev => ({
      ...prev,
      emailEnabled: !prev.emailEnabled
    }));
  };

  const handleToggleSMS = () => {
    setSettings(prev => ({
      ...prev,
      smsEnabled: !prev.smsEnabled
    }));
  };

  const handleChange = (field: keyof NotificationSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get current user settings
      const { data: currentSettings, error: fetchError } = await supabase
        .from('user_systems')
        .select('monitoring_settings')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is fine - we'll create new settings
        console.error('Error fetching current settings:', fetchError);
        throw fetchError;
      }
      
      // Parse existing settings safely
      const existingSettings = currentSettings?.monitoring_settings 
        ? (typeof currentSettings.monitoring_settings === 'string' 
            ? JSON.parse(currentSettings.monitoring_settings) 
            : currentSettings.monitoring_settings) 
        : {};
      
      // Prepare updated settings with notification preferences
      const updatedSettings = {
        ...existingSettings,
        notificationPreferences: {
          emailEnabled: settings.emailEnabled,
          smsEnabled: settings.smsEnabled,
          emailAddress: settings.emailAddress,
          phoneNumber: settings.phoneNumber,
          alertLevel: settings.alertLevel,
          frequency: settings.frequency,
          timeframe: settings.timeframe
        }
      };
      
      // Check if we need to insert or update
      if (!currentSettings) {
        // Insert new record if none exists
        const { error: insertError } = await supabase
          .from('user_systems')
          .insert({
            user_id: user.id,
            system_name: 'Default System',
            monitoring_settings: updatedSettings
          });
          
        if (insertError) throw insertError;
      } else {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_systems')
          .update({ monitoring_settings: updatedSettings })
          .eq('user_id', user.id);
          
        if (updateError) throw updateError;
      }
      
      toast.success('Notification settings saved successfully');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Create a test notification using the RPC function
      try {
        const { error } = await supabase.rpc('create_test_notification', {
          user_id_param: user.id,
          title_param: 'Test Notification',
          content_param: 'This is a test notification from HAWK Security.',
          type_param: 'test',
          is_read_param: false,
          metadata_param: {
            test: true,
            timestamp: new Date().toISOString()
          }
        });
        
        if (error) throw error;
      } catch (innerError) {
        console.error('Error creating notification with RPC:', innerError);
        
        // Fallback to direct insert
        const { error: insertError } = await (supabase as any)
          .from('notifications')
          .insert({
            user_id: user.id,
            title: 'Test Notification',
            content: 'This is a test notification from HAWK Security.',
            type: 'test',
            is_read: false,
            metadata: {
              test: true,
              timestamp: new Date().toISOString()
            }
          });
        
        if (insertError) throw insertError;
      }
      
      // Send real email/SMS if enabled
      if (settings.emailEnabled && settings.emailAddress) {
        // Call the send-notifications edge function
        const { error: notifyError } = await supabase.functions.invoke('send-notifications', {
          body: {
            userId: user.id,
            scanResults: [{
              severity: 'test',
              title: 'Test Notification',
              description: 'This is a test notification from HAWK Security.',
              system: 'Test System'
            }],
            scanType: 'test',
            severity: 'test'
          }
        });
        
        if (notifyError) {
          console.error('Error sending notification:', notifyError);
        }
      }
      
      toast.success('Test notification sent successfully');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>Notification Settings</CardTitle>
        </div>
        <CardDescription>Configure how and when you receive vulnerability alerts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="email-notifications">Email Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Receive alerts via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailEnabled}
              onCheckedChange={handleToggleEmail}
            />
          </div>
          
          {settings.emailEnabled && (
            <div className="ml-6 pl-2 border-l-2 border-muted">
              <Label htmlFor="email-address" className="text-sm">Email Address</Label>
              <Input
                id="email-address"
                type="email"
                placeholder="your@email.com"
                value={settings.emailAddress}
                onChange={(e) => handleChange('emailAddress', e.target.value)}
                className="mt-1"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Receive alerts via text message
              </p>
            </div>
            <Switch
              id="sms-notifications"
              checked={settings.smsEnabled}
              onCheckedChange={handleToggleSMS}
            />
          </div>
          
          {settings.smsEnabled && (
            <div className="ml-6 pl-2 border-l-2 border-muted">
              <Label htmlFor="phone-number" className="text-sm">Phone Number</Label>
              <Input
                id="phone-number"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={settings.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>
        
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Alert Preferences
          </h3>
          
          <div>
            <Label htmlFor="alert-level" className="text-sm">Alert Level</Label>
            <RadioGroup 
              defaultValue={settings.alertLevel}
              value={settings.alertLevel}
              onValueChange={(value) => handleChange('alertLevel', value)}
              className="flex flex-col space-y-1 mt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="critical" id="alert-critical" />
                <Label htmlFor="alert-critical" className="text-sm font-normal">Critical vulnerabilities only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="alert-high" />
                <Label htmlFor="alert-high" className="text-sm font-normal">High and critical vulnerabilities</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="alert-all" />
                <Label htmlFor="alert-all" className="text-sm font-normal">All vulnerabilities</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="alert-frequency" className="text-sm">Notification Frequency</Label>
              <Select 
                defaultValue={settings.frequency}
                value={settings.frequency}
                onValueChange={(value) => handleChange('frequency', value)}
              >
                <SelectTrigger id="alert-frequency" className="mt-1">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="hourly">Hourly digest</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="weekly">Weekly digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="alert-timeframe" className="text-sm">Notification Timeframe</Label>
              <Select 
                defaultValue={settings.timeframe}
                value={settings.timeframe}
                onValueChange={(value) => handleChange('timeframe', value)}
              >
                <SelectTrigger id="alert-timeframe" className="mt-1">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any time</SelectItem>
                  <SelectItem value="business">Business hours only (9AM-5PM)</SelectItem>
                  <SelectItem value="custom">Custom schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={handleTestNotification}
            disabled={isLoading}
          >
            Send Test Notification
          </Button>
          
          <Button 
            onClick={handleSaveSettings}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSystem;
