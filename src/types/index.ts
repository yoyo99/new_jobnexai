// Re-export Job from supabase
export type { Job } from "../lib/supabase";

// Custom Profile type for the simplified app (different from the DB Profile)
export interface Profile {
    summary: string;
}
