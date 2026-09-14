import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileText, Monitor, Terminal, CheckCircle, AlertTriangle, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { addOEMSource } from '@/features/oem/services/oemService';

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
      id: 'windows-batch',
      name: 'Windows Batch',
      platform: 'Windows',
      extension: '.bat',
      icon: <Monitor className="h-5 w-5" />,
      description: 'Double-click to run on Windows'
    },
    {
      id: 'linux-bash',
      name: 'Linux/Unix Bash',
      platform: 'Linux/Unix',
      extension: '.sh',
      icon: <Terminal className="h-5 w-5" />,
      description: 'Run with: bash script.sh'
    },
    {
      id: 'android-termux',
      name: 'Android (Termux)',
      platform: 'Android',
      extension: '.sh',
      icon: <Smartphone className="h-5 w-5" />,
      description: 'Install Termux app, then run script'
    },
    {
      id: 'macos-bash',
      name: 'macOS Terminal',
      platform: 'macOS',
      extension: '.sh',
      icon: <Terminal className="h-5 w-5" />,
      description: 'Run in Terminal app'
    },
    {
      id: 'cross-platform-python',
      name: 'Python (Any OS)',
      platform: 'Cross-Platform',
      extension: '.py',
      icon: <FileText className="h-5 w-5" />,
      description: 'Requires Python 3.x'
    }
  ];

  const generateWindowsBatchScript = (): string => {
    return `@echo off
echo HAWK OEM Detection - Starting...
echo.

:: Create JSON file
(
echo {
echo   "timestamp": "%date% %time%",
echo   "platform": "Windows",
echo   "script_version": "1.0",
echo   "detected_oems": [
) > hawk_oem_results.json

:: Get system info
for /f "tokens=2 delims==" %%i in ('wmic computersystem get manufacturer /value 2^>nul ^| find "="') do set "mfg=%%i"
for /f "tokens=2 delims==" %%i in ('wmic computersystem get model /value 2^>nul ^| find "="') do set "model=%%i"

:: Add system manufacturer if valid
if defined mfg (
    if not "%mfg%"=="To Be Filled By O.E.M." (
        echo     {"name":"%mfg%","category":"System","model":"%model%","confidence":90}, >> hawk_oem_results.json
    )
)

:: Get CPU info
for /f "tokens=2 delims==" %%i in ('wmic cpu get name /value 2^>nul ^| find "="') do set "cpu=%%i"
if defined cpu (
    echo "%cpu%" | findstr /i "intel" >nul && echo     {"name":"Intel","category":"CPU","model":"%cpu%","confidence":85}, >> hawk_oem_results.json
    echo "%cpu%" | findstr /i "amd" >nul && echo     {"name":"AMD","category":"CPU","model":"%cpu%","confidence":85}, >> hawk_oem_results.json
)

:: Close JSON
echo     {"name":"DetectionComplete","category":"Status","confidence":100}
echo   ]
echo }
) >> hawk_oem_results.json

echo.
echo SUCCESS: hawk_oem_results.json created
echo Upload this file to HAWK System Monitor
pause`;
  };

  const generateLinuxBashScript = (): string => {
    return `#!/bin/bash
echo "HAWK OEM Detection - Starting..."

# Create JSON structure
cat > hawk_oem_results.json << 'EOF'
{
  "timestamp": "",
  "platform": "Linux",
  "script_version": "1.0",
  "detected_oems": [
EOF

# Add timestamp
echo "    {\"timestamp_marker\":\"$(date -Iseconds 2>/dev/null || date)\",\"category\":\"Metadata\",\"confidence\":100}," >> hawk_oem_results.json

# System vendor detection
if [ -f /sys/class/dmi/id/sys_vendor ]; then
    vendor=$(cat /sys/class/dmi/id/sys_vendor 2>/dev/null | tr -d '\\0\\n\\r' | sed 's/[^a-zA-Z0-9 ]//g')
    model=$(cat /sys/class/dmi/id/product_name 2>/dev/null | tr -d '\\0\\n\\r' | sed 's/[^a-zA-Z0-9 ]//g')
    if [ ! -z "$vendor" ] && [ "$vendor" != "To Be Filled By O.E.M." ]; then
        echo "    {\"name\":\"$vendor\",\"category\":\"System\",\"model\":\"$model\",\"confidence\":90}," >> hawk_oem_results.json
    fi
fi

# CPU detection
if [ -f /proc/cpuinfo ]; then
    if grep -q "GenuineIntel" /proc/cpuinfo 2>/dev/null; then
        cpu_model=$(grep "model name" /proc/cpuinfo 2>/dev/null | head -1 | cut -d: -f2 | sed 's/^[ \\t]*//' | sed 's/[^a-zA-Z0-9 ]//g')
        echo "    {\"name\":\"Intel\",\"category\":\"CPU\",\"model\":\"$cpu_model\",\"confidence\":85}," >> hawk_oem_results.json
    elif grep -q "AuthenticAMD" /proc/cpuinfo 2>/dev/null; then
        cpu_model=$(grep "model name" /proc/cpuinfo 2>/dev/null | head -1 | cut -d: -f2 | sed 's/^[ \\t]*//' | sed 's/[^a-zA-Z0-9 ]//g')
        echo "    {\"name\":\"AMD\",\"category\":\"CPU\",\"model\":\"$cpu_model\",\"confidence\":85}," >> hawk_oem_results.json
    fi
fi

# Close JSON
cat >> hawk_oem_results.json << 'EOF'
    {"name":"DetectionComplete","category":"Status","confidence":100}
  ]
}
EOF

echo "SUCCESS: hawk_oem_results.json created"
echo "Found components - upload the JSON file to HAWK"
chmod +r hawk_oem_results.json`;
  };

  const generateAndroidTermuxScript = (): string => {
    return `#!/bin/bash
echo "HAWK OEM Detection for Android (Termux)"
echo "Make sure you have Termux app installed from F-Droid or Play Store"

# Create JSON structure
cat > hawk_oem_results.json << 'EOF'
{
  "timestamp": "",
  "platform": "Android",
  "script_version": "1.0",
  "detected_oems": [
EOF

# Add timestamp
echo "    {\"timestamp_marker\":\"$(date -Iseconds 2>/dev/null || date)\",\"category\":\"Metadata\",\"confidence\":100}," >> hawk_oem_results.json

# Android device info
if command -v getprop >/dev/null 2>&1; then
    manufacturer=$(getprop ro.product.manufacturer 2>/dev/null | sed 's/[^a-zA-Z0-9 ]//g')
    model=$(getprop ro.product.model 2>/dev/null | sed 's/[^a-zA-Z0-9 ]//g')
    brand=$(getprop ro.product.brand 2>/dev/null | sed 's/[^a-zA-Z0-9 ]//g')
    
    if [ ! -z "$manufacturer" ]; then
        echo "    {\"name\":\"$manufacturer\",\"category\":\"Device\",\"model\":\"$model\",\"brand\":\"$brand\",\"confidence\":95}," >> hawk_oem_results.json
    fi
    
    # CPU info
    cpu_arch=$(getprop ro.product.cpu.abi 2>/dev/null | sed 's/[^a-zA-Z0-9 ]//g')
    if [ ! -z "$cpu_arch" ]; then
        echo "    {\"name\":\"Android_CPU\",\"category\":\"CPU\",\"architecture\":\"$cpu_arch\",\"confidence\":80}," >> hawk_oem_results.json
    fi
else
    echo "    {\"name\":\"Android_Device\",\"category\":\"Device\",\"note\":\"Limited detection without root\",\"confidence\":50}," >> hawk_oem_results.json
fi

# Close JSON
cat >> hawk_oem_results.json << 'EOF'
    {"name":"DetectionComplete","category":"Status","confidence":100}
  ]
}
EOF

echo "SUCCESS: hawk_oem_results.json created"
echo "File saved in: $(pwd)/hawk_oem_results.json"
echo "Upload this file to HAWK System Monitor"`;
  };

  const generateMacOSScript = (): string => {
    return `#!/bin/bash
echo "HAWK OEM Detection for macOS"

# Create JSON structure
cat > hawk_oem_results.json << 'EOF'
{
  "timestamp": "",
  "platform": "macOS",
  "script_version": "1.0",
  "detected_oems": [
EOF

# Add timestamp
echo "    {\"timestamp_marker\":\"$(date -Iseconds)\",\"category\":\"Metadata\",\"confidence\":100}," >> hawk_oem_results.json

# macOS always has Apple as manufacturer
model_name=$(system_profiler SPHardwareDataType 2>/dev/null | grep "Model Name" | cut -d: -f2 | sed 's/^[ \\t]*//' | sed 's/[^a-zA-Z0-9 ]//g')
model_id=$(system_profiler SPHardwareDataType 2>/dev/null | grep "Model Identifier" | cut -d: -f2 | sed 's/^[ \\t]*//' | sed 's/[^a-zA-Z0-9 ]//g')

if [ ! -z "$model_name" ]; then
    echo "    {\"name\":\"Apple\",\"category\":\"System\",\"model\":\"$model_name\",\"identifier\":\"$model_id\",\"confidence\":100}," >> hawk_oem_results.json
fi

# CPU information
cpu_name=$(system_profiler SPHardwareDataType 2>/dev/null | grep "Processor Name" | cut -d: -f2 | sed 's/^[ \\t]*//' | sed 's/[^a-zA-Z0-9 ]//g')
if echo "$cpu_name" | grep -q "Intel"; then
    echo "    {\"name\":\"Intel\",\"category\":\"CPU\",\"model\":\"$cpu_name\",\"confidence\":90}," >> hawk_oem_results.json
elif echo "$cpu_name" | grep -q "Apple"; then
    echo "    {\"name\":\"Apple\",\"category\":\"CPU\",\"model\":\"$cpu_name\",\"confidence\":95}," >> hawk_oem_results.json
fi

# Close JSON
cat >> hawk_oem_results.json << 'EOF'
    {"name":"DetectionComplete","category":"Status","confidence":100}
  ]
}
EOF

echo "SUCCESS: hawk_oem_results.json created"
echo "Upload this file to HAWK System Monitor"`;
  };

  const generatePythonScript = (): string => {
    return `#!/usr/bin/env python3
import json
import platform
import subprocess
import datetime
import os
import re

def safe_run(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        return result.stdout.strip() if result.returncode == 0 else ""
    except:
        return ""

def clean_string(s):
    return re.sub(r'[^a-zA-Z0-9 ]', '', str(s)) if s else ""

def detect_components():
    results = []
    system = platform.system()
    
    print(f"HAWK OEM Detection - {system}")
    
    # Add metadata
    results.append({
        "timestamp_marker": datetime.datetime.now().isoformat(),
        "category": "Metadata",
        "confidence": 100
    })
    
    if system == "Windows":
        # System info
        mfg = safe_run('wmic computersystem get manufacturer /value | findstr Manufacturer=')
        if mfg and "=" in mfg:
            manufacturer = clean_string(mfg.split("=")[1])
            if manufacturer and manufacturer != "To Be Filled By O.E.M.":
                model = safe_run('wmic computersystem get model /value | findstr Model=')
                model_name = clean_string(model.split("=")[1]) if "=" in model else ""
                results.append({
                    "name": manufacturer,
                    "category": "System",
                    "model": model_name,
                    "confidence": 90
                })
        
        # CPU info
        cpu = safe_run('wmic cpu get name /value | findstr Name=')
        if cpu and "=" in cpu:
            cpu_name = clean_string(cpu.split("=")[1])
            if "Intel" in cpu_name:
                results.append({"name": "Intel", "category": "CPU", "model": cpu_name, "confidence": 85})
            elif "AMD" in cpu_name:
                results.append({"name": "AMD", "category": "CPU", "model": cpu_name, "confidence": 85})
            
    elif system == "Linux":
        # System vendor
        try:
            with open('/sys/class/dmi/id/sys_vendor', 'r') as f:
                vendor = clean_string(f.read().strip())
            with open('/sys/class/dmi/id/product_name', 'r') as f:
                model = clean_string(f.read().strip())
            if vendor and vendor != "To Be Filled By O.E.M.":
                results.append({"name": vendor, "category": "System", "model": model, "confidence": 90})
        except:
            pass
        
        # CPU info
        cpu_info = safe_run('grep "model name" /proc/cpuinfo | head -1')
        if "Intel" in cpu_info:
            cpu_model = clean_string(cpu_info.split(":")[-1])
            results.append({"name": "Intel", "category": "CPU", "model": cpu_model, "confidence": 85})
        elif "AMD" in cpu_info:
            cpu_model = clean_string(cpu_info.split(":")[-1])
            results.append({"name": "AMD", "category": "CPU", "model": cpu_model, "confidence": 85})
            
    elif system == "Darwin":  # macOS
        model = safe_run('system_profiler SPHardwareDataType | grep "Model Name"')
        if model:
            model_name = clean_string(model.split(":")[-1])
            results.append({"name": "Apple", "category": "System", "model": model_name, "confidence": 100})
        
        cpu = safe_run('system_profiler SPHardwareDataType | grep "Processor Name"')
        if cpu:
            cpu_name = clean_string(cpu.split(":")[-1])
            if "Intel" in cpu_name:
                results.append({"name": "Intel", "category": "CPU", "model": cpu_name, "confidence": 90})
            elif "Apple" in cpu_name:
                results.append({"name": "Apple", "category": "CPU", "model": cpu_name, "confidence": 95})
    
    # Add completion marker
    results.append({"name": "DetectionComplete", "category": "Status", "confidence": 100})
    return results

def main():
    try:
        results = detect_components()
        
        output = {
            "timestamp": datetime.datetime.now().isoformat(),
            "platform": platform.system(),
            "script_version": "1.0",
            "detected_oems": results
        }
        
        with open("hawk_oem_results.json", "w") as f:
            json.dump(output, f, indent=2)
        
        print("SUCCESS: hawk_oem_results.json created")
        print(f"Found {len([r for r in results if r.get('category') != 'Metadata' and r.get('category') != 'Status'])} components")
        print("Upload the JSON file to HAWK")
        
    except Exception as e:
        print(f"Error: {e}")
        # Create basic file even on error
        output = {
            "timestamp": datetime.datetime.now().isoformat(),
            "platform": platform.system(),
            "script_version": "1.0",
            "detected_oems": [
                {"name": "DetectionError", "category": "Status", "error": str(e), "confidence": 0}
            ]
        }
        with open("hawk_oem_results.json", "w") as f:
            json.dump(output, f, indent=2)
        print("Created error results file")

if __name__ == "__main__":
    main()`;
  };

  const generateScript = (scriptId: string): string => {
    switch (scriptId) {
      case 'windows-batch':
        return generateWindowsBatchScript();
      case 'linux-bash':
        return generateLinuxBashScript();
      case 'android-termux':
        return generateAndroidTermuxScript();
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
    a.download = `hawk_detector_${scriptType.platform.toLowerCase().replace(/[^a-z0-9]/g, '_')}${scriptType.extension}`;
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
        const processed = data.detected_oems
          .filter((oem: any) => oem.category !== 'Metadata' && oem.category !== 'Status')
          .map((oem: any) => ({
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
      'Lenovo': 'https://support.lenovo.com/solutions/len-2268',
      'Samsung': 'https://security.samsungmobile.com/',
      'Google': 'https://source.android.com/security/bulletin'
    };
    
    return oemUrls[name] || `https://${name.toLowerCase().replace(/\s+/g, '')}.com/security`;
  };

  const getInstructionsForScript = (scriptId: string): string[] => {
    switch (scriptId) {
      case 'windows-batch':
        return [
          'Double-click the downloaded .bat file',
          'Wait for it to complete (it will pause at the end)',
          'Look for "hawk_oem_results.json" in the same folder',
          'Upload the JSON file below'
        ];
      case 'linux-bash':
        return [
          'Open terminal and navigate to the script location',
          'Make it executable: chmod +x script.sh',
          'Run: ./script.sh (or bash script.sh)',
          'Upload the generated hawk_oem_results.json file'
        ];
      case 'android-termux':
        return [
          'Install Termux app from F-Droid or Play Store',
          'Open Termux and navigate to the script',
          'Run: bash script.sh',
          'Upload the generated JSON file'
        ];
      case 'macos-bash':
        return [
          'Open Terminal app',
          'Navigate to script location: cd /path/to/script',
          'Make executable: chmod +x script.sh',
          'Run: ./script.sh',
          'Upload the generated JSON file'
        ];
      case 'cross-platform-python':
        return [
          'Ensure Python 3.x is installed',
          'Open terminal/command prompt',
          'Run: python script.py (or python3 script.py)',
          'Upload the generated JSON file'
        ];
      default:
        return ['Download and run the script', 'Upload the generated JSON file'];
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          System Detection Scripts
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Download and run scripts to detect OEMs on your system - now supporting all platforms!
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
                  Follow these steps to generate the detection results:
                </p>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p><strong>Steps:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {getInstructionsForScript(selectedScript).map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
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
              <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">Platform-Specific Tips</h4>
              <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                <li><strong>Windows:</strong> .bat file is easiest - just double-click</li>
                <li><strong>Android:</strong> Requires Termux app for terminal access</li>
                <li><strong>Linux/macOS:</strong> May need to make script executable first</li>
                <li><strong>Python:</strong> Works everywhere but requires Python 3.x</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemScriptGenerator;
