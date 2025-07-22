
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Save } from 'lucide-react';

interface NotificationActionsProps {
  handleTestNotification: () => Promise<void>;
  isLoading: boolean;
  saveSuccess: boolean;
  testResult?: any;
  debug?: string | null;
}

const NotificationActions: React.FC<NotificationActionsProps> = ({
  handleTestNotification,
  isLoading,
  saveSuccess,
  testResult,
  debug
}) => {
  return (
    <div className="flex justify-between pt-4">
      <Button 
        type="button"
        variant="outline" 
        onClick={handleTestNotification}
        disabled={isLoading}
      >
        Send Test Notification
      </Button>
      
      <Button 
        type="submit"
        disabled={isLoading}
        className={saveSuccess ? 'bg-green-600 hover:bg-green-700' : ''}
      >
        {saveSuccess ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Saved!
          </>
        ) : isLoading ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </>
        )}
      </Button>
      
      {testResult && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            Test notification sent successfully!
          </p>
        </div>
      )}
      
      {debug && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 mb-2">Debug Info</summary>
            <pre className="text-xs text-gray-500 overflow-auto max-h-40 p-2 bg-gray-100 rounded">
              {debug}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default NotificationActions;
