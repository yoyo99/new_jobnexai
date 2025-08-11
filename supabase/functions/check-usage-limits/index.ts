import { createClient } from '../_shared/deps.ts';
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const TIER_LIMITS = {
  trial: { applications: 5, scraping_jobs: 2, cover_letters: 5 },
  starter: { applications: 50, scraping_jobs: 10, cover_letters: 50 },
  professional: { applications: 200, scraping_jobs: 50, cover_letters: -1 }, // -1 means unlimited
  enterprise: { applications: -1, scraping_jobs: -1, cover_letters: -1 }
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let userId: string | undefined;
    let action: string | undefined;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      userId = url.searchParams.get('userId') ?? undefined;
      action = url.searchParams.get('action') ?? undefined;
    } else {
      const body = await req.json().catch(() => ({} as Record<string, unknown>));
      userId = (body as any).userId as string | undefined;
      action = (body as any).action as string | undefined;
    }

    if (!userId || !action) {
      return new Response(JSON.stringify({ error: 'userId and action are required.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get user's subscription tier and current usage
    const { data: user, error: userError } = await supabase
      .from('user_subscriptions')
      .select('tier, usage')
      .eq('user_id', userId)
      .single();

    if (userError) throw userError;
    if (!user) throw new Error('User subscription not found.');

    // Validate tier type
    const tierKey = user.tier as keyof typeof TIER_LIMITS;
    if (!tierKey || !(tierKey in TIER_LIMITS)) {
      throw new Error(`Invalid tier: ${user.tier}`);
    }
    
    const limits = TIER_LIMITS[tierKey];

    const actionKey = action as keyof typeof limits;

    const currentUsage = user.usage?.[actionKey] || 0;
    const limit = limits[actionKey];

    if (limit === undefined) throw new Error(`Invalid action: ${action}`);

    const canProceed = limit === -1 || currentUsage < limit;

    // If the request is a POST, it implies an intent to consume the action
    if (canProceed && req.method === 'POST') {
      // Increment usage count
      const newUsage = { ...user.usage, [actionKey]: currentUsage + 1 };
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ usage: newUsage, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (updateError) throw updateError;
    }

    return new Response(JSON.stringify({ 
      canProceed, 
      currentUsage, 
      limit, 
      remaining: limit === -1 ? 'unlimited' : limit - currentUsage 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error('Error in check-usage-limits function:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
