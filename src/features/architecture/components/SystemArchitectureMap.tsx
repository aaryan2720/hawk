
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Shield, Users, Bell, Activity, Zap, Globe, Lock } from 'lucide-react';

const SystemArchitectureMap = () => {
  const architectureComponents = [
    {
      name: 'Authentication Layer',
      icon: Lock,
      color: 'text-red-500',
      connections: ['User Management', 'API Gateway'],
      status: 'operational',
      description: 'Supabase Auth with RLS policies'
    },
    {
      name: 'API Gateway', 
      icon: Globe,
      color: 'text-blue-500',
      connections: ['Database', 'Edge Functions', 'External APIs'],
      status: 'operational',
      description: 'Supabase REST & GraphQL APIs'
    },
    {
      name: 'Database',
      icon: Database,
      color: 'text-green-500',
      connections: ['API Gateway', 'Real-time Engine'],
      status: 'operational',
      description: 'PostgreSQL with Row Level Security'
    },
    {
      name: 'User Management',
      icon: Users,
      color: 'text-purple-500',
      connections: ['Authentication Layer', 'Notification System'],
      status: 'operational',
      description: 'Profile and role management'
    },
    {
      name: 'Vulnerability Scanner',
      icon: Shield,
      color: 'text-orange-500',
      connections: ['API Gateway', 'External APIs', 'Notification System'],
      status: 'operational',
      description: 'Multi-source vulnerability detection'
    },
    {
      name: 'Notification System',
      icon: Bell,
      color: 'text-yellow-500',
      connections: ['User Management', 'Email Service', 'Real-time Engine'],
      status: 'operational',
      description: 'Multi-channel alert delivery'
    },
    {
      name: 'Real-time Engine',
      icon: Activity,
      color: 'text-cyan-500',
      connections: ['Database', 'Frontend', 'Notification System'],
      status: 'operational',
      description: 'Live updates and subscriptions'
    },
    {
      name: 'Edge Functions',
      icon: Zap,
      color: 'text-pink-500',
      connections: ['API Gateway', 'External APIs'],
      status: 'operational',
      description: 'Serverless computing layer'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>HAWK System Architecture Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {architectureComponents.map((component, index) => {
              const IconComponent = component.icon;
              return (
                <Card key={index} className="relative hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <IconComponent className={`h-6 w-6 ${component.color}`} />
                      <Badge variant={component.status === 'operational' ? 'default' : 'destructive'}>
                        {component.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm">{component.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">
                      {component.description}
                    </p>
                    <div className="space-y-1">
                      <div className="text-xs font-medium">Connections:</div>
                      <div className="flex flex-wrap gap-1">
                        {component.connections.map((conn, connIndex) => (
                          <Badge key={connIndex} variant="outline" className="text-xs">
                            {conn}
                          </Badge>
                        ))}
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
            <CardTitle>Data Flow Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 border rounded">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">User Request → Authentication → API Gateway</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">API Gateway → Database → Row Level Security</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Scanner → External APIs → Edge Functions</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Real-time → WebSocket → Frontend Updates</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Layers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm font-medium">Row Level Security (RLS)</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm font-medium">JWT Authentication</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm font-medium">API Rate Limiting</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm font-medium">CORS Protection</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm font-medium">SSL/TLS Encryption</span>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemArchitectureMap;
