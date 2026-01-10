/*
  Extension du système de scraping existant pour l'intégration n8n
  
  Cette migration étend les tables existantes tout en préservant la compatibilité:
  1. Étend scraping_sessions avec champs enrichis
  2. Renomme scraped_jobs vers job_raw et ajoute champs déduplication
  3. Ajoute table scraping_metrics pour le suivi performance
  4. Étend jobs table avec experience_level et deduplication_hash
*/

-- Activer l'extension pgcrypto pour SHA256
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Étendre la table scraping_sessions existante
ALTER TABLE scraping_sessions 
ADD COLUMN IF NOT EXISTS search_criteria JSONB,
ADD COLUMN IF NOT EXISTS total_sources INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_sources INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_sources INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS jobs_deduplicated INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trigger_to_webhook_ms INTEGER,
ADD COLUMN IF NOT EXISTS webhook_to_completion_ms INTEGER,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Migrer les données de criteria vers search_criteria si nécessaire
UPDATE scraping_sessions 
SET search_criteria = criteria 
WHERE search_criteria IS NULL AND criteria IS NOT NULL;

-- Renommer scraped_jobs vers job_raw et étendre
ALTER TABLE scraped_jobs RENAME TO job_raw;

-- Ajouter les champs de déduplication à job_raw
ALTER TABLE job_raw 
ADD COLUMN IF NOT EXISTS title_normalized TEXT,
ADD COLUMN IF NOT EXISTS company_normalized TEXT,
ADD COLUMN IF NOT EXISTS location_normalized TEXT,
ADD COLUMN IF NOT EXISTS description_hash TEXT,
ADD COLUMN IF NOT EXISTS deduplication_hash TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS similarity_group_id UUID,
ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS duplicate_of_id UUID REFERENCES job_raw(id),
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'raw' CHECK (processing_status IN ('raw', 'processed', 'deduplicated', 'merged', 'rejected')),
ADD COLUMN IF NOT EXISTS processing_errors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS merged_to_job_id UUID REFERENCES jobs(id),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES job_sources(id);

-- Créer les index pour job_raw
CREATE INDEX IF NOT EXISTS idx_job_raw_deduplication_hash ON job_raw(deduplication_hash);
CREATE INDEX IF NOT EXISTS idx_job_raw_source_id ON job_raw(source_id);
CREATE INDEX IF NOT EXISTS idx_job_raw_processing_status ON job_raw(processing_status);
CREATE INDEX IF NOT EXISTS idx_job_raw_merged_to_job_id ON job_raw(merged_to_job_id);
CREATE INDEX IF NOT EXISTS idx_job_raw_similarity_group ON job_raw(similarity_group_id);

-- Fonction pour générer le hash de déduplication (MD5)
DROP FUNCTION IF EXISTS generate_deduplication_hash(TEXT, TEXT, TEXT);
CREATE FUNCTION generate_deduplication_hash(title TEXT, company TEXT, location TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN md5(COALESCE(TRIM(title), '') || '|' || COALESCE(TRIM(company), '') || '|' || COALESCE(TRIM(location), ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger pour mettre à jour automatiquement le hash de déduplication
DROP FUNCTION IF EXISTS set_job_raw_deduplication_hash();
CREATE FUNCTION set_job_raw_deduplication_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deduplication_hash = generate_deduplication_hash(NEW.title, NEW.company, NEW.location);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_job_raw_deduplication_hash_trigger ON job_raw;
CREATE TRIGGER set_job_raw_deduplication_hash_trigger
  BEFORE INSERT OR UPDATE ON job_raw
  FOR EACH ROW EXECUTE FUNCTION set_job_raw_deduplication_hash();

-- Créer la table scraping_metrics
CREATE TABLE IF NOT EXISTS scraping_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scraping_session_id UUID REFERENCES scraping_sessions(id) ON DELETE CASCADE,
    source_id UUID REFERENCES job_sources(id),
    
    -- Timing metrics
    source_trigger_ms INTEGER,
    source_response_ms INTEGER,
    source_complete_ms INTEGER,
    
    -- Data metrics
    jobs_found INTEGER DEFAULT 0,
    jobs_processed INTEGER DEFAULT 0,
    jobs_deduplicated INTEGER DEFAULT 0,
    jobs_rejected INTEGER DEFAULT 0,
    
    -- Error metrics
    retry_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error_type TEXT,
    last_error_message TEXT,
    
    -- Resource usage
    requests_made INTEGER DEFAULT 0,
    bytes_received INTEGER DEFAULT 0,
    proxy_used BOOLEAN DEFAULT false,
    
    -- Quality metrics
    data_quality_score DECIMAL(5,2),
    duplicate_rate DECIMAL(5,2),
    
    -- Status
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour scraping_metrics
CREATE INDEX IF NOT EXISTS idx_scraping_metrics_session_id ON scraping_metrics(scraping_session_id);
CREATE INDEX IF NOT EXISTS idx_scraping_metrics_source_id ON scraping_metrics(source_id);
CREATE INDEX IF NOT EXISTS idx_scraping_metrics_status ON scraping_metrics(status);

-- Étendre la table jobs existante
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('junior', 'mid', 'senior', 'not_specified')),
ADD COLUMN IF NOT EXISTS source_job_id TEXT,
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deduplication_hash TEXT,
ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS job_raw_id UUID REFERENCES job_raw(id) DEFERRABLE INITIALLY DEFERRED;

-- Index pour la table jobs étendue
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_deduplication_hash ON jobs(deduplication_hash);
CREATE INDEX IF NOT EXISTS idx_jobs_scraped_at ON jobs(scraped_at);
CREATE INDEX IF NOT EXISTS idx_jobs_title_company_location ON jobs(title, company, location);

-- Mettre à jour les politiques RLS pour job_raw (anciennement scraped_jobs)
DROP POLICY IF EXISTS "Users can view scraped jobs from own sessions" ON job_raw;
CREATE POLICY "Users can view raw data from own sessions" ON job_raw
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scraping_sessions 
            WHERE scraping_sessions.id = job_raw.session_id 
            AND scraping_sessions.user_id = auth.uid()
        )
    );

