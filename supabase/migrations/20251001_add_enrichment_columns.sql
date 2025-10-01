-- =====================================================
-- MIGRATION: Ajout colonnes enrichissement IA + LinkedIn
-- Date: 01/10/2025
-- Auteur: Lionel + Cascade
-- Description: Extension table jobs pour Mammouth.ai + Bright Data
-- =====================================================

-- 1. AJOUT COLONNES ENRICHISSEMENT IA (MAMMOUTH.AI)
-- =====================================================

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS remote_type TEXT,
ADD COLUMN IF NOT EXISTS contract_type TEXT,
ADD COLUMN IF NOT EXISTS technologies JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS quality_score INTEGER,
ADD COLUMN IF NOT EXISTS enriched BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enrichment_timestamp TIMESTAMP,
ADD COLUMN IF NOT EXISTS enrichment_error TEXT;

-- 2. AJOUT COLONNES LINKEDIN/BRIGHT DATA
-- =====================================================

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS job_seniority_level TEXT,
ADD COLUMN IF NOT EXISTS job_function TEXT,
ADD COLUMN IF NOT EXISTS job_industries JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS company_logo TEXT,
ADD COLUMN IF NOT EXISTS apply_link TEXT,
ADD COLUMN IF NOT EXISTS num_applicants INTEGER,
ADD COLUMN IF NOT EXISTS job_posting_id TEXT,
ADD COLUMN IF NOT EXISTS company_id TEXT;

-- 3. AJOUT COLONNES MÉTADONNÉES SCRAPING
-- =====================================================

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_checked TIMESTAMP,
ADD COLUMN IF NOT EXISTS scraping_source TEXT,
ADD COLUMN IF NOT EXISTS scraping_session_id UUID,
ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- 4. AJOUT COLONNES SALARY ESTIMATE (FORMAT TEXTE)
-- =====================================================

-- Pour compatibilité avec Mammouth.ai qui retourne "40k-50k EUR"
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS salary_estimate TEXT;

-- 5. CRÉATION INDEX POUR PERFORMANCE
-- =====================================================

-- Index sur colonnes de recherche fréquente
CREATE INDEX IF NOT EXISTS idx_jobs_enriched ON jobs(enriched) WHERE enriched = true;
CREATE INDEX IF NOT EXISTS idx_jobs_quality_score ON jobs(quality_score DESC) WHERE quality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level) WHERE experience_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_remote_type ON jobs(remote_type) WHERE remote_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_scraping_source ON jobs(scraping_source);
CREATE INDEX IF NOT EXISTS idx_jobs_scraped_at ON jobs(scraped_at DESC);

-- Index GIN pour recherche dans JSONB
CREATE INDEX IF NOT EXISTS idx_jobs_skills_gin ON jobs USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_jobs_technologies_gin ON jobs USING GIN (technologies);
CREATE INDEX IF NOT EXISTS idx_jobs_benefits_gin ON jobs USING GIN (benefits);

-- Index composite pour filtres combinés
CREATE INDEX IF NOT EXISTS idx_jobs_search_filters ON jobs(
  experience_level, 
  remote_type, 
  quality_score DESC
) WHERE enriched = true;

-- 6. AJOUT CONTRAINTES
-- =====================================================

-- Contrainte sur quality_score (0-10)
ALTER TABLE jobs
ADD CONSTRAINT check_quality_score 
CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 10));

-- Contrainte sur experience_level (valeurs autorisées)
ALTER TABLE jobs
ADD CONSTRAINT check_experience_level
CHECK (experience_level IS NULL OR experience_level IN (
  'junior', 'mid', 'senior', 'lead', 'staff', 'principal', 'non_specifie'
));

-- Contrainte sur remote_type (valeurs autorisées)
ALTER TABLE jobs
ADD CONSTRAINT check_remote_type
CHECK (remote_type IS NULL OR remote_type IN (
  'remote', 'hybrid', 'onsite', 'non_specifie'
));

-- Contrainte sur contract_type (valeurs autorisées)
ALTER TABLE jobs
ADD CONSTRAINT check_contract_type
CHECK (contract_type IS NULL OR contract_type IN (
  'CDI', 'CDD', 'freelance', 'stage', 'alternance', 'interim', 'non_specifie'
));

-- 7. CRÉATION VUE POUR JOBS ENRICHIS
-- =====================================================

CREATE OR REPLACE VIEW jobs_enriched AS
SELECT 
  j.*,
  js.name as source_name,
  js.url as source_url,
  -- Calcul score composite
  CASE 
    WHEN j.enriched = true THEN j.quality_score
    ELSE 5 -- Score par défaut pour jobs non enrichis
  END as composite_score,
  -- Extraction premier skill (pour tri)
  CASE 
    WHEN jsonb_array_length(j.skills) > 0 
    THEN j.skills->0->>0
    ELSE NULL
  END as primary_skill
FROM jobs j
LEFT JOIN job_sources js ON j.source_id = js.id
WHERE j.enriched = true OR j.quality_score IS NOT NULL;

-- 8. CRÉATION FONCTION TRIGGER POUR ENRICHMENT_TIMESTAMP
-- =====================================================

