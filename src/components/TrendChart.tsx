
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const TrendChart = () => {
  // Mock data for the chart
  const data = [
    { date: 'Jan', critical: 2, high: 5, medium: 8, low: 4 },
    { date: 'Feb', critical: 3, high: 7, medium: 10, low: 5 },
    { date: 'Mar', critical: 5, high: 8, medium: 7, low: 6 },
    { date: 'Apr', critical: 1, high: 6, medium: 9, low: 7 },
    { date: 'May', critical: 4, high: 9, medium: 11, low: 8 },
    { date: 'Jun', critical: 3, high: 5, medium: 12, low: 6 },
    { date: 'Jul', critical: 6, high: 7, medium: 8, low: 5 },
  ];

  return (
    <div className="glass-card p-4 rounded-lg h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              borderRadius: '8px', 
              border: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }} 
          />
          <Legend />
          <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="#ef4444" name="Critical" />
          <Area type="monotone" dataKey="high" stackId="1" stroke="#f87171" fill="#f87171" name="High" />
          <Area type="monotone" dataKey="medium" stackId="1" stroke="#fb923c" fill="#fb923c" name="Medium" />
          <Area type="monotone" dataKey="low" stackId="1" stroke="#38bdf8" fill="#38bdf8" name="Low" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
