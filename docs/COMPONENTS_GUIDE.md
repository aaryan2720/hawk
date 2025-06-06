
# Components Guide

## Core Components Overview

### Authentication Components (`/src/components/auth/`)

#### `AuthLayout.tsx`
- Provides consistent layout for authentication pages
- Handles responsive design for login/signup forms
- Includes branding and styling

#### `LoginForm.tsx` & `SignUpForm.tsx`
- Form components for user authentication
- Integrated with Supabase authentication
- Form validation using React Hook Form + Zod
- Error handling and loading states

### UI Components (`/src/components/ui/`)

These are base components from shadcn/ui library:

#### Core UI Elements
- **`Button.tsx`** - Configurable button with variants
- **`Card.tsx`** - Container component for content sections
- **`Dialog.tsx`** - Modal dialogs and overlays
- **`Alert.tsx`** - Alert messages and notifications
- **`Badge.tsx`** - Status indicators and labels

#### Form Components
- **`Input.tsx`** - Text input fields
- **`Textarea.tsx`** - Multi-line text input
- **`Select.tsx`** - Dropdown selection
- **`Checkbox.tsx`** - Checkbox input
- **`Switch.tsx`** - Toggle switch

#### Navigation & Layout
- **`Tabs.tsx`** - Tabbed interface
- **`Accordion.tsx`** - Collapsible content sections
- **`Sheet.tsx`** - Slide-out panels
- **`Separator.tsx`** - Visual dividers

### Security & Monitoring Components

#### `MultiSourceVulnerabilityScanner.tsx`
**Purpose**: Scans multiple free vulnerability databases simultaneously
**Key Features**:
- Scans 6+ free vulnerability sources
- Progress tracking and real-time updates
- Configurable source list display (`showSourcesList` prop)
- Results aggregation and summary
- Notification system integration

**Usage**:
```tsx
<MultiSourceVulnerabilityScanner showSourcesList={false} />
```

#### `VulnerabilityScraper.tsx`
**Purpose**: Single-source vulnerability scanning interface
**Key Features**:
- Simplified scanning interface
- Uses CISA KEV as default source
- Progress indication
- Results display with severity badges
- Callback support for scan completion

#### `AlertsList.tsx`
**Purpose**: Displays and manages security alerts
**Key Features**:
- Alert filtering and sorting
- Status management
- Action buttons for alert resolution
- Real-time updates

#### `NotificationCenter.tsx`
**Purpose**: Central notification management
**Key Features**:
- Notification history
- Mark as read/unread functionality
- Notification preferences
- Real-time notification display

### AI & Chat Components (`/src/components/GeminiChat/`)

#### `GeminiChatbot.tsx`
**Purpose**: Main AI chatbot interface
**Key Features**:
- Integration with Google Gemini AI
- Chat history management
- Real-time message streaming
- Error handling and retry logic

#### Supporting Chat Components
- **`ChatInput.tsx`** - Message input interface
- **`ChatMessages.tsx`** - Message display and formatting
- **`ApiKeyErrorAlert.tsx`** - API key configuration alerts
- **`useGeminiChat.ts`** - Chat state management hook

### System Monitoring Components

#### `UserSystemMonitor.tsx`
**Purpose**: System monitoring dashboard
**Key Features**:
- System health indicators
- Resource usage monitoring
- Alert thresholds configuration
- Historical data visualization

#### OEM Monitor Components (`/src/components/OEMMonitor/`)
- **`OEMMonitorList.tsx`** - List of monitored OEM sources
- **`AddSourceDialog.tsx`** - Add new OEM monitoring source
- **`AutoDetectOEMs.tsx`** - Automatic OEM detection
- **`SourceCard.tsx`** - Individual OEM source display

### Dashboard Components

#### `DashboardNav.tsx`
**Purpose**: Main navigation component
**Key Features**:
- Responsive navigation menu
- User profile integration
- Active route highlighting
- Mobile-friendly hamburger menu

#### `StatusOverview.tsx`
**Purpose**: High-level security status display
**Key Features**:
- Security metrics summary
- Alert counters
- System health indicators
- Quick action buttons

## Component Props and APIs

### Common Props Patterns

#### Loading States
Most components accept loading state props:
```tsx
interface LoadingProps {
  isLoading?: boolean;
  loadingText?: string;
}
```

#### Callback Props
Components with actions typically include callback props:
```tsx
interface CallbackProps {
  onScanComplete?: () => void;
  onError?: (error: string) => void;
  onSuccess?: (data: any) => void;
}
```

#### Configuration Props
Many components are configurable:
```tsx
interface ConfigProps {
  showSourcesList?: boolean;
  limit?: number;
  autoRefresh?: boolean;
}
```

## Styling Conventions

### Design System Usage
All components use the design system defined in `index.css`:
- Semantic color tokens (e.g., `text-primary`, `bg-background`)
- Consistent spacing with Tailwind classes
- Responsive design with mobile-first approach

### Glass Morphism Effect
Many cards use the `glass-card` class for modern styling:
```tsx
<Card className="glass-card">
  {/* Content */}
</Card>
```

### Component Size Variants
Components follow consistent sizing:
- `sm` - Small variant
- `md` - Default variant  
- `lg` - Large variant

## Testing & Development

### Component Development Guidelines
1. Use TypeScript for all components
2. Include proper JSDoc comments
3. Follow the established prop patterns
4. Use semantic HTML elements
5. Implement proper error boundaries
6. Include loading and error states

### Accessibility
All components follow accessibility best practices:
- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- Focus management

Last Updated: 2025-06-06
