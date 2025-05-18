
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EmailService } from "./email-service.ts";
import { SMSService } from "./sms-service.ts";
import { NotificationHandlers } from "./notification-handlers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the auth context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Initialize SendGrid with API key
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    const emailService = new EmailService(SENDGRID_API_KEY);

    // Initialize Twilio SMS service
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    console.log("Twilio configuration:", {
      hasAccountSid: Boolean(TWILIO_ACCOUNT_SID),
      hasAuthToken: Boolean(TWILIO_AUTH_TOKEN),
      hasPhoneNumber: Boolean(TWILIO_PHONE_NUMBER)
    });
    
    const smsService = new SMSService(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER);
    
    // Create handlers instance with both email and SMS services
    const handlers = new NotificationHandlers(supabase, emailService, smsService);
    
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('Request body:', JSON.stringify(body));
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Extract user information from the request body
    const { userId, action, email } = body;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId in request' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Handle different actions
    if (action === 'verify-email') {
      // Auto-verify email and send welcome notification instead
      return await handlers.handleAutoVerification(userId, email);
    } else if (action === 'test-notification') {
      return await handlers.handleTestNotification(userId, body);
    } else {
      // Default behavior: send notification about scan results
      return await handlers.handleScanNotification(body);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        status: 500, 
        headers: corsHeaders
      }
    );
  }
});
