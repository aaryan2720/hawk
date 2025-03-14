
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Shield,
  History,
  User,
  Home,
  AlertTriangle,
  Database,
  Settings,
  Menu,
  X,
  MessageCircle
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const DashboardNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U";
    const email = user.email || "";
    return email.substring(0, 2).toUpperCase();
  };

  // Check if current path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems = [
    { path: "/dashboard", icon: <Home className="h-4 w-4" />, label: "Dashboard" },
    { path: "/alerts", icon: <AlertTriangle className="h-4 w-4" />, label: "Alerts" },
    { path: "/scan-history", icon: <History className="h-4 w-4" />, label: "Scan History" },
    { path: "/system-monitor", icon: <Database className="h-4 w-4" />, label: "System Monitor" },
    { path: "/chatbot", icon: <MessageCircle className="h-4 w-4" />, label: "AI Assistant" },
    { path: "/profile", icon: <User className="h-4 w-4" />, label: "Profile" },
  ];

  return (
    <div className={`bg-white shadow-sm border-b sticky top-0 z-10 transition-all duration-300 ${
      isScrolled ? 'shadow-md' : ''
    }`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">HAWK</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button 
                key={item.path}
                variant={isActive(item.path) ? 'default' : 'ghost'} 
                size="sm"
                asChild
              >
                <Link to={item.path} className="flex items-center space-x-1">
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </Button>
            ))}
          </nav>
          
          <div className="flex items-center space-x-2">
            <Link to="/profile" className="flex items-center space-x-2">
              <Avatar className="h-9 w-9 hover:ring-2 hover:ring-blue-400 transition-all">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium hidden md:inline-block">{user?.email}</span>
            </Link>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t animate-fade-in">
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <Button 
                  key={item.path}
                  variant={isActive(item.path) ? 'default' : 'ghost'} 
                  size="sm"
                  className="justify-start"
                  asChild
                >
                  <Link 
                    to={item.path}
                    className="flex items-center space-x-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardNav;
