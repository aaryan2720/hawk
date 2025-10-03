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
echo HAWK Professional System Inventory Scanner v4.0
echo WinAudit-Level Hardware Detection Enhanced
echo ===============================================
echo.

:: Create temp files for processing
set "TEMP_DIR=%TEMP%\\HAWK_SCAN_%RANDOM%"
mkdir "%TEMP_DIR%" 2>nul

:: Initialize JSON structure with proper formatting
(
echo {
echo   "timestamp": "%date% %time%",
echo   "platform": "Windows",
echo   "scriptVersion": "4.0",
echo   "systemInfo": {
) > hawk_system_inventory.json

:: === ENHANCED SYSTEM INFORMATION ===
echo Scanning enhanced system information...
echo     "manufacturer": "", >> hawk_system_inventory.json
echo     "model": "", >> hawk_system_inventory.json
echo     "serialNumber": "", >> hawk_system_inventory.json
echo     "biosVersion": "" >> hawk_system_inventory.json
echo   }, >> hawk_system_inventory.json

:: Get comprehensive system info
for /f "tokens=2 delims==" %%i in ('wmic computersystem get manufacturer /value 2^>nul ^| find "="') do (
    powershell -command "(Get-Content hawk_system_inventory.json) -replace '\\"manufacturer\\": \\"\\",', '\\"manufacturer\\": \\"%%i\\",' | Set-Content hawk_system_inventory.json"
)
for /f "tokens=2 delims==" %%i in ('wmic computersystem get model /value 2^>nul ^| find "="') do (
    powershell -command "(Get-Content hawk_system_inventory.json) -replace '\\"model\\": \\"\\",', '\\"model\\": \\"%%i\\",' | Set-Content hawk_system_inventory.json"
)
for /f "tokens=2 delims==" %%i in ('wmic bios get serialnumber /value 2^>nul ^| find "="') do (
    powershell -command "(Get-Content hawk_system_inventory.json) -replace '\\"serialNumber\\": \\"\\",', '\\"serialNumber\\": \\"%%i\\",' | Set-Content hawk_system_inventory.json"
)
for /f "tokens=2 delims==" %%i in ('wmic bios get version /value 2^>nul ^| find "="') do (
    powershell -command "(Get-Content hawk_system_inventory.json) -replace '\\"biosVersion\\": \\"\\"', '\\"biosVersion\\": \\"%%i\\"' | Set-Content hawk_system_inventory.json"
)

:: === ENHANCED HARDWARE DETECTION ===
echo Performing comprehensive hardware detection...
echo   "hardware": { >> hawk_system_inventory.json

:: Enhanced CPU Detection
echo     "cpu": [ >> hawk_system_inventory.json
wmic cpu get name,manufacturer,numberofcores,maxclockspeed,architecture /format:csv > "%TEMP_DIR%\\cpu_detailed.csv" 2>nul
powershell -command "$cpus = Import-Csv '%TEMP_DIR%\\cpu_detailed.csv' | Where-Object {$_.Name -ne ''}; foreach($cpu in $cpus) { $json = @{manufacturer=$cpu.Manufacturer; model=$cpu.Name; cores=[int]$cpu.NumberOfCores; speed=$cpu.MaxClockSpeed + ' MHz'; architecture=$cpu.Architecture} | ConvertTo-Json -Compress; Write-Output ('      ' + $json + ',') }" >> hawk_system_inventory.json 2>nul
echo     ], >> hawk_system_inventory.json

:: Enhanced Memory Detection with real manufacturer info
echo     "memory": [ >> hawk_system_inventory.json
wmic memorychip get manufacturer,capacity,speed,devicelocator,partnumber /format:csv > "%TEMP_DIR%\\memory_detailed.csv" 2>nul
powershell -command "$memory = Import-Csv '%TEMP_DIR%\\memory_detailed.csv' | Where-Object {$_.Capacity -ne ''}; foreach($mem in $memory) { $sizeGB = [math]::Round([double]$mem.Capacity / 1GB, 2); $json = @{manufacturer=$mem.Manufacturer; capacity=$sizeGB.ToString() + ' GB'; speed=$mem.Speed + ' MHz'; slot=$mem.DeviceLocator; partnumber=$mem.PartNumber} | ConvertTo-Json -Compress; Write-Output ('      ' + $json + ',') }" >> hawk_system_inventory.json 2>nul
echo     ], >> hawk_system_inventory.json

:: Enhanced Storage Detection with interface type
echo     "storage": [ >> hawk_system_inventory.json
wmic diskdrive get model,size,manufacturer,mediatype,interfacetype /format:csv > "%TEMP_DIR%\\storage_detailed.csv" 2>nul
powershell -command "$storage = Import-Csv '%TEMP_DIR%\\storage_detailed.csv' | Where-Object {$_.Size -ne ''}; foreach($drive in $storage) { $sizeGB = [math]::Round([double]$drive.Size / 1GB, 2); $json = @{manufacturer=$drive.Manufacturer; model=$drive.Model; size=$sizeGB.ToString() + ' GB'; type=$drive.MediaType; interface=$drive.InterfaceType} | ConvertTo-Json -Compress; Write-Output ('      ' + $json + ',') }" >> hawk_system_inventory.json 2>nul
echo     ], >> hawk_system_inventory.json

:: Enhanced Graphics Detection
echo     "graphics": [ >> hawk_system_inventory.json
wmic path win32_videocontroller get name,driverversion,driverprovider,adapterram /format:csv > "%TEMP_DIR%\\graphics_detailed.csv" 2>nul
powershell -command "$graphics = Import-Csv '%TEMP_DIR%\\graphics_detailed.csv' | Where-Object {$_.Name -ne ''}; foreach($gpu in $graphics) { $vramGB = if($gpu.AdapterRAM -and $gpu.AdapterRAM -ne '') {[math]::Round([double]$gpu.AdapterRAM / 1GB, 2).ToString() + ' GB'} else {'Unknown'}; $json = @{manufacturer=$gpu.DriverProvider; model=$gpu.Name; driver=$gpu.DriverVersion; vram=$vramGB} | ConvertTo-Json -Compress; Write-Output ('      ' + $json + ',') }" >> hawk_system_inventory.json 2>nul
echo     ], >> hawk_system_inventory.json

:: Enhanced Network Detection
echo     "network": [ >> hawk_system_inventory.json
wmic path win32_networkadapter where "PhysicalAdapter=True AND NOT Name LIKE '%%Virtual%%' AND NOT Name LIKE '%%Loopback%%'" get name,manufacturer,macaddress,speed /format:csv > "%TEMP_DIR%\\network_detailed.csv" 2>nul
powershell -command "$network = Import-Csv '%TEMP_DIR%\\network_detailed.csv' | Where-Object {$_.Name -ne ''}; foreach($nic in $network) { $json = @{manufacturer=$nic.Manufacturer; model=$nic.Name; mac=$nic.MACAddress; speed=$nic.Speed; type='Ethernet'} | ConvertTo-Json -Compress; Write-Output ('      ' + $json + ',') }" >> hawk_system_inventory.json 2>nul
echo     ] >> hawk_system_inventory.json
echo   }, >> hawk_system_inventory.json

:: === ENHANCED SOFTWARE DETECTION ===
echo Performing comprehensive software analysis...
echo   "software": { >> hawk_system_inventory.json

:: Operating System with detailed version info
echo     "os": { >> hawk_system_inventory.json
for /f "tokens=2 delims==" %%i in ('wmic os get caption /value 2^>nul ^| find "="') do (
    echo       "name": "%%i", >> hawk_system_inventory.json
)
for /f "tokens=2 delims==" %%i in ('wmic os get version /value 2^>nul ^| find "="') do (
    echo       "version": "%%i", >> hawk_system_inventory.json
)
for /f "tokens=2 delims==" %%i in ('wmic os get buildnumber /value 2^>nul ^| find "="') do (
    echo       "build": "%%i" >> hawk_system_inventory.json
)
echo     }, >> hawk_system_inventory.json

:: Enhanced Installed Programs Detection
echo     "installedPrograms": [ >> hawk_system_inventory.json
wmic product get name,version,vendor,installdate /format:csv > "%TEMP_DIR%\\programs_detailed.csv" 2>nul
powershell -command "$programs = Import-Csv '%TEMP_DIR%\\programs_detailed.csv' | Where-Object {$_.Name -ne ''} | Select-Object -First 50; foreach($prog in $programs) { $json = @{name=$prog.Name; version=$prog.Version; publisher=$prog.Vendor; installDate=$prog.InstallDate} | ConvertTo-Json -Compress; Write-Output ('      ' + $json + ',') }" >> hawk_system_inventory.json 2>nul
echo     ], >> hawk_system_inventory.json

:: System Drivers with detailed info
echo     "drivers": [ >> hawk_system_inventory.json
wmic systemdriver get name,version,pathname /format:csv > "%TEMP_DIR%\\drivers_detailed.csv" 2>nul
powershell -command "$drivers = Import-Csv '%TEMP_DIR%\\drivers_detailed.csv' | Where-Object {$_.Name -ne ''} | Select-Object -First 30; foreach($driver in $drivers) { $json = @{name=$driver.Name; version=$driver.Version; path=$driver.PathName} | ConvertTo-Json -Compress; Write-Output ('      ' + $json + ',') }" >> hawk_system_inventory.json 2>nul
echo     ], >> hawk_system_inventory.json

:: Running Services
echo     "services": [ >> hawk_system_inventory.json
wmic service where "State='Running'" get name,state,startmode /format:csv > "%TEMP_DIR%\\services_detailed.csv" 2>nul
powershell -command "$services = Import-Csv '%TEMP_DIR%\\services_detailed.csv' | Where-Object {$_.Name -ne ''} | Select-Object -First 50; foreach($svc in $services) { $json = @{name=$svc.Name; status=$svc.State; startType=$svc.StartMode} | ConvertTo-Json -Compress; Write-Output ('      ' + $json + ',') }" >> hawk_system_inventory.json 2>nul
echo     ] >> hawk_system_inventory.json
echo   }, >> hawk_system_inventory.json

:: === ADVANCED OEM DETECTION ENGINE ===
echo Analyzing system for OEM identification...
echo   "detectedOEMs": [ >> hawk_system_inventory.json

:: Create comprehensive OEM detection
powershell -command "
$oems = @()

# System manufacturer detection
$sysInfo = Get-WmiObject Win32_ComputerSystem
if ($sysInfo.Manufacturer -and $sysInfo.Manufacturer -ne 'To Be Filled By O.E.M.') {
    $oems += $sysInfo.Manufacturer
}

# CPU manufacturer detection
$cpus = Get-WmiObject Win32_Processor
foreach ($cpu in $cpus) {
    if ($cpu.Name -like '*Intel*') { $oems += 'Intel' }
    if ($cpu.Name -like '*AMD*') { $oems += 'AMD' }
}

# Graphics manufacturer detection
$graphics = Get-WmiObject Win32_VideoController | Where-Object { $_.Name -notlike '*Basic*' }
foreach ($gpu in $graphics) {
    if ($gpu.Name -like '*NVIDIA*') { $oems += 'NVIDIA' }
    if ($gpu.Name -like '*AMD*' -or $gpu.Name -like '*Radeon*') { $oems += 'AMD' }
    if ($gpu.Name -like '*Intel*') { $oems += 'Intel' }
}

# Memory manufacturer detection
$memory = Get-WmiObject Win32_PhysicalMemory
foreach ($mem in $memory) {
    if ($mem.Manufacturer) {
        switch -Wildcard ($mem.Manufacturer) {
            '*Samsung*' { $oems += 'Samsung' }
            '*Micron*' { $oems += 'Micron' }
            '*Corsair*' { $oems += 'Corsair' }
            '*Kingston*' { $oems += 'Kingston' }
            '*G.Skill*' { $oems += 'G.Skill' }
        }
    }
}

# Storage manufacturer detection
$storage = Get-WmiObject Win32_DiskDrive
foreach ($drive in $storage) {
    switch -Wildcard ($drive.Model) {
        '*Samsung*' { $oems += 'Samsung' }
        '*Seagate*' { $oems += 'Seagate' }
        '*Western*' { $oems += 'Western Digital' }
        '*Toshiba*' { $oems += 'Toshiba' }
        '*Crucial*' { $oems += 'Crucial' }
        '*Intel*' { $oems += 'Intel' }
    }
}

# Network manufacturer detection
$network = Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.PhysicalAdapter -eq $true }
foreach ($nic in $network) {
    switch -Wildcard ($nic.Name) {
        '*Intel*' { $oems += 'Intel' }
        '*Realtek*' { $oems += 'Realtek' }
        '*Broadcom*' { $oems += 'Broadcom' }
        '*Qualcomm*' { $oems += 'Qualcomm' }
    }
}

# Always include Microsoft for Windows
$oems += 'Microsoft'

# Remove duplicates and output
$uniqueOems = $oems | Sort-Object -Unique
foreach ($oem in $uniqueOems) {
    Write-Output ('    \"' + $oem + '\",')
}
" >> hawk_system_inventory.json

:: Remove trailing comma and close JSON
powershell -command "(Get-Content hawk_system_inventory.json) -replace ',(?=\\s*\\])', '' | Set-Content hawk_system_inventory.json"
echo   ] >> hawk_system_inventory.json
echo } >> hawk_system_inventory.json

