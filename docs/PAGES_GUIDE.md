
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
**Purpose**: System monitoring and OEM tracking

**Key Features**:
- System health monitoring
- OEM manufacturer tracking
- Auto-detection of systems
- Resource usage monitoring
- Alert configuration

**Components Used**:
- `UserSystemMonitor` - Main monitoring interface
- `OEMMonitorList` - OEM tracking
- `AutoDetectOEMs` - Auto-detection
- `VulnerabilityScraper` - Simple scanning

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
- System Monitor
- Settings
- Profile
- ChatBot

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

### Page Relationships
- **Dashboard** - Central hub linking to all other pages
- **Alerts** - Links to detailed vulnerability reports
- **Reports** - Provides detailed analysis from alerts
- **System Monitor** - Monitors systems that generate alerts
- **Settings** - Configures how all other pages behave

## Responsive Design

All pages are fully responsive with:
- Mobile-first design approach
- Collapsible navigation on mobile
- Responsive grid layouts
- Touch-friendly interfaces
- Optimized for tablets and mobile devices

Last Updated: 2025-06-06
