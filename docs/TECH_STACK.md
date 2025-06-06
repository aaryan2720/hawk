
# Tech Stack Documentation

## Frontend Technologies

### Core Framework
- **React 18.3.1** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript for better development experience
- **Vite** - Fast build tool and development server

### UI Framework & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Pre-built, accessible React components
- **Lucide React** - Beautiful icon library
- **Framer Motion** - Animation library
- **React Spring** - Spring-physics based animations

### State Management & Data Fetching
- **TanStack React Query** - Server state management and caching
- **React Hook Form** - Form state management
- **React Router DOM** - Client-side routing

### UI Components Library
- **Radix UI** - Unstyled, accessible UI primitives
  - Dialog, Dropdown Menu, Popover, Toast, etc.
- **React Day Picker** - Date picker component
- **Recharts** - Chart library for data visualization
- **Sonner** - Toast notifications

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Class Variance Authority** - Conditional CSS classes
- **clsx** - Conditional className utility

## Backend Technologies

### Database & Authentication
- **Supabase** - Backend-as-a-Service platform
  - PostgreSQL database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication (email/password)
  - Edge Functions (Deno runtime)

### External Services
- **SendGrid** - Email service for notifications
- **Gemini AI** - AI chatbot integration
- **Multiple Vulnerability Sources**:
  - CISA KEV (Cybersecurity & Infrastructure Security Agency)
  - GitHub Security Advisories
  - OSV.dev (Open Source Vulnerabilities)
  - MITRE CVE database

## Key Libraries & Utilities

### Form Handling
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - Form validation resolvers

### Date & Time
- **date-fns** - Date utility library

### Styling Utilities
- **tailwind-merge** - Merge Tailwind classes
- **tailwindcss-animate** - Animation utilities
- **next-themes** - Theme switching

### Development Dependencies
- **@types/*** - TypeScript type definitions
- **Vite plugins** - Build optimization

## Browser Support

The application supports modern browsers with ES6+ support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- **Code splitting** via React Router and dynamic imports
- **Lazy loading** of components and routes
- **React Query caching** for API responses
- **Optimized bundle size** with Vite tree-shaking
- **Responsive images** and assets optimization

Last Updated: 2025-06-06
