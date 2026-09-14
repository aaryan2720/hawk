
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useArchitectureTracking = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const trackActivity = async () => {
      const sessionId = sessionStorage.getItem('session_id') || generateSessionId();
      sessionStorage.setItem('session_id', sessionId);

      console.log('Tracking user activity:', user.id, location.pathname);

      try {
        // Track session activity with more detailed metadata
        const { error: sessionError } = await supabase.from('architecture_sessions').insert({
          user_id: user.id,
          session_id: sessionId,
          current_page: location.pathname,
          previous_page: sessionStorage.getItem('previous_page'),
          action_type: 'navigation',
          metadata: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            windowSize: {
              width: window.innerWidth,
              height: window.innerHeight
            },
            screenSize: {
              width: screen.width,
              height: screen.height
            }
          },
          user_agent: navigator.userAgent,
          ip_address: await getClientIP()
        });

        if (sessionError) {
          console.error('Error inserting session:', sessionError);
          return;
        }

        // Update user flow tracking with real-time data
        const { data: existingFlow, error: flowSelectError } = await supabase
          .from('user_flow_tracking')
          .select('*')
          .eq('user_id', user.id)
          .eq('session_id', sessionId)
          .maybeSingle();

        if (flowSelectError) {
          console.error('Error fetching existing flow:', flowSelectError);
          return;
        }

        const currentPath = [...(existingFlow?.flow_path || []), location.pathname];
        const userRole = getUserRole(user);

        if (existingFlow) {
          const { error: updateError } = await supabase
            .from('user_flow_tracking')
            .update({
              flow_path: currentPath,
              current_level: currentPath.length,
              user_role: userRole,
              last_activity: new Date().toISOString(),
              status: 'active'
            })
            .eq('id', existingFlow.id);

          if (updateError) {
            console.error('Error updating flow:', updateError);
          }
        } else {
          const { error: insertError } = await supabase.from('user_flow_tracking').insert({
            user_id: user.id,
            session_id: sessionId,
            flow_path: currentPath,
            current_level: 1,
            user_role: userRole,
            status: 'active',
            last_activity: new Date().toISOString()
          });

          if (insertError) {
            console.error('Error inserting flow:', insertError);
          }
        }

        sessionStorage.setItem('previous_page', location.pathname);
        console.log('Successfully tracked user activity');
      } catch (error) {
        console.error('Error tracking architecture activity:', error);
      }
    };

    trackActivity();
  }, [location, user]);

  const trackAction = async (actionType: string, metadata: any = {}) => {
    if (!user) return;

    const sessionId = sessionStorage.getItem('session_id') || generateSessionId();
    
    console.log('Tracking action:', actionType, metadata);
    
    try {
      const { error } = await supabase.from('architecture_sessions').insert({
        user_id: user.id,
        session_id: sessionId,
        current_page: location.pathname,
        previous_page: sessionStorage.getItem('previous_page'),
        action_type: actionType,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        },
        user_agent: navigator.userAgent
      });

      if (error) {
        console.error('Error tracking action:', error);
      } else {
        console.log('Successfully tracked action:', actionType);
      }
    } catch (error) {
      console.error('Error tracking action:', error);
    }
  };

  return { trackAction };
};

const generateSessionId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const getUserRole = (user: any) => {
  if (user.email === 'architecture@hawk.com') return 'architecture';
  if (user.email?.includes('admin')) return 'admin';
  if (user.email?.includes('premium')) return 'premium';
  return 'user';
};

const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return null;
  }
};
