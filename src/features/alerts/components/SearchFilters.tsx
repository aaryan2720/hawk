
import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, ChevronDown, X, Clock, AlertTriangle, Check, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: { severity: string[]; status: string[] }) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch, onFilterChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const filtersRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  const handleSeverityChange = (severity: string) => {
    setSelectedSeverities(prev => {
      const newSeverities = prev.includes(severity) 
        ? prev.filter(s => s !== severity) 
        : [...prev, severity];
      
      onFilterChange({ severity: newSeverities, status: selectedStatuses });
      return newSeverities;
    });
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatuses(prev => {
      const newStatuses = prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status];
      
      onFilterChange({ severity: selectedSeverities, status: newStatuses });
      return newStatuses;
    });
  };
  
  const clearAllFilters = () => {
    setSelectedSeverities([]);
    setSelectedStatuses([]);
    onFilterChange({ severity: [], status: [] });
  };
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-3.5 w-3.5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case 'low':
        return <AlertTriangle className="h-3.5 w-3.5 text-blue-500" />;
      default:
        return null;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-3.5 w-3.5 text-red-600" />;
      case 'acknowledged':
        return <Clock className="h-3.5 w-3.5 text-amber-600" />;
      case 'resolved':
        return <Check className="h-3.5 w-3.5 text-emerald-600" />;
      default:
        return null;
    }
  };

  // Close filters dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setIsFiltersOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-lg rounded-xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Enhanced Search Input */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-12 pr-12 py-3 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-300 shadow-sm"
              placeholder="🔍 Search alerts by title, system, CVE, or description..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button 
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => {
                  setSearchQuery('');
                  onSearch('');
                }}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Enhanced Filter Button */}
          <div className="relative" ref={filtersRef}>
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`flex items-center justify-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-sm ${
                (selectedSeverities.length > 0 || selectedStatuses.length > 0)
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md hover:from-blue-600 hover:to-indigo-600'
                  : 'bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <Filter className="h-5 w-5" />
              <span className="font-semibold">Smart Filters</span>
              {(selectedSeverities.length > 0 || selectedStatuses.length > 0) && (
                <Badge className="bg-white/20 text-white border-white/30 px-2 py-1 text-xs font-bold">
                  {selectedSeverities.length + selectedStatuses.length}
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Enhanced Filter Dropdown */}
            {isFiltersOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-20 overflow-hidden animate-scale-in">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-blue-500" />
                      <h3 className="font-bold text-gray-800 text-lg">Filter Options</h3>
                    </div>
                    {(selectedSeverities.length > 0 || selectedStatuses.length > 0) && (
                      <button 
                        onClick={clearAllFilters}
                        className="text-sm text-red-500 hover:text-red-600 transition-colors flex items-center space-x-1 font-medium"
                      >
                        <X className="h-3 w-3" />
                        <span>Clear all</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Severity Filters */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                      Severity Level
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['critical', 'high', 'medium', 'low'].map(severity => (
                        <label key={severity} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group">
                          <input
                            type="checkbox"
                            checked={selectedSeverities.includes(severity)}
                            onChange={() => handleSeverityChange(severity)}
                            className="rounded text-blue-500 focus:ring-blue-400 w-4 h-4"
                          />
                          <div className="flex items-center space-x-2">
                            {getSeverityIcon(severity)}
                            <span className="text-sm font-medium capitalize group-hover:text-gray-800">{severity}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Status Filters */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      Alert Status
                    </h4>
                    <div className="space-y-2">
                      {['new', 'acknowledged', 'resolved'].map(status => (
                        <label key={status} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group">
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(status)}
                            onChange={() => handleStatusChange(status)}
                            className="rounded text-blue-500 focus:ring-blue-400 w-4 h-4"
                          />
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(status)}
                            <span className="text-sm font-medium capitalize group-hover:text-gray-800">{status}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Apply Button */}
                  <div className="pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => setIsFiltersOpen(false)}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Active Filters Display */}
        {(selectedSeverities.length > 0 || selectedStatuses.length > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-600 flex items-center">
                <Sparkles className="h-4 w-4 mr-1" />
                Active Filters:
              </span>
              {selectedSeverities.map(severity => (
                <Badge key={severity} className={`
                  ${severity === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    severity === 'high' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                    severity === 'medium' ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                    'bg-gradient-to-r from-blue-500 to-blue-600'}
                  text-white shadow-md px-3 py-1 flex items-center space-x-1 font-medium
                `}>
                  {getSeverityIcon(severity)}
                  <span className="capitalize">{severity}</span>
                  <button 
                    onClick={() => handleSeverityChange(severity)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              
              {selectedStatuses.map(status => (
                <Badge key={status} className="bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md px-3 py-1 flex items-center space-x-1 font-medium">
                  {getStatusIcon(status)}
                  <span className="capitalize">{status}</span>
                  <button 
                    onClick={() => handleStatusChange(status)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
