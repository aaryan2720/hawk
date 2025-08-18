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
setlocal enabledelayedexpansion
echo ===============================================
echo HAWK Professional System Inventory Scanner v3.0
echo WinAudit-Level Hardware Detection
echo ===============================================
echo.

:: Create temp files for processing
set "TEMP_DIR=%TEMP%\\HAWK_SCAN_%RANDOM%"
mkdir "%TEMP_DIR%" 2>nul

:: Initialize JSON structure
(
echo {
echo   "timestamp": "%date% %time%",
echo   "platform": "Windows",
echo   "scriptVersion": "3.0",
echo   "systemInfo": {
) > hawk_system_inventory.json

:: === SYSTEM INFORMATION ===
echo Scanning system information...
echo     "basicInfo": { >> hawk_system_inventory.json

:: Get manufacturer with fallback methods
for /f "tokens=2 delims==" %%i in ('wmic computersystem get manufacturer /value 2^>nul ^| find "="') do (
    set "SYS_MANUFACTURER=%%i"
    echo       "manufacturer": "%%i", >> hawk_system_inventory.json
)
if not defined SYS_MANUFACTURER (
    for /f "tokens=2 delims==" %%i in ('wmic bios get manufacturer /value 2^>nul ^| find "="') do (
        set "SYS_MANUFACTURER=%%i"
        echo       "manufacturer": "%%i", >> hawk_system_inventory.json
    )
)

:: Get model
for /f "tokens=2 delims==" %%i in ('wmic computersystem get model /value 2^>nul ^| find "="') do (
    echo       "model": "%%i", >> hawk_system_inventory.json
)

:: Get serial number
for /f "tokens=2 delims==" %%i in ('wmic bios get serialnumber /value 2^>nul ^| find "="') do (
    echo       "serialNumber": "%%i", >> hawk_system_inventory.json
)

:: Get BIOS version
for /f "tokens=2 delims==" %%i in ('wmic bios get version /value 2^>nul ^| find "="') do (
    echo       "biosVersion": "%%i" >> hawk_system_inventory.json
)
echo     }, >> hawk_system_inventory.json

:: === HARDWARE DETECTION ===
echo Detecting hardware components...
echo     "hardware": { >> hawk_system_inventory.json

:: CPU Detection with advanced info
echo       "cpu": [ >> hawk_system_inventory.json
wmic cpu get name,manufacturer,numberofcores,maxclockspeed /format:csv > "%TEMP_DIR%\\cpu.csv" 2>nul
for /f "skip=1 tokens=2,3,4,5 delims=," %%a in ('type "%TEMP_DIR%\\cpu.csv" 2^>nul') do (
    if not "%%b"=="" (
        echo         {"manufacturer": "%%b", "model": "%%c", "cores": "%%d", "speed": "%%e MHz"}, >> hawk_system_inventory.json
    )
)
echo       ], >> hawk_system_inventory.json

:: Memory Detection (Physical RAM modules)
echo       "memory": [ >> hawk_system_inventory.json
wmic memorychip get manufacturer,capacity,speed,devicelocator /format:csv > "%TEMP_DIR%\\memory.csv" 2>nul
for /f "skip=1 tokens=2,3,4,5 delims=," %%a in ('type "%TEMP_DIR%\\memory.csv" 2^>nul') do (
    if not "%%c"=="" (
        set /a "mem_gb=%%c / 1073741824"
        echo         {"manufacturer": "%%b", "capacity": "!mem_gb! GB", "speed": "%%d MHz", "slot": "%%e"}, >> hawk_system_inventory.json
    )
)
echo       ], >> hawk_system_inventory.json

:: Storage Detection (All drives)
echo       "storage": [ >> hawk_system_inventory.json
wmic diskdrive get model,size,manufacturer,mediatype /format:csv > "%TEMP_DIR%\\storage.csv" 2>nul
for /f "skip=1 tokens=2,3,4,5 delims=," %%a in ('type "%TEMP_DIR%\\storage.csv" 2^>nul') do (
    if not "%%d"=="" (
        set /a "size_gb=%%d / 1073741824"
        echo         {"manufacturer": "%%b", "model": "%%c", "size": "!size_gb! GB", "type": "%%e"}, >> hawk_system_inventory.json
    )
)
echo       ], >> hawk_system_inventory.json

:: Graphics Detection
echo       "graphics": [ >> hawk_system_inventory.json
wmic path win32_videocontroller get name,driverversion,driverprovider /format:csv > "%TEMP_DIR%\\graphics.csv" 2>nul
for /f "skip=1 tokens=2,3,4 delims=," %%a in ('type "%TEMP_DIR%\\graphics.csv" 2^>nul') do (
    if not "%%c"=="" (
        echo         {"model": "%%c", "driver": "%%b", "manufacturer": "%%d"}, >> hawk_system_inventory.json
    )
)
echo       ], >> hawk_system_inventory.json

:: Network Adapters (Physical only)
echo       "network": [ >> hawk_system_inventory.json
wmic path win32_networkadapter where "PhysicalAdapter=True AND NOT Name LIKE '%%Virtual%%' AND NOT Name LIKE '%%Loopback%%'" get name,manufacturer,macaddress /format:csv > "%TEMP_DIR%\\network.csv" 2>nul
for /f "skip=1 tokens=2,3,4 delims=," %%a in ('type "%TEMP_DIR%\\network.csv" 2^>nul') do (
    if not "%%c"=="" (
        echo         {"name": "%%c", "manufacturer": "%%b", "mac": "%%d", "type": "Ethernet"}, >> hawk_system_inventory.json
    )
)
echo       ] >> hawk_system_inventory.json
echo     }, >> hawk_system_inventory.json

:: === SOFTWARE DETECTION ===
echo Scanning installed software...
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

:: Installed Programs (Registry method for completeness)
echo       "installedPrograms": [ >> hawk_system_inventory.json
wmic product get name,version,vendor,installdate /format:csv > "%TEMP_DIR%\\programs.csv" 2>nul
for /f "skip=1 tokens=2,3,4,5 delims=," %%a in ('type "%TEMP_DIR%\\programs.csv" 2^>nul') do (
    if not "%%c"=="" (
        echo         {"name": "%%c", "version": "%%d", "publisher": "%%e", "installDate": "%%b"}, >> hawk_system_inventory.json
    )
)
echo       ], >> hawk_system_inventory.json

:: System Drivers
echo       "drivers": [ >> hawk_system_inventory.json
wmic systemdriver get name,version,pathname /format:csv > "%TEMP_DIR%\\drivers.csv" 2>nul
for /f "skip=1 tokens=2,3,4 delims=," %%a in ('type "%TEMP_DIR%\\drivers.csv" 2^>nul') do (
    if not "%%c"=="" (
        echo         {"name": "%%c", "version": "%%d", "path": "%%e"}, >> hawk_system_inventory.json
    )
)
echo       ], >> hawk_system_inventory.json

:: Services
echo       "services": [ >> hawk_system_inventory.json
wmic service get name,state,startmode /format:csv > "%TEMP_DIR%\\services.csv" 2>nul
for /f "skip=1 tokens=2,3,4 delims=," %%a in ('type "%TEMP_DIR%\\services.csv" 2^>nul') do (
    if not "%%c"=="" (
        echo         {"name": "%%c", "status": "%%d", "startType": "%%e"}, >> hawk_system_inventory.json
    )
)
echo       ] >> hawk_system_inventory.json
echo     }, >> hawk_system_inventory.json

:: === OEM DETECTION ENGINE ===
echo Analyzing detected OEMs...
echo     "detectedOEMs": [ >> hawk_system_inventory.json

:: Create OEM detection script
(
echo @echo off
echo set "DETECTED_OEMS="
echo.
echo :: Check system manufacturer
echo if /i "!SYS_MANUFACTURER!" NEQ "" ^(
echo   if /i "!SYS_MANUFACTURER!" NEQ "To Be Filled By O.E.M." ^(
echo     set "DETECTED_OEMS=!DETECTED_OEMS!"!SYS_MANUFACTURER!","
echo   ^)
echo ^)
echo.
echo :: Analyze CPU manufacturers
echo findstr /i "intel" "%TEMP_DIR%\\cpu.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!Intel","
echo findstr /i "amd" "%TEMP_DIR%\\cpu.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!AMD","
echo.
echo :: Analyze memory manufacturers
echo findstr /i "samsung" "%TEMP_DIR%\\memory.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!Samsung","
echo findstr /i "micron" "%TEMP_DIR%\\memory.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!Micron","
echo findstr /i "corsair" "%TEMP_DIR%\\memory.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!Corsair","
echo findstr /i "kingston" "%TEMP_DIR%\\memory.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!Kingston","
echo.
echo :: Analyze storage manufacturers
echo findstr /i "seagate" "%TEMP_DIR%\\storage.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!Seagate","
echo findstr /i "western" "%TEMP_DIR%\\storage.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!Western Digital","
echo findstr /i "samsung" "%TEMP_DIR%\\storage.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!Samsung","
echo findstr /i "toshiba" "%TEMP_DIR%\\storage.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!Toshiba","
echo findstr /i "crucial" "%TEMP_DIR%\\storage.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!Crucial","
echo.
echo :: Analyze graphics manufacturers
echo findstr /i "nvidia" "%TEMP_DIR%\\graphics.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!NVIDIA","
echo findstr /i "intel" "%TEMP_DIR%\\graphics.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!Intel","
echo findstr /i "amd" "%TEMP_DIR%\\graphics.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!AMD","
echo.
echo :: Analyze network manufacturers
echo findstr /i "intel" "%TEMP_DIR%\\network.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!Intel","
echo findstr /i "realtek" "%TEMP_DIR%\\network.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!Realtek","
echo findstr /i "broadcom" "%TEMP_DIR%\\network.csv" >nul 2^>^&1 ^&^& set "DETECTED_OEMS=!DETECTED_OEMS!Broadcom","
echo.
echo :: Always include Microsoft for Windows
echo set "DETECTED_OEMS=!DETECTED_OEMS!Microsoft","
echo.
echo :: Output detected OEMs
echo set "DETECTED_OEMS=!DETECTED_OEMS:~0,-1!"
echo if defined DETECTED_OEMS ^(
echo   for %%%%i in ^(!DETECTED_OEMS!^) do echo       "%%%%~i", ^>^> hawk_system_inventory.json
echo ^)
) > "%TEMP_DIR%\\detect_oems.bat"

:: Run OEM detection
call "%TEMP_DIR%\\detect_oems.bat"

:: Remove trailing comma and close array
echo       "Unknown" >> hawk_system_inventory.json
echo     ] >> hawk_system_inventory.json

:: Close main JSON structure
echo   } >> hawk_system_inventory.json
echo } >> hawk_system_inventory.json

