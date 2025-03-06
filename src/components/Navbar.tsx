
import React, { useState, useEffect } from 'react';
import { Bell, Search, Shield, User, Menu, X, Settings, HelpCircle, LogOut } from 'lucide-react';
import { mockAlerts } from '../utils/mockData';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const newAlertsCount = mockAlerts.filter(alert => alert.status === 'new').length;

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

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-3 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-md' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold tracking-tight">HAWK</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <a href="/" className="text-gray-600 hover:text-primary transition-colors duration-200">Dashboard</a>
          <a href="#alerts" className="text-gray-600 hover:text-primary transition-colors duration-200">Alerts</a>
          <a href="#systems" className="text-gray-600 hover:text-primary transition-colors duration-200">Systems</a>
          <a href="#reports" className="text-gray-600 hover:text-primary transition-colors duration-200">Reports</a>
          <a href="#settings" className="text-gray-600 hover:text-primary transition-colors duration-200">Settings</a>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-gray-600 hover:text-primary transition-colors duration-200">
            <Search className="h-5 w-5" />
          </button>
          
          <button className="text-gray-600 hover:text-primary transition-colors duration-200 relative">
            <Bell className="h-5 w-5" />
            {newAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-alert-critical text-[10px] font-bold text-white">
                {newAlertsCount}
              </span>
            )}
          </button>
          
          <div className="relative">
            <button 
              className="hidden md:flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors duration-200"
              onClick={handleProfileClick}
            >
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <span className="hidden lg:block text-sm">Admin User</span>
            </button>
            
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 animate-fade-in">
                <a href="#profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </a>
                <a href="#settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </a>
                <a href="#help" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help & Support
                </a>
                <div className="border-t border-gray-100 my-1"></div>
                <a href="#logout" className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </a>
              </div>
            )}
          </div>
          
          <button 
            className="md:hidden text-gray-600 hover:text-primary transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg animate-slide-down">
          <div className="flex flex-col p-4 space-y-3">
            <a href="/" className="text-gray-600 py-2 px-4 hover:bg-gray-50 rounded-md">Dashboard</a>
            <a href="#alerts" className="text-gray-600 py-2 px-4 hover:bg-gray-50 rounded-md">Alerts</a>
            <a href="#systems" className="text-gray-600 py-2 px-4 hover:bg-gray-50 rounded-md">Systems</a>
            <a href="#reports" className="text-gray-600 py-2 px-4 hover:bg-gray-50 rounded-md">Reports</a>
            <a href="#settings" className="text-gray-600 py-2 px-4 hover:bg-gray-50 rounded-md">Settings</a>
            <a href="#profile" className="text-gray-600 py-2 px-4 hover:bg-gray-50 rounded-md">Profile</a>
            <a href="#logout" className="text-red-600 py-2 px-4 hover:bg-gray-50 rounded-md">Logout</a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
