
# Project Structure Documentation

## Root Directory Structure

```
hawk-security/
├── docs/                          # Project documentation (this folder)
├── public/                        # Static assets
├── src/                          # Source code
├── supabase/                     # Supabase configuration and functions
├── package.json                  # Dependencies and scripts
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── vite.config.ts               # Vite build configuration
```

## Source Code Structure (`src/`)

```
src/
├── components/                   # Reusable React components
│   ├── ui/                      # Base UI components (shadcn/ui)
│   ├── auth/                    # Authentication components
│   ├── notification/            # Notification system components
│   ├── AutoMonitor/            # System monitoring components
│   ├── OEMMonitor/             # OEM tracking components
│   └── GeminiChat/             # AI chatbot components
├── hooks/                       # Custom React hooks
├── pages/                       # Page components (routes)
│   └── auth/                   # Authentication pages
├── types/                       # TypeScript type definitions
├── utils/                       # Utility functions and helpers
├── services/                    # External service integrations
├── integrations/               # Third-party integrations
│   └── supabase/              # Supabase client and types
├── lib/                        # Library configurations
├── App.tsx                     # Root component
├── main.tsx                    # Application entry point
└── index.css                   # Global styles and CSS variables
```

## Key Folders Explained

### `/src/components/`
Houses all reusable React components organized by feature:

- **`ui/`** - Base components from shadcn/ui (Button, Card, Dialog, etc.)
- **`auth/`** - Login/signup forms and authentication layouts
- **`notification/`** - Alert preferences, notification center, debug panels
- **`AutoMonitor/`** - System monitoring and auto-detection features
- **`OEMMonitor/`** - OEM source management and monitoring
- **`GeminiChat/`** - AI chatbot interface and logic

### `/src/pages/`
Page-level components that correspond to routes:
- `Dashboard.tsx` - Main dashboard overview
- `Alerts.tsx` - Security alerts management
- `Reports.tsx` - Vulnerability reports and analytics
- `Settings.tsx` - User settings and preferences
- `SystemMonitor.tsx` - System monitoring interface
- `ChatBot.tsx` - AI chatbot page

### `/src/hooks/`
Custom React hooks for shared logic:
- `useAuth.tsx` - Authentication state management
- `use-toast.ts` - Toast notification hook
- `use-mobile.tsx` - Mobile device detection

### `/src/utils/`
Utility functions and helper modules:
- `vulnerabilityDataSources.ts` - Free vulnerability data sources configuration
- `securityUtils.ts` - Security-related utility functions
- `formatters.ts` - Data formatting helpers
- `mockData.ts` - Mock data for development

### `/src/services/`
External service integrations:
- `oemService.ts` - OEM manufacturer service integration

## Supabase Backend Structure (`supabase/`)

```
supabase/
├── functions/                   # Edge functions (serverless)
│   ├── scrape-vulnerabilities/ # Vulnerability scanning logic
│   ├── send-notifications/     # Notification system
│   ├── gemini-chat/           # AI chatbot backend
│   ├── auto-monitor/          # System monitoring
│   └── real-time-scraper/     # Real-time vulnerability scanning
└── config.toml                # Supabase configuration
```

## Configuration Files

- **`vite.config.ts`** - Vite build configuration, aliases, and plugins
- **`tailwind.config.ts`** - Tailwind CSS theme and component configuration
- **`tsconfig.json`** - TypeScript compiler options and path mapping
- **`package.json`** - Project dependencies, scripts, and metadata

## File Naming Conventions

- **Components**: PascalCase (e.g., `AlertsList.tsx`, `DashboardNav.tsx`)
- **Pages**: PascalCase (e.g., `Dashboard.tsx`, `Settings.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.tsx`)
- **Utils**: camelCase (e.g., `formatters.ts`, `securityUtils.ts`)
- **Types**: camelCase (e.g., `index.ts`)

## Import Structure

The project uses path mapping with `@/` prefix for clean imports:
```typescript
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
```

## Asset Organization

- **`public/`** - Static assets (favicons, images, etc.)
- **Component-specific assets** - Co-located with components when applicable

Last Updated: 2025-06-06
