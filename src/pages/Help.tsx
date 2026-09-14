
import React from 'react';
import DashboardNav from '@/components/layout/DashboardNav';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, MessageSquare, FileText, Network } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const Help = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary/70">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Help & Support</h1>
          <p className="text-muted-foreground mt-1">
            Get assistance with using HAWK Security
          </p>
        </div>

        <Tabs defaultValue="faq" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Contact Support
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              System Status
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Find answers to common questions about HAWK Security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>How often are vulnerability scans performed?</AccordionTrigger>
                    <AccordionContent>
                      By default, automatic vulnerability scans run every hour. You can configure this frequency in the System Monitor settings page.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>How do I add a new system to monitor?</AccordionTrigger>
                    <AccordionContent>
                      Navigate to the System Monitor page and click "Add New System" button. Follow the prompts to configure your new system monitoring.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>How are risk scores calculated?</AccordionTrigger>
                    <AccordionContent>
                      Risk scores are calculated using multiple factors including vulnerability severity, exploit availability, system criticality, and potential business impact.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Can I integrate HAWK with my existing security tools?</AccordionTrigger>
                    <AccordionContent>
                      Yes, HAWK offers API integrations with major security tools. Contact our support team for assistance with specific integrations.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger>How do I set up notifications for critical alerts?</AccordionTrigger>
                    <AccordionContent>
                      Navigate to Settings → Notifications to configure alert preferences. You can set up email, SMS, or in-app notifications based on severity levels.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>
                  Get help from our security experts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Email Support</h3>
                    <p className="text-muted-foreground">support@hawksecurity.example.com</p>
                    <p className="text-sm text-muted-foreground mt-1">Response time: Within 24 hours</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Emergency Support</h3>
                    <p className="text-muted-foreground">+1 (555) 123-4567</p>
                    <p className="text-sm text-muted-foreground mt-1">Available 24/7 for security emergencies</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Live Chat</h3>
                    <p className="text-muted-foreground">Available Monday-Friday, 9am-5pm ET</p>
                    <button className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">Start Chat Session</button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="docs">
            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>
                  Access comprehensive guides and documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Getting Started Guide</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Learn how to set up your HAWK dashboard and configure your first scan.</p>
                      <button className="mt-2 text-primary hover:underline text-sm">View Guide →</button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">API Documentation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Technical documentation for integrating with the HAWK API.</p>
                      <button className="mt-2 text-primary hover:underline text-sm">View Documentation →</button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Security Best Practices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Recommendations for improving your security posture.</p>
                      <button className="mt-2 text-primary hover:underline text-sm">View Guide →</button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Video Tutorials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Step-by-step video guides for using HAWK features.</p>
                      <button className="mt-2 text-primary hover:underline text-sm">Watch Tutorials →</button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Check the operational status of HAWK services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Dashboard Interface</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Vulnerability Database</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Real-time Scanning</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Notification System</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>API Services</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Operational
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Last updated: April 9, 2025 - 10:15 AM ET</p>
                    <p className="text-sm text-muted-foreground mt-2">Next scheduled maintenance: April 15, 2025 - 2:00 AM ET</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Help;
