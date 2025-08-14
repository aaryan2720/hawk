
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useArchitectureTracking = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const trackActivity = async () => {
      const sessionId = sessionStorage.getItem('session_id') || generateSessionId();
      sessionStorage.setItem('session_id', sessionId);

      // Track session activity
      try {
        await supabase.from('architecture_sessions').insert({
          user_id: user.id,
          session_id: sessionId,
          current_page: location.pathname,
          previous_page: sessionStorage.getItem('previous_page'),
          action_type: 'navigation',
          metadata: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
          },
          user_agent: navigator.userAgent,
          ip_address: await getClientIP()
        });

        // Update user flow tracking
        const { data: existingFlow } = await supabase
          .from('user_flow_tracking')
          .select('*')
          .eq('user_id', user.id)
          .eq('session_id', sessionId)
          .single();

        const currentPath = [...(existingFlow?.flow_path || []), location.pathname];
        const userRole = getUserRole(user);

        if (existingFlow) {
          await supabase
            .from('user_flow_tracking')
            .update({
              flow_path: currentPath,
              current_level: currentPath.length,
              user_role: userRole,
              last_activity: new Date().toISOString()
            })
            .eq('id', existingFlow.id);
        } else {
          await supabase.from('user_flow_tracking').insert({
            user_id: user.id,
            session_id: sessionId,
            flow_path: currentPath,
            current_level: 1,
            user_role: userRole,
            status: 'active',
            last_activity: new Date().toISOString()
          });
        }

        sessionStorage.setItem('previous_page', location.pathname);
      } catch (error) {
        console.error('Error tracking architecture activity:', error);
      }
    };

    trackActivity();
  }, [location, user]);

  const trackAction = async (actionType: string, metadata: any = {}) => {
    if (!user) return;

    const sessionId = sessionStorage.getItem('session_id') || generateSessionId();
    
    try {
      await supabase.from('architecture_sessions').insert({
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
