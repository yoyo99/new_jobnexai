-- Migration: Deduplicate permissive RLS policies per table/role/action and consolidate expressions
-- Date: 2025-09-08
-- Purpose:
--  - Fix Security Advisor warning 0006_multiple_permissive_policies by ensuring that for a given
--    table, role set, and action (SELECT/INSERT/UPDATE/DELETE), there is at most one PERMISSIVE policy.
--  - If multiple policies exist with identical expressions, keep one and drop the rest.
--  - If multiple policies exist with differing expressions, recreate a single consolidated policy
--    using OR across USING / WITH CHECK expressions, then drop the originals.
--  - This migration preserves the original roles (including PUBLIC) to avoid behavior changes.
--    You may later restrict TO authenticated explicitly in a separate controlled change.

DO $$
DECLARE
  rec record;
  role_names text;
  using_exprs text[];
  check_exprs text[];
  new_using text;
  new_check text;
  i int;
  normalized_using_count int;
  normalized_check_count int;
BEGIN
  -- Group policies by table, command, permissive flag, and exact role set
  FOR rec IN
    WITH pol AS (
      SELECT p.oid, n.nspname AS schema, c.relname AS table_name, p.polname,
             p.polcmd, p.polpermissive, p.polroles,
             pg_get_expr(p.polqual, p.polrelid)      AS using_expr,
             pg_get_expr(p.polwithcheck, p.polrelid) AS withcheck_expr
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
    )
    SELECT schema, table_name, polcmd, polpermissive, polroles,
           array_agg(oid ORDER BY oid)         AS oids,
           array_agg(polname ORDER BY oid)     AS names,
           array_agg(using_expr ORDER BY oid)  AS using_list,
           array_agg(withcheck_expr ORDER BY oid) AS check_list
    FROM pol
    GROUP BY schema, table_name, polcmd, polpermissive, polroles
    HAVING count(*) > 1
  LOOP
    using_exprs := rec.using_list;
    check_exprs := rec.check_list;

    -- Determine if all USING are identical (after normalization)
    SELECT count(DISTINCT regexp_replace(trim(u), '\s+', ' ', 'g')) INTO normalized_using_count
    FROM unnest(using_exprs) u;

    IF normalized_using_count <= 1 THEN
      new_using := (SELECT regexp_replace(trim(u), '\s+', ' ', 'g') FROM unnest(using_exprs) u LIMIT 1);
    ELSE
      -- Consolidate with OR
      SELECT string_agg('(' || expr || ')', ' OR ') INTO new_using
      FROM unnest(using_exprs) AS expr
      WHERE expr IS NOT NULL AND length(trim(expr)) > 0;
    END IF;

    -- Determine if all WITH CHECK are identical
    SELECT count(DISTINCT regexp_replace(trim(w), '\s+', ' ', 'g')) INTO normalized_check_count
    FROM unnest(check_exprs) w;

    IF normalized_check_count <= 1 THEN
      new_check := (SELECT regexp_replace(trim(w), '\s+', ' ', 'g') FROM unnest(check_exprs) w LIMIT 1);
    ELSE
      -- Consolidate with OR
      SELECT string_agg('(' || expr || ')', ' OR ') INTO new_check
      FROM unnest(check_exprs) AS expr
      WHERE expr IS NOT NULL AND length(trim(expr)) > 0;
    END IF;

    -- Build roles list text
    IF rec.polroles IS NULL THEN
      role_names := 'PUBLIC';
    ELSE
      SELECT string_agg(quote_ident(rolname), ', ' ORDER BY rolname) INTO role_names
      FROM pg_roles WHERE oid = ANY (rec.polroles);
      IF role_names IS NULL OR length(trim(role_names)) = 0 THEN
        role_names := 'PUBLIC';
      END IF;
    END IF;

    -- Drop all existing policies in the group
    FOR i IN array_lower(rec.oids,1)..array_upper(rec.oids,1) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', rec.names[i], rec.schema, rec.table_name);
    END LOOP;

    -- Create the consolidated policy
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s %s %s',
      format('Consolidated %s policy', CASE rec.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE 'ALL' END),
      rec.schema, rec.table_name,
      CASE WHEN rec.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      CASE rec.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE 'ALL' END,
      role_names,
      CASE WHEN new_using IS NOT NULL THEN 'USING (' || new_using || ')' ELSE '' END,
      CASE WHEN new_check IS NOT NULL THEN 'WITH CHECK (' || new_check || ')' ELSE '' END
    );

    RAISE NOTICE 'Consolidated policies on %.% (%), roles: %', rec.schema, rec.table_name, rec.polcmd, role_names;
  END LOOP;
END
$$;
