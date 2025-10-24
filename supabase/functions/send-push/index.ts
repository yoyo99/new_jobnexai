import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PushPayload {
  user_id: string;
  job_title: string;
  job_company: string;
  job_score: number;
  job_id: string;
}

serve(async (req: Request) => {
  try {
    // Vérifier méthode
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parser payload
    const payload: PushPayload = await req.json();
    const { user_id, job_title, job_company, job_score, job_id } = payload;

    // Valider champs requis
    if (!user_id || !job_title || !job_company || !job_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialiser Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Récupérer FCM token et prenom
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("fcm_token, prenom")
      .eq("user_id", user_id)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!profile.fcm_token) {
      console.warn(`No FCM token for user ${user_id}`);
      return new Response(
        JSON.stringify({ error: "No FCM token" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Préparer message
    const title = `Nouvelle offre (${job_score}% match)`;
    const body = `${job_title} chez ${job_company}`;
    const prenom = profile.prenom ? `Bonjour ${profile.prenom}, ` : "";

    // Envoyer via Expo Push Notifications
    const expoToken = Deno.env.get("EXPO_ACCESS_TOKEN");
    if (!expoToken) {
      console.error("EXPO_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Push service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${expoToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        to: profile.fcm_token,
        sound: "default",
        title: title,
        body: body,
        data: {
          job_id: job_id,
          screen: "JobDetails",
          params: JSON.stringify({ jobId: job_id })
        },
        priority: "high",
        channelId: "job-offers",
        badge: 1
      })
    });

    const pushResult = await pushResponse.json();

    // Vérifier erreur Expo
    if (!pushResponse.ok) {
      console.error("Expo push error:", pushResult);
      return new Response(
        JSON.stringify({ error: "Push service error", details: pushResult }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier statut dans réponse
    if (pushResult.data && Array.isArray(pushResult.data)) {
      const firstResult = pushResult.data[0];
      if (firstResult.status === "error") {
        console.error("Expo error:", firstResult.message);
        return new Response(
          JSON.stringify({ error: "Push failed", message: firstResult.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Marquer notification comme envoyée
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ sent: true, sent_at: new Date().toISOString() })
      .eq("id", job_id);

    if (updateError) {
      console.warn("Could not update notification status:", updateError);
    }

    console.log(`✅ Push sent to ${user_id}: ${title}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Push notification sent",
        result: pushResult
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
