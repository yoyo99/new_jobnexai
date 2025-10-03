-- =====================================================
-- SCRIPT TEST WORKFLOWS N8N - JobNexAI
-- Date: 03/10/2025
-- Usage: Vérifier que les workflows fonctionnent
-- =====================================================

-- 1. VÉRIFICATION DONNÉES RÉCENTES (DERNIÈRES 24H)
-- =====================================================

SELECT 
  '✅ JOBS SCRAPÉS DERNIÈRES 24H' as test_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Aucun job scrapé'
  END as status
FROM jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND scraping_source IS NOT NULL;

-- 2. VÉRIFICATION PAR SOURCE
-- =====================================================

SELECT 
  '📊 JOBS PAR SOURCE' as test_name,
  scraping_source,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as jobs_24h,
  COUNT(*) FILTER (WHERE enriched = true) as enriched_jobs,
  ROUND(AVG(quality_score), 2) as avg_quality,
  MAX(created_at) as last_scrape,
  CASE 
    WHEN MAX(created_at) > NOW() - INTERVAL '6 hours' THEN '✅ ACTIF'
    WHEN MAX(created_at) > NOW() - INTERVAL '24 hours' THEN '⚠️ RALENTI'
    ELSE '❌ INACTIF'
  END as status
FROM jobs
WHERE scraping_source IS NOT NULL
GROUP BY scraping_source
ORDER BY last_scrape DESC;

-- 3. TAUX D'ENRICHISSEMENT
-- =====================================================

SELECT 
  '🤖 TAUX ENRICHISSEMENT' as test_name,
  scraping_source,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE enriched = true) as enriched,
  ROUND(
    COUNT(*) FILTER (WHERE enriched = true)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as enrichment_rate,
  CASE 
    WHEN COUNT(*) FILTER (WHERE enriched = true)::numeric / NULLIF(COUNT(*), 0) >= 0.8 THEN '✅ EXCELLENT (>80%)'
    WHEN COUNT(*) FILTER (WHERE enriched = true)::numeric / NULLIF(COUNT(*), 0) >= 0.5 THEN '⚠️ MOYEN (50-80%)'
    ELSE '❌ FAIBLE (<50%)'
  END as status
FROM jobs
WHERE scraping_source IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY scraping_source
ORDER BY enrichment_rate DESC;

-- 4. QUALITÉ DES DONNÉES
-- =====================================================

SELECT 
  '⭐ QUALITÉ DONNÉES' as test_name,
  scraping_source,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE title IS NOT NULL AND title != '') as has_title,
  COUNT(*) FILTER (WHERE company IS NOT NULL AND company != '') as has_company,
  COUNT(*) FILTER (WHERE url IS NOT NULL AND url != '') as has_url,
  COUNT(*) FILTER (WHERE skills IS NOT NULL AND jsonb_array_length(skills) > 0) as has_skills,
  ROUND(
    (
      COUNT(*) FILTER (WHERE title IS NOT NULL AND title != '') +
      COUNT(*) FILTER (WHERE company IS NOT NULL AND company != '') +
      COUNT(*) FILTER (WHERE url IS NOT NULL AND url != '')
    )::numeric / (COUNT(*) * 3) * 100,
    2
  ) as data_completeness,
  CASE 
    WHEN (
      COUNT(*) FILTER (WHERE title IS NOT NULL AND title != '') +
      COUNT(*) FILTER (WHERE company IS NOT NULL AND company != '') +
      COUNT(*) FILTER (WHERE url IS NOT NULL AND url != '')
    )::numeric / (COUNT(*) * 3) >= 0.95 THEN '✅ EXCELLENT'
    WHEN (
      COUNT(*) FILTER (WHERE title IS NOT NULL AND title != '') +
      COUNT(*) FILTER (WHERE company IS NOT NULL AND company != '') +
      COUNT(*) FILTER (WHERE url IS NOT NULL AND url != '')
    )::numeric / (COUNT(*) * 3) >= 0.8 THEN '⚠️ BON'
    ELSE '❌ INCOMPLET'
  END as status
