
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface AlertStatusSummaryProps {
  severityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

const AlertStatusSummary: React.FC<AlertStatusSummaryProps> = ({ severityCounts }) => {
  const totalAlerts = severityCounts.critical + severityCounts.high + severityCounts.medium + severityCounts.low;
  
  return (
    <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg shadow-md">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-bold bg-gradient-to-r from-gray-900 to-red-800 bg-clip-text text-transparent">
                Security Alert Status
              </CardTitle>
              <p className="text-xs text-gray-600">Real-time monitoring</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-1 text-xs font-medium shadow-md">
            <Activity className="h-3 w-3 mr-1 animate-pulse" />
            Live
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Horizontal Alert Tiles - Compact */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <AlertTile 
            title="Critical" 
            count={severityCounts.critical} 
            bgColor="bg-gradient-to-br from-red-50 to-red-100"
            textColor="text-red-700"
            borderColor="border-red-200"
            dotColor="bg-red-500"
          />
          
          <AlertTile 
            title="High" 
            count={severityCounts.high} 
            bgColor="bg-gradient-to-br from-orange-50 to-orange-100"
            textColor="text-orange-700"
            borderColor="border-orange-200"
            dotColor="bg-orange-500"
          />
          
          <AlertTile 
            title="Medium" 
            count={severityCounts.medium} 
            bgColor="bg-gradient-to-br from-amber-50 to-amber-100"
            textColor="text-amber-700"
            borderColor="border-amber-200"
            dotColor="bg-amber-500"
          />
          
          <AlertTile 
            title="Low" 
            count={severityCounts.low} 
            bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
            textColor="text-blue-700"
            borderColor="border-blue-200"
            dotColor="bg-blue-500"
          />
        </div>
        
        {/* Status Summary - Compact */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-gray-100">
          <div className="text-xs flex items-center gap-2">
            {totalAlerts === 0 ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-full">
                <Shield className="h-3 w-3" />
                <span className="font-medium">All systems secure</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-2 py-1.5 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span className="font-medium">{totalAlerts} alerts require attention</span>
              </div>
            )}
          </div>
          
          <Link to="/alerts">
            <Button 
              size="sm" 
              className={`${
                totalAlerts > 0 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-md' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border border-gray-300'
              } transition-all duration-300 hover:scale-105 px-3 py-1.5 rounded-lg font-medium text-xs`}
            >
              View All Alerts
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

interface AlertTileProps {
  title: string;
  count: number;
  bgColor: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
}

const AlertTile: React.FC<AlertTileProps> = ({ 
  title, 
  count, 
  bgColor,
  textColor,
  borderColor,
  dotColor
}) => {
  return (
    <div className={`flex flex-col items-center p-3 ${bgColor} border ${borderColor} rounded-lg transition-all duration-300 hover:shadow-md hover:scale-105 relative overflow-hidden`}>
      <div className="text-center w-full">
        <span className={`text-xs font-semibold ${textColor} uppercase tracking-wide`}>{title}</span>
        <div className="flex items-center justify-center mt-2 space-x-2">
          <span className={`text-xl font-bold ${textColor}`}>{count}</span>
          <div className="relative">
            <div className={`h-2 w-2 rounded-full ${dotColor}`}></div>
            {count > 0 && (
              <div className={`absolute inset-0 h-2 w-2 rounded-full ${dotColor} animate-ping opacity-75`}></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertStatusSummary;
