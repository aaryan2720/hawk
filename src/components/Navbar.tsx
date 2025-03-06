
import React, { useState, useEffect } from 'react';
import { Bell, Search, Shield, User, Menu, X } from 'lucide-react';
import { mockAlerts } from '../utils/mockData';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const newAlertsCount = mockAlerts.filter(alert => alert.status === 'new').length;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          <span className="text-xl font-semibold tracking-tight">SecureAlerts</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-gray-600 hover:text-primary transition-colors duration-200">Dashboard</a>
          <a href="#" className="text-gray-600 hover:text-primary transition-colors duration-200">Alerts</a>
          <a href="#" className="text-gray-600 hover:text-primary transition-colors duration-200">Systems</a>
          <a href="#" className="text-gray-600 hover:text-primary transition-colors duration-200">Reports</a>
          <a href="#" className="text-gray-600 hover:text-primary transition-colors duration-200">Settings</a>
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
          
          <button className="hidden md:block text-gray-600 hover:text-primary transition-colors duration-200">
            <User className="h-5 w-5" />
          </button>
          
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
            <a href="#" className="text-gray-600 py-2 px-4 hover:bg-gray-50 rounded-md">Dashboard</a>
            <a href="#" className="text-gray-600 py-2 px-4 hover:bg-gray-50 rounded-md">Alerts</a>
            <a href="#" className="text-gray-600 py-2 px-4 hover:bg-gray-50 rounded-md">Systems</a>
            <a href="#" className="text-gray-600 py-2 px-4 hover:bg-gray-50 rounded-md">Reports</a>
            <a href="#" className="text-gray-600 py-2 px-4 hover:bg-gray-50 rounded-md">Settings</a>
            <a href="#" className="text-gray-600 py-2 px-4 hover:bg-gray-50 rounded-md">Profile</a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
