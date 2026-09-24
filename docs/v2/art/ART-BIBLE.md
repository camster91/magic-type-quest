# Nature Quest v2 art bible — version 1 (#163)

Status: locked production direction for the Meadow slice. The other five biome palettes and motifs define continuity, not permission to produce their packs before #178 records GO. Nature Quest is the working name. [Asset manifest](../../../src/v2/assets/manifest.ts) owns logical IDs and loading metadata; [source log](../../../assets-v2/ASSET-SOURCES.md) owns provenance.

## Global style

| Element | Production rule |
| --- | --- |
| Edges and lines | Soft ink-like contours in deep green/umber, selective 1–3 px at 1920 source. Avoid black outlines around every shape. Silhouettes remain clear at mobile crop. |
| Shape language | Rounded, asymmetrical organic masses with observed leaf/wing structures. Habitat props have plain practical forms. Child-friendly proportions without oversized toddler heads. |
| Texture | Fine dry-brush/paper grain and sparse botanical mark making within shapes; no noisy overlays or photoreal textures. Keep key interaction highlights clean. |
| Lighting | Consistent warm daylight from upper left, gentle ambient fill and diffuse soft ground shadows. Before/after stages share the same camera and light. |
| Materials | Matte leaves/wood/soil, subdued water reflection, restrained highlights on eyes and wings. Never metallic reward gloss. |
| Saturation | Mid-low natural base; localized vivid accents for wildlife and new growth. Preserve contrast under deuteranopia/protanopia simulations. |
| Faces/anatomy | The fox has small expressive eyes, muzzle and ears; no human hands or costumes. Wild animals have recognizable species anatomy, wing patterns and plausible habitat scale. Reference material and factual review are required before production wildlife approval. |
| Perspective | Fixed side-on three-quarter habitat diorama, horizon around 35–40% of landscape frame. Layer planes share camera height, horizon and upper-left light; no arbitrary isometric swaps. |
| Accessibility | Important objects retain shape/outline contrast against every stage. Restoration also changes form and DOM description, not colour alone. Decorative layers have empty semantic descriptions; species names and habitat results come from reviewed DOM content. |

The scene reads as an observed place a child can care for, with a clear before/after silhouette. No supernatural motifs, floating symbolic particles, generic emoji, photographic collage or inconsistent AI styles. Avoid implying a child should touch, feed or approach wild animals.

## Biome palette and mood

Tokens are starting swatches for art direction. Validate final foreground/background contrast against actual composites and DOM controls; these are not automatic text colours.

| Biome | Sky/light | Habitat | Dark/ink | Accent | Environmental motifs |
| --- | --- | --- | --- | --- | --- |
| Meadow Base | `#EAF4E7` | `#8CAC76` | `#284C3E` | `#D9A65F` | low grass, yarrow candidates, planting spots, soft seed-head silhouettes |
| Forest Trail | `#DDE8DC` | `#638464` | `#24453A` | `#C69A5F` | layered trunks, leaf litter, observation markers, filtered canopy |
| Wetlands | `#DDEAE7` | `#6F9B8E` | `#284B4D` | `#C7A868` | reeds, shallow water, safe boardwalk edges, reflective openings |
| River & Coast | `#DCEBF0` | `#6F9FB0` | `#25495B` | `#D7B47E` | river stones, tidal grass, observation rail, coastal horizon |
| Mountain Research Station | `#E7ECED` | `#829596` | `#344C50` | `#C69662` | ridges, field instruments, timber station, cool air layers |
| Wildlife Reserve | `#E5EDDF` | `#6D8E6A` | `#2D493A` | `#D5AA69` | connected habitat corridors, observation lookout, return of diverse wild species |

Later palettes are *tokens only* until the Meadow gate. Do not claim a species lives in a specific region without content review.

## Layer and restoration contract

Phaser loads independently addressable layers in this fixed order: background sky → far scenery → midground → habitat plane/ground/water → restoration props → wildlife → foreground framing → particles/weather → interaction highlights. Every plane can be hidden or changed without repainting the entire illustration. Before and after variants share horizon, scale, crop anchors and lighting. A restoration result enables or swaps props and wildlife without flash or camera jump; reduced motion uses an instant layer swap or gentle fade plus the same DOM state summary. Particle/weather layers are optional and never carry the only meaning. The [Meadow slots](MEADOW-SLOTS.md) map each layer to manifest IDs and mission milestones.

## Character and wildlife states

The initial companion is one stylised red fox guide. Design a single consistent model sheet with front three-quarter and side poses. Standard vocabulary: `idle`, `notice/look`, `move`, `positive reaction`, `rest/biome ambient`, and `arrival/discovery` when relevant. The manifest declares only supported states; it does not promise every state for every species. Fox expressions are calm and occasional; no reaction on every keystroke. Wild animals are observations and Field Guide discoveries, never pets or inventory. Monarch and yarrow are draft content candidates pending factual review; illustration approval does not approve a fact.

## UI illustration system

- World map: six canonical regions as a legible route, muted locked areas, one active objective. Use the same geographic/horizon language as scenes; DOM owns names and controls.
- Field Guide: editorial specimen card on warm paper with species silhouette, reviewed fact slot, source/review status in content metadata; DOM owns text and alt descriptions.
- Biome badges: simple habitat silhouettes, not collectible currency. Mastery keycaps: clear printed glyph plus label/state text; no state expressed by hue alone.
- Fox portraits: crop from the same approved model, no independent face restyling. Progress indicators: habitat stages and descriptive labels rather than stars/XP.
- Buttons/icons: simple SVG line/filled shapes with 24 px minimum legibility and visible DOM focus; icons supplement text labels. Decorative art never replaces controls.

## Source, crop and export targets

| Slot | Canonical master | Desktop target | Tablet target | Mobile target |
| --- | --- | --- | --- | --- |
| Biome layer | 1920×1080, 1× at desktop target | 1920×1080 | 1280×960 | 720×1280 art-directed crop |
| Wildlife/fox sheet | 480×480 per pose, transparent | 480×480 | 360×360 | 240×240 |
| Field Guide illustration | 800×960 | 800×960 | 600×720 | 400×480 |
| UI icon/badge | 128×128 or SVG viewBox | 128×128 | 96×96 | 64×64 |

Keep the subject in the manifest safe area. Export responsive variants from one approved master where crop can preserve composition; commission a separate crop only when that fails. Choose WebP for most raster layers, AVIF only after pipeline/browser verification, PNG when transparency quality needs it, SVG for simple icons, and atlases for repeated animation. Do not ship GIF animation or 4K images to mobile. Preserve the master untouched under `assets-v2/master/`; optimized outputs go under `public/assets/v2/`. #165 owns loader selection and hard bundle measurements.

`npm run validate:assets` checks logical IDs, references, dimensions, output bytes, missing/orphan files and the initial #165 size caps (1.5 MB per raster, 8 MB Meadow pack, 12 MB later pack, 2.5 MB shell assets). It never rewrites source art. No image conversion dependency or production source has been approved yet, so this issue records export targets and validates supplied optimized variants rather than silently installing an optimizer. A later approved pipeline may add non-destructive conversion from the preserved masters.

## Review before approval

Compare the assembled Meadow before/after at desktop, tablet, and 360 px; inspect consistent horizon, light, fox anatomy, wildlife reference, non-colour restoration cues, DOM description, reduced motion, file sizes, and provenance. Asset status changes from `planned` to `implemented` only after source/licence approval and optimized outputs are recorded. Existing BootScene geometry remains a placeholder until #167 builds the approved slice.
