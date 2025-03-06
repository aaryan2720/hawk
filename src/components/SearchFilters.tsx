
import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: { severity: string[]; status: string[] }) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch, onFilterChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

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

  return (
    <div className="glass-card rounded-lg p-4 mb-6 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-white border border-gray-200 text-gray-700 rounded-lg pl-10 pr-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
            placeholder="Search alerts by title, system, or CVE..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="relative">
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center justify-center space-x-2 bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2.5 w-full md:w-auto hover:bg-gray-50 transition-colors duration-200"
          >
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isFiltersOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10 animate-slide-down">
              <div className="mb-4">
                <h3 className="font-medium text-sm text-gray-700 mb-2">Severity</h3>
                <div className="space-y-2">
                  {['critical', 'high', 'medium', 'low'].map(severity => (
                    <label key={severity} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedSeverities.includes(severity)}
                        onChange={() => handleSeverityChange(severity)}
                        className="rounded text-primary focus:ring-primary/30"
                      />
                      <span className="text-sm capitalize">{severity}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-2">Status</h3>
                <div className="space-y-2">
                  {['new', 'acknowledged', 'resolved'].map(status => (
                    <label key={status} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status)}
                        onChange={() => handleStatusChange(status)}
                        className="rounded text-primary focus:ring-primary/30"
                      />
                      <span className="text-sm capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
