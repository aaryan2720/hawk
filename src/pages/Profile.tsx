
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SubscriptionPlans from '@/components/SubscriptionPlans';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      try {
        if (!user) throw new Error("No user found.");

        let { data, error, status } = await supabase
          .from('profiles')
          .select(`role`)
          .eq('id', user.id)
          .single();

        if (error && status !== 406) {
          throw error;
        }

        if (data) {
          setRole(data.role);
        }
      } catch (error: any) {
        console.error(error);
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">My Profile</h1>
      
      {user ? (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium mb-4">Account Details</h2>
          <div className="space-y-2">
            <p><span className="text-gray-500">Email:</span> {user.email}</p>
            {user.user_metadata?.full_name && (
              <p><span className="text-gray-500">Name:</span> {user.user_metadata.full_name}</p>
            )}
          </div>
        </div>
      ) : (
        <p>Please sign in to view your profile.</p>
      )}
      
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Subscription Plans</h2>
        <SubscriptionPlans currentUserRole={role || 'user'} />
      </div>
    </div>
  );
};

export default Profile;
