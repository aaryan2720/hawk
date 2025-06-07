
# Getting Started Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- **Supabase CLI** (optional, for backend development) - [Install guide](https://supabase.com/docs/guides/cli)

## Initial Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd hawk-security-platform
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# External API Keys (optional)
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 4. Start Development Server
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:8080`

## Project Architecture Overview

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **TanStack Query** for data fetching

### Backend Stack
- **Supabase** for database and authentication
- **Edge Functions** for serverless backend logic
- **PostgreSQL** database with Row Level Security
- **Real-time subscriptions** for live updates

## Development Workflow

### 1. Understanding the File Structure
```
src/
├── components/     # Reusable UI components
│   ├── OEMMonitor/ # OEM detection and monitoring
│   ├── AutoMonitor/ # System monitoring
│   └── ui/         # Base UI components
├── pages/         # Page components (routes)
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── services/      # External service integrations
└── integrations/  # Third-party integrations
```

### 2. Key Features Overview

#### Multi-Platform OEM Detection
The system includes comprehensive OEM detection capabilities:

**SystemScriptGenerator Component** (`/src/components/OEMMonitor/SystemScriptGenerator.tsx`):
- Generates platform-specific detection scripts
- Supports Windows, Linux, macOS, Android, and Python
- Creates consistent JSON output format
- Handles script downloads and result uploads

**Detection Workflow**:
1. Navigate to System Monitor page
2. Download platform-specific script
3. Run script on target system
4. Upload generated JSON file
5. System automatically adds detected OEM sources

#### Supported Platforms
- **Windows (.bat)**: Uses WMIC commands for hardware detection
- **Linux/Unix (.sh)**: Parses DMI information and /proc/cpuinfo
- **macOS (.sh)**: Integrates with system_profiler
- **Android Termux (.sh)**: Uses getprop for device information
- **Python (.py)**: Cross-platform detection with Python 3.x

### 3. Adding New Features

#### Creating a New Component
```bash
# Create component file
touch src/components/NewComponent.tsx
```

```tsx
// src/components/NewComponent.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NewComponentProps {
  title: string;
  // Add other props here
}

const NewComponent: React.FC<NewComponentProps> = ({ title }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
};

export default NewComponent;
```

#### Adding a New Page
```tsx
// src/pages/NewPage.tsx
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DashboardNav from '@/components/DashboardNav';

const NewPage = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">New Page</h1>
        {/* Page content */}
      </main>
    </div>
  );
};

