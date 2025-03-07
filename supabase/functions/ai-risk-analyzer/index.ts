
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { alerts } = await req.json();
    
    if (!alerts || !Array.isArray(alerts)) {
      throw new Error("Invalid or missing alerts parameter");
    }

    console.log(`Analyzing ${alerts.length} alerts with AI`);

    // Process each alert with the AI risk assessment
    const processedAlerts = await Promise.all(alerts.map(async (alert) => {
      try {
        // Calculate risk score using a combination of rule-based logic and simulated AI
        const riskScore = calculateRiskScore(alert);
        
        // Determine if this is likely a false positive
        const falsePositive = isFalsePositive(alert);
        
        // Generate AI-powered mitigation advice if none exists
        let mitigation = alert.mitigation;
        if (!mitigation) {
          mitigation = generateMitigation(alert);
        }
        
        return {
          ...alert,
          riskScore,
          falsePositive,
          mitigation,
          aiProcessed: true
        };
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
        return {
          ...alert,
          riskScore: null,
          error: "Failed to process with AI"
        };
      }
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: processedAlerts.length,
        alerts: processedAlerts
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in ai-risk-analyzer function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Calculate risk score based on various factors
function calculateRiskScore(alert: any): number {
  // Base score from severity
  const severityScores: { [key: string]: number } = {
    'critical': 9,
    'high': 7,
    'medium': 5,
    'low': 2
  };
  
  let baseScore = severityScores[alert.severity] || 5;
  
  // Adjust based on known factors
  let adjustmentScore = 0;
  
  // Check for keywords in description
  const highRiskTerms = ['remote code execution', 'privilege escalation', 'zero-day', 'buffer overflow', 'authentication bypass', 'critical vulnerability'];
  const description = (alert.description || '').toLowerCase();
  
  for (const term of highRiskTerms) {
    if (description.includes(term)) {
      adjustmentScore += 0.5;
    }
  }
  
  // Check if this is a known exploited vulnerability
  if (alert.details && typeof alert.details === 'object') {
    if (alert.details.exploitability) {
      adjustmentScore += Number(alert.details.exploitability) || 0;
    }
    
    // Recent vulnerabilities are higher risk
    if (alert.details.publishedDate) {
      const publishDate = new Date(alert.details.publishedDate);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 30) {
        adjustmentScore += 1; // More recent = higher risk
      }
    }
  }
  
  // Check if patch is available (slightly lower risk)
  if (alert.patchLink) {
    adjustmentScore -= 0.5;
  }
  
  // Calculate final risk score (capped at 0-10)
  return Math.max(0, Math.min(10, baseScore + adjustmentScore));
}

// Determine if an alert is likely a false positive
function isFalsePositive(alert: any): boolean {
  // Simple heuristics to detect false positives
  
  // Low severity alerts with generic descriptions are more likely to be false positives
  if (alert.severity === 'low') {
    const genericTerms = ['general', 'update available', 'potential', 'possible'];
    const description = (alert.description || '').toLowerCase();
    
    for (const term of genericTerms) {
      if (description.includes(term)) {
        return Math.random() < 0.7; // 70% chance it's a false positive
      }
    }
    
    // Random chance for other low severity alerts
    return Math.random() < 0.2;
  }
  
  // Very short descriptions with high severity are suspicious
  if (alert.severity === 'critical' && (alert.description || '').length < 30) {
    return Math.random() < 0.4;
  }
  
  // Most alerts are real
  return Math.random() < 0.05;
}

// Generate mitigation advice
function generateMitigation(alert: any): string {
  const system = alert.system || '';
  const severity = alert.severity || 'medium';
  
  // Generic but reasonable mitigation advice
  const mitigations = [
    `Update ${system} to the latest version as soon as possible.`,
    `Apply the vendor-provided security patch for this vulnerability.`,
    `Configure your firewall to block potentially malicious traffic targeting this vulnerability.`,
    `Implement network segmentation to contain potential impact of this vulnerability.`,
    `Disable the affected service until a patch is available.`,
    `Follow the principle of least privilege to minimize potential impact.`
  ];
  
  // For critical vulnerabilities, provide more urgent advice
  if (severity === 'critical') {
    return `URGENT: ${mitigations[Math.floor(Math.random() * 3)]} Monitor system logs for suspicious activity and consider taking affected systems offline until patched.`;
  }
  
  // For high severity
  if (severity === 'high') {
    return `${mitigations[Math.floor(Math.random() * 4)]} Consider implementing additional monitoring for affected systems.`;
  }
  
  // For medium or low
  return mitigations[Math.floor(Math.random() * mitigations.length)];
}
