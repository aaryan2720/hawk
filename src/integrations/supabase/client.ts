
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://eogwxywiidsnnlaybbdd.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZ3d4eXdpaWRzbm5sYXliYmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyODAwOTAsImV4cCI6MjA1Njg1NjA5MH0.hfDAUf0FFv8OI2t5oCw-PksoLBgz3r792nkMpTAuwC4";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Add a helper function to check connection
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('systems').select('id').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
