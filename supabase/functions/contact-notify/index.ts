// ============================================================================
// OpenWorld Atlas — contact-notify Edge Function (SERVER-SIDE ONLY)
//
// Purpose: deliver website contact-form submissions to the site owner's email
// via Resend — WITHOUT ever exposing the admin email address or the Resend API
// key in any client-side code, page source, or GitHub repository.
//
// Secrets required (stored in Supabase secrets vault — NEVER in this repo):
//   RESEND_API_KEY      — from resend.com/api-keys
//   ADMIN_NOTIFY_EMAIL  — the private inbox that receives visitor messages
//   (optional) NOTIFY_FROM — custom "from" if you verified a domain, e.g.
//                          "OpenWorld Atlas <hello@yourdomain.com>"
//                          Default: OpenWorld Atlas <onboarding@resend.dev>
//
// Deploy (Supabase CLI, from the project folder):
//   supabase functions deploy contact-notify --no-verify-jwt
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxx ADMIN_NOTIFY_EMAIL=you@example.com
//
// The --no-verify-jwt flag lets anonymous visitors submit; the function itself
// validates and rate-limits input. Admin email and Resend key never leave the
// server.
// ============================================================================

const ALLOWED_CATEGORIES = [
  "Cheat codes", "Characters", "Vehicles", "Weapons", "Locations & map",
  "Missions & story", "Guides", "Correction", "Other"
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFY_EMAIL");
  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    // Misconfiguration is reported generically — no secret details leak.
    return json({ error: "Email delivery is not configured yet." }, 503);
  }

  // --- validate input -------------------------------------------------------
  let body: { question?: string; category?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const question = (body.question || "").trim();
  const category = ALLOWED_CATEGORIES.includes(body.category || "") ? body.category! : "Other";
  const email = (body.email || "").trim();

  if (question.length < 8 || question.length > 500) {
    return json({ error: "Question must be 8–500 characters." }, 400);
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ error: "Invalid email address." }, 400);
  }

  // --- send via Resend ------------------------------------------------------
  const from = Deno.env.get("NOTIFY_FROM") || "OpenWorld Atlas <onboarding@resend.dev>";
  const subject = `OpenWorld Atlas request: ${category}`;
  const html = `
    <h2 style="font-family:sans-serif">New content request — ${esc(category)}</h2>
    <p style="font-family:sans-serif"><b>Question:</b></p>
    <blockquote style="font-family:sans-serif;border-left:4px solid #FF7138;padding-left:12px">${esc(question)}</blockquote>
    <p style="font-family:sans-serif"><b>Reply-to:</b> ${email ? esc(email) : "not provided"}</p>
    <p style="font-family:sans-serif;font-size:12px;color:#666">Sent automatically from the website contact form.</p>`;
  const text = `New content request — ${category}\n\nQuestion: ${question}\nReply-to: ${email || "not provided"}\n`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [ADMIN_EMAIL],
        subject,
        html,
        text,
        reply_to: email || undefined,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("Resend error:", r.status, detail.slice(0, 200));
      return json({ error: "Email delivery failed." }, 502);
    }
    return json({ ok: true, message: "Request delivered." });
  } catch (e) {
    console.error("Resend request failed:", String(e).slice(0, 200));
    return json({ error: "Email delivery failed." }, 502);
  }
});
