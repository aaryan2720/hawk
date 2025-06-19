
# HAWK Security Platform Documentation

Welcome to the HAWK Security Platform documentation! This folder contains comprehensive documentation to help you understand the project structure, tech stack, and how everything works together.

## Documentation Structure

- [Problem Statement & Roadmap](./PROBLEM_STATEMENT.md) - **NEW** - Complete problem statement and implementation roadmap
- [Tech Stack](./TECH_STACK.md) - Technologies and libraries used
- [Project Structure](./PROJECT_STRUCTURE.md) - Complete file and folder organization
- [Components Guide](./COMPONENTS_GUIDE.md) - Detailed explanation of React components
- [Pages Guide](./PAGES_GUIDE.md) - Description of all application pages
- [Hooks and Utils](./HOOKS_UTILS.md) - Custom hooks and utility functions
- [Backend Integration](./BACKEND_INTEGRATION.md) - Supabase functions and database
- [Getting Started](./GETTING_STARTED.md) - How to set up and run the project

## Quick Overview

HAWK Security is a comprehensive security monitoring and vulnerability management platform designed specifically for Critical Sector Organizations to identify, track, and remediate security vulnerabilities across their IT and OT systems in real-time.

### Core Mission
Monitor OEM vulnerability information published at equipment websites and other relevant web platforms, providing immediate alerts for Critical and High severity vulnerabilities to bypass NVD delays and ensure fastest possible response times.

### Key Features
- **Real-time OEM website monitoring** - Direct scraping of manufacturer security advisories
- **Multi-platform system detection** - Automatic identification of IT/OT equipment manufacturers
- **Immediate vulnerability alerts** - Sub-30 minute notification delivery for critical vulnerabilities
- **Structured reporting format** - Standardized email alerts with complete vulnerability details
- **Multi-source intelligence** - Integration with CISA KEV, GitHub Advisory, OSV, and direct OEM sources

### Target Users
- Critical Sector Organizations (Energy, Transportation, Healthcare, Finance)
- IT/OT Security Teams
- Infrastructure Protection Teams
- Vulnerability Management Teams

### Architecture
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Monitoring**: Real-time web scraping + scheduled vulnerability scanning
- **Notifications**: Email, SMS, and in-app notifications with configurable severity thresholds

## Problem Statement Summary

The platform addresses the critical need for real-time vulnerability monitoring in Critical Sector Organizations by:

1. **Eliminating NVD Delays**: Direct monitoring of OEM websites bypasses National Vulnerability Database delays
2. **Comprehensive Coverage**: Monitoring both IT and OT equipment vulnerabilities from manufacturer sources
3. **Immediate Alerting**: Automated email notifications within minutes of vulnerability publication
4. **Structured Reporting**: Standardized vulnerability reports with all required fields for organizational response

## Implementation Status

✅ **Completed**: Multi-source vulnerability scanning, system detection, email alerting
🔶 **In Progress**: Direct OEM website scraping framework  
❌ **Planned**: Real-time OEM monitoring, OT equipment focus, enhanced reporting format

For detailed implementation roadmap, see [Problem Statement & Roadmap](./PROBLEM_STATEMENT.md).

## Getting Help

If you need help understanding any part of the codebase:
1. Check the [Problem Statement](./PROBLEM_STATEMENT.md) for context and roadmap
2. Review the relevant documentation file for technical details
3. Look at the component's JSDoc comments
4. Review the related test files (if available)
5. Ask questions about specific functionality

Last Updated: 2025-06-19