CREATE OR REPLACE FUNCTION update_enrichment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.enriched = true AND (OLD.enriched IS NULL OR OLD.enriched = false) THEN
    NEW.enrichment_timestamp = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
DROP TRIGGER IF EXISTS trigger_update_enrichment_timestamp ON jobs;
CREATE TRIGGER trigger_update_enrichment_timestamp
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_enrichment_timestamp();

-- 9. CRÉATION FONCTION POUR CALCULER QUALITY SCORE
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_quality_score(job_record jobs)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 5; -- Score de base
BEGIN
  -- +1 si description enrichie présente
  IF job_record.description IS NOT NULL AND LENGTH(job_record.description) > 100 THEN
    score := score + 1;
  END IF;
  
  -- +1 si skills présents
  IF jsonb_array_length(job_record.skills) > 0 THEN
    score := score + 1;
  END IF;
  
  -- +1 si salary renseigné
  IF job_record.salary_estimate IS NOT NULL OR 
     (job_record.salary_min IS NOT NULL AND job_record.salary_max IS NOT NULL) THEN
    score := score + 1;
  END IF;
  
  -- +1 si remote_type spécifié
  IF job_record.remote_type IS NOT NULL AND job_record.remote_type != 'non_specifie' THEN
    score := score + 1;
  END IF;
  
  -- +1 si benefits présents
  IF jsonb_array_length(job_record.benefits) > 0 THEN
    score := score + 1;
  END IF;
  
  -- Limiter entre 0 et 10
  RETURN LEAST(GREATEST(score, 0), 10);
END;
$$ LANGUAGE plpgsql;

-- 10. MISE À JOUR POLICIES RLS
-- =====================================================

-- Policy pour lecture jobs enrichis (tous les utilisateurs authentifiés)
DROP POLICY IF EXISTS "Users can read enriched jobs" ON jobs;
CREATE POLICY "Users can read enriched jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (enriched = true OR quality_score IS NOT NULL);

-- Policy pour lecture tous les jobs (admins uniquement)
DROP POLICY IF EXISTS "Admins can read all jobs" ON jobs;
CREATE POLICY "Admins can read all jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 11. COMMENTAIRES SUR LES COLONNES
-- =====================================================

COMMENT ON COLUMN jobs.skills IS 'Compétences extraites par IA (JSONB array)';
COMMENT ON COLUMN jobs.experience_level IS 'Niveau expérience: junior|mid|senior|lead|staff|principal';
COMMENT ON COLUMN jobs.remote_type IS 'Type télétravail: remote|hybrid|onsite';
COMMENT ON COLUMN jobs.contract_type IS 'Type contrat: CDI|CDD|freelance|stage|alternance';
COMMENT ON COLUMN jobs.technologies IS 'Technologies utilisées (JSONB array)';
COMMENT ON COLUMN jobs.benefits IS 'Avantages entreprise (JSONB array)';
COMMENT ON COLUMN jobs.quality_score IS 'Score qualité offre (0-10)';
COMMENT ON COLUMN jobs.enriched IS 'Offre enrichie par IA (Mammouth.ai)';
COMMENT ON COLUMN jobs.enrichment_timestamp IS 'Date enrichissement IA';
COMMENT ON COLUMN jobs.salary_estimate IS 'Estimation salaire format texte (ex: 40k-50k EUR)';
COMMENT ON COLUMN jobs.scraping_source IS 'Source scraping: indeed|linkedin|bright_data|malt|wttj';
COMMENT ON COLUMN jobs.raw_data IS 'Données brutes JSON du scraping';

-- 12. REQUÊTES UTILES (COMMENTÉES)
-- =====================================================

/*
-- Exemple: Rechercher jobs React remote avec bon score
SELECT * FROM jobs_enriched
WHERE skills @> '["React"]'::jsonb
  AND remote_type = 'remote'
  AND quality_score >= 7
ORDER BY quality_score DESC, posted_at DESC
LIMIT 20;

-- Exemple: Statistiques enrichissement par source
SELECT 
  scraping_source,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE enriched = true) as enriched_jobs,
  ROUND(AVG(quality_score), 2) as avg_quality_score
FROM jobs
WHERE scraping_source IS NOT NULL
GROUP BY scraping_source
ORDER BY total_jobs DESC;

-- Exemple: Top technologies demandées
SELECT 
  tech,
  COUNT(*) as job_count
FROM jobs,
  jsonb_array_elements_text(technologies) as tech
WHERE enriched = true
GROUP BY tech
ORDER BY job_count DESC
LIMIT 20;
*/

-- =====================================================
-- FIN MIGRATION
-- =====================================================

-- Vérification finale
DO $$
BEGIN
  RAISE NOTICE 'Migration terminée avec succès !';
  RAISE NOTICE 'Nouvelles colonnes ajoutées: skills, experience_level, remote_type, etc.';
  RAISE NOTICE 'Index créés pour optimisation recherche';
  RAISE NOTICE 'Vue jobs_enriched disponible';
  RAISE NOTICE 'Triggers et fonctions créés';
END $$;
