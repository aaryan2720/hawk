
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileText, Monitor, Terminal, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { addOEMSource } from '@/services/oemService';

interface ScriptType {
  id: string;
  name: string;
  platform: string;
  extension: string;
  icon: React.ReactNode;
  description: string;
}

interface DetectedOEMResult {
  name: string;
  category: string;
  version?: string;
  manufacturer: string;
  confidence: number;
}

const SystemScriptGenerator: React.FC<{ onDetectionComplete?: () => void }> = ({ onDetectionComplete }) => {
  const { user } = useAuth();
  const [selectedScript, setSelectedScript] = useState<string>('');
  const [uploadedResults, setUploadedResults] = useState<DetectedOEMResult[]>([]);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  const scriptTypes: ScriptType[] = [
    {
      id: 'windows-powershell',
      name: 'Windows PowerShell',
      platform: 'Windows',
      extension: '.ps1',
      icon: <Monitor className="h-5 w-5" />,
      description: 'Basic Windows system detection'
    },
    {
      id: 'linux-bash',
      name: 'Linux Bash',
      platform: 'Linux',
      extension: '.sh',
      icon: <Terminal className="h-5 w-5" />,
      description: 'Basic Linux system detection'
    },
    {
      id: 'macos-bash',
      name: 'macOS Bash',
      platform: 'macOS',
      extension: '.sh',
      icon: <Monitor className="h-5 w-5" />,
      description: 'Basic macOS system detection'
    },
    {
      id: 'cross-platform-python',
      name: 'Cross-Platform Python',
      platform: 'Cross-Platform',
      extension: '.py',
      icon: <FileText className="h-5 w-5" />,
      description: 'Universal detection using Python'
    }
  ];

  const generateWindowsPowerShellScript = (): string => {
    return `# HAWK OEM Detection Script
Write-Host "HAWK OEM Detection - Starting..." -ForegroundColor Green

$results = @()

# Get system info
try {
    $computerSystem = Get-WmiObject -Class Win32_ComputerSystem -ErrorAction Stop
    if ($computerSystem.Manufacturer) {
        $results += @{
            name = $computerSystem.Manufacturer
            category = "System"
            model = $computerSystem.Model
            confidence = 90
        }
    }
} catch {
    Write-Host "Could not get system info" -ForegroundColor Yellow
}

# Get CPU info
try {
    $processor = Get-WmiObject -Class Win32_Processor -ErrorAction Stop | Select-Object -First 1
    if ($processor.Name -match "Intel") {
        $results += @{
            name = "Intel"
            category = "CPU"
            model = $processor.Name
            confidence = 85
        }
    } elseif ($processor.Name -match "AMD") {
        $results += @{
            name = "AMD"
            category = "CPU"
            model = $processor.Name
            confidence = 85
        }
    }
} catch {
    Write-Host "Could not get CPU info" -ForegroundColor Yellow
}

# Create output
$output = @{
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    platform = "Windows"
    script_version = "1.0"
    detected_oems = $results
}

# Save to file
try {
    $json = $output | ConvertTo-Json -Depth 5
    $json | Out-File -FilePath "hawk_oem_results.json" -Encoding UTF8
    Write-Host "SUCCESS: Results saved to hawk_oem_results.json" -ForegroundColor Green
    Write-Host "Found $($results.Count) components" -ForegroundColor Cyan
} catch {
    Write-Host "Error saving file: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Upload the hawk_oem_results.json file to HAWK" -ForegroundColor Yellow
Read-Host "Press Enter to exit"
`;
  };

  const generateLinuxBashScript = (): string => {
    return `#!/bin/bash
# HAWK OEM Detection Script

echo "HAWK OEM Detection - Starting..."

results="[]"

# Get system vendor
if [ -f /sys/class/dmi/id/sys_vendor ]; then
    vendor=$(cat /sys/class/dmi/id/sys_vendor 2>/dev/null | tr -d '\\0')
    model=$(cat /sys/class/dmi/id/product_name 2>/dev/null | tr -d '\\0')
    if [ ! -z "$vendor" ] && [ "$vendor" != "To Be Filled By O.E.M." ]; then
        results=$(echo "$results" | jq '. + [{"name": "'$vendor'", "category": "System", "model": "'$model'", "confidence": 90}]')
    fi
fi

# Get CPU info
if [ -f /proc/cpuinfo ]; then
    if grep -q "GenuineIntel" /proc/cpuinfo 2>/dev/null; then
        cpu_model=$(grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | sed 's/^[ \\t]*//')
        results=$(echo "$results" | jq '. + [{"name": "Intel", "category": "CPU", "model": "'$cpu_model'", "confidence": 85}]')
    elif grep -q "AuthenticAMD" /proc/cpuinfo 2>/dev/null; then
        cpu_model=$(grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | sed 's/^[ \\t]*//')
        results=$(echo "$results" | jq '. + [{"name": "AMD", "category": "CPU", "model": "'$cpu_model'", "confidence": 85}]')
    fi
fi

# Create JSON output
timestamp=$(date -Iseconds)
cat > hawk_oem_results.json << EOF
{
  "timestamp": "$timestamp",
  "platform": "Linux",
  "script_version": "1.0",
  "detected_oems": $results
}
EOF

echo "SUCCESS: Results saved to hawk_oem_results.json"
count=$(echo "$results" | jq 'length')
echo "Found $count components"
echo "Upload the hawk_oem_results.json file to HAWK"
`;
  };

  const generateMacOSScript = (): string => {
    return `#!/bin/bash
# HAWK OEM Detection Script

echo "HAWK OEM Detection - Starting..."

results="[]"

# Get system info
model=$(system_profiler SPHardwareDataType 2>/dev/null | grep "Model Name" | cut -d: -f2 | sed 's/^[ \\t]*//')
if [ ! -z "$model" ]; then
    results=$(echo "$results" | jq '. + [{"name": "Apple", "category": "System", "model": "'$model'", "confidence": 95}]')
fi

# Get CPU info
cpu=$(system_profiler SPHardwareDataType 2>/dev/null | grep "Processor Name" | cut -d: -f2 | sed 's/^[ \\t]*//')
if echo "$cpu" | grep -iq "intel"; then
    results=$(echo "$results" | jq '. + [{"name": "Intel", "category": "CPU", "model": "'$cpu'", "confidence": 85}]')
elif echo "$cpu" | grep -iq "apple"; then
    results=$(echo "$results" | jq '. + [{"name": "Apple", "category": "CPU", "model": "'$cpu'", "confidence": 90}]')
fi

# Create JSON output
timestamp=$(date -Iseconds)
cat > hawk_oem_results.json << EOF
{
  "timestamp": "$timestamp",
  "platform": "macOS",
  "script_version": "1.0",
  "detected_oems": $results
}
EOF

echo "SUCCESS: Results saved to hawk_oem_results.json"
count=$(echo "$results" | jq 'length')
echo "Found $count components"
echo "Upload the hawk_oem_results.json file to HAWK"
`;
  };

  const generatePythonScript = (): string => {
    return `#!/usr/bin/env python3
import json
import platform
import subprocess
import datetime
import os

def run_cmd(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
        return result.stdout.strip() if result.returncode == 0 else ""
    except:
        return ""

def detect_system():
    results = []
    system = platform.system()
    
    print(f"HAWK OEM Detection - {system}")
    
    if system == "Windows":
        try:
            import wmi
            c = wmi.WMI()
            for sys in c.Win32_ComputerSystem():
                if sys.Manufacturer:
                    results.append({
                        "name": sys.Manufacturer,
                        "category": "System", 
                        "model": sys.Model or "",
                        "confidence": 90
                    })
            for cpu in c.Win32_Processor():
                if "Intel" in cpu.Name:
                    results.append({
                        "name": "Intel",
                        "category": "CPU",
                        "model": cpu.Name,
                        "confidence": 85
                    })
                elif "AMD" in cpu.Name:
                    results.append({
                        "name": "AMD",
                        "category": "CPU", 
                        "model": cpu.Name,
                        "confidence": 85
                    })
        except:
            print("WMI not available, using basic detection")
            
    elif system == "Linux":
        vendor = run_cmd('cat /sys/class/dmi/id/sys_vendor 2>/dev/null')
        if vendor and vendor != "To Be Filled By O.E.M.":
            model = run_cmd('cat /sys/class/dmi/id/product_name 2>/dev/null')
            results.append({
                "name": vendor,
                "category": "System",
                "model": model,
                "confidence": 90
            })
        
        cpu_info = run_cmd('grep "model name" /proc/cpuinfo | head -1')
        if "Intel" in cpu_info:
            results.append({
                "name": "Intel",
                "category": "CPU",
                "model": cpu_info.split(":")[-1].strip(),
                "confidence": 85
            })
        elif "AMD" in cpu_info:
            results.append({
                "name": "AMD", 
                "category": "CPU",
                "model": cpu_info.split(":")[-1].strip(),
                "confidence": 85
            })
            
    elif system == "Darwin":
        model = run_cmd('system_profiler SPHardwareDataType | grep "Model Name"')
        if model:
            results.append({
                "name": "Apple",
                "category": "System",
                "model": model.split(":")[-1].strip(),
                "confidence": 95
            })
        
        cpu = run_cmd('system_profiler SPHardwareDataType | grep "Processor Name"')
        if cpu:
            cpu_name = cpu.split(":")[-1].strip()
            if "Intel" in cpu_name:
                results.append({
                    "name": "Intel",
                    "category": "CPU",
                    "model": cpu_name,
                    "confidence": 85
                })
            elif "Apple" in cpu_name:
                results.append({
                    "name": "Apple",
                    "category": "CPU",
                    "model": cpu_name,
                    "confidence": 90
                })
    
    return results

def main():
    try:
        results = detect_system()
        
        output = {
            "timestamp": datetime.datetime.now().isoformat(),
            "platform": platform.system(),
            "script_version": "1.0",
            "detected_oems": results
        }
        
        with open("hawk_oem_results.json", "w") as f:
            json.dump(output, f, indent=2)
        
        print("SUCCESS: Results saved to hawk_oem_results.json")
        print(f"Found {len(results)} components")
        print("Upload the hawk_oem_results.json file to HAWK")
        
    except Exception as e:
        print(f"Error: {e}")
        # Create empty results file
        output = {
            "timestamp": datetime.datetime.now().isoformat(),
            "platform": platform.system(),
            "script_version": "1.0",
            "detected_oems": [],
            "error": str(e)
        }
        with open("hawk_oem_results.json", "w") as f:
            json.dump(output, f, indent=2)

if __name__ == "__main__":
    main()
`;
  };

  const generateScript = (scriptId: string): string => {
    switch (scriptId) {
      case 'windows-powershell':
        return generateWindowsPowerShellScript();
      case 'linux-bash':
        return generateLinuxBashScript();
      case 'macos-bash':
        return generateMacOSScript();
      case 'cross-platform-python':
        return generatePythonScript();
      default:
        return '';
    }
  };

  const downloadScript = (scriptType: ScriptType) => {
    const script = generateScript(scriptType.id);
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hawk_detector_${scriptType.platform.toLowerCase()}${scriptType.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${scriptType.name} script`);
    setSelectedScript(scriptType.id);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingUpload(true);
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.detected_oems && Array.isArray(data.detected_oems)) {
        const processed = data.detected_oems.map((oem: any) => ({
          name: oem.name,
          category: oem.category,
          version: oem.version,
          manufacturer: oem.name,
          confidence: oem.confidence || 75
        }));
        
        setUploadedResults(processed);
        toast.success(`Found ${processed.length} OEMs from ${data.platform}`);
      } else {
        toast.error('Invalid file format');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process file');
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const addOEMFromResult = async (result: DetectedOEMResult) => {
    if (!user) return;
    
    try {
      const url = generateOEMUrl(result.name);
      await addOEMSource(user.id, result.name, url, result.category);
      
      setUploadedResults(prev => prev.filter(r => r !== result));
      
      if (onDetectionComplete) {
        onDetectionComplete();
      }
      
      toast.success(`Added ${result.name} to sources`);
    } catch (error) {
      console.error('Error adding OEM:', error);
      toast.error('Failed to add OEM source');
    }
  };

  const generateOEMUrl = (name: string): string => {
    const oemUrls: Record<string, string> = {
      'Microsoft': 'https://msrc.microsoft.com/update-guide',
      'Apple': 'https://support.apple.com/security-updates',
      'Intel': 'https://www.intel.com/content/www/us/en/security-center/default.html',
      'AMD': 'https://www.amd.com/en/corporate/product-security',
      'Dell': 'https://www.dell.com/support/security/',
      'HP': 'https://support.hp.com/us-en/security',
      'Lenovo': 'https://support.lenovo.com/solutions/len-2268'
    };
    
    return oemUrls[name] || `https://${name.toLowerCase().replace(/\s+/g, '')}.com/security`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          System Detection Scripts
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Simple, reliable scripts to detect OEMs on your system
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          {scriptTypes.map((scriptType) => (
            <Card key={scriptType.id} className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {scriptType.icon}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{scriptType.name}</h4>
                    <Badge variant="outline" className="text-xs mt-1">
                      {scriptType.platform}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{scriptType.description}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => downloadScript(scriptType)}
                >
                  <Download className="h-3 w-3 mr-2" />
                  Download {scriptType.extension}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedScript && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Script Downloaded!</h4>
                <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                  Run the script and upload the generated JSON file.
                </p>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p><strong>Steps:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Run the script with admin/sudo permissions if needed</li>
                    <li>Script will create "hawk_oem_results.json"</li>
                    <li>Upload the JSON file below</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="h-5 w-5 text-primary" />
            <h4 className="font-medium">Upload Results</h4>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="results-upload"
              disabled={isProcessingUpload}
            />
            <label
              htmlFor="results-upload"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
            >
              <Upload className="h-4 w-4" />
              {isProcessingUpload ? 'Processing...' : 'Upload JSON File'}
            </label>
            <span className="text-sm text-muted-foreground">
              Upload hawk_oem_results.json
            </span>
          </div>
        </div>

        {uploadedResults.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Detected OEMs ({uploadedResults.length})</h4>
            <div className="grid gap-3">
              {uploadedResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{result.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {result.category}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            result.confidence >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            result.confidence >= 75 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {result.confidence}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addOEMFromResult(result)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">Simple & Reliable</h4>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                These scripts are simplified for maximum compatibility and will always generate a JSON file, 
                even if no components are detected.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemScriptGenerator;
