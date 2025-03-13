
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, RefreshCw, AlertTriangle, Shield, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RealTimeScannerProps {
  onScanComplete?: () => void;
}

interface ScanResult {
  cve: string;
  source: string;
  severity: string;
  description?: string;
}

const RealTimeScanner: React.FC<RealTimeScannerProps> = ({ onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const severityOptions = [
    { id: 'all', name: 'All Severities' },
    { id: 'critical', name: 'Critical Only' },
    { id: 'high', name: 'High Only' },
    { id: 'medium', name: 'Medium Only' },
    { id: 'low', name: 'Low Only' }
  ];

  const handleScan = async () => {
    try {
      setIsScanning(true);
      setResults([]);

      toast.info('Fetching real-time vulnerability data from NVD database...', {
        duration: 3000,
      });

      const { data, error } = await supabase.functions.invoke('real-time-scraper', {
        body: { source: selectedSeverity === 'all' ? undefined : selectedSeverity, limit: 10 }
      });

      if (error) throw error;

      setResults(data.results || []);
      
      if (data.count > 0) {
        toast.success(`${data.count} new vulnerabilities discovered from NVD`);
      } else {
        toast.info('No new vulnerabilities found in the NVD database');
      }
      
      if (onScanComplete) {
        onScanComplete();
      }
    } catch (error) {
      console.error('Real-time scan error:', error);
      toast.error('Failed to complete real-time scan with NVD API');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">NVD Vulnerability Scanner</h3>
          <p className="text-sm text-gray-500">
            Scans the National Vulnerability Database for the latest security vulnerabilities
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
              NVD API
            </div>
          )}
        </div>
      </div>
      
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
          
          <Button onClick={handleScan} disabled={isScanning} className="whitespace-nowrap">
            {isScanning ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Scan NVD
          </Button>
        </div>
        
        <div className="text-xs text-gray-500">
          Scans for vulnerabilities published in the last 7 days from the official NVD database
        </div>
      </div>
      
      {results.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Scan Results</h4>
          <div className="max-h-60 overflow-y-auto pr-2">
            {results.map((result, index) => (
              <div 
                key={index} 
                className="flex items-start gap-2 p-3 rounded-md bg-gray-50 border border-gray-200 mb-2"
              >
                <AlertTriangle className={`h-4 w-4 text-alert-${result.severity} flex-shrink-0 mt-0.5`} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{result.cve}</span>
                  {result.description && (
                    <span className="text-xs text-gray-500">{result.description}</span>
                  )}
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <span className={`inline-block w-2 h-2 rounded-full bg-alert-${result.severity} mr-1`}></span>
                    <span className="capitalize">{result.severity}</span>
                    <span className="mx-1">•</span>
                    <span>{result.source}</span>
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
