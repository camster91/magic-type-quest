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

## Round 4 prompts as used (2026-10-12)

**Scene layers** (16:9, 2k) all start with: "A separate [background / midground / foreground ground] layer for a side-scrolling game, matching the exact painting style, colours and light of the reference image (painterly gouache with light coloured-pencil texture, soft edges, no black outlines)." Each then says what to paint, that "everything above it is plain flat pure white", and gives the guardrails.

| Id | What to paint |
|---|---|
| `biomes.meadow.layer.far.v1` | Only the distant rolling blue-green hills, patchwork fields and far tree line, filling the lower half and continuing to the bottom edge; no sky |
| `biomes.meadow.layer.mid.v1` | A band of middle-distance meadow with soft drifts of goldenrod and milkweed and a few small shrubs, lower 45 percent; no animals or posts |
| `biomes.meadow.layer.ground.restored.v1` | Lush green grass with a mown path and scattered black-eyed Susans, goldenrod and milkweed, lower 35 percent with an uneven grassy top edge |
| `biomes.meadow.layer.ground.damaged.v1` | Reference: the damaged scene. Short patchy tan grass and bare soil with a worn path, no flowers, lower 35 percent; calm, no litter |
| `biomes.meadow.layer.foreground.v1` | Tall grasses, seed heads, goldenrod and milkweed rising from the bottom corners and a thin bottom strip; centre and top empty white |

**Single subjects** use the round 2 frame:

| Id | Subject line |
|---|---|
| `wildlife.monarch.move.v1` | A single monarch in flight, wings raised mid-beat, three-quarter view, no motion lines |
| `wildlife.bumblebee.move.v1` | A single common eastern bumble bee in flight, side view, wings slightly blurred, legs tucked, no cartoon face |
| `wildlife.bluebird.move.v1` | A single eastern bluebird in flight, wings spread, side view |
| `wildlife.cottontail.v1` | A single wild eastern cottontail sitting alert in a tuft of meadow grass with clover, side view, not cartoonish |
| `props.meadow.growthstages.v1` | (3:2) Three growth stages of a black-eyed Susan in a row, each from the same soil mound: seedling, young plant with bud, flowering plant |
| `companion.fox.sniff.v1` | Fox sheet as a second reference. The fox gently sniffing a single black-eyed Susan, side view |
| `companion.fox.approach.v1` | Fox sheet as a second reference. The fox walking toward the viewer, front three-quarter view, mouth closed |

## Round 5: pets, level tiles and achievement medallions (2026-10-14)

All use the style anchor as an image reference (`gpt_image_2_5`, quality `high`). These replace the v1 3D-render art on child-facing screens. The pets are the game's own characters (flower, sunflower, dragon, cat, robot, bunny, panda, fox, owl, puppy), so they keep friendly storybook faces; the fantasy guardrail is dropped for the dragon and the robot only.

**Pet sheets** (3:2, 2k, one per pet), then the Higgsfield Image Background Remover merged with a white-key cut (the remover drops loose petals and leaves), sliced into five sprites and exported at 360 px:

> Match the exact painting style of the reference image [style anchor]. Paint a character reference sheet of ONE small friendly pet character for a children's typing game, shown five times in five different poses, three in the top row and two centred in the bottom row, well separated, on a plain flat pure white background. The character: **[pet]**. The five poses: (1) idle: calm and content, eyes softly closed; (2) happy: big smile, both arms raised; (3) hurt: a little 'oops', one eye squeezed shut, a small tear, gentle not scary; (4) celebrate: jumping and cheering, a few painted petals tossed in the air; (5) on a roll: bursting with excited energy, wrapped in a swirl of warm orange and golden painted autumn leaves and petals. No magic, no glowing, no sparkles, no fire, no text, not a 3D render, not glossy, not plastic.

The five poses map to the game states `idle`, `happy`, `hurt`, `celebrate` and `fire` (`public/assets/pets/<pet>-<state>.webp`).

**Level tiles** (1:1, 1k, exported at 128 px to `public/assets/levels/`): one vignette per level, full bleed, no text: garden bed (1, `home-row`), big sky with a bluebird (2, `top-row`), seashore with shells (3, `bottom-row`), woodland clearing with a red squirrel (4, `all-letters`), storybook hill town (5, `capitals`), gentle twilight sky with moon and a ringed planet (6, `numbers`), a hare bounding through the meadow (7, `speed`), a mountain path up to a cairn (8, `accuracy`), a river valley with a footbridge (9, `master`), a small stone castle on a hill (10, `legend`).

**Achievement medallions** (3:2, 2k, one sheet, background remover, exported at 144 px to `public/assets/badges/<category>.webp`): five matching round medallions with a cream and warm gold carved-wood rim: hare (speed), dragonfly on a daisy (accuracy), autumn-leaf swirl (combo), open storybook with a pressed flower (volume), wildflower and laurel crown (mastery). The achievement's own symbol shows as a small chip on the medallion.
