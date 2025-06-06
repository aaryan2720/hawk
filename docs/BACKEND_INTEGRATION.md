
# Backend Integration Guide

## Supabase Backend Overview

The application uses Supabase as the backend-as-a-service platform, providing:
- PostgreSQL database with real-time subscriptions
- Authentication and user management
- Edge Functions (serverless functions)
- Row Level Security (RLS)
- File storage capabilities

## Edge Functions (`/supabase/functions/`)

### `scrape-vulnerabilities/`
**Purpose**: Core vulnerability scanning and data collection

**Files**:
- `index.ts` - Main function entry point
- `parsers.ts` - Data parsing logic for different sources
- `utils.ts` - Utility functions for scraping
- `types.ts` - TypeScript type definitions

**Key Features**:
- Multi-source vulnerability scanning
- Data parsing and normalization
- Database storage with deduplication
- Notification triggering
- Rate limiting and error handling

**Function Parameters**:
```typescript
{
  source: string;        // Source identifier (e.g., 'cisa-kev')
  limit?: number;        // Maximum vulnerabilities to fetch
  sendNotifications?: boolean;  // Whether to send notifications
  userId?: string;       // User ID for personalized scanning
  multiSource?: boolean; // Multi-source scan indicator
}
```

**Response**:
```typescript
{
  count: number;         // Number of vulnerabilities found
  vulnerabilities: Vulnerability[]; // Array of vulnerability objects
  success: boolean;      // Operation success status
}
```

### `send-notifications/`
**Purpose**: Notification system for alerts and updates

**Files**:
- `index.ts` - Main notification router
- `email-service.ts` - Email notification handling
- `sms-service.ts` - SMS notification handling
- `notification-handlers.ts` - Different notification types
- `types.ts` - Notification type definitions

**Notification Types**:
- Vulnerability scan results
- Critical security alerts
- System monitoring alerts
- User verification emails
- Test notifications

**Email Integration**:
- SendGrid API for email delivery
- HTML email templates
- Personalized content
- Delivery tracking

### `gemini-chat/`
**Purpose**: AI chatbot backend integration

**Features**:
- Google Gemini AI integration
- Chat history management
- Context-aware responses
- Security-focused AI assistance
- Rate limiting and usage tracking

**Function Parameters**:
```typescript
{
  message: string;       // User message
  chatHistory?: Message[]; // Previous conversation
  userId?: string;       // User ID for personalization
}
```

### `auto-monitor/`
**Purpose**: Automated system monitoring and detection

**Features**:
- System auto-discovery
- OEM manufacturer detection
- Continuous monitoring setup
- Alert threshold configuration
- Performance metrics collection

### `real-time-scraper/`
**Purpose**: Real-time vulnerability monitoring

**Features**:
- Continuous vulnerability scanning
- Real-time alert generation
- Background job processing
- Webhook notifications
- Status monitoring

## Database Schema

### Core Tables

#### `alerts`
```sql
- id (uuid, primary key)
- title (text)
- description (text)
- severity (text) -- critical, high, medium, low
- status (text) -- active, resolved, investigating
- created_at (timestamp)
- updated_at (timestamp)
- user_id (uuid, foreign key)
- source (text) -- vulnerability source
- cve (text) -- CVE identifier
- system (text) -- affected system
- mitigation (text) -- remediation steps
```

#### `user_notifications`
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- type (text) -- email, sms, push
- title (text)
- message (text)
- read (boolean)
- created_at (timestamp)
- metadata (jsonb) -- additional data
```

#### `scan_history`
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- source (text)
- scan_type (text) -- manual, auto, scheduled
- vulnerabilities_found (integer)
- status (text) -- completed, failed, in_progress
- started_at (timestamp)
- completed_at (timestamp)
- metadata (jsonb)
```

#### `notification_preferences`
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- email_enabled (boolean)
- sms_enabled (boolean)
- push_enabled (boolean)
- severity_threshold (text)
- frequency (text) -- immediate, daily, weekly
- created_at (timestamp)
- updated_at (timestamp)
```

### Row Level Security (RLS)

All tables implement RLS to ensure data isolation:

```sql
-- Users can only access their own data
CREATE POLICY "Users can view own alerts" ON alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts" ON alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Authentication Integration

### Supabase Auth Features
- Email/password authentication
- Email verification
- Password reset functionality
- Session management
- JWT token handling

### Frontend Integration
```tsx
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

## Real-time Subscriptions

### Alert Subscriptions
```tsx
// Subscribe to new alerts
const subscription = supabase
  .channel('alerts-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'alerts',
    filter: `user_id=eq.${user.id}`
  }, (payload) => {
    // Handle new alert
    setAlerts(prev => [...prev, payload.new]);
  })
  .subscribe();
```

### Notification Subscriptions
```tsx
// Subscribe to notifications
const notificationSubscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'user_notifications',
    filter: `user_id=eq.${user.id}`
  }, handleNotificationChange)
  .subscribe();
```

## API Integration Patterns

### Function Invocation
```tsx
// Call edge function
const { data, error } = await supabase.functions.invoke('scrape-vulnerabilities', {
  body: {
    source: 'cisa-kev',
    limit: 10,
    sendNotifications: true,
    userId: user.id
  }
});
```

### Database Operations
```tsx
// Fetch data
const { data: alerts, error } = await supabase
  .from('alerts')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

// Insert data
const { data, error } = await supabase
  .from('alerts')
  .insert({
    title: 'New Alert',
    severity: 'high',
    user_id: user.id
  });

// Update data
const { error } = await supabase
  .from('alerts')
  .update({ status: 'resolved' })
  .eq('id', alertId);
```

## Error Handling

### Function Error Handling
```tsx
try {
  const { data, error } = await supabase.functions.invoke('function-name');
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
} catch (error) {
  console.error('Function call failed:', error);
  toast.error('Operation failed. Please try again.');
}
```

### Database Error Handling
```tsx
const { data, error } = await supabase
  .from('table')
  .select('*');

if (error) {
  console.error('Database error:', error);
  // Handle specific error types
  if (error.code === 'PGRST116') {
    // No rows returned
  }
}
```

## Security Considerations

### API Security
- All functions require authentication
- Input validation and sanitization
- Rate limiting implementation
- SQL injection protection

### Data Security
- Row Level Security (RLS) on all tables
- Encrypted data transmission
- Secure API key management
- User data isolation

## Environment Variables

### Required Environment Variables
```bash
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# External APIs
SENDGRID_API_KEY=your-sendgrid-key
GEMINI_API_KEY=your-gemini-key
```

### Function Environment Setup
Environment variables are managed through Supabase dashboard:
- Project Settings → Functions → Environment Variables
- Variables are automatically available in all functions
- Secrets are encrypted and secure

## Monitoring and Debugging

### Function Logs
```bash
# View function logs
supabase functions logs --function-name scrape-vulnerabilities

# Stream real-time logs
supabase functions logs --function-name scrape-vulnerabilities --follow
```

### Database Monitoring
- Query performance monitoring
- Connection pooling
- Resource usage tracking
- Error rate monitoring

## Deployment

### Function Deployment
```bash
# Deploy single function
supabase functions deploy scrape-vulnerabilities

# Deploy all functions
supabase functions deploy
```

### Database Migrations
```bash
# Create migration
supabase migration new add_new_table

# Apply migrations
supabase db push
```

Last Updated: 2025-06-06
