import { createClient } from '@supabase/supabase-js';

// Get these from import.meta.env
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
// Clean URL to avoid double slashes or extra paths that cause PGRST125
const supabaseUrl = rawUrl.replace(/\/$/, "").replace(/\/rest\/v1$/, "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANO || '';

// Always export a client, but warn if keys are missing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  if (!supabaseAnonKey && import.meta.env.VITE_SUPABASE_ANO) {
    console.info('ℹ️ Using VITE_SUPABASE_ANO as fallback for Anon Key.');
  }
}
