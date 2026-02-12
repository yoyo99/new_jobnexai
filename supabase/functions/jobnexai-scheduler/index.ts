import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    console.log("[jobnexai-scheduler] Checking for pending follow-ups...");

    // 1. Récupérer les candidatures nécessitant une relance
    const { data: pendingFollowups, error: fetchError } = await supabaseClient
      .from("v_pending_followups")
      .select("*");

    if (fetchError) throw fetchError;

    const results = [];

    for (const followup of (pendingFollowups || [])) {
      console.log(
        `[jobnexai-scheduler] Processing follow-up for user ${followup.user_id}, application ${followup.application_id}`,
      );

      // 2. Appeler jobnexai-ai pour générer un message de relance
      // Note: On simule l'appel interne ou on fait un fetch direct
      const aiResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/jobnexai-ai`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
            }`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "generate_followup",
            jobTitle: followup.job_title,
            company: followup.job_company,
            appliedAt: followup.applied_at,
          }),
        },
      );

      const aiData = await aiResponse.json();

      // 3. Logger l'action
      const { error: logError } = await supabaseClient
        .from("automation_logs")
        .insert({
          user_id: followup.user_id,
          source: "edge-function",
          action: "follow-up",
          status: aiResponse.ok ? "success" : "error",
          message: aiResponse.ok
            ? `Relance générée pour ${followup.job_company}`
            : `Erreur IA: ${aiData.error}`,
          metadata: {
            application_id: followup.application_id,
            job_id: followup.job_id,
            pitch: aiData.pitch || null,
          },
        });

      if (logError) {
        console.error("[jobnexai-scheduler] Error logging action:", logError);
      }

      results.push({
        application_id: followup.application_id,
        status: aiResponse.ok ? "processed" : "failed",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        details: results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const error = err as Error;
    console.error("[jobnexai-scheduler] Fatal error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
