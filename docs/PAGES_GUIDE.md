
# Pages Guide

## Application Pages Overview

All pages are located in `/src/pages/` and correspond to application routes.

## Main Application Pages

### `Dashboard.tsx`
**Route**: `/dashboard`  
**Purpose**: Main application dashboard providing security overview

**Key Features**:
- Security status summary
- Recent alerts overview
- Quick action buttons
- System health indicators
- Navigation to other sections

**Components Used**:
- `DashboardNav` - Navigation header
- `StatusOverview` - Security metrics
- `AlertsList` - Recent alerts
- `TrendChart` - Security trends

### `Alerts.tsx`
**Route**: `/alerts`  
**Purpose**: Security alerts management and monitoring

**Key Features**:
- Multi-source vulnerability scanning
- Alert filtering and sorting
- Alert status management
- Bulk actions on alerts
- Real-time alert updates

**Components Used**:
- `MultiSourceVulnerabilityScanner` - Main scanning interface
- `AlertsList` - Alert management
- `SearchFilters` - Alert filtering

**Special Configuration**:
```tsx
<MultiSourceVulnerabilityScanner showSourcesList={false} />
```
The sources list is hidden on this page to reduce clutter.

### `Reports.tsx`
**Route**: `/reports`  
**Purpose**: Vulnerability reports and analytics

**Key Features**:
- Detailed vulnerability reports
- Analytics and trends
- Export functionality
- Historical data analysis
- Custom report generation

**Components Used**:
- `MultiSourceVulnerabilityScanner` - With full sources list
- `VulnerabilityDistribution` - Data visualization
- `TrendChart` - Historical trends
- `RiskAnalyzer` - Risk assessment

### `SystemMonitor.tsx`
**Route**: `/system-monitor`  
**Purpose**: System monitoring and OEM tracking with multi-platform detection

**Key Features**:
- **Multi-platform OEM detection** - Windows, Linux, macOS, Android, Python
- **Script generation and download** - Platform-specific detection scripts
- **Automated system discovery** - JSON-based detection result processing
- **OEM manufacturer tracking** - Monitor vulnerability sources from detected manufacturers
- **Real-time system monitoring** - Health metrics and performance monitoring
- **Manual vulnerability scanning** - Quick scan interface for immediate results

**Tab Structure**:
1. **System Monitor Tab** - `UserSystemMonitor` for system configuration
2. **OEM Sources Tab** - `OEMMonitorList` with `SystemScriptGenerator` integration
3. **Manual Scan Tab** - `VulnerabilityScraper` for immediate scanning

**Components Used**:
- `UserSystemMonitor` - Main monitoring interface
- `OEMMonitorList` - OEM tracking with embedded script generator
- `SystemScriptGenerator` - Multi-platform detection script generator
- `VulnerabilityScraper` - Simple scanning interface

**OEM Detection Workflow**:
1. User downloads platform-specific script
2. Script runs on target system and generates JSON
3. User uploads JSON file to the platform
4. System automatically extracts and adds OEM sources
5. Continuous monitoring begins for detected manufacturers

**Platform Support**:
- **Windows**: Batch scripts using WMIC commands
- **Linux/Unix**: Bash scripts with DMI and /proc parsing
- **macOS**: Terminal scripts using system_profiler
- **Android**: Termux-compatible scripts with getprop
- **Cross-platform**: Python scripts for universal compatibility

### `ChatBot.tsx`
**Route**: `/chatbot`  
**Purpose**: AI-powered security assistance

**Key Features**:
- AI chatbot interface
- Security-related Q&A
- Integration with Gemini AI
- Chat history
- Real-time responses

**Components Used**:
- `GeminiChatbot` - Main chat interface
- `NotificationProvider` - For chat notifications

### `Settings.tsx`
**Route**: `/settings`  
**Purpose**: User settings and preferences

**Key Features**:
- Notification preferences
- User profile management
- Security settings
- API key configuration
- Theme selection

**Components Used**:
- `NotificationRules` - Alert preferences
- `ProfileMenu` - User profile
- Various form components

### `Profile.tsx`
**Route**: `/profile`  
**Purpose**: User profile management

**Key Features**:
- Personal information
- Account settings
- Security preferences
- Subscription management

### `Help.tsx`
**Route**: `/help`  
**Purpose**: Help documentation and support

**Key Features**:
- FAQ section
- Documentation links
- Contact support
- Tutorial guides

## Authentication Pages (`/src/pages/auth/`)

### `Login.tsx`
**Route**: `/auth/login`  
**Purpose**: User authentication

**Key Features**:
- Email/password login
- Form validation
- Error handling
- Redirect after login

**Components Used**:
- `AuthLayout` - Authentication layout
- `LoginForm` - Login form component

### `SignUp.tsx`
**Route**: `/auth/signup`  
**Purpose**: New user registration

**Key Features**:
- User registration form
- Email verification
- Terms acceptance
- Account creation

**Components Used**:
- `AuthLayout` - Authentication layout
- `SignUpForm` - Registration form

### `VerifyEmail.tsx`
**Route**: `/auth/verify-email`  
**Purpose**: Email verification after signup

**Key Features**:
- Email verification status
- Resend verification email
- Redirect after verification

## Special Pages

### `Index.tsx`
**Route**: `/`  
**Purpose**: Application entry point

**Behavior**:
- Redirects authenticated users to dashboard
- Redirects unauthenticated users to landing page

### `Landing.tsx`
**Route**: `/landing`  
**Purpose**: Public landing page

**Key Features**:
- Product overview
- Feature highlights
- Call-to-action buttons
- Marketing content

### `ScanHistory.tsx`
**Route**: `/scan-history`  
**Purpose**: Historical scan results and analysis

**Key Features**:
- Scan history timeline
- Result comparisons
- Export capabilities
- Detailed scan reports

### `NotFound.tsx`
**Route**: `*` (catch-all)  
**Purpose**: 404 error page

**Key Features**:
- User-friendly error message
- Navigation back to main app
- Helpful links

## Page Structure Pattern

All pages follow a consistent structure:

```tsx
const PageComponent = () => {
  const { user, loading } = useAuth();
  
  // Loading state
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Authentication check
  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  // Main page content
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto py-8 px-4">
        {/* Page content */}
      </main>
    </div>
  );
};
```

## Route Protection

### Protected Routes
Most application pages require authentication:
- Dashboard
- Alerts
- Reports
- System Monitor (with OEM detection)
- Settings
- Profile
- ChatBot
- Scan History

### Public Routes
These routes are accessible without authentication:
- Landing page
- Login
- Sign up
- Email verification
- 404 page

## Navigation Flow

### Main Navigation
```
Landing → Login/SignUp → Dashboard → Other Pages
```

### System Monitor Workflow
```
System Monitor → Download Script → Run on Device → Upload Results → Auto-add OEMs
```

### Page Relationships
- **Dashboard** - Central hub linking to all other pages
- **Alerts** - Links to detailed vulnerability reports
- **Reports** - Provides detailed analysis from alerts
- **System Monitor** - Monitors systems and detects OEMs that generate alerts
- **Settings** - Configures how all other pages behave

## Responsive Design

All pages are fully responsive with:
- Mobile-first design approach
- Collapsible navigation on mobile
- Responsive grid layouts
- Touch-friendly interfaces
- Optimized for tablets and mobile devices

Last Updated: 2025-06-07
