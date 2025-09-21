-- =============================================================================
-- JOBNEXAI EXTERNAL JOBS - SCRAPING MULTI-SOURCES
-- Created: 2025-09-21
-- Purpose: Store job offers from external scraping sources
-- =============================================================================

-- 1. CREATE JOB SOURCES TABLE
-- =============================================================================
DROP TABLE IF EXISTS jobnexai_external_jobs CASCADE;  -- Drop dependent table first
DROP TABLE IF EXISTS job_sources CASCADE;

CREATE TABLE job_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  -- UUID pour compatibilité Supabase
    source_key TEXT UNIQUE NOT NULL,       -- Ex: "free-work", "pylote", "le-hibou" 
    name TEXT NOT NULL,                     -- Ex: "Free-Work", "Pylote", "Le Hibou"
    url TEXT NOT NULL,                      -- Base URL
    priority INTEGER DEFAULT 3,            -- 1=High, 2=Medium, 3=Low
    is_active BOOLEAN DEFAULT TRUE,
    scraping_frequency INTERVAL DEFAULT '1 day',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE EXTERNAL JOBS TABLE
-- =============================================================================
CREATE TABLE jobnexai_external_jobs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_id UUID NOT NULL REFERENCES job_sources(id) ON DELETE CASCADE,
    url TEXT UNIQUE NOT NULL,              -- URL de l'offre (clé unique)
    title TEXT NOT NULL,
    contract_type TEXT[],                  -- Ex: ['mission'], ['CDI', 'CDD']
    required_skills TEXT[],                -- Ex: ['React', 'Python', 'TypeScript']
    salary_range TEXT,                     -- Ex: "400-600€/jour", "45-55K€/an"
    is_remote BOOLEAN DEFAULT FALSE,
    location TEXT,                         -- Ex: "Paris", "Lyon", "Remote"
    description TEXT,                      -- Description complète
    company_name TEXT,                     -- Nom de l'entreprise si disponible
    experience_level TEXT,                 -- Ex: "Junior", "Senior", "Expert"
    last_scraped_at TIMESTAMPTZ NOT NULL, -- Dernière mise à jour
    created_at TIMESTAMPTZ DEFAULT NOW()  -- Date de création
);

-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index sur source pour filtrage rapide
CREATE INDEX IF NOT EXISTS idx_external_jobs_source 
ON jobnexai_external_jobs(source_id);

-- Index GIN pour recherche dans les compétences (array)
CREATE INDEX IF NOT EXISTS idx_external_jobs_skills 
ON jobnexai_external_jobs USING GIN(required_skills);

-- Index GIN pour types de contrat (array)
CREATE INDEX IF NOT EXISTS idx_external_jobs_contract 
ON jobnexai_external_jobs USING GIN(contract_type);

-- Index pour filtrage télétravail
CREATE INDEX IF NOT EXISTS idx_external_jobs_remote 
ON jobnexai_external_jobs(is_remote);

-- Index pour localisation
CREATE INDEX IF NOT EXISTS idx_external_jobs_location 
ON jobnexai_external_jobs(location);

-- Index pour niveau d'expérience
CREATE INDEX IF NOT EXISTS idx_external_jobs_experience 
ON jobnexai_external_jobs(experience_level);

-- Index composé pour requêtes fréquentes (source + remote)
CREATE INDEX IF NOT EXISTS idx_external_jobs_source_remote 
ON jobnexai_external_jobs(source_id, is_remote);

-- Index pour tri par date (plus récents en premier)
CREATE INDEX IF NOT EXISTS idx_external_jobs_scraped_at 
ON jobnexai_external_jobs(last_scraped_at DESC);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Activer RLS sur les deux tables
ALTER TABLE job_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobnexai_external_jobs ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique pour les offres
CREATE POLICY "Public read access on external jobs"
ON jobnexai_external_jobs FOR SELECT
USING (true);

-- Politique de lecture publique pour les sources
CREATE POLICY "Public read access on sources"
ON job_sources FOR SELECT
USING (true);

-- Politique d'écriture pour les services authentifiés
CREATE POLICY "Service role write access on external jobs"
ON jobnexai_external_jobs FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role write access on sources"
ON job_sources FOR ALL
USING (auth.role() = 'service_role');

-- 5. INSERT DEFAULT JOB SOURCES
-- =============================================================================

