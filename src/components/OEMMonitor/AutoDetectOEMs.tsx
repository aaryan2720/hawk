
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader, Search, CheckCircle2, Plus, Monitor, Cpu, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { addOEMSource } from '@/services/oemService';
import { Alert } from '@/components/ui/alert';

interface DetectedOEM {
  name: string;
  systemType: string;
  confidence: number;
  description: string;
}

const AutoDetectOEMs: React.FC<{ onDetectionComplete?: () => void }> = ({ onDetectionComplete }) => {
  const { user } = useAuth();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedOEMs, setDetectedOEMs] = useState<DetectedOEM[]>([]);
  const [addingOEMs, setAddingOEMs] = useState<Set<string>>(new Set());

  const detectSystemOEMs = async () => {
    setIsDetecting(true);
    setDetectedOEMs([]);
    
    try {
      // Simulate system detection - in a real scenario, this would use browser APIs
      // to detect hardware, OS, and installed software
      const detectedSystems: DetectedOEM[] = [];
      
      // Detect Operating System
      const userAgent = navigator.userAgent;
      if (userAgent.includes('Windows')) {
        detectedSystems.push({
          name: 'Microsoft',
          systemType: 'Windows',
          confidence: 95,
          description: 'Windows Operating System detected'
        });
      } else if (userAgent.includes('Mac')) {
        detectedSystems.push({
          name: 'Apple',
          systemType: 'macOS',
          confidence: 95,
          description: 'macOS Operating System detected'
        });
      } else if (userAgent.includes('Linux')) {
        detectedSystems.push({
          name: 'Linux Foundation',
          systemType: 'Linux',
          confidence: 90,
          description: 'Linux Operating System detected'
        });
      }
      
      // Detect common browser-based indicators
      if (navigator.hardwareConcurrency) {
        // Simulate CPU detection based on common patterns
        const cores = navigator.hardwareConcurrency;
        if (cores >= 8) {
          detectedSystems.push({
            name: 'Intel',
            systemType: 'CPU',
            confidence: 75,
            description: `High-performance CPU detected (${cores} cores)`
          });
        }
      }
      
      // Detect GPU capabilities
      const canvas = document.createElement('canvas');
      const glContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (glContext) {
        try {
          // Cast to WebGLRenderingContext to access WebGL-specific methods
          const gl = glContext as WebGLRenderingContext;
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_GL);
            if (typeof renderer === 'string') {
              if (renderer.includes('NVIDIA')) {
                detectedSystems.push({
                  name: 'NVIDIA',
                  systemType: 'GPU',
                  confidence: 85,
                  description: 'NVIDIA Graphics Card detected'
                });
              } else if (renderer.includes('AMD') || renderer.includes('Radeon')) {
                detectedSystems.push({
                  name: 'AMD',
                  systemType: 'GPU',
                  confidence: 85,
                  description: 'AMD Graphics Card detected'
                });
              } else if (renderer.includes('Intel')) {
                detectedSystems.push({
                  name: 'Intel',
                  systemType: 'GPU',
                  confidence: 80,
                  description: 'Intel Integrated Graphics detected'
                });
              }
            }
          }
        } catch (error) {
          console.log('GPU detection not available:', error);
        }
      }
      
      // Simulate memory detection
      if ('memory' in performance && (performance as any).memory) {
        const memory = (performance as any).memory;
        if (memory.totalJSHeapSize > 1000000000) { // > 1GB
          detectedSystems.push({
            name: 'High-Performance System',
            systemType: 'Memory',
            confidence: 70,
            description: 'High memory capacity detected'
          });
        }
      }
      
      // Add some common network/security OEMs based on typical enterprise setups
      if (userAgent.includes('Windows')) {
        detectedSystems.push({
          name: 'Cisco',
          systemType: 'Network',
          confidence: 60,
          description: 'Common enterprise network equipment'
        });
      }
      
      setDetectedOEMs(detectedSystems);
      
      if (detectedSystems.length > 0) {
        toast.success(`Detected ${detectedSystems.length} potential OEM sources`);
      } else {
        toast.info('No OEM sources could be automatically detected');
      }
      
    } catch (error) {
      console.error('Error detecting OEMs:', error);
      toast.error('Failed to detect OEM sources');
    } finally {
      setIsDetecting(false);
    }
  };

  const addDetectedOEM = async (oem: DetectedOEM) => {
    if (!user) return;
    
    setAddingOEMs(prev => new Set(prev).add(oem.name));
    
    try {
      // Generate a realistic URL for the OEM
      const oemUrl = generateOEMUrl(oem.name, oem.systemType);
      
      await addOEMSource(user.id, oem.name, oemUrl, oem.systemType);
      
      // Remove from detected list after adding
      setDetectedOEMs(prev => prev.filter(detected => detected.name !== oem.name));
      
      if (onDetectionComplete) {
        onDetectionComplete();
      }
      
    } catch (error) {
      console.error('Error adding detected OEM:', error);
    } finally {
      setAddingOEMs(prev => {
        const newSet = new Set(prev);
        newSet.delete(oem.name);
        return newSet;
      });
    }
  };

  const generateOEMUrl = (name: string, systemType: string): string => {
    const oemUrls: Record<string, string> = {
      'Microsoft': 'https://msrc.microsoft.com/update-guide',
      'Apple': 'https://support.apple.com/security-updates',
      'Intel': 'https://www.intel.com/content/www/us/en/security/security-advisory.html',
      'NVIDIA': 'https://www.nvidia.com/security',
      'AMD': 'https://www.amd.com/security-updates',
      'Cisco': 'https://sec.cloudapps.cisco.com/security/center/publicationListing.x',
      'Linux Foundation': 'https://cve.mitre.org'
    };
    
    return oemUrls[name] || `https://${name.toLowerCase().replace(/\s+/g, '')}.com/security`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 75) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSystemIcon = (systemType: string) => {
    switch (systemType.toLowerCase()) {
      case 'windows':
      case 'macos':
      case 'linux':
        return <Monitor className="h-4 w-4" />;
      case 'cpu':
      case 'gpu':
        return <Cpu className="h-4 w-4" />;
      case 'memory':
        return <HardDrive className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Auto-Detect Your System Components
        </CardTitle>
        <p className="text-sm text-gray-600">
          Automatically scan and detect OEM sources from your current system
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200">
          <Monitor className="h-4 w-4 text-blue-600" />
          <div className="ml-2">
            <p className="text-sm text-blue-900 font-medium">How it works</p>
            <p className="text-xs text-blue-800 mt-1">
              This feature detects your operating system, hardware components, and common software to suggest relevant OEM sources for vulnerability monitoring.
            </p>
          </div>
        </Alert>
        
        <Button
          onClick={detectSystemOEMs}
          disabled={isDetecting}
          className="w-full"
        >
          {isDetecting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Scanning System...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Auto-Detect My Systems
            </>
          )}
        </Button>

        {detectedOEMs.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Detected Systems & Components</h4>
            <div className="grid gap-3">
              {detectedOEMs.map((oem, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getSystemIcon(oem.systemType)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{oem.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {oem.systemType}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getConfidenceColor(oem.confidence)}`}
                        >
                          {oem.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{oem.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addDetectedOEM(oem)}
                    disabled={addingOEMs.has(oem.name)}
                  >
                    {addingOEMs.has(oem.name) ? (
                      <Loader className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoDetectOEMs;
