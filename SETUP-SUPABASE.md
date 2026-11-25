# OpenWorld Atlas — Supabase Backend Setup Guide

This guide connects your existing site (static HTML/JS on Vercel + GitHub) to a
Supabase backend. **The site keeps working in fallback mode the whole time** —
the bundled JSON data remains the seed content; the database takes over once
configured. Nothing is rebuilt, nothing is lost.

> **Key safety rule:** the **anon/publishable key** is public by design (RLS
> protects the data) — it may live in browser code. The **service_role /
> secret key** must NEVER go into browser code, GitHub, or frontend env vars.
> Only server-side scripts (like the import script) use it, from environment
> variables on your own machine.

---

## Step 1 — Create the Supabase project (5 min)

1. Sign up at **supabase.com** (free tier is enough).
2. **New project** → name it (e.g. `openworld-atlas`), pick a region near your audience, set a database password (save it somewhere safe).
3. When the project is ready, open **Project Settings → API** and copy:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon / publishable key**

## Step 2 — Create the database (2 min)

1. Supabase Dashboard → **SQL Editor** → New query.
2. Paste the full contents of **`supabase/schema.sql`** and **Run**.
   It creates all tables, indexes, RLS policies and storage policies. It only
   creates — it never drops or resets anything.

## Step 3 — Create the Storage bucket (1 min)

Dashboard → **Storage** → New bucket:
- Name: **`media`**
- **Public bucket: ON** (website images)
The object-level guardrails (image types only, ≤5 MB) are already in the SQL.

## Step 4 — Connect the site (1 min)

1. Copy **`js/env.example.js`** → **`js/env.js`**.
2. Paste your two PUBLIC values into the placeholders.
3. Reload the site. Done — the app now loads published content from the
   database (with JSON fallback if the DB is unreachable).

`js/env.js` is git-ignored, so keys stay out of GitHub. On Vercel, remember
that `js/env.js` must exist in the deployed output: add it locally before
deploying **or** keep it untracked and inject it at build time later.

## Step 5 — Import the existing content (1 min)

Run locally (this is the only place the service-role key is used):

```
# Windows PowerShell:
$env:SUPABASE_URL = "https://YOUR-PROJECT.supabase.co"
$env:SUPABASE_SECRET_KEY = "YOUR-SUPABASE-SECRET-KEY"
python supabase/import_from_json.py
```

It upserts all bundled records (cheats, characters, vehicles, weapons,
locations, missions, guides) into `content` as **drafts**. Safe to re-run;
deletes nothing. Review sources and verification labels before publishing. Use
`python supabase/import_from_json.py --publish` only after that review.

## Step 6 — Create your admin account (2 min)

Dashboard → **Authentication → Users → Add user → Create new user**:
- Email + password (that's your admin login for `/admin.html`).

Security model: an account must be explicitly assigned the `admin` or `editor`
role after it is created. In the SQL Editor, replace the placeholder with the
user UUID from Authentication → Users:

```sql
insert into public.user_roles (user_id, role)
values ('AUTH-USER-UUID', 'admin');
```

The dashboard signs out authenticated users without an editorial role. Public
visitors can read published content only.

## Step 7 — Deploy / test

- Commit & push → Vercel deploys automatically.
- Open **`/admin.html`** → sign in → manage content.
- Public pages show only `status = 'published'` rows (enforced by RLS, not by
  hiding buttons).
- Drafts are visible only inside the admin dashboard and its preview link.

---

## Environment variables summary

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / Project URL | `js/env.js` (public) | API base URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` / publishable key | `js/env.js` (public) | Browser read access (RLS-scoped) |
| `SUPABASE_SECRET_KEY` | **your machine's env only** | One-time import script |

## Tables created

`content`, `categories`, `tags`, `sources`, `content_categories`,
`content_tags`, `content_sources`, `media_assets`, `contact_submissions`
(+ indexes, `updated_at` trigger, RLS policies, storage policies).
