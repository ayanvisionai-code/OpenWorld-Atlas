# Factual audit — 26 November 2026

## Scope and limits

This is an initial, evidence-based triage of the repository, not a completed claim-by-claim audit. The static site contains seven bundled JSON data sets, 25 HTML pages including blog pages, a large client-side application, and a Supabase-backed published-content workflow. Runtime public pages now read only rows marked `published`; bundled JSON remains in the repository and must not be treated as reviewed or publication-ready. The database could not be inspected from this repository, and no gameplay was tested.

Counts of pages, records and claims fully verified: **Not verified**. No complete source-by-source review or authenticated database inventory was performed. No reviewer or test date has been invented.

## High-impact claims triaged

| Surface / claim | Existing evidence | Finding and action | Status |
|---|---|---|---|
| Launch date and platforms | Rockstar Support, “Grand Theft Auto VI regional pre-load and release times…” (updated Nov. 3, 2026) states Nov. 19, 2026 for PS5 and Xbox Series X\|S. Rockstar’s “Grand Theft Auto VI: Out Now” page says available worldwide on those platforms. | These claims have primary-source support as of this audit date. Check the official pages before reusing in time-sensitive copy. | Officially confirmed |
| PC availability / release timing | No claim-specific current primary source reviewed in this triage. Existing site copy and blog make conflicting definitive claims. | Remove definitive schedules until a current official announcement is cited; queue all PC claims for detailed review. | Unresolved |
| $250,000 cheat and input | Local `data/cheats.json`, money-cheat blog, and cheat-unlock blog state a specific amount and button sequence. These are not primary evidence; the cited third-party pages were not inspected claim-by-claim. | Treat as unsupported. Unpublish or replace the money-cheat and cheat-code instructional claims pending source inspection and reproducible testing. | Unconfirmed; correction required |
| “61” cheat total, post-story unlocks, save/trophy effects | Present in local JSON and blog copy; the sources and counting methodology have not been validated. | Do not present the count or game consequences as fact until each claim has distinct evidence. | Unconfirmed; correction required |
| Character names, cameo, voice actor, relationships, mission/chapter details | `data/characters.json` contains alleged Niko Bellic cameo, voice attribution and specific story details. Existing links do not establish every associated claim. | Hold these records from public use until each attribute is supported by a claim-specific source; remove spoiler/biographical assertions that lack evidence. | Unresolved |
| Score, sales, mission/region counts, vehicle and weapon specifications | Search inventory surfaced candidate claims in static pages and JSON, but no complete record-by-record source inspection has been performed. | Queue for granular source and date review. Do not count claims as confirmed from this report. | Not reviewed |

## Primary sources inspected

- Rockstar Support, [GTA VI regional pre-load and release times](https://support.rockstargames.com/articles/29jV3Cv2cCgvwM1XgtMO5o/grand-theft-auto-vi-regional-pre-load-and-release-times-on-playstation-5-and-xbox-series-x-or-s).
- Rockstar Games, [Grand Theft Auto VI: Out Now](https://www.rockstargames.com/VI/out-now).
- Rockstar Games, [Pre-load begins November 10](https://www.rockstargames.com/newswire/article/k4ak9okk485712/grand-theft-auto-vi-pre-load-begins-on-november-10).

These sources support only the release/platform claims stated above. They do not verify cheats, characters, statistics or gameplay details.

## Editorial handling

Use claim-level citations and retain each source’s publication/update date. Assign `officially_confirmed`, `independently_verified`, `reported`, `unconfirmed`, `speculation`, `unknown`, or `corrected/outdated` only when evidence meets the definitions in `docs/editorial-verification-workflow.md`. Publication status remains separate from verification status. Never use a generic record source to imply every field is verified.

## Next audit queue

1. Export published Supabase records and review every record and each materially distinct field with its source.
2. Replace unsupported cheat articles and homepage totals; verify any retained code on platform/version or label it as reporting.
3. Audit the full FAQ, PC, mission, location, character, vehicle and weapon pages, including metadata and structured data.
4. Add revision history for corrections and keep private editor notes behind existing authenticated policies.
5. Update this report with actual counts only after the complete inventory is available.