INSERT INTO job_sources (source_key, name, url, priority, is_active) VALUES
    -- PRIORITÉ HAUTE (1) - Sites Premium/Spécialisés
    ('free-work', 'Free-Work', 'https://www.free-work.com', 1, true),
    ('pylote', 'Pylote', 'https://pylote.io', 1, true),
    ('le-hibou', 'Le Hibou', 'https://lehibou.com', 1, true),
    ('talent-io', 'Talent.io', 'https://talent.io', 1, true),
    ('malt', 'Malt', 'https://www.malt.fr', 1, true),
    ('linkedin', 'LinkedIn', 'https://www.linkedin.com', 1, true),
    
    -- PRIORITÉ HAUTE (1) - Sites Généralistes Majeurs
    ('indeed', 'Indeed', 'https://fr.indeed.com', 1, true),
    ('welcome-jungle', 'Welcome to the Jungle', 'https://www.welcometothejungle.com', 1, true),
    ('apec', 'APEC', 'https://www.apec.fr', 1, true),
    ('france-travail', 'France Travail', 'https://www.francetravail.fr/accueil/', 1, true),
    
    -- PRIORITÉ MOYENNE (2) - Sites Spécialisés Tech
    ('comet', 'Comet', 'https://comet.co', 2, true),
    ('cherry-pick', 'Cherry Pick', 'https://cherry-pick.io', 2, true),
    ('creme-creme', 'Crème de la Crème', 'https://cremedelacreme.io', 2, true),
    ('we-love-devs', 'WeLoveDevs', 'https://welovedevs.com', 2, true),
    ('skillvalue', 'SkillValue', 'https://skillvalue.com', 2, true),
    ('lesjeudis', 'LesJeudis', 'https://lesjeudis.com', 2, true),
    
    -- PRIORITÉ MOYENNE (2) - Sites Freelance/Missions
    ('freelance-republik', 'Freelance Republik', 'https://freelancerepublik.com', 2, true),
    ('404works', '404 Works', 'https://404works.com', 2, true),
    ('kamatz', 'Kamatz', 'https://kamatz.com', 2, true),
    ('codeur', 'Codeur', 'https://codeur.com', 2, true),
    ('comeup', 'ComeUp', 'https://comeup.com', 2, true),
    ('collective-work', 'Collective Work', 'https://collective.work', 2, true),
    ('freelance-informatique', 'Freelance Informatique', 'https://freelance-informatique.fr', 2, true),
    
    -- PRIORITÉ BASSE (3) - Sites Généralistes Secondaires
    ('monster', 'Monster', 'https://www.monster.fr', 3, true),
    ('cadr-emploi', 'CadrEmploi', 'https://www.cadremploi.fr', 3, true),
    ('experteer', 'Experteer', 'https://www.experteer.fr', 3, true),
    ('offre-emploi', 'L''Offre d''Emploi', 'https://www.loffredemploi.fr', 3, true),
    ('direct-emploi', 'Direct Emploi', 'https://www.directemploi.com', 3, true),
    ('jobijoba', 'JobiJoba', 'https://www.jobijoba.com/fr/', 3, true),
    ('meteojob', 'MeteoJob', 'https://www.meteojob.com', 3, true),
    ('maddyjobs', 'MaddyJobs', 'https://cms.maddyjobs.myjobboard.fr', 3, true),
    ('option-carriere', 'OptionCarriere', 'https://www.optioncarriere.com', 3, true),
    ('jooble', 'Jooble', 'https://fr.jooble.org', 3, true),
    ('kedjob', 'Kedjob', 'https://kedjob.com', 3, true),
    
    -- PRIORITÉ BASSE (3) - Sites Internationaux/Premium
    ('toptal', 'Toptal', 'https://toptal.com', 3, false), -- Désactivé par défaut (très sélectif)
    ('upwork', 'Upwork', 'https://upwork.com', 3, true),
    ('fiverr', 'Fiverr', 'https://fiverr.com', 3, true),
    ('little-big-connection', 'Little Big Connection', 'https://littlebigconnection.com', 3, false) -- Désactivé par défaut (très premium)
ON CONFLICT (source_key) DO UPDATE SET
    name = EXCLUDED.name,
    url = EXCLUDED.url,
    priority = EXCLUDED.priority,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 6. CREATE ADMIN FUNCTIONS FOR JOB SOURCES MANAGEMENT
-- =============================================================================

