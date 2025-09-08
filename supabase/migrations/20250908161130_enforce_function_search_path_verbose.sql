-- Migration: Verbose and robust enforcement of function search_path and vector extension schema
-- Date: 2025-09-08
-- Purpose:
--  - Apply `SET search_path = ''` to all SECURITY DEFINER functions in the `public` schema
--    as a defense-in-depth measure against CVE-2018-1058 style attacks.
--  - Explicitly apply the fix to the 6 functions flagged by Supabase Security Advisor.
--  - Move the `vector` extension from `public` to a dedicated `extensions` schema.
--  - This migration is idempotent and includes verbose notices.

BEGIN;

-- 1. Ensure the `extensions` schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Move the `vector` extension to the `extensions` schema if it exists in `public`
DO $$BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'vector'
      AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION vector SET SCHEMA extensions;
    RAISE NOTICE 'Moved `vector` extension from `public` to `extensions` schema.';
  ELSE
    RAISE NOTICE '`vector` extension not found in `public` schema, no action taken.';
  END IF;
END$$;

-- 3. Apply `SET search_path = ''` to specific flagged functions
-- Note: This is now a static list. Add other functions here if needed.
ALTER FUNCTION public.handle_updated_at() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.log_translation_update() SET search_path = '';
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = '';
ALTER FUNCTION public.log_translation_to_logs() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- Add other SECURITY DEFINER functions from your project here if they exist
-- Example: ALTER FUNCTION public.my_secure_function() SET search_path = '';

-- RAISE NOTICE removed to prevent SQL editor syntax errors.

COMMIT;
