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

  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
      status: 500,
    });
  }

  try {
    const { table, id, text } = await req.json();

    if (!table || !id || !text) {
      return new Response(
        JSON.stringify({ error: "Missing required fields (table, id, text)" }),
        { status: 400 },
      );
    }

    console.log(
      `[generate-embeddings] Generating embedding for ${table}:${id}...`,
    );

    // 1. Appeler l'API OpenAI pour générer les embeddings
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.slice(0, 8000), // OpenAI limit approx 8k tokens
      }),
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);

    const embedding = result.data[0].embedding;

    // 2. Mettre à jour la ligne dans Supabase
    const { error: updateError } = await supabaseClient
      .from(table)
      .update({ embedding })
      .eq("id", id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[generate-embeddings] error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
