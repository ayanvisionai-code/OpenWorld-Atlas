# Owner and professional legal review required

This checklist records unresolved decisions. It is not legal advice and does not certify compliance.

## Owner information to supply

- Legal name or publishing entity and operating location for policy disclosures.
- A monitored privacy/copyright contact route and who handles requests.
- Retention period for contact submissions and any deletion process.
- Whether content request emails are used only to reply or for any other purpose.
- Confirmation of which Supabase region, backups and processors are configured.
- Confirmation of whether any analytics, advertising, tracking or third-party embeds are enabled.
- Intended commercial use, including whether ads or affiliate links will be activated.

## Legal questions for qualified counsel

- Applicable Indian privacy/data-protection requirements and international obligations based on actual audience and processing.
- Cookie/consent duties if analytics or advertising is later enabled.
- Commercial use of game trademarks, fan-site naming, AI-generated images and any identifiable copyrighted/style-derived assets.
- Copyright notice/takedown procedure and operator disclosures for applicable jurisdictions.
- Terms, liability limits, governing law and dispute venue.
- Age-related privacy obligations if children can use the site.

## Technical facts currently established from source inspection

- The project is a static HTML/CSS/JavaScript frontend hosted on Vercel with Supabase REST/auth integration in `app.js` and schema/policies under `supabase/`.
- The contact form invokes the existing Supabase contact submission function through the client code; email notification is a separate function call and should not be described as guaranteed delivery.
- The client code uses `sessionStorage` for a notification throttle. A full runtime cookie/storage audit remains outstanding.
- No AdSense script or publisher identifier was found in the repository scan. This is not proof about external dashboard configuration.
- Admin authentication and protected database operations exist; do not state that no accounts/backend exist.
- Asset manifest records local editorial images, including AI/illustrative artwork. Provenance and commercial permissions have not all been documented.

## Open decisions

- Confirm actual production data processors, retention, and privacy contact before publishing final policy language.
- Have counsel review applicable law and monetization plans before ads are activated.
- Resolve every asset marked unknown in `images/asset-manifest.json` before commercial use.
