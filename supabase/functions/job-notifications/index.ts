import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  frequency: "immediate" | "daily" | "weekly";
  job_types: string[];
  locations: string[];
  salary_min?: number;
  keywords: string[];
}

interface JobOffer {
  id: string;
  title: string;
  company: string;
  description: string;
  location?: string;
  salary?: string;
  contract_type?: string;
  created_at: string;
  source: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === "POST") {
      const { action, userId, preferences } = await req.json();

      if (action === "update_preferences") {
        const { error } = await supabase
          .from("notification_settings")
          .upsert({
            user_id: userId,
            ...preferences,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Préférences mises à jour",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (action === "send_notifications") {
        const notifications = await processJobNotifications();
        return new Response(
          JSON.stringify({
            success: true,
            message: `${notifications.length} notifications envoyées`,
            notifications,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (action === "mark_as_read") {
        const { notificationId } = await req.json();
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", notificationId);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (req.method === "GET") {
      const url = new URL(req.url);
      const userId = url.searchParams.get("userId");
      const action = url.searchParams.get("action");

      if (action === "preferences" && userId) {
        const { data: preferences, error } = await supabase
          .from("notification_settings")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({
            preferences: preferences || getDefaultPreferences(),
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (action === "notifications" && userId) {
        const { data: notifications, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ notifications }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in job notifications:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processJobNotifications(): Promise<any[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const notifications = [];

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Modification pour utiliser la table 'jobs' qui semble être le standard
    const { data: newJobs, error: jobsError } = await supabase
      .from("jobs")
      .select("*")
      .gte("created_at", yesterday.toISOString());

    if (jobsError) {
      console.error("Error fetching new jobs:", jobsError);
      return notifications;
    }

    // Récupérer les préférences
    const { data: users, error: usersError } = await supabase
      .from("notification_settings")
      .select(`
        *,
        profiles!inner(id, email, full_name)
      `)
      .eq("email_notifications", true);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return notifications;
    }

    for (const user of users || []) {
      const matchingJobs = filterJobsForUser(newJobs || [], user);

      if (matchingJobs.length > 0) {
        const notification = {
          user_id: user.user_id,
          title: `${matchingJobs.length} nouvelle(s) offre(s) d'emploi`,
          content:
            `Nous avons trouvé ${matchingJobs.length} nouvelle(s) offre(s) correspondant à vos critères.`,
          type: "job_match",
          read: false,
          created_at: new Date().toISOString(),
        };

        const { error: notifError } = await supabase
          .from("notifications")
          .insert(notification);

        if (!notifError) {
          notifications.push(notification);

          if (user.email_notifications) {
            await sendEmailNotification(
              user.profiles.email,
              user.profiles.full_name,
              matchingJobs,
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error processing notifications:", error);
  }

  return notifications;
}

function filterJobsForUser(jobs: JobOffer[], user: any): JobOffer[] {
  return jobs.filter((job) => {
    // Filtrer par mots-clés
    if (user.keywords && user.keywords.length > 0) {
      const jobText = `${job.title} ${job.description} ${job.company}`
        .toLowerCase();
      const hasKeyword = user.keywords.some((keyword: string) =>
        jobText.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }

    // Filtrer par localisation
    if (user.locations && user.locations.length > 0 && job.location) {
      const hasLocation = user.locations.some((location: string) =>
        job.location?.toLowerCase().includes(location.toLowerCase())
      );
      if (!hasLocation) return false;
    }

    // Filtrer par type de contrat
    if (user.job_types && user.job_types.length > 0 && job.contract_type) {
      if (!user.job_types.includes(job.contract_type)) return false;
    }

    return true;
  });
}

async function sendEmailNotification(
  email: string,
  fullName: string,
  jobs: JobOffer[],
): Promise<void> {
  // Simuler l'envoi d'email
  // Dans une vraie implémentation, utiliser un service comme SendGrid, Mailgun, etc.
  console.log(`Sending email notification to ${email} for ${jobs.length} jobs`);

  const emailContent = `
    Bonjour ${fullName},
    
    Nous avons trouvé ${jobs.length} nouvelle(s) offre(s) d'emploi correspondant à vos critères :
    
    ${
    jobs.map((job) =>
      `- ${job.title} chez ${job.company} (${
        job.location || "Localisation non spécifiée"
      })`
    ).join("\n")
  }
    
    Connectez-vous à JobNexAI pour voir tous les détails.
    
    Cordialement,
    L'équipe JobNexAI
  `;

  // Ici, vous intégreriez votre service d'email préféré
  console.log("Email content:", emailContent);
}

function getDefaultPreferences(): NotificationPreferences {
  return {
    email_notifications: true,
    push_notifications: false,
    frequency: "daily",
    job_types: [],
    locations: [],
    keywords: [],
  };
}
