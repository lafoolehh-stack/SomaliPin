
import { createClient } from '@supabase/supabase-js';

// Hardcoded credentials to prevent environment variable crashes
const supabaseUrl = 'https://qewwautamhntxeiwpwcr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFld3dhdXRhbWhudHhlaXdwd2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzkwNjEsImV4cCI6MjA4MDQ1NTA2MX0.6JDlwuP06OXZu_bJ4eeC-_177AA50yDm0o_0Nb9uDMc';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing!');
}

// Export configuration status for App.tsx check
export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseKey);

/*
-- ==========================================================
-- SQL TO CREATE SECTORS TABLE (Labada Qaybood)
-- ==========================================================
-- Ku shub koodhkan SQL Editor-ka Supabase si aad u abuurto:

CREATE TABLE IF NOT EXISTS public.archive_sectors (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default values
INSERT INTO public.archive_sectors (id, title, description) VALUES 
('business', 'Business (Ganacsiga)', 'Tracking Somali entrepreneurship and corporate pioneers.'),
('arts_culture', 'Arts & Culture', 'Preserving the legacy of Somali artists and custodians.')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.archive_sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public View Sectors" ON public.archive_sectors FOR SELECT USING (true);
CREATE POLICY "Admin All Sectors" ON public.archive_sectors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================================
-- PARTNERS TABLE (Haddii aadan hore u abuurin)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public View Partners" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Admin All Partners" ON public.partners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================================
-- STORAGE POLICIES
-- ==========================================================
-- Abuur Bucket cusub: profile-pictures (ka dhig Public)
-- SQL for storage policies can be found in previous versions or Supabase UI.
*/
