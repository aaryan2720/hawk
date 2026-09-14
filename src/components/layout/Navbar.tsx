
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Search, Shield, User, Menu, X, Settings, HelpCircle, LogOut, Zap } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Successfully logged out');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to log out');
    }
  };

  const userEmail = user?.email;
  const userData = user?.user_metadata;
  const fullName = userData?.full_name || 'User';
  const organization = userData?.organization;

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-3 transition-all duration-500 ${
        isScrolled 
          ? 'glass-effect shadow-xl backdrop-blur-xl border-b border-white/20' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3 group">
          <div className="relative">
            <Shield className="h-10 w-10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <Link to={user ? "/dashboard" : "/"} className="text-2xl font-bold gradient-text tracking-tight hover:scale-105 transition-transform duration-300">
            HAWK Security
          </Link>
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            <Zap className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
        
        {user ? (
          <>
            <div className="hidden md:flex items-center space-x-8">
              {[
                { to: "/dashboard", label: "Dashboard" },
                { to: "/alerts", label: "Alerts" },
                { to: "/system-monitor", label: "Systems" },
                { to: "/reports", label: "Reports" },
                { to: "/settings", label: "Settings" }
              ].map((item) => (
                <Link 
                  key={item.to}
                  to={item.to} 
                  className="relative text-gray-700 hover:text-primary transition-all duration-300 font-medium group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-primary transition-all duration-300 hover:bg-blue-50 rounded-lg group">
                <Search className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              </button>
              
              <button className="relative p-2 text-gray-600 hover:text-primary transition-all duration-300 hover:bg-blue-50 rounded-lg group">
                <Bell className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-[10px] font-bold text-white animate-pulse">
                  3
                </span>
              </button>
              
              <div className="relative">
                <button 
                  className="hidden md:flex items-center space-x-3 p-2 text-gray-600 hover:text-primary transition-all duration-300 hover:bg-blue-50 rounded-xl group"
                  onClick={handleProfileClick}
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="hidden lg:block text-sm font-medium">{fullName}</span>
                </button>
                
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-72 glass-effect rounded-2xl shadow-2xl py-2 z-50 animate-scale-in border border-white/30">
                    <div className="px-6 py-4 border-b border-white/20">
                      <p className="text-sm font-semibold text-gray-800">{fullName}</p>
                      <p className="text-xs text-gray-600">{userEmail}</p>
                      {organization && (
                        <p className="text-xs text-blue-600 mt-1 font-medium">Organization: {organization}</p>
                      )}
                    </div>
                    {[
                      { to: "/profile", icon: User, label: "Profile" },
                      { to: "/settings", icon: Settings, label: "Settings" },
                      { to: "/help", icon: HelpCircle, label: "Help & Support" }
                    ].map((item) => (
                      <Link 
                        key={item.to}
                        to={item.to} 
                        className="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200 group"
                      >
                        <item.icon className="h-4 w-4 mr-3 text-gray-500 group-hover:text-blue-600" />
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-white/20 my-2"></div>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 group"
                    >
                      <LogOut className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                className="md:hidden p-2 text-gray-600 hover:text-primary transition-colors duration-200 hover:bg-blue-50 rounded-lg"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center space-x-4">
            <Link to="/auth/login" className="text-gray-600 hover:text-primary transition-colors duration-200 font-medium">
              Login
            </Link>
            <Link to="/auth/signup">
              <Button className="btn-primary">Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Enhanced Mobile Menu */}
      {isMobileMenuOpen && user && (
        <div className="md:hidden absolute top-full left-0 right-0 glass-effect shadow-2xl animate-slide-down border-t border-white/20">
          <div className="flex flex-col p-6 space-y-4">
            {[
              { to: "/dashboard", label: "Dashboard" },
              { to: "/alerts", label: "Alerts" },
              { to: "/system-monitor", label: "Systems" },
              { to: "/reports", label: "Reports" },
              { to: "/settings", label: "Settings" },
              { to: "/profile", label: "Profile" },
              { to: "/help", label: "Help & Support" }
            ].map((item) => (
              <Link 
                key={item.to}
                to={item.to} 
                className="text-gray-700 py-3 px-4 hover:bg-blue-50 rounded-xl transition-all duration-200 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button 
              onClick={handleLogout}
              className="text-left text-red-600 py-3 px-4 hover:bg-red-50 rounded-xl transition-colors duration-200 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
