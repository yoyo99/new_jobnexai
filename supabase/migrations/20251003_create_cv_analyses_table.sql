-- =====================================================
-- MIGRATION: Table cv_analyses pour CV Screening
-- Date: 03/10/2025
-- Description: Stockage analyses CV avec matching jobs
-- =====================================================

-- 1. CRÉATION TABLE CV_ANALYSES
-- =====================================================

CREATE TABLE IF NOT EXISTS cv_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_company TEXT,
  job_url TEXT NOT NULL,
  matching_score INTEGER CHECK (matching_score >= 0 AND matching_score <= 100),
  strengths JSONB,
  weaknesses JSONB,
  skills_match JSONB,
  experience_match JSONB,
  recommendation TEXT,
  key_insights JSONB,
  interview_questions JSONB,
  cv_excerpt TEXT,
  analyzed_at TIMESTAMP DEFAULT NOW(),
  validation_status TEXT CHECK (validation_status IN ('success', 'fallback', 'error')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. INDEX POUR PERFORMANCE
-- =====================================================

CREATE INDEX idx_cv_analyses_user_email ON cv_analyses(user_email);
CREATE INDEX idx_cv_analyses_matching_score ON cv_analyses(matching_score DESC);
CREATE INDEX idx_cv_analyses_analyzed_at ON cv_analyses(analyzed_at DESC);
CREATE INDEX idx_cv_analyses_job_url ON cv_analyses(job_url);

-- Index GIN pour recherche JSONB
CREATE INDEX idx_cv_analyses_strengths ON cv_analyses USING GIN (strengths);
CREATE INDEX idx_cv_analyses_skills_match ON cv_analyses USING GIN (skills_match);

-- 3. VUE POUR DASHBOARD
-- =====================================================

CREATE OR REPLACE VIEW cv_analyses_summary AS
SELECT 
  user_email,
  COUNT(*) as total_analyses,
  ROUND(AVG(matching_score), 2) as avg_matching_score,
  MAX(matching_score) as best_match,
  COUNT(*) FILTER (WHERE matching_score >= 80) as excellent_matches,
  COUNT(*) FILTER (WHERE matching_score >= 60 AND matching_score < 80) as good_matches,
  COUNT(*) FILTER (WHERE matching_score < 60) as poor_matches,
  MAX(analyzed_at) as last_analysis,
  ARRAY_AGG(DISTINCT job_company) as companies_applied
FROM cv_analyses
GROUP BY user_email
ORDER BY total_analyses DESC;

-- 4. FONCTION STATISTIQUES CV
-- =====================================================

CREATE OR REPLACE FUNCTION get_cv_stats(email TEXT DEFAULT NULL)
RETURNS TABLE (
  total_analyses BIGINT,
  avg_score NUMERIC,
  best_match INTEGER,
  worst_match INTEGER,
  top_strengths JSONB,
  common_weaknesses JSONB,
  most_matched_skills JSONB,
  recommended_jobs JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_analyses AS (
    SELECT *
    FROM cv_analyses
    WHERE (email IS NULL OR user_email = email)
      AND analyzed_at > NOW() - INTERVAL '90 days'
  ),
  strength_counts AS (
    SELECT 
      jsonb_array_elements_text(strengths) as strength,
      COUNT(*) as count
    FROM user_analyses
    WHERE strengths IS NOT NULL
    GROUP BY strength
    ORDER BY count DESC
    LIMIT 5
  ),
  weakness_counts AS (
    SELECT 
      jsonb_array_elements_text(weaknesses) as weakness,
      COUNT(*) as count
    FROM user_analyses
    WHERE weaknesses IS NOT NULL
    GROUP BY weakness
    ORDER BY count DESC
    LIMIT 5
  ),
  skill_counts AS (
    SELECT 
      jsonb_array_elements_text(skills_match->'matched') as skill,
      COUNT(*) as count
    FROM user_analyses
    WHERE skills_match IS NOT NULL
    GROUP BY skill
    ORDER BY count DESC
    LIMIT 10
  )
  SELECT 
    COUNT(*)::BIGINT as total_analyses,
    ROUND(AVG(ua.matching_score), 2) as avg_score,
    MAX(ua.matching_score)::INTEGER as best_match,
    MIN(ua.matching_score)::INTEGER as worst_match,
    (SELECT jsonb_agg(jsonb_build_object('strength', strength, 'count', count)) FROM strength_counts) as top_strengths,
    (SELECT jsonb_agg(jsonb_build_object('weakness', weakness, 'count', count)) FROM weakness_counts) as common_weaknesses,
    (SELECT jsonb_agg(jsonb_build_object('skill', skill, 'count', count)) FROM skill_counts) as most_matched_skills,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'title', job_title,
        'company', job_company,
        'score', matching_score,
        'url', job_url
      ))
      FROM (
        SELECT job_title, job_company, matching_score, job_url
        FROM user_analyses
        WHERE matching_score >= 70
        ORDER BY matching_score DESC
        LIMIT 5
      ) top_jobs
    ) as recommended_jobs
  FROM user_analyses ua;