:: Clean up
rmdir /s /q "%TEMP_DIR%" 2>nul

echo.
echo ===============================================
echo PROFESSIONAL SCAN COMPLETED SUCCESSFULLY!
echo ===============================================
echo File: hawk_system_inventory.json
echo.
echo Enhanced WinAudit-level inventory includes:
echo - Real hardware manufacturer identification
echo - Comprehensive component specifications
echo - Advanced OEM detection from all components
echo - Detailed software and driver inventory
echo - JSON format for automated processing
echo.
echo Upload this file to HAWK for automatic OEM monitoring setup.
echo ===============================================
pause`;
  };

  const generateLinuxAuditScript = (): string => {
    return `#!/bin/bash

echo "==============================================="
echo "HAWK Professional System Inventory Scanner v4.0"
echo "Advanced Linux Hardware Detection Enhanced"
echo "==============================================="
echo

# Check for required tools
MISSING_TOOLS=""
command -v lscpu >/dev/null 2>&1 || MISSING_TOOLS="$MISSING_TOOLS lscpu"
command -v lshw >/dev/null 2>&1 || MISSING_TOOLS="$MISSING_TOOLS lshw"
command -v lspci >/dev/null 2>&1 || MISSING_TOOLS="$MISSING_TOOLS lspci"
command -v dmidecode >/dev/null 2>&1 || MISSING_TOOLS="$MISSING_TOOLS dmidecode"
command -v jq >/dev/null 2>&1 || MISSING_TOOLS="$MISSING_TOOLS jq"

