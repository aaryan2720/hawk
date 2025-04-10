
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    console.log("Database functions edge function called");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://eogwxywiidsnnlaybbdd.supabase.co"; 
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseServiceKey) {
      throw new Error("Missing Supabase service role key");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create verification_tokens table if it doesn't exist
    const createVerificationTokensSQL = `
      CREATE TABLE IF NOT EXISTS public.verification_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        email TEXT NOT NULL,
        token TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        type TEXT NOT NULL,
        is_verified BOOLEAN DEFAULT false NOT NULL
      );
      
      -- Add RLS policy
      ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;
      
      -- Create policy to allow users to see their own tokens
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = 'verification_tokens' 
              AND policyname = 'Users can view their own tokens'
          ) THEN
              CREATE POLICY "Users can view their own tokens" 
              ON public.verification_tokens 
              FOR SELECT 
              USING (auth.uid() = user_id);
          END IF;
      END
      $$;
    `;
    
    // Create the RPC function for verification tokens table
    const createVerificationTokensRPCSQL = `
      CREATE OR REPLACE FUNCTION public.create_verification_tokens_table()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY INVOKER
      AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.verification_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          email TEXT NOT NULL,
          token TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          type TEXT NOT NULL,
          is_verified BOOLEAN DEFAULT false NOT NULL
        );
        
        -- Add RLS policy
        ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;
        
        -- Create policy to allow users to see their own tokens
        BEGIN
            CREATE POLICY "Users can view their own tokens" 
            ON public.verification_tokens 
            FOR SELECT 
            USING (auth.uid() = user_id);
        EXCEPTION
            WHEN duplicate_object THEN
                -- Policy already exists
                NULL;
        END;
      END;
      $$;
    `;
    
    // Create the RPC function for inserting verification tokens
    const createInsertTokenRPCSQL = `
      CREATE OR REPLACE FUNCTION public.insert_verification_token(
        p_user_id UUID,
        p_email TEXT,
        p_token TEXT,
        p_expires_at TIMESTAMPTZ,
        p_type TEXT
      )
      RETURNS void
      LANGUAGE plpgsql
      SECURITY INVOKER
      AS $$
      BEGIN
        INSERT INTO public.verification_tokens (
          user_id, email, token, expires_at, type
        ) VALUES (
          p_user_id, p_email, p_token, p_expires_at, p_type
        );
      END;
      $$;
    `;
    
    // Create function to create all RPC functions
    const createRPCFunctionsSQL = `
      CREATE OR REPLACE FUNCTION public.create_rpc_functions()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY INVOKER
      AS $$
      BEGIN
        -- Create verification tokens table RPC
        CREATE OR REPLACE FUNCTION public.create_verification_tokens_table()
        RETURNS void
        LANGUAGE plpgsql
        SECURITY INVOKER
        AS $FUNC$
        BEGIN
          CREATE TABLE IF NOT EXISTS public.verification_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            email TEXT NOT NULL,
            token TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            type TEXT NOT NULL,
            is_verified BOOLEAN DEFAULT false NOT NULL
          );
          
          -- Add RLS policy
          ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;
          
          -- Create policy to allow users to see their own tokens
          BEGIN
              CREATE POLICY "Users can view their own tokens" 
              ON public.verification_tokens 
              FOR SELECT 
              USING (auth.uid() = user_id);
          EXCEPTION
              WHEN duplicate_object THEN
                  -- Policy already exists
                  NULL;
          END;
        END;
        $FUNC$;
        
        -- Create insert verification token RPC
        CREATE OR REPLACE FUNCTION public.insert_verification_token(
          p_user_id UUID,
          p_email TEXT,
          p_token TEXT,
          p_expires_at TIMESTAMPTZ,
          p_type TEXT
        )
        RETURNS void
        LANGUAGE plpgsql
        SECURITY INVOKER
        AS $FUNC$
        BEGIN
          INSERT INTO public.verification_tokens (
            user_id, email, token, expires_at, type
          ) VALUES (
            p_user_id, p_email, p_token, p_expires_at, p_type
          );
        END;
        $FUNC$;
      END;
      $$;
    `;
    
    // Execute SQL to create required tables and functions
    try {
      await supabase.rpc('create_rpc_functions');
      console.log("RPC functions already exist");
    } catch (e) {
      console.log("Creating RPC functions");
      const { error } = await supabase.sql(createRPCFunctionsSQL);
      if (error) {
        throw error;
      }
    }
    
    // Try to create the table directly as well
    try {
      const { error } = await supabase.sql(createVerificationTokensSQL);
      if (error) {
        throw error;
      }
    } catch (e) {
      console.log("Error creating verification tokens table directly:", e);
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "Database functions executed successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in database-functions:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

