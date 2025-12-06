
import { createClient } from '@supabase/supabase-js';

// Supabase configuration with provided credentials
const supabaseUrl: string = 'https://qewwautamhntxeiwpwcr.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFld3dhdXRhbWhudHhlaXdwd2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzkwNjEsImV4cCI6MjA4MDQ1NTA2MX0.6JDlwuP06OXZu_bJ4eeC-_177AA50yDm0o_0Nb9uDMc';

// Check if the URL is valid (not empty and not the placeholder)
export const isSupabaseConfigured = supabaseUrl !== '' && supabaseUrl !== 'https://xyzcompany.supabase.co';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
