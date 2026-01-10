
import { useState, useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationSettings } from './types';
import { useAuth } from '@/hooks/useAuth';
import { Json } from '@/integrations/supabase/types';

const notificationSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  emailAddress: z.string(),
  phoneNumber: z.string(),
  alertLevel: z.string(),
  frequency: z.string(),
  timeframe: z.string(),
  emailVerified: z.boolean().optional()
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export const useNotificationSettings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [debug, setDebug] = useState<string | null>(null);
  
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailEnabled: true,
      smsEnabled: false,
      emailAddress: '',
      phoneNumber: '',
      alertLevel: 'critical',
      frequency: 'immediate',
      timeframe: 'any',
      emailVerified: true
    }
  });

  const { watch, setValue, reset } = form;
  const emailEnabled = watch('emailEnabled');
  const smsEnabled = watch('smsEnabled');
  const emailAddress = watch('emailAddress');
  
  // Auto-verify all emails - skip verification
  useEffect(() => {
    if (emailAddress) {
      setValue('emailVerified', true);
    }
  }, [emailAddress, setValue]);

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
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data?.monitoring_settings) {
        console.log("Found settings in database:", data.monitoring_settings);
        const monSettings = typeof data.monitoring_settings === 'string' 
          ? JSON.parse(data.monitoring_settings) 
          : data.monitoring_settings;
        
        if (monSettings.notificationPreferences) {
          console.log("Loaded settings:", monSettings.notificationPreferences);
          
          // Always allow the user to edit the email address - don't override with user's auth email
          const savedEmailAddress = monSettings.notificationPreferences.emailAddress || '';
          
          reset({
            emailEnabled: monSettings.notificationPreferences.emailEnabled ?? true,
            smsEnabled: monSettings.notificationPreferences.smsEnabled ?? false,
            emailAddress: savedEmailAddress,
            phoneNumber: monSettings.notificationPreferences.phoneNumber || '',
            alertLevel: monSettings.notificationPreferences.alertLevel || 'critical',
            frequency: monSettings.notificationPreferences.frequency || 'immediate',
            timeframe: monSettings.notificationPreferences.timeframe || 'any',
            emailVerified: true
          });
        }
      } else {
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

  // Only set the auth email as default if no email is already set
  useEffect(() => {
    if (user && !form.getValues().emailAddress) {
      setValue('emailAddress', user.email || '');
    }
  }, [user, form, setValue]);

  // Fetch settings on component mount and when user changes
  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const initializeDefaultSettings = async () => {
    if (!user) return;
    
    try {
      const defaultSettings = {
        notificationPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          emailAddress: user.email || '',
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

  const handleSaveSettings = async (values: NotificationFormValues) => {
    if (!user) {
      toast.error("You must be logged in to save settings");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Saving notification settings:", values);
      
      // Always set email as verified
      const updatedValues = { ...values, emailVerified: true };
      
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
        emailEnabled: updatedValues.emailEnabled,
        smsEnabled: updatedValues.smsEnabled,
        emailAddress: updatedValues.emailAddress, // Use the exact email from the form
        phoneNumber: updatedValues.phoneNumber,
        alertLevel: updatedValues.alertLevel,
        frequency: updatedValues.frequency,
        timeframe: updatedValues.timeframe,
        emailVerified: true
      };
      
      // Fix: Make sure monitoringSettings is always an object
      let monitoringSettings: Record<string, unknown> = {};
      
      if (existingSystem?.monitoring_settings) {
        // Get the existing monitoring_settings and parse it if necessary
        if (typeof existingSystem.monitoring_settings === 'string') {
          monitoringSettings = JSON.parse(existingSystem.monitoring_settings);
        } else if (existingSystem.monitoring_settings !== null && typeof existingSystem.monitoring_settings === 'object') {
          // Safe spread of object
          monitoringSettings = { ...existingSystem.monitoring_settings as Record<string, unknown> };
        }
      }
      
      // Update only the notificationPreferences part while preserving other settings
      monitoringSettings = {
        ...monitoringSettings,
        notificationPreferences
      };
      
      console.log("Saving monitoring settings:", monitoringSettings);
      
      // Initialize or create user_system record
      if (!existingSystem) {
        console.log("Creating new user_system record");
        const { error: insertError } = await supabase
          .from('user_systems')
          .insert([{
            user_id: user.id,
            system_name: 'Default System',
            monitoring_settings: monitoringSettings as Json
          }]);
          
        if (insertError) throw insertError;
      } else {
        console.log("Updating existing user_system record");
        const { error: updateError } = await supabase
          .from('user_systems')
          .update({ 
            monitoring_settings: monitoringSettings as Json
          })
          .eq('id', existingSystem.id);
          
        if (updateError) throw updateError;
      }
      
      setEmailVerificationSent(false);
      
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

  return {
    form: form as unknown as UseFormReturn<NotificationSettings>,
    isLoading,
    saveSuccess,
    emailVerificationSent,
    debug,
    setDebug,
    emailEnabled,
    smsEnabled,
    handleSaveSettings: handleSaveSettings as (values: NotificationSettings) => Promise<void>,
    fetchSettings
  };
};
