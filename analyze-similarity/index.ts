// Deprecated stub: use Supabase Edge Function at supabase/functions/analyze-similarity

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  return new Response(
    JSON.stringify({
      error: 'Deprecated endpoint. Use supabase/functions/analyze-similarity instead.',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 410 }
  )
})