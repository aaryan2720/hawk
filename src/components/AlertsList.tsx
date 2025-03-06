
import React, { useState, useCallback } from 'react';
import AlertCard from './AlertCard';
import SearchFilters from './SearchFilters';
import { Alert } from '../types';
import { mockAlerts } from '../utils/mockData';

const AlertsList = () => {
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>(mockAlerts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{ severity: string[]; status: string[] }>({
    severity: [],
    status: []
  });

  const filterAlerts = useCallback(() => {
    let result = [...mockAlerts];
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(alert => 
        alert.title.toLowerCase().includes(query) || 
        alert.system.toLowerCase().includes(query) || 
        (alert.cve && alert.cve.toLowerCase().includes(query)) ||
        alert.description.toLowerCase().includes(query)
      );
    }
    
    // Apply severity filter
    if (filters.severity.length > 0) {
      result = result.filter(alert => filters.severity.includes(alert.severity));
    }
    
    // Apply status filter
    if (filters.status.length > 0) {
      result = result.filter(alert => filters.status.includes(alert.status));
    }
    
    return result;
  }, [searchQuery, filters]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setFilteredAlerts(filterAlerts());
  }, [filterAlerts]);

  const handleFilterChange = useCallback((newFilters: { severity: string[]; status: string[] }) => {
    setFilters(newFilters);
    setFilteredAlerts(filterAlerts());
  }, [filterAlerts]);

  // Update filtered alerts when dependencies change
  React.useEffect(() => {
    setFilteredAlerts(filterAlerts());
  }, [searchQuery, filters, filterAlerts]);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Alerts</h2>
        <span className="text-sm text-gray-500">{filteredAlerts.length} alerts</span>
      </div>
      
      <SearchFilters onSearch={handleSearch} onFilterChange={handleFilterChange} />
      
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert, index) => (
            <div 
              key={alert.id}
              className="animate-slide-up"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <AlertCard alert={alert} />
            </div>
          ))
        ) : (
          <div className="glass-card rounded-lg p-8 text-center">
            <p className="text-gray-500">No alerts matching the current filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsList;