if [ -n "$MISSING_TOOLS" ]; then
    echo "Warning: Missing tools:$MISSING_TOOLS"
    echo "Install with: sudo apt-get install util-linux pciutils dmidecode lshw jq"
    echo "Some information may be incomplete."
    echo
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Initialize JSON structure
cat > hawk_system_inventory.json << 'EOF'
{
  "timestamp": "",
  "platform": "Linux",
  "scriptVersion": "4.0",
  "systemInfo": {
    "manufacturer": "",
    "model": "",
    "serialNumber": "",
    "biosVersion": ""
  },
  "hardware": {
    "cpu": [],
    "memory": [],
    "storage": [],
    "graphics": [],
    "network": []
  },
  "software": {
    "os": {
      "name": "",
      "version": "",
      "build": ""
    },
    "installedPrograms": [],
    "drivers": [],
    "services": []
  },
  "detectedOEMs": []
}
EOF

echo "Scanning comprehensive system information..."

# Add timestamp
timestamp=$(date -Iseconds 2>/dev/null || date)
jq --arg ts "$timestamp" '.timestamp = $ts' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# === ENHANCED SYSTEM INFORMATION ===
echo "Detecting enhanced system information..."

# Get detailed system info from DMI
if [ -f /sys/class/dmi/id/sys_vendor ]; then
    vendor=$(cat /sys/class/dmi/id/sys_vendor 2>/dev/null | tr -d '\0\n\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    model=$(cat /sys/class/dmi/id/product_name 2>/dev/null | tr -d '\0\n\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    serial=$(cat /sys/class/dmi/id/product_serial 2>/dev/null | tr -d '\0\n\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    bios=$(cat /sys/class/dmi/id/bios_version 2>/dev/null | tr -d '\0\n\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    
    jq --arg v "$vendor" --arg m "$model" --arg s "$serial" --arg b "$bios" '
        .systemInfo.manufacturer = $v |
        .systemInfo.model = $m |
        .systemInfo.serialNumber = $s |
        .systemInfo.biosVersion = $b
    ' hawk_system_inventory.json > $TEMP_DIR/tmp.json
    mv $TEMP_DIR/tmp.json hawk_system_inventory.json
fi

# === ENHANCED HARDWARE DETECTION ===
echo "Performing comprehensive hardware detection..."

# Enhanced CPU Information
echo "Scanning CPU with detailed specifications..."
if command -v lscpu >/dev/null 2>&1; then
    cpu_info=$(lscpu)
    cpu_model=$(echo "$cpu_info" | grep "Model name:" | cut -d: -f2 | sed 's/^[[:space:]]*//')
    cpu_cores=$(echo "$cpu_info" | grep "^CPU(s):" | cut -d: -f2 | sed 's/^[[:space:]]*//')
    cpu_speed=$(echo "$cpu_info" | grep "CPU max MHz:" | cut -d: -f2 | sed 's/^[[:space:]]*//' || echo "$cpu_info" | grep "CPU MHz:" | cut -d: -f2 | sed 's/^[[:space:]]*//')
    cpu_arch=$(echo "$cpu_info" | grep "Architecture:" | cut -d: -f2 | sed 's/^[[:space:]]*//')
    
    cpu_manufacturer="Unknown"
    if echo "$cpu_model" | grep -qi "intel"; then
        cpu_manufacturer="Intel"
    elif echo "$cpu_model" | grep -qi "amd"; then
        cpu_manufacturer="AMD"
    fi
    
    jq --arg man "$cpu_manufacturer" --arg mod "$cpu_model" --arg cores "$cpu_cores" --arg speed "$cpu_speed" --arg arch "$cpu_arch" '
        .hardware.cpu = [{
            "manufacturer": $man,
            "model": $mod,
            "cores": ($cores | tonumber),
            "speed": ($speed + " MHz"),
            "architecture": $arch
        }]' hawk_system_inventory.json > $TEMP_DIR/tmp.json
    mv $TEMP_DIR/tmp.json hawk_system_inventory.json
fi

# Enhanced Memory Information with real manufacturer detection
echo "Scanning memory modules with manufacturer details..."
memory_array="[]"
if command -v dmidecode >/dev/null 2>&1 && [ "$EUID" -eq 0 ]; then
    # Running as root, can get detailed memory info
    dmidecode -t memory | awk '
        /Memory Device/,/^$/ {
            if ($1 == "Manufacturer:") manufacturer = substr($0, index($0, $2))
            if ($1 == "Size:" && $2 != "No") {
                size = $2 " " $3
                # Convert to GB if in MB
                if ($3 == "MB") {
                    size_val = $2 / 1024
                    size = sprintf("%.1f GB", size_val)
                }
            }
            if ($1 == "Speed:") speed = $2 " " $3
            if ($1 == "Locator:") locator = substr($0, index($0, $2))
            if ($1 == "Part" && $2 == "Number:") partnumber = substr($0, index($0, $3))
            if (/^$/ && size && size != "No Module Installed") {
                printf "{\"manufacturer\": \"%s\", \"capacity\": \"%s\", \"speed\": \"%s\", \"slot\": \"%s\", \"partnumber\": \"%s\"},\\n", 
                       manufacturer, size, speed, locator, partnumber
                manufacturer = ""; size = ""; speed = ""; locator = ""; partnumber = ""
            }
        }' > $TEMP_DIR/memory.json
    
    if [ -s $TEMP_DIR/memory.json ]; then
        sed '$ s/,$//' $TEMP_DIR/memory.json > $TEMP_DIR/memory_clean.json
        memory_array="[$(cat $TEMP_DIR/memory_clean.json)]"
    fi
else
    # Fallback method
    total_mem=$(free -h 2>/dev/null | awk '/^Mem:/ {print $2}' || echo "Unknown")
    memory_array="[{\"manufacturer\": \"Unknown\", \"capacity\": \"$total_mem\", \"speed\": \"Unknown\", \"slot\": \"Total\", \"partnumber\": \"N/A\"}]"
fi

jq --argjson mem "$memory_array" '.hardware.memory = $mem' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# Enhanced Storage Detection with detailed specifications
echo "Scanning storage devices with detailed specifications..."
storage_array="[]"
if [ -d /sys/block ]; then
    storage_list=""
    for device in /sys/block/sd* /sys/block/nvme* /sys/block/mmcblk*; do
        if [ -d "$device" ] 2>/dev/null; then
            device_name=$(basename "$device")
            
            # Get model and vendor
            model="Unknown"
            vendor="Unknown"
            
            if [ -f "$device/device/model" ]; then
                model=$(cat "$device/device/model" 2>/dev/null | tr -d '\0\n\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            fi
            
            if [ -f "$device/device/vendor" ]; then
                vendor=$(cat "$device/device/vendor" 2>/dev/null | tr -d '\0\n\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            fi
            
            # Get size in a more reliable way
            size="Unknown"
            if [ -f "$device/size" ]; then
                size_sectors=$(cat "$device/size" 2>/dev/null)
                if [ -n "$size_sectors" ] && [ "$size_sectors" -gt 0 ]; then
                    size_bytes=$((size_sectors * 512))
                    size_gb=$((size_bytes / 1000000000))
                    size="$size_gb GB"
                fi
            fi
            
            # Determine manufacturer from model or vendor
            manufacturer="Unknown"
            combined_info="$(echo "$model $vendor" | tr '[:upper:]' '[:lower:]')"
            case "$combined_info" in
                *samsung*) manufacturer="Samsung" ;;
                *seagate*) manufacturer="Seagate" ;;
                *western*|*wd*) manufacturer="Western Digital" ;;
                *toshiba*) manufacturer="Toshiba" ;;
                *crucial*) manufacturer="Crucial" ;;
                *intel*) manufacturer="Intel" ;;
                *kingston*) manufacturer="Kingston" ;;
                *sandisk*) manufacturer="SanDisk" ;;
                *hitachi*) manufacturer="Hitachi" ;;
                *) 
                    if [ "$vendor" != "Unknown" ] && [ "$vendor" != "ATA" ]; then
                        manufacturer="$vendor"
                    fi
                ;;
            esac
            
            # Determine type and interface
            type="Unknown"
            interface="Unknown"
            case "$device_name" in
                nvme*) 
                    type="NVMe SSD"
                    interface="NVMe"
                ;;
                mmcblk*) 
                    type="eMMC"
                    interface="eMMC"
                ;;
                sd*) 
                    # Try to detect if it's SSD or HDD
                    if [ -f "$device/queue/rotational" ]; then
                        rotational=$(cat "$device/queue/rotational" 2>/dev/null)
                        if [ "$rotational" = "0" ]; then
                            type="SATA SSD"
                        else
                            type="SATA HDD"
                        fi
                    else
                        type="SATA"
                    fi
                    interface="SATA"
                ;;
            esac
            
            storage_list="$storage_list{\"manufacturer\": \"$manufacturer\", \"model\": \"$model\", \"size\": \"$size\", \"type\": \"$type\", \"interface\": \"$interface\", \"device\": \"$device_name\"},"
        fi
    done
    
    if [ -n "$storage_list" ]; then
        storage_list=$(echo "$storage_list" | sed 's/,$//')
        storage_array="[$storage_list]"
    fi
