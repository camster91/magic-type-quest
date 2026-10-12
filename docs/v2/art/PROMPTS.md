# Nature Quest prompt library

Status: draft, under [issue #163](https://github.com/camster91/magic-type-quest/issues/163). Every prompt starts with the **style anchor** and ends with the **guardrails**. Do not edit a locked prompt; add a new version instead (`meadow.scene.v2`).

Tool: Higgsfield, model `gpt_image_2_5` (Flare), quality `high`. The approved style anchor is `meadow.scene.restored.v1` (Higgsfield job `9dbca920-8983-46e8-9b8a-cc95ec3c7436`). Pass it as an `image_references` input for every later asset in the pack.

**Transparent assets:** the model's `background: transparent` option did not work (it painted a dark glow). Instead, generate on a plain flat pure white background, then cut the subject out:
- **Higgsfield Image Background Remover:** use it for most subjects.
- **White-key cut:** use it when the remover deletes parts of the subject, such as a perch or a host plant, or leaves a white rim. Key out near-white pixels connected to the border, then un-blend the edge pixels from white.
Record which method was used in `assets/v2/manifest.json`.

## Style anchor (prefix for every prompt)

> Premium children's editorial nature illustration, painterly gouache with light coloured-pencil texture, soft painted edges with no black outlines, warm late-morning sunlight from the upper left, soft cool shadows, medium saturation, clear readable silhouettes, anatomically accurate real wildlife with natural colouring, calm and hopeful mood, for a typing game for children aged 6 to 10.

## Guardrails (suffix for every prompt)

> No magic, no glowing runes, no sparkles, no wands, no potions, no fantasy creatures, no people, no text, no letters, no logos, no watermark, not photorealistic, not 3D render, no frightening elements.

## Meadow Base

### `meadow.scene.restored.v1` (16:9, 2k)
> A wide open meadow on gentle rolling hills under a soft blue sky with a few light clouds. Tall green grass with drifts of goldenrod, black-eyed Susans and pink common milkweed. A small wooden bird nest box on a post and a simple wooden bee hotel near a mown footpath. A few monarch butterflies and bumble bees among the flowers, an eastern bluebird on the nest box. Horizon in the upper third, open ground in the lower middle for gameplay, layered depth from foreground grass to far hills. Palette: sky #CFE6EE, grass #7FA65A, deep grass #4E7A3E, goldenrod #E3B53B, milkweed #C98BA6.

### `meadow.scene.damaged.v1` (16:9, 2k, image reference: approved restored scene)
> The same meadow, same composition and camera, before restoration: dry patchy grass in muted tan #C7B88E, bare brown soil patches #8A6A4A, no flowers, no wildlife, an empty post where the nest box will go. Calm and hopeful, not sad or dirty.

### `companion.fox.sheet.v1` (rejected)
Text-only with `background: transparent`. Result: digital "plush" fur that did not match the Meadow, a dark glow instead of transparency, and an open-mouth cartoon pose. Kept for the record; do not reuse.

### `companion.fox.sheet.v2` (1:1, opaque, image reference: style anchor, then background removal) — approved
> Match the exact painting style of the reference image: painterly gouache with light coloured-pencil texture, soft painted edges, no black outlines, warm late-morning light from the upper left, medium saturation. Do not copy the meadow scene. Paint a character reference sheet of one red fox guide shown four times, evenly spaced and not overlapping, on a plain flat pure white background with no shadows on the ground, no scenery, no gradient, no glow: (1) standing idle, side view facing right; (2) sitting, looking up curiously; (3) trotting, side view; (4) calm happy pose, tail gently raised, mouth closed. Natural red fox anatomy and colouring, white chest and tail tip, dark legs and ear backs, real fox eyes, calm grounded expression, not cartoonish, not fluffy plush. No clothing, no collar. No magic, no sparkles, no text, no letters, no logos, not photorealistic, not 3D render.

### `wildlife.monarch.v1` (1:1, transparent)
> A single monarch butterfly with wings open, accurate orange and black wing pattern with white spots, perched on a common milkweed flower head, transparent background.

### `wildlife.bumblebee.v1` (1:1, transparent)
> A single common eastern bumble bee with accurate yellow and black banding, visiting a black-eyed Susan flower, transparent background.

### `wildlife.bluebird.v1` (1:1, transparent)
> A single eastern bluebird, accurate blue back and rusty orange breast, perched on a short wooden post, transparent background.

### `props.meadow.restoration.v1` (1:1, transparent)
> A tidy set of separate meadow restoration props spaced apart on a transparent background: a small wooden bird nest box on a post, a simple wooden bee hotel, a seedling tray with young wildflower plants, a watering can, and a clump of black-eyed Susans.

### `ui.icons.v1` (1:1, transparent)
> A set of four simple matching game icons spaced apart on a transparent background: an open field guide notebook with a leaf, a folded paper map, a footpath arrow meaning continue, and a fox paw print. Same gouache texture, simplified shapes, warm palette.

## Round 2 prompts as used (image reference: style anchor)

Single-subject assets use this frame, with the subject line swapped in, then background removal:

> Match the exact painting style of the reference image (painterly gouache with light coloured-pencil texture, soft edges, no black outlines, warm light from upper left). Do not copy the scene. **[subject]**, centred, on a plain flat pure white background with no shadow, no scenery, no glow. No magic, no sparkles, no text, no logos, not photorealistic, not 3D render.

| Id | Subject line |
|---|---|
| `wildlife.monarch.v1` | A single monarch butterfly with wings open, accurate orange and black wing pattern with white spots, perched on one pink common milkweed flower head with a short stem and two leaves |
| `wildlife.bumblebee.v1` | A single common eastern bumble bee with accurate fuzzy yellow and black banding, visiting one black-eyed Susan flower with a short stem. Friendly but anatomically accurate, no cartoon face |
| `wildlife.bluebird.v1` | A single eastern bluebird, accurate bright blue back and wings and rusty orange breast with white belly, perched on a short weathered wooden fence post, side view |
| `props.meadow.restoration.v1` | A tidy set of five separate meadow restoration props, evenly spaced and not touching: a small wooden bird nest box on a post, a simple wooden bee hotel on a post, a wooden seedling tray with young wildflower plants, a green metal watering can, and a clump of black-eyed Susans |
| `ui.icons.v1` | Simplified for small icons: four separate matching icons in a 2 by 2 grid — an open field guide notebook with a pressed leaf, a folded paper trail map, a wooden trail sign arrow pointing right, and a red fox paw print. Clear simple silhouettes readable at small size, no numbers |

`meadow.scene.damaged.v1` as used:

> Repaint the reference meadow with the exact same composition, camera, hills, sky, path and painting style (painterly gouache with light coloured-pencil texture, soft edges, no black outlines), but BEFORE restoration: dry patchy short grass in muted tan #C7B88E, bare brown soil patches #8A6A4A, no wildflowers, no butterflies, no bees, no birds, no bird nest box and no bee hotel, only an empty wooden post where the nest box will go. Keep the sky soft and the light warm: calm and hopeful, ready to be restored, not sad, not dirty, no litter. No magic, no sparkles, no people, no text, no letters, no logos, not photorealistic, not 3D render.

## Round 3 prompts as used (2026-10-12)

All use the style anchor as an image reference. Single subjects use the round 2 frame above.

| Id | Subject line or prompt |
|---|---|
| `companion.fox.rest.v1` | Second image reference: the approved fox sheet (`ded3e271-…`), to keep the same fox. "One red fox resting, lying curled on the ground with its tail wrapped around, head up and eyes half closed, calm and content, side view." |
| `props.meadow.milkweed.v1` | A single clump of common milkweed plants with broad oval leaves and several round pink flower clusters, botanically accurate, growing from a small patch of grass |
| `props.meadow.goldenrod.v1` | A single clump of goldenrod with tall stems and arching plumes of small bright yellow flowers, botanically accurate, growing from a small patch of grass |
| `ui.badge.meadow.v1` | A round badge like an embroidered park patch: a small painted meadow vignette inside a circle with rolling green hills, a few goldenrod and pink milkweed flowers and one monarch butterfly, framed by a soft cream and green border ring. No text, no stars |
| `biomes.meadow.layer.sky.v1` | (16:9, 2k) Repaint only the sky of the reference image as a separate background layer, same style, colours and light, sky continuing to the bottom edge. No hills, ground, trees, plants, animals or objects |

Field Guide cards (3:4, opaque) use this frame:

> Match the exact painting style of the reference image (painterly gouache with light coloured-pencil texture, soft edges, no black outlines). A naturalist field guide study plate on warm cream paper **[about …]**, accurately drawn and neatly arranged: **[views]**. Calm, scientific, child-friendly. No text, no letters, no numbers, no labels, no logos, no magic, no sparkles, not photorealistic, not 3D render.

| Id | Views |
|---|---|
| `fieldguide.monarch.v1` | the monarch butterfly life cycle: a caterpillar with yellow, black and white stripes on a milkweed leaf, a green chrysalis with gold dots hanging from a stem, and an adult with open wings |
| `fieldguide.bumblebee.v1` | a bumble bee in side view showing fuzzy banding and pollen baskets on its hind legs, the same bee from above, and a bee visiting a black-eyed Susan |
| `fieldguide.bluebird.v1` | an adult male bluebird perched in side view, a duller female, and a wooden nest box with a small round entrance hole on a post |
| `fieldguide.milkweed.v1` | a milkweed stem with broad oval leaves and a round pink flower cluster, a close-up of one cluster, and an open seed pod releasing seeds with white silky fluff |
