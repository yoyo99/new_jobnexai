import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

let supabaseServiceRoleClient: SupabaseClient<Database> | null = null

export function getSupabaseServiceRoleClient(): SupabaseClient<Database> {
  if (supabaseServiceRoleClient) {
    return supabaseServiceRoleClient
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL (ou VITE_SUPABASE_URL) doit être défini pour le client service role')
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY doit être défini côté serveur')
  }

  supabaseServiceRoleClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'jobnexai-service-role-client',
      },
    },
  })

  return supabaseServiceRoleClient
}
