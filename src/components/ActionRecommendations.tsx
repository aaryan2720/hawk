
import React from 'react';
import { Alert } from '@/types';
import { generateRecommendations } from '@/utils/securityUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionRecommendationsProps {
  alert: Alert;
  onActionClick?: (action: string) => void;
}

const ActionRecommendations: React.FC<ActionRecommendationsProps> = ({
  alert,
  onActionClick
}) => {
  const recommendations = generateRecommendations(alert);
  
  // Determine timeline based on severity
  const getTimeline = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Immediate action required';
      case 'high': return 'Action required within 7 days';
      case 'medium': return 'Action required within 30 days';
      case 'low': return 'Address in regular maintenance cycle';
      default: return 'Action timeline undetermined';
    }
  };
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Shield className="h-5 w-5 mr-2 text-primary" />
          Recommended Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{getTimeline(alert.severity)}</span>
        </div>
        
        <ul className="space-y-2 mb-4">
          {recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{recommendation}</span>
            </li>
          ))}
        </ul>
        
        {alert.patchLink && (
          <div className="mt-2">
            <a 
              href={alert.patchLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm flex items-center"
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              View Patch Information
            </a>
          </div>
        )}
        
        <div className="flex gap-2 mt-4">
          <Button 
            size="sm" 
            onClick={() => onActionClick?.('acknowledge')}
            variant={alert.status === 'acknowledged' ? 'default' : 'outline'}
          >
            Acknowledge
          </Button>
          <Button 
            size="sm" 
            onClick={() => onActionClick?.('resolve')}
            variant={alert.status === 'resolved' ? 'default' : 'outline'}
          >
            Mark Resolved
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionRecommendations;
