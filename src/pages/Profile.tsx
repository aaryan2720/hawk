import { useEffect, useState } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import Account from '@/components/Account';
import SubscriptionPlans from '@/components/SubscriptionPlans';

const Profile = () => {
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      try {
        if (!user) throw new Error("No user found.");

        let { data, error, status } = await supabaseClient
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
  }, [user, supabaseClient]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">My Profile</h1>
      
      {user ? (
        <Account session={null} />
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
