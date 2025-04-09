
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Clock, AlertTriangle, Save, CheckCircle, Info } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MonitoringSettings } from '@/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailAddress: string;
  phoneNumber: string;
  alertLevel: string;
  frequency: string;
  timeframe: string;
  emailVerified?: boolean;
}

const notificationSchema = z.object({
  emailEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  emailAddress: z.string().email("Please enter a valid email address").or(z.string().length(0)),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number").or(z.string().length(0)),
  alertLevel: z.string().default("critical"),
  frequency: z.string().default("immediate"),
  timeframe: z.string().default("any"),
  emailVerified: z.boolean().optional()
});

const NotificationSystem: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [debug, setDebug] = useState<string | null>(null);
  
  const form = useForm<NotificationSettings>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailEnabled: true,
      smsEnabled: false,
      emailAddress: user?.email || '',
      phoneNumber: '',
      alertLevel: 'critical',
      frequency: 'immediate',
      timeframe: 'any',
      emailVerified: true // Default to true for login email
    }
  });

  const { watch, setValue } = form;
  const emailEnabled = watch('emailEnabled');
  const smsEnabled = watch('smsEnabled');
  const emailAddress = watch('emailAddress');
  const isEmailVerified = watch('emailVerified');

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  // Automatically set emailVerified to true if using login email
  useEffect(() => {
    if (user && emailAddress === user.email) {
      setValue('emailVerified', true);
    }
  }, [emailAddress, user]);

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
          
          setValue('emailEnabled', prefs.emailEnabled ?? true);
          setValue('smsEnabled', prefs.smsEnabled ?? false);
          setValue('emailAddress', prefs.emailAddress || user.email || '');
          setValue('phoneNumber', prefs.phoneNumber || '');
          setValue('alertLevel', prefs.alertLevel || 'critical');
          setValue('frequency', prefs.frequency || 'immediate');
          setValue('timeframe', prefs.timeframe || 'any');
          setValue('emailVerified', prefs.emailVerified === undefined ? true : prefs.emailVerified);

          // If using login email, ensure it's marked as verified
          if (prefs.emailAddress === user.email) {
            setValue('emailVerified', true);
          }
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (values: NotificationSettings) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Check if email changed and needs verification
      const emailDifferentFromUser = values.emailEnabled && values.emailAddress !== user.email;
      
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
          emailEnabled: values.emailEnabled,
          smsEnabled: values.smsEnabled,
          emailAddress: values.emailAddress,
          phoneNumber: values.phoneNumber,
          alertLevel: values.alertLevel,
          frequency: values.frequency,
          timeframe: values.timeframe,
          emailVerified: emailDifferentFromUser ? false : (values.emailVerified || false)
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
      
      // If email is different from user's and email notifications are enabled, send verification
      if (emailDifferentFromUser) {
        try {
          console.log("Sending verification email to:", values.emailAddress);
          const result = await sendVerificationEmail(values.emailAddress);
          console.log("Verification email result:", result);
          setEmailVerificationSent(true);
          setDebug(`Verification sent to ${values.emailAddress}. Result: ${JSON.stringify(result)}`);
        } catch (verifyError) {
          console.error('Error sending verification email:', verifyError);
          toast.error('Could not verify alternate email address. Please try again.');
          setDebug(`Error sending verification: ${JSON.stringify(verifyError)}`);
        }
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast.success('Notification settings saved successfully');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
      setDebug(`Save error: ${JSON.stringify(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const sendVerificationEmail = async (email: string) => {
    console.log('Sending verification email to:', email);
    
    try {
      // Call the edge function directly with the required parameters
      const response = await fetch('https://eogwxywiidsnnlaybbdd.functions.supabase.co/send-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.session()?.access_token || ''}`,
        },
        body: JSON.stringify({ 
          action: 'verify-email',
          email: email,
          userId: user?.id
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error status: ${response.status}, ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (e) {
      console.error('Error sending verification email:', e);
      throw e;
    }
  };

  const handleTestNotification = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Create a test notification using direct insert
      const { error: insertError } = await supabase
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
      
      // Also test email/SMS notifications via direct fetch to the edge function
      console.log("Sending test notification via edge function");
      const response = await fetch('https://eogwxywiidsnnlaybbdd.functions.supabase.co/send-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.session()?.access_token || ''}`,
        },
        body: JSON.stringify({ 
          userId: user.id,
          scanResults: [{
            severity: 'critical',
            title: 'Test Vulnerability',
            description: 'This is a test notification to verify your notification settings.',
            system: 'Test System',
            cve: 'TEST-2023-0001'
          }],
          scanType: 'test',
          severity: 'critical'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error status: ${response.status}, ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Test notification response:", data);
      setDebug(`Test notification response: ${JSON.stringify(data)}`);
      
      toast.success('Test notification sent successfully', {
        description: 'Check the notification bell in the top navigation bar and your configured email/SMS if enabled'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
      setDebug(`Test error: ${JSON.stringify(error)}`);
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
        {emailEnabled && emailAddress !== user?.email && !isEmailVerified && (
          <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Email verification required</AlertTitle>
            <AlertDescription className="text-yellow-700">
              You must verify this email address before notifications can be sent to it.
              {emailVerificationSent ? (
                " Please check your inbox and spam folder for the verification link."
              ) : (
                " Save settings to send a verification email."
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveSettings)} className="space-y-6">
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
                <FormField
                  control={form.control}
                  name="emailEnabled"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {emailEnabled && (
                <div className="ml-6 pl-2 border-l-2 border-muted">
                  <FormField
                    control={form.control}
                    name="emailAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Email Address</FormLabel>
                        <FormDescription className="text-xs">
                          You can use a different email than your login email
                        </FormDescription>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="your@email.com"
                            className="mt-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {emailVerificationSent && (
                    <div className="mt-2 text-xs flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Verification email sent. Please check your inbox and spam folder.</span>
                    </div>
                  )}
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
                <FormField
                  control={form.control}
                  name="smsEnabled"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {smsEnabled && (
                <div className="ml-6 pl-2 border-l-2 border-muted">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Phone Number</FormLabel>
                        <FormDescription className="text-xs">
                          Enter your number in international format (+123456789)
                        </FormDescription>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="mt-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alert Preferences
              </h3>
              
              <FormField
                control={form.control}
                name="alertLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Alert Level</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        value={field.value}
                        onValueChange={field.onChange}
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
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Notification Frequency</FormLabel>
                      <Select 
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger id="alert-frequency" className="mt-1">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="hourly">Hourly digest</SelectItem>
                          <SelectItem value="daily">Daily digest</SelectItem>
                          <SelectItem value="weekly">Weekly digest</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="timeframe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Notification Timeframe</FormLabel>
                      <Select 
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger id="alert-timeframe" className="mt-1">
                            <SelectValue placeholder="Select timeframe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="any">Any time</SelectItem>
                          <SelectItem value="business">Business hours only (9AM-5PM)</SelectItem>
                          <SelectItem value="custom">Custom schedule</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleTestNotification}
                disabled={isLoading}
              >
                Send Test Notification
              </Button>
              
              <Button 
                type="submit"
                disabled={isLoading}
                className={saveSuccess ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Saved!
                  </>
                ) : isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
        
        {debug && (
          <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Info className="h-4 w-4" />
              <span>Debug Info:</span>
            </div>
            <pre className="text-xs mt-2 overflow-auto max-h-40 p-2 bg-gray-100 rounded">
              {debug}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSystem;
