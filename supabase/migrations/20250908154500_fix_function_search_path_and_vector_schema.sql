-- Migration: Fix function search_path and move vector extension schema
-- Date: 2025-09-08
-- Notes:
-- - This migration enforces a secure, role-immutable search_path on a set of public functions
--   flagged by the Supabase Security Advisor (0011_function_search_path_mutable).
-- - It also moves the `vector` extension into the `extensions` schema if present, as
--   recommended to avoid the "Extension in Public" warning (0014_extension_in_public).
-- - The other advisor items (auth leaked password protection, Postgres upgrade) cannot be
--   addressed via SQL and must be configured in the Dashboard.

-- 1) Secure search_path for specific functions reported by Security Advisor
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT
      n.nspname  AS schema,
      p.proname  AS name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'  -- function (excludes aggregates, procedures, window functions)
      AND p.proname IN (
        'handle_updated_at',
        'update_updated_at_column',
        'log_translation_update',
        'trigger_set_timestamp',
        'log_translation_to_logs',
        'handle_new_user'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = '''';',
      r.schema, r.name, r.args
    );
  END LOOP;
END
$$;

-- 2) Move the vector extension out of public into extensions (idempotent)
DO $$
BEGIN
  -- Ensure target schema exists
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS extensions';

  -- Only try to move if the extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    BEGIN
      EXECUTE 'ALTER EXTENSION vector SET SCHEMA extensions';
    EXCEPTION WHEN others THEN
      -- Ignore if already in target schema or insufficient privileges in this context
      NULL;
    END;
  END IF;
END
$$;
