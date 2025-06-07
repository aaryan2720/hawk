
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
      description: 'Simple Windows system detection using PowerShell'
    },
    {
      id: 'linux-bash',
      name: 'Linux Bash',
      platform: 'Linux',
      extension: '.sh',
      icon: <Terminal className="h-5 w-5" />,
      description: 'Simple Linux system detection using bash'
    },
    {
      id: 'macos-bash',
      name: 'macOS Bash',
      platform: 'macOS',
      extension: '.sh',
      icon: <Monitor className="h-5 w-5" />,
      description: 'Simple macOS system detection using bash'
    },
    {
      id: 'cross-platform-python',
      name: 'Cross-Platform Python',
      platform: 'Cross-Platform',
      extension: '.py',
      icon: <FileText className="h-5 w-5" />,
      description: 'Universal detection script using Python'
    }
  ];

  const generateWindowsPowerShellScript = (): string => {
    return `# HAWK OEM Detection Script for Windows PowerShell
Write-Host "HAWK OEM Detection Script - Starting..." -ForegroundColor Green

# Initialize results array
$results = @()

try {
    # System Information
    Write-Host "Detecting system manufacturer..." -ForegroundColor Cyan
    $systemInfo = Get-CimInstance -ClassName Win32_ComputerSystem -ErrorAction SilentlyContinue
    if ($systemInfo) {
        $results += @{
            "name" = $systemInfo.Manufacturer
            "category" = "System"
            "model" = $systemInfo.Model
            "confidence" = 95
        }
    }

    # CPU Information
    Write-Host "Detecting processor..." -ForegroundColor Cyan
    $processorInfo = Get-CimInstance -ClassName Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($processorInfo) {
        $cpuManufacturer = "Unknown"
        if ($processorInfo.Name -match "Intel") { $cpuManufacturer = "Intel" }
        elseif ($processorInfo.Name -match "AMD") { $cpuManufacturer = "AMD" }
        
        $results += @{
            "name" = $cpuManufacturer
            "category" = "CPU"
            "model" = $processorInfo.Name
            "confidence" = 90
        }
    }

    # Create final JSON structure
    $jsonOutput = @{
        "timestamp" = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        "platform" = "Windows"
        "script_version" = "1.0"
        "detected_oems" = $results
    }

    # Save to JSON file
    $outputFile = "hawk_oem_detection_results.json"
    $jsonOutput | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile -Encoding UTF8

    Write-Host ""
    Write-Host "SUCCESS: Detection completed!" -ForegroundColor Green
    Write-Host "Results saved to: $outputFile" -ForegroundColor Yellow
    Write-Host "Found $($results.Count) OEM components" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please upload the $outputFile file to the HAWK web application." -ForegroundColor Yellow

} catch {
    Write-Host "Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Creating minimal results file..." -ForegroundColor Yellow
    
    # Create minimal fallback
    $fallbackOutput = @{
        "timestamp" = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        "platform" = "Windows"
        "script_version" = "1.0"
        "detected_oems" = @()
        "error" = $_.Exception.Message
    }
    
    $fallbackOutput | ConvertTo-Json -Depth 10 | Out-File -FilePath "hawk_oem_detection_results.json" -Encoding UTF8
    Write-Host "Minimal results file created." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Script execution completed. Press any key to exit..." -ForegroundColor Gray
Read-Host
`;
  };

  const generateLinuxBashScript = (): string => {
    return `#!/bin/bash
# HAWK OEM Detection Script for Linux

echo "HAWK OEM Detection Script - Starting..."

# Create JSON file with proper structure
cat > hawk_oem_detection_results.json << 'EOF'
{
  "timestamp": "",
  "platform": "Linux",
  "script_version": "1.0",
  "detected_oems": []
}
EOF

# Update timestamp
TIMESTAMP=$(date -Iseconds)
sed -i "s/\"timestamp\": \"\"/\"timestamp\": \"$TIMESTAMP\"/" hawk_oem_detection_results.json

# Temporary file for OEMs
TEMP_OEMS=$(mktemp)

echo "Detecting system manufacturer..."
# System vendor
if [ -f /sys/class/dmi/id/sys_vendor ]; then
    VENDOR=$(cat /sys/class/dmi/id/sys_vendor 2>/dev/null | tr -d '\\0' | head -n1)
    MODEL=$(cat /sys/class/dmi/id/product_name 2>/dev/null | tr -d '\\0' | head -n1)
    if [ ! -z "$VENDOR" ] && [ "$VENDOR" != "To Be Filled By O.E.M." ]; then
        echo "    {\"name\": \"$VENDOR\", \"category\": \"System\", \"model\": \"$MODEL\", \"confidence\": 95}," >> $TEMP_OEMS
    fi
fi

echo "Detecting CPU..."
# CPU detection
if [ -f /proc/cpuinfo ]; then
    if grep -q "GenuineIntel" /proc/cpuinfo; then
        CPU_MODEL=$(grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | sed 's/^[ \\t]*//;s/[ \\t]*$//')
        echo "    {\"name\": \"Intel\", \"category\": \"CPU\", \"model\": \"$CPU_MODEL\", \"confidence\": 90}," >> $TEMP_OEMS
    elif grep -q "AuthenticAMD" /proc/cpuinfo; then
        CPU_MODEL=$(grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | sed 's/^[ \\t]*//;s/[ \\t]*$//')
        echo "    {\"name\": \"AMD\", \"category\": \"CPU\", \"model\": \"$CPU_MODEL\", \"confidence\": 90}," >> $TEMP_OEMS
    fi
fi

# Process results and update JSON
if [ -s $TEMP_OEMS ]; then
    # Remove last comma and add to JSON
    sed -i '$ s/,$//' $TEMP_OEMS
    sed -i '/\"detected_oems\": \\[/r '$TEMP_OEMS hawk_oem_detection_results.json
fi

# Clean up
rm -f $TEMP_OEMS

echo ""
echo "SUCCESS: Detection completed!"
echo "Results saved to: hawk_oem_detection_results.json"
echo "Please upload this file to the HAWK web application."
echo ""

# Show summary
OEM_COUNT=$(grep -c '"name":' hawk_oem_detection_results.json)
echo "Found $OEM_COUNT OEM components"
`;
  };

  const generateMacOSScript = (): string => {
    return `#!/bin/bash
# HAWK OEM Detection Script for macOS

echo "HAWK OEM Detection Script - Starting..."

# Create JSON structure
cat > hawk_oem_detection_results.json << 'EOF'
{
  "timestamp": "",
  "platform": "macOS", 
  "script_version": "1.0",
  "detected_oems": []
}
EOF

# Update timestamp
TIMESTAMP=$(date -Iseconds)
sed -i '' "s/\"timestamp\": \"\"/\"timestamp\": \"$TIMESTAMP\"/" hawk_oem_detection_results.json

# Temporary file for OEMs
TEMP_OEMS=$(mktemp)

echo "Detecting system information..."
# System info
MODEL=$(system_profiler SPHardwareDataType 2>/dev/null | grep "Model Name" | cut -d: -f2 | sed 's/^[ \\t]*//;s/[ \\t]*$//')
if [ ! -z "$MODEL" ]; then
    echo "    {\"name\": \"Apple\", \"category\": \"System\", \"model\": \"$MODEL\", \"confidence\": 95}," >> $TEMP_OEMS
fi

echo "Detecting CPU..."
# CPU info
CPU=$(system_profiler SPHardwareDataType 2>/dev/null | grep "Processor Name" | cut -d: -f2 | sed 's/^[ \\t]*//;s/[ \\t]*$//')
if echo "$CPU" | grep -iq "intel"; then
    echo "    {\"name\": \"Intel\", \"category\": \"CPU\", \"model\": \"$CPU\", \"confidence\": 90}," >> $TEMP_OEMS
elif echo "$CPU" | grep -iq "apple"; then
    echo "    {\"name\": \"Apple\", \"category\": \"CPU\", \"model\": \"$CPU\", \"confidence\": 90}," >> $TEMP_OEMS
fi

# Process results
if [ -s $TEMP_OEMS ]; then
    sed -i '' '$ s/,$//' $TEMP_OEMS
    sed -i '' '/\"detected_oems\": \\[/r '$TEMP_OEMS hawk_oem_detection_results.json
fi

rm -f $TEMP_OEMS

echo ""
echo "SUCCESS: Detection completed!"
echo "Results saved to: hawk_oem_detection_results.json"
echo "Please upload this file to the HAWK web application."
echo ""

OEM_COUNT=$(grep -c '"name":' hawk_oem_detection_results.json)
echo "Found $OEM_COUNT OEM components"
`;
  };

  const generatePythonScript = (): string => {
    return `#!/usr/bin/env python3
"""
HAWK OEM Detection Script - Cross-Platform Python
Simple and reliable OEM detection
"""

import json
import platform
import subprocess
import datetime
import sys
import os

def run_command(command):
    """Run a command safely and return output"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=10)
        return result.stdout.strip() if result.returncode == 0 else ""
    except:
        return ""

def detect_oems():
    """Detect OEMs based on platform"""
    results = {
        "timestamp": datetime.datetime.now().isoformat(),
        "platform": platform.system(),
        "script_version": "1.0",
        "detected_oems": []
    }
    
    system = platform.system().lower()
    print(f"HAWK OEM Detection Script - {platform.system()}")
    print("Collecting system information...")
    
    try:
        if system == "windows":
            # Windows detection
            import wmi
            c = wmi.WMI()
            for system_info in c.Win32_ComputerSystem():
                if system_info.Manufacturer:
                    results["detected_oems"].append({
                        "name": system_info.Manufacturer,
                        "category": "System",
                        "model": system_info.Model or "",
                        "confidence": 95
                    })
            
            for cpu in c.Win32_Processor():
                if "Intel" in cpu.Name:
                    results["detected_oems"].append({
                        "name": "Intel",
                        "category": "CPU",
                        "model": cpu.Name,
                        "confidence": 90
                    })
                elif "AMD" in cpu.Name:
                    results["detected_oems"].append({
                        "name": "AMD", 
                        "category": "CPU",
                        "model": cpu.Name,
                        "confidence": 90
                    })
                    
        elif system == "linux":
            # Linux detection
            vendor = run_command('cat /sys/class/dmi/id/sys_vendor 2>/dev/null')
            model = run_command('cat /sys/class/dmi/id/product_name 2>/dev/null')
            if vendor and vendor != "To Be Filled By O.E.M.":
                results["detected_oems"].append({
                    "name": vendor,
                    "category": "System",
                    "model": model,
                    "confidence": 95
                })
            
            # CPU detection
            cpu_info = run_command('grep "model name" /proc/cpuinfo | head -1')
            if "Intel" in cpu_info:
                results["detected_oems"].append({
                    "name": "Intel",
                    "category": "CPU", 
                    "model": cpu_info.split(":")[-1].strip(),
                    "confidence": 90
                })
            elif "AMD" in cpu_info:
                results["detected_oems"].append({
                    "name": "AMD",
                    "category": "CPU",
                    "model": cpu_info.split(":")[-1].strip(), 
                    "confidence": 90
                })
                
        elif system == "darwin":  # macOS
            # macOS detection
            model = run_command('system_profiler SPHardwareDataType | grep "Model Name"')
            if model:
                model_name = model.split(":")[-1].strip()
                results["detected_oems"].append({
                    "name": "Apple",
                    "category": "System",
                    "model": model_name,
                    "confidence": 95
                })
            
            cpu = run_command('system_profiler SPHardwareDataType | grep "Processor Name"')
            if cpu:
                cpu_name = cpu.split(":")[-1].strip()
                if "Intel" in cpu_name:
                    results["detected_oems"].append({
                        "name": "Intel",
                        "category": "CPU",
                        "model": cpu_name,
                        "confidence": 90
                    })
                elif "Apple" in cpu_name:
                    results["detected_oems"].append({
                        "name": "Apple",
                        "category": "CPU", 
                        "model": cpu_name,
                        "confidence": 90
                    })
                    
    except Exception as e:
        print(f"Warning: {e}")
        results["error"] = str(e)
    
    return results

def main():
    """Main function"""
    try:
        results = detect_oems()
        
        # Save results
        output_file = "hawk_oem_detection_results.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print("\\nSUCCESS: Detection completed!")
        print(f"Results saved to: {output_file}")
        print("Please upload this file to the HAWK web application.")
        print(f"\\nFound {len(results['detected_oems'])} OEM components")
        
        for oem in results["detected_oems"]:
            print(f"- {oem['name']} ({oem['category']})")
            
    except Exception as e:
        print(f"Error: {e}")
        # Create minimal fallback
        fallback = {
            "timestamp": datetime.datetime.now().isoformat(),
            "platform": platform.system(),
            "script_version": "1.0", 
            "detected_oems": [],
            "error": str(e)
        }
        with open("hawk_oem_detection_results.json", 'w') as f:
            json.dump(fallback, f, indent=2)
        sys.exit(1)

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
    a.download = `hawk_oem_detector_${scriptType.platform.toLowerCase()}${scriptType.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${scriptType.name} detection script`);
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
        toast.success(`Processed ${processed.length} detected OEMs from ${data.platform}`);
      } else {
        toast.error('Invalid file format. Please upload a valid HAWK detection results file.');
      }
    } catch (error) {
      console.error('Error processing upload:', error);
      toast.error('Failed to process uploaded file. Please check the file format.');
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
      
      toast.success(`Added ${result.name} to OEM sources`);
    } catch (error) {
      console.error('Error adding OEM from result:', error);
      toast.error('Failed to add OEM source');
    }
  };

  const generateOEMUrl = (name: string): string => {
    const oemUrls: Record<string, string> = {
      'Microsoft': 'https://msrc.microsoft.com/update-guide',
      'Apple': 'https://support.apple.com/security-updates',
      'Intel': 'https://www.intel.com/content/www/us/en/security-center/default.html',
      'AMD': 'https://www.amd.com/en/corporate/product-security',
      'NVIDIA': 'https://www.nvidia.com/security',
      'Samsung': 'https://security.samsungmobile.com',
      'Dell': 'https://www.dell.com/support/security/',
      'HP': 'https://support.hp.com/us-en/security',
      'Lenovo': 'https://support.lenovo.com/solutions/len-2268',
      'ASUS': 'https://www.asus.com/support/security-advisory/'
    };
    
    return oemUrls[name] || `https://${name.toLowerCase().replace(/\s+/g, '')}.com/security`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          System OEM Detection Scripts
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Download and run simplified, reliable scripts to detect OEMs on your system
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
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Script Downloaded</h4>
                <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                  Run the downloaded script and upload the generated JSON file below.
                </p>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p><strong>Instructions:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Run the script with appropriate permissions</li>
                    <li>The script will generate "hawk_oem_detection_results.json"</li>
                    <li>Upload the JSON file using the button below</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="h-5 w-5 text-primary" />
            <h4 className="font-medium">Upload Detection Results</h4>
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
              {isProcessingUpload ? 'Processing...' : 'Upload Results File'}
            </label>
            <span className="text-sm text-muted-foreground">
              Upload the JSON file generated by the detection script
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
                          {result.confidence}% confidence
                        </Badge>
                      </div>
                      {result.version && (
                        <p className="text-xs text-muted-foreground">Version: {result.version}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addOEMFromResult(result)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Add to Sources
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
              <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">Simplified & Reliable</h4>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                These simplified scripts focus on basic system detection with proper error handling and 
                guaranteed JSON file generation. They are designed to work reliably across different systems.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemScriptGenerator;
