// ============================================================================
// OpenWorld Atlas — Supabase public configuration TEMPLATE
//
// HOW TO USE:
//   1. Copy this file to  js/env.js   (keep the same folder)
//   2. Replace BOTH placeholders with the two PUBLIC values from your
//      Supabase Dashboard → Project Settings → API:
//        - Project URL
//        - anon / publishable key   ("anon public" or "publishable")
//
//   The anon/publishable key is DESIGNED to be public — Row Level Security
//   protects the data, so it is safe in browser code (same as Firebase config).
//
//   ⚠️  NEVER put the service_role / secret key in this file or anywhere
//       client-side. That key bypasses RLS. It belongs only in server-side
//       environment variables (e.g. SUPABASE_SERVICE_ROLE used by import
//       scripts on your own machine).
//
//   js/env.js is git-ignored so keys stay out of GitHub.
//   If this file does not exist, the site runs on the bundled JSON fallback
//   data — everything keeps working.
// ============================================================================
window.SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
window.SUPABASE_PUBLISHABLE_KEY = "YOUR-ANON-OR-PUBLISHABLE-KEY";
