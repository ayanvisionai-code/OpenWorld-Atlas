# Data processing inventory — current repository findings

| Area | Observed implementation | Public policy treatment | Open point |
|---|---|---|---|
| Hosting | Static site configuration for Vercel. | Mentioned in Privacy Policy. | Confirm production logs and retention with the owner. |
| Database/auth | Supabase REST and authenticated editorial administration. | Public visitors do not create public accounts; editors authenticate through Supabase. | Confirm region, backups, and data processor terms. |
| Contact requests | `app.js` posts question, category, optional email and user agent to `contact_submissions`; anonymous read is blocked by RLS. | Described as private editorial submissions. | Set retention and deletion workflow. |
| Email notification | Client invokes an optional `contact-notify` function. | No delivery guarantee is made. | Confirm whether the function and provider are active. |
| Browser storage | `sessionStorage` is used for notification throttling and editor previews. | Described generally in Privacy Policy. | Complete runtime cookie/storage review before adding analytics. |
| Fonts | Google Fonts are referenced in HTML. | Identified as a third-party service. | Confirm whether self-hosting is desired. |
| Audience measurement | Vercel Web Analytics on production public pages; page-view URLs omit query strings and fragments. Admin and editor previews excluded. | Disclosed in Privacy Policy. | Review disclosure if custom events or advertising are introduced. |
