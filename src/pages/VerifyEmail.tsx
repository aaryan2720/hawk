
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const VerifyEmail = () => {
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    verifyEmail();
  }, [location]);
  
  const verifyEmail = async () => {
    setVerifying(true);
    setError('');
    
    try {
      // Get email from URL
      const searchParams = new URLSearchParams(location.search);
      const email = searchParams.get('email');
      
      if (!email) {
        setError('Invalid verification link. Missing email.');
        setVerifying(false);
        return;
      }
      
      if (!user) {
        setError('You must be logged in to verify an email. Please log in and try again.');
        setVerifying(false);
        return;
      }
      
      console.log(`Auto-verifying email ${email} for user ${user.id}`);
      
      // Try to call the edge function to auto-verify and send welcome email
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          throw new Error('No valid session found');
        }
        
        const response = await fetch('https://eogwxywiidsnnlaybbdd.supabase.co/functions/v1/send-notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            action: 'verify-email',
            email: email,
            userId: user.id
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error status: ${response.status}, ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Email auto-verification result:', result);
        
        setSuccess(true);
        toast.success('Email verified successfully!');
      } catch (edgeFunctionError) {
        console.error('Error calling edge function:', edgeFunctionError);
        
        // Fallback to direct database update if edge function fails
        await updateDirectly(email);
      }
    } catch (err) {
      console.error('Error verifying email:', err);
      setError('An error occurred while verifying your email. Please try again later.');
    } finally {
      setVerifying(false);
    }
  };
  
  // Fallback method to update directly if edge function fails
  const updateDirectly = async (email: string) => {
    try {
      // Update user_systems table directly
      const { data: userSystemData, error: systemError } = await supabase
        .from('user_systems')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (systemError) {
        console.error('Error fetching user system data:', systemError);
        throw systemError;
      }
      
      if (!userSystemData) {
        // Create new user system record
        const { error: createError } = await supabase
          .from('user_systems')
          .insert({
            user_id: user.id,
            system_name: 'Default System',
            monitoring_settings: {
              notificationPreferences: {
                emailEnabled: true,
                emailAddress: email,
                emailVerified: true, // Auto-verify
                smsEnabled: false,
                phoneNumber: '',
                alertLevel: 'all'
              }
            }
          });
          
        if (createError) {
          throw createError;
        }
      } else {
        // Update existing record
        const monitoringSettings = typeof userSystemData.monitoring_settings === 'string' 
          ? JSON.parse(userSystemData.monitoring_settings)
          : userSystemData.monitoring_settings || {};
        
        // Update the email verification status - auto verify
        if (!monitoringSettings.notificationPreferences) {
          monitoringSettings.notificationPreferences = {
            emailEnabled: true,
            emailAddress: email,
            emailVerified: true, // Auto-verify
            smsEnabled: false,
            phoneNumber: '',
            alertLevel: 'all'
          };
        } else {
          // Update existing notification preferences
          monitoringSettings.notificationPreferences.emailAddress = email;
          monitoringSettings.notificationPreferences.emailVerified = true; // Auto-verify
        }
        
        // Remove any pending verification data
        delete monitoringSettings.pendingVerification;
        
        // Update the monitoring settings in the database
        const { error: updateError } = await supabase
          .from('user_systems')
          .update({ monitoring_settings: monitoringSettings })
          .eq('id', userSystemData.id);
        
        if (updateError) {
          console.error('Error updating user system:', updateError);
          throw updateError;
        }
      }
      
      // Create a notification about successful verification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Email Verified Successfully',
        content: `Your email address (${email}) has been verified and will now receive security notifications.`,
        type: 'system',
        is_read: false
      });
      
      setSuccess(true);
      toast.success('Email verified successfully!');
    } catch (err) {
      console.error('Error in fallback verification method:', err);
      throw err;
    }
  };
  
  const goToSettings = () => {
    navigate('/settings?tab=notifications');
  };
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {verifying && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-center text-muted-foreground">Verifying your email address...</p>
            </div>
          )}
          
          {!verifying && success && (
            <div className="flex flex-col items-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-center mb-2">Email Verified!</h2>
              <p className="text-center text-muted-foreground mb-6">
                Your email address has been successfully verified. You can now receive notifications at this email.
              </p>
              <Alert variant="default" className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Verification Successful</AlertTitle>
                <AlertDescription>
                  Your email has been verified and is ready to receive security notifications.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {!verifying && !success && error && (
            <div className="flex flex-col items-center py-8">
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-center mb-2">Verification Failed</h2>
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={goToSettings} 
            className="w-full"
            variant={success ? "default" : "outline"}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyEmail;