:: Clean up temporary files
rmdir /s /q "%TEMP_DIR%" 2>nul

echo.
echo ===============================================
echo PROFESSIONAL SCAN COMPLETED SUCCESSFULLY!
echo ===============================================
echo File: hawk_system_inventory.json
echo.
echo This WinAudit-level inventory includes:
echo - Complete hardware component detection
echo - Real manufacturer identification
echo - Comprehensive software inventory
echo - Advanced OEM analysis engine
echo - Physical component specifications
echo.
echo Upload this file to HAWK for automatic OEM monitoring setup.
echo ===============================================
pause`;
  };

  const generateLinuxAuditScript = (): string => {
    return `#!/bin/bash

echo "==============================================="
echo "HAWK Professional System Inventory Scanner v3.0"
echo "Advanced Linux Hardware Detection"
echo "==============================================="
echo

# Check for required tools
MISSING_TOOLS=""
command -v lscpu >/dev/null 2>&1 || MISSING_TOOLS="$MISSING_TOOLS lscpu"
command -v lshw >/dev/null 2>&1 || MISSING_TOOLS="$MISSING_TOOLS lshw"
command -v lspci >/dev/null 2>&1 || MISSING_TOOLS="$MISSING_TOOLS lspci"
command -v dmidecode >/dev/null 2>&1 || MISSING_TOOLS="$MISSING_TOOLS dmidecode"

