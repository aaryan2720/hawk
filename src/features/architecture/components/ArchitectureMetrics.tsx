
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Shield, Users, Zap, Globe } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ArchitectureMetrics = () => {
  const [metrics, setMetrics] = useState({
    apiCalls: [],
    systemLoad: [],
    vulnerabilityStats: [],
    userActivity: []
  });

  useEffect(() => {
    generateRealTimeData();
    const interval = setInterval(generateRealTimeData, 2000);
    return () => clearInterval(interval);
  }, []);

  const generateRealTimeData = () => {
    const now = new Date();
    const newMetrics = {
      apiCalls: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        calls: Math.floor(Math.random() * 1000) + 500,
        errors: Math.floor(Math.random() * 50),
        response_time: Math.floor(Math.random() * 200) + 50
      })),
      systemLoad: Array.from({ length: 12 }, (_, i) => ({
        time: new Date(now.getTime() - (11 - i) * 5 * 60 * 1000).toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        cpu: Math.floor(Math.random() * 40) + 30,
        memory: Math.floor(Math.random() * 30) + 40,
        network: Math.floor(Math.random() * 60) + 20
      })),
      vulnerabilityStats: [
        { name: 'Critical', value: Math.floor(Math.random() * 10) + 5, color: '#ef4444' },
        { name: 'High', value: Math.floor(Math.random() * 20) + 15, color: '#f97316' },
        { name: 'Medium', value: Math.floor(Math.random() * 30) + 25, color: '#eab308' },
        { name: 'Low', value: Math.floor(Math.random() * 40) + 30, color: '#22c55e' }
      ],
      userActivity: Array.from({ length: 7 }, (_, i) => ({
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        users: Math.floor(Math.random() * 200) + 100,
        sessions: Math.floor(Math.random() * 500) + 300,
        actions: Math.floor(Math.random() * 1000) + 800
      }))
    };
    setMetrics(newMetrics);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            API Performance (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.apiCalls}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="response_time" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-500" />
            System Load
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics.systemLoad}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="cpu" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
              <Area type="monotone" dataKey="memory" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="network" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Vulnerability Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.vulnerabilityStats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {metrics.vulnerabilityStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {metrics.vulnerabilityStats.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            User Activity (7 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.userActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#8b5cf6" />
              <Bar dataKey="sessions" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArchitectureMetrics;
