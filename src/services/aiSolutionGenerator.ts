
import { supabase } from '@/integrations/supabase/client';
import { Alert } from '@/types';

export interface GeneratedSolution {
  id: string;
  alertId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'immediate' | 'patch' | 'configuration' | 'monitoring';
  steps: SolutionStep[];
  prerequisites: string[];
  createdAt: string;
}

export interface SolutionStep {
  id: number;
  title: string;
  description: string;
  action: string;
  commands?: string[];
  expectedResult: string;
  troubleshooting?: string;
  isCompleted?: boolean;
}

export class AISolutionGenerator {
  private static async callAIService(prompt: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-solution-generator', {
        body: { prompt }
      });

      if (error) throw error;
      return data.solution;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate AI solution');
    }
  }

  private static parseAISolution(aiResponse: string, alert: Alert): GeneratedSolution {
    try {
      // Parse the AI response (assuming it returns structured JSON)
      const parsed = JSON.parse(aiResponse);
      
      return {
        id: `solution-${alert.id}-${Date.now()}`,
        alertId: alert.id,
        title: parsed.title || `Solution for ${alert.title}`,
        description: parsed.description || 'AI-generated solution steps',
        severity: alert.severity,
        estimatedTime: parsed.estimatedTime || this.estimateTime(alert.severity),
        difficulty: parsed.difficulty || this.estimateDifficulty(alert.severity),
        category: parsed.category || this.categorizeByAlert(alert),
        steps: parsed.steps || [],
        prerequisites: parsed.prerequisites || [],
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing AI solution:', error);
      return this.generateFallbackSolution(alert);
    }
  }

  private static estimateTime(severity: string): string {
    switch (severity) {
      case 'critical': return '30-60 minutes';
      case 'high': return '1-2 hours';
      case 'medium': return '2-4 hours';
      default: return '1-3 hours';
    }
  }

  private static estimateDifficulty(severity: string): 'beginner' | 'intermediate' | 'advanced' {
    switch (severity) {
      case 'critical': return 'intermediate';
      case 'high': return 'intermediate';
      case 'medium': return 'beginner';
      default: return 'beginner';
    }
  }

  private static categorizeByAlert(alert: Alert): 'immediate' | 'patch' | 'configuration' | 'monitoring' {
    if (alert.severity === 'critical') return 'immediate';
    if (alert.cve) return 'patch';
    if (alert.system.toLowerCase().includes('config')) return 'configuration';
    return 'monitoring';
  }

  private static generateFallbackSolution(alert: Alert): GeneratedSolution {
    const steps: SolutionStep[] = [
      {
        id: 1,
        title: 'Assess the Risk',
        description: 'Evaluate the impact of this vulnerability on your system',
        action: 'Check if your system is affected by this vulnerability',
        expectedResult: 'Understanding of vulnerability impact',
        troubleshooting: 'If unsure, contact your system administrator'
      },
      {
        id: 2,
        title: 'Apply Security Patch',
        description: 'Install the latest security updates',
        action: 'Download and install the recommended patch',
        commands: alert.patchLink ? [`Visit: ${alert.patchLink}`] : undefined,
        expectedResult: 'System updated with security patch',
        troubleshooting: 'If patch fails, check system requirements'
      },
      {
        id: 3,
        title: 'Verify Fix',
        description: 'Confirm the vulnerability has been resolved',
        action: 'Test your system to ensure the fix is working',
        expectedResult: 'Vulnerability no longer present',
        troubleshooting: 'If issue persists, repeat previous steps'
      }
    ];

    return {
      id: `solution-${alert.id}-${Date.now()}`,
      alertId: alert.id,
      title: `Security Solution for ${alert.title}`,
      description: 'Step-by-step guide to resolve this security issue',
      severity: alert.severity,
      estimatedTime: this.estimateTime(alert.severity),
      difficulty: this.estimateDifficulty(alert.severity),
      category: this.categorizeByAlert(alert),
      steps,
      prerequisites: ['Administrative access', 'System backup recommended'],
      createdAt: new Date().toISOString()
    };
  }

  public static async generateSolution(alert: Alert): Promise<GeneratedSolution> {
    const prompt = this.buildPrompt(alert);
    
    try {
      const aiResponse = await this.callAIService(prompt);
      return this.parseAISolution(aiResponse, alert);
    } catch (error) {
      console.warn('AI generation failed, using fallback:', error);
      return this.generateFallbackSolution(alert);
    }
  }

  private static buildPrompt(alert: Alert): string {
    return `
Generate a step-by-step solution for this security vulnerability:

Title: ${alert.title}
Description: ${alert.description}
Severity: ${alert.severity}
System: ${alert.system}
CVE: ${alert.cve || 'N/A'}

Requirements:
1. Create 3-6 clear, actionable steps
2. Use simple language for non-technical users
3. Include expected results for each step
4. Add troubleshooting tips
5. Specify prerequisites
6. Estimate difficulty and time

Return as JSON with this structure:
{
  "title": "Solution title",
  "description": "Brief description",
  "estimatedTime": "time estimate",
  "difficulty": "beginner/intermediate/advanced",
  "category": "immediate/patch/configuration/monitoring",
  "prerequisites": ["requirement1", "requirement2"],
  "steps": [
    {
      "id": 1,
      "title": "Step title",
      "description": "What this step does",
      "action": "Specific action to take",
      "commands": ["command1", "command2"],
      "expectedResult": "What should happen",
      "troubleshooting": "If something goes wrong"
    }
  ]
}
    `;
  }
}
