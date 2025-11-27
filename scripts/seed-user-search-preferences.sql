-- =================================================================
-- Seed helper for user search preferences (test workflow trigger)
-- Replace CURRENT_USER_ID with the actual Supabase user ID before running.
-- =================================================================

INSERT INTO user_search_preferences (user_id, criteria, skills, created_at, updated_at)
VALUES (
  'CURRENT_USER_ID',
  '{"keywords": "Développeur React", "location": "Paris, France", "contract_type": "Freelance"}'::jsonb,
  '["React", "TypeScript", "Node.js", "Tailwind"]'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  criteria = EXCLUDED.criteria,
  skills = EXCLUDED.skills,
  updated_at = NOW();
