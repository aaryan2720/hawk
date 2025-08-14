
-- Create architecture_sessions table to track user activities and flows
CREATE TABLE public.architecture_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  current_page TEXT NOT NULL,
  previous_page TEXT,
  action_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_flow_tracking table for real-time flow visualization
CREATE TABLE public.user_flow_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  flow_path TEXT[] DEFAULT '{}',
  current_level INTEGER DEFAULT 1,
  user_role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.architecture_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flow_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for architecture access only
CREATE POLICY "Only architecture team can view sessions" 
  ON public.architecture_sessions 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'architecture@hawk.com'
    )
  );

CREATE POLICY "Only architecture team can view flow tracking" 
  ON public.user_flow_tracking 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'architecture@hawk.com'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_architecture_sessions_user_id ON public.architecture_sessions(user_id);
CREATE INDEX idx_architecture_sessions_created_at ON public.architecture_sessions(created_at);
CREATE INDEX idx_user_flow_tracking_user_id ON public.user_flow_tracking(user_id);
CREATE INDEX idx_user_flow_tracking_last_activity ON public.user_flow_tracking(last_activity);
