-- Migration: Static, named RLS policies for translations
-- Date: 2025-09-08
-- Purpose:
--  - Replace multiple permissive/duplicated policies on translations with clear, single policies per action.
--  - Allow public read access (typical for application i18n), restrict mutations to admins only.
--  - Use SELECT-wrapped calls to avoid initplan overhead.

BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Drop known legacy policy names (no-op if absent)
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.translations;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.translations;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.translations;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.translations;
DROP POLICY IF EXISTS "Allow update translations for authenticated users" ON public.translations;
DROP POLICY IF EXISTS "Allow delete translations for authenticated users" ON public.translations;
DROP POLICY IF EXISTS "Allow read translations for authenticated users" ON public.translations;
DROP POLICY IF EXISTS "Allow insert translations for authenticated users" ON public.translations;
DROP POLICY IF EXISTS "Consolidated SELECT policy" ON public.translations;
DROP POLICY IF EXISTS "Consolidated INSERT policy" ON public.translations;
DROP POLICY IF EXISTS "Consolidated UPDATE policy" ON public.translations;
DROP POLICY IF EXISTS "Consolidated DELETE policy" ON public.translations;

-- Defensive cleanup: drop any remaining policies on this table
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.polname
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'translations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.polname, 'public', 'translations');
  END LOOP;
END$$;

-- Create explicit policies
-- Public read (no per-row overhead)
CREATE POLICY "translations: public can read"
  ON public.translations
  FOR SELECT
  TO public
  USING (true);

-- Admin-only mutations (authenticated + admin check)
CREATE POLICY "translations: admin can insert"
  ON public.translations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin((SELECT auth.uid())));

CREATE POLICY "translations: admin can update"
  ON public.translations
  FOR UPDATE
  TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

CREATE POLICY "translations: admin can delete"
  ON public.translations
  FOR DELETE
  TO authenticated
  USING (public.is_admin((SELECT auth.uid())));

COMMIT;
