# OpenWorld Atlas asset system

## Publication rule

Only assets with an approved record may be published. Keep the source file, creator, rights basis, approval status, descriptive alt text, dimensions and a review date with each record. The `media_assets` table is the source of record after Supabase is configured.

## Directory convention

Use `media/<category>/<slug>-<variant>.<format>` in Supabase Storage. Categories: `hero`, `character`, `vehicle`, `weapon`, `location`, `mission`, `guide`, `editorial`, `icon`, `infographic`.

## Required derivatives

| Use | Desktop | Mobile | Format |
| --- | --- | --- | --- |
| Hero | 2400 × 1350 | 1080 × 1350 | AVIF + WebP fallback |
| Editorial cover | 1600 × 900 | 960 × 1200 | AVIF + WebP fallback |
| Portrait | 1200 × 1500 | 800 × 1000 | AVIF + WebP fallback |
| Data-card artwork | 1200 × 900 | 800 × 600 | AVIF + WebP fallback |

Include width and height in markup, prioritize only the homepage hero, and lazy-load every below-the-fold image.

## Original-art direction prompts

- Hero: “Original editorial illustration of a fictional coastal metropolis at early evening, palm-lined boulevard, oceanfront architecture, warm dusk haze, generous left-side negative space for typography, restrained cinematic palette, no logos, no game interface, no recognizable locations or characters.”
- Character fallback: “Original abstract editorial portrait treatment for a fictional open-world dossier: layered paper texture, soft architectural shadow, muted charcoal and amber, no identifiable person, no game character resemblance, no logo.”
- Vehicle fallback: “Original technical editorial illustration of a fictional compact performance coupe, neutral studio lighting, three-quarter view, unbranded, no manufacturer marks, slate background, no recognizable game or real vehicle design.”
- Location fallback: “Original travel-editorial illustration of a fictional coastal district, atmospheric depth, buildings and landscape only, no map, no logos, no recognizable game location.”

Review AI outputs for unintended similarities before approval; retain the generation platform, prompt, date and commercial-use review alongside the asset.