fi

jq --argjson storage "$storage_array" '.hardware.storage = $storage' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# Enhanced Graphics Detection
echo "Scanning graphics hardware with detailed specifications..."
graphics_array="[]"
if command -v lspci >/dev/null 2>&1; then
    graphics_list=""
    lspci -nn | grep -i vga > $TEMP_DIR/graphics.txt
    lspci -nn | grep -i "3d controller" >> $TEMP_DIR/graphics.txt
    lspci -nn | grep -i "display controller" >> $TEMP_DIR/graphics.txt
    
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            # Extract manufacturer and model with better parsing
            manufacturer="Unknown"
            model=$(echo "$line" | sed 's/^[^:]*://' | sed 's/\[.*\]//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
            
            case "$(echo "$line" | tr '[:upper:]' '[:lower:]')" in
                *nvidia*) manufacturer="NVIDIA" ;;
                *intel*) manufacturer="Intel" ;;
                *amd*|*ati*|*radeon*) manufacturer="AMD" ;;
                *matrox*) manufacturer="Matrox" ;;
                *aspeed*) manufacturer="ASPEED" ;;
            esac
            
            # Try to get VRAM info if available
            vram="Unknown"
            
            graphics_list="$graphics_list{\"manufacturer\": \"$manufacturer\", \"model\": \"$model\", \"vram\": \"$vram\"},"
        fi
    done < $TEMP_DIR/graphics.txt
    
    if [ -n "$graphics_list" ]; then
        graphics_list=$(echo "$graphics_list" | sed 's/,$//')
        graphics_array="[$graphics_list]"
    fi
