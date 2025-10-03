-- =====================================================
-- MIGRATION: Table workflow_errors pour Error Logger N8N
-- Date: 03/10/2025
-- Description: Logs centralisés des erreurs workflows N8N
-- =====================================================

-- 1. CRÉATION TABLE WORKFLOW_ERRORS
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  node_name TEXT,
  node_type TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  execution_id TEXT,
  severity TEXT CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  raw_error JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. INDEX POUR PERFORMANCE
-- =====================================================

CREATE INDEX idx_workflow_errors_severity ON workflow_errors(severity, created_at DESC);
CREATE INDEX idx_workflow_errors_workflow_id ON workflow_errors(workflow_id);
CREATE INDEX idx_workflow_errors_created_at ON workflow_errors(created_at DESC);
CREATE INDEX idx_workflow_errors_resolved ON workflow_errors(resolved) WHERE resolved = false;

-- 3. VUE POUR DASHBOARD
-- =====================================================

CREATE OR REPLACE VIEW workflow_errors_summary AS
SELECT 
  workflow_name,
  severity,
  COUNT(*) as error_count,
  COUNT(*) FILTER (WHERE resolved = false) as unresolved_count,
  MAX(created_at) as last_error,
  ARRAY_AGG(DISTINCT node_name) as affected_nodes
FROM workflow_errors
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY workflow_name, severity
ORDER BY error_count DESC;

-- 4. FONCTION STATISTIQUES ERREURS
-- =====================================================

CREATE OR REPLACE FUNCTION get_error_stats(days INTEGER DEFAULT 7)
RETURNS TABLE (
  total_errors BIGINT,
  critical_errors BIGINT,
  high_errors BIGINT,
  medium_errors BIGINT,
  low_errors BIGINT,
  resolved_errors BIGINT,
  unresolved_errors BIGINT,
  most_failing_workflow TEXT,
  error_rate_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_errors,
    COUNT(*) FILTER (WHERE severity = 'CRITICAL')::BIGINT as critical_errors,
    COUNT(*) FILTER (WHERE severity = 'HIGH')::BIGINT as high_errors,
    COUNT(*) FILTER (WHERE severity = 'MEDIUM')::BIGINT as medium_errors,
    COUNT(*) FILTER (WHERE severity = 'LOW')::BIGINT as low_errors,
    COUNT(*) FILTER (WHERE resolved = true)::BIGINT as resolved_errors,
    COUNT(*) FILTER (WHERE resolved = false)::BIGINT as unresolved_errors,
    (
      SELECT workflow_name 
      FROM workflow_errors 
      WHERE created_at > NOW() - INTERVAL '1 day' * days
      GROUP BY workflow_name 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ) as most_failing_workflow,
    ROUND(
      COUNT(*)::NUMERIC / NULLIF(
        (SELECT COUNT(*) FROM workflow_errors WHERE created_at > NOW() - INTERVAL '30 days'), 
        0
      ) * 100, 
      2
    ) as error_rate_percent
  FROM workflow_errors
  WHERE created_at > NOW() - INTERVAL '1 day' * days;
END;
$$ LANGUAGE plpgsql;

-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE workflow_errors ENABLE ROW LEVEL SECURITY;

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all errors"
  ON workflow_errors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Service role peut insérer
CREATE POLICY "Service role can insert errors"
  ON workflow_errors
  FOR INSERT
  TO service_role
  USING (true);

-- Admins peuvent résoudre erreurs
CREATE POLICY "Admins can update errors"
  ON workflow_errors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 6. COMMENTAIRES
-- =====================================================

COMMENT ON TABLE workflow_errors IS 'Logs centralisés des erreurs workflows N8N';
COMMENT ON COLUMN workflow_errors.severity IS 'CRITICAL|HIGH|MEDIUM|LOW';
COMMENT ON COLUMN workflow_errors.resolved IS 'Erreur résolue par un admin';
COMMENT ON COLUMN workflow_errors.raw_error IS 'Données brutes JSON de l''erreur';

-- =====================================================
-- FIN MIGRATION
-- =====================================================
