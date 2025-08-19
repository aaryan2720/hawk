
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Timeline,
  Plus,
  Edit,
  Trash2,
  Calendar,
  GitBranch,
  Zap,
  Shield,
  Users,
  BarChart3,
  Settings,
  Globe
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface RoadmapItem {
  id: string;
  date: string;
  version: string;
  title: string;
  description: string;
  category: 'feature' | 'security' | 'ui' | 'backend' | 'integration' | 'performance';
  status: 'completed' | 'in-progress' | 'planned';
  impact: 'low' | 'medium' | 'high' | 'critical';
}

const initialRoadmapData: RoadmapItem[] = [
  {
    id: '1',
    date: '2024-01-15',
    version: 'v0.1.0',
    title: 'Initial Project Setup',
    description: 'Basic React project setup with TypeScript, Tailwind CSS, and routing infrastructure',
    category: 'backend',
    status: 'completed',
    impact: 'critical'
  },
  {
    id: '2',
    date: '2024-02-01',
    version: 'v0.2.0',
    title: 'Authentication System',
    description: 'Supabase integration for user authentication, login/signup forms, and protected routes',
    category: 'security',
    status: 'completed',
    impact: 'high'
  },
  {
    id: '3',
    date: '2024-02-20',
    version: 'v0.3.0',
    title: 'Basic Dashboard',
    description: 'Main dashboard layout with navigation, sidebar, and initial UI components',
    category: 'ui',
    status: 'completed',
    impact: 'high'
  },
  {
    id: '4',
    date: '2024-03-10',
    version: 'v0.4.0',
    title: 'Vulnerability Scanner',
    description: 'Core vulnerability scanning functionality with multiple data sources integration',
    category: 'feature',
    status: 'completed',
    impact: 'critical'
  },
  {
    id: '5',
    date: '2024-04-01',
    version: 'v0.5.0',
    title: 'OEM Monitoring System',
    description: 'Real-time OEM vulnerability monitoring with auto-detection and source management',
    category: 'feature',
    status: 'completed',
    impact: 'high'
  },
  {
    id: '6',
    date: '2024-04-25',
    version: 'v0.6.0',
    title: 'Notification System',
    description: 'Multi-channel notifications (email, SMS) with customizable rules and preferences',
    category: 'feature',
    status: 'completed',
    impact: 'medium'
  },
  {
    id: '7',
    date: '2024-05-15',
    version: 'v0.7.0',
    title: 'AI Solution Generator',
    description: 'Gemini AI integration for automated vulnerability solution recommendations',
    category: 'integration',
    status: 'completed',
    impact: 'high'
  },
  {
    id: '8',
    date: '2024-06-10',
    version: 'v0.8.0',
    title: 'Advanced Analytics',
    description: 'Comprehensive charts, trend analysis, and vulnerability distribution visualization',
    category: 'feature',
    status: 'completed',
    impact: 'medium'
  },
  {
    id: '9',
    date: '2024-07-05',
    version: 'v0.9.0',
    title: 'Architecture Tracking',
    description: 'Real-time user activity tracking and system architecture visualization',
    category: 'backend',
    status: 'completed',
    impact: 'medium'
  },
  {
    id: '10',
    date: '2024-08-01',
    version: 'v1.0.0',
    title: 'Enterprise OEM Dashboard',
    description: 'Industry-scale monitoring with distributed processing and regional filters',
    category: 'feature',
    status: 'completed',
    impact: 'critical'
  },
  {
    id: '11',
    date: '2024-08-19',
    version: 'v1.1.0',
    title: 'Development Roadmap',
    description: 'Interactive roadmap visualization and documentation tracking system',
    category: 'feature',
    status: 'completed',
    impact: 'low'
  }
];

