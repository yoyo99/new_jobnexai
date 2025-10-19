import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

function getSupabaseJwt(req: Request): string | null {
  console.log("[send-notification-email] Attempting to get JWT. Headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));
  const auth = req.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

serve(async (req: Request) => {
  console.log("[send-notification-email] Function invoked.");
  // Sécurité : vérifier JWT Supabase
  const jwt = getSupabaseJwt(req);
  console.log(`[send-notification-email] JWT received: ${jwt ? 'found' : 'null'}`);
  if (!jwt) {
    console.error("[send-notification-email] Unauthorized: JWT missing or invalid.");
    return new Response("Unauthorized: JWT missing", { status: 401 });
  }

  let payload;
  try {
    payload = await req.json();
    console.log("[send-notification-email] Received payload:", JSON.stringify(payload));
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error("[send-notification-email] Error parsing request JSON:", e.message);
    } else {
      console.error("[send-notification-email] Error parsing request JSON: Unknown error type", e);
    }
    return new Response("Error parsing request JSON: " + (e instanceof Error ? e.message : 'Unknown error'), { status: 400 });
  }
  const { to, subject, text, html } = payload;

  // Configuration SMTP depuis les variables d'environnement
  const SMTP_HOST = Deno.env.get("SMTP_HOST");
  const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
  const SMTP_USER = Deno.env.get("SMTP_USER");
  const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
  const EMAIL_FROM = Deno.env.get("EMAIL_FROM");
  
  console.log(`[send-notification-email] SMTP config loaded:`, {
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER ? 'set' : 'missing',
    password: SMTP_PASSWORD ? 'set' : 'missing',
    from: EMAIL_FROM,
  });

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !EMAIL_FROM) {
    console.error("[send-notification-email] SMTP config missing");
    return new Response("SMTP config missing", { status: 500 });
  }

  try {
    console.log("[send-notification-email] Connecting to SMTP server...");
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: true,
        auth: {
          username: SMTP_USER,
          password: SMTP_PASSWORD,
        },
      },
    });

    console.log("[send-notification-email] Sending email...");
    await client.send({
      from: EMAIL_FROM,
      to: to,
      subject: subject,
      content: text,
      html: html,
    });

    await client.close();
    console.log("[send-notification-email] Email sent successfully via SMTP.");
    return new Response("Email envoyé", { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[send-notification-email] SMTP error: ${errorMessage}`);
    return new Response(`SMTP error: ${errorMessage}`, { status: 500 });
  }
});
