-- =====================================================
-- SCRIPT VÉRIFICATION N8N SCRAPING
-- Date: 01/10/2025
-- Usage: Exécuter dans Supabase SQL Editor
-- =====================================================

-- 1. STATISTIQUES GLOBALES PAR SOURCE
-- =====================================================
SELECT 
  scraping_source,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE enriched = true) as enriched_jobs,
  COUNT(*) FILTER (WHERE enriched = false) as non_enriched_jobs,
  ROUND(AVG(quality_score), 2) as avg_quality_score,
  MIN(created_at) as first_job,
  MAX(created_at) as last_job
FROM jobs
WHERE scraping_source IS NOT NULL
GROUP BY scraping_source
ORDER BY total_jobs DESC;

-- 2. JOBS RÉCENTS (DERNIÈRES 24H)
-- =====================================================
SELECT 
  title,
  company,
  location,
  scraping_source,
  enriched,
  quality_score,
  created_at
FROM jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND scraping_source IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- 3. TAUX D'ENRICHISSEMENT PAR SOURCE
-- =====================================================
SELECT 
  scraping_source,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE enriched = true) as enriched,
  ROUND(
    COUNT(*) FILTER (WHERE enriched = true)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as enrichment_rate_percent
FROM jobs
WHERE scraping_source IS NOT NULL
GROUP BY scraping_source
ORDER BY enrichment_rate_percent DESC;

-- 4. JOBS AVEC ERREURS D'ENRICHISSEMENT
-- =====================================================
SELECT 
  title,
  company,
  scraping_source,
  enrichment_error,
  created_at
FROM jobs
WHERE enrichment_error IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 5. TOP COMPÉTENCES DEMANDÉES
-- =====================================================
SELECT 
  skill,
  COUNT(*) as job_count,
  ARRAY_AGG(DISTINCT scraping_source) as sources
FROM jobs,
  jsonb_array_elements_text(skills) as skill
WHERE enriched = true
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY skill
ORDER BY job_count DESC
LIMIT 20;

-- 6. TOP TECHNOLOGIES
-- =====================================================
SELECT 
  tech,
  COUNT(*) as job_count,
  ARRAY_AGG(DISTINCT scraping_source) as sources
FROM jobs,
  jsonb_array_elements_text(technologies) as tech
WHERE enriched = true
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY tech
ORDER BY job_count DESC
LIMIT 20;

-- 7. DISTRIBUTION PAR NIVEAU D'EXPÉRIENCE
-- =====================================================
SELECT 
  experience_level,
  COUNT(*) as job_count,
  ROUND(AVG(quality_score), 2) as avg_quality
FROM jobs
WHERE enriched = true
  AND experience_level IS NOT NULL
GROUP BY experience_level
ORDER BY job_count DESC;

-- 8. DISTRIBUTION PAR TYPE DE TÉLÉTRAVAIL
-- =====================================================
SELECT 
  remote_type,
  COUNT(*) as job_count,
  ROUND(AVG(quality_score), 2) as avg_quality
FROM jobs
WHERE enriched = true
  AND remote_type IS NOT NULL
GROUP BY remote_type
ORDER BY job_count DESC;

-- 9. JOBS AVEC MEILLEUR QUALITY SCORE
-- =====================================================
SELECT 
  title,
  company,
  location,
  quality_score,
  experience_level,
  remote_type,
  scraping_source,
  created_at
FROM jobs
WHERE enriched = true
  AND quality_score >= 8
ORDER BY quality_score DESC, created_at DESC
LIMIT 10;

-- 10. JOBS SANS ENRICHISSEMENT (À RETRAITER)
-- =====================================================
SELECT 
  id,
  title,
  company,
  scraping_source,
  created_at,
  enrichment_error
FROM jobs
WHERE enriched = false
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- 11. PERFORMANCE SCRAPING PAR HEURE
-- =====================================================
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  scraping_source,
  COUNT(*) as jobs_scraped
FROM jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND scraping_source IS NOT NULL
GROUP BY DATE_TRUNC('hour', created_at), scraping_source
ORDER BY hour DESC, jobs_scraped DESC;

-- 12. DOUBLONS POTENTIELS (MÊME TITRE + ENTREPRISE)
-- =====================================================
SELECT 
  title,
  company,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(DISTINCT scraping_source) as sources,
  ARRAY_AGG(url) as urls
FROM jobs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY title, company
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- 13. SALAIRES ESTIMÉS (QUAND DISPONIBLES)
-- =====================================================
SELECT 
  salary_estimate,
  experience_level,
  COUNT(*) as job_count
FROM jobs
WHERE salary_estimate IS NOT NULL
  AND enriched = true
GROUP BY salary_estimate, experience_level
ORDER BY job_count DESC
LIMIT 20;

-- 14. VÉRIFICATION INTÉGRITÉ DONNÉES
-- =====================================================
SELECT 
  'Jobs sans titre' as check_name,
  COUNT(*) as count
FROM jobs
WHERE title IS NULL OR title = ''

UNION ALL

SELECT 
  'Jobs sans entreprise' as check_name,
  COUNT(*) as count
FROM jobs
WHERE company IS NULL OR company = ''

UNION ALL

SELECT 
  'Jobs sans URL' as check_name,
  COUNT(*) as count
FROM jobs
WHERE url IS NULL OR url = ''

UNION ALL

SELECT 
  'Jobs enrichis sans skills' as check_name,
  COUNT(*) as count
FROM jobs
WHERE enriched = true 
  AND (skills IS NULL OR jsonb_array_length(skills) = 0)

UNION ALL

SELECT 
  'Jobs avec quality_score invalide' as check_name,
  COUNT(*) as count
FROM jobs
WHERE quality_score IS NOT NULL 
  AND (quality_score < 0 OR quality_score > 10);

-- 15. RÉSUMÉ EXÉCUTIF
-- =====================================================
SELECT 
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE enriched = true) as enriched_jobs,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as jobs_last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as jobs_last_7days,
  ROUND(AVG(quality_score), 2) as avg_quality_score,
  COUNT(DISTINCT scraping_source) as active_sources,
  COUNT(*) FILTER (WHERE enrichment_error IS NOT NULL) as jobs_with_errors
FROM jobs
WHERE scraping_source IS NOT NULL;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- NOTES D'UTILISATION:
-- 1. Exécuter ce script dans Supabase SQL Editor
-- 2. Vérifier les métriques après chaque exécution N8N
-- 3. Investiguer les jobs avec erreurs d'enrichissement
-- 4. Surveiller le taux d'enrichissement (objectif >80%)
-- 5. Vérifier l'absence de doublons
