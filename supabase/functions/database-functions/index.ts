
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
    console.log("Creating database functions for notifications...");
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );
    
    // Create a function to create notifications table
    const createNotificationsTableSql = `
    CREATE OR REPLACE FUNCTION public.create_notifications_table()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      -- Check if table exists
      IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      ) THEN
        -- Create notifications table
        CREATE TABLE public.notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          type TEXT NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          metadata JSONB
        );
        
        -- Enable Row Level Security
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own notifications" 
          ON public.notifications 
          FOR SELECT 
          USING (auth.uid() = user_id);
          
        CREATE POLICY "Users can insert their own notifications" 
          ON public.notifications 
          FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
          
        CREATE POLICY "Users can update their own notifications" 
          ON public.notifications 
          FOR UPDATE 
          USING (auth.uid() = user_id);
          
        -- Index for performance
        CREATE INDEX notifications_user_id_idx ON public.notifications(user_id);
        CREATE INDEX notifications_created_at_idx ON public.notifications(created_at);
      END IF;
    END;
    $$;
    `;
    
    // Function to create a test notification
    const createTestNotificationSql = `
    CREATE OR REPLACE FUNCTION public.create_test_notification(
      user_id_param UUID,
      title_param TEXT,
      content_param TEXT,
      type_param TEXT,
      is_read_param BOOLEAN,
      metadata_param JSONB
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      -- Ensure the notifications table exists
      PERFORM public.create_notifications_table();
      
      -- Insert the test notification
      INSERT INTO public.notifications (
        user_id, 
        title, 
        content, 
        type, 
        is_read, 
        metadata
      ) VALUES (
        user_id_param,
        title_param,
        content_param,
        type_param,
        is_read_param,
        metadata_param
      );
    END;
    $$;
    `;
    
    // Function to get user notifications
    const getUserNotificationsSql = `
    CREATE OR REPLACE FUNCTION public.get_user_notifications(
      user_id_param UUID
    )
    RETURNS SETOF public.notifications
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      -- Ensure the notifications table exists
      PERFORM public.create_notifications_table();
      
      -- Return the user's notifications
      RETURN QUERY
      SELECT * FROM public.notifications
      WHERE user_id = user_id_param
      ORDER BY created_at DESC
      LIMIT 10;
    END;
    $$;
    `;
    
    // Execute the SQL to create the functions
    const { error: fnError1 } = await supabaseClient.rpc('exec_sql', { 
      sql: createNotificationsTableSql 
    }).single();
    
    if (fnError1) {
      console.error('Error creating notifications table function:', fnError1);
      // Try direct SQL if RPC fails
      await supabaseClient.sql(createNotificationsTableSql);
    }
    
    const { error: fnError2 } = await supabaseClient.rpc('exec_sql', { 
      sql: createTestNotificationSql 
    }).single();
    
    if (fnError2) {
      console.error('Error creating test notification function:', fnError2);
      // Try direct SQL if RPC fails
      await supabaseClient.sql(createTestNotificationSql);
    }
    
    const { error: fnError3 } = await supabaseClient.rpc('exec_sql', { 
      sql: getUserNotificationsSql 
    }).single();
    
    if (fnError3) {
      console.error('Error creating get user notifications function:', fnError3);
      // Try direct SQL if RPC fails
      await supabaseClient.sql(getUserNotificationsSql);
    }
    
    // Create exec_sql function if it doesn't exist
    const createExecSqlFunction = `
    CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
    `;
    
    try {
      await supabaseClient.sql(createExecSqlFunction);
    } catch (err) {
      console.error('Error creating exec_sql function:', err);
    }
    
    // Manually create notifications table as a fallback
    try {
      await supabaseClient.rpc('create_notifications_table');
    } catch (createTableError) {
      console.error('Error calling create_notifications_table RPC:', createTableError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Database functions for notifications created successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in database-functions edge function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
