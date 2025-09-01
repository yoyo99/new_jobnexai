-- This migration enables Row-Level Security (RLS) on tables that were previously unrestricted.

-- 1. Secure `user_cv_embeddings` table
ALTER TABLE public.user_cv_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own CV embeddings" 
ON public.user_cv_embeddings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Secure `job_queue` table
-- Assumption: The user_id is stored within the 'payload' JSONB column.
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own job queue" 
ON public.job_queue
FOR ALL
TO authenticated
USING ((payload->>'user_id')::uuid = auth.uid())
WITH CHECK ((payload->>'user_id')::uuid = auth.uid());

-- 3. Secure `job_results` table
-- Assumption: Access is granted if the user owns the corresponding job in the job_queue.
ALTER TABLE public.job_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view results for their own jobs" 
ON public.job_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM job_queue jq
    WHERE jq.id = job_results.job_id AND (jq.payload->>'user_id')::uuid = auth.uid()
  )
);

-- 4. Secure `job_embeddings` table
-- Assumption: The `jobs` table has a `user_id` column to link ownership.
ALTER TABLE public.job_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view embeddings for their own jobs" 
ON public.job_embeddings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM jobs j
    WHERE j.id = job_embeddings.job_id AND j.user_id = auth.uid()
  )
);

-- 5. Re-affirm policy on `user_cvs` just in case
-- This was likely already active but we ensure it here.
ALTER TABLE public.user_cvs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own CVs" ON public.user_cvs;
CREATE POLICY "Users can manage their own CVs"
  ON public.user_cvs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