const DevelopmentRoadmap: React.FC = () => {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>(initialRoadmapData);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<RoadmapItem>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'feature',
    status: 'planned',
    impact: 'medium'
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedRoadmap = localStorage.getItem('development-roadmap');
    if (savedRoadmap) {
      try {
        const parsed = JSON.parse(savedRoadmap);
        setRoadmapItems(parsed);
      } catch (error) {
        console.error('Error loading roadmap:', error);
      }
    }
  }, []);

  // Save to localStorage whenever roadmap changes
  useEffect(() => {
    localStorage.setItem('development-roadmap', JSON.stringify(roadmapItems));
  }, [roadmapItems]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feature': return <Zap className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'ui': return <Users className="h-4 w-4" />;
      case 'backend': return <Settings className="h-4 w-4" />;
      case 'integration': return <Globe className="h-4 w-4" />;
      case 'performance': return <BarChart3 className="h-4 w-4" />;
      default: return <GitBranch className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature': return 'bg-blue-500';
      case 'security': return 'bg-red-500';
      case 'ui': return 'bg-green-500';
      case 'backend': return 'bg-purple-500';
      case 'integration': return 'bg-orange-500';
      case 'performance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'border-red-500 text-red-700';
      case 'high': return 'border-orange-500 text-orange-700';
      case 'medium': return 'border-yellow-500 text-yellow-700';
      case 'low': return 'border-green-500 text-green-700';
      default: return 'border-gray-500 text-gray-700';
    }
  };

  const handleAddItem = () => {
    if (!newItem.title || !newItem.description || !newItem.version) {
      toast.error('Please fill in all required fields');
      return;
    }

    const item: RoadmapItem = {
      id: Date.now().toString(),
      date: newItem.date || format(new Date(), 'yyyy-MM-dd'),
      version: newItem.version!,
      title: newItem.title!,
      description: newItem.description!,
      category: newItem.category as any || 'feature',
      status: newItem.status as any || 'planned',
      impact: newItem.impact as any || 'medium'
    };

    setRoadmapItems([...roadmapItems, item]);
    setNewItem({
      date: format(new Date(), 'yyyy-MM-dd'),
      category: 'feature',
      status: 'planned',
      impact: 'medium'
    });
    setIsAddDialogOpen(false);
    toast.success('Roadmap item added successfully');
  };

  const handleEditItem = (item: RoadmapItem) => {
    setEditingItem(item);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;

    setRoadmapItems(roadmapItems.map(item => 
      item.id === editingItem.id ? editingItem : item
    ));
    setEditingItem(null);
    toast.success('Roadmap item updated successfully');
  };

  const handleDeleteItem = (id: string) => {
    setRoadmapItems(roadmapItems.filter(item => item.id !== id));
    toast.success('Roadmap item deleted successfully');
  };

  // Prepare chart data
  const chartData = roadmapItems
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((item, index) => ({
      date: format(new Date(item.date), 'MMM yyyy'),
      version: item.version,
      features: index + 1,
      title: item.title
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Timeline className="h-8 w-8" />
            Development Roadmap
          </h1>
          <p className="text-muted-foreground mt-1">
            Track our journey and plan future enhancements
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Roadmap Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={newItem.date}
                    onChange={(e) => setNewItem({...newItem, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Version</label>
                  <Input
                    placeholder="v1.2.0"
                    value={newItem.version}
                    onChange={(e) => setNewItem({...newItem, version: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Feature title"
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Detailed description of the feature or change"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newItem.category} onValueChange={(value) => setNewItem({...newItem, category: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="ui">UI/UX</SelectItem>
                      <SelectItem value="backend">Backend</SelectItem>
                      <SelectItem value="integration">Integration</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={newItem.status} onValueChange={(value) => setNewItem({...newItem, status: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Impact</label>
                  <Select value={newItem.impact} onValueChange={(value) => setNewItem({...newItem, impact: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddItem} className="flex-1">
                  Add Item
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Progress Chart</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Development Progress Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{label}</p>
                              <p className="text-sm text-muted-foreground">{data.version}</p>
                              <p className="text-sm">{data.title}</p>
                              <p className="text-primary font-medium">{data.features} features total</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="features" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <div className="space-y-4">
            {roadmapItems
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full ${getCategoryColor(item.category)} flex items-center justify-center text-white`}>
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{item.title}</h3>
                            <Badge variant="outline" className={getImpactColor(item.impact)}>
                              {item.impact}
                            </Badge>
                            <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-2">{item.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(item.date), 'MMM dd, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitBranch className="h-4 w-4" />
                              {item.version}
                            </span>
                            <Badge variant="outline" className="capitalize">
                              {item.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle>Development Documentation</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-3">Project Overview</h2>
                  <p className="text-muted-foreground">
                    This vulnerability monitoring platform has evolved significantly over the past year, 
                    transforming from a basic concept into a comprehensive enterprise-grade security solution.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-3">Major Milestones</h2>
                  <div className="grid gap-4">
                    {['critical', 'high'].map(impact => (
                      <div key={impact}>
                        <h3 className="text-lg font-medium mb-2 capitalize">{impact} Impact Features</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {roadmapItems
                            .filter(item => item.impact === impact && item.status === 'completed')
                            .map(item => (
                              <li key={item.id} className="text-muted-foreground">
                                <strong>{item.version}</strong>: {item.title} - {item.description}
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-3">Technical Architecture Evolution</h2>
                  <div className="space-y-3">
                    <p className="text-muted-foreground">
                      <strong>Frontend:</strong> React + TypeScript + Tailwind CSS for responsive, type-safe UI development
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Backend:</strong> Supabase for authentication, real-time data, and serverless functions
                    </p>
                    <p className="text-muted-foreground">
                      <strong>AI Integration:</strong> Google Gemini for intelligent vulnerability analysis and solution generation
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Data Visualization:</strong> Recharts for comprehensive analytics and trend visualization
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-3">Future Roadmap</h2>
                  <ul className="list-disc list-inside space-y-1">
                    {roadmapItems
                      .filter(item => item.status === 'planned')
                      .map(item => (
                        <li key={item.id} className="text-muted-foreground">
                          <strong>{item.version}</strong>: {item.title}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Roadmap Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={editingItem.date}
                    onChange={(e) => setEditingItem({...editingItem, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Version</label>
                  <Input
                    value={editingItem.version}
                    onChange={(e) => setEditingItem({...editingItem, version: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={editingItem.category} onValueChange={(value) => setEditingItem({...editingItem, category: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="ui">UI/UX</SelectItem>
                      <SelectItem value="backend">Backend</SelectItem>
                      <SelectItem value="integration">Integration</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={editingItem.status} onValueChange={(value) => setEditingItem({...editingItem, status: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Impact</label>
                  <Select value={editingItem.impact} onValueChange={(value) => setEditingItem({...editingItem, impact: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateItem} className="flex-1">
                  Update Item
                </Button>
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DevelopmentRoadmap;
