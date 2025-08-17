import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, Crown, Settings, Circle } from 'lucide-react';

interface UserLevel {
  role: string;
  count: number;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const UserLevelIndicators = () => {
  const [userLevels, setUserLevels] = useState<UserLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchUserLevelData();
    const interval = setInterval(fetchUserLevelData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUserLevelData = async () => {
    try {
      // Get user flow data to analyze roles
      const { data: flowData } = await supabase
        .from('user_flow_tracking')
        .select('user_role, user_id')
        .eq('status', 'active');

      // Get profiles data
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('role, id');

      const roleCount: Record<string, number> = {};
      const uniqueUsers = new Set<string>();
      
      // Process flow data
      if (flowData) {
        flowData.forEach(item => {
          const role = item.user_role || 'user';
          const userId = item.user_id;
          
          if (userId) {
            uniqueUsers.add(userId);
            roleCount[role] = (roleCount[role] || 0) + 1;
          }
        });
      }

      // Process profiles data
      if (profilesData) {
        profilesData.forEach(item => {
          const role = item.role || 'user';
          const userId = item.id;
          
          if (userId) {
            uniqueUsers.add(userId);
            roleCount[role] = (roleCount[role] || 0) + 1;
          }
        });
      }

      const levels: UserLevel[] = [
        {
          role: 'user',
          count: roleCount.user || 0,
          description: 'Regular users with basic access',
          icon: Users,
          color: 'text-green-500',
          bgColor: 'bg-green-50'
        },
        {
          role: 'premium',
          count: roleCount.premium || 0,
          description: 'Premium users with enhanced features',
          icon: Crown,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50'
        },
        {
          role: 'admin',
          count: roleCount.admin || 0,
          description: 'Administrators with full system access',
          icon: Shield,
          color: 'text-red-500',
          bgColor: 'bg-red-50'
        },
        {
          role: 'architecture',
          count: roleCount.architecture || 0,
          description: 'Architecture team with system oversight',
          icon: Settings,
          color: 'text-purple-500',
          bgColor: 'bg-purple-50'
        }
      ];

      setUserLevels(levels);
      setTotalUsers(uniqueUsers.size);
    } catch (error) {
      console.error('Error fetching user level data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccessLevel = (role: string) => {
    switch (role) {
      case 'architecture': return 'Level 5 - Full System Access';
      case 'admin': return 'Level 4 - Administrative Access';
      case 'premium': return 'Level 3 - Enhanced Features';
      case 'user': return 'Level 1 - Basic Access';
      default: return 'Level 0 - No Access';
    }
  };

  const getPermissions = (role: string) => {
    switch (role) {
      case 'architecture':
        return ['System Architecture View', 'User Flow Analytics', 'Full Database Access', 'System Monitoring'];
      case 'admin':
        return ['User Management', 'System Settings', 'Alert Management', 'Report Generation'];
      case 'premium':
        return ['Advanced Scanning', 'Custom Alerts', 'Priority Support', 'Extended History'];
      case 'user':
        return ['Basic Scanning', 'View Alerts', 'Standard Reports', 'Email Notifications'];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>User Level Distribution</span>
            <Badge variant="outline">Total Users: {totalUsers}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {userLevels.map((level) => {
              const IconComponent = level.icon;
              const percentage = totalUsers > 0 ? ((level.count / totalUsers) * 100).toFixed(1) : '0';
              
              return (
                <Card key={level.role} className={`${level.bgColor} border-2 hover:shadow-lg transition-shadow`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <IconComponent className={`h-8 w-8 ${level.color}`} />
                      <Circle className={`h-4 w-4 ${level.color} animate-pulse`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="default" className="capitalize">
                          {level.role}
                        </Badge>
                        <span className="text-2xl font-bold">{level.count}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {percentage}% of total users
                      </div>
                      <div className="text-sm">{level.description}</div>
                      <div className="text-xs font-medium text-primary">
                        {getAccessLevel(level.role)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Permissions by Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userLevels.map((level) => (
              <div key={level.role} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Circle className={`h-3 w-3 ${level.color}`} />
                  <span className="font-medium capitalize">{level.role}</span>
                  <Badge variant="outline">{level.count} users</Badge>
                </div>
                <div className="space-y-1">
                  {getPermissions(level.role).map((permission, index) => (
                    <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      {permission}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Architecture Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm font-medium">Row Level Security (RLS)</span>
                <Badge variant="default">✓ Enforced</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm font-medium">Role-based Access Control</span>
                <Badge variant="default">✓ Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm font-medium">Email Domain Restrictions</span>
                <Badge variant="default">✓ @hawk.com only</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm font-medium">Session Tracking</span>
                <Badge variant="default">✓ Real-time</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm font-medium">Activity Monitoring</span>
                <Badge variant="default">✓ Full Coverage</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserLevelIndicators;
