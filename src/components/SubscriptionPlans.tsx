
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Zap, Crown, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface SubscriptionPlan {
  id: string;
  plan_name: 'basic' | 'premium' | 'company';
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: Record<string, any>;
  limitations: Record<string, any>;
  max_systems: number | null;
}

interface SubscriptionPlansProps {
  currentUserRole?: string;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = () => {
  const { profile, userRole, subscriptionPlan } = useUserRole();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('price_monthly', { ascending: true });

        if (error) throw error;
        setPlans(data || []);
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
        toast.error('Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'basic':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'premium':
        return <Crown className="h-6 w-6 text-purple-500" />;
      case 'company':
        return <Building2 className="h-6 w-6 text-blue-500" />;
      default:
        return <CheckCircle className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleSubscription = (planName: string) => {
    if (planName === subscriptionPlan) {
      toast.info('This is your current plan');
      return;
    }
    
    if (planName === 'basic') {
      toast.success('Basic plan is free! You can downgrade anytime.');
    } else {
      toast.success(`You'll be redirected to subscribe to the ${planName} plan`);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-20 mb-4"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded w-full"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-2">Subscription Plans</h3>
      <p className="text-gray-500 mb-6">
        Choose the plan that fits your security monitoring needs
      </p>
      
      {profile && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Current Plan:</strong> {profile.subscription_plan.charAt(0).toUpperCase() + profile.subscription_plan.slice(1)} 
            <span className="ml-2">
              <strong>Role:</strong> {profile.user_role.charAt(0).toUpperCase() + profile.user_role.slice(1)}
            </span>
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg ${
              plan.plan_name === subscriptionPlan ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
          >
            {plan.plan_name === 'premium' && (
              <div className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 text-center">
                Most Popular
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-center mb-2">
                {getPlanIcon(plan.plan_name)}
                <h4 className="text-xl font-semibold ml-2">{plan.display_name}</h4>
              </div>
              <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
              
              <div className="flex items-end mb-6">
                <span className="text-3xl font-bold">
                  ${plan.price_monthly.toFixed(0)}
                </span>
                {plan.price_monthly > 0 && (
                  <span className="text-gray-500 ml-1 mb-1">/month</span>
                )}
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Features:</p>
                  <ul className="space-y-2">
                    {Object.entries(plan.features).map(([key, value]) => (
                      <li key={key} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">
                          <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {String(value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {Object.keys(plan.limitations).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Limitations:</p>
                    <ul className="space-y-2">
                      {Object.entries(plan.limitations).map(([key, value]) => (
                        <li key={key} className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-500">
                            <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {String(value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <Button 
                className="w-full"
                variant={plan.plan_name === subscriptionPlan ? "secondary" : "default"}
                disabled={plan.plan_name === subscriptionPlan}
                onClick={() => handleSubscription(plan.plan_name)}
              >
                {plan.plan_name === subscriptionPlan ? (
                  'Current Plan'
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    {plan.plan_name === 'basic' ? 'Downgrade' : 
                     plan.plan_name === 'company' ? 'Contact Sales' : 'Upgrade'}
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Architecture team access is reserved for @hawk.com domain users and provides access to system architecture monitoring and controls.
        </p>
      </div>
    </Card>
  );
};

export default SubscriptionPlans;
