
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ArrowUpRight, ArrowDownRight, Wifi } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NetworkTrafficVisualization = () => {
  const [trafficData, setTrafficData] = useState([]);
  const [currentStats, setCurrentStats] = useState({
    inbound: 0,
    outbound: 0,
    total: 0,
    packetsPerSecond: 0
  });

  useEffect(() => {
    const generateTrafficData = () => {
      const now = new Date();
      const newData = Array.from({ length: 30 }, (_, i) => {
        const time = new Date(now.getTime() - (29 - i) * 2000);
        const inbound = Math.floor(Math.random() * 100) + 50;
        const outbound = Math.floor(Math.random() * 80) + 30;
        return {
          time: time.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }),
          inbound,
          outbound,
          total: inbound + outbound
        };
      });

      const latest = newData[newData.length - 1];
      setCurrentStats({
        inbound: latest.inbound,
        outbound: latest.outbound,
        total: latest.total,
        packetsPerSecond: Math.floor(Math.random() * 1000) + 500
      });

      setTrafficData(newData);
    };

    generateTrafficData();
    const interval = setInterval(generateTrafficData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inbound</p>
                <p className="text-xl font-bold text-green-500">{currentStats.inbound} MB/s</p>
              </div>
              <ArrowDownRight className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outbound</p>
                <p className="text-xl font-bold text-blue-500">{currentStats.outbound} MB/s</p>
              </div>
              <ArrowUpRight className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Traffic</p>
                <p className="text-xl font-bold text-purple-500">{currentStats.total} MB/s</p>
              </div>
              <Activity className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Packets/sec</p>
                <p className="text-xl font-bold text-orange-500">{currentStats.packetsPerSecond.toLocaleString()}</p>
              </div>
              <Wifi className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Network Traffic (Real-time)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => `Time: ${value}`}
                formatter={(value, name) => [
                  `${value} MB/s`,
                  name === 'inbound' ? 'Inbound' : name === 'outbound' ? 'Outbound' : 'Total'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="inbound" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#22c55e', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="outbound" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#8b5cf6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkTrafficVisualization;
