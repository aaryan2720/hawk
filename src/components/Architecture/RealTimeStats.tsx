
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Users, Shield, Zap, Globe, TrendingUp, TrendingDown } from 'lucide-react';

const RealTimeStats = () => {
  const [stats, setStats] = useState({
    activeUsers: 0,
    apiRequests: 0,
    dbConnections: 0,
    vulnerabilities: 0,
    systemLoad: 0,
    responseTime: 0,
    uptime: '99.9%',
    throughput: 0
  });

  const [trends, setTrends] = useState({
    activeUsers: 'up',
    apiRequests: 'up',
    dbConnections: 'stable',
    vulnerabilities: 'down',
    systemLoad: 'up',
    responseTime: 'down'
  });

  useEffect(() => {
    const updateStats = () => {
      setStats({
        activeUsers: Math.floor(Math.random() * 500) + 200,
        apiRequests: Math.floor(Math.random() * 10000) + 5000,
        dbConnections: Math.floor(Math.random() * 100) + 50,
        vulnerabilities: Math.floor(Math.random() * 50) + 20,
        systemLoad: Math.floor(Math.random() * 40) + 30,
        responseTime: Math.floor(Math.random() * 100) + 50,
        uptime: (99.5 + Math.random() * 0.4).toFixed(1) + '%',
        throughput: Math.floor(Math.random() * 1000) + 500
      });

      // Randomly update trends
      const trendOptions = ['up', 'down', 'stable'];
      setTrends({
        activeUsers: trendOptions[Math.floor(Math.random() * 3)],
        apiRequests: trendOptions[Math.floor(Math.random() * 3)],
        dbConnections: trendOptions[Math.floor(Math.random() * 3)],
        vulnerabilities: trendOptions[Math.floor(Math.random() * 3)],
        systemLoad: trendOptions[Math.floor(Math.random() * 3)],
        responseTime: trendOptions[Math.floor(Math.random() * 3)]
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  const statCards = [
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: Users,
      trend: trends.activeUsers,
      color: 'text-blue-500'
    },
    {
      title: 'API Requests/min',
      value: stats.apiRequests.toLocaleString(),
      icon: Globe,
      trend: trends.apiRequests,
      color: 'text-green-500'
    },
    {
      title: 'DB Connections',
      value: stats.dbConnections.toString(),
      icon: Database,
      trend: trends.dbConnections,
      color: 'text-purple-500'
    },
    {
      title: 'Vulnerabilities',
      value: stats.vulnerabilities.toString(),
      icon: Shield,
      trend: trends.vulnerabilities,
      color: 'text-red-500'
    },
    {
      title: 'System Load',
      value: `${stats.systemLoad}%`,
      icon: Activity,
      trend: trends.systemLoad,
      color: 'text-orange-500'
    },
    {
      title: 'Response Time',
      value: `${stats.responseTime}ms`,
      icon: Zap,
      trend: trends.responseTime,
      color: 'text-yellow-500'
    },
    {
      title: 'Uptime',
      value: stats.uptime,
      icon: TrendingUp,
      trend: 'up',
      color: 'text-green-500'
    },
    {
      title: 'Throughput',
      value: `${stats.throughput}/s`,
      icon: Activity,
      trend: 'stable',
      color: 'text-cyan-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-background border ${stat.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(stat.trend)}
                  <span className={`text-xs font-medium ${getTrendColor(stat.trend)}`}>
                    {stat.trend}
                  </span>
                </div>
              </div>
            </CardContent>
            
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-pulse opacity-20"></div>
          </Card>
        );
      })}
    </div>
  );
};

export default RealTimeStats;
