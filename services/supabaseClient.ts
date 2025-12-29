
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
-- XALKA TOOSKA AH (DIRECT FIX): "public.partners" ERROR
-- ==========================================================
-- 1. Aad Supabase Dashboard -> SQL Editor
-- 2. Ku shub koodhkan hoose si aad u abuurto miiska Partners:

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
-- STORAGE POLICIES (Loogu talagalay sawirrada):
-- ==========================================================
-- Abuur Bucket cusub: profile-pictures (ka dhig Public)

-- Oggolow in sawirrada la arki karo
CREATE POLICY "Allow Public View" ON storage.objects FOR SELECT USING (bucket_id = 'profile-pictures');

-- Oggolow in Interface-ka Admin-ka uu sawirro soo geliyo
CREATE POLICY "Allow Admin Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-pictures');

-- Oggolow in la beddelo ama la tirtiro
CREATE POLICY "Allow Admin Update" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-pictures');
CREATE POLICY "Allow Admin Delete" ON storage.objects FOR DELETE USING (bucket_id = 'profile-pictures');

-- ==========================================================
-- SQL FOR DOSSIERS:
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.dossiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT,
    bio TEXT,
    status TEXT DEFAULT 'Unverified',
    reputation_score INTEGER DEFAULT 0,
    image_url TEXT,
    category TEXT,
    verification_level TEXT DEFAULT 'Standard',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin All Dossiers" ON public.dossiers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
*/
