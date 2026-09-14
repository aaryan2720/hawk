
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { AuthProvider } from '@/features/auth/hooks/useAuth';
import NotificationProvider from '@/features/notifications/components/NotificationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useArchitectureTracking } from '@/features/architecture/hooks/useArchitectureTracking';

// Pages
import Dashboard from '@/pages/Dashboard';
import Alerts from '@/pages/Alerts';
import SystemMonitor from '@/pages/SystemMonitor';
import Reports from '@/pages/Reports';
import VulnerabilityDetails from '@/pages/VulnerabilityDetails';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Help from '@/pages/Help';
import Landing from '@/pages/Landing';
import Login from '@/pages/auth/Login';
import SignUp from '@/pages/auth/SignUp';
import NotFound from '@/pages/NotFound';
import VerifyEmail from '@/pages/VerifyEmail';
import ChatBot from '@/pages/ChatBot'
import ScanHistory from '@/pages/ScanHistory'
import ArchitectureDashboard from '@/pages/ArchitectureDashboard';

// Create a client
const queryClient = new QueryClient();

// Component to handle architecture tracking
const AppWithTracking = () => {
  useArchitectureTracking();
  
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/alerts" element={<Alerts />} />
      <Route path="/system-monitor" element={<SystemMonitor />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/vulnerability/:id" element={<VulnerabilityDetails />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/help" element={<Help />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/chatbot" element={<ChatBot />} />
      <Route path="/scan-history" element={<ScanHistory />} />
      <Route path="/architecture" element={<ArchitectureDashboard />} />
      
      {/* Auth Routes */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<SignUp />} />
      
      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider defaultTheme="light" storageKey="hawk-security-ui-theme">
            <Router>
              <AppWithTracking />
              <Toaster />
            </Router>
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
