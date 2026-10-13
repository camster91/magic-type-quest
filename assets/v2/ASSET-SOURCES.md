# Nature Quest asset sources

Status: **style test, not production-approved.** These files prove the art direction in [docs/v2/art/ART-BIBLE.md](../../docs/v2/art/ART-BIBLE.md) for issue #163. Nothing here is wired into the game, and the Vite build does not ship this folder.

[`manifest.json`](manifest.json) is the source of truth for every file: logical id, size, transparency, preload group, alt-text key, provenance, licence and approval state. `npm run check:v2-assets` fails CI when the manifest and the files disagree, when a file is unlisted, or when a file breaks the size budgets.

## How the files were made

- **Generation:** all art was generated on 2026-10-11 and 2026-10-12 with Higgsfield, model `gpt_image_2_5` (Flare, quality high), on the owner's paid plan. Prompts are in [docs/v2/art/PROMPTS.md](../../docs/v2/art/PROMPTS.md).
- **Style reference:** every asset after the style anchor used the approved Meadow scene (`9dbca920-8983-46e8-9b8a-cc95ec3c7436`) as an image reference.
- **Cutouts** were made in one of two ways, recorded per asset in the manifest:
  - **Higgsfield Image Background Remover:** bumble bee, props and icons.
  - **White-key script:** fox (all poses), monarch, bluebird, milkweed, goldenrod, the Meadow badge, the flying wildlife, the cottontail and the growth stages.
  - **White-key script, all near-white pixels:** the scene layers. Their grass leaves small enclosed white gaps that a border-connected key misses, and they contain no white subjects. The remover deleted the bluebird's post and the monarch's milkweed and left a white rim on the fox. These subjects were painted on pure white, so near-white pixels connected to the image border were keyed out, and the edge pixels were un-blended from white.
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
| `companion.fox.rest` | `companion.fox.rest.v1` | `9a196fd1-c884-4fbe-9804-ce66bcf5f1f6` | pending |
| `props.meadow.milkweed` | `props.meadow.milkweed.v1` | `d27d4321-6760-46d7-8be5-41ca2d8278ce` | pending |
| `props.meadow.goldenrod` | `props.meadow.goldenrod.v1` | `1b974db3-d7fa-4c66-ac68-ea35d879b5e6` | pending |
| `fieldguide.monarch` | `fieldguide.monarch.v1` | `403dbaec-cc6d-4363-9088-b57426cf1b67` | pending |
| `fieldguide.bumblebee` | `fieldguide.bumblebee.v1` | `735b46cb-dbd7-44c6-9118-a776c321941f` | pending |
| `fieldguide.bluebird` | `fieldguide.bluebird.v1` | `13fd1fff-997e-4887-b483-4417f65df323` | pending |
| `fieldguide.milkweed` | `fieldguide.milkweed.v1` | `8441dada-756f-4d57-8029-64256f5c69b2` | pending |
| `ui.badge.meadow` | `ui.badge.meadow.v1` | `fcc2b7dc-1eba-4612-af95-242f9a9c99bc` | pending |
| `biomes.meadow.layer.sky` | `biomes.meadow.layer.sky.v1` | `0fd82531-18bc-4d35-b6f5-1563032b20e4` | pending |
| `biomes.meadow.layer.far` | `biomes.meadow.layer.far.v1` | `a6e3791e-be78-4dea-ab26-6a5220b81929` | pending |
| `biomes.meadow.layer.mid` | `biomes.meadow.layer.mid.v1` | `b0c9aa8b-de46-4d23-960c-5e231eac8e64` | pending |
| `biomes.meadow.layer.ground.restored` | `biomes.meadow.layer.ground.restored.v1` | `a4dcf743-7098-4c04-acae-d7d110c00128` | pending |
| `biomes.meadow.layer.ground.damaged` | `biomes.meadow.layer.ground.damaged.v1` (reference: the damaged scene) | `f5b9b4a9-6652-49fe-9f61-b7bdb9baa638` | pending |
| `biomes.meadow.layer.foreground` | `biomes.meadow.layer.foreground.v1` | `f18777b3-c2bb-42f6-b646-0c934c831fd2` | pending |
| `wildlife.monarch.move` | `wildlife.monarch.move.v1` | `26efa12c-a428-44bb-b7a4-ac02adad6400` | pending |
| `wildlife.bumblebee.move` | `wildlife.bumblebee.move.v1` | `7f58cfc6-c243-418e-beb1-818574311630` | pending |
| `wildlife.bluebird.move` | `wildlife.bluebird.move.v1` | `2d59d6f5-737c-453b-adee-d75d66289084` | pending |
| `wildlife.cottontail` | `wildlife.cottontail.v1` | `2c6f1feb-5908-4685-b28b-73277b2d53fe` | pending |
| `companion.fox.sniff` | `companion.fox.sniff.v1` | `3f3835d3-8656-4cbd-94b2-f9944ff975e1` | pending |
| `companion.fox.approach` | `companion.fox.approach.v1` | `59b65b55-bd1b-4755-b348-5d3188012efe` | pending |
| `props.meadow.blackeyedsusan.seedling`, `.young`, `.flowering` | `props.meadow.growthstages.v1` | `f6b944c5-386e-407f-b1fe-6eccab98ea7d` | pending |

## Known follow-ups before production use

- **Fox shadow:** draw a soft ground shadow under the fox in code, so it sits in the grass instead of floating.
- **Before/after:** use the separate layers for restoration (see the art bible). The two full scenes are references, not runtime art.
- **Cottontail:** this is an extra discovery outside the original Meadow list. Confirm it in the content model (#159) before shipping it.
- **Map icon:** its red "X" reads like a treasure map. Consider regenerating it without the mark.
- **Paw print icon:** it is a generic paw rather than a true fox track, which is fine as an icon. A Field Guide track illustration would need an accurate one.
- **Facts:** species facts need a recorded source before any Field Guide text uses them. The Field Guide cards show the monarch life cycle (caterpillar, chrysalis, adult), bumble bee pollen baskets, male and female bluebirds, and a milkweed seed pod; check each against a source before the card text is written.