END;
$$ LANGUAGE plpgsql;

-- 5. FONCTION MATCHING AUTOMATIQUE
-- =====================================================

CREATE OR REPLACE FUNCTION find_matching_jobs(
  cv_skills JSONB,
  min_score INTEGER DEFAULT 60
)
RETURNS TABLE (
  job_id BIGINT,
  job_title TEXT,
  job_company TEXT,
  job_url TEXT,
  matching_score INTEGER,
  matched_skills JSONB,
  missing_skills JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.title,
    j.company,
    j.url,
    -- Calcul score basique (à améliorer avec vector similarity)
    LEAST(100, (
      SELECT COUNT(*)::INTEGER * 10
      FROM jsonb_array_elements_text(cv_skills) cv_skill
      WHERE EXISTS (
        SELECT 1 
        FROM jsonb_array_elements_text(j.skills) job_skill
        WHERE LOWER(job_skill::text) = LOWER(cv_skill::text)
      )
    )) as matching_score,
    -- Skills matched
    (
      SELECT jsonb_agg(DISTINCT cv_skill)
      FROM jsonb_array_elements_text(cv_skills) cv_skill
      WHERE EXISTS (
        SELECT 1 
        FROM jsonb_array_elements_text(j.skills) job_skill
        WHERE LOWER(job_skill::text) = LOWER(cv_skill::text)
      )
    ) as matched_skills,
    -- Skills missing
    (
      SELECT jsonb_agg(DISTINCT job_skill)
      FROM jsonb_array_elements_text(j.skills) job_skill
      WHERE NOT EXISTS (
        SELECT 1 
        FROM jsonb_array_elements_text(cv_skills) cv_skill
        WHERE LOWER(cv_skill::text) = LOWER(job_skill::text)
      )
    ) as missing_skills
  FROM jobs j
  WHERE j.enriched = true
    AND j.created_at > NOW() - INTERVAL '30 days'
  HAVING (
    SELECT COUNT(*)::INTEGER * 10
    FROM jsonb_array_elements_text(cv_skills) cv_skill
    WHERE EXISTS (
      SELECT 1 
      FROM jsonb_array_elements_text(j.skills) job_skill
      WHERE LOWER(job_skill::text) = LOWER(cv_skill::text)
    )
  ) >= min_score
  ORDER BY matching_score DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 6. RLS POLICIES
-- =====================================================

ALTER TABLE cv_analyses ENABLE ROW LEVEL SECURITY;

-- Users peuvent voir leurs propres analyses
CREATE POLICY "Users can view own analyses"
  ON cv_analyses
  FOR SELECT
  TO authenticated
  USING (user_email = auth.jwt()->>'email');

-- Service role peut insérer
CREATE POLICY "Service role can insert analyses"
  ON cv_analyses
  FOR INSERT
  TO service_role
  USING (true);

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all analyses"
  ON cv_analyses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 7. COMMENTAIRES
-- =====================================================

COMMENT ON TABLE cv_analyses IS 'Analyses CV avec matching jobs via Mammouth.ai';
COMMENT ON COLUMN cv_analyses.matching_score IS 'Score 0-100 de correspondance CV-Job';
COMMENT ON COLUMN cv_analyses.strengths IS 'Points forts du candidat (array)';
COMMENT ON COLUMN cv_analyses.weaknesses IS 'Points faibles ou manques (array)';
COMMENT ON COLUMN cv_analyses.skills_match IS '{matched: [], missing: []}';
COMMENT ON COLUMN cv_analyses.experience_match IS '{level, years, relevant}';
COMMENT ON COLUMN cv_analyses.validation_status IS 'success|fallback|error';

-- =====================================================
-- FIN MIGRATION
-- =====================================================
