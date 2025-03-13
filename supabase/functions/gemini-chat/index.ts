
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { message, conversation = [] } = await req.json();
    
    // Get Gemini API key from environment variables
    const apiKey = Deno.env.get("GEMINI_API_KEY") || (process.env && process.env.GEMINI_API_KEY);
    
    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in environment variables");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "API key not configured. Please add GEMINI_API_KEY to Edge Function secrets.",
          errorType: "missing_api_key"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log("Processing request for Gemini chatbot...");
    
    // Format the conversation history for Gemini API
    const parts = [...conversation];
    
    // Add the user's new message
    if (message) {
      parts.push({
        role: "user",
        parts: [{ text: message }]
      });
    }
    
    try {
      // Make request to Gemini API
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: parts,
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 1000,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Gemini API error:", errorData);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Gemini API error: ${response.status} ${response.statusText}`,
            details: errorData,
            errorType: "api_error"
          }),
          {
            status: 200, // Return 200 to client even though API failed
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const data = await response.json();
      console.log("Received response from Gemini API");
      
      // Extract the response text
      let responseText = "No response generated";
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        responseText = data.candidates[0].content.parts[0].text;
      }
      
      // Add the AI response to the conversation history
      parts.push({
        role: "model",
        parts: [{ text: responseText }]
      });
      
      // Return the response
      return new Response(
        JSON.stringify({
          success: true,
          message: responseText,
          conversation: parts
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (apiError) {
      console.error("API request error:", apiError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to communicate with Gemini API: ${apiError.message}`,
          errorType: "api_request_error"
        }),
        {
          status: 200, // Return 200 to client even though there was an error
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in Gemini chat function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        errorType: "general_error"
      }),
      {
        status: 200, // Return 200 to client
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