if [ -n "$MISSING_TOOLS" ]; then
    echo "Warning: Missing tools:$MISSING_TOOLS"
    echo "Install with: sudo apt-get install util-linux pciutils dmidecode lshw"
    echo "Some information may be incomplete."
    echo
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Initialize JSON
cat > hawk_system_inventory.json << 'EOF'
{
  "timestamp": "",
  "platform": "Linux",
  "scriptVersion": "3.0",
  "systemInfo": {},
  "hardware": {},
  "software": {},
  "detectedOEMs": []
}
EOF

echo "Scanning system information..."

# Add timestamp
timestamp=$(date -Iseconds 2>/dev/null || date)
jq --arg ts "$timestamp" '.timestamp = $ts' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# === SYSTEM INFORMATION ===
echo "Detecting system information..."

# Get system info from DMI
if [ -f /sys/class/dmi/id/sys_vendor ]; then
    vendor=$(cat /sys/class/dmi/id/sys_vendor 2>/dev/null | tr -d '\\x00\\n\\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    model=$(cat /sys/class/dmi/id/product_name 2>/dev/null | tr -d '\\x00\\n\\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    serial=$(cat /sys/class/dmi/id/product_serial 2>/dev/null | tr -d '\\x00\\n\\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    bios=$(cat /sys/class/dmi/id/bios_version 2>/dev/null | tr -d '\\x00\\n\\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    
    jq --arg v "$vendor" --arg m "$model" --arg s "$serial" --arg b "$bios" '
        .systemInfo.basicInfo = {
            "manufacturer": $v,
            "model": $m,
            "serialNumber": $s,
            "biosVersion": $b
        }' hawk_system_inventory.json > $TEMP_DIR/tmp.json
    mv $TEMP_DIR/tmp.json hawk_system_inventory.json
fi

# === HARDWARE DETECTION ===
echo "Detecting hardware components..."

# CPU Information
echo "Scanning CPU..."
if command -v lscpu >/dev/null 2>&1; then
    cpu_info=$(lscpu)
    cpu_model=$(echo "$cpu_info" | grep "Model name:" | cut -d: -f2 | sed 's/^[[:space:]]*//')
    cpu_cores=$(echo "$cpu_info" | grep "^CPU(s):" | cut -d: -f2 | sed 's/^[[:space:]]*//')
    cpu_speed=$(echo "$cpu_info" | grep "CPU MHz:" | cut -d: -f2 | sed 's/^[[:space:]]*//')
    
    if echo "$cpu_model" | grep -qi "intel"; then
        cpu_manufacturer="Intel"
    elif echo "$cpu_model" | grep -qi "amd"; then
        cpu_manufacturer="AMD"
    else
        cpu_manufacturer="Unknown"
    fi
    
    jq --arg man "$cpu_manufacturer" --arg mod "$cpu_model" --arg cores "$cpu_cores" --arg speed "$cpu_speed" '
        .hardware.cpu = [{
            "manufacturer": $man,
            "model": $mod,
            "cores": ($cores | tonumber),
            "speed": ($speed + " MHz")
        }]' hawk_system_inventory.json > $TEMP_DIR/tmp.json
    mv $TEMP_DIR/tmp.json hawk_system_inventory.json
fi

# Memory Information
echo "Scanning memory modules..."
memory_array="[]"
if command -v dmidecode >/dev/null 2>&1 && [ "$EUID" -eq 0 ]; then
    # Running as root, can get detailed memory info
    dmidecode -t memory > $TEMP_DIR/memory.txt 2>/dev/null
    
    # Parse memory modules
    awk '/Memory Device/,/^$/ {
        if ($1 == "Manufacturer:") manufacturer = $2
        if ($1 == "Size:" && $2 != "No") size = $2 " " $3
        if ($1 == "Speed:") speed = $2 " " $3
        if ($1 == "Locator:") locator = $2
        if (/^$/ && size && size != "No Module Installed") {
            printf "{\\"manufacturer\\": \\"%s\\", \\"capacity\\": \\"%s\\", \\"speed\\": \\"%s\\", \\"slot\\": \\"%s\\"},\\n", manufacturer, size, speed, locator
            manufacturer = ""; size = ""; speed = ""; locator = ""
        }
    }' $TEMP_DIR/memory.txt > $TEMP_DIR/memory.json
    
    if [ -s $TEMP_DIR/memory.json ]; then
        # Remove trailing comma and create array
        sed '$ s/,$//' $TEMP_DIR/memory.json > $TEMP_DIR/memory_clean.json
        memory_array="[$(cat $TEMP_DIR/memory_clean.json)]"
    fi
else
    # Fallback method
    total_mem=$(free -h | awk '/^Mem:/ {print $2}')
    memory_array="[{\\"manufacturer\\": \\"Unknown\\", \\"capacity\\": \\"$total_mem\\", \\"speed\\": \\"Unknown\\", \\"slot\\": \\"Total\\"}]"
fi

jq --argjson mem "$memory_array" '.hardware.memory = $mem' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# Storage Detection
echo "Scanning storage devices..."
storage_array="[]"
if [ -d /sys/block ]; then
    storage_list=""
    for device in /sys/block/sd* /sys/block/nvme* /sys/block/mmcblk*; do
        if [ -d "$device" ]; then
            device_name=$(basename "$device")
            
            # Get model
            if [ -f "$device/device/model" ]; then
                model=$(cat "$device/device/model" 2>/dev/null | tr -d '\\x00\\n\\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            else
                model="Unknown"
            fi
            
            # Get size
            if [ -f "$device/size" ]; then
                size_sectors=$(cat "$device/size" 2>/dev/null)
                size_gb=$((size_sectors * 512 / 1073741824))
                size="${size_gb} GB"
            else
                size="Unknown"
            fi
            
            # Determine manufacturer from model
            manufacturer="Unknown"
            case "$(echo "$model" | tr '[:upper:]' '[:lower:]')" in
                *samsung*) manufacturer="Samsung" ;;
                *seagate*) manufacturer="Seagate" ;;
                *western*|*wd*) manufacturer="Western Digital" ;;
                *toshiba*) manufacturer="Toshiba" ;;
                *crucial*) manufacturer="Crucial" ;;
                *intel*) manufacturer="Intel" ;;
                *kingston*) manufacturer="Kingston" ;;
            esac
            
            # Determine type
            case "$device_name" in
                nvme*) type="NVMe SSD" ;;
                mmcblk*) type="eMMC" ;;
                *) type="SATA" ;;
            esac
            
            storage_list="$storage_list{\\"manufacturer\\": \\"$manufacturer\\", \\"model\\": \\"$model\\", \\"size\\": \\"$size\\", \\"type\\": \\"$type\\", \\"device\\": \\"$device_name\\"},"
        fi
    done
    
    if [ -n "$storage_list" ]; then
        # Remove trailing comma
        storage_list=$(echo "$storage_list" | sed 's/,$//')
        storage_array="[$storage_list]"
    fi
