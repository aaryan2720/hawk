
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
      
      // First, check if the token exists and is valid
      const { data: tokenData, error: tokenError } = await supabase
        .from('verification_tokens')
        .select('*')
        .eq('token', token)
        .eq('email', email)
        .eq('is_verified', false)
        .eq('type', 'email_verification')
        .single();
      
      if (tokenError || !tokenData) {
        setError('Invalid or expired verification token. The link may have expired or already been used.');
        setVerifying(false);
        return;
      }
      
      // Check if the token belongs to the current user
      if (tokenData.user_id !== user.id) {
        setError('This verification link belongs to a different user account.');
        setVerifying(false);
        return;
      }
      
      // Check if the token is expired
      if (new Date(tokenData.expires_at) < new Date()) {
        setError('This verification link has expired. Please request a new one.');
        setVerifying(false);
        return;
      }
      
      // Mark the token as verified
      const { error: updateError } = await supabase
        .from('verification_tokens')
        .update({ is_verified: true })
        .eq('id', tokenData.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Update the user's notification settings to mark this email as verified
      const { data: userSystemData, error: systemError } = await supabase
        .from('user_systems')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (systemError && systemError.code !== 'PGRST116') {
        throw systemError;
      }
      
      if (userSystemData) {
        const settings = userSystemData.monitoring_settings || {};
        const monitoringSettings = typeof settings === 'string' 
          ? JSON.parse(settings)
          : settings;
        
        if (monitoringSettings.notificationPreferences && 
            monitoringSettings.notificationPreferences.emailAddress === email) {
          
          // Update the emailVerified flag
          monitoringSettings.notificationPreferences.emailVerified = true;
          
          const { error: updateSettingsError } = await supabase
            .from('user_systems')
            .update({ monitoring_settings: monitoringSettings })
            .eq('id', userSystemData.id);
          
          if (updateSettingsError) {
            throw updateSettingsError;
          }
        }
      }
      
      setSuccess(true);
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
              <Alert variant="success" className="bg-green-50 border-green-200">
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

