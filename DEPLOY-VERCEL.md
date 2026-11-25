# Vercel deployment setup

Add these Environment Variables in Vercel Project Settings for Production,
Preview and Development:

- `SUPABASE_URL` — the Project URL beginning with `https://` and ending in `.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` — the Supabase publishable key

The deployment runs `scripts/generate-public-env.js`, which writes a browser
configuration file containing only those public values. Never add a Supabase
Secret key to Vercel Environment Variables for this static site.

After saving both variables, redeploy the latest Git commit. The deployment
will fail safely if either public value is missing or malformed.
