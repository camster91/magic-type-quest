# Nature Quest v2 content authoring — #159

The sole content entry point is `ContentRegistry` in `src/v2/content/registry.ts`. Scenes request a stable ID through `getBiome`, `getMission`, `getRestorationStage`, `getWildlife`, `getReward` and `getString`; they do not import fixture files. `validateContent` runs at registry construction and in CI with `npm run validate:content`, failing with a path for each broken reference. `schema.ts` defines the typed contracts. `data.ts` contains the initial draft. The six biome IDs and their lesson mappings come from the curriculum domain; content cannot introduce keys or change their order.

## Current content state

| Biome | Lessons | Missions | Stages | Status |
| --- | --- | ---: | ---: | --- |
| Meadow Base | `meadow-fj`, `meadow-growth`, `meadow-review` | 3 draft | 0–4 draft | planned |
| Forest Trail | `forest-upper` | — | — | planned |
| Wetlands | `wetlands-lower` | — | — | planned |
| River & Coast | `river-shift` | — | — | planned |
| Mountain Research Station | `mountain-numbers`, `mountain-punctuation` | — | — | planned |
| Wildlife Reserve | `reserve-fluency` | — | — | planned |

Meadow's three missions follow #167: F/J home position marks planting spots; home-row growth plants wildflower patches; home-row review restores the meadow and allows a pollinator discovery. Five stages show sparse, planting spots, flowers, pollinator arrival, and restored. The two named species slots, common yarrow and monarch butterfly, are **draft candidates** with no facts, sources or artwork. #167/#170 must review suitability and factual content before either discovery becomes production content. Names and descriptions currently identify illustration slots; they are not facts. All biome and mission statuses remain `planned` until the slice is built and verified.

## Add a biome

1. Use one of the six canonical IDs in `biomeMapping.ts`; a new world needs an explicit product change. Add its `BiomeDefinition` with version, content keys, exact mapped lesson IDs, scene key, asset pack, ordered stage/mission/discovery IDs, palette token, ambient audio slot if used, and selector IDs.
2. Keep `status: 'planned'` until a fully validated implementation exists. With `releasePhase: 'meadow'`, later biomes cannot be marked implemented before the Meadow gate. #178's recorded GO may change the phase to `expanded` for subsequent content issues. Add EN/FR/ES text for display and description keys.
3. Add each stage, mission, discovery and asset slot before referring to it. Run the content validator and curriculum tests.

## Add restoration stages and missions

Stages begin at order 0 and increase without gaps. Each has a milestone (`initial`, `mission:<id>:sequence`, or `mission:<id>:complete`), visible/hidden layer IDs, prop changes, wildlife arrivals, animation cue, accessible summary key, reduced-motion fallback, and a `naturequest:v2:` persistence key. Stage 0 is the sparse baseline. The assets must exist in the [typed manifest](../../src/v2/assets/manifest.ts); `STARTER_CONTENT.assets` is derived from it. Implemented content requires approved built paths and variants. Use [the art bible](art/ART-BIBLE.md), [Meadow checklist](art/MEADOW-SLOTS.md), and `npm run validate:assets` before an art PR.

For a mission, choose a lesson from the biome curriculum contract, objective content key, interaction ID, restoration outcome stage, approved rewards, duration, supportive retry, accessibility modes and deterministic seed policy. A review mission still uses its lesson's allowed assessed keys. Mission play later uses the shared encounter state machine and mastery engine; this schema does not bypass either. Add EN/FR/ES objective strings. The Meadow sample IDs are `meadow-a`, `meadow-b` and `meadow-c`; all are still draft.

## Add a species, fact and reward

A `WildlifeEntry` uses a stable species ID, common-name key, optional verified scientific name, biome IDs, discovery milestone, illustration/animation asset IDs, accessible description, and a fact review record. Planned entries may have `factReview.status: 'pending'`, no source/reviewer and no fact text. To mark an entry implemented, add reviewed fact content IDs in every locale, a recorded source and reviewer, and built art. Do not runtime-translate facts or encourage unsafe contact with wildlife. Check the broad habitat context with the content reviewer before promising local ecological specificity.

`RewardDefinition.type` allows only `habitatState`, `fieldGuideEntry`, `companionMilestone` or `badge`. It references an existing stage or discovery where applicable. Currency, loot, XP, pricing and purchasable energy fields are rejected. A Field Guide entry is a wildlife/plant discovery, never a collectible pet.

## Validation examples

| Invalid authoring input | Failure |
| --- | --- |
| `meadow-a.lessonId = 'forest-upper'` | `missions[0].lessonId: outside biome curriculum` |
| A stage refers to `unlisted` layer | `stages[1].layers: missing asset unlisted` |
| Stage 1 order changed to 3 | `biomes[0].restorationStageIds: gap, duplicate or out-of-order stage` |
| Missing French objective | `strings.fr.mission.meadow.a: untranslated required key` |
| Implemented species with pending fact | `wildlife[0].factReview: production fact needs reviewed source, reviewer and content` |
| Reward type `coins` | `rewards[0].type: unsupported reward coins` |

`npm run validate:content` reports 3 passing validator suites for the current draft. `ContentRegistry` throws a path-listed error on malformed data, so development and tests fail before a scene can render it. #163 records the planned art slots and provenance without generating a large library; #167 replaces draft mission content with production content after review.
