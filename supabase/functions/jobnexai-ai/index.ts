import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, mode, job, jobDetails } = await req.json();

    // Use Groq API for fast inference (free tier available)
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!groqApiKey) {
      // Fallback: generate basic content without AI
      return new Response(
        JSON.stringify({
          success: true,
          summaryPitch: `Candidature pour ${jobDetails?.title || "ce poste"}`,
          motivationAnswer:
            `Je suis très intéressé(e) par cette opportunité chez ${
              jobDetails?.company || "votre entreprise"
            }.`,
          profileHighlights: [
            "Compétences techniques solides",
            "Expérience pertinente",
            "Motivation forte",
          ],
          generatedAt: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [{
            role: "user",
            content:
              `Génère une candidature optimisée en français pour ce poste.

POSTE: ${jobDetails?.title || job?.title || "Non spécifié"}
ENTREPRISE: ${jobDetails?.company || job?.company || "Non spécifié"}
DESCRIPTION: ${jobDetails?.description?.slice(0, 500) || "Non disponible"}

Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "summaryPitch": "Un pitch de 2-3 phrases percutantes",
  "motivationAnswer": "Une réponse de motivation de 4-5 phrases",
  "profileHighlights": ["Point fort 1", "Point fort 2", "Point fort 3"]
}`,
          }],
          temperature: 0.3,
          max_tokens: 800,
        }),
      },
    );

    const aiResult = await groqResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || "{}";

    // Parse JSON from AI response
    let parsed;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleanContent);
    } catch {
      parsed = {
        summaryPitch: content.slice(0, 200),
        motivationAnswer: content.slice(0, 500),
        profileHighlights: ["Profil adapté au poste"],
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...parsed,
        generatedAt: new Date().toISOString(),
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
