
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('architecture', 'admin', 'premium', 'basic');

-- Create enum for subscription plans
CREATE TYPE public.subscription_plan AS ENUM ('basic', 'premium', 'company');

-- Update profiles table to include role and subscription information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_role public.user_role DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS subscription_plan public.subscription_plan DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS features_enabled JSONB DEFAULT '{"maxSystems": 5, "realTimeMonitoring": false, "advancedReports": false, "apiAccess": false, "prioritySupport": false}'::jsonb;

-- Create subscription plans table for plan definitions
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name public.subscription_plan NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',
  limitations JSONB NOT NULL DEFAULT '{}',
  max_systems INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (plan_name, display_name, description, price_monthly, price_yearly, features, limitations, max_systems) VALUES
('basic', 'Basic', 'Essential security monitoring for small teams', 0, 0, 
 '{"systemMonitoring": 5, "vulnerabilityChecks": "daily", "emailAlerts": "basic", "dashboard": "standard", "dataRefresh": "24-hour"}'::jsonb,
 '{"realTimeAlerts": false, "oemSources": "limited", "aiRiskAnalysis": false, "smsAlerts": false}'::jsonb, 5),
('premium', 'Premium', 'Advanced monitoring for security teams', 29.99, 299.99,
 '{"systemMonitoring": "unlimited", "vulnerabilityChecks": "hourly", "emailAlerts": "priority", "dashboard": "enhanced", "aiRiskAnalysis": true, "smsNotifications": true, "oemSources": 20}'::jsonb,
 '{"apiAccess": "limited", "support": "standard"}'::jsonb, NULL),
('company', 'Company', 'Complete solution for organizations', 99.99, 999.99,
 '{"systemMonitoring": "unlimited", "vulnerabilityChecks": "real-time", "oemSources": "unlimited", "apiAccess": "full", "customIntegrations": true, "advancedAI": true, "dedicatedManager": true, "prioritySupport": true, "onPremiseOption": true}'::jsonb,
 '{}'::jsonb, NULL);

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policy for subscription_plans (public read access)
CREATE POLICY "Public can read subscription plans" ON public.subscription_plans
FOR SELECT USING (true);

-- Create function to automatically assign user roles based on email domain
CREATE OR REPLACE FUNCTION public.assign_user_role_and_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  assigned_role public.user_role;
  assigned_plan public.subscription_plan;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = NEW.id;
  
  -- Assign role and plan based on email domain
  IF user_email LIKE '%@hawk.com' THEN
    -- Hawk domain users get architecture role and premium plan
    assigned_role := 'architecture';
    assigned_plan := 'premium';
  ELSIF user_email LIKE '%@company.com' OR user_email LIKE '%@enterprise.%' THEN
    -- Company domains get premium by default
    assigned_role := 'premium';
    assigned_plan := 'premium';
  ELSE
    -- Default users get basic
    assigned_role := 'basic';
    assigned_plan := 'basic';
  END IF;
  
  -- Update the profile with the assigned role and plan
  NEW.user_role := assigned_role;
  NEW.subscription_plan := assigned_plan;
  
  -- Set features based on plan
  CASE assigned_plan
    WHEN 'basic' THEN
      NEW.features_enabled := '{"maxSystems": 5, "realTimeMonitoring": false, "advancedReports": false, "apiAccess": false, "prioritySupport": false}';
    WHEN 'premium' THEN
      NEW.features_enabled := '{"maxSystems": -1, "realTimeMonitoring": true, "advancedReports": true, "apiAccess": "limited", "prioritySupport": true}';
    WHEN 'company' THEN
      NEW.features_enabled := '{"maxSystems": -1, "realTimeMonitoring": true, "advancedReports": true, "apiAccess": "full", "prioritySupport": true, "dedicatedSupport": true}';
  END CASE;
  
  RETURN NEW;
END;
$$;

-- Update the existing trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, organization, role)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'organization',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger to assign roles after profile creation
CREATE TRIGGER assign_role_and_plan_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_user_role_and_plan();

-- Create RLS policies for role-based access
CREATE POLICY "Users can view own profile with role info" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Architecture team can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.user_role = 'architecture'
  )
);
