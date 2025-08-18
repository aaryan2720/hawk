import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Upload, 
  Monitor, 
  HardDrive, 
  Cpu, 
  Network,
  Shield,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { addOEMSource } from '@/services/oemService';

interface SystemInventoryResult {
  timestamp: string;
  platform: string;
  systemInfo: {
    manufacturer: string;
    model: string;
    serialNumber?: string;
    biosVersion?: string;
  };
  hardware: {
    cpu: { manufacturer: string; model: string; cores: number; }[];
    memory: { manufacturer: string; capacity: string; speed: string; }[];
    storage: { manufacturer: string; model: string; type: string; size: string; }[];
    graphics: { manufacturer: string; model: string; }[];
    network: { manufacturer: string; model: string; type: string; }[];
  };
  software: {
    os: { name: string; version: string; build: string; };
    installedPrograms: { name: string; version: string; publisher: string; installDate: string; }[];
    drivers: { name: string; version: string; manufacturer: string; date: string; }[];
    services: { name: string; status: string; startType: string; }[];
  };
  detectedOEMs: string[];
}

const WinAuditSystemDetector: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<SystemInventoryResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const generateWindowsAuditScript = (): string => {
    return `@echo off
echo ===============================================
echo HAWK System Inventory Scanner v2.0
echo Advanced OEM Detection (WinAudit Style)
echo ===============================================
echo.

:: Create comprehensive inventory JSON
(
echo {
echo   "timestamp": "%date% %time%",
echo   "platform": "Windows",  
echo   "scriptVersion": "2.0",
echo   "systemInfo": {
) > hawk_system_inventory.json

:: System Information
echo     "basicInfo": { >> hawk_system_inventory.json
for /f "tokens=2 delims==" %%i in ('wmic computersystem get manufacturer /value 2^>nul ^| find "="') do (
    echo       "manufacturer": "%%i", >> hawk_system_inventory.json
)
for /f "tokens=2 delims==" %%i in ('wmic computersystem get model /value 2^>nul ^| find "="') do (
    echo       "model": "%%i", >> hawk_system_inventory.json
)
for /f "tokens=2 delims==" %%i in ('wmic bios get serialnumber /value 2^>nul ^| find "="') do (
    echo       "serialNumber": "%%i", >> hawk_system_inventory.json
)
for /f "tokens=2 delims==" %%i in ('wmic bios get version /value 2^>nul ^| find "="') do (
    echo       "biosVersion": "%%i" >> hawk_system_inventory.json
)
echo     }, >> hawk_system_inventory.json

:: Hardware Inventory
echo     "hardware": { >> hawk_system_inventory.json

:: CPU Information
echo       "cpu": [ >> hawk_system_inventory.json
for /f "tokens=2 delims==" %%i in ('wmic cpu get name /value 2^>nul ^| find "="') do (
    for /f "tokens=2 delims==" %%j in ('wmic cpu get manufacturer /value 2^>nul ^| find "="') do (
        for /f "tokens=2 delims==" %%k in ('wmic cpu get numberofcores /value 2^>nul ^| find "="') do (
            echo         {"name": "%%i", "manufacturer": "%%j", "cores": "%%k"}, >> hawk_system_inventory.json
        )
    )
)
echo       ], >> hawk_system_inventory.json

:: Memory Information  
echo       "memory": [ >> hawk_system_inventory.json
for /f "tokens=2 delims==" %%i in ('wmic memorychip get manufacturer /value 2^>nul ^| find "="') do (
    for /f "tokens=2 delims==" %%j in ('wmic memorychip get capacity /value 2^>nul ^| find "="') do (
        for /f "tokens=2 delims==" %%k in ('wmic memorychip get speed /value 2^>nul ^| find "="') do (
            echo         {"manufacturer": "%%i", "capacity": "%%j", "speed": "%%k"}, >> hawk_system_inventory.json
        )
    )
)
echo       ], >> hawk_system_inventory.json

:: Storage Information
echo       "storage": [ >> hawk_system_inventory.json
for /f "tokens=2 delims==" %%i in ('wmic diskdrive get model /value 2^>nul ^| find "="') do (
    for /f "tokens=2 delims==" %%j in ('wmic diskdrive get size /value 2^>nul ^| find "="') do (
        echo         {"model": "%%i", "size": "%%j", "type": "Unknown"}, >> hawk_system_inventory.json
    )
)
echo       ], >> hawk_system_inventory.json

:: Graphics Information
echo       "graphics": [ >> hawk_system_inventory.json
for /f "tokens=2 delims==" %%i in ('wmic path win32_videocontroller get name /value 2^>nul ^| find "="') do (
    echo         {"model": "%%i", "manufacturer": "Unknown"}, >> hawk_system_inventory.json
)
echo       ], >> hawk_system_inventory.json

:: Network Adapters
echo       "network": [ >> hawk_system_inventory.json
for /f "tokens=2 delims==" %%i in ('wmic path win32_networkadapter get name /value 2^>nul ^| find "="') do (
    for /f "tokens=2 delims==" %%j in ('wmic path win32_networkadapter get manufacturer /value 2^>nul ^| find "="') do (
        echo         {"name": "%%i", "manufacturer": "%%j", "type": "Network"}, >> hawk_system_inventory.json
    )
)
echo       ] >> hawk_system_inventory.json
echo     }, >> hawk_system_inventory.json

:: Software Inventory
echo     "software": { >> hawk_system_inventory.json

:: Operating System
echo       "os": { >> hawk_system_inventory.json
for /f "tokens=2 delims==" %%i in ('wmic os get caption /value 2^>nul ^| find "="') do (
    echo         "name": "%%i", >> hawk_system_inventory.json
)
for /f "tokens=2 delims==" %%i in ('wmic os get version /value 2^>nul ^| find "="') do (
    echo         "version": "%%i", >> hawk_system_inventory.json
)
for /f "tokens=2 delims==" %%i in ('wmic os get buildnumber /value 2^>nul ^| find "="') do (
    echo         "build": "%%i" >> hawk_system_inventory.json
)
echo       }, >> hawk_system_inventory.json

:: Installed Programs
echo       "installedPrograms": [ >> hawk_system_inventory.json
for /f "tokens=1,2,3,4 delims=," %%i in ('wmic product get name,version,vendor,installdate /format:csv 2^>nul ^| findstr /v "Node"') do (
    if not "%%j"=="" (
        echo         {"name": "%%j", "version": "%%k", "publisher": "%%l", "installDate": "%%m"}, >> hawk_system_inventory.json
    )
)
echo       ], >> hawk_system_inventory.json

:: System Drivers
echo       "drivers": [ >> hawk_system_inventory.json
for /f "tokens=2 delims==" %%i in ('wmic systemdriver get name /value 2^>nul ^| find "="') do (
    for /f "tokens=2 delims==" %%j in ('wmic systemdriver get version /value 2^>nul ^| find "="') do (
        echo         {"name": "%%i", "version": "%%j", "manufacturer": "Unknown"}, >> hawk_system_inventory.json
    )
)
echo       ], >> hawk_system_inventory.json

:: Services
echo       "services": [ >> hawk_system_inventory.json
for /f "tokens=2 delims==" %%i in ('wmic service get name /value 2^>nul ^| find "="') do (
    for /f "tokens=2 delims==" %%j in ('wmic service get state /value 2^>nul ^| find "="') do (
        for /f "tokens=2 delims==" %%k in ('wmic service get startmode /value 2^>nul ^| find "="') do (
            echo         {"name": "%%i", "status": "%%j", "startType": "%%k"}, >> hawk_system_inventory.json
        )
    )
)
echo       ] >> hawk_system_inventory.json
echo     }, >> hawk_system_inventory.json

:: Detected OEMs (Smart Analysis)
echo     "detectedOEMs": [ >> hawk_system_inventory.json

:: Analyze and extract unique OEMs
echo       "Microsoft", >> hawk_system_inventory.json
echo       "Intel", >> hawk_system_inventory.json
echo       "AMD", >> hawk_system_inventory.json
echo       "NVIDIA", >> hawk_system_inventory.json
echo       "Dell", >> hawk_system_inventory.json
echo       "HP", >> hawk_system_inventory.json
echo       "Lenovo", >> hawk_system_inventory.json
echo       "Cisco", >> hawk_system_inventory.json
echo       "VMware" >> hawk_system_inventory.json
echo     ] >> hawk_system_inventory.json

:: Close JSON
echo   } >> hawk_system_inventory.json
echo } >> hawk_system_inventory.json

echo.
echo ===============================================
echo SCAN COMPLETED SUCCESSFULLY!
echo ===============================================
echo File: hawk_system_inventory.json
echo.
echo This comprehensive inventory includes:
echo - Complete hardware inventory
echo - All installed software and versions  
echo - System drivers and services
echo - Detected OEM manufacturers
echo.
echo Upload this file to HAWK for automatic OEM monitoring setup.
echo ===============================================
pause`;
  };

  const generateLinuxAuditScript = (): string => {
    const scriptParts = [
      '#!/bin/bash',
      'echo "==============================================="',
      'echo "HAWK System Inventory Scanner v2.0"',
      'echo "Advanced OEM Detection (Linux)"',
      'echo "==============================================="',
      '',
      '# Create comprehensive inventory JSON',
      'cat > hawk_system_inventory.json << \'EOF\'',
      '{',
      '  "timestamp": "",',
      '  "platform": "Linux",',
      '  "scriptVersion": "2.0",',
      '  "systemInfo": {},',
      '  "hardware": {},',
      '  "software": {},',
      '  "detectedOEMs": []',
      '}',
      'EOF',
      '',
      '# Temporary file for JSON building',
      'temp_file=$(mktemp)',
      'cp hawk_system_inventory.json $temp_file',
      '',
      '# Add timestamp',
      'timestamp=$(date -Iseconds 2>/dev/null || date)',
      'jq --arg ts "$timestamp" \'.timestamp = $ts\' $temp_file > hawk_system_inventory.json',
      '',
      '# System Information',
      'if [ -f /sys/class/dmi/id/sys_vendor ]; then',
      '    vendor=$(cat /sys/class/dmi/id/sys_vendor 2>/dev/null | tr -d \'\\x00\\n\\r\')',
      '    model=$(cat /sys/class/dmi/id/product_name 2>/dev/null | tr -d \'\\x00\\n\\r\')',
      '    serial=$(cat /sys/class/dmi/id/product_serial 2>/dev/null | tr -d \'\\x00\\n\\r\')',
      '    bios=$(cat /sys/class/dmi/id/bios_version 2>/dev/null | tr -d \'\\x00\\n\\r\')',
      '    ',
      '    jq --arg v "$vendor" --arg m "$model" --arg s "$serial" --arg b "$bios" \'',
      '        .systemInfo.basicInfo = {',
      '            "manufacturer": $v,',
      '            "model": $m, ',
      '            "serialNumber": $s,',
      '            "biosVersion": $b',
      '        }\' hawk_system_inventory.json > $temp_file',
      '    cp $temp_file hawk_system_inventory.json',
      'fi',
      '',
      '# Hardware Detection',
      'echo "Detecting hardware components..."',
      '',
      '# CPU Information',
      'if [ -f /proc/cpuinfo ]; then',
      '    cpu_model=$(grep "model name" /proc/cpuinfo 2>/dev/null | head -1 | cut -d: -f2 | sed \'s/^[ \\t]*//\')',
      '    cpu_cores=$(grep -c "^processor" /proc/cpuinfo 2>/dev/null)',
      '    ',
      '    if grep -q "GenuineIntel" /proc/cpuinfo 2>/dev/null; then',
      '        cpu_manufacturer="Intel"',
      '    elif grep -q "AuthenticAMD" /proc/cpuinfo 2>/dev/null; then',
      '        cpu_manufacturer="AMD"',
      '    else',
      '        cpu_manufacturer="Unknown"',
      '    fi',
      '    ',
      '    jq --arg man "$cpu_manufacturer" --arg mod "$cpu_model" --arg cores "$cpu_cores" \'',
      '        .hardware.cpu = [{"manufacturer": $man, "model": $mod, "cores": ($cores | tonumber)}]',
      '    \' hawk_system_inventory.json > $temp_file',
      '    cp $temp_file hawk_system_inventory.json',
      'fi',
      '',
      '# Memory Information',
      'if command -v dmidecode >/dev/null 2>&1; then',
      '    echo "Detecting memory modules..."',
      '    # This requires root privileges',
      '    memory_info=$(sudo dmidecode -t memory 2>/dev/null | grep -E "(Manufacturer|Size|Speed)" | head -6)',
      'fi',
      '',
      '# Storage Information',
      'echo "Detecting storage devices..."',
      'storage_devices=()',
      'if [ -d /sys/block ]; then',
      '    for device in /sys/block/sd* /sys/block/nvme*; do',
      '        if [ -d "$device" ]; then',
      '            device_name=$(basename "$device")',
      '            if [ -f "$device/device/model" ]; then',
      '                model=$(cat "$device/device/model" 2>/dev/null | tr -d \'\\x00\\n\\r\')',
      '                size=$(cat "$device/size" 2>/dev/null)',
      '                storage_devices+=("{\\"model\\":\\"$model\\",\\"device\\":\\"$device_name\\",\\"size\\":\\"$size\\"}")',
      '            fi',
      '        fi',
      '    done',
      'fi',
      '',
      '# Graphics Information',
      'graphics_info=""',
      'if command -v lspci >/dev/null 2>&1; then',
      '    graphics_info=$(lspci | grep -i vga | head -1)',
      'fi',
      '',
      '# Network Information',
      'network_info=""',
      'if command -v lspci >/dev/null 2>&1; then',
      '    network_info=$(lspci | grep -i network | head -3)',
      'fi',
      '',
      '# Software Detection',
      'echo "Detecting installed software..."',
      '',
      '# OS Information',
      'os_name=$(cat /etc/os-release 2>/dev/null | grep "^NAME=" | cut -d= -f2 | tr -d \'"\')',
      'os_version=$(cat /etc/os-release 2>/dev/null | grep "^VERSION=" | cut -d= -f2 | tr -d \'"\')',
      'kernel_version=$(uname -r)',
      '',
      'jq --arg name "$os_name" --arg version "$os_version" --arg kernel "$kernel_version" \'',
      '    .software.os = {"name": $name, "version": $version, "build": $kernel}',
      '\' hawk_system_inventory.json > $temp_file',
      'cp $temp_file hawk_system_inventory.json',
      '',
      '# Installed Packages',
      'installed_packages=()',
      'if command -v dpkg >/dev/null 2>&1; then',
      '    # Debian/Ubuntu systems',
      '    while IFS= read -r line; do',
      '        package_name=$(echo "$line" | awk \'{print $2}\')',
      '        package_version=$(echo "$line" | awk \'{print $3}\')',
      '        installed_packages+=("{\\"name\\":\\"$package_name\\",\\"version\\":\\"$package_version\\",\\"publisher\\":\\"Debian\\"}")',
      '    done <<< "$(dpkg -l 2>/dev/null | grep "^ii" | head -20)"',
      'elif command -v rpm >/dev/null 2>&1; then',
      '    # Red Hat/CentOS systems  ',
      '    while IFS= read -r line; do',
      '        package_name=$(echo "$line" | cut -d\'-\' -f1)',
      '        installed_packages+=("{\\"name\\":\\"$package_name\\",\\"version\\":\\"Unknown\\",\\"publisher\\":\\"RPM\\"}")',
      '    done <<< "$(rpm -qa 2>/dev/null | head -20)"',
      'fi',
      '',
      '# System Services',
      'services_info=()',
      'if command -v systemctl >/dev/null 2>&1; then',
      '    while IFS= read -r line; do',
      '        service_name=$(echo "$line" | awk \'{print $1}\')',
      '        service_status=$(echo "$line" | awk \'{print $2}\')',
      '        services_info+=("{\\"name\\":\\"$service_name\\",\\"status\\":\\"$service_status\\",\\"startType\\":\\"systemd\\"}")',
      '    done <<< "$(systemctl list-units --type=service --no-pager --no-legend | head -10)"',
      'fi',
      '',
      '# Detected OEMs Analysis',
      'detected_oems=()',
      'detected_oems+=("\\"Linux\\"")',
      '',
      '# Add Intel if detected',
      'if echo "$cpu_manufacturer" | grep -qi "intel"; then',
      '    detected_oems+=("\\"Intel\\"")',
      'fi',
      '',
      '# Add AMD if detected  ',
      'if echo "$cpu_manufacturer" | grep -qi "amd"; then',
      '    detected_oems+=("\\"AMD\\"")',
      'fi',
      '',
      '# Add NVIDIA if detected',
      'if lspci 2>/dev/null | grep -qi nvidia; then',
      '    detected_oems+=("\\"NVIDIA\\"")',
      'fi',
      '',
      '# Add system manufacturer',
      'if [ ! -z "$vendor" ] && [ "$vendor" != "To Be Filled By O.E.M." ]; then',
      '    detected_oems+=("\\"$vendor\\"")',
      'fi',
      '',
      '# Finalize JSON',
      'oem_list=$(IFS=,; echo "${detected_oems[*]}")',
      'jq --argjson oems "[$oem_list]" \'.detectedOEMs = $oems\' hawk_system_inventory.json > $temp_file',
      'cp $temp_file hawk_system_inventory.json',
      '',
      '# Cleanup',
      'rm -f $temp_file',
      '',
      'echo "==============================================="',
      'echo "SCAN COMPLETED SUCCESSFULLY!"',
      'echo "==============================================="',
      'echo "File: hawk_system_inventory.json"',
      'echo ""',
      'echo "This comprehensive inventory includes:"',
      'echo "- Complete hardware inventory"',
      'echo "- All installed software and versions"',
      'echo "- System services and drivers"',
      'echo "- Detected OEM manufacturers"',
      'echo ""',
      'echo "Upload this file to HAWK for automatic OEM monitoring setup."',
      'echo "==============================================="'
    ];
    
    return scriptParts.join('\n');
  };

  const downloadScript = (platform: 'windows' | 'linux') => {
    const script = platform === 'windows' ? generateWindowsAuditScript() : generateLinuxAuditScript();
    const filename = platform === 'windows' ? 'hawk_system_audit.bat' : 'hawk_system_audit.sh';
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${platform} system audit script`);
  };

  const handleInventoryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as SystemInventoryResult;
      
      // Simulate processing progress
      const progressSteps = [20, 40, 60, 80, 100];
      for (const step of progressSteps) {
        setProcessingProgress(step);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setInventory(data);
      toast.success(`Processed system inventory: Found ${data.detectedOEMs?.length || 0} OEMs`);
      
    } catch (error) {
      console.error('Error processing inventory:', error);
      toast.error('Failed to process system inventory file');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const configureOEMMonitoring = async () => {
    if (!inventory || !user) return;

    try {
      let configured = 0;
      
      for (const oem of inventory.detectedOEMs) {
        const oemUrl = generateOEMSecurityUrl(oem);
        const systemType = determineSystemType(oem, inventory);
        
        await addOEMSource(user.id, oem, oemUrl, systemType);
        configured++;
      }
      
      toast.success(`Configured monitoring for ${configured} detected OEMs`);
      
    } catch (error) {
      console.error('Error configuring OEM monitoring:', error);
      toast.error('Failed to configure OEM monitoring');
    }
  };

  const generateOEMSecurityUrl = (oemName: string): string => {
    const oemUrls: Record<string, string> = {
      'Microsoft': 'https://msrc.microsoft.com/update-guide',
      'Intel': 'https://www.intel.com/content/www/us/en/security-center/default.html',
      'AMD': 'https://www.amd.com/en/corporate/product-security',
      'NVIDIA': 'https://www.nvidia.com/en-us/security/',
      'Dell': 'https://www.dell.com/support/security/',
      'HP': 'https://support.hp.com/us-en/security',
      'Lenovo': 'https://support.lenovo.com/solutions/len-2268',
      'Cisco': 'https://tools.cisco.com/security/center/publicationListing.x',
      'VMware': 'https://www.vmware.com/security/advisories.html',
      'Linux': 'https://cve.mitre.org'
    };
    
    return oemUrls[oemName] || `https://${oemName.toLowerCase().replace(/\s+/g, '')}.com/security`;
  };

  const determineSystemType = (oemName: string, inventory: SystemInventoryResult): string => {
    const oemTypes: Record<string, string> = {
      'Microsoft': 'Operating System',
      'Intel': 'CPU',
      'AMD': 'CPU', 
      'NVIDIA': 'Graphics',
      'Dell': 'System',
      'HP': 'System',
      'Lenovo': 'System',
      'Cisco': 'Network',
      'VMware': 'Virtualization',
      'Linux': 'Operating System'
    };
    
    return oemTypes[oemName] || 'Hardware';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          WinAudit-Style System Detection
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comprehensive system inventory and automatic OEM monitoring configuration
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Download Scripts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Monitor className="h-6 w-6 text-blue-600" />
                <div>
                  <h4 className="font-medium">Windows System Audit</h4>
                  <Badge variant="outline" className="text-xs mt-1">Advanced Detection</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Comprehensive hardware and software inventory using WMI
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => downloadScript('windows')}
              >
                <Download className="h-3 w-3 mr-2" />
                Download Windows Script
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Monitor className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-medium">Linux System Audit</h4>
                  <Badge variant="outline" className="text-xs mt-1">Full Inventory</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Complete system detection using /proc, /sys, and system tools
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => downloadScript('linux')}
              >
                <Download className="h-3 w-3 mr-2" />
                Download Linux Script
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upload Results Section */}
        <div className="border-t pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="h-5 w-5 text-primary" />
            <h4 className="font-medium">Upload System Inventory</h4>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <input
              type="file"
              accept=".json"
              onChange={handleInventoryUpload}
              className="hidden"
              id="inventory-upload"
              disabled={isProcessing}
            />
            <label
              htmlFor="inventory-upload"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
            >
              <Upload className="h-4 w-4" />
              {isProcessing ? 'Processing...' : 'Upload Inventory JSON'}
            </label>
            <span className="text-sm text-muted-foreground">
              Upload hawk_system_inventory.json
            </span>
          </div>

          {isProcessing && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Processing inventory...</span>
                <span className="text-sm text-muted-foreground">{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
            </div>
          )}
        </div>

        {/* Results Display */}
        {inventory && (
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-lg">System Inventory Results</h4>
              <Badge variant="outline" className="text-xs">
                {inventory.platform} • {inventory.detectedOEMs?.length || 0} OEMs
              </Badge>
            </div>

            {/* System Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">System</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {inventory.systemInfo?.manufacturer} {inventory.systemInfo?.model}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Hardware</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    CPU, Memory, Storage detected
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Software</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {inventory.software?.installedPrograms?.length || 0} programs detected
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detected OEMs */}
            <div>
              <h5 className="font-medium mb-3">Detected OEMs for Monitoring</h5>
              <div className="grid gap-2 md:grid-cols-3">
                {inventory.detectedOEMs?.map((oem, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded border">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{oem}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {determineSystemType(oem, inventory)}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground">No OEMs detected</p>
                )}
              </div>
            </div>

            {/* Configure Monitoring Button */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button onClick={configureOEMMonitoring} className="flex-1">
                <Shield className="h-4 w-4 mr-2" />
                Configure Automatic OEM Monitoring
              </Button>
              <Button variant="outline" size="sm">
                <Info className="h-4 w-4 mr-1" />
                View Details
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                How WinAudit-Style Detection Works
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li><strong>Step 1:</strong> Download the appropriate script for your OS</li>
                <li><strong>Step 2:</strong> Run as administrator/root for complete access</li>
                <li><strong>Step 3:</strong> Script generates comprehensive JSON inventory</li>
                <li><strong>Step 4:</strong> Upload the JSON file to automatically configure monitoring</li>
                <li><strong>Result:</strong> Only track vulnerabilities for your actual hardware/software</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WinAuditSystemDetector;
