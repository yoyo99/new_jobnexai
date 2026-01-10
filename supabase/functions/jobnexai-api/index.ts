import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { pathname } = new URL(req.url);
  const pathParts = pathname.split("/").filter(Boolean);

  // Extract route: /functions/v1/jobnexai-api/users/{userId}/...
  const routeParts = pathParts.slice(3); // Skip 'functions', 'v1', 'jobnexai-api'
  const [resource, id, action, subAction] = routeParts;

  try {
    // GET /users/{userId}/auto-apply-settings
    if (
      resource === "users" && id && action === "auto-apply-settings" &&
      req.method === "GET"
    ) {
      const { data } = await supabaseClient
        .from("user_auto_apply_settings")
        .select("*")
        .eq("user_id", id)
        .single();

      const settings = data || {
        max_applications_per_day: 20,
        min_match_score: 0.6,
        mode: "review",
        job_types: ["CDI", "Freelance"],
        countries: ["FR"],
      };

      return new Response(JSON.stringify(settings), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /users/{userId}/auto-apply-stats/today
    if (
      resource === "users" && id && action === "auto-apply-stats" &&
      subAction === "today"
    ) {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabaseClient
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id)
        .gte("created_at", today)
        .or("is_auto.eq.true,status.eq.applied");

      return new Response(
        JSON.stringify({
          alreadyAppliedToday: count || 0,
          maxApplicationsPerDay: 20,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // POST /users/{userId}/auto-apply - Trigger n8n workflow
    if (
      resource === "users" && id && action === "auto-apply" &&
      req.method === "POST"
    ) {
      const body = await req.json();

      // Get user's matched jobs
      const { data: jobs } = await supabaseClient
        .from("job_matches")
        .select("*, jobs(*)")
        .eq("user_id", id)
        .gte("score", 0.6)
        .limit(10);

      // Here you would call your n8n webhook
      // For now, return the matched jobs
      return new Response(
        JSON.stringify({
          success: true,
          message: "Auto-apply triggered",
          matchedJobs: jobs?.length || 0,
          mode: body.mode || "review",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // GET /jobs/{userId} - Get matched jobs for user
    if (resource === "jobs" && id) {
      const { data } = await supabaseClient
        .from("job_matches")
        .select("*, jobs(*)")
        .eq("user_id", id)
        .order("score", { ascending: false });

      return new Response(JSON.stringify({ jobs: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Not Found", path: pathname }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
