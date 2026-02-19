// Re-export Job from supabase
export type { Job } from "../lib/supabase";

// Profile type complet pour l'application
export interface Profile {
  id?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  current_position?: string;
  years_of_experience?: number;
  skills?: string[];
  education?: string;
  location?: string;
  summary: string;
  avatar_url?: string;
  plan?: string;
}
