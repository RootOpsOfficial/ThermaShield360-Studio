import { createClient } from '@supabase/supabase-js';

// Public Supabase configuration for browser clients.
// Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
// Never exposes service_role key to the frontend.
const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://pdrcrtlihvscwzzmrbqn.supabase.co';

const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
