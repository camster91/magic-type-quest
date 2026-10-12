# Nature Quest asset sources

Status: **style test, not production-approved.** These files prove the art direction in [docs/v2/art/ART-BIBLE.md](../../docs/v2/art/ART-BIBLE.md) for issue #163. Nothing here is wired into the game, and the Vite build does not ship this folder.

[`manifest.json`](manifest.json) is the source of truth for every file: logical id, size, transparency, preload group, alt-text key, provenance, licence and approval state. `npm run check:v2-assets` fails CI when the manifest and the files disagree, when a file is unlisted, or when a file breaks the size budgets.

## How the files were made

- **Generation:** all art was generated on 2026-10-11 with Higgsfield, model `gpt_image_2_5` (Flare, quality high), on the owner's paid plan. Prompts are in [docs/v2/art/PROMPTS.md](../../docs/v2/art/PROMPTS.md).
- **Style reference:** every asset after the style anchor used the approved Meadow scene (`9dbca920-8983-46e8-9b8a-cc95ec3c7436`) as an image reference.
- **Cutouts** were made in one of two ways, recorded per asset in the manifest:
  - **Higgsfield Image Background Remover:** bumble bee, props and icons.
  - **White-key script:** fox, monarch and bluebird. The remover deleted the bluebird's post and the monarch's milkweed and left a white rim on the fox. These subjects were painted on pure white, so near-white pixels connected to the image border were keyed out, and the edge pixels were un-blended from white.
- **Slicing:** the fox, prop and icon sheets were cut into one file per pose or item. The edges were trimmed by one pixel and softened.
- **Masters:** repo copies are WebP (quality 90). Full-resolution PNG masters stay in the Higgsfield account under the source job ids.

## Source jobs

| Asset ids | Prompt id | Source job | Approval |
|---|---|---|---|
| `biomes.meadow.scene.restored` | `meadow.scene.restored.v1` | `9dbca920-8983-46e8-9b8a-cc95ec3c7436` | approved (style anchor) |
| `biomes.meadow.scene.damaged` | `meadow.scene.damaged.v1` | `daf946a9-3a42-48b2-a0ec-9c633dfd9cb7` | pending |
| `companion.fox.idle`, `.look`, `.move`, `.happy` | `companion.fox.sheet.v2` | `ded3e271-2f79-4d55-b89a-e8b89fe95bfe` | approved |
| `wildlife.monarch` | `wildlife.monarch.v1` | `67828107-d736-49f9-8140-9f7fb466edfb` | pending |
| `wildlife.bumblebee` | `wildlife.bumblebee.v1` | `d0ddcece-fb48-47aa-8156-548973a6ae27` | pending |
| `wildlife.bluebird` | `wildlife.bluebird.v1` | `84c36dbf-f265-4aa2-b308-3360f6c6dc7b` | pending |
| `props.meadow.nestbox`, `.beehotel`, `.seedlingtray`, `.wateringcan`, `.blackeyedsusans` | `props.meadow.restoration.v1` | `b5a39395-de5c-48e6-8bb0-cc3cce10b4d4` | pending |
| `ui.icon.fieldguide`, `.map`, `.continue`, `.pawprint` | `ui.icons.v1` | `f53f0460-fdfc-4337-9ef7-36e11a3f4cda` | pending |

## Known follow-ups before production use

- **Fox shadow:** draw a soft ground shadow under the fox in code, so it sits in the grass instead of floating.
- **Before/after alignment:** the damaged and restored Meadow scenes share a layout but are not pixel-aligned. Restoration needs the layered scene from the art bible, not a cross-fade between these two images.
- **Map icon:** its red "X" reads like a treasure map. Consider regenerating it without the mark.
- **Paw print icon:** it is a generic paw rather than a true fox track, which is fine as an icon. A Field Guide track illustration would need an accurate one.
- **Facts:** species facts need a recorded source before any Field Guide text uses them.
