# Problem Statement & Implementation Roadmap

## Problem Statement

### Background
Critical Sector organisations use a number of IT and OT equipment (e.g. Networking and hardware devices, Operating Systems, Applications, Firmware etc.). These devices/applications come with vulnerabilities from time to time. There should be a timely information sharing mechanism by which the concerned equipment users at critical sector organizations should be alerted regarding any critical/high severity vulnerabilities in their equipment within the shortest possible time.

### Detailed Description
The ICT components (HW/SW) being used by Critical Sector Organisations become vulnerable from time to time. These vulnerabilities can be categorized as Critical, High, Medium and Low. Any exploitation of these vulnerabilities can cause havoc in multiple Critical Sector Organisations where such vulnerable equipment are being used.

Keeping in view of the above, there is a need to monitor all such vulnerability information published at the equipment's OEM websites and also other relevant websites. Once a critical or high severity vulnerability information is published at OEM website or any other relevant website, the "to be developed scraper" will immediately take that vulnerability input along with possible mitigating strategy published in the website and send the information to predefined email id(s).

**Note**: The NVD website publishes such OEM vulnerable information. But the same comes with a time lag. It is therefore needed to get such information directly from OEM websites and/or from other relevant websites where such vulnerable information is published almost in real time.

### Expected Outcome
An automatic script using open source tools to be developed for the OEM vulnerability information scraping and reporting. Tool should know various vulnerability information published data formats/syntax at OEM websites (both for IT and OT hardware and application) and come up with optimum solution for monitoring and reporting of such vulnerability information.

### Required Output Format
The output of the tool that will be emailed to pre-designated email id(s) should include:

- **Product Name**: Chrome
- **Product Version**: - NA
- **OEM name**: Google
- **Severity Level (Critical/High)**: High
- **Vulnerability**: The N-able PassPortal extension before 3.29.2 for Chrome inserts sensitive information into a log file.
- **Mitigation Strategy**: Install patch from https://me.n-able.com/s/security-advisory/aArHs000000M8CCKA0/cve202447131-passportal-browser-extension-logs-sensitive-data
- **Published Date**: Jan 2024
- **Unique ID**: CVE-2023-47131

## Current Implementation Status

### ✅ Completed Features

#### 1. Multi-Source Vulnerability Scanning
- CISA KEV (Known Exploited Vulnerabilities) - real-time access
- GitHub Security Advisory Database - real-time access
- OSV (Open Source Vulnerabilities) - real-time access
- NVD fallback with intelligent rate limit handling
- Support for 10+ vulnerability data sources

#### 2. OEM Equipment Detection & Monitoring
- Multi-platform system detection (Windows, Linux, macOS, Android, Python)
- Automatic OEM manufacturer identification from system information
- Hardware/software component detection with confidence scoring
- JSON-based detection result processing and integration

#### 3. Real-Time Alerting System
- Email notifications via SendGrid integration
- Configurable notification preferences and rules
- Severity-based filtering with Critical/High priority support
- Scheduled automatic monitoring with customizable intervals

#### 4. User Interface & Management
- Web-based dashboard for monitoring and configuration
- System monitoring interface with multi-platform script generation
- OEM source management and tracking
- Manual and automatic vulnerability scanning options

### 🔶 Partially Implemented Features

#### 1. Direct OEM Website Scraping Framework
- Basic FirecrawlService infrastructure exists
- Supabase edge function for OEM scraping (`test-oem-scraper`)
- Need specific OEM website parsers and real-time monitoring

#### 2. Structured Data Processing
- Basic vulnerability data structure in place
- Most required output fields are captured
- Need enhanced product version detection and mitigation extraction

## User Flow Documentation

### Current User Flow

1. **System Setup**
   - User accesses HAWK Security Platform dashboard
   - Downloads platform-specific detection script (Windows/Linux/macOS/Android/Python)
   - Runs script on target systems to detect OEM manufacturers
   - Uploads JSON results to automatically add OEM sources for monitoring

2. **Vulnerability Monitoring**
   - System continuously monitors configured vulnerability sources
   - Real-time scanning of CISA KEV, GitHub Advisory, OSV, and other free sources
   - Automatic detection of Critical and High severity vulnerabilities
   - Cross-reference with detected OEM manufacturers from user systems

3. **Alert Processing**
   - When Critical/High vulnerability is detected:
     - System checks if it affects user's detected OEM equipment
     - Processes vulnerability data to extract required fields
     - Formats alert according to specified output format
     - Sends immediate email notification to configured recipients

4. **Manual Operations**
   - Users can trigger manual vulnerability scans
   - Add/remove OEM sources manually
   - Configure notification preferences and email recipients
   - View scan history and vulnerability reports

### Target User Flow (After Full Implementation)

1. **Enhanced System Detection**
   - Automatic detection of both IT and OT equipment
   - Real-time monitoring of detected OEM manufacturer websites
   - Continuous background scanning without user intervention

2. **Direct OEM Website Monitoring**
   - Real-time scraping of manufacturer security advisories
   - Bypass NVD delays by accessing primary sources
   - Support for various OEM website formats and structures

