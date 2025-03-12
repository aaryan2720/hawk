import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Database, Download, Search, Shield, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import DashboardNav from '@/components/DashboardNav';
import { Link } from 'react-router-dom';

interface ScanRecord {
  id: string;
  date: string;
  source: string;
  vulnsFound: number;
  duration: number;
  status: 'completed' | 'failed' | 'in-progress';
}

const ScanHistory = () => {
  const [scanRecords, setScanRecords] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching scan history data
    const fetchScanHistory = async () => {
      try {
        setIsLoading(true);
        // This would be replaced with an actual API call
        // For now, we'll use mock data
        setTimeout(() => {
          const mockData: ScanRecord[] = [
            {
              id: '1',
              date: new Date(Date.now() - 3600000).toISOString(),
              source: 'NVD Database',
              vulnsFound: 12,
              duration: 45,
              status: 'completed'
            },
            {
              id: '2',
              date: new Date(Date.now() - 86400000).toISOString(),
              source: 'CVE Details',
              vulnsFound: 8,
              duration: 60,
              status: 'completed'
            },
            {
              id: '3',
              date: new Date(Date.now() - 172800000).toISOString(),
              source: 'CISA Known Exploited Vulnerabilities',
              vulnsFound: 2,
              duration: 30,
              status: 'completed'
            },
            {
              id: '4',
              date: new Date(Date.now() - 259200000).toISOString(),
              source: 'Real-Time Scanner',
              vulnsFound: 0,
              duration: 35,
              status: 'completed'
            },
            {
              id: '5',
              date: new Date(Date.now() - 345600000).toISOString(),
              source: 'NVD Database',
              vulnsFound: 5,
              duration: 40,
              status: 'completed'
            }
          ];
          setScanRecords(mockData);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching scan history:', error);
        toast.error('Failed to load scan history');
        setIsLoading(false);
      }
    };

    fetchScanHistory();
  }, []);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'NVD Database':
        return <Database className="h-5 w-5 text-blue-500" />;
      case 'CVE Details':
        return <Shield className="h-5 w-5 text-green-500" />;
      case 'CISA Known Exploited Vulnerabilities':
        return <Search className="h-5 w-5 text-orange-500" />;
      case 'Real-Time Scanner':
        return <Clock className="h-5 w-5 text-purple-500" />;
      default:
        return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  const getScanStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const exportToCSV = () => {
    toast.success('Scan history exported to CSV');
  };

  return (
    <>
      <DashboardNav />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" asChild className="mr-2">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold mb-1">Scan History</h1>
              <p className="text-gray-500">View past scans and their results</p>
            </div>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>

        <Card className="p-6 shadow-md">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-10 w-10 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : scanRecords.length > 0 ? (
            <div className="space-y-4">
              {scanRecords.map((record) => (
                <div key={record.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="flex items-center mb-2 sm:mb-0">
                      <div className="mr-3">
                        {getSourceIcon(record.source)}
                      </div>
                      <div>
                        <h3 className="font-medium">{record.source} Scan</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          <span>{formatDate(record.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getScanStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                      <Badge variant="secondary">
                        {record.vulnsFound} vulnerabilities
                      </Badge>
                      <Badge variant="outline" className="bg-gray-50">
                        {record.duration}s
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-2 border-t flex justify-end">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/dashboard?source=${record.source}`}>
                        View Results
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">No scan history found</h3>
              <p className="text-gray-500 mb-4">
                You haven't run any vulnerability scans yet.
              </p>
              <Button asChild>
                <a href="/dashboard">Run a Scan</a>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default ScanHistory;