FROM jobs
WHERE scraping_source IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY scraping_source;

-- 5. DOUBLONS
-- =====================================================

SELECT 
  '🔍 DÉTECTION DOUBLONS' as test_name,
  COUNT(*) as duplicate_groups,
  SUM(duplicate_count - 1) as total_duplicates,
  CASE 
    WHEN SUM(duplicate_count - 1) = 0 THEN '✅ AUCUN DOUBLON'
    WHEN SUM(duplicate_count - 1) < 10 THEN '⚠️ PEU DE DOUBLONS'
    ELSE '❌ TROP DE DOUBLONS'
  END as status
FROM (
  SELECT 
    title,
    company,
    COUNT(*) as duplicate_count
  FROM jobs
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY title, company
  HAVING COUNT(*) > 1
) duplicates;

-- 6. ERREURS D'ENRICHISSEMENT
-- =====================================================

SELECT 
  '❌ ERREURS ENRICHISSEMENT' as test_name,
  COUNT(*) as error_count,
  COUNT(DISTINCT enrichment_error) as unique_errors,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ AUCUNE ERREUR'
    WHEN COUNT(*) < 10 THEN '⚠️ PEU D\'ERREURS'
    ELSE '❌ TROP D\'ERREURS'
  END as status
FROM jobs
WHERE enrichment_error IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days';

-- Détail des erreurs
SELECT 
  enrichment_error,
  COUNT(*) as count,
  ARRAY_AGG(DISTINCT scraping_source) as affected_sources
FROM jobs
WHERE enrichment_error IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY enrichment_error
ORDER BY count DESC
LIMIT 5;

-- 7. PERFORMANCE SCRAPING
-- =====================================================

SELECT 
  '⚡ PERFORMANCE SCRAPING' as test_name,
  DATE_TRUNC('hour', created_at) as hour,
  scraping_source,
  COUNT(*) as jobs_scraped,
  CASE 
    WHEN COUNT(*) >= 20 THEN '✅ EXCELLENT'
    WHEN COUNT(*) >= 10 THEN '⚠️ MOYEN'
    ELSE '❌ FAIBLE'
  END as status
FROM jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND scraping_source IS NOT NULL
GROUP BY DATE_TRUNC('hour', created_at), scraping_source
ORDER BY hour DESC, jobs_scraped DESC
LIMIT 10;

-- 8. TOP COMPÉTENCES EXTRAITES
-- =====================================================

SELECT 
  '🎯 TOP COMPÉTENCES' as test_name,
  skill,
  COUNT(*) as job_count,
  ARRAY_AGG(DISTINCT scraping_source) as sources
FROM jobs,
  jsonb_array_elements_text(skills) as skill
WHERE enriched = true
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY skill
ORDER BY job_count DESC
LIMIT 10;

-- 9. DISTRIBUTION NIVEAUX EXPÉRIENCE
-- =====================================================

SELECT 
  '📊 NIVEAUX EXPÉRIENCE' as test_name,
  experience_level,
  COUNT(*) as job_count,
  ROUND(AVG(quality_score), 2) as avg_quality,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ DONNÉES PRÉSENTES'
    ELSE '❌ AUCUNE DONNÉE'
  END as status
FROM jobs
WHERE enriched = true
  AND created_at > NOW() - INTERVAL '7 days'
  AND experience_level IS NOT NULL
GROUP BY experience_level
ORDER BY job_count DESC;

-- 10. DISTRIBUTION TÉLÉTRAVAIL
-- =====================================================

SELECT 
  '🏠 TÉLÉTRAVAIL' as test_name,
  remote_type,
  COUNT(*) as job_count,
  ROUND(
    COUNT(*)::numeric / 
    (SELECT COUNT(*) FROM jobs WHERE enriched = true AND created_at > NOW() - INTERVAL '7 days') * 100,
    2
  ) as percentage,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ DONNÉES PRÉSENTES'
    ELSE '❌ AUCUNE DONNÉE'
  END as status