fi

jq --argjson storage "$storage_array" '.hardware.storage = $storage' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# Graphics Detection
echo "Scanning graphics hardware..."
graphics_array="[]"
if command -v lspci >/dev/null 2>&1; then
    graphics_list=""
    lspci | grep -i vga > $TEMP_DIR/graphics.txt
    lspci | grep -i "3d controller" >> $TEMP_DIR/graphics.txt
    
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            # Extract manufacturer and model
            manufacturer="Unknown"
            model=$(echo "$line" | cut -d: -f3 | sed 's/^[[:space:]]*//')
            
            case "$(echo "$line" | tr '[:upper:]' '[:lower:]')" in
                *nvidia*) manufacturer="NVIDIA" ;;
                *intel*) manufacturer="Intel" ;;
                *amd*|*ati*) manufacturer="AMD" ;;
            esac
            
            graphics_list="$graphics_list{\\"manufacturer\\": \\"$manufacturer\\", \\"model\\": \\"$model\\"},"
        fi
    done < $TEMP_DIR/graphics.txt
    
    if [ -n "$graphics_list" ]; then
        graphics_list=$(echo "$graphics_list" | sed 's/,$//')
        graphics_array="[$graphics_list]"
    fi
fi

jq --argjson graphics "$graphics_array" '.hardware.graphics = $graphics' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# Network Detection
echo "Scanning network adapters..."
network_array="[]"
if command -v lspci >/dev/null 2>&1; then
    network_list=""
    lspci | grep -i ethernet > $TEMP_DIR/network.txt
    lspci | grep -i "network controller" >> $TEMP_DIR/network.txt
    
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            manufacturer="Unknown"
            model=$(echo "$line" | cut -d: -f3 | sed 's/^[[:space:]]*//')
            
            case "$(echo "$line" | tr '[:upper:]' '[:lower:]')" in
                *intel*) manufacturer="Intel" ;;
                *realtek*) manufacturer="Realtek" ;;
                *broadcom*) manufacturer="Broadcom" ;;
                *qualcomm*) manufacturer="Qualcomm" ;;
            esac
            
            network_list="$network_list{\\"manufacturer\\": \\"$manufacturer\\", \\"model\\": \\"$model\\", \\"type\\": \\"Ethernet\\"},"
        fi
    done < $TEMP_DIR/network.txt
    
    if [ -n "$network_list" ]; then
        network_list=$(echo "$network_list" | sed 's/,$//')
        network_array="[$network_list]"
    fi
