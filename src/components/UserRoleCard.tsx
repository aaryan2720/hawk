
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, X, Crown, Shield, User, Building2, AlertCircle } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { Json } from '@/types';

const UserRoleCard = () => {
  const { profile, userRole, subscriptionPlan, isHawkDomain, loading } = useUserRole();

  const parseJsonToObject = (jsonData: Json): Record<string, any> => {
    if (typeof jsonData === 'object' && jsonData !== null && !Array.isArray(jsonData)) {
      return jsonData as Record<string, any>;
    }
    return {};
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'architecture':
        return <Crown className="h-5 w-5 text-red-600" />;
      case 'admin':
        return <Shield className="h-5 w-5 text-purple-600" />;
      case 'premium':
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'basic':
        return <User className="h-5 w-5 text-gray-600" />;
      default:
        return <User className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'architecture':
        return 'Full system architecture access with all premium features and team management capabilities.';
      case 'admin':
        return 'Administrative access with user management and advanced monitoring capabilities.';
      case 'premium':
        return 'Enhanced security monitoring with priority support and advanced features.';
      case 'basic':
        return 'Essential security monitoring with standard features and community support.';
      default:
        return 'Standard user access with basic features.';
    }
  };

  const getFeaturesList = () => {
    if (!profile?.features_enabled) return [];
    
    const features = parseJsonToObject(profile.features_enabled);
    const featureList = [];

    // System monitoring
    if (features.maxSystems === -1) {
      featureList.push({ name: 'Unlimited System Monitoring', enabled: true });
    } else {
      featureList.push({ name: `Up to ${features.maxSystems} Systems`, enabled: true });
    }

    // Real-time monitoring
    featureList.push({ name: 'Real-time Monitoring', enabled: features.realTimeMonitoring || false });

    // Advanced reports
    featureList.push({ name: 'Advanced Reports', enabled: features.advancedReports || false });

    // API Access
    if (features.apiAccess === 'full') {
      featureList.push({ name: 'Full API Access', enabled: true });
    } else if (features.apiAccess === 'limited') {
      featureList.push({ name: 'Limited API Access', enabled: true });
    } else {
      featureList.push({ name: 'API Access', enabled: false });
    }

    // Support
    featureList.push({ name: 'Priority Support', enabled: features.prioritySupport || false });
    featureList.push({ name: 'Dedicated Support', enabled: features.dedicatedSupport || false });

    return featureList;
  };

  const getPlanLimitations = () => {
    const limitations = [];
    
    switch (subscriptionPlan) {
      case 'basic':
        limitations.push('Daily vulnerability scans only');
        limitations.push('Limited OEM sources');
        limitations.push('No SMS alerts');
        limitations.push('Standard email support');
        break;
      case 'premium':
        limitations.push('Limited API calls per month');
        limitations.push('Standard support hours');
        break;
      case 'company':
        // No significant limitations for company plan
        break;
    }
    
    return limitations;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getRoleIcon(userRole)}
            <div>
              <CardTitle className="text-xl">Your Account Level</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={userRole === 'architecture' ? 'destructive' : userRole === 'admin' ? 'secondary' : userRole === 'premium' ? 'default' : 'outline'}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)} User
                </Badge>
                <Badge variant="outline">
                  {subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)} Plan
                </Badge>
                {isHawkDomain() && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    HAWK Domain
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <p className="text-gray-600 text-sm leading-relaxed">
            {getRoleDescription(userRole)}
          </p>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            Your Features & Capabilities
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getFeaturesList().map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                {feature.enabled ? (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
                <span className={`text-sm ${feature.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                  {feature.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {getPlanLimitations().length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
                Plan Limitations
              </h4>
              <div className="space-y-2">
                {getPlanLimitations().map((limitation, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <X className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{limitation}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {userRole === 'architecture' && (
          <>
            <Separator />
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                <Crown className="h-4 w-4 mr-2" />
                Architecture Team Privileges
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Full system architecture monitoring and control</li>
                <li>• Access to all user activity tracking</li>
                <li>• Real-time system performance analytics</li>
                <li>• Advanced security configuration management</li>
                <li>• Complete administrative dashboard access</li>
              </ul>
            </div>
          </>
        )}

        {isHawkDomain() && (
          <>
            <Separator />
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">
                HAWK Domain Benefits
              </h4>
              <p className="text-sm text-yellow-700">
                As a HAWK domain user, you have automatic access to premium features and enhanced security monitoring capabilities.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UserRoleCard;
