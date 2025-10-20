import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

function getSupabaseJwt(req: Request): string | null {
  console.log("[send-notification-email] Attempting to get JWT. Headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));
  const auth = req.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

function buildEmailMessage(from: string, to: string, subject: string, text: string, html: string): string {
  const boundary = "----=_Part_" + Math.random().toString(36).substring(2, 15);
  
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    `Date: ${new Date().toUTCString()}`,
    ``,
  ].join("\r\n");

  const body = [
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    text,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    html,
    `--${boundary}--`,
    ``,
  ].join("\r\n");

  return headers + "\r\n" + body;
}

serve(async (req: Request) => {
  console.log("[send-notification-email] Function invoked.");
  
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

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !EMAIL_FROM || !to || !subject) {
    console.error("[send-notification-email] Missing required parameters");
    return new Response("Missing required parameters", { status: 400 });
  }

  try {
    console.log("[send-notification-email] Connecting to SMTP server...");
    
    const conn = await Deno.connect({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper function to read SMTP response
    async function readResponse(connection: Deno.Conn): Promise<string> {
      const buffer = new Uint8Array(1024);
      const n = await connection.read(buffer);
      if (n === null) return "";
      return decoder.decode(buffer.slice(0, n));
    }

    // Read initial SMTP response
    let response = await readResponse(conn);
    console.log("[send-notification-email] SMTP response:", response);

    // Send EHLO
    await conn.write(encoder.encode("EHLO localhost\r\n"));
    response = await readResponse(conn);
    console.log("[send-notification-email] EHLO response:", response);

    // Send STARTTLS
    await conn.write(encoder.encode("STARTTLS\r\n"));
    response = await readResponse(conn);
    console.log("[send-notification-email] STARTTLS response:", response);

    // Upgrade to TLS
    const tlsConn = await Deno.startTls(conn, { hostname: SMTP_HOST });

    // Send EHLO again after TLS
    await tlsConn.write(encoder.encode("EHLO localhost\r\n"));
    response = await readResponse(tlsConn);
    console.log("[send-notification-email] EHLO after TLS:", response);

    // Send AUTH LOGIN
    await tlsConn.write(encoder.encode("AUTH LOGIN\r\n"));
    response = await readResponse(tlsConn);
    console.log("[send-notification-email] AUTH LOGIN response:", response);

    // Send username (base64 encoded)
    const encodedUser = btoa(SMTP_USER);
    await tlsConn.write(encoder.encode(encodedUser + "\r\n"));
    response = await readResponse(tlsConn);
    console.log("[send-notification-email] Username response:", response);

    // Send password (base64 encoded)
    const encodedPass = btoa(SMTP_PASSWORD);
    await tlsConn.write(encoder.encode(encodedPass + "\r\n"));
    response = await readResponse(tlsConn);
    console.log("[send-notification-email] Password response:", response);

    // Send MAIL FROM
    await tlsConn.write(encoder.encode(`MAIL FROM:<${EMAIL_FROM}>\r\n`));
    response = await readResponse(tlsConn);
    console.log("[send-notification-email] MAIL FROM response:", response);

    // Send RCPT TO
    await tlsConn.write(encoder.encode(`RCPT TO:<${to}>\r\n`));
    response = await readResponse(tlsConn);
    console.log("[send-notification-email] RCPT TO response:", response);

    // Send DATA
    await tlsConn.write(encoder.encode("DATA\r\n"));
    response = await readResponse(tlsConn);
    console.log("[send-notification-email] DATA response:", response);

    // Send email message
    const message = buildEmailMessage(EMAIL_FROM, to, subject, text || "", html || "");
    await tlsConn.write(encoder.encode(message + "\r\n.\r\n"));
    response = await readResponse(tlsConn);
    console.log("[send-notification-email] Message response:", response);

    // Send QUIT
    await tlsConn.write(encoder.encode("QUIT\r\n"));
    response = await readResponse(tlsConn);
    console.log("[send-notification-email] QUIT response:", response);

    await tlsConn.close();
    console.log("[send-notification-email] Email sent successfully via SMTP.");
    return new Response("Email envoyé", { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[send-notification-email] SMTP error: ${errorMessage}`);
    return new Response(`SMTP error: ${errorMessage}`, { status: 500 });
  }
});
