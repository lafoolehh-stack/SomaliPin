import { createClient } from '@supabase/supabase-js';

// NOTE: In a real production app, these should be in process.env
// For this environment, we assume the user will configure them or they are injected
const supabaseUrl = process.env.SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'public-anon-key';

// Check if the URL is still the default placeholder
export const isSupabaseConfigured = supabaseUrl !== 'https://xyzcompany.supabase.co' && supabaseUrl !== '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);