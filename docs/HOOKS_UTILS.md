
# Hooks and Utilities Guide

## Custom Hooks (`/src/hooks/`)

### `useAuth.tsx`
**Purpose**: Manages authentication state across the application

**Features**:
- User session management
- Authentication state tracking
- Sign out functionality
- Loading states
- Context provider for global auth state

**Usage**:
```tsx
const { user, loading, session, signOut } = useAuth();

if (loading) return <Loading />;
if (!user) return <Navigate to="/auth/login" />;
```

**Context Provider**:
```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

### `use-toast.ts`
**Purpose**: Toast notification management

**Features**:
- Success, error, and info notifications
- Auto-dismiss functionality
- Customizable duration
- Queue management

**Usage**:
```tsx
import { toast } from "@/hooks/use-toast";

// Success toast
toast.success("Operation completed");

// Error toast
toast.error("Something went wrong");

// Custom toast
toast({
  title: "Custom Title",
  description: "Custom message",
  variant: "destructive"
});
```

### `use-mobile.tsx`
**Purpose**: Mobile device detection hook

**Features**:
- Responsive breakpoint detection
- Window resize listener
- Mobile-specific UI adaptations

**Usage**:
```tsx
const isMobile = useIsMobile();

return (
  <div className={isMobile ? "mobile-layout" : "desktop-layout"}>
    {/* Content */}
  </div>
);
```

## Utility Functions (`/src/utils/`)

### `vulnerabilityDataSources.ts`
**Purpose**: Configuration for free vulnerability data sources

**Features**:
- List of free vulnerability databases
- Source metadata (name, description, type)
- Source filtering functions

**Key Functions**:
```tsx
// Get all free sources
const freeSources = getFreeSources();

// Get specific source
const cisaSource = getSourceById('cisa-kev');
```

**Available Sources**:
- CISA KEV (Cybersecurity & Infrastructure Security Agency)
- GitHub Security Advisories
- OSV.dev (Open Source Vulnerabilities)
- MITRE CVE Database
- Debian Security Tracker
- Ubuntu Security Notices

### `securityUtils.ts`
**Purpose**: Security-related utility functions

**Common Functions**:
- Vulnerability severity calculation
- Risk assessment algorithms
- Security score computation
- Threat level determination

### `formatters.ts`
**Purpose**: Data formatting utilities

**Common Functions**:
```tsx
// Date formatting
formatDate(date: string): string

// Number formatting
formatNumber(num: number): string

// Severity formatting
formatSeverity(severity: string): string
```

### `mockData.ts`
**Purpose**: Mock data for development and testing

**Features**:
- Sample vulnerability data
- Test user data
- Mock API responses
- Development seed data

### `solutionTemplates.ts`
**Purpose**: Pre-defined solution templates for vulnerabilities

**Features**:
- Common vulnerability solutions
- Step-by-step remediation guides
- Template customization
- Solution categorization

## Service Integrations (`/src/services/`)

### `oemService.ts`
**Purpose**: OEM (Original Equipment Manufacturer) service integration

**Features**:
- OEM manufacturer detection
- Hardware information retrieval
- Vendor-specific vulnerability checking
- System identification

**Key Functions**:
```tsx
// Detect system OEM
detectOEM(): Promise<OEMInfo>

// Get OEM vulnerabilities
getOEMVulnerabilities(oem: string): Promise<Vulnerability[]>
```

## Third-Party Integrations (`/src/integrations/`)

### Supabase Integration (`/src/integrations/supabase/`)

#### `client.ts`
**Purpose**: Supabase client configuration

**Features**:
- Database connection
- Authentication integration
- Real-time subscriptions
- Edge function calls

**Usage**:
```tsx
import { supabase } from '@/integrations/supabase/client';

// Database query
const { data, error } = await supabase
  .from('alerts')
  .select('*');

// Function call
const { data } = await supabase.functions.invoke('function-name');
```

#### `types.ts`
**Purpose**: TypeScript types for Supabase entities

**Features**:
- Database table types
- Function parameter types
- Response type definitions
- Type safety for queries

## Utility Libraries Configuration (`/src/lib/`)

### `utils.ts`
**Purpose**: Common utility functions and class name management

**Key Functions**:
```tsx
// Conditional class names
cn("base-class", condition && "conditional-class")

// Merge Tailwind classes
cn("p-4", "p-6") // Results in "p-6"
```

## Development Utilities

### Error Handling Patterns

**Toast Notifications**:
```tsx
try {
  await apiCall();
  toast.success("Success message");
} catch (error) {
  toast.error("Error message");
}
```

**Loading States**:
```tsx
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await action();
  } finally {
    setLoading(false);
  }
};
```

### Data Fetching Patterns

**TanStack Query Usage**:
```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['vulnerabilities'],
  queryFn: fetchVulnerabilities,
});
```

**Supabase Queries**:
```tsx
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', 'value');
```

## Performance Utilities

### Debouncing
```tsx
import { useMemo } from 'react';
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce(search, 300),
  [search]
);
```

### Memoization
```tsx
const memoizedValue = useMemo(() => 
  expensiveCalculation(data), 
  [data]
);
```

## Testing Utilities

### Mock Functions
```tsx
// Mock API responses
const mockApiResponse = {
  data: mockData,
  status: 200,
  success: true
};
```

### Test Helpers
```tsx
// Component testing utilities
const renderWithProviders = (component) => {
  return render(
    <AuthProvider>
      <QueryProvider>
        {component}
      </QueryProvider>
    </AuthProvider>
  );
};
```

## Best Practices

### Hook Usage
1. Always handle loading states
2. Implement proper error handling
3. Clean up subscriptions and timers
4. Use TypeScript for better type safety

### Utility Functions
1. Keep functions pure when possible
2. Add proper JSDoc comments
3. Include error handling
4. Write unit tests for complex logic

### Performance
1. Use React.memo for expensive components
2. Implement proper dependency arrays
3. Debounce expensive operations
4. Cache API responses with React Query

Last Updated: 2025-06-06
