-- 1. Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Ajouter les colonnes d'embeddings
-- OpenAI text-embedding-3-small génère des vecteurs de dimension 1536
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS linkedin text,
ADD COLUMN IF NOT EXISTS website text;

-- 3. Créer un index vectoriel pour la recherche rapide (HNSW)
-- Utilise la similarité cosinus (inner product ou cosine distance)
CREATE INDEX IF NOT EXISTS jobs_embedding_idx ON public.jobs 
USING hnsw (embedding vector_cosine_ops);

-- 4. Fonction SQL pour la recherche sémantique
-- Renvoie les jobs les plus proches d'un vecteur donné
CREATE OR REPLACE FUNCTION match_jobs_semantic(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  company text,
  description text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id,
    j.title,
    j.company,
    j.description,
    1 - (j.embedding <=> query_embedding) AS similarity
  FROM jobs j
  WHERE 1 - (j.embedding <=> query_embedding) > match_threshold
  ORDER BY j.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Mettre à jour la table des suggestions pour stocker le score sémantique si nécessaire
-- On peut ajouter une colonne semantic_score à job_suggestions
ALTER TABLE public.job_suggestions
ADD COLUMN IF NOT EXISTS semantic_score float;

-- 6. Triggers pour la génération automatique d'embeddings via Edge Function

-- Fonction pour les jobs
CREATE OR REPLACE FUNCTION public.on_job_upsert_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Appeler l'Edge Function de manière asynchrone via pg_net
  PERFORM net.http_post(
    url := 'https://klwugophjvzctlautsqz.supabase.co/functions/v1/generate-embeddings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsd3Vnb3BoanZ6Y3RsYXV0c3F6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDAwODQxMSwiZXhwIjoyMDY1NTg0NDExfQ.ZjapEpSPUE4PGzIkZ_MRfY77v2ML82MyFIKffEPfG8o'
    ),
    body := jsonb_build_object(
      'table', 'jobs',
      'id', NEW.id,
      'text', NEW.title || ' ' || COALESCE(NEW.company, '') || ' ' || COALESCE(NEW.description, '')
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour l'insertion de jobs
CREATE TRIGGER tr_job_insert_embedding
AFTER INSERT ON public.jobs
FOR EACH ROW
WHEN (NEW.embedding IS NULL)
EXECUTE FUNCTION public.on_job_upsert_embedding();

-- Trigger pour la mise à jour de jobs
CREATE TRIGGER tr_job_update_embedding
AFTER UPDATE OF title, description ON public.jobs
FOR EACH ROW
WHEN (OLD.title IS DISTINCT FROM NEW.title OR OLD.description IS DISTINCT FROM NEW.description)
EXECUTE FUNCTION public.on_job_upsert_embedding();

-- Fonction pour les profils
CREATE OR REPLACE FUNCTION public.on_profile_upsert_embedding()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://klwugophjvzctlautsqz.supabase.co/functions/v1/generate-embeddings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsd3Vnb3BoanZ6Y3RsYXV0c3F6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDAwODQxMSwiZXhwIjoyMDY1NTg0NDExfQ.ZjapEpSPUE4PGzIkZ_MRfY77v2ML82MyFIKffEPfG8o'
    ),
    body := jsonb_build_object(
      'table', 'profiles',
      'id', NEW.id,
      'text', COALESCE(NEW.full_name, '') || ' ' || COALESCE(NEW.headline, '') || ' ' || COALESCE(NEW.bio, '')
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour l'insertion de profils
CREATE TRIGGER tr_profile_insert_embedding
AFTER INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.embedding IS NULL)
EXECUTE FUNCTION public.on_profile_upsert_embedding();

-- Trigger pour la mise à jour de profils
CREATE TRIGGER tr_profile_update_embedding
AFTER UPDATE OF full_name, title, bio ON public.profiles
FOR EACH ROW
WHEN (OLD.full_name IS DISTINCT FROM NEW.full_name OR OLD.title IS DISTINCT FROM NEW.title OR OLD.bio IS DISTINCT FROM NEW.bio)
EXECUTE FUNCTION public.on_profile_upsert_embedding();

-- 7. Refonte de calculate_job_suggestions avec score hybride
CREATE OR REPLACE FUNCTION calculate_job_suggestions(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_user_skills text[];
  v_user_embedding vector(1536);
  v_job record;
  v_skill_score numeric;
  v_semantic_score numeric;
  v_final_score numeric;
BEGIN
  -- Récupérer les compétences et l'embedding de l'utilisateur
  SELECT array_agg(s.name)
  INTO v_user_skills
  FROM user_skills us
  JOIN skills s ON s.id = us.skill_id
  WHERE us.user_id = p_user_id;

  SELECT embedding INTO v_user_embedding
  FROM profiles WHERE id = p_user_id;

  -- Supprimer les anciennes suggestions
  DELETE FROM job_suggestions WHERE user_id = p_user_id;

  -- Pour chaque offre d'emploi des 30 derniers jours
  FOR v_job IN
    SELECT 
      j.id,
      j.embedding,
      array_agg(s.name) FILTER (WHERE js.importance = 'required') as required_skills,
      array_agg(s.name) FILTER (WHERE js.importance = 'preferred') as preferred_skills
    FROM jobs j
    LEFT JOIN job_skills js ON js.job_id = j.id
    LEFT JOIN skills s ON s.id = js.skill_id
    WHERE j.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY j.id, j.embedding
  LOOP
    -- A. Calcul du score par compétences (Skills Score)
    v_skill_score := (
      COALESCE((
        SELECT COUNT(*) * 60.0 / NULLIF(array_length(v_job.required_skills, 1), 0)
        FROM unnest(v_user_skills) us
        WHERE us = ANY(v_job.required_skills)
      ), 0) +
      COALESCE((
        SELECT COUNT(*) * 40.0 / NULLIF(array_length(v_job.preferred_skills, 1), 0)
        FROM unnest(v_user_skills) us
        WHERE us = ANY(v_job.preferred_skills)
      ), 0)
    );

    -- B. Calcul du score sémantique (Semantic Score)
    IF v_user_embedding IS NOT NULL AND v_job.embedding IS NOT NULL THEN
      v_semantic_score := (1 - (v_job.embedding <=> v_user_embedding)) * 100;
    ELSE
      v_semantic_score := 0;
    END IF;

    -- C. Score final hybride (50% Skills, 50% Semantic)
    -- Si pas d'embedding, on reste sur 100% Skills
    IF v_semantic_score > 0 THEN
      v_final_score := (v_skill_score * 0.5) + (v_semantic_score * 0.5);
    ELSE
      v_final_score := v_skill_score;
    END IF;

    -- Sauvegarder si score significatif (> 20)
    IF v_final_score > 20 THEN
      INSERT INTO job_suggestions (user_id, job_id, match_score, semantic_score)
      VALUES (p_user_id, v_job.id, v_final_score, v_semantic_score);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