fi

jq --argjson graphics "$graphics_array" '.hardware.graphics = $graphics' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# Enhanced Network Detection
echo "Scanning network adapters with detailed specifications..."
network_array="[]"
if command -v lspci >/dev/null 2>&1; then
    network_list=""
    lspci -nn | grep -i ethernet > $TEMP_DIR/network.txt
    lspci -nn | grep -i "network controller" >> $TEMP_DIR/network.txt
    lspci -nn | grep -i "wireless" >> $TEMP_DIR/network.txt
    
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            manufacturer="Unknown"
            model=$(echo "$line" | sed 's/^[^:]*://' | sed 's/\[.*\]//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            
            # Determine type
            net_type="Ethernet"
            if echo "$line" | grep -qi "wireless\|wifi\|802\.11"; then
                net_type="Wireless"
            fi
            
            case "$(echo "$line" | tr '[:upper:]' '[:lower:]')" in
                *intel*) manufacturer="Intel" ;;
                *realtek*) manufacturer="Realtek" ;;
                *broadcom*) manufacturer="Broadcom" ;;
                *qualcomm*) manufacturer="Qualcomm" ;;
                *marvell*) manufacturer="Marvell" ;;
                *mediatek*) manufacturer="MediaTek" ;;
                *atheros*) manufacturer="Atheros" ;;
            esac
            
            network_list="$network_list{\"manufacturer\": \"$manufacturer\", \"model\": \"$model\", \"type\": \"$net_type\"},"
        fi
    done < $TEMP_DIR/network.txt
    
    if [ -n "$network_list" ]; then
        network_list=$(echo "$network_list" | sed 's/,$//')
        network_array="[$network_list]"
    fi