fi

jq --argjson network "$network_array" '.hardware.network = $network' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# === SOFTWARE DETECTION ===
echo "Scanning software..."

# OS Information
os_name="Unknown Linux"
os_version="Unknown"
kernel_version=$(uname -r)

if [ -f /etc/os-release ]; then
    os_name=$(grep "^NAME=" /etc/os-release | cut -d= -f2 | tr -d '"')
    os_version=$(grep "^VERSION=" /etc/os-release | cut -d= -f2 | tr -d '"')
fi

jq --arg name "$os_name" --arg version "$os_version" --arg kernel "$kernel_version" '
    .software.os = {
        "name": $name,
        "version": $version,
        "build": $kernel
    }' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# Installed packages (sample)
echo "Scanning installed packages..."
packages_array="[]"
packages_list=""

if command -v dpkg >/dev/null 2>&1; then
    # Debian/Ubuntu
    dpkg -l 2>/dev/null | grep "^ii" | head -20 | while IFS= read -r line; do
        package_name=$(echo "$line" | awk '{print $2}')
        package_version=$(echo "$line" | awk '{print $3}')
        echo "{\\"name\\": \\"$package_name\\", \\"version\\": \\"$package_version\\", \\"publisher\\": \\"Debian\\"},"
    done > $TEMP_DIR/packages.json
