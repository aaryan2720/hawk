
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, RefreshCw, AlertTriangle, Shield, Database, Info, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Alert } from '@/components/ui/alert';

interface RealTimeScannerProps {
  onScanComplete?: () => void;
}

interface ScanResult {
  cve: string;
  title: string;
  severity: string;
  description?: string;
  system?: string;
  date?: string;
  oemSpecific?: boolean;
  targetOEM?: string;
}

const RealTimeScanner: React.FC<RealTimeScannerProps> = ({ onScanComplete }) => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [scanInProgress, setScanInProgress] = useState(false);
  const [filteredByOEMs, setFilteredByOEMs] = useState(false);
  const [registeredOEMs, setRegisteredOEMs] = useState<string[]>([]);
  const [userOEMSources, setUserOEMSources] = useState<any[]>([]);
  const [scanMessage, setScanMessage] = useState<string>('');
  
  // Get the results limit from environment variables or default to 10
  const resultsLimit = parseInt(import.meta.env.VITE_NVD_RESULTS_LIMIT || '10');

  const severityOptions = [
    { id: 'all', name: 'All Severities' },
    { id: 'critical', name: 'Critical Only' },
    { id: 'high', name: 'High Only' },
    { id: 'medium', name: 'Medium Only' },
    { id: 'low', name: 'Low Only' }
  ];

  useEffect(() => {
    fetchUserOEMSources();
  }, [user]);

  const fetchUserOEMSources = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('oem_sources')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setUserOEMSources(data || []);
      console.log('Scanner: User OEM sources loaded:', data?.map(oem => `${oem.name} (${oem.system_type})`));
    } catch (error) {
      console.error('Error fetching OEM sources:', error);
    }
  };

  const sendNotification = async (results: ScanResult[]) => {
    try {
      // Check if there are any critical or high severity vulnerabilities
      const criticalResults = results.filter(
        r => r.severity === 'critical' || r.severity === 'high'
      );
      
      if (criticalResults.length > 0) {
        // Call notification edge function to send external notifications
        await supabase.functions.invoke('send-notifications', {
          body: { 
            userId: user?.id,
            scanResults: criticalResults,
            scanType: 'real-time',
            severity: selectedSeverity
          }
        });
        
        // Show toast indicating notifications were sent
        toast.info(`Notifications sent for ${criticalResults.length} high priority vulnerabilities`);
      }
    } catch (error) {
      console.error('Failed to send notifications:', error);
    }
  };

  const handleScan = async () => {
    try {
      setIsScanning(true);
      setScanInProgress(true);
      setResults([]);
      setFilteredByOEMs(false);
      setRegisteredOEMs([]);
      setScanMessage('');

      if (userOEMSources.length === 0) {
        toast.info('No OEM sources registered. Please add your device OEMs first for personalized results.');
        return;
      }

      toast.info('Scanning for vulnerabilities specific to your registered OEMs...', {
        duration: 3000,
      });

      const { data, error } = await supabase.functions.invoke('real-time-scraper', {
        body: { 
          source: selectedSeverity === 'all' ? undefined : selectedSeverity, 
          limit: resultsLimit,
          userId: user?.id
        }
      });

      if (error) throw error;

      if (data.results && Array.isArray(data.results)) {
        setResults(data.results);
        setFilteredByOEMs(data.filteredByOEMs || false);
        setRegisteredOEMs(data.registeredOEMs || []);
        setScanMessage(data.message || '');
        
        if (data.results.length > 0) {
          const oemInfo = data.filteredByOEMs ? ` for your registered OEMs (${data.registeredOEMs?.join(', ')})` : '';
          toast.success(`${data.results.length} relevant vulnerabilities found${oemInfo}`);
          
          // Send notifications for any critical/high results
          await sendNotification(data.results);
        } else {
          if (data.message) {
            toast.info(data.message);
          } else if (data.filteredByOEMs && userOEMSources.length > 0) {
            toast.success('No new vulnerabilities found for your registered OEM sources');
          } else {
            toast.info('No vulnerabilities found matching your criteria');
          }
        }
      } else {
        toast.info('No vulnerabilities found in the response');
      }
      
      if (onScanComplete) {
        onScanComplete();
      }
    } catch (error) {
      console.error('Real-time scan error:', error);
      toast.error('Failed to complete real-time scan');
      
      // Show user-friendly error toast with more details
      if (error instanceof Error) {
        if (error.message.includes('FunctionsHttpError')) {
          toast.error('The vulnerability database is currently unavailable. Please try again later.');
        } else {
          toast.error(`Scan error: ${error.message}`);
        }
      }
    } finally {
      setIsScanning(false);
      setScanInProgress(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">OEM-Specific Vulnerability Scanner</h3>
          <p className="text-sm text-gray-500">
            Scans for vulnerabilities specific to your registered OEM devices
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {isScanning ? (
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" /> Scanning...
            </div>
          ) : (
            <div className="flex items-center">
              <Database className="h-4 w-4 text-primary mr-1 inline" />
              OEM-Filtered Scanning
            </div>
          )}
        </div>
      </div>

      {/* OEM Sources Status */}
      {userOEMSources.length > 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-900">OEM Filtering Active</p>
              <p className="text-xs text-emerald-700 mt-1">
                Scanning for vulnerabilities affecting: {userOEMSources.map(oem => `${oem.name} (${oem.system_type})`).join(', ')}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {userOEMSources.map((oem, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-emerald-100 border-emerald-300 text-emerald-800">
                    {oem.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">No OEM Sources Registered</p>
              <p className="text-xs text-amber-700 mt-1">
                Add your device OEMs in System Monitor to get personalized vulnerability scanning for your specific hardware and software.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col space-y-3">
        <div className="flex items-center space-x-2">
          <Select 
            value={selectedSeverity} 
            onValueChange={setSelectedSeverity}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Severity Filter" />
            </SelectTrigger>
            <SelectContent>
              {severityOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    {option.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleScan} 
            disabled={isScanning || userOEMSources.length === 0} 
            className="whitespace-nowrap"
          >
            {isScanning ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Scan Now
          </Button>
        </div>
        
        <div className="text-xs text-gray-500">
          Scans for up to {resultsLimit} vulnerabilities published in the last 7 days, filtered by your registered OEMs
        </div>
      </div>
      
      {scanInProgress && (
        <div className="mt-2">
          <Alert className="bg-blue-50 text-blue-800 border-blue-200">
            <Info className="h-4 w-4" />
            <span className="ml-2 text-xs">
              Scan in progress. Results will be filtered based on your registered OEM sources.
            </span>
          </Alert>
        </div>
      )}

      {scanMessage && (
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <Info className="h-4 w-4" />
          <span className="ml-2 text-xs">{scanMessage}</span>
        </Alert>
      )}

      {filteredByOEMs && registeredOEMs.length > 0 && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <Shield className="h-4 w-4" />
          <span className="ml-2 text-xs">
            Results filtered for your registered OEMs: {registeredOEMs.join(', ')}
          </span>
        </Alert>
      )}
      
      {results.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">OEM-Specific Scan Results</h4>
          <div className="max-h-60 overflow-y-auto pr-2">
            {results.map((result, index) => (
              <div 
                key={index} 
                className="flex items-start gap-2 p-3 rounded-md bg-gray-50 border border-gray-200 mb-2"
              >
                <AlertTriangle className={`h-4 w-4 ${
                  result.severity === 'critical' ? 'text-red-600' :
                  result.severity === 'high' ? 'text-orange-500' :
                  result.severity === 'medium' ? 'text-amber-500' :
                  'text-blue-500'
                } flex-shrink-0 mt-0.5`} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{result.title || result.cve}</span>
                    {result.oemSpecific && (
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                        {result.targetOEM}
                      </Badge>
                    )}
                  </div>
                  {result.description && (
                    <span className="text-xs text-gray-500 mb-1">
                      {result.description.substring(0, 150)}{result.description.length > 150 ? '...' : ''}
                    </span>
                  )}
                  <div className="flex items-center text-xs text-gray-500">
                    <Badge variant="outline" className={`
                      ${result.severity === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                        result.severity === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                        result.severity === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-blue-100 text-blue-800 border-blue-200'}
                      mr-2 px-1 py-0 text-[10px]
                    `}>
                      {result.severity}
                    </Badge>
                    {result.system && <span className="mr-2">{result.system}</span>}
                    {result.date && <span>{new Date(result.date).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default RealTimeScanner;
