
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
-- SQL TO FIX 'archive_categories_section_type_check' ERROR
-- ==========================================================
-- Run this if you see "violates check constraint" error:

ALTER TABLE public.archive_categories 
DROP CONSTRAINT IF EXISTS archive_categories_section_type_check;

ALTER TABLE public.archive_categories 
ADD CONSTRAINT archive_categories_section_type_check 
CHECK (section_type IN ('POLITICS', 'JUDICIARY', 'SECURITY', 'BUSINESS', 'ARTS_CULTURE'));

INSERT INTO public.archive_categories (category_name, section_type) VALUES 
('Commercial Banks', 'BUSINESS'),
('Telecommunications', 'BUSINESS'),
('Traditional Music', 'ARTS_CULTURE'),
('Somali Literature', 'ARTS_CULTURE')
ON CONFLICT DO NOTHING;

-- ==========================================================
-- SQL TO FIX 'public.archive_sectors' ERROR
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.archive_sectors (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.archive_sectors (id, title, description) VALUES 
('business', 'Business (Ganacsiga)', 'Tracking Somali entrepreneurship and corporate pioneers.'),
('arts_culture', 'Arts & Culture', 'Preserving the legacy of Somali artists and custodians.')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.archive_sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public View Sectors" ON public.archive_sectors FOR SELECT USING (true);
CREATE POLICY "Admin All Sectors" ON public.archive_sectors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
*/