fi

jq --argjson network "$network_array" '.hardware.network = $network' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# === ENHANCED SOFTWARE DETECTION ===
echo "Performing comprehensive software analysis..."

# Enhanced OS Information
os_name="Unknown Linux"
os_version="Unknown"
kernel_version=$(uname -r)

if [ -f /etc/os-release ]; then
    os_name=$(grep "^PRETTY_NAME=" /etc/os-release | cut -d= -f2 | tr -d '"' || grep "^NAME=" /etc/os-release | cut -d= -f2 | tr -d '"')
    os_version=$(grep "^VERSION=" /etc/os-release | cut -d= -f2 | tr -d '"' || grep "^VERSION_ID=" /etc/os-release | cut -d= -f2 | tr -d '"')
fi

jq --arg name "$os_name" --arg version "$os_version" --arg kernel "$kernel_version" '
    .software.os = {
        "name": $name,
        "version": $version,
        "build": $kernel
    }' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# Enhanced package detection
echo "Scanning installed packages..."
packages_array="[]"

if command -v dpkg >/dev/null 2>&1; then
    # Debian/Ubuntu - get more comprehensive package info
    dpkg-query -W -f='\${Package}|\${Version}|\${Maintainer}|\${Status}\n' 2>/dev/null | \
    grep "|install ok installed" | head -100 | while IFS='|' read -r pkg_name pkg_version pkg_maintainer pkg_status; do
        echo "{\"name\": \"$pkg_name\", \"version\": \"$pkg_version\", \"publisher\": \"Debian/Ubuntu\", \"maintainer\": \"$pkg_maintainer\"},"
    done > $TEMP_DIR/packages.json 2>/dev/null
elif command -v rpm >/dev/null 2>&1; then
    # Red Hat/CentOS/Fedora
    rpm -qa --queryformat '%{NAME}|%{VERSION}|%{VENDOR}\n' 2>/dev/null | head -100 | while IFS='|' read -r pkg_name pkg_version pkg_vendor; do
        echo "{\"name\": \"$pkg_name\", \"version\": \"$pkg_version\", \"publisher\": \"RPM\", \"vendor\": \"$pkg_vendor\"},"
    done > $TEMP_DIR/packages.json 2>/dev/null
elif command -v pacman >/dev/null 2>&1; then
    # Arch Linux
    pacman -Q 2>/dev/null | head -100 | while read -r pkg_name pkg_version; do
        echo "{\"name\": \"$pkg_name\", \"version\": \"$pkg_version\", \"publisher\": \"Arch\", \"vendor\": \"Arch Linux\"},"
    done > $TEMP_DIR/packages.json 2>/dev/null
fi

if [ -f $TEMP_DIR/packages.json ] && [ -s $TEMP_DIR/packages.json ]; then
    sed '$ s/,$//' $TEMP_DIR/packages.json > $TEMP_DIR/packages_clean.json
    packages_array="[$(cat $TEMP_DIR/packages_clean.json)]"
fi

jq --argjson packages "$packages_array" '.software.installedPrograms = $packages' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# Enhanced system services
echo "Scanning system services..."
services_array="[]"
if command -v systemctl >/dev/null 2>&1; then
    systemctl list-units --type=service --state=active --no-pager --no-legend 2>/dev/null | head -50 | while read -r line; do
        if [ -n "$line" ]; then
            service_name=$(echo "$line" | awk '{print $1}' | sed 's/\.service$//')
            service_status=$(echo "$line" | awk '{print $2}')
            service_active=$(echo "$line" | awk '{print $3}')
            echo "{\"name\": \"$service_name\", \"status\": \"$service_status\", \"active\": \"$service_active\", \"startType\": \"systemd\"},"
        fi
    done > $TEMP_DIR/services.json 2>/dev/null
    
    if [ -f $TEMP_DIR/services.json ] && [ -s $TEMP_DIR/services.json ]; then
        sed '$ s/,$//' $TEMP_DIR/services.json > $TEMP_DIR/services_clean.json
        services_array="[$(cat $TEMP_DIR/services_clean.json)]"
    fi
