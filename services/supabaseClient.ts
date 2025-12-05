import { createClient } from '@supabase/supabase-js';

// Safe environment variable accessor
const getEnv = (key: string, defaultValue: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return defaultValue;
};

// NOTE: In a real production app, these should be in process.env
// For this environment, we assume the user will configure them or they are injected
const supabaseUrl = getEnv('SUPABASE_URL', 'https://xyzcompany.supabase.co');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY', 'public-anon-key');

// Check if the URL is still the default placeholder
export const isSupabaseConfigured = supabaseUrl !== 'https://xyzcompany.supabase.co' && supabaseUrl !== '';

// Create client with explicit auth storage configuration to avoid environment detection issues
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});