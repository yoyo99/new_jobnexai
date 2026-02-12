import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

function getSupabaseJwt(req: Request): string | null {
  const auth = req.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

serve(async (req: Request) => {
  console.log("[send-notification-email] Function invoked.");

  const jwt = getSupabaseJwt(req);
  if (!jwt) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch (_e) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { to, subject, text, html, type: _type } = payload;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "notifications@jobnexai.com";

  // Template HTML Premium si non fourni
  const finalHtml = html || `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .card { background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .logo { font-size: 24px; font-weight: bold; background: linear-gradient(to right, #ec4899, #8b5cf6); -webkit-background-clip: text; color: transparent; margin-bottom: 24px; display: inline-block; }
        .title { font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
        .content { font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 32px; }
        .btn { display: inline-block; background: #ec4899; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; }
        .footer { font-size: 12px; color: #64748b; margin-top: 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">JobNexAI</div>
        <div class="title">${subject}</div>
        <div class="content">${
    text || "Vous avez une nouvelle notification."
  }</div>
        <div style="text-align: center;">
          <a href="https://jobnexai.com/search" class="btn">Accéder à mon espace</a>
        </div>
        <div class="footer">© 2026 JobNexAI. Votre assistant de recherche d'emploi intelligent.</div>
      </div>
    </body>
    </html>
  `;

  if (RESEND_API_KEY) {
    console.log("[send-notification-email] Using Resend API...");
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `JobNexAI <${EMAIL_FROM}>`,
          to: [to],
          subject: subject,
          html: finalHtml,
          text: text,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        throw new Error(data.message || "Resend API error");
      }
    } catch (error: any) {
      console.error(
        "[send-notification-email] Resend API error:",
        error.message || error,
      );
    }
  }

  return new Response("Email traité via Resend", { status: 200 });
});