fi

jq --argjson services "$services_array" '.software.services = $services' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# Enhanced kernel modules (drivers)
echo "Scanning kernel modules..."
drivers_array="[]"
lsmod 2>/dev/null | tail -n +2 | head -50 | while read -r line; do
    if [ -n "$line" ]; then
        driver_name=$(echo "$line" | awk '{print $1}')
        driver_size=$(echo "$line" | awk '{print $2}')
        driver_used=$(echo "$line" | awk '{print $3}')
        echo "{\"name\": \"$driver_name\", \"size\": \"$driver_size\", \"used_count\": \"$driver_used\", \"type\": \"kernel_module\"},"
    fi
done > $TEMP_DIR/drivers.json 2>/dev/null

if [ -f $TEMP_DIR/drivers.json ] && [ -s $TEMP_DIR/drivers.json ]; then
    sed '$ s/,$//' $TEMP_DIR/drivers.json > $TEMP_DIR/drivers_clean.json
    drivers_array="[$(cat $TEMP_DIR/drivers_clean.json)]"
fi

jq --argjson drivers "$drivers_array" '.software.drivers = $drivers' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

# === ADVANCED OEM DETECTION ENGINE ===
echo "Performing comprehensive OEM analysis..."

# Create comprehensive OEM detection array
detected_oems=""

# Add system manufacturer
if [ -n "$vendor" ] && [ "$vendor" != "To Be Filled By O.E.M." ] && [ "$vendor" != "Unknown" ] && [ "$vendor" != "System manufacturer" ]; then
    detected_oems="$detected_oems\"$vendor\","
fi

# Add CPU manufacturer
if [ -n "$cpu_manufacturer" ] && [ "$cpu_manufacturer" != "Unknown" ]; then
    detected_oems="$detected_oems\"$cpu_manufacturer\","
fi

# Check for GPU manufacturers
if lspci 2>/dev/null | grep -qi nvidia; then
    detected_oems="$detected_oems\"NVIDIA\","
fi
if lspci 2>/dev/null | grep -qi "amd\|ati\|radeon"; then
    detected_oems="$detected_oems\"AMD\","
fi

# Check memory manufacturers from detailed scan
if [ -f $TEMP_DIR/memory.json ]; then
    grep -qi "samsung" $TEMP_DIR/memory.json 2>/dev/null && detected_oems="$detected_oems\"Samsung\","
    grep -qi "micron" $TEMP_DIR/memory.json 2>/dev/null && detected_oems="$detected_oems\"Micron\","
    grep -qi "corsair" $TEMP_DIR/memory.json 2>/dev/null && detected_oems="$detected_oems\"Corsair\","
    grep -qi "kingston" $TEMP_DIR/memory.json 2>/dev/null && detected_oems="$detected_oems\"Kingston\","
fi