-- Politiques pour scraping_metrics
ALTER TABLE scraping_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics from own sessions" ON scraping_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scraping_sessions 
            WHERE scraping_sessions.id = scraping_metrics.scraping_session_id 
            AND scraping_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage scraping metrics" ON scraping_metrics
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Fonction pour générer le hash de déduplication (déjà créée plus haut)
-- Pas besoin de la recréer ici

-- Trigger pour auto-générer le hash de déduplication pour jobs
DROP FUNCTION IF EXISTS set_jobs_deduplication_hash();
CREATE FUNCTION set_jobs_deduplication_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deduplication_hash = generate_deduplication_hash(
        NEW.title,
        NEW.company,
        NEW.location
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour job_raw
CREATE OR REPLACE FUNCTION set_job_raw_deduplication_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deduplication_hash = generate_deduplication_hash(
        COALESCE(NEW.title_normalized, NEW.title),
        COALESCE(NEW.company_normalized, NEW.company),
        COALESCE(NEW.location_normalized, NEW.location)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers
DROP TRIGGER IF EXISTS set_jobs_deduplication_hash_trigger ON jobs;
CREATE TRIGGER set_jobs_deduplication_hash_trigger 
    BEFORE INSERT OR UPDATE ON jobs 
    FOR EACH ROW EXECUTE FUNCTION set_jobs_deduplication_hash();

DROP TRIGGER IF EXISTS set_job_raw_deduplication_hash_trigger ON job_raw;
CREATE TRIGGER set_job_raw_deduplication_hash_trigger 
    BEFORE INSERT OR UPDATE ON job_raw 
    FOR EACH ROW EXECUTE FUNCTION set_job_raw_deduplication_hash();

-- Mettre à jour les enregistrements existants avec des hashes
UPDATE jobs SET deduplication_hash = generate_deduplication_hash(title, company, location) 
WHERE deduplication_hash IS NULL OR deduplication_hash = '';

UPDATE job_raw SET deduplication_hash = generate_deduplication_hash(
    COALESCE(title_normalized, title),
    COALESCE(company_normalized, company),
    COALESCE(location_normalized, location)
) 
WHERE deduplication_hash IS NULL OR deduplication_hash = '';

-- Trigger updated_at pour scraping_metrics
CREATE TRIGGER update_scraping_metrics_updated_at 
    BEFORE UPDATE ON scraping_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vue d'audit pour le suivi du pipeline (créée plus tard si nécessaire)
-- CREATE OR REPLACE VIEW scraping_audit_trail AS
-- SELECT 
--     jr.id as raw_id,
--     jr.session_id as session_id,
--     jr.title,
--     jr.company,
--     jr.location,
--     jr.deduplication_hash as raw_hash,
--     jr.processing_status,
--     j.id as job_id,
--     j.title,
--     j.company,
--     j.location,
--     j.deduplication_hash as job_hash
-- FROM job_raw jr
-- LEFT JOIN jobs j ON jr.merged_to_job_id = j.id
-- ORDER BY jr.created_at DESC;

-- COMMENT ON VIEW scraping_audit_trail IS 'Complete audit trail from raw data to final jobs';

-- Commentaires pour documentation
COMMENT ON TABLE scraping_sessions IS 'Extended session tracking for n8n scraping system';
COMMENT ON TABLE job_raw IS 'Raw scraped data before deduplication (renamed from scraped_jobs)';
COMMENT ON TABLE scraping_metrics IS 'Performance and quality metrics for scraping operations';
COMMENT ON COLUMN jobs.experience_level IS 'Experience level taxonomy: junior, mid, senior, not_specified';
COMMENT ON COLUMN jobs.deduplication_hash IS 'Hash for duplicate detection across sources';
-- COMMENT ON VIEW scraping_audit_trail IS 'Complete audit trail from raw data to final jobs';
