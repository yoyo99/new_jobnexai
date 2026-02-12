-- Migration pour automatiser les notifications sur les suggestions d'emploi

-- 1. S'assurer que les colonnes nécessaires existent dans notifications (si besoin)
-- Note: On assume que la table 'notifications' existe déjà comme vu dans les triggers précédents.

-- 2. Trigger pour créer une notification lors d'une nouvelle suggestion d'emploi
CREATE OR REPLACE FUNCTION notify_new_job_suggestion()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title text;
  v_job_company text;
BEGIN
  -- Récupérer les infos du job
  SELECT title, company INTO v_job_title, v_job_company
  FROM public.jobs
  WHERE id = NEW.job_id;

  -- Insérer la notification seulement si le score est significatif (> 70%)
  IF NEW.match_score >= 0.7 THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      content,
      link
    ) VALUES (
      NEW.user_id,
      'job_match',
      'Nouveau match trouvé !',
      format('Un poste de %s chez %s correspond à %s%% de votre profil.', v_job_title, v_job_company, round(NEW.match_score * 100)),
      '/search' -- Ou un lien direct vers le job si un jour on a /jobs/:id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attacher le trigger à job_suggestions
DROP TRIGGER IF EXISTS on_job_suggestion_insert ON job_suggestions;
CREATE TRIGGER on_job_suggestion_insert
  AFTER INSERT ON job_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_job_suggestion();

-- 4. Template pour les alertes emploi (Email)
INSERT INTO public.notification_templates (type, title_template, content_template, channel)
VALUES ('job_match_email', 'Nouveau match : {{job_title}}', 'Bonjour {{user_name}}, nous avons trouvé un job qui vous correspond à {{match_score}}%.', 'email')
ON CONFLICT DO NOTHING;
