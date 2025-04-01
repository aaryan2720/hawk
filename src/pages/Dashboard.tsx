import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardNav from '@/components/DashboardNav';
import StatusOverview from '@/components/StatusOverview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Database, 
  Shield, 
  ArrowUpRight, 
  Scan, 
  BarChart,
  Cpu,
  Network,
  HardDrive,
  ShieldCheck,
  Zap,
  Clock,
  Activity,
  Layers,
  Settings,
  Bell,
  FileText,
  HelpCircle,
  RefreshCw,
  Globe
} from 'lucide-react';
import TrendChart from '@/components/TrendChart';
import RiskAnalyzer from '@/components/RiskAnalyzer';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
    } else {
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (scanProgress < 100) {
      const timer = setTimeout(() => setScanProgress(scanProgress + 10), 500);
      return () => clearTimeout(timer);
    }
  }, [scanProgress]);

  if (!user) return null;

  const stats = [
    { id: 1, name: 'Total Systems', value: '5', icon: Cpu, change: '+2', changeType: 'positive' },
    { id: 2, name: 'Critical Alerts', value: '3', icon: AlertTriangle, change: '+1', changeType: 'negative' },
    { id: 3, name: 'Vulnerabilities', value: '24', icon: Shield, change: '-5', changeType: 'positive' },
    { id: 4, name: 'Scans Today', value: '2', icon: Scan, change: '0', changeType: 'neutral' },
  ];

  const quickActions = [
    { name: 'New Scan', icon: Scan, action: () => navigate('/new-scan') },
    { name: 'View Reports', icon: FileText, action: () => navigate('/reports') },
    { name: 'System Settings', icon: Settings, action: () => navigate('/settings') },
    { name: 'Notifications', icon: Bell, action: () => navigate('/notifications') },
  ];

  const recentVulnerabilities = [
    { id: 'CVE-2023-45678', severity: 'Critical', system: 'Router-X', status: 'Unpatched', date: '2 hours ago' },
    { id: 'CVE-2023-38765', severity: 'High', system: 'Switch-01', status: 'Patch Available', date: '1 day ago' },
    { id: 'CVE-2023-29876', severity: 'Medium', system: 'Server-02', status: 'Patched', date: '3 days ago' },
  ];

  const RealTimeDeviceScanner = () => (
    <Card className="border-blue-100 bg-blue-50 mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-blue-800">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Scan className="h-5 w-5" />
            </motion.div>
            <span className="ml-2">Real-Time Device Scanner</span>
          </CardTitle>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <div className="flex items-center">
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-blue-500 mr-2"
              />
              Live Scanning
            </div>
          </Badge>
        </div>
        <CardDescription className="text-blue-700">
          Automatically detecting device information from browser data
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="relative h-20 bg-blue-100/50 rounded-lg overflow-hidden">
            <motion.div 
              className="absolute top-0 left-0 h-full w-1 bg-blue-400"
              initial={{ x: -10 }}
              animate={{ x: "100vw" }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Globe className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                <p className="text-xs font-medium text-blue-700">Scanning Device Fingerprint</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Operating System</p>
              <p className="font-medium">
                {navigator.userAgent.match(/\(([^)]+)\)/)?.[1] || 'Unknown OS'}
              </p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Browser</p>
              <p className="font-medium">
                {navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)\//)?.[1] || 'Unknown Browser'}
              </p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Screen Resolution</p>
              <p className="font-medium">
                {window.screen.width}×{window.screen.height}
              </p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">CPU Cores</p>
              <p className="font-medium">
                {navigator.hardwareConcurrency || 'Unknown'} cores
              </p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Device Memory</p>
              <p className="font-medium">
                {(navigator as any).deviceMemory || 'Unknown'} GB
              </p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Language</p>
              <p className="font-medium">
                {navigator.language || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-800">Detected Cookies</h4>
              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                {document.cookie.split(';').length} cookies found
              </Badge>
            </div>
            
            <div className="bg-white rounded-lg border border-blue-200 p-3 max-h-40 overflow-y-auto">
              {document.cookie ? (
                <div className="space-y-2">
                  {document.cookie.split(';').map((cookie, index) => (
                    <div key={index} className="text-xs font-mono p-2 bg-blue-50 rounded">
                      <span className="text-blue-600">{cookie.split('=')[0]?.trim()}:</span>{' '}
                      <span className="text-gray-700">{cookie.split('=')[1]?.substring(0, 30)}...</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No cookies detected</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-blue-50/50 border-t border-blue-200 justify-between">
        <div className="flex items-center text-xs text-blue-600">
          <Clock className="h-3 w-3 mr-1" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-blue-700 hover:bg-blue-100"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Rescan Device
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardNav />
      
      <main className="container mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                Hawk Security Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Comprehensive overview of your OEM security posture, vulnerability status, and threat intelligence.
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-600 border-green-200">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                Active Monitoring
              </div>
            </Badge>
          </div>
        </motion.div>

        <motion.div 
          ref={ref}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-sm font-medium">{stat.name}</CardDescription>
                    <stat.icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-500' : stat.changeType === 'negative' ? 'text-red-500' : 'text-gray-500'}`}>
                    {stat.change} from yesterday
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <StatusOverview />
        </motion.div>

        {/* Real-Time Device Scanner Added Here */}
        <RealTimeDeviceScanner />

        {/* Rest of the dashboard components... */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Security Overview Card */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Card className="border-blue-100 bg-blue-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-blue-800">
                      <ShieldCheck className="h-5 w-5 mr-2" />
                      Security Overview
                    </CardTitle>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Real-time
                    </Badge>
                  </div>
                  <CardDescription className="text-blue-700">
                    Current security status across all monitored OEM systems
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-500">Critical Vulnerabilities</h3>
                      <p className="text-2xl font-bold text-red-600">3</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-500">Systems at Risk</h3>
                      <p className="text-2xl font-bold text-amber-600">2/5</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-500">Patch Coverage</h3>
                      <p className="text-2xl font-bold text-green-600">78%</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-500">Threat Level</h3>
                      <div className="flex items-center">
                        <p className="text-2xl font-bold text-amber-600 mr-2">Medium</p>
                        <div className="w-16 bg-amber-100 rounded-full h-2.5">
                          <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* System Health and Patch Compliance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Cpu className="h-5 w-5 mr-2 text-blue-500" />
                      System Health Overview
                    </CardTitle>
                    <CardDescription>
                      Current status of monitored OEM devices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Router-X</span>
                          <span className="font-medium text-green-600">Online</span>
                        </div>
                        <Progress value={85} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Switch-01</span>
                          <span className="font-medium text-green-600">Online</span>
                        </div>
                        <Progress value={72} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Server-02</span>
                          <span className="font-medium text-amber-600">Degraded</span>
                        </div>
                        <Progress value={45} className="h-2 bg-amber-100">
                          <div className="h-full bg-amber-500" style={{ width: '45%' }} />
                        </Progress>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-purple-500" />
                      Patch Compliance
                    </CardTitle>
                    <CardDescription>
                      Current patch status across all systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-40">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="3"
                            strokeDasharray="78, 100"
                          />
                          <text x="18" y="20.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#8b5cf6">78%</text>
                          <text x="18" y="25" textAnchor="middle" fontSize="4" fill="#64748b">Patched</text>
                        </svg>
                      </div>
                      <div className="ml-6 text-sm">
                        <div className="flex items-center mb-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                          <span>Up to date: 5</span>
                        </div>
                        <div className="flex items-center mb-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                          <span>Update available: 2</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span>Critical updates: 1</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

<motion.div
  whileHover={{ scale: 1.01 }}
  transition={{ type: "spring", stiffness: 400, damping: 10 }}
>
  <Card className="border-purple-100 bg-purple-50">
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center text-purple-800">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Zap className="h-5 w-5" />
          </motion.div>
          <span className="ml-2">Active System Scan</span>
        </CardTitle>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          <motion.span
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Scanning...
          </motion.span>
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-purple-700">
          <span>Router-X Comprehensive Scan</span>
          <span>{scanProgress}%</span>
        </div>
        
        {/* Animated progress bar */}
        <div className="relative">
          <Progress value={scanProgress} className="h-2 bg-purple-200">
            <div
              className="h-full bg-purple-500"
              style={{ width: `${scanProgress}%` }}
            />
          </Progress>
          <motion.div
            className="absolute top-0 left-0 h-2 w-2 bg-white rounded-full shadow-lg"
            style={{ left: `${scanProgress}%` }}
            animate={{
              x: [0, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.5
            }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-purple-600">
          <span>Started: 2 minutes ago</span>
          <span>Estimated: 3 minutes remaining</span>
        </div>
        
        {/* Scanning animation visualization */}
        <div className="mt-4 flex justify-center">
          <motion.div 
            className="relative h-16 w-full"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
          >
            {/* Device illustration */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Network className="h-6 w-6 text-purple-500" />
            </div>
            
            {/* Scanning waves */}
            <motion.div
              className="absolute left-12 h-1 bg-purple-300 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "70%" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop"
              }}
            />
            
            <motion.div
              className="absolute left-12 h-1 bg-purple-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "70%" }}
              transition={{
                delay: 0.5,
                duration: 2,
                repeat: Infinity,
                repeatType: "loop"
              }}
            />
            
            {/* Target device */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <HardDrive className="h-6 w-6 text-purple-700" />
            </div>
          </motion.div>
        </div>

        {/* Additional Scan Details Section */}
        <div className="mt-6 border-t border-purple-200 pt-4">
          <h4 className="text-sm font-medium text-purple-800 mb-3">Current Scan Details</h4>
          
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <p className="text-purple-600">Scan Type</p>
              <p className="font-medium">Deep Vulnerability Scan</p>
            </div>
            <div className="space-y-1">
              <p className="text-purple-600">Modules Completed</p>
              <p className="font-medium">5/8</p>
            </div>
            <div className="space-y-1">
              <p className="text-purple-600">Issues Found</p>
              <p className="font-medium">3</p>
            </div>
          </div>

          {/* Current Module Being Scanned */}
          <div className="mt-4 bg-purple-100/50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-purple-700">Current Module</span>
              <motion.span 
                className="text-xs text-purple-500"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Scanning...
              </motion.span>
            </div>
            <p className="text-sm font-medium">Authentication Protocols</p>
            <div className="mt-2 w-full bg-purple-200 rounded-full h-1.5">
              <motion.div 
                className="bg-purple-600 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: ["0%", "45%", "70%", "100%"] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
            </div>
          </div>

          {/* Recently Discovered Items */}
          <div className="mt-4">
            <h4 className="text-xs font-medium text-purple-700 mb-2">Recently Discovered</h4>
            <div className="space-y-2">
              <div className="flex items-center p-2 bg-white rounded-md border border-purple-100">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Weak TLS Configuration</p>
                  <p className="text-xs text-gray-500">Medium Severity</p>
                </div>
                <Clock className="h-3 w-3 text-gray-400" />
              </div>
              <div className="flex items-center p-2 bg-white rounded-md border border-purple-100">
                <AlertTriangle className="h-4 w-4 text-blue-500 mr-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Outdated Component</p>
                  <p className="text-xs text-gray-500">Low Severity</p>
                </div>
                <Clock className="h-3 w-3 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
    
    <CardFooter className="bg-purple-50/50 border-t border-purple-200">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-purple-700 hover:bg-purple-100"
      >
        View Scan Details
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-purple-700 hover:bg-purple-100 ml-auto"
      >
        Scan Settings
      </Button>
    </CardFooter>
  </Card>
</motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Layers className="h-5 w-5 mr-2 text-gray-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          variant="outline" 
                          className="flex flex-col items-center justify-center h-24 w-full"
                          onClick={action.action}
                        >
                          <action.icon className="h-6 w-6 mb-2" />
                          <span className="text-sm">{action.name}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Vulnerabilities */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                    Recent Vulnerabilities
                  </CardTitle>
                  <CardDescription>
                    Newly detected vulnerabilities in your systems
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentVulnerabilities.map((vuln, index) => (
                    <motion.div
                      key={vuln.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <div className="flex items-start p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0 mr-3">
                          {vuln.severity === 'Critical' ? (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          ) : vuln.severity === 'High' ? (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{vuln.id}</h3>
                          <p className="text-sm text-gray-600 truncate">{vuln.system}</p>
                          <div className="flex mt-1">
                            <Badge 
                              variant="outline" 
                              className={`mr-2 ${
                                vuln.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                                vuln.severity === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {vuln.severity}
                            </Badge>
                            <Badge variant="outline">{vuln.status}</Badge>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap ml-4 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {vuln.date}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full" onClick={() => navigate('/vulnerabilities')}>
                    View All Vulnerabilities
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Risk Analysis */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-green-500" />
                    Risk Analysis
                  </CardTitle>
                  <CardDescription>
                    Current security risk assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RiskAnalyzer />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <Tabs defaultValue="recent" onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <TabsList>
                <TabsTrigger value="recent" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                  Recent
                </TabsTrigger>
                <TabsTrigger value="alerts" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                  Alerts
                </TabsTrigger>
                <TabsTrigger value="scans" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                  Scans
                </TabsTrigger>
                <TabsTrigger value="systems" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
                  Systems
                </TabsTrigger>
              </TabsList>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="recent" className="space-y-4">
                  <ActivityItem 
                    title="Critical Vulnerability Detected" 
                    description="CVE-2023-45678 found in Router-X firmware (v2.3.4). Immediate action recommended."
                    time="2 hours ago"
                    icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                    severity="critical"
                  />
                  <ActivityItem 
                    title="System Scan Completed" 
                    description="Comprehensive scan of Server-01 completed. 3 medium vulnerabilities detected."
                    time="Yesterday"
                    icon={<Scan className="h-5 w-5 text-blue-500" />}
                    severity="medium"
                  />
                  <ActivityItem 
                    title="OEM Firmware Update" 
                    description="New firmware update available for Router-X (v2.3.5) addressing 4 security issues."
                    time="2 days ago"
                    icon={<Database className="h-5 w-5 text-purple-500" />}
                    severity="low"
                  />
                </TabsContent>
                
                <TabsContent value="alerts" className="space-y-4">
                  <ActivityItem 
                    title="Critical Vulnerability Alert" 
                    description="CVE-2023-45678 detected with CVSS score of 9.8. Immediate patching required."
                    time="2 hours ago"
                    icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                    severity="critical"
                  />
                  <ActivityItem 
                    title="Unauthorized Access Attempt" 
                    description="Multiple failed login attempts detected on admin interface from suspicious IP."
                    time="1 day ago"
                    icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
                    severity="high"
                  />
                  <ActivityItem 
                    title="Configuration Drift Detected" 
                    description="Security settings on Switch-01 have changed from baseline configuration."
                    time="3 days ago"
                    icon={<AlertTriangle className="h-5 w-5 text-blue-500" />}
                    severity="medium"
                  />
                </TabsContent>
                
                <TabsContent value="scans" className="space-y-4">
                  <ActivityItem 
                    title="Scheduled Scan Completed" 
                    description="Weekly comprehensive scan completed. 3 new vulnerabilities identified."
                    time="Yesterday"
                    icon={<Scan className="h-5 w-5 text-blue-500" />}
                    severity="medium"
                  />
                  <ActivityItem 
                    title="Manual Scan Initiated" 
                    description="User initiated deep scan of Server-01 storage subsystem."
                    time="3 days ago"
                    icon={<Scan className="h-5 w-5 text-blue-500" />}
                    severity="low"
                  />
                  <ActivityItem 
                    title="Quick Scan Completed" 
                    description="Rapid vulnerability assessment completed in 12 minutes."
                    time="5 days ago"
                    icon={<Scan className="h-5 w-5 text-blue-500" />}
                    severity="low"
                  />
                </TabsContent>
                
                <TabsContent value="systems" className="space-y-4">
                  <ActivityItem 
                    title="New System Added" 
                    description="Switch-02 has been added to monitoring with agent version 3.2.1."
                    time="1 day ago"
                    icon={<Network className="h-5 w-5 text-green-500" />}
                    severity="low"
                  />
                  <ActivityItem 
                    title="System Offline" 
                    description="Router-X lost connection for 15 minutes. Automatic recovery detected."
                    time="2 days ago"
                    icon={<Network className="h-5 w-5 text-amber-500" />}
                    severity="medium"
                  />
                  <ActivityItem 
                    title="Firmware Updated" 
                    description="Server-01 firmware successfully updated to version 4.5.2."
                    time="4 days ago"
                    icon={<HardDrive className="h-5 w-5 text-blue-500" />}
                    severity="low"
                  />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-8 border border-blue-200"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg mr-4">
              <HelpCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Need help with Hawk?</h3>
              <p className="text-blue-700 mb-4">
                Explore our documentation or contact our security experts for assistance with your OEM vulnerability management.
              </p>
              <div className="flex space-x-3">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  Documentation
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

// Enhanced Activity Item component
const ActivityItem = ({ 
  title, 
  description, 
  time, 
  icon,
  severity = "low"
}: { 
  title: string; 
  description: string; 
  time: string; 
  icon: React.ReactNode;
  severity?: "critical" | "high" | "medium" | "low";
}) => {
  const severityColors = {
    critical: "bg-red-50 border-red-100 hover:bg-red-50",
    high: "bg-amber-50 border-amber-100 hover:bg-amber-50",
    medium: "bg-blue-50 border-blue-100 hover:bg-blue-50",
    low: "bg-gray-50 border-gray-100 hover:bg-gray-50"
  };

  return (
    <motion.div
      whileHover={{ x: 5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`flex items-start p-4 rounded-lg border ${severityColors[severity]} transition-colors`}
    >
      <div className="flex-shrink-0 mr-4">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <div className="text-xs text-gray-500 whitespace-nowrap ml-4 flex items-center">
        <Clock className="h-3 w-3 mr-1" />
        {time}
      </div>
    </motion.div>
  );
};

export default Dashboard;