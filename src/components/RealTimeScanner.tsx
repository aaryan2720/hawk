import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, RefreshCw, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface RealTimeScannerProps {
  onScanComplete?: () => void;
}

const RealTimeScanner: React.FC<RealTimeScannerProps> = ({ onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [source, setSource] = useState<string>('');

  const handleScan = async () => {
    try {
      setIsScanning(true);
      setResults([]);

      const { data, error } = await supabase.functions.invoke('real-time-scraper', {
        body: { source: source || undefined, limit: 10 }
      });

      if (error) throw error;

      setResults(data.results || []);
      
      if (data.count > 0) {
        toast.success(`${data.count} new vulnerabilities discovered`);
      } else {
        toast.info('No new vulnerabilities found');
      }
      
      if (onScanComplete) {
        onScanComplete();
      }
    } catch (error) {
      console.error('Real-time scan error:', error);
      toast.error('Failed to complete real-time scan');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold tracking-tight">Real-Time Scanner</h3>
        <div className="text-sm text-gray-500">
          {isScanning ? (
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" /> Scanning...
            </div>
          ) : (
            <>
              <Lock className="h-4 w-4 text-gray-400 mr-1 inline" />
              Real-time protection
            </>
          )}
        </div>
      </div>
      
      <p className="text-sm text-gray-500">
        Detect potential vulnerabilities in real-time across various security sources.
      </p>
      
      <div className="flex items-center space-x-3">
        <input
          type="text"
          placeholder="Enter source URL (optional)"
          className="flex-1 px-3 py-2 border rounded-md focus:ring-0 focus:outline-none focus:border-primary text-sm"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={isScanning}
        />
        <Button onClick={handleScan} disabled={isScanning}>
          {isScanning ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Start Scan
        </Button>
      </div>
      
      {results.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Scan Results</h4>
          <ul className="space-y-2">
            {results.map((result, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-alert-high" />
                <span>{result.cve} from {result.source} (Severity: {result.severity})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

export default RealTimeScanner;
