
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPEmailService } from "./smtp-email-service.ts";
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
    console.log("=== Edge Function Started ===");
    
    // Create a Supabase client with the auth context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client created successfully");
    
    // Initialize SMTP Email Service
    const emailService = new SMTPEmailService();
    console.log("SMTP Email Service initialized");

    // Initialize SMS service
    const smsService = new SMSService();
    console.log("SMS Service initialized");
    
    // Create handlers instance with SMTP email service
    const handlers = new NotificationHandlers(supabase, emailService, smsService);
    console.log("Notification handlers created");
    
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('Request body received:', JSON.stringify(body, null, 2));
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Extract user information from the request body
    const { userId, action, email } = body;
    
    if (!userId) {
      console.error('Missing userId in request');
      return new Response(
        JSON.stringify({ error: 'Missing userId in request' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`Processing action: ${action} for user: ${userId}`);
    
    // Handle different actions
    if (action === 'verify-email') {
      console.log('Handling email verification');
      return await handlers.handleAutoVerification(userId, email);
    } else if (action === 'test-notification') {
      console.log('Handling test notification');
      return await handlers.handleTestNotification(userId, body);
    } else {
      console.log('Handling scan notification');
      return await handlers.handleScanNotification(body);
    }
  } catch (error) {
    console.error('=== Edge Function Error ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: 'Check edge function logs for more information'
      }),
      { 
        status: 500, 
        headers: corsHeaders
      }
    );
  }
});
