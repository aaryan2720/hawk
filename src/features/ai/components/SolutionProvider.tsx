
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lightbulb,
  Zap,
  Shield,
  Bot
} from 'lucide-react';
import { Alert as AlertType } from '@/types';
import { useSolutionProgress } from '@/features/ai/hooks/useSolutionProgress';
import { getSolutionTemplate } from '@/features/ai/utils/solutionTemplates';
import SolutionTemplateSelector from '@/features/ai/components/SolutionTemplateSelector';
import AISolutionDisplay from '@/features/ai/components/AISolutionDisplay';

interface SolutionProviderProps {
  alert: AlertType;
}

const SolutionProvider: React.FC<SolutionProviderProps> = ({ alert }) => {
  const { 
    selectedTemplate, 
    updateTemplate,
    resetProgress
  } = useSolutionProgress(alert.id);
  
  const [activeTab, setActiveTab] = useState('ai-solution');

  const handleTemplateSelect = (templateId: string) => {
    updateTemplate(templateId);
    if (templateId) {
      setActiveTab('templates');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            AI-Powered Solution Center - {alert.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Bot className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Our AI analyzes <strong>{alert.cve || 'this vulnerability'}</strong> affecting your <strong>{alert.system}</strong> system 
              and generates step-by-step solutions in simple language for both technical and non-technical users.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ai-solution" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Solution
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="quick-actions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Quick Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-solution" className="mt-6">
          <AISolutionDisplay alert={alert} />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <SolutionTemplateSelector
            alert={alert}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
          />
          
          {selectedTemplate && (
            <div className="mt-6">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 mb-4">
                Using Template: {getSolutionTemplate(selectedTemplate)?.name}
              </Badge>
              {/* Template-based solution would go here */}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quick-actions" className="mt-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Immediate Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alert.severity === 'critical' && (
                  <Button variant="destructive" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Isolate Affected System
                  </Button>
                )}
                
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="h-4 w-4 mr-2" />
                  Check System Status
                </Button>
                
                {alert.patchLink && (
                  <Button asChild className="w-full justify-start">
                    <a href={alert.patchLink} target="_blank" rel="noopener noreferrer">
                      <Bot className="h-4 w-4 mr-2" />
                      Download Official Patch
                    </a>
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={resetProgress}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Reset All Progress
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SolutionProvider;
