
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
-- FINAL SQL TO SYNC ALL SECTORS (Scholars & Pioneers)
-- ==========================================================
-- Run this in Supabase SQL Editor to update your database:

-- 1. Update the category constraint to allow all 7 sectors
ALTER TABLE public.archive_categories 
DROP CONSTRAINT IF EXISTS archive_categories_section_type_check;

ALTER TABLE public.archive_categories 
ADD CONSTRAINT archive_categories_section_type_check 
CHECK (section_type IN (
  'POLITICS', 
  'JUDICIARY', 
  'SECURITY', 
  'BUSINESS', 
  'ARTS_CULTURE', 
  'THE_SCHOLARS', 
  'THE_PIONEERS'
));

-- 2. Insert initial categories for the new sectors
INSERT INTO public.archive_categories (category_name, section_type) VALUES 
('Academic Research', 'THE_SCHOLARS'),
('Science & Technology', 'THE_SCHOLARS'),
('Higher Education', 'THE_SCHOLARS'),
('National Founders', 'THE_PIONEERS'),
('Civil Rights Pioneers', 'THE_PIONEERS'),
('Sports Pioneers', 'THE_PIONEERS')
ON CONFLICT DO NOTHING;

-- 3. Ensure the home sectors table exists and is populated
CREATE TABLE IF NOT EXISTS public.archive_sectors (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.archive_sectors (id, title, description) VALUES 
('business', 'Business (Ganacsiga)', 'Tracking Somali entrepreneurship and corporate pioneers.'),
('arts_culture', 'Arts & Culture', 'Preserving the legacy of Somali artists and custodians.'),
('scholars', 'The Scholars (Aqoonyahanno)', 'Celebrating academic excellence and intellectual contributions.'),
('pioneers', 'The Pioneers', 'Honoring the trailblazers who laid the foundation of the nation.')
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title, 
  description = EXCLUDED.description;

-- 4. Enable RLS for public viewing
ALTER TABLE public.archive_sectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public View Sectors" ON public.archive_sectors;
CREATE POLICY "Public View Sectors" ON public.archive_sectors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin All Sectors" ON public.archive_sectors;
CREATE POLICY "Admin All Sectors" ON public.archive_sectors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
*/