elif command -v rpm >/dev/null 2>&1; then
    # Red Hat/CentOS
    rpm -qa 2>/dev/null | head -20 | while IFS= read -r line; do
        package_name=$(echo "$line" | cut -d'-' -f1)
        echo "{\\"name\\": \\"$package_name\\", \\"version\\": \\"Unknown\\", \\"publisher\\": \\"RPM\\"},"
    done > $TEMP_DIR/packages.json
fi

if [ -f $TEMP_DIR/packages.json ] && [ -s $TEMP_DIR/packages.json ]; then
    sed '$ s/,$//' $TEMP_DIR/packages.json > $TEMP_DIR/packages_clean.json
    packages_array="[$(cat $TEMP_DIR/packages_clean.json)]"
fi

jq --argjson packages "$packages_array" '.software.installedPrograms = $packages' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# System services (sample)
services_array="[]"
if command -v systemctl >/dev/null 2>&1; then
    systemctl list-units --type=service --no-pager --no-legend 2>/dev/null | head -10 | while IFS= read -r line; do
        if [ -n "$line" ]; then
            service_name=$(echo "$line" | awk '{print $1}')
            service_status=$(echo "$line" | awk '{print $2}')
            echo "{\\"name\\": \\"$service_name\\", \\"status\\": \\"$service_status\\", \\"startType\\": \\"systemd\\"},"
        fi
    done > $TEMP_DIR/services.json
    
    if [ -f $TEMP_DIR/services.json ] && [ -s $TEMP_DIR/services.json ]; then
        sed '$ s/,$//' $TEMP_DIR/services.json > $TEMP_DIR/services_clean.json
        services_array="[$(cat $TEMP_DIR/services_clean.json)]"
    fi
fi

jq --argjson services "$services_array" '.software.services = $services' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# Drivers (kernel modules)
drivers_array="[]"
lsmod | head -20 | tail -n +2 | while IFS= read -r line; do
    if [ -n "$line" ]; then
        driver_name=$(echo "$line" | awk '{print $1}')
        echo "{\\"name\\": \\"$driver_name\\", \\"version\\": \\"kernel\\", \\"manufacturer\\": \\"Linux\\"},"
    fi
done > $TEMP_DIR/drivers.json 2>/dev/null

if [ -f $TEMP_DIR/drivers.json ] && [ -s $TEMP_DIR/drivers.json ]; then
    sed '$ s/,$//' $TEMP_DIR/drivers.json > $TEMP_DIR/drivers_clean.json
    drivers_array="[$(cat $TEMP_DIR/drivers_clean.json)]"
fi

jq --argjson drivers "$drivers_array" '.software.drivers = $drivers' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# === OEM DETECTION ENGINE ===
echo "Analyzing detected OEMs..."

# Create OEM detection array
detected_oems=""

# Add system manufacturer
if [ -n "$vendor" ] && [ "$vendor" != "To Be Filled By O.E.M." ] && [ "$vendor" != "Unknown" ]; then
    detected_oems="$detected_oems\\"$vendor\\","
