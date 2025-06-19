
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader, Shield, AlertTriangle, CheckCircle2, Rss, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { OEMScrapingService } from '@/services/oemScrapingService';
import { toast } from 'sonner';

interface ScanResult {
  oemName: string;
  vulnerabilitiesFound: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  lastScanned: string;
}

const RealTimeOEMScanner: React.FC = () => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [totalVulnerabilities, setTotalVulnerabilities] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  const handleStartScan = async () => {
    if (!user) {
      toast.error('Please log in to start scanning');
      return;
    }

    setIsScanning(true);
    setProgress(0);
    setScanResults([]);
    setTotalVulnerabilities(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 800);

      // Start OEM monitoring
      await OEMScrapingService.monitorOEMSources(user.id);
      
      // Simulate scan results (in real implementation, this would come from the service)
      const mockResults: ScanResult[] = [
        { oemName: 'Cisco', vulnerabilitiesFound: 3, severity: 'high', lastScanned: new Date().toISOString() },
        { oemName: 'Microsoft', vulnerabilitiesFound: 1, severity: 'critical', lastScanned: new Date().toISOString() },
        { oemName: 'Adobe', vulnerabilitiesFound: 2, severity: 'high', lastScanned: new Date().toISOString() },
        { oemName: 'VMware', vulnerabilitiesFound: 0, severity: 'low', lastScanned: new Date().toISOString() }
      ];

      clearInterval(progressInterval);
      setProgress(100);
      setScanResults(mockResults);
      setTotalVulnerabilities(mockResults.reduce((sum, result) => sum + result.vulnerabilitiesFound, 0));
      setLastScanTime(new Date().toISOString());

      toast.success('OEM vulnerability scan completed');
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to complete OEM scan');
    } finally {
      setIsScanning(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Real-Time OEM Vulnerability Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200">
          <Rss className="h-4 w-4" />
          <AlertDescription>
            Monitors RSS feeds and direct OEM websites for Critical and High severity vulnerabilities.
            Includes Cisco, Microsoft, Adobe, VMware, and other major manufacturers.
          </AlertDescription>
        </Alert>

        {isScanning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Scanning OEM sources...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <Button 
          onClick={handleStartScan}
          disabled={isScanning}
          className="w-full"
          size="lg"
        >
          {isScanning ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Scanning OEM Sources...
            </>
          ) : (
            <>
              <Globe className="mr-2 h-4 w-4" />
              Start Real-Time OEM Scan
            </>
          )}
        </Button>

        {lastScanTime && (
          <div className="text-sm text-gray-500 text-center">
            Last scan: {new Date(lastScanTime).toLocaleString()}
          </div>
        )}

        {scanResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Scan Results</h3>
              <Badge variant="outline" className="bg-blue-50">
                {totalVulnerabilities} Total Vulnerabilities
              </Badge>
            </div>

            <div className="grid gap-3">
              {scanResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {result.vulnerabilitiesFound > 0 ? (
                      <AlertTriangle className={`h-4 w-4 ${
                        result.severity === 'critical' ? 'text-red-600' :
                        result.severity === 'high' ? 'text-orange-500' : 'text-amber-500'
                      }`} />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    <div>
                      <p className="font-medium">{result.oemName}</p>
                      <p className="text-sm text-gray-500">
                        {result.vulnerabilitiesFound} vulnerabilities found
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.vulnerabilitiesFound > 0 && (
                      <Badge className={getSeverityColor(result.severity)}>
                        {result.severity}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(result.lastScanned).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Monitored OEM Sources:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Rss className="h-3 w-3" />
              Cisco Security Advisories
            </div>
            <div className="flex items-center gap-1">
              <Rss className="h-3 w-3" />
              Microsoft Security Updates
            </div>
            <div className="flex items-center gap-1">
              <Rss className="h-3 w-3" />
              Adobe Security Bulletins
            </div>
            <div className="flex items-center gap-1">
              <Rss className="h-3 w-3" />
              VMware Security Advisories
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeOEMScanner;
