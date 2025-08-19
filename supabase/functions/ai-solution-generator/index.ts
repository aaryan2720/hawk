
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Generating AI solution for vulnerability...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a cybersecurity expert who analyzes specific vulnerabilities and provides accurate, actionable solutions.

            For each vulnerability analysis, you must:
            1. Identify the SPECIFIC vulnerability type and attack vector
            2. Explain the ACTUAL security risk and potential impact
            3. Provide LEGITIMATE, tested remediation steps
            4. Include specific commands, configurations, or patches where applicable
            5. Reference official security advisories, CVE databases, or vendor documentation when possible

            CRITICAL REQUIREMENTS:
            - NO generic or placeholder content
            - NO "example" or "dummy" solutions
            - ONLY provide solutions that are technically accurate and have been verified
            - If you cannot provide specific technical details, clearly state the limitation
            - Include verification steps to confirm the fix works
            - Prioritize official vendor patches and documented best practices

            Return ONLY valid JSON with this exact structure:
            {
              "title": "Specific vulnerability name",
              "description": "Brief technical description of the vulnerability and its impact",
              "category": "immediate|patch|configuration|monitoring",
              "difficulty": "beginner|intermediate|advanced",
              "estimatedTime": "X minutes/hours",
              "vulnerabilityDetails": {
                "attackVector": "How this vulnerability can be exploited",
                "impact": "Specific security impact and consequences",
                "affectedSystems": "Which systems/versions are vulnerable"
              },
              "prerequisites": ["specific requirements"],
              "steps": [
                {
                  "id": 1,
                  "title": "Step title",
                  "description": "What this step accomplishes",
                  "action": "Specific action to take",
                  "commands": ["actual commands if applicable"],
                  "expectedResult": "What should happen after this step",
                  "troubleshooting": "Common issues and solutions"
                }
              ]
            }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const solution = data.choices[0]?.message?.content;

    if (!solution) {
      throw new Error('No solution generated');
    }

    // Try to parse the JSON response
    let parsedSolution;
    try {
      parsedSolution = JSON.parse(solution);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return a structured response even if JSON parsing fails
      parsedSolution = {
        title: "Analysis Failed",
        description: "Unable to generate structured solution",
        rawResponse: solution
      };
    }

    console.log('AI solution generated successfully');

    return new Response(
      JSON.stringify({ solution: parsedSolution }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-solution-generator:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: true 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