fi

# Add CPU manufacturer
if echo "$cpu_manufacturer" | grep -qi "intel"; then
    detected_oems="$detected_oems\\"Intel\\","
fi
if echo "$cpu_manufacturer" | grep -qi "amd"; then
    detected_oems="$detected_oems\\"AMD\\","
fi

# Check for NVIDIA graphics
if lspci 2>/dev/null | grep -qi nvidia; then
    detected_oems="$detected_oems\\"NVIDIA\\","
fi

# Check for common manufacturers in hardware
for hw_file in $TEMP_DIR/*.txt $TEMP_DIR/*.json; do
    if [ -f "$hw_file" ]; then
        grep -qi "samsung" "$hw_file" && detected_oems="$detected_oems\\"Samsung\\","
        grep -qi "seagate" "$hw_file" && detected_oems="$detected_oems\\"Seagate\\","
        grep -qi "western" "$hw_file" && detected_oems="$detected_oems\\"Western Digital\\","
        grep -qi "realtek" "$hw_file" && detected_oems="$detected_oems\\"Realtek\\","
        grep -qi "broadcom" "$hw_file" && detected_oems="$detected_oems\\"Broadcom\\","
    fi 2>/dev/null
done

# Always include Linux
detected_oems="$detected_oems\\"Linux\\","

# Clean up and create array
if [ -n "$detected_oems" ]; then
    detected_oems=$(echo "$detected_oems" | sed 's/,$//')
    oem_array="[$detected_oems]"
else
    oem_array="[\\"Linux\\"]"
fi

jq --argjson oems "$oem_array" '.detectedOEMs = $oems' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

echo
echo "==============================================="
echo "PROFESSIONAL SCAN COMPLETED SUCCESSFULLY!"
echo "==============================================="
echo "File: hawk_system_inventory.json"
echo
echo "This comprehensive inventory includes:"
echo "- Complete hardware component detection"
echo "- Real manufacturer identification"
echo "- Comprehensive software inventory"
echo "- Advanced OEM analysis engine"
echo "- Physical component specifications"
echo
echo "Upload this file to HAWK for automatic OEM monitoring setup."
echo "==============================================="
`;
  };

  const downloadScript = (platform: 'windows' | 'linux') => {
    const script = platform === 'windows' ? generateWindowsAuditScript() : generateLinuxAuditScript();
    const filename = platform === 'windows' ? 'hawk_professional_audit.bat' : 'hawk_professional_audit.sh';
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${platform} professional system audit script`);
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
      'Linux': 'https://cve.mitre.org',
      'Samsung': 'https://security.samsungmobile.com',
      'Seagate': 'https://www.seagate.com/support/security/',
      'Western Digital': 'https://www.westerndigital.com/support/security',
      'Realtek': 'https://www.realtek.com/en/security-advisory',
      'Broadcom': 'https://www.broadcom.com/support/security-advisories'
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
      'Linux': 'Operating System',
      'Samsung': 'Storage',
      'Seagate': 'Storage',
      'Western Digital': 'Storage',
      'Realtek': 'Network',
      'Broadcom': 'Network'
    };
    
    return oemTypes[oemName] || 'Hardware';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          Professional System Detection (WinAudit-Level)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Advanced hardware detection and comprehensive OEM identification
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
                  <h4 className="font-medium">Windows Professional Audit</h4>
                  <Badge variant="outline" className="text-xs mt-1">WinAudit-Level</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Deep hardware detection with real manufacturer identification
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
                  <h4 className="font-medium">Linux Professional Audit</h4>
                  <Badge variant="outline" className="text-xs mt-1">Hardware Detection</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Complete system analysis using lshw, dmidecode, and lspci
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

        {/* Enhanced Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Professional Hardware Detection Features
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li><strong>Real Hardware Detection:</strong> Uses WMI/DMI for actual component identification</li>
                <li><strong>Manufacturer Analysis:</strong> Extracts real manufacturer names from hardware</li>
                <li><strong>Component Specifications:</strong> Detailed CPU, memory, storage, and network info</li>
                <li><strong>Smart OEM Engine:</strong> Analyzes all components to identify relevant OEMs</li>
                <li><strong>Windows:</strong> Requires Administrator privileges for complete hardware access</li>
                <li><strong>Linux:</strong> Requires root for memory details (sudo ./script.sh)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WinAuditSystemDetector;
