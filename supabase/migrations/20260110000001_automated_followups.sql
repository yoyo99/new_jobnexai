-- Migration pour le suivi des automatisations et les relances IA

-- 1. Table de logs pour les automatisations n8n / Edge Functions
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL, -- 'n8n', 'edge-function'
  action text NOT NULL, -- 'scraping', 'auto-apply', 'follow-up'
  status text NOT NULL, -- 'success', 'error', 'pending'
  message text,
  metadata jsonb DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Activation de RLS sur logs
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own automation logs"
  ON public.automation_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Vue pour identifier les candidatures nécessitant une relance (> 7 jours sans réponse)
CREATE OR REPLACE VIEW v_pending_followups AS
SELECT 
  ja.id as application_id,
  ja.user_id,
  ja.job_id,
  j.title as job_title,
  j.company as job_company,
  ja.applied_at,
  ja.status
FROM job_applications ja
JOIN jobs j ON ja.job_id = j.id
WHERE ja.status = 'applied'
  AND ja.applied_at < NOW() - INTERVAL '7 days'
  AND NOT EXISTS (
    SELECT 1 FROM automation_logs al 
    WHERE al.user_id = ja.user_id 
      AND al.action = 'follow-up' 
      AND (al.metadata->>'application_id')::uuid = ja.id
      AND al.created_at > ja.applied_at
  );

-- 3. Trigger pour mettre à jour automatiquement le badge de relance si besoin (Optionnel car calculé en JS/SQL)
-- Le frontend utilise déjà une logique de date pour afficher le badge.
