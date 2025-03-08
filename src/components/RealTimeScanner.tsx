
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader, RefreshCw, AlertTriangle, Shield, Calendar } from 'lucide-react';
import { AlertSeverity } from '@/types';

interface ScanResult {
  cve: string;
  source: string;
  severity: AlertSeverity;
}

const RealTimeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [scannedCount, setScannedCount] = useState(0);

  const handleScan = async () => {
    try {
      setIsScanning(true);
      toast.info("Starting real-time vulnerability scan...");
      
      const response = await supabase.functions.invoke('real-time-scraper', {
        body: { limit: 10 }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Scan failed');
      }
      
      setResults(response.data.results || []);
      setScannedCount(response.data.count || 0);
      setLastScanTime(new Date());
      
      toast.success(`Scan complete! Found ${response.data.count} new vulnerabilities.`);
    } catch (error) {
      console.error('Error during real-time scan:', error);
      toast.error(`Scan failed: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Real-Time Vulnerability Scanner</h2>
          <p className="text-sm text-gray-500 mt-1">
            Scan multiple security feeds for the latest vulnerabilities
          </p>
        </div>
        <Button 
          onClick={handleScan} 
          disabled={isScanning}
          className="flex gap-2 items-center"
        >
          {isScanning ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Start Scan
            </>
          )}
        </Button>
      </div>
      
      {lastScanTime && (
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Calendar className="h-4 w-4 mr-1" />
          Last scan: {lastScanTime.toLocaleString()}
          {scannedCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
              {scannedCount} vulnerabilities found
            </span>
          )}
        </div>
      )}
      
      {results.length > 0 ? (
        <div className="space-y-3 mt-4">
          <h3 className="font-medium">Recently Discovered Vulnerabilities</h3>
          {results.map((result, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
              <div>
                <div className="font-mono text-sm">{result.cve}</div>
                <div className="text-xs text-gray-500">Source: {result.source}</div>
              </div>
              <div className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityColor(result.severity)}`}>
                {result.severity}
              </div>
            </div>
          ))}
        </div>
      ) : isScanning ? (
        <div className="text-center py-10">
          <Loader className="h-10 w-10 mx-auto text-gray-300 animate-spin" />
          <p className="mt-4 text-gray-500">Scanning security feeds...</p>
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed rounded-md border-gray-200">
          <Shield className="h-10 w-10 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">
            Run a scan to discover the latest vulnerabilities
          </p>
        </div>
      )}
    </Card>
  );
};

export default RealTimeScanner;
