import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, Crown, Settings, Circle, Activity, TrendingUp } from 'lucide-react';

interface UserLevel {
  role: string;
  count: number;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const UserLevelIndicators = () => {
  const [userLevels, setUserLevels] = useState<UserLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    fetchUserLevelData();
    const interval = setInterval(fetchUserLevelData, 5000); // Refresh every 5 seconds for real-time data
    return () => clearInterval(interval);
  }, []);

  const fetchUserLevelData = async () => {
    try {
      console.log('Fetching real-time user level data...');

      // Get all unique profiles with their roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_role');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Get active users from recent flow tracking (last 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: activeFlowData, error: flowError } = await supabase
        .from('user_flow_tracking')
        .select('user_id')
        .eq('status', 'active')
        .gte('last_activity', tenMinutesAgo);

      if (flowError) {
        console.error('Error fetching active users:', flowError);
      }

      const activeUserIds = new Set(activeFlowData?.map(item => item.user_id) || []);
      
      // Count users by role
      const roleCount = {
        user: 0,
        premium: 0,
        admin: 0,
        architecture: 0
      };

      const uniqueUsers = new Set<string>();
      
      // Process profiles data for accurate role counts
      if (profilesData) {
        profilesData.forEach(profile => {
          if (profile.id) {
            uniqueUsers.add(profile.id);
            const role = profile.user_role || 'user';
            if (roleCount.hasOwnProperty(role)) {
              roleCount[role as keyof typeof roleCount]++;
            } else {
              roleCount.user++; // Default to user if unknown role
            }
          }
        });
      }

      console.log('Role distribution:', roleCount);
      console.log('Total unique users:', uniqueUsers.size);
      console.log('Active users:', activeUserIds.size);

      const levels: UserLevel[] = [
        {
          role: 'user',
          count: roleCount.user,
          description: 'Regular users with basic access',
          icon: Users,
          color: 'text-emerald-600',
          bgColor: 'bg-gradient-to-br from-emerald-50 to-green-100',
          borderColor: 'border-emerald-200 hover:border-emerald-300'
        },
        {
          role: 'premium',
          count: roleCount.premium,
          description: 'Premium users with enhanced features',
          icon: Crown,
          color: 'text-blue-600',
          bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-100',
          borderColor: 'border-blue-200 hover:border-blue-300'
        },
        {
          role: 'admin',
          count: roleCount.admin,
          description: 'Administrators with full system access',
          icon: Shield,
          color: 'text-red-600',
          bgColor: 'bg-gradient-to-br from-red-50 to-rose-100',
          borderColor: 'border-red-200 hover:border-red-300'
        },
        {
          role: 'architecture',
          count: roleCount.architecture,
          description: 'Architecture team with system oversight',
          icon: Settings,
          color: 'text-purple-600',
          bgColor: 'bg-gradient-to-br from-purple-50 to-violet-100',
          borderColor: 'border-purple-200 hover:border-purple-300'
        }
      ];

      setUserLevels(levels);
      setTotalUsers(uniqueUsers.size);
      setActiveUsers(activeUserIds.size);
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
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
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
      <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-2 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <Activity className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-700 bg-clip-text text-transparent">
                  Real-Time User Distribution
                </span>
                <p className="text-sm text-muted-foreground mt-1">Live system monitoring and user analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 shadow-sm">
                <Circle className="h-3 w-3 mr-1 animate-pulse fill-current" />
                Live Data Active
              </Badge>
              <Badge variant="outline" className="text-sm bg-white shadow-sm">
                Total: {totalUsers} users
              </Badge>
              <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-300 shadow-sm">
                <TrendingUp className="h-3 w-3 mr-1" />
                Active: {activeUsers}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userLevels.map((level) => {
              const IconComponent = level.icon;
              const percentage = totalUsers > 0 ? ((level.count / totalUsers) * 100).toFixed(1) : '0.0';
              
              return (
                <Card 
                  key={level.role} 
                  className={`${level.bgColor} ${level.borderColor} border-2 hover:shadow-2xl hover:scale-105 transition-all duration-300 transform relative overflow-hidden group`}
                >
                  {/* Animated background effect */}
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity">
                    <IconComponent className="w-full h-full" />
                  </div>
                  
                  {/* Gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                  
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-full bg-white/80 shadow-lg ${level.color} group-hover:scale-110 transition-transform`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold bg-gradient-to-br from-gray-800 to-gray-600 bg-clip-text text-transparent">
                          {level.count}
                        </div>
                        <div className="text-xs text-muted-foreground font-semibold bg-white/60 px-2 py-1 rounded-full">
                          {percentage}% of total
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="default" className="capitalize font-medium shadow-sm bg-white/70 text-gray-800 border border-gray-300">
                          {level.role}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Circle className={`h-3 w-3 ${level.color} animate-pulse fill-current`} />
                          <span className="text-xs font-medium text-gray-600">Real-time</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 leading-relaxed font-medium">
                        {level.description}
                      </div>
                      
                      <div className="text-xs font-semibold text-primary bg-white/70 px-3 py-2 rounded-lg shadow-sm border border-gray-200">
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
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Access Permissions by Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userLevels.map((level) => (
              <div key={level.role} className="border-2 rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Circle className={`h-4 w-4 ${level.color}`} />
                  <span className="font-semibold capitalize text-lg">{level.role}</span>
                  <Badge variant="outline" className="font-medium">
                    {level.count} users
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {getPermissions(level.role).map((permission, index) => (
                    <div key={index} className="text-sm text-muted-foreground flex items-center gap-2 p-2 bg-white/50 rounded">
                      <div className="w-2 h-2 bg-current rounded-full flex-shrink-0"></div>
                      {permission}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              Security Architecture Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold">Row Level Security (RLS)</span>
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  ✓ Enforced
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold">Role-based Access Control</span>
                <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                  ✓ Active
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold">Email Domain Restrictions</span>
                <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                  ✓ @hawk.com only
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold">Session Tracking</span>
                <Badge variant="default" className="bg-orange-600 hover:bg-orange-700">
                  ✓ Real-time
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold">Activity Monitoring</span>
                <Badge variant="default" className="bg-red-600 hover:bg-red-700">
                  ✓ Full Coverage
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserLevelIndicators;
