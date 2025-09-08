-- Migration: Static, named RLS policies for user_cvs
-- Date: 2025-09-08
-- Purpose:
--  - Replace multiple permissive/duplicated policies on user_cvs with a single policy per action
--    for role `authenticated`, using owner-based checks on user_id and SELECT-wrapped auth.uid().
--  - Remove prior policies (dynamic cleanup limited to this table) and enforce clear naming.

BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.user_cvs ENABLE ROW LEVEL SECURITY;

-- Drop known legacy policy names (no-op if absent)
DROP POLICY IF EXISTS "Users can manage their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Consolidated SELECT policy" ON public.user_cvs;
DROP POLICY IF EXISTS "Consolidated INSERT policy" ON public.user_cvs;
DROP POLICY IF EXISTS "Consolidated UPDATE policy" ON public.user_cvs;
DROP POLICY IF EXISTS "Consolidated DELETE policy" ON public.user_cvs;

-- Defensive cleanup: drop any remaining policies on this table (static scope with dynamic exec)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.polname
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'user_cvs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.polname, 'public', 'user_cvs');
  END LOOP;
END$$;

-- Create explicit, single policies per action
CREATE POLICY "user_cvs: authenticated can read own"
  ON public.user_cvs
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "user_cvs: authenticated can insert own"
  ON public.user_cvs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "user_cvs: authenticated can update own"
  ON public.user_cvs
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "user_cvs: authenticated can delete own"
  ON public.user_cvs
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

COMMIT;
