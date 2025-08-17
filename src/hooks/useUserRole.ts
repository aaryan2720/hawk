
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/types';

export type UserRole = 'architecture' | 'admin' | 'premium' | 'basic';
export type SubscriptionPlan = 'basic' | 'premium' | 'company';

interface UserProfile {
  id: string;
  user_role: UserRole;
  subscription_plan: SubscriptionPlan;
  subscription_status: string;
  features_enabled: Json;
  full_name: string | null;
  organization: string | null;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setProfile(null);
        } else {
          setProfile(data as UserProfile);
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const hasRole = (role: UserRole): boolean => {
    return profile?.user_role === role;
  };

  const hasMinimumRole = (role: UserRole): boolean => {
    if (!profile) return false;
    
    const roleHierarchy: UserRole[] = ['basic', 'premium', 'admin', 'architecture'];
    const currentRoleIndex = roleHierarchy.indexOf(profile.user_role);
    const requiredRoleIndex = roleHierarchy.indexOf(role);
    
    return currentRoleIndex >= requiredRoleIndex;
  };

  const hasFeature = (feature: string): boolean => {
    if (!profile?.features_enabled) return false;
    
    const features = profile.features_enabled as Record<string, any>;
    return features[feature] === true;
  };

  const canAccessArchitecture = (): boolean => {
    return hasRole('architecture');
  };

  const isHawkDomain = (): boolean => {
    return user?.email?.endsWith('@hawk.com') || false;
  };

  return {
    profile,
    loading,
    hasRole,
    hasMinimumRole,
    hasFeature,
    canAccessArchitecture,
    isHawkDomain,
    userRole: profile?.user_role || 'basic',
    subscriptionPlan: profile?.subscription_plan || 'basic',
  };
};
