
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X, Zap, Crown, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/types';

interface SubscriptionPlan {
  id: string;
  plan_name: 'basic' | 'premium' | 'company';
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: Json;
  limitations: Json;
  max_systems: number | null;
}

const SubscriptionPlansSection = () => {
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
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'premium':
        return <Crown className="h-8 w-8 text-purple-500" />;
      case 'company':
        return <Building2 className="h-8 w-8 text-blue-500" />;
      default:
        return <CheckCircle className="h-8 w-8 text-gray-500" />;
    }
  };

  const getPlanBadge = (planName: string) => {
    switch (planName) {
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Most Popular</Badge>;
      case 'company':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Enterprise</Badge>;
      default:
        return null;
    }
  };

  const handlePlanSelection = (planName: string) => {
    if (planName === 'basic') {
      toast.success('Basic plan is free! Sign up to get started.');
    } else {
      toast.info(`Interested in ${planName}? Contact our sales team for more information.`);
    }
  };

  const parseJsonToObject = (jsonData: Json): Record<string, any> => {
    if (typeof jsonData === 'object' && jsonData !== null && !Array.isArray(jsonData)) {
      return jsonData as Record<string, any>;
    }
    return {};
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Security Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From essential monitoring to enterprise-grade security solutions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const features = parseJsonToObject(plan.features);
            const limitations = parseJsonToObject(plan.limitations);
            
            return (
              <Card 
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  plan.plan_name === 'premium' 
                    ? 'ring-2 ring-purple-500 transform scale-105' 
                    : 'hover:shadow-lg'
                }`}
              >
                {getPlanBadge(plan.plan_name) && (
                  <div className="absolute top-4 right-4">
                    {getPlanBadge(plan.plan_name)}
                  </div>
                )}
                
                <CardHeader className="text-center pb-6">
                  <div className="flex justify-center mb-4">
                    {getPlanIcon(plan.plan_name)}
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.display_name}
                  </CardTitle>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="flex items-end justify-center mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price_monthly}
                    </span>
                    <span className="text-gray-500 ml-1">/month</span>
                  </div>
                  
                  {plan.price_yearly > 0 && (
                    <p className="text-sm text-green-600">
                      Save ${((plan.price_monthly * 12) - plan.price_yearly).toFixed(2)} yearly
                    </p>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4 mb-8">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Features</h4>
                      <ul className="space-y-2">
                        {Object.entries(features).map(([key, value]) => (
                          <li key={key} className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {String(value)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {Object.keys(limitations).length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Limitations</h4>
                        <ul className="space-y-2">
                          {Object.entries(limitations).map(([key, value]) => (
                            <li key={key} className="flex items-start">
                              <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-500">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {String(value)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <Button 
                    className={`w-full ${
                      plan.plan_name === 'premium' 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : plan.plan_name === 'company'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : ''
                    }`}
                    onClick={() => handlePlanSelection(plan.plan_name)}
                  >
                    {plan.plan_name === 'basic' ? (
                      'Get Started Free'
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        {plan.plan_name === 'company' ? 'Contact Sales' : 'Upgrade Now'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            All plans include 24/7 security monitoring and email support
          </p>
          <p className="text-sm text-gray-500">
            Architecture team access is reserved for @hawk.com domain users
          </p>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlansSection;
