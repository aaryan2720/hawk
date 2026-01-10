
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { message, conversation = [], isSystemPrompt = false } = await req.json();
    
    // Get Gemini API key from environment variables
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (!apiKey) {
      console.log("GEMINI_API_KEY not found, using mock response");
      
      const mockResponse = `I'm your HAWK Security assistant. I can help you with security vulnerabilities, risk assessment, 
      and understanding security alerts. Is there a specific security concern you'd like to discuss?`;
      
      // Return mock response when API key is missing
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: mockResponse,
          conversation: [
            ...conversation,
            {
              role: "user",
              parts: [{ text: message }]
            },
            {
              role: "model",
              parts: [{ text: mockResponse }]
            }
          ],
          isMock: true
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
    
    // Handle system prompt differently
    if (isSystemPrompt) {
      console.log("Processing system prompt for context learning");
      // For system prompts, we start a fresh conversation with just the system message
      parts.length = 0;
      parts.push({
        role: "user",
        parts: [{ text: "Please use the following context information for our conversation: " + message }]
      });
      
      // Add a helper message to get confirmation
      parts.push({
        role: "model",
        parts: [{ text: "I'll incorporate this context into our conversation. How can I assist you with HAWK Security today?" }]
      });
    } else {
      // Add the user's new message for normal conversations
      if (message) {
        parts.push({
          role: "user",
          parts: [{ text: message }]
        });
      }
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
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received response from Gemini API");
      
      // Extract the response text
      let responseText = "I'm having trouble understanding that. Could you try rephrasing?";
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        responseText = data.candidates[0].content.parts[0].text;
      }
      
      // If this is a system prompt, we don't add the response to the conversation history
      // since it's just for context learning
      if (!isSystemPrompt) {
        // Add the AI response to the conversation history for normal conversations
        parts.push({
          role: "model",
          parts: [{ text: responseText }]
        });
      }
      
      // Return the response
      return new Response(
        JSON.stringify({
          success: true,
          message: isSystemPrompt ? "" : responseText, // Don't return the system prompt response to UI
          conversation: parts
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (apiError) {
      console.error("API request error:", apiError);
      
      // Return error response instead of mock response
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Failed to connect to Gemini API. Please check your API key and try again.",
          errorType: "api_error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in Gemini chat function:", error);
    
    // Return a user-friendly error response
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Something went wrong with the chat service. Please try again.",
        errorType: "general_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
