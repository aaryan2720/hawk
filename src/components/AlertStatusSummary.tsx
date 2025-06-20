
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
    <Card className="glass-card hover-scale border-0 shadow-xl rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
      
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold gradient-text">Security Alert Status</CardTitle>
              <p className="text-sm text-gray-600 mt-0.5">Real-time threat monitoring</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 font-semibold shadow-lg">
            <Activity className="h-3 w-3 mr-1 animate-pulse" />
            Live
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        {/* Horizontal Alert Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <AlertTile 
            title="Critical" 
            count={severityCounts.critical} 
            color="bg-gradient-to-r from-red-500 to-red-600" 
            bgColor="bg-gradient-to-br from-red-50 to-red-100"
            textColor="text-red-800"
            borderColor="border-red-200"
            iconColor="text-red-600"
          />
          
          <AlertTile 
            title="High" 
            count={severityCounts.high} 
            color="bg-gradient-to-r from-orange-500 to-orange-600" 
            bgColor="bg-gradient-to-br from-orange-50 to-orange-100"
            textColor="text-orange-800"
            borderColor="border-orange-200"
            iconColor="text-orange-600"
          />
          
          <AlertTile 
            title="Medium" 
            count={severityCounts.medium} 
            color="bg-gradient-to-r from-amber-500 to-amber-600" 
            bgColor="bg-gradient-to-br from-amber-50 to-amber-100"
            textColor="text-amber-800"
            borderColor="border-amber-200"
            iconColor="text-amber-600"
          />
          
          <AlertTile 
            title="Low" 
            count={severityCounts.low} 
            color="bg-gradient-to-r from-blue-500 to-blue-600" 
            bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
            textColor="text-blue-800"
            borderColor="border-blue-200"
            iconColor="text-blue-600"
          />
        </div>
        
        {/* Status Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-gray-100">
          <div className="text-sm flex items-center gap-2">
            {totalAlerts === 0 ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-full">
                <Shield className="h-4 w-4" />
                <span className="font-medium">All systems secure</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-full">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">{totalAlerts} alerts require attention</span>
              </div>
            )}
          </div>
          
          <Link to="/alerts">
            <Button 
              size="sm" 
              className={`${
                totalAlerts > 0 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border border-gray-300'
              } transition-all duration-300 hover:scale-105 px-4 py-2 rounded-lg font-medium`}
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
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
}

const AlertTile: React.FC<AlertTileProps> = ({ 
  title, 
  count, 
  color, 
  bgColor,
  textColor,
  borderColor,
  iconColor
}) => {
  return (
    <div className={`flex flex-col items-center p-3 ${bgColor} border ${borderColor} rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
      
      <div className="relative z-10 text-center w-full">
        <span className={`text-xs font-semibold ${textColor} uppercase tracking-wide`}>{title}</span>
        <div className="flex items-center justify-center mt-2 space-x-2">
          <span className={`text-2xl font-bold ${textColor}`}>{count}</span>
          <div className="relative">
            <div className={`h-2 w-2 rounded-full ${color.replace('bg-gradient-to-r', 'bg-current')} ${iconColor}`}></div>
            {count > 0 && (
              <div className={`absolute inset-0 h-2 w-2 rounded-full ${color.replace('bg-gradient-to-r', 'bg-current')} ${iconColor} animate-ping opacity-75`}></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertStatusSummary;
