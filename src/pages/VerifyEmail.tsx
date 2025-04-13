
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
      // Get token and email from URL
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token');
      const email = searchParams.get('email');
      
      if (!token || !email) {
        setError('Invalid verification link. Missing token or email.');
        setVerifying(false);
        return;
      }
      
      if (!user) {
        setError('You must be logged in to verify an email. Please log in and try again.');
        setVerifying(false);
        return;
      }
      
      console.log(`Verifying email ${email} with token ${token} for user ${user.id}`);
      
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
        setError('No notification settings found for your account.');
        setVerifying(false);
        return;
      }
      
      const monitoringSettings = typeof userSystemData.monitoring_settings === 'string' 
        ? JSON.parse(userSystemData.monitoring_settings)
        : userSystemData.monitoring_settings || {};
      
      // Verify the token against the pending verification data
      const pendingVerification = monitoringSettings.pendingVerification || {};
      
      if (pendingVerification.email !== email || pendingVerification.token !== token) {
        setError('Invalid verification token or email. Please request a new verification link.');
        setVerifying(false);
        return;
      }
      
      // Check if token is expired
      if (pendingVerification.expiresAt && new Date(pendingVerification.expiresAt) < new Date()) {
        setError('Verification link has expired. Please request a new one in your notification settings.');
        setVerifying(false);
        return;
      }
      
      // Update the email verification status
      if (!monitoringSettings.notificationPreferences) {
        monitoringSettings.notificationPreferences = {
          emailEnabled: true,
          emailAddress: email,
          emailVerified: true,
          smsEnabled: false,
          phoneNumber: '',
          alertLevel: 'all'
        };
      } else {
        // Update existing notification preferences
        monitoringSettings.notificationPreferences.emailAddress = email;
        monitoringSettings.notificationPreferences.emailVerified = true;
      }
      
      // Remove the pending verification data
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
      console.error('Error verifying email:', err);
      setError('An error occurred while verifying your email. Please try again later.');
    } finally {
      setVerifying(false);
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
