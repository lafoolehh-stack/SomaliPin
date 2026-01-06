
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
-- FINAL SQL TO FIX CHECK CONSTRAINT ERROR & ADD NEW SECTORS
-- ==========================================================
-- Run this in Supabase SQL Editor:

-- 1. Drop the old constraint
ALTER TABLE public.archive_categories 
DROP CONSTRAINT IF EXISTS archive_categories_section_type_check;

-- 2. Add the updated constraint including THE_SCHOLARS and THE_PIONEERS
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

-- 3. Insert initial categories for the new sectors
INSERT INTO public.archive_categories (category_name, section_type) VALUES 
('Academic Research', 'THE_SCHOLARS'),
('Higher Education', 'THE_SCHOLARS'),
('National Founders', 'THE_PIONEERS'),
('Civil Rights Pioneers', 'THE_PIONEERS')
ON CONFLICT DO NOTHING;

-- 4. Update the archive_sectors table for homepage metadata
INSERT INTO public.archive_sectors (id, title, description) VALUES 
('business', 'Business (Ganacsiga)', 'Tracking Somali entrepreneurship and corporate pioneers.'),
('arts_culture', 'Arts & Culture', 'Preserving the legacy of Somali artists and custodians.'),
('scholars', 'The Scholars (Aqoonyahanno)', 'Celebrating academic excellence and intellectual contributions.'),
('pioneers', 'The Pioneers', 'Honoring the trailblazers who laid the foundation of the nation.')
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title, 
  description = EXCLUDED.description;
*/
