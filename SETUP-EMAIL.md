# Email Delivery (Resend) — Setup Guide

Visitor contact-form messages are delivered **directly to your private inbox**
through Resend. Your email address and the Resend API key live **only in the
Supabase server-side secrets vault** — they never appear in any website file,
page source, GitHub repository, or network request a visitor could inspect.

---

## How it works (architecture)

```
Visitor fills contact.html form
        │  (no email address, no API key in any client code)
        ▼
Supabase Edge Function  contact-notify        ← server-side, secrets vault
        │  reads RESEND_API_KEY + ADMIN_NOTIFY_EMAIL from Deno.env
        ▼
Resend API  →  your private inbox
```

- Rate limit: 1 submission per 30 s per session (client) + server-side validation.
- Resend key: stored as a Supabase secret — **never** in code, never client-side.
- Your inbox address: stored as a Supabase secret — **never** in code.
- If a visitor left their email, the message sets Reply-To so you can reply by
  simply answering the email.

## Setup steps (5 minutes, run once)

Requires: Supabase project connected (see SETUP-SUPABASE.md steps 1–4) and
the [Supabase CLI](https://supabase.com/docs/guides/cli) installed.

1. **Log in & link the project** (from the website folder):
   ```
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   ```
2. **Set the secrets** — paste YOUR values in this one command (they go straight
   into Supabase's encrypted vault; never into any file):
   ```
   supabase secrets set RESEND_API_KEY=re_YOUR_KEY_FROM_RESEND ADMIN_NOTIFY_EMAIL=your.private.inbox@example.com
   ```
3. **Deploy the function:**
   ```
   supabase functions deploy contact-notify --no-verify-jwt
   ```
4. **Test:** open the website contact page, submit a real message — it should
   arrive in your inbox within seconds.
5. Commit & push (`git push origin main`) so Vercel serves the updated form.

## Notes

- **Resend test-mode:** without a verified sending domain, Resend only allows
  sending *to your own Resend account's email* using
  `onboarding@resend.dev` as sender — which is exactly what this integration
  needs (delivering to you). If you later verify a domain, optionally set a
  custom sender: `supabase secrets set NOTIFY_FROM="OpenWorld Atlas <hello@yourdomain.com>"`.
- **Where is my key stored?** Only in Supabase's secrets vault
  (Dashboard → Edge Functions → Secrets). It is never logged, never returned by
  the function, and never included in any repository file.
- **Rotation:** if the key ever leaks elsewhere, rotate it in Resend and re-run
  `supabase secrets set RESEND_API_KEY=...`.
- **Spam protection:** server validates length/format, client rate-limits, and
  every submission is also stored in the `contact_submissions` database table
  for auditing.
