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
  keep_oid oid;
  keep_name text;
  i int;
  normalized_count int;

  -- Helper to normalize whitespace
  function normalize_expr(txt text) returns text as $$
  begin
    if txt is null then
      return null;
    end if;
    return regexp_replace(trim(txt), '\s+', ' ', 'g');
  end; $$ language plpgsql;
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
    SELECT count(DISTINCT normalize_expr(u)) INTO normalized_count
    FROM unnest(using_exprs) u;

    IF normalized_count = 1 THEN
      new_using := normalize_expr(using_exprs[1]);
    ELSE
      -- Consolidate with OR
      new_using := null;
      FOR i IN array_lower(using_exprs,1)..array_upper(using_exprs,1) LOOP
        IF using_exprs[i] IS NOT NULL AND length(trim(using_exprs[i])) > 0 THEN
          IF new_using IS NULL THEN
            new_using := '(' || using_exprs[i] || ')';
          ELSE
            new_using := '(' || new_using || ') OR (' || using_exprs[i] || ')';
          END IF;
        END IF;
      END LOOP;
    END IF;

    -- Determine if all WITH CHECK are identical
    SELECT count(DISTINCT normalize_expr(w)) INTO normalized_count
    FROM unnest(check_exprs) w;

    IF normalized_count = 1 THEN
      new_check := normalize_expr(check_exprs[1]);
    ELSE
      new_check := null;
      FOR i IN array_lower(check_exprs,1)..array_upper(check_exprs,1) LOOP
        IF check_exprs[i] IS NOT NULL AND length(trim(check_exprs[i])) > 0 THEN
          IF new_check IS NULL THEN
            new_check := '(' || check_exprs[i] || ')';
          ELSE
            new_check := '(' || new_check || ') OR (' || check_exprs[i] || ')';
          END IF;
        END IF;
      END LOOP;
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

    -- Create a consolidated policy name
    keep_name := format('Consolidated %s policy', CASE rec.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE 'ALL' END);

    -- Create the consolidated policy
    EXECUTE (
      'CREATE POLICY ' || quote_ident(keep_name) ||
      ' ON ' || quote_ident(rec.schema) || '.' || quote_ident(rec.table_name) ||
      ' AS ' || CASE WHEN rec.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END ||
      ' FOR ' || CASE rec.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE 'ALL' END ||
      ' TO ' || role_names ||
      COALESCE(' USING (' || new_using || ')', '') ||
      COALESCE(' WITH CHECK (' || new_check || ')', '')
    );

    RAISE NOTICE 'Consolidated policies on %.% (%), roles: %', rec.schema, rec.table_name, rec.polcmd, role_names;
  END LOOP;
END
$$;
