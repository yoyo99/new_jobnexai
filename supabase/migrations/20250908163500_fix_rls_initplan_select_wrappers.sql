-- Migration: Fix RLS initplan by wrapping auth.* and current_setting() calls with SELECT subqueries
-- Date: 2025-09-08
-- Purpose:
--  - Avoid per-row re-evaluation/initplan for auth.* and current_setting() inside RLS policies,
--    as recommended by Supabase docs (use (select auth.uid()) etc.).
--  - This script dynamically finds affected policies in the public schema, drops them, and
--    recreates them with equivalent expressions where occurrences of:
--        auth.uid()                -> (select auth.uid())
--        current_setting( ... )    -> (select current_setting( ... ))
--    are replaced in USING and WITH CHECK expressions.
--  - Idempotent: if no replacement is needed, the policy is skipped.

DO $$
DECLARE
  r RECORD;
  v_roles TEXT;
  v_cmd   TEXT;
  v_mode  TEXT;
  v_using TEXT;
  v_check TEXT;
  v_new_using TEXT;
  v_new_check TEXT;
BEGIN
  FOR r IN
    SELECT
      p.oid                               AS pol_oid,
      n.nspname                           AS schema,
      c.relname                           AS table_name,
      p.polname                           AS policy_name,
      p.polcmd                            AS polcmd,
      p.polpermissive                     AS polpermissive,
      p.polroles                          AS polroles,
      pg_get_expr(p.polqual, p.polrelid)        AS using_expr,
      pg_get_expr(p.polwithcheck, p.polrelid)   AS withcheck_expr
    FROM pg_policy p
    JOIN pg_class  c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND (
        (p.polqual IS NOT NULL AND (pg_get_expr(p.polqual, p.polrelid) ~ 'auth\.' OR pg_get_expr(p.polqual, p.polrelid) ~ 'current_setting\('))
        OR
        (p.polwithcheck IS NOT NULL AND (pg_get_expr(p.polwithcheck, p.polrelid) ~ 'auth\.' OR pg_get_expr(p.polwithcheck, p.polrelid) ~ 'current_setting\('))
      )
  LOOP
    v_using := r.using_expr;
    v_check := r.withcheck_expr;

    v_new_using := v_using;
    v_new_check := v_check;

    IF v_new_using IS NOT NULL THEN
      -- Replace auth.* calls (specifically uid()) and current_setting()
      v_new_using := replace(v_new_using, 'auth.uid()', '(select auth.uid())');
      v_new_using := regexp_replace(v_new_using, 'current_setting\(', '(select current_setting(', 'g');
    END IF;

    IF v_new_check IS NOT NULL THEN
      v_new_check := replace(v_new_check, 'auth.uid()', '(select auth.uid())');
      v_new_check := regexp_replace(v_new_check, 'current_setting\(', '(select current_setting(', 'g');
    END IF;

    -- If nothing changed, skip this policy
    IF (v_new_using IS NOT DISTINCT FROM v_using) AND (v_new_check IS NOT DISTINCT FROM v_check) THEN
      CONTINUE;
    END IF;

    -- Build roles list
    IF r.polroles IS NULL THEN
      v_roles := 'PUBLIC';
    ELSE
      SELECT string_agg(quote_ident(rolname), ', ' ORDER BY rolname) INTO v_roles
      FROM pg_roles WHERE oid = ANY (r.polroles);
      IF v_roles IS NULL OR length(trim(v_roles)) = 0 THEN
        v_roles := 'PUBLIC';
      END IF;
    END IF;

    -- Map command
    v_cmd := CASE r.polcmd
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      ELSE 'ALL'
    END;

    -- Mode
    v_mode := CASE WHEN r.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END;

    -- Drop and recreate with updated expressions
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policy_name, r.schema, r.table_name);

    EXECUTE (
      'CREATE POLICY ' || quote_ident(r.policy_name) ||
      ' ON ' || quote_ident(r.schema) || '.' || quote_ident(r.table_name) ||
      ' AS ' || v_mode ||
      ' FOR ' || v_cmd ||
      ' TO ' || v_roles ||
      CASE WHEN v_new_using IS NOT NULL THEN ' USING (' || v_new_using || ')' ELSE '' END ||
      CASE WHEN v_new_check IS NOT NULL THEN ' WITH CHECK (' || v_new_check || ')' ELSE '' END
    );

    RAISE NOTICE 'Recreated policy %.% on %.% with SELECT-wrapped functions', r.schema, r.policy_name, r.schema, r.table_name;
  END LOOP;
END
$$;
