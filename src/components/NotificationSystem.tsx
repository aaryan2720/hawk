
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
  const { user, session } = useAuth();
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

  const { watch, setValue, reset } = form;
  const emailEnabled = watch('emailEnabled');
  const smsEnabled = watch('smsEnabled');
  const emailAddress = watch('emailAddress');
  const isEmailVerified = watch('emailVerified');

  // Fetch settings on component mount and when user changes
  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  // Auto-verify email if it's the same as user's login email
  useEffect(() => {
    if (user && emailAddress === user.email) {
      setValue('emailVerified', true);
    } else if (emailAddress && emailAddress !== user?.email) {
      // If it's a different email, check if it's already verified
      checkEmailVerificationStatus(emailAddress);
    }
  }, [emailAddress, user, setValue]);

  const checkEmailVerificationStatus = async (email: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('verification_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('email', email)
        .eq('type', 'email_verification')
        .eq('is_verified', true)
        .maybeSingle();
        
      if (error) {
        console.error('Error checking verification status:', error);
        return;
      }
      
      setValue('emailVerified', !!data);
    } catch (err) {
      console.error('Error checking email verification:', err);
    }
  };

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log("Fetching settings for user:", user.id);
      
      const { data, error } = await supabase
        .from('user_systems')
        .select('monitoring_settings')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user settings:', error);
        toast.error('Failed to load notification settings');
        return;
      }
      
      if (data?.monitoring_settings) {
        console.log("Found settings in database:", data.monitoring_settings);
        const monSettings = typeof data.monitoring_settings === 'string' 
          ? JSON.parse(data.monitoring_settings) 
          : data.monitoring_settings;
        
        if (monSettings.notificationPreferences) {
          const prefs = monSettings.notificationPreferences;
          
          // Reset form with all settings at once to avoid partial updates
          reset({
            emailEnabled: prefs.emailEnabled ?? true,
            smsEnabled: prefs.smsEnabled ?? false,
            emailAddress: prefs.emailAddress || user.email || '',
            phoneNumber: prefs.phoneNumber || '',
            alertLevel: prefs.alertLevel || 'critical',
            frequency: prefs.frequency || 'immediate',
            timeframe: prefs.timeframe || 'any',
            emailVerified: prefs.emailAddress === user.email ? true : (prefs.emailVerified ?? false)
          });
          
          console.log("Loaded settings:", prefs);
        }
      } else {
        // No settings found, create default settings
        console.log("No settings found for user, creating defaults");
        await initializeDefaultSettings();
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      toast.error('Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultSettings = async () => {
    if (!user) return;
    
    try {
      const defaultSettings = {
        notificationPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          emailAddress: user.email,
          phoneNumber: '',
          alertLevel: 'critical',
          frequency: 'immediate',
          timeframe: 'any',
          emailVerified: true
        }
      };
      
      const { error } = await supabase
        .from('user_systems')
        .insert({
          user_id: user.id,
          system_name: 'Default System',
          monitoring_settings: defaultSettings
        });
        
      if (error) throw error;
      
      reset({
        emailEnabled: true,
        smsEnabled: false,
        emailAddress: user.email || '',
        phoneNumber: '',
        alertLevel: 'critical',
        frequency: 'immediate',
        timeframe: 'any',
        emailVerified: true
      });
    } catch (err) {
      console.error('Error initializing default settings:', err);
    }
  };

  const handleSaveSettings = async (values: NotificationSettings) => {
    if (!user || !session) {
      toast.error("You must be logged in to save settings");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Saving notification settings:", values);
      const emailDifferentFromUser = values.emailEnabled && values.emailAddress !== user.email;
      
      const { data: existingSystem, error: fetchError } = await supabase
        .from('user_systems')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching current settings:', fetchError);
        throw fetchError;
      }
      
      const notificationPreferences = {
        emailEnabled: values.emailEnabled,
        smsEnabled: values.smsEnabled,
        emailAddress: values.emailAddress,
        phoneNumber: values.phoneNumber,
        alertLevel: values.alertLevel,
        frequency: values.frequency,
        timeframe: values.timeframe,
        emailVerified: emailDifferentFromUser ? values.emailVerified : true
      };
      
      const existingSettings = existingSystem?.monitoring_settings || {};
      const monitoringSettings = typeof existingSettings === 'string' 
        ? JSON.parse(existingSettings)
        : existingSettings;
      
      // Ensure we're not overwriting other properties
      monitoringSettings.notificationPreferences = notificationPreferences;
      
      console.log("Saving monitoring settings:", monitoringSettings);
      
      // Initialize or create user_system record
      if (!existingSystem) {
        console.log("Creating new user_system record");
        const { error: insertError } = await supabase
          .from('user_systems')
          .insert({
            user_id: user.id,
            system_name: 'Default System',
            monitoring_settings: monitoringSettings
          });
          
        if (insertError) throw insertError;
      } else {
        console.log("Updating existing user_system record");
        const { error: updateError } = await supabase
          .from('user_systems')
          .update({ 
            monitoring_settings: monitoringSettings
          })
          .eq('id', existingSystem.id);
          
        if (updateError) throw updateError;
      }
      
      if (emailDifferentFromUser && !values.emailVerified) {
        try {
          console.log("Sending verification email to:", values.emailAddress);
          const result = await sendVerificationEmail(values.emailAddress, session.access_token);
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
      
      // Refresh the form with the saved values to ensure state is consistent
      fetchSettings();
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
      setDebug(`Save error: ${JSON.stringify(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const sendVerificationEmail = async (email: string, accessToken: string) => {
    console.log('Sending verification email to:', email);
    
    try {
      const response = await fetch('https://eogwxywiidsnnlaybbdd.supabase.co/functions/v1/send-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
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
    if (!user || !session) {
      toast.error("You must be logged in to test notifications");
      return;
    }
    
    setIsLoading(true);
    try {
      // Save current settings first to ensure test uses latest configuration
      await form.handleSubmit(handleSaveSettings)();
      
      toast.info('Sending test notification...', {
        description: 'This may take a few moments'
      });
      
      // Create an in-app notification first
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
      
      console.log("Sending test notification via edge function");
      const response = await fetch('https://eogwxywiidsnnlaybbdd.supabase.co/functions/v1/send-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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
          severity: 'critical',
          email: emailAddress // Pass the current email address to help with testing
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

