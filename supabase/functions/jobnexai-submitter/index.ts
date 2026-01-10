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
    const { userId, job, applicationContent } = await req.json();

    // Create application record in database
    const { data: application, error } = await supabaseClient
      .from("job_applications")
      .insert({
        user_id: userId,
        job_id: job.id,
        status: "applied",
        is_auto: true,
        notes: `Auto-candidature générée par IA.\n\n${
          applicationContent?.motivationAnswer || ""
        }`,
        applied_at: new Date().toISOString(),
        ai_content: applicationContent,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the submission
    await supabaseClient
      .from("application_logs")
      .insert({
        user_id: userId,
        job_id: job.id,
        application_id: application?.id,
        action: "auto_submit",
        details: {
          source: job.source,
          method: "edge_function",
          timestamp: new Date().toISOString(),
        },
      })
      .catch(() => {}); // Ignore if logs table doesn't exist

    return new Response(
      JSON.stringify({
        success: true,
        applicationId: application?.id,
        jobId: job.id,
        userId,
        submittedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
