-- Migration: Enforce function search_path and move vector extension (verbose)
-- Date: 2025-09-08
-- Purpose:
--  - Fix Security Advisor warning 0011_function_search_path_mutable by setting
--    an immutable search_path on targeted functions, and (for defense-in-depth)
--    on all SECURITY DEFINER functions in the public schema.
--  - Move the vector extension to the `extensions` schema (0014_extension_in_public).
--
-- Notes:
--  - Idempotent: running multiple times is safe.
--  - Uses dynamic ALTER FUNCTION with discovered signatures to avoid aggregate conflicts.
--  - Other warnings (auth leaked password protection, Postgres upgrades) require
--    Dashboard actions and cannot be handled in SQL migrations.

-- 1) Secure search_path for targeted + SECURITY DEFINER functions in public
DO $$
DECLARE
  r RECORD;
  v_targets TEXT[] := ARRAY[
    'handle_updated_at',
    'update_updated_at_column',
    'log_translation_update',
    'trigger_set_timestamp',
    'log_translation_to_logs',
    'handle_new_user'
  ];
BEGIN
  FOR r IN
    SELECT
      n.nspname  AS schema,
      p.proname  AS name,
      pg_get_function_identity_arguments(p.oid) AS args,
      p.prosecdef AS is_security_definer
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f' -- function only (exclude aggregates/procedures/window)
      AND (
        p.proname = ANY(v_targets)
        OR p.prosecdef = TRUE
      )
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = '''';',
        r.schema, r.name, r.args
      );
      RAISE NOTICE 'Altered search_path for %.%(%)', r.schema, r.name, r.args;
    EXCEPTION WHEN OTHERS THEN
      -- Do not fail the migration if a specific function can't be altered
      RAISE NOTICE 'Skipped %.%(%) - %', r.schema, r.name, r.args, SQLERRM;
    END;
  END LOOP;
END
$$;

-- 2) Move vector extension to `extensions` schema (if present)
DO $$
BEGIN
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS extensions';
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    BEGIN
      EXECUTE 'ALTER EXTENSION vector SET SCHEMA extensions';
      RAISE NOTICE 'Moved extension vector to schema extensions';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped moving vector extension - %', SQLERRM;
    END;
  END IF;
END
$$;
