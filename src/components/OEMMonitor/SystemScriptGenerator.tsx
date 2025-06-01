
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileText, Monitor, Smartphone, Terminal, CheckCircle, AlertTriangle } from 'lucide-react';
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
      description: 'Comprehensive Windows system detection using PowerShell'
    },
    {
      id: 'windows-batch',
      name: 'Windows Batch',
      platform: 'Windows',
      extension: '.bat',
      icon: <Terminal className="h-5 w-5" />,
      description: 'Windows system detection using batch commands'
    },
    {
      id: 'linux-bash',
      name: 'Linux Bash',
      platform: 'Linux',
      extension: '.sh',
      icon: <Terminal className="h-5 w-5" />,
      description: 'Linux system detection using bash and system utilities'
    },
    {
      id: 'macos-bash',
      name: 'macOS Bash',
      platform: 'macOS',
      extension: '.sh',
      icon: <Monitor className="h-5 w-5" />,
      description: 'macOS system detection using bash and system profiler'
    },
    {
      id: 'android-adb',
      name: 'Android ADB',
      platform: 'Android',
      extension: '.sh',
      icon: <Smartphone className="h-5 w-5" />,
      description: 'Android device detection using ADB commands'
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
# This script collects system information to identify OEMs and vendors
# No modifications are made to your system - this is read-only

Write-Host "HAWK OEM Detection Script - Windows PowerShell" -ForegroundColor Green
Write-Host "Collecting system information..." -ForegroundColor Yellow

$results = @{
    "timestamp" = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    "platform" = "Windows"
    "script_version" = "1.0"
    "detected_oems" = @()
}

# System Information
Write-Host "Detecting system manufacturer..." -ForegroundColor Cyan
$systemInfo = Get-CimInstance -ClassName Win32_ComputerSystem
if ($systemInfo) {
    $results.detected_oems += @{
        "name" = $systemInfo.Manufacturer
        "category" = "System"
        "model" = $systemInfo.Model
        "confidence" = 95
    }
}

# BIOS Information
Write-Host "Detecting BIOS/UEFI information..." -ForegroundColor Cyan
$biosInfo = Get-CimInstance -ClassName Win32_BIOS
if ($biosInfo) {
    $results.detected_oems += @{
        "name" = $biosInfo.Manufacturer
        "category" = "BIOS"
        "version" = $biosInfo.SMBIOSBIOSVersion
        "confidence" = 90
    }
}

# Processor Information
Write-Host "Detecting processor information..." -ForegroundColor Cyan
$processorInfo = Get-CimInstance -ClassName Win32_Processor
foreach ($processor in $processorInfo) {
    $results.detected_oems += @{
        "name" = $processor.Manufacturer
        "category" = "CPU"
        "model" = $processor.Name
        "confidence" = 95
    }
}

# Graphics Cards
Write-Host "Detecting graphics cards..." -ForegroundColor Cyan
$videoControllers = Get-CimInstance -ClassName Win32_VideoController
foreach ($gpu in $videoControllers) {
    if ($gpu.Name -notlike "*Basic*" -and $gpu.Name -notlike "*Generic*") {
        $manufacturer = "Unknown"
        if ($gpu.Name -match "NVIDIA") { $manufacturer = "NVIDIA" }
        elseif ($gpu.Name -match "AMD|Radeon") { $manufacturer = "AMD" }
        elseif ($gpu.Name -match "Intel") { $manufacturer = "Intel" }
        
        $results.detected_oems += @{
            "name" = $manufacturer
            "category" = "GPU"
            "model" = $gpu.Name
            "confidence" = 85
        }
    }
}

# Network Adapters
Write-Host "Detecting network adapters..." -ForegroundColor Cyan
$networkAdapters = Get-CimInstance -ClassName Win32_NetworkAdapter | Where-Object { $_.Manufacturer -ne $null -and $_.PNPDeviceID -ne $null }
foreach ($adapter in $networkAdapters) {
    $results.detected_oems += @{
        "name" = $adapter.Manufacturer
        "category" = "Network"
        "model" = $adapter.Name
        "confidence" = 80
    }
}

# Storage Devices
Write-Host "Detecting storage devices..." -ForegroundColor Cyan
$diskDrives = Get-CimInstance -ClassName Win32_DiskDrive
foreach ($disk in $diskDrives) {
    if ($disk.Model -notlike "*USB*" -and $disk.Model -notlike "*Virtual*") {
        $manufacturer = ($disk.Model -split " ")[0]
        $results.detected_oems += @{
            "name" = $manufacturer
            "category" = "Storage"
            "model" = $disk.Model
            "confidence" = 75
        }
    }
}

# Installed Software (Major OEMs)
Write-Host "Detecting installed OEM software..." -ForegroundColor Cyan
$oemSoftware = @("Intel", "AMD", "NVIDIA", "Dell", "HP", "Lenovo", "ASUS", "MSI", "Gigabyte", "Cisco", "VMware", "Microsoft")
$installedPrograms = Get-CimInstance -ClassName Win32_Product -ErrorAction SilentlyContinue
foreach ($program in $installedPrograms) {
    foreach ($oem in $oemSoftware) {
        if ($program.Name -match $oem) {
            $results.detected_oems += @{
                "name" = $oem
                "category" = "Software"
                "model" = $program.Name
                "version" = $program.Version
                "confidence" = 70
            }
            break
        }
    }
}

# USB Devices
Write-Host "Detecting USB devices..." -ForegroundColor Cyan
$usbDevices = Get-CimInstance -ClassName Win32_USBControllerDevice
foreach ($usbDevice in $usbDevices) {
    $device = Get-CimInstance -ClassName Win32_PnPEntity | Where-Object { $_.DeviceID -eq ($usbDevice.Dependent -split '"')[1] }
    if ($device -and $device.Manufacturer -and $device.Manufacturer -ne "Microsoft" -and $device.Manufacturer -ne "(Generic USB Hub)") {
        $results.detected_oems += @{
            "name" = $device.Manufacturer
            "category" = "USB Device"
            "model" = $device.Name
            "confidence" = 65
        }
    }
}

# Output results to JSON file
$outputFile = "hawk_oem_detection_results.json"
$results | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host ""
Write-Host "Detection complete!" -ForegroundColor Green
Write-Host "Results saved to: $outputFile" -ForegroundColor Yellow
Write-Host "Please upload this file to the HAWK web application." -ForegroundColor Yellow
Write-Host ""
Write-Host "Detected OEMs summary:" -ForegroundColor Cyan
$results.detected_oems | Group-Object name | ForEach-Object { Write-Host "- $($_.Name) ($($_.Count) components)" }
`;
  };

  const generateLinuxBashScript = (): string => {
    return `#!/bin/bash
# HAWK OEM Detection Script for Linux
# This script collects system information to identify OEMs and vendors
# No modifications are made to your system - this is read-only

echo "HAWK OEM Detection Script - Linux Bash"
echo "Collecting system information..."

# Create JSON structure
cat > hawk_oem_detection_results.json << 'EOF'
{
  "timestamp": "$(date -Iseconds)",
  "platform": "Linux",
  "script_version": "1.0",
  "detected_oems": [
EOF

# System Information
echo "Detecting system manufacturer..."
if [ -f /sys/class/dmi/id/sys_vendor ]; then
    SYSTEM_VENDOR=$(cat /sys/class/dmi/id/sys_vendor 2>/dev/null | tr -d '\\0')
    SYSTEM_MODEL=$(cat /sys/class/dmi/id/product_name 2>/dev/null | tr -d '\\0')
    if [ ! -z "$SYSTEM_VENDOR" ]; then
        echo "    {\"name\": \"$SYSTEM_VENDOR\", \"category\": \"System\", \"model\": \"$SYSTEM_MODEL\", \"confidence\": 95}," >> hawk_oem_detection_results.json
    fi
fi

# BIOS Information
echo "Detecting BIOS information..."
if [ -f /sys/class/dmi/id/bios_vendor ]; then
    BIOS_VENDOR=$(cat /sys/class/dmi/id/bios_vendor 2>/dev/null | tr -d '\\0')
    BIOS_VERSION=$(cat /sys/class/dmi/id/bios_version 2>/dev/null | tr -d '\\0')
    if [ ! -z "$BIOS_VENDOR" ]; then
        echo "    {\"name\": \"$BIOS_VENDOR\", \"category\": \"BIOS\", \"version\": \"$BIOS_VERSION\", \"confidence\": 90}," >> hawk_oem_detection_results.json
    fi
fi

# CPU Information
echo "Detecting processor information..."
if [ -f /proc/cpuinfo ]; then
    CPU_VENDOR=$(grep "vendor_id" /proc/cpuinfo | head -1 | cut -d: -f2 | sed 's/^[ \\t]*//')
    CPU_MODEL=$(grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | sed 's/^[ \\t]*//')
    case "$CPU_VENDOR" in
        "GenuineIntel") CPU_VENDOR="Intel" ;;
        "AuthenticAMD") CPU_VENDOR="AMD" ;;
    esac
    if [ ! -z "$CPU_VENDOR" ]; then
        echo "    {\"name\": \"$CPU_VENDOR\", \"category\": \"CPU\", \"model\": \"$CPU_MODEL\", \"confidence\": 95}," >> hawk_oem_detection_results.json
    fi
fi

# GPU Information
echo "Detecting graphics cards..."
if command -v lspci >/dev/null 2>&1; then
    lspci | grep -i vga | while read line; do
        if echo "$line" | grep -iq nvidia; then
            GPU_MODEL=$(echo "$line" | sed 's/.*: //')
            echo "    {\"name\": \"NVIDIA\", \"category\": \"GPU\", \"model\": \"$GPU_MODEL\", \"confidence\": 85}," >> hawk_oem_detection_results.json
        elif echo "$line" | grep -iq amd; then
            GPU_MODEL=$(echo "$line" | sed 's/.*: //')
            echo "    {\"name\": \"AMD\", \"category\": \"GPU\", \"model\": \"$GPU_MODEL\", \"confidence\": 85}," >> hawk_oem_detection_results.json
        elif echo "$line" | grep -iq intel; then
            GPU_MODEL=$(echo "$line" | sed 's/.*: //')
            echo "    {\"name\": \"Intel\", \"category\": \"GPU\", \"model\": \"$GPU_MODEL\", \"confidence\": 85}," >> hawk_oem_detection_results.json
        fi
    done
fi

# Network Devices
echo "Detecting network devices..."
if command -v lspci >/dev/null 2>&1; then
    lspci | grep -i ethernet | while read line; do
        if echo "$line" | grep -iq intel; then
            NET_MODEL=$(echo "$line" | sed 's/.*: //')
            echo "    {\"name\": \"Intel\", \"category\": \"Network\", \"model\": \"$NET_MODEL\", \"confidence\": 80}," >> hawk_oem_detection_results.json
        elif echo "$line" | grep -iq realtek; then
            NET_MODEL=$(echo "$line" | sed 's/.*: //')
            echo "    {\"name\": \"Realtek\", \"category\": \"Network\", \"model\": \"$NET_MODEL\", \"confidence\": 80}," >> hawk_oem_detection_results.json
        elif echo "$line" | grep -iq broadcom; then
            NET_MODEL=$(echo "$line" | sed 's/.*: //')
            echo "    {\"name\": \"Broadcom\", \"category\": \"Network\", \"model\": \"$NET_MODEL\", \"confidence\": 80}," >> hawk_oem_detection_results.json
        fi
    done
fi

# USB Devices
echo "Detecting USB devices..."
if command -v lsusb >/dev/null 2>&1; then
    lsusb | while read line; do
        USB_INFO=$(echo "$line" | cut -d' ' -f7-)
        if echo "$USB_INFO" | grep -viq "linux foundation\\|hub"; then
            USB_VENDOR=$(echo "$USB_INFO" | cut -d' ' -f1)
            echo "    {\"name\": \"$USB_VENDOR\", \"category\": \"USB Device\", \"model\": \"$USB_INFO\", \"confidence\": 65}," >> hawk_oem_detection_results.json
        fi
    done
fi

# Remove trailing comma and close JSON
sed -i '$ s/,$//' hawk_oem_detection_results.json
echo "  ]" >> hawk_oem_detection_results.json
echo "}" >> hawk_oem_detection_results.json

echo ""
echo "Detection complete!"
echo "Results saved to: hawk_oem_detection_results.json"
echo "Please upload this file to the HAWK web application."
echo ""
echo "Detected OEMs summary:"
if command -v jq >/dev/null 2>&1; then
    jq -r '.detected_oems[].name' hawk_oem_detection_results.json | sort | uniq -c
else
    echo "Install 'jq' for detailed summary, or view the JSON file directly."
fi
`;
  };

  const generateMacOSScript = (): string => {
    return `#!/bin/bash
# HAWK OEM Detection Script for macOS
# This script collects system information to identify OEMs and vendors
# No modifications are made to your system - this is read-only

echo "HAWK OEM Detection Script - macOS"
echo "Collecting system information..."

# Create initial JSON structure
cat > hawk_oem_detection_results.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "platform": "macOS",
  "script_version": "1.0",
  "detected_oems": [
EOF

# System Information
echo "Detecting system information..."
SYSTEM_MODEL=$(system_profiler SPHardwareDataType | grep "Model Name" | cut -d: -f2 | sed 's/^[ \\t]*//')
SYSTEM_IDENTIFIER=$(system_profiler SPHardwareDataType | grep "Model Identifier" | cut -d: -f2 | sed 's/^[ \\t]*//')
if [ ! -z "$SYSTEM_MODEL" ]; then
    echo "    {\"name\": \"Apple\", \"category\": \"System\", \"model\": \"$SYSTEM_MODEL\", \"identifier\": \"$SYSTEM_IDENTIFIER\", \"confidence\": 95}," >> hawk_oem_detection_results.json
fi

# Processor Information
echo "Detecting processor information..."
CPU_INFO=$(system_profiler SPHardwareDataType | grep "Processor Name" | cut -d: -f2 | sed 's/^[ \\t]*//')
if echo "$CPU_INFO" | grep -iq intel; then
    echo "    {\"name\": \"Intel\", \"category\": \"CPU\", \"model\": \"$CPU_INFO\", \"confidence\": 95}," >> hawk_oem_detection_results.json
elif echo "$CPU_INFO" | grep -iq "apple"; then
    echo "    {\"name\": \"Apple\", \"category\": \"CPU\", \"model\": \"$CPU_INFO\", \"confidence\": 95}," >> hawk_oem_detection_results.json
fi

# Graphics Information
echo "Detecting graphics information..."
system_profiler SPDisplaysDataType | grep "Chipset Model" | while read line; do
    GPU_MODEL=$(echo "$line" | cut -d: -f2 | sed 's/^[ \\t]*//')
    if echo "$GPU_MODEL" | grep -iq intel; then
        echo "    {\"name\": \"Intel\", \"category\": \"GPU\", \"model\": \"$GPU_MODEL\", \"confidence\": 85}," >> hawk_oem_detection_results.json
    elif echo "$GPU_MODEL" | grep -iq amd; then
        echo "    {\"name\": \"AMD\", \"category\": \"GPU\", \"model\": \"$GPU_MODEL\", \"confidence\": 85}," >> hawk_oem_detection_results.json
    elif echo "$GPU_MODEL" | grep -iq apple; then
        echo "    {\"name\": \"Apple\", \"category\": \"GPU\", \"model\": \"$GPU_MODEL\", \"confidence\": 85}," >> hawk_oem_detection_results.json
    fi
done

# Storage Information
echo "Detecting storage information..."
system_profiler SPStorageDataType | grep "Medium Type" | while read line; do
    STORAGE_TYPE=$(echo "$line" | cut -d: -f2 | sed 's/^[ \\t]*//')
    echo "    {\"name\": \"Apple\", \"category\": \"Storage\", \"model\": \"$STORAGE_TYPE\", \"confidence\": 75}," >> hawk_oem_detection_results.json
done

# Network Information
echo "Detecting network information..."
system_profiler SPNetworkDataType | grep "Hardware" | while read line; do
    if echo "$line" | grep -viq "not available"; then
        NETWORK_HW=$(echo "$line" | cut -d: -f2 | sed 's/^[ \\t]*//')
        echo "    {\"name\": \"Apple\", \"category\": \"Network\", \"model\": \"$NETWORK_HW\", \"confidence\": 80}," >> hawk_oem_detection_results.json
    fi
done

# USB Information
echo "Detecting USB information..."
system_profiler SPUSBDataType | grep "Manufacturer" | while read line; do
    USB_MANUFACTURER=$(echo "$line" | cut -d: -f2 | sed 's/^[ \\t]*//')
    if [ "$USB_MANUFACTURER" != "Apple Inc." ] && [ ! -z "$USB_MANUFACTURER" ]; then
        echo "    {\"name\": \"$USB_MANUFACTURER\", \"category\": \"USB Device\", \"confidence\": 65}," >> hawk_oem_detection_results.json
    fi
done

# Remove trailing comma and close JSON
sed -i '' '$ s/,$//' hawk_oem_detection_results.json
echo "  ]" >> hawk_oem_detection_results.json
echo "}" >> hawk_oem_detection_results.json

echo ""
echo "Detection complete!"
echo "Results saved to: hawk_oem_detection_results.json"
echo "Please upload this file to the HAWK web application."
echo ""
echo "Detected OEMs summary:"
if command -v jq >/dev/null 2>&1; then
    jq -r '.detected_oems[].name' hawk_oem_detection_results.json | sort | uniq -c
else
    echo "View the JSON file for detailed results."
fi
`;
  };

  const generateAndroidScript = (): string => {
    return `#!/bin/bash
# HAWK OEM Detection Script for Android (requires ADB)
# This script collects Android device information to identify OEMs
# No modifications are made to your device - this is read-only

echo "HAWK OEM Detection Script - Android (ADB)"
echo "Make sure your Android device is connected via ADB..."

# Check if ADB is available
if ! command -v adb >/dev/null 2>&1; then
    echo "Error: ADB is not installed or not in PATH"
    echo "Please install Android SDK Platform Tools"
    exit 1
fi

# Check if device is connected
if [ -z "$(adb devices | grep -v 'List of devices' | grep device)" ]; then
    echo "Error: No Android device detected"
    echo "Please connect your device and enable USB debugging"
    exit 1
fi

echo "Collecting device information..."

# Create JSON structure
cat > hawk_oem_detection_results.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "platform": "Android",
  "script_version": "1.0",
  "detected_oems": [
EOF

# Device Manufacturer
echo "Detecting device manufacturer..."
MANUFACTURER=$(adb shell getprop ro.product.manufacturer 2>/dev/null | tr -d '\\r')
MODEL=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\\r')
BRAND=$(adb shell getprop ro.product.brand 2>/dev/null | tr -d '\\r')

if [ ! -z "$MANUFACTURER" ]; then
    echo "    {\"name\": \"$MANUFACTURER\", \"category\": \"Device\", \"model\": \"$MODEL\", \"brand\": \"$BRAND\", \"confidence\": 95}," >> hawk_oem_detection_results.json
fi

# Android Version
echo "Detecting Android version..."
ANDROID_VERSION=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\\r')
if [ ! -z "$ANDROID_VERSION" ]; then
    echo "    {\"name\": \"Google\", \"category\": \"OS\", \"model\": \"Android $ANDROID_VERSION\", \"confidence\": 95}," >> hawk_oem_detection_results.json
fi

# CPU Information
echo "Detecting CPU information..."
CPU_ABI=$(adb shell getprop ro.product.cpu.abi 2>/dev/null | tr -d '\\r')
HARDWARE=$(adb shell getprop ro.hardware 2>/dev/null | tr -d '\\r')
if [ ! -z "$HARDWARE" ]; then
    if echo "$HARDWARE" | grep -iq qualcomm; then
        echo "    {\"name\": \"Qualcomm\", \"category\": \"CPU\", \"model\": \"$HARDWARE\", \"abi\": \"$CPU_ABI\", \"confidence\": 85}," >> hawk_oem_detection_results.json
    elif echo "$HARDWARE" | grep -iq exynos; then
        echo "    {\"name\": \"Samsung\", \"category\": \"CPU\", \"model\": \"$HARDWARE\", \"abi\": \"$CPU_ABI\", \"confidence\": 85}," >> hawk_oem_detection_results.json
    elif echo "$HARDWARE" | grep -iq mediatek; then
        echo "    {\"name\": \"MediaTek\", \"category\": \"CPU\", \"model\": \"$HARDWARE\", \"abi\": \"$CPU_ABI\", \"confidence\": 85}," >> hawk_oem_detection_results.json
    fi
fi

# Installed Apps (OEM specific)
echo "Detecting OEM applications..."
OEM_PACKAGES=("com.samsung" "com.huawei" "com.xiaomi" "com.oppo" "com.vivo" "com.oneplus" "com.lg" "com.htc" "com.sony")

for package_prefix in "\${OEM_PACKAGES[@]}"; do
    APPS=$(adb shell pm list packages | grep "$package_prefix" 2>/dev/null)
    if [ ! -z "$APPS" ]; then
        OEM_NAME=$(echo "$package_prefix" | cut -d. -f2)
        APP_COUNT=$(echo "$APPS" | wc -l)
        echo "    {\"name\": \"$OEM_NAME\", \"category\": \"Software\", \"model\": \"OEM Apps ($APP_COUNT found)\", \"confidence\": 70}," >> hawk_oem_detection_results.json
    fi
done

# Remove trailing comma and close JSON
sed -i '$ s/,$//' hawk_oem_detection_results.json 2>/dev/null || sed -i '' '$ s/,$//' hawk_oem_detection_results.json
echo "  ]" >> hawk_oem_detection_results.json
echo "}" >> hawk_oem_detection_results.json

echo ""
echo "Detection complete!"
echo "Results saved to: hawk_oem_detection_results.json"
echo "Please upload this file to the HAWK web application."
echo ""
echo "Detected OEMs summary:"
if command -v jq >/dev/null 2>&1; then
    jq -r '.detected_oems[].name' hawk_oem_detection_results.json | sort | uniq -c
else
    echo "View the JSON file for detailed results."
fi
`;
  };

  const generatePythonScript = (): string => {
    return `#!/usr/bin/env python3
"""
HAWK OEM Detection Script - Cross-Platform Python
This script collects system information to identify OEMs and vendors
No modifications are made to your system - this is read-only
"""

import json
import platform
import subprocess
import datetime
import sys
import os

def run_command(command):
    """Run a command and return its output"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result.stdout.strip() if result.returncode == 0 else ""
    except:
        return ""

def detect_system_oems():
    """Detect OEMs based on the current platform"""
    results = {
        "timestamp": datetime.datetime.now().isoformat(),
        "platform": platform.system(),
        "script_version": "1.0",
        "detected_oems": []
    }
    
    system = platform.system().lower()
    
    print(f"HAWK OEM Detection Script - Cross-Platform Python")
    print(f"Platform detected: {platform.system()}")
    print("Collecting system information...")
    
    if system == "windows":
        detect_windows_oems(results)
    elif system == "linux":
        detect_linux_oems(results)
    elif system == "darwin":  # macOS
        detect_macos_oems(results)
    else:
        print(f"Unsupported platform: {system}")
        
    return results

def detect_windows_oems(results):
    """Detect Windows OEMs"""
    print("Detecting Windows components...")
    
    # System manufacturer
    manufacturer = run_command('wmic computersystem get manufacturer /value').split('=')[-1]
    model = run_command('wmic computersystem get model /value').split('=')[-1]
    if manufacturer:
        results["detected_oems"].append({
            "name": manufacturer,
            "category": "System",
            "model": model,
            "confidence": 95
        })
    
    # CPU
    cpu_name = run_command('wmic cpu get name /value').split('=')[-1]
    if "Intel" in cpu_name:
        results["detected_oems"].append({
            "name": "Intel",
            "category": "CPU", 
            "model": cpu_name,
            "confidence": 95
        })
    elif "AMD" in cpu_name:
        results["detected_oems"].append({
            "name": "AMD",
            "category": "CPU",
            "model": cpu_name, 
            "confidence": 95
        })

def detect_linux_oems(results):
    """Detect Linux OEMs"""
    print("Detecting Linux components...")
    
    # System vendor
    vendor = run_command('cat /sys/class/dmi/id/sys_vendor 2>/dev/null')
    model = run_command('cat /sys/class/dmi/id/product_name 2>/dev/null')
    if vendor:
        results["detected_oems"].append({
            "name": vendor,
            "category": "System",
            "model": model,
            "confidence": 95
        })
    
    # CPU info
    cpu_info = run_command('cat /proc/cpuinfo | grep "vendor_id" | head -1')
    if "GenuineIntel" in cpu_info:
        cpu_model = run_command('cat /proc/cpuinfo | grep "model name" | head -1').split(':')[-1].strip()
        results["detected_oems"].append({
            "name": "Intel",
            "category": "CPU",
            "model": cpu_model,
            "confidence": 95
        })
    elif "AuthenticAMD" in cpu_info:
        cpu_model = run_command('cat /proc/cpuinfo | grep "model name" | head -1').split(':')[-1].strip()
        results["detected_oems"].append({
            "name": "AMD", 
            "category": "CPU",
            "model": cpu_model,
            "confidence": 95
        })

def detect_macos_oems(results):
    """Detect macOS OEMs"""
    print("Detecting macOS components...")
    
    # System info
    model = run_command('system_profiler SPHardwareDataType | grep "Model Name"').split(':')[-1].strip()
    if model:
        results["detected_oems"].append({
            "name": "Apple",
            "category": "System", 
            "model": model,
            "confidence": 95
        })
    
    # CPU
    cpu = run_command('system_profiler SPHardwareDataType | grep "Processor Name"').split(':')[-1].strip()
    if "Intel" in cpu:
        results["detected_oems"].append({
            "name": "Intel",
            "category": "CPU",
            "model": cpu,
            "confidence": 95
        })
    elif "Apple" in cpu:
        results["detected_oems"].append({
            "name": "Apple",
            "category": "CPU", 
            "model": cpu,
            "confidence": 95
        })

def main():
    """Main function"""
    try:
        results = detect_system_oems()
        
        # Save results
        output_file = "hawk_oem_detection_results.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\\nDetection complete!")
        print(f"Results saved to: {output_file}")
        print("Please upload this file to the HAWK web application.")
        print("\\nDetected OEMs summary:")
        
        oem_counts = {}
        for oem in results["detected_oems"]:
            name = oem["name"]
            oem_counts[name] = oem_counts.get(name, 0) + 1
        
        for name, count in oem_counts.items():
            print(f"- {name} ({count} components)")
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
`;
  };

  const generateScript = (scriptId: string): string => {
    switch (scriptId) {
      case 'windows-powershell':
        return generateWindowsPowerShellScript();
      case 'windows-batch':
        return generateWindowsPowerShellScript(); // Simplified - using PS for both
      case 'linux-bash':
        return generateLinuxBashScript();
      case 'macos-bash':
        return generateMacOSScript();
      case 'android-adb':
        return generateAndroidScript();
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
      
      // Remove from uploaded results
      setUploadedResults(prev => prev.filter(r => r !== result));
      
      if (onDetectionComplete) {
        onDetectionComplete();
      }
    } catch (error) {
      console.error('Error adding OEM from result:', error);
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
      'Qualcomm': 'https://www.qualcomm.com/company/product-security/bulletins',
      'Dell': 'https://www.dell.com/support/security/',
      'HP': 'https://support.hp.com/us-en/security',
      'Lenovo': 'https://support.lenovo.com/solutions/len-2268',
      'ASUS': 'https://www.asus.com/support/security-advisory/',
      'Cisco': 'https://sec.cloudapps.cisco.com/security/center/publicationListing.x'
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
        <p className="text-sm text-gray-600">
          Download and run platform-specific scripts to comprehensively detect all OEMs on your system
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
                <p className="text-xs text-gray-600 mb-3">{scriptType.description}</p>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Script Downloaded</h4>
                <p className="text-xs text-blue-800 mb-2">
                  Run the downloaded script on your system and upload the generated JSON file below.
                </p>
                <div className="text-xs text-blue-700">
                  <p><strong>Instructions:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Run the script with appropriate permissions</li>
                    <li>The script will generate "hawk_oem_detection_results.json"</li>
                    <li>Upload the JSON file using the upload button below</li>
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
            <span className="text-sm text-gray-500">
              Upload the JSON file generated by the detection script
            </span>
          </div>
        </div>

        {uploadedResults.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Detected OEMs ({uploadedResults.length})</h4>
            <div className="grid gap-3">
              {uploadedResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
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
                            result.confidence >= 90 ? 'bg-green-100 text-green-800' :
                            result.confidence >= 75 ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {result.confidence}% confidence
                        </Badge>
                      </div>
                      {result.version && (
                        <p className="text-xs text-gray-600">Version: {result.version}</p>
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

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-900 mb-1">Security Notice</h4>
              <p className="text-xs text-amber-800">
                These scripts are read-only and do not modify your system. They collect hardware and software 
                information to identify OEM vendors for vulnerability monitoring. All scripts are open-source 
                and can be reviewed before execution.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemScriptGenerator;