-- Function to add/update a job source (Admin only)
CREATE OR REPLACE FUNCTION manage_job_source(
    p_source_key TEXT,
    p_name TEXT,
    p_url TEXT,
    p_priority INTEGER DEFAULT 2,
    p_is_active BOOLEAN DEFAULT true,
    p_action TEXT DEFAULT 'upsert' -- 'upsert', 'activate', 'deactivate', 'delete'
) 
RETURNS TABLE(success BOOLEAN, message TEXT, source_data JSON)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    source_record RECORD;
BEGIN
    -- Check if user is admin
    SELECT auth.jwt() ->> 'role' INTO user_role;
    
    IF user_role IS NULL OR user_role != 'admin' THEN
        RETURN QUERY SELECT false, 'Access denied: Admin privileges required'::TEXT, NULL::JSON;
        RETURN;
    END IF;
    
    -- Validate inputs
    IF p_source_key IS NULL OR LENGTH(TRIM(p_source_key)) = 0 THEN
        RETURN QUERY SELECT false, 'Source key is required'::TEXT, NULL::JSON;
        RETURN;
    END IF;
    
    -- Execute action
    CASE p_action
        WHEN 'upsert' THEN
            INSERT INTO job_sources (source_key, name, url, priority, is_active)
            VALUES (p_source_key, p_name, p_url, p_priority, p_is_active)
            ON CONFLICT (source_key) DO UPDATE SET
                name = EXCLUDED.name,
                url = EXCLUDED.url,
                priority = EXCLUDED.priority,
                is_active = EXCLUDED.is_active,
                updated_at = NOW()
            RETURNING * INTO source_record;
            
            RETURN QUERY SELECT true, 'Source updated successfully'::TEXT, 
                row_to_json(source_record);
            
        WHEN 'activate' THEN
            UPDATE job_sources SET is_active = true, updated_at = NOW()
            WHERE source_key = p_source_key
            RETURNING * INTO source_record;
            
            IF source_record IS NULL THEN
                RETURN QUERY SELECT false, 'Source not found'::TEXT, NULL::JSON;
            ELSE
                RETURN QUERY SELECT true, 'Source activated'::TEXT, 
                    row_to_json(source_record);
            END IF;
            
        WHEN 'deactivate' THEN
            UPDATE job_sources SET is_active = false, updated_at = NOW()
            WHERE source_key = p_source_key
            RETURNING * INTO source_record;
            
            IF source_record IS NULL THEN
                RETURN QUERY SELECT false, 'Source not found'::TEXT, NULL::JSON;
            ELSE
                RETURN QUERY SELECT true, 'Source deactivated'::TEXT, 
                    row_to_json(source_record);
            END IF;
            
        WHEN 'delete' THEN
            DELETE FROM job_sources WHERE source_key = p_source_key
            RETURNING * INTO source_record;
            
            IF source_record IS NULL THEN
                RETURN QUERY SELECT false, 'Source not found'::TEXT, NULL::JSON;
            ELSE
                RETURN QUERY SELECT true, 'Source deleted'::TEXT, 
                    row_to_json(source_record);
            END IF;
            
        ELSE
            RETURN QUERY SELECT false, 'Invalid action. Use: upsert, activate, deactivate, delete'::TEXT, NULL::JSON;
    END CASE;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, ('Error: ' || SQLERRM)::TEXT, NULL::JSON;
END;
$$;

-- Function to get job sources stats (Admin only)
CREATE OR REPLACE FUNCTION get_job_sources_stats()
RETURNS TABLE(
    total_sources INTEGER,
    active_sources INTEGER,
    priority_1_count INTEGER,
    priority_2_count INTEGER,
    priority_3_count INTEGER,
    total_jobs_scraped BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Check if user is admin or service role (for development)
    SELECT COALESCE(auth.jwt() ->> 'role', auth.role()) INTO user_role;
    
    IF user_role IS NULL OR (user_role != 'admin' AND user_role != 'service_role') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_sources,
        COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_sources,
        COUNT(*) FILTER (WHERE priority = 1)::INTEGER as priority_1_count,
        COUNT(*) FILTER (WHERE priority = 2)::INTEGER as priority_2_count,
        COUNT(*) FILTER (WHERE priority = 3)::INTEGER as priority_3_count,
        COALESCE((SELECT COUNT(*) FROM jobnexai_external_jobs), 0)::BIGINT as total_jobs_scraped
    FROM job_sources;
END;
$$;

-- 7. CREATE FUNCTION FOR AUTO-UPDATE TIMESTAMPS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour auto-update des sources
CREATE TRIGGER update_job_sources_updated_at 
    BEFORE UPDATE ON job_sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. CREATE USEFUL VIEWS
-- =============================================================================

-- Vue des offres récentes avec info source
CREATE OR REPLACE VIEW recent_external_jobs AS
SELECT 
    ej.*,
    js.name as source_name,
    js.priority as source_priority
FROM jobnexai_external_jobs ej
JOIN job_sources js ON ej.source_id = js.id
WHERE ej.last_scraped_at >= NOW() - INTERVAL '7 days'
AND js.is_active = true
ORDER BY ej.last_scraped_at DESC;

-- Vue statistiques par source
CREATE OR REPLACE VIEW jobs_stats_by_source AS
SELECT 
    js.id,
    js.name,
    COUNT(ej.id) as total_jobs,
    COUNT(CASE WHEN ej.last_scraped_at >= NOW() - INTERVAL '1 day' THEN 1 END) as jobs_last_24h,
    COUNT(CASE WHEN ej.is_remote = true THEN 1 END) as remote_jobs,
    MAX(ej.last_scraped_at) as last_scraping_date
FROM job_sources js
LEFT JOIN jobnexai_external_jobs ej ON js.id = ej.source_id
WHERE js.is_active = true
GROUP BY js.id, js.name
ORDER BY total_jobs DESC;

-- =============================================================================
-- COMMENT SUMMARY
-- =============================================================================

COMMENT ON TABLE job_sources IS 'Configuration des sources de scraping externes';
COMMENT ON TABLE jobnexai_external_jobs IS 'Offres d''emploi scrapées depuis sources externes';
COMMENT ON VIEW recent_external_jobs IS 'Vue des offres récentes (7 derniers jours) avec infos source';
COMMENT ON VIEW jobs_stats_by_source IS 'Statistiques de scraping par source';
