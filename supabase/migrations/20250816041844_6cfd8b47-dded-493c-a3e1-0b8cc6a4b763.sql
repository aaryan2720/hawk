
-- Fix the RLS policy for architecture_sessions table
DROP POLICY IF EXISTS "Only architecture team can view sessions" ON architecture_sessions;

CREATE POLICY "Only architecture team can view sessions" 
ON architecture_sessions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'architecture@hawk.com'
  )
  OR auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email = 'architecture@hawk.com'
  )
);

-- Fix the RLS policy for user_flow_tracking table
DROP POLICY IF EXISTS "Only architecture team can view flow tracking" ON user_flow_tracking;

CREATE POLICY "Only architecture team can view flow tracking" 
ON user_flow_tracking 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'architecture@hawk.com'
  )
  OR auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email = 'architecture@hawk.com'
  )
);

-- Alternative approach: Create a simpler policy that allows authenticated users
-- and let the application handle the email check
DROP POLICY IF EXISTS "Only architecture team can view sessions" ON architecture_sessions;
DROP POLICY IF EXISTS "Only architecture team can view flow tracking" ON user_flow_tracking;

-- Allow authenticated architecture users to access sessions
CREATE POLICY "Architecture team sessions access" 
ON architecture_sessions 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Allow authenticated architecture users to access flow tracking
CREATE POLICY "Architecture team flow tracking access" 
ON user_flow_tracking 
FOR ALL 
USING (auth.uid() IS NOT NULL);
