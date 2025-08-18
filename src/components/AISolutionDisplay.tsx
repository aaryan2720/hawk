
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  Clock, 
  User, 
  Zap, 
  AlertTriangle,
  Lightbulb,
  Play,
  RefreshCw,
  Shield
} from 'lucide-react';
import { Alert as AlertType } from '@/types';
import { AISolutionGenerator, GeneratedSolution } from '@/services/aiSolutionGenerator';
import { useSolutionProgress } from '@/hooks/useSolutionProgress';
import { toast } from 'sonner';

interface AISolutionDisplayProps {
  alert: AlertType;
}

const AISolutionDisplay: React.FC<AISolutionDisplayProps> = ({ alert }) => {
  const [solution, setSolution] = useState<GeneratedSolution | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    completedSteps, 
    toggleStepCompletion, 
    resetProgress,
    getProgressPercentage 
  } = useSolutionProgress(alert.id);

  useEffect(() => {
    generateSolution();
  }, [alert.id]);

  const generateSolution = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const generatedSolution = await AISolutionGenerator.generateSolution(alert);
      setSolution(generatedSolution);
      toast.success('AI solution generated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate solution';
      setError(errorMessage);
      toast.error('Failed to generate AI solution');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'immediate': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'patch': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'configuration': return <Zap className="h-4 w-4 text-orange-500" />;
      case 'monitoring': return <Play className="h-4 w-4 text-green-500" />;
      default: return <Lightbulb className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isGenerating) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
            Generating AI Solution...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                AI is analyzing the vulnerability and creating step-by-step solutions...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={generateSolution} 
            className="mt-4 w-full"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!solution) return null;

  const progressPercentage = getProgressPercentage(solution.steps.length);

  return (
    <div className="space-y-6">
      {/* Solution Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                {solution.title}
              </CardTitle>
              <p className="text-gray-600 mt-2">{solution.description}</p>
            </div>
            <Button 
              onClick={generateSolution} 
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Regenerate
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <div className="flex items-center gap-1">
              {getCategoryIcon(solution.category)}
              <Badge variant="outline" className="capitalize">
                {solution.category}
              </Badge>
            </div>
            <Badge variant="outline" className={getDifficultyColor(solution.difficulty)}>
              {solution.difficulty}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              {solution.estimatedTime}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <User className="h-4 w-4" />
              {solution.steps.length} steps
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progress: {completedSteps.length} of {solution.steps.length} completed</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            {progressPercentage > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetProgress}
                className="mt-2"
              >
                Reset Progress
              </Button>
            )}
          </div>

          {/* Prerequisites */}
          {solution.prerequisites.length > 0 && (
            <Alert className="mb-6">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Prerequisites:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {solution.prerequisites.map((prereq, index) => (
                    <li key={index}>{prereq}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Solution Steps */}
      <div className="space-y-4">
        {solution.steps.map((step, index) => (
          <Card key={step.id} className={`transition-all ${
            completedSteps.includes(step.id) ? 'bg-green-50 border-green-200' : 'hover:shadow-md'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    completedSteps.includes(step.id) 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {completedSteps.includes(step.id) ? '✓' : index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <p className="text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>
                <Button
                  variant={completedSteps.includes(step.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleStepCompletion(step.id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {completedSteps.includes(step.id) ? 'Completed' : 'Mark Done'}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Action to Take:</h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded-md">{step.action}</p>
                </div>

                {step.commands && step.commands.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Commands/Steps:</h4>
                    <div className="bg-gray-900 text-green-400 p-3 rounded-md text-sm font-mono">
                      {step.commands.map((command, cmdIndex) => (
                        <div key={cmdIndex} className="mb-1">
                          <span className="text-gray-500">$ </span>
                          {command}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Expected Result:</h4>
                  <p className="text-gray-700 bg-green-50 p-3 rounded-md">{step.expectedResult}</p>
                </div>

                {step.troubleshooting && (
                  <div>
                    <h4 className="font-medium mb-2">Troubleshooting:</h4>
                    <p className="text-gray-700 bg-yellow-50 p-3 rounded-md">{step.troubleshooting}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AISolutionDisplay;