3. **Immediate Alert Processing**
   - Sub-minute alert delivery for Critical vulnerabilities
   - Structured email format matching exact requirements
   - Enhanced mitigation strategy extraction from OEM sources

## Implementation Roadmap

### Phase 1: Direct OEM Website Scraping (HIGH PRIORITY)

#### What to Implement:
- **Real-time OEM website scrapers** for major manufacturers
- **Custom parsers** for different OEM vulnerability formats
- **Scheduled monitoring** of OEM security advisory pages
- **Enhanced data extraction** for product versions and mitigation strategies

#### How to Implement:

1. **Extend FirecrawlService for OEM-Specific Scraping**
   ```typescript
   // Add to src/services/oemScrapingService.ts
   class OEMScrapingService {
     async scrapeCiscoSecurityAdvisories(): Promise<Vulnerability[]>
     async scrapeMicrosoftSecurityUpdates(): Promise<Vulnerability[]>
     async scrapeIntelSecurityAdvisories(): Promise<Vulnerability[]>
     // ... other major OEMs
   }
   ```

2. **Create OEM-Specific Parser Components**
   ```typescript
   // src/components/OEMMonitor/parsers/
   - CiscoParser.tsx
   - MicrosoftParser.tsx
   - IntelParser.tsx
   - DellParser.tsx
   - HPParser.tsx
   ```

3. **Implement Real-Time Monitoring Edge Function**
   ```typescript
   // supabase/functions/real-time-oem-monitor/index.ts
   // Scheduled function that runs every 5-15 minutes
   // Scrapes OEM websites and compares with previous results
   // Triggers immediate alerts for new Critical/High vulnerabilities
   ```

4. **Enhanced Email Template System**
   ```typescript
   // src/services/emailTemplateService.ts
   // Format emails to match exact specification
   // Include all required fields with proper formatting
   ```

### Phase 2: OT/Industrial Equipment Focus (MEDIUM PRIORITY)

#### What to Implement:
- **OT equipment detection** (SCADA, PLC, HMI systems)
- **Industrial vulnerability sources** (ICS-CERT, vendor-specific OT advisories)
- **Critical infrastructure categorization**

#### How to Implement:

1. **Extend System Detection Scripts**
   ```bash
   # Add OT equipment detection to existing scripts
   # Detect industrial control systems, SCADA software
   # Identify critical infrastructure components
   ```

2. **OT-Specific Vulnerability Sources**
   ```typescript
   // Add to vulnerabilityDataSources.ts
   - ICS-CERT advisories
   - Schneider Electric security bulletins
   - Siemens security advisories
   - Rockwell Automation security advisories
   ```

### Phase 3: Performance & Scalability (LOW PRIORITY)

#### What to Implement:
- **Distributed scraping** for high-frequency monitoring
- **Caching mechanisms** for improved performance
- **Advanced filtering** and correlation algorithms

## Technical Implementation Details

### Required New Components:

1. **OEM Website Scrapers** (`src/services/oemScrapers/`)
   - Individual scraper classes for each major OEM
   - Standardized vulnerability extraction interface
   - Error handling and retry mechanisms

2. **Real-Time Monitoring System** (`supabase/functions/oem-monitor/`)
   - Scheduled edge function for continuous monitoring
   - Comparison logic to detect new vulnerabilities
   - Immediate notification triggers

3. **Enhanced Email Templates** (`src/templates/`)
   - Structured email formatting matching requirements
   - Dynamic content insertion from vulnerability data
   - Professional styling and branding

4. **OT Equipment Detection** (`src/components/OTMonitor/`)
   - Industrial system detection scripts
   - OT-specific vulnerability source integration
   - Critical infrastructure categorization

### Database Schema Extensions:

```sql
-- Add OEM monitoring configuration
CREATE TABLE oem_monitoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oem_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  scraping_frequency INTERVAL DEFAULT '15 minutes',
  last_scraped TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Enhanced vulnerability tracking
ALTER TABLE alerts ADD COLUMN product_version TEXT;
ALTER TABLE alerts ADD COLUMN oem_source TEXT;
ALTER TABLE alerts ADD COLUMN mitigation_url TEXT;
ALTER TABLE alerts ADD COLUMN is_ot_equipment BOOLEAN DEFAULT false;
```

## Next Steps

1. **Immediate Priority**: Implement direct OEM website scraping for top 5 manufacturers
2. **Week 1-2**: Create real-time monitoring system with 15-minute scan intervals
3. **Week 3-4**: Enhance email templates and notification system
4. **Month 2**: Add OT equipment detection and industrial vulnerability sources
5. **Month 3**: Performance optimization and scalability improvements

## Success Metrics

- **Response Time**: < 30 minutes from OEM publication to alert delivery
- **Coverage**: Monitor top 20 OEM manufacturers directly
- **Accuracy**: > 95% accurate vulnerability classification and severity assessment
- **Completeness**: All required output fields populated in > 90% of alerts

Last Updated: 2025-06-19