FROM jobs
WHERE enriched = true
  AND created_at > NOW() - INTERVAL '7 days'
  AND remote_type IS NOT NULL
GROUP BY remote_type
ORDER BY job_count DESC;

-- 11. RÉSUMÉ EXÉCUTIF
-- =====================================================

SELECT 
  '📈 RÉSUMÉ EXÉCUTIF' as section,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as jobs_last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as jobs_last_7days,
  COUNT(*) FILTER (WHERE enriched = true) as enriched_jobs,
  ROUND(
    COUNT(*) FILTER (WHERE enriched = true)::numeric / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as enrichment_rate,
  ROUND(AVG(quality_score), 2) as avg_quality_score,
  COUNT(DISTINCT scraping_source) as active_sources,
  COUNT(*) FILTER (WHERE enrichment_error IS NOT NULL) as jobs_with_errors,
  CASE 
    WHEN COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') > 50 THEN '✅ EXCELLENT'
    WHEN COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') > 20 THEN '⚠️ MOYEN'
    WHEN COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') > 0 THEN '⚠️ FAIBLE'
    ELSE '❌ AUCUNE ACTIVITÉ'
  END as overall_status
FROM jobs
WHERE scraping_source IS NOT NULL;

-- 12. VÉRIFICATION WORKFLOW ERROR LOGGER
-- =====================================================

SELECT 
  '🚨 ERROR LOGGER' as test_name,
  COUNT(*) as total_errors,
  COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_errors,
  COUNT(*) FILTER (WHERE severity = 'HIGH') as high_errors,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as errors_24h,
  CASE 
    WHEN COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND created_at > NOW() - INTERVAL '24 hours') > 0 THEN '❌ ERREURS CRITIQUES'
    WHEN COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') > 10 THEN '⚠️ BEAUCOUP D\'ERREURS'
    WHEN COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') > 0 THEN '⚠️ QUELQUES ERREURS'
    ELSE '✅ AUCUNE ERREUR'
  END as status
FROM workflow_errors;

-- Détail erreurs récentes
SELECT 
  workflow_name,
  severity,
  error_message,
  created_at
FROM workflow_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY 
  CASE severity
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    ELSE 4
  END,
  created_at DESC
LIMIT 10;

-- 13. RECOMMANDATIONS
-- =====================================================

SELECT 
  '💡 RECOMMANDATIONS' as section,
  CASE 
    WHEN (SELECT COUNT(*) FROM jobs WHERE created_at > NOW() - INTERVAL '24 hours') = 0 
      THEN '❌ URGENT: Aucun job scrapé - Vérifier workflows N8N'
    WHEN (SELECT COUNT(*) FILTER (WHERE enriched = true)::numeric / NULLIF(COUNT(*), 0) FROM jobs WHERE created_at > NOW() - INTERVAL '7 days') < 0.5
      THEN '⚠️ Taux enrichissement faible - Vérifier Mammouth.ai'
    WHEN (SELECT COUNT(*) FROM workflow_errors WHERE severity = 'CRITICAL' AND created_at > NOW() - INTERVAL '24 hours') > 0
      THEN '❌ URGENT: Erreurs critiques - Consulter workflow_errors'
    WHEN (SELECT COUNT(*) FROM jobs WHERE enrichment_error IS NOT NULL AND created_at > NOW() - INTERVAL '7 days') > 20
      THEN '⚠️ Trop d\'erreurs enrichissement - Vérifier prompts IA'
    ELSE '✅ Tout fonctionne correctement'
  END as recommendation;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- NOTES D'UTILISATION:
-- 1. Exécuter ce script dans Supabase SQL Editor
-- 2. Vérifier tous les statuts (✅ ⚠️ ❌)
-- 3. Investiguer les ❌ en priorité
-- 4. Consulter workflow_errors pour détails erreurs
-- 5. Relancer workflows N8N si nécessaire
