
import { supabase } from '@/integrations/supabase/client';
import { Alert } from '@/types';

export interface VulnerabilityDetails {
  attackVector: string;
  impact: string;
  affectedSystems: string;
}

export interface SolutionStep {
  id: number;
  title: string;
  description: string;
  action: string;
  commands?: string[];
  expectedResult: string;
  troubleshooting?: string;
}

export interface GeneratedSolution {
  title: string;
  description: string;
  category: 'immediate' | 'patch' | 'configuration' | 'monitoring';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  vulnerabilityDetails: VulnerabilityDetails;
  prerequisites: string[];
  steps: SolutionStep[];
}

export class AISolutionGenerator {
  static async generateSolution(alert: Alert): Promise<GeneratedSolution> {
    try {
      // Create a comprehensive prompt with specific vulnerability details
      const prompt = this.createVulnerabilityPrompt(alert);
      
      console.log('Calling AI solution generator with prompt:', prompt);
      
      const { data, error } = await supabase.functions.invoke('ai-solution-generator', {
        body: { prompt }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Failed to generate solution: ${error.message}`);
      }

      if (!data?.solution) {
        throw new Error('No solution received from AI generator');
      }

      // Validate the solution structure
      const solution = this.validateSolution(data.solution);
      
      return solution;
    } catch (error) {
      console.error('Error generating AI solution:', error);
      throw new Error(`Solution generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static createVulnerabilityPrompt(alert: Alert): string {
    return `
VULNERABILITY ANALYSIS REQUEST:

Title: ${alert.title}
Description: ${alert.description}
Severity: ${alert.severity}
Affected System: ${alert.system}
CVE: ${alert.cve || 'Not specified'}

DETAILED REQUIREMENTS:
1. Analyze this SPECIFIC vulnerability, not generic security practices
2. If this is a known CVE, provide details from the CVE database
3. Explain the exact attack vector and exploitation method
4. Provide the real security impact and business risk
5. Give step-by-step technical remediation that actually works
6. Include specific commands, patches, or configuration changes
7. Provide verification steps to confirm the fix
8. If you cannot provide specific details due to insufficient information, clearly state what additional information is needed

CONTEXT:
- This appears to be affecting: ${alert.system}
- Current status: ${alert.status}
${alert.mitigation ? `- Existing mitigation info: ${alert.mitigation}` : ''}
${alert.patchLink ? `- Patch available at: ${alert.patchLink}` : ''}

Provide a comprehensive, technically accurate solution that security professionals can immediately implement.
    `.trim();
  }

  private static validateSolution(solution: any): GeneratedSolution {
    // Provide fallback structure if AI response is incomplete
    const defaultSolution: GeneratedSolution = {
      title: solution.title || 'Vulnerability Analysis',
      description: solution.description || 'Security vulnerability requiring attention',
      category: solution.category || 'configuration',
      difficulty: solution.difficulty || 'intermediate',
      estimatedTime: solution.estimatedTime || '1-2 hours',
      vulnerabilityDetails: {
        attackVector: solution.vulnerabilityDetails?.attackVector || 'Attack vector analysis pending - additional technical details needed',
        impact: solution.vulnerabilityDetails?.impact || 'Security impact assessment required',
        affectedSystems: solution.vulnerabilityDetails?.affectedSystems || 'System impact analysis needed'
      },
      prerequisites: solution.prerequisites || ['System administrator access', 'Backup of current configuration'],
      steps: solution.steps || [
        {
          id: 1,
          title: 'Initial Assessment',
          description: 'Evaluate the current vulnerability status',
          action: 'Review system logs and current security posture to understand the vulnerability scope',
          expectedResult: 'Clear understanding of vulnerability impact on your specific environment',
          troubleshooting: 'If logs are unclear, check with your security team for additional context'
        },
        {
          id: 2,
          title: 'Apply Security Measures',
          description: 'Implement immediate protective measures',
          action: 'Follow vendor-specific security guidelines and apply available patches or workarounds',
          expectedResult: 'Vulnerability is mitigated according to security best practices',
          troubleshooting: 'Contact vendor support if patches fail to apply or cause system issues'
        }
      ]
    };

    // Ensure all steps have required fields
    if (defaultSolution.steps) {
      defaultSolution.steps = defaultSolution.steps.map((step, index) => ({
        id: step.id || index + 1,
        title: step.title || `Security Step ${index + 1}`,
        description: step.description || 'Security remediation step',
        action: step.action || 'Follow security best practices for this vulnerability type',
        commands: step.commands || undefined,
        expectedResult: step.expectedResult || 'Security improvement implemented',
        troubleshooting: step.troubleshooting || 'Contact your security team if issues arise'
      }));
    }

    return defaultSolution;
  }
}