export default NewPage;
```

### 4. Database Operations

#### Fetching Data
```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const useAlerts = (userId: string) => {
  return useQuery({
    queryKey: ['alerts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};
```

#### Inserting Data
```tsx
const createAlert = async (alertData: any) => {
  const { data, error } = await supabase
    .from('alerts')
    .insert(alertData)
    .select();
  
  if (error) throw error;
  return data;
};
```

### 5. Working with OEM Detection

#### Using the SystemScriptGenerator
```tsx
import SystemScriptGenerator from '@/components/OEMMonitor/SystemScriptGenerator';

const MyComponent = () => {
  const handleDetectionComplete = () => {
    // Handle successful OEM detection
    console.log('OEM detection completed');
  };

  return (
    <SystemScriptGenerator onDetectionComplete={handleDetectionComplete} />
  );
};
```

#### Processing Detection Results
The SystemScriptGenerator automatically handles:
- Script generation for multiple platforms
- File downloads with appropriate extensions
- JSON result processing and validation
- OEM source creation and integration

### 6. Adding UI Components

#### Using Existing Components
```tsx
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// In your component
<Button variant="default" size="lg">
  Click me
</Button>

<Alert>
  <AlertDescription>
    This is an alert message
  </AlertDescription>
</Alert>

<Badge variant="destructive">High Severity</Badge>
```

#### Styling Guidelines
- Use semantic color tokens: `text-primary`, `bg-background`, `border-border`
- Use responsive classes: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Follow the established design system in `src/index.css`

## Common Development Tasks

### 1. Adding a New Vulnerability Source

#### Update Data Sources
```tsx
// src/utils/vulnerabilityDataSources.ts
export const vulnerabilitySources: VulnerabilitySource[] = [
  // ... existing sources
  {
    id: 'new-source',
    name: 'New Vulnerability Source',
    description: 'Description of the new source',
    type: 'free',
    url: 'https://api.newsource.com',
    format: 'json'
  }
];
```

#### Update Backend Function
```typescript
// supabase/functions/scrape-vulnerabilities/parsers.ts
export const parseNewSource = (data: any): Vulnerability[] => {
  // Parse the new source data
  return data.map(item => ({
    cve: item.cve_id,
    title: item.title,
    description: item.description,
    severity: mapSeverity(item.severity),
    // ... other fields
  }));
};
```

### 2. Extending OEM Detection

#### Adding New Platform Support
To add support for a new platform in SystemScriptGenerator:

1. Add new script type to the `scriptTypes` array
2. Implement platform-specific script generation function
3. Add platform handling in the `generateScript` function
4. Include platform-specific instructions

```tsx
// Example for new platform
const generateNewPlatformScript = (): string => {
  return `#!/bin/bash
# New platform detection script
echo "Detecting OEMs on new platform..."
# Platform-specific detection logic
`;
};
```

### 3. Adding Real-time Features

#### Subscribe to Database Changes
```tsx
useEffect(() => {
  const subscription = supabase
    .channel('alerts-channel')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'alerts',
      filter: `user_id=eq.${user.id}`
    }, (payload) => {
      setAlerts(prev => [...prev, payload.new]);
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [user.id]);
```

### 4. Error Handling Patterns

#### Component Error Boundaries
```tsx
import { toast } from 'sonner';

const handleError = (error: Error) => {
  console.error('Component error:', error);
  toast.error('Something went wrong. Please try again.');
};

try {
  // Risky operation
} catch (error) {
  handleError(error as Error);
}
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests
```tsx
// src/components/__tests__/NewComponent.test.tsx
import { render, screen } from '@testing-library/react';
import NewComponent from '../NewComponent';

describe('NewComponent', () => {
  it('renders correctly', () => {
    render(<NewComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
```

## Building and Deployment

### Building for Production
```bash
npm run build
# or
yarn build
```

### Preview Production Build
```bash
npm run preview
# or
yarn preview
```

### Deployment Options

#### 1. Lovable Platform (Recommended)
- Click the "Publish" button in the Lovable interface
- Automatic deployment and hosting
- Custom domain support available

#### 2. Manual Deployment
```bash
# Build the project
npm run build

# Deploy the `dist` folder to your hosting provider
# (Netlify, Vercel, AWS S3, etc.)
```

## Troubleshooting

### Common Issues

#### 1. Dependencies Not Installing
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. TypeScript Errors
- Check that all imports are correct
- Ensure TypeScript types are properly defined
- Run `npm run type-check` to identify issues

#### 3. Supabase Connection Issues
- Verify environment variables are set correctly
- Check Supabase project status
- Ensure database is accessible

#### 4. OEM Detection Script Issues
- Verify script has correct file extension
- Check platform-specific requirements (e.g., Termux for Android)
- Ensure JSON output format is correct
- Test script manually before uploading results

#### 5. Build Errors
```bash
# Check for linting errors
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Getting Help

1. **Documentation**: Check the relevant documentation files
2. **Console Logs**: Check browser console for errors
3. **Network Tab**: Check API calls and responses
4. **Supabase Dashboard**: Monitor database and function logs
5. **GitHub Issues**: Search for similar issues in the repository

## Next Steps

1. **Explore the Codebase**: Familiarize yourself with existing components
2. **Read Documentation**: Review all documentation files in `/docs`
3. **Set Up Supabase**: Connect to the backend if not already done
4. **Configure Environment**: Set up all required environment variables
5. **Test OEM Detection**: Try the multi-platform detection scripts
6. **Start Developing**: Begin with small changes and gradually work on larger features

## Best Practices

### Code Quality
- Follow TypeScript best practices
- Write descriptive component and function names
- Add proper JSDoc comments for complex logic
- Keep components small and focused

### Performance
- Use React.memo for expensive components
- Implement proper loading states
- Optimize database queries
- Use React Query for efficient data fetching

### Security
- Never expose sensitive data in client-side code
- Validate all user inputs
- Use Supabase RLS for data security
- Keep API keys secure

### Collaboration
- Write clear commit messages
- Create focused pull requests
- Document breaking changes
- Keep the documentation updated

Last Updated: 2025-06-07
