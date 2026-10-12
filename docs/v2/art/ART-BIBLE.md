# Nature Quest art bible

Status: draft for product-owner approval, under [issue #163](https://github.com/camster91/magic-type-quest/issues/163). It follows the [product contract](../PRODUCT-CONTRACT.md). Only the Meadow slice ([#167](https://github.com/camster91/magic-type-quest/issues/167)) is produced before the expansion gate ([#178](https://github.com/camster91/magic-type-quest/issues/178)).

## Global style

- **Look:** premium children's editorial nature illustration. Painterly gouache with light coloured-pencil texture. Stylised, not photoreal, and not 3D/Pixar.
- **Shapes:** soft rounded forms and clear readable silhouettes. Grasses and flowers are grouped into simple masses rather than painted one blade at a time.
- **Edges:** soft painted edges with no black outlines. Foreground subjects get a slightly crisper edge than the background.
- **Light:** warm late-morning sun from the upper left. Shadows are soft, cool and short. There are no dramatic night scenes in the Meadow.
- **Saturation:** medium. Restored states are richer and warmer than damaged states, but never neon.
- **Texture:** subtle paper grain and brush texture. It must stay clean behind on-screen text.
- **Animals:** anatomically accurate real species with natural colouring. They are friendly in posture, not cartoon-faced: real eye shapes, no human expressions, no clothing.
- **Proportions:** child-friendly but not toddlerish. No oversized heads or giant eyes.
- **Camera:** eye-level side view with a gentle depth of field. The horizon sits in the upper third, leaving clear ground for restoration props.
- **Never:** magic, glowing runes, sparkles that imply supernatural power, wands, potions, enchanted objects, fantasy creatures, frightening scenes, litter used to shame, humans in danger, text or logos inside the art, or emoji as final art.

## Meadow Base palette

| Token | Hex | Use |
|---|---|---|
| `meadow.sky` | `#CFE6EE` | sky wash |
| `meadow.cloud` | `#F7F3EA` | clouds, highlights |
| `meadow.hill-far` | `#A9C49A` | far hills |
| `meadow.grass` | `#7FA65A` | main grass mass |
| `meadow.grass-deep` | `#4E7A3E` | foreground grass, shadows |
| `meadow.soil` | `#8A6A4A` | bare ground, paths |
| `meadow.goldenrod` | `#E3B53B` | flower accents |
| `meadow.milkweed` | `#C98BA6` | flower accents |
| `meadow.bluebird` | `#4F7FB8` | small accents only |
| `meadow.dry` | `#C7B88E` | damaged/dry state |

The damaged state uses `meadow.dry` and `meadow.soil`, with lower saturation and no clutter. Restoration shifts the scene toward `meadow.grass` and the flower accents.

## Layer model

Every biome scene is painted as separate layers that share one composition, so the game can show restoration step by step:

1. sky/background
2. far scenery
3. midground
4. ground plane
5. restoration props (seedlings, flowers, nest box, bee hotel)
6. wildlife
7. foreground framing
8. particles/weather (pollen, petals; never "magic" sparkles)
9. interaction highlights (drawn in code, not painted)

## Companion and wildlife

- **Companion:** one red fox guide (*Vulpes vulpes*). Calm, curious and grounded. It is a wild animal, not a pet: no collar, no clothes, no speech bubbles inside the art.
- **Standard states:** idle, notice/look, move, positive reaction, rest. Each animal's manifest entry declares which states it supports.
- **Meadow wildlife:** monarch butterfly, common eastern bumble bee, eastern bluebird.
- **Meadow plants:** common milkweed, black-eyed Susan, goldenrod.
- Every species fact needs a recorded source before production use.

## UI illustration

- Icons share the same gouache texture, simplified, on a transparent background.
- Keycaps are rounded, warm off-white and clearly readable. Mastery is never shown by colour alone: each level also gets a shape or icon change.
- On-screen text is never baked into images, so it can be translated (EN/FR/ES).

## Formats and sizes

| Asset | Master | Runtime |
|---|---|---|
| Biome layer | 2560×1440 PNG | WebP, 1920 wide + 1280 wide |
| Wildlife and companion sprite | 1024×1024 transparent PNG | WebP, 512 + 256 |
| Field Guide art | 1024×1024 | WebP 768 |
| Icons and badges | 1024×1024 transparent | WebP 256 / SVG where simple |

Masters are kept, and optimised copies are generated from them by script, never edited by hand.

## Provenance

Each asset is listed in `assets/v2/manifest.json` (checked by `npm run check:v2-assets`) and explained in `assets/v2/ASSET-SOURCES.md` with its logical id (for example `biomes.meadow.background.sky`), the tool and model, the prompt id from [PROMPTS.md](PROMPTS.md), the generation date, any edits and its approval state.

## Accessibility

- Decorative layers have no accessible name.
- Discoveries get names and descriptions from content, in the DOM.
- Text must keep 4.5:1 contrast over any art layer; use a solid panel behind text where needed.
- Reduced-motion mode keeps every state readable without animation.

## Meadow art slots

What the Meadow slice ([#167](https://github.com/camster91/magic-type-quest/issues/167)) needs, and what the style test already covers. "Test" means a style-test file exists in `assets/v2/meadow`; it still needs approval before production use.

| Slot | Logical id | Status |
|---|---|---|
| Full restored scene (style anchor) | `biomes.meadow.scene.restored` | test, approved |
| Full damaged scene | `biomes.meadow.scene.damaged` | test |
| Sky layer | `biomes.meadow.layer.sky` | needed |
| Far hills layer | `biomes.meadow.layer.far` | needed |
| Midground layer | `biomes.meadow.layer.mid` | needed |
| Ground plane, damaged and restored | `biomes.meadow.layer.ground.damaged` / `.restored` | needed |
| Foreground framing grass | `biomes.meadow.layer.foreground` | needed |
| Fox: idle, look, move, happy | `companion.fox.idle` / `.look` / `.move` / `.happy` | test, approved |
| Fox: rest | `companion.fox.rest` | needed |
| Monarch, bumble bee, bluebird | `wildlife.monarch` / `.bumblebee` / `.bluebird` | test |
| Wildlife move or arrival poses | `wildlife.<species>.move` | needed |
| Nest box, bee hotel, seedling tray, watering can, black-eyed Susans | `props.meadow.*` | test |
| Milkweed and goldenrod clumps | `props.meadow.milkweed` / `.goldenrod` | needed |
| Field Guide cards: monarch, bumble bee, bluebird, milkweed | `fieldguide.<species>` | needed |
| Home-row keycaps by mastery level | `ui.keycap.*` | needed |
| Icons: field guide, map, continue, paw | `ui.icon.*` | test |
| Meadow badge | `ui.badge.meadow` | needed |
| Pollen and petal particles | drawn in code | not an image |
