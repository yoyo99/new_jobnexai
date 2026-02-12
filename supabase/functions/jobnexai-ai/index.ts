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
    const body = await req.json();
    const { action, jobDetails, job, appliedAt, company, jobTitle } = body;

    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    // Action: Générer une relance
    if (action === "generate_followup") {
      const title = jobTitle || jobDetails?.title || job?.title || "le poste";
      const comp = company || jobDetails?.company || job?.company ||
        "l'entreprise";

      if (!groqApiKey) {
        return new Response(
          JSON.stringify({
            success: true,
            pitch:
              `Bonjour, je reviens vers vous concernant ma candidature du ${appliedAt} pour le poste de ${title}.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
                `Rédige un message de relance court et professionnel (2-3 phrases) pour une candidature envoyée le ${appliedAt}. 
            Poste : ${title}
            Entreprise : ${comp}
            Réponds UNIQUEMENT en JSON: {"pitch": "ton message"}`,
            }],
            temperature: 0.5,
          }),
        },
      );

      const aiResult = await groqResponse.json();
      const content = aiResult.choices?.[0]?.message?.content || "{}";
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(cleanContent);
      } catch (err) {
        const error = err as Error;
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify({ success: true, ...parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action par défaut: Générer une candidature
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({
          success: true,
          summaryPitch: `Candidature pour ${jobDetails?.title || "ce poste"}`,
          motivationAnswer:
            `Je suis très intéressé(e) par cette opportunité chez ${
              jobDetails?.company || "votre entreprise"
            }.`,
          profileHighlights: [
            "Compétences techniques",
            "Expérience",
            "Motivation",
          ],
          generatedAt: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
            DESCRIPTION: ${
                jobDetails?.description?.slice(0, 500) || "Non disponible"
              }
            Réponds UNIQUEMENT en JSON: {"summaryPitch": "...", "motivationAnswer": "...", "profileHighlights": ["...", "...", "..."]}`,
          }],
          temperature: 0.3,
        }),
      },
    );

    const aiResult = await groqResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || "{}";
    const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch {
      parsed = {
        summaryPitch: content.slice(0, 200),
        motivationAnswer: content.slice(0, 500),
        profileHighlights: ["Profil adapté"],
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
  } catch (err) {
    const error = err as Error;
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