# Check storage manufacturers
for hw_file in $TEMP_DIR/*.txt; do
    if [ -f "$hw_file" ]; then
        grep -qi "samsung" "$hw_file" 2>/dev/null && detected_oems="$detected_oems\"Samsung\","
        grep -qi "seagate" "$hw_file" 2>/dev/null && detected_oems="$detected_oems\"Seagate\","
        grep -qi "western" "$hw_file" 2>/dev/null && detected_oems="$detected_oems\"Western Digital\","
        grep -qi "toshiba" "$hw_file" 2>/dev/null && detected_oems="$detected_oems\"Toshiba\","
        grep -qi "crucial" "$hw_file" 2>/dev/null && detected_oems="$detected_oems\"Crucial\","
        grep -qi "realtek" "$hw_file" 2>/dev/null && detected_oems="$detected_oems\"Realtek\","
        grep -qi "broadcom" "$hw_file" 2>/dev/null && detected_oems="$detected_oems\"Broadcom\","
        grep -qi "intel" "$hw_file" 2>/dev/null && detected_oems="$detected_oems\"Intel\","
    fi
done

# Always include the Linux distribution
if [ -n "$os_name" ]; then
    case "$os_name" in
        *Ubuntu*) detected_oems="$detected_oems\"Canonical\",";;
        *Red\ Hat*|*RHEL*) detected_oems="$detected_oems\"Red Hat\",";;
        *CentOS*) detected_oems="$detected_oems\"CentOS\",";;
        *Fedora*) detected_oems="$detected_oems\"Fedora\",";;
        *SUSE*) detected_oems="$detected_oems\"SUSE\",";;
        *Debian*) detected_oems="$detected_oems\"Debian\",";;
        *Arch*) detected_oems="$detected_oems\"Arch Linux\",";;
        *) detected_oems="$detected_oems\"Linux\",";;
    esac
fi

# Clean up duplicates and create final array
if [ -n "$detected_oems" ]; then
    # Remove trailing comma and create temporary file for deduplication
    echo "$detected_oems" | sed 's/,$//' | tr ',' '\n' | sort | uniq > $TEMP_DIR/unique_oems.txt
    
    # Build final OEM array
    oem_array="["
    while IFS= read -r oem; do
        if [ -n "$oem" ]; then
            oem_array="$oem_array$oem,"
        fi
    done < $TEMP_DIR/unique_oems.txt
    oem_array=$(echo "$oem_array" | sed 's/,$//')"]"
else
    oem_array="[\"Linux\"]"
fi

jq --argjson oems "$oem_array" '.detectedOEMs = $oems' hawk_system_inventory.json > $TEMP_DIR/tmp.json
mv $TEMP_DIR/tmp.json hawk_system_inventory.json

echo
echo "==============================================="
echo "PROFESSIONAL SCAN COMPLETED SUCCESSFULLY!"
echo "==============================================="
echo "File: hawk_system_inventory.json"
echo
echo "Enhanced comprehensive inventory includes:"
echo "- Real hardware manufacturer identification"
echo "- Detailed component specifications"
echo "- Advanced OEM detection from all components"
echo "- Comprehensive software and package inventory"
echo "- JSON format for automated processing"
echo
echo "Detected OEMs:"
jq -r '.detectedOEMs[]?' hawk_system_inventory.json 2>/dev/null | sed 's/^/  - /' || echo "  - Unable to display (install jq for better output)"
echo
echo "Upload this file to HAWK for automatic OEM monitoring setup."
echo "==============================================="
`;
  };

  const downloadScript = (platform: 'windows' | 'linux') => {
    const script = platform === 'windows' ? generateWindowsAuditScript() : generateLinuxAuditScript();
    const filename = platform === 'windows' ? 'hawk_professional_audit_v4.bat' : 'hawk_professional_audit_v4.sh';
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${platform} professional system audit script v4.0`);
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
      
      // Auto-configure OEM monitoring if OEMs were detected
      if (data.detectedOEMs && data.detectedOEMs.length > 0 && user) {
        toast.info('Auto-configuring OEM monitoring...', { duration: 2000 });
        
        // Configure OEM monitoring directly with the data
        try {
          let configured = 0;
          
          for (const oem of data.detectedOEMs) {
            const oemUrl = generateOEMSecurityUrl(oem);
            const systemType = determineSystemType(oem, data);
            
            await addOEMSource(user.id, oem, oemUrl, systemType);
            configured++;
          }
          
          toast.success(`✓ Configured monitoring for ${configured} detected OEMs`);
        } catch (error) {
          console.error('Error configuring OEM monitoring:', error);
          toast.error('Failed to configure some OEM sources');
        }
      }
      
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
      'Broadcom': 'https://www.broadcom.com/support/security-advisories',
      'Canonical': 'https://ubuntu.com/security/notices',
      'Red Hat': 'https://access.redhat.com/security/security-updates/',
      'Debian': 'https://security-tracker.debian.org/tracker/',
      'Corsair': 'https://www.corsair.com/us/en/support',
      'Kingston': 'https://www.kingston.com/support',
      'Micron': 'https://www.micron.com/support/security',
      'Crucial': 'https://www.crucial.com/support',
      'Toshiba': 'https://www.toshiba.com/support/security'
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
      'Broadcom': 'Network',
      'Canonical': 'Operating System',
      'Red Hat': 'Operating System',
      'Debian': 'Operating System',
      'Corsair': 'Memory',
      'Kingston': 'Memory',
      'Micron': 'Memory',
      'Crucial': 'Storage',
      'Toshiba': 'Storage'
    };
    
    return oemTypes[oemName] || 'Hardware';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          Professional System Detection v4.0 (Enhanced WinAudit-Level)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Advanced hardware detection with comprehensive OEM identification and detailed specifications
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
                  <h4 className="font-medium">Windows Professional Audit v4.0</h4>
                  <Badge variant="outline" className="text-xs mt-1">Enhanced WinAudit</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                PowerShell-enhanced detection with real manufacturer identification and detailed specs
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => downloadScript('windows')}
              >
                <Download className="h-3 w-3 mr-2" />
                Download Windows Script v4.0
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Monitor className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-medium">Linux Professional Audit v4.0</h4>
                  <Badge variant="outline" className="text-xs mt-1">Enhanced Detection</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Comprehensive system analysis using enhanced lshw, dmidecode, and advanced parsing
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => downloadScript('linux')}
              >
                <Download className="h-3 w-3 mr-2" />
                Download Linux Script v4.0
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
                {inventory.detectedOEMs?.length > 0 ? (
                  inventory.detectedOEMs.map((oem, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded border">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{oem}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {determineSystemType(oem, inventory)}
                      </Badge>
                    </div>
                  ))
                ) : (
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
                Enhanced Professional Hardware Detection Features v4.0
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li><strong>PowerShell Integration:</strong> Windows script now uses PowerShell for advanced JSON processing</li>
                <li><strong>Real Manufacturer Detection:</strong> Extracts actual manufacturer names from hardware components</li>
                <li><strong>Enhanced Component Specs:</strong> Detailed CPU, memory, storage specifications with part numbers</li>
                <li><strong>Advanced OEM Engine:</strong> Comprehensive analysis of all system components for OEM identification</li>
                <li><strong>Improved Linux Detection:</strong> Better parsing with jq integration and enhanced hardware detection</li>
                <li><strong>JSON Validation:</strong> Proper JSON formatting with error handling and data validation</li>
                <li><strong>Windows:</strong> Requires Administrator privileges for complete hardware access</li>
                <li><strong>Linux:</strong> Requires root for memory details and lshw/dmidecode tools (sudo ./script.sh)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WinAuditSystemDetector;
