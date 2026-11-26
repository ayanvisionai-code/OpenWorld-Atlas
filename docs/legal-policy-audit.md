# Legal and policy audit — 26 November 2026

## Corrections made

| Surface | Earlier wording | Technical finding | Correction |
|---|---|---|---|
| Privacy Policy | Stated that nothing was collected on servers and that contact requests remained in the browser. | `app.js` submits contact requests to `public.contact_submissions` through Supabase; schema and RLS keep them private. | Rewritten to describe configured Supabase submissions, browser session storage, Vercel, Google Fonts and unresolved retention details. |
| Terms | Claimed every factual claim was sourced and that cheat effects were documented. | Static pages and bundled data include claims still awaiting review. | Rewritten to describe the review in progress and to avoid claims of complete verification. |
| Disclaimer | Claimed all artwork was original, AI eliminated risk, all facts were sourced, and specific cheat information was reliable. | Asset manifest includes owner-supplied illustrative images pending commercial-rights confirmation; accuracy audit found unsupported claims. | Rewritten to describe illustrative/AI artwork, pending asset review, and claim-level review. |
| Contact | Implied messages reached a private inbox. | Contact storage is configured in Supabase; an optional notification function may fail or be unconfigured. | Public policy and documentation now avoid guaranteed email-delivery claims. |

## Open owner decisions

- Retention and deletion process for contact requests.
- Operator identity, privacy contact route, and rights-holder contact route.
- Actual production processors, regions and backups.
- Advertising, analytics and cookie choices before activation.
- Asset licenses and commercial-use rights.
- Governing-law and consumer/privacy decisions.

This document is an implementation audit, not legal advice. See `legal-review-required.md` for the items to take to qualified counsel.
