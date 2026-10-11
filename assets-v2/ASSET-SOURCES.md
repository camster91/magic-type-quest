# Nature Quest asset sources

Status: **style test, not production-approved.** These files prove the art direction in [docs/v2/art/ART-BIBLE.md](../docs/v2/art/ART-BIBLE.md) for issue [#163](https://github.com/camster91/magic-type-quest/issues/163). Nothing here is wired into the game yet.

All assets were generated on 2026-10-11 with Higgsfield (model `gpt_image_2_5`, Flare, quality high). Prompts are in [docs/v2/art/PROMPTS.md](../docs/v2/art/PROMPTS.md). Transparent assets were cut out with Higgsfield's Image Background Remover. Repo copies are WebP (quality 90) converted from the Higgsfield PNG output; the full-resolution PNG masters stay in the Higgsfield account under the job ids below.

| File | Logical id | Prompt id | Higgsfield job (source) | Background removal job | Size | Approval |
|---|---|---|---|---|---|---|
| `meadow/biomes.meadow.scene.restored.webp` | `biomes.meadow.scene.restored` | `meadow.scene.restored.v1` | `9dbca920-8983-46e8-9b8a-cc95ec3c7436` | — | 2688×1520 | style anchor, approved by owner |
| `meadow/biomes.meadow.scene.damaged.webp` | `biomes.meadow.scene.damaged` | `meadow.scene.damaged.v1` | `daf946a9-3a42-48b2-a0ec-9c633dfd9cb7` | — | 2688×1520 | pending review |
| `meadow/companion.fox.sheet.webp` | `companion.fox.sheet` | `companion.fox.sheet.v2` | `ded3e271-2f79-4d55-b89a-e8b89fe95bfe` | `e91983ab-2701-47b2-87b4-d5405386d574` | 1024×1024 | approved by owner |
| `meadow/wildlife.monarch.webp` | `wildlife.monarch` | `wildlife.monarch.v1` | `67828107-d736-49f9-8140-9f7fb466edfb` | `5b5263da-8b48-42b6-942f-5814cff6f9f0` | 1024×1024 | pending review |
| `meadow/wildlife.bumblebee.webp` | `wildlife.bumblebee` | `wildlife.bumblebee.v1` | `d0ddcece-fb48-47aa-8156-548973a6ae27` | `0d8194f9-53d1-4d0b-8320-29ecb44eb4c0` | 1024×1024 | pending review |
| `meadow/wildlife.bluebird.webp` | `wildlife.bluebird` | `wildlife.bluebird.v1` | `84c36dbf-f265-4aa2-b308-3360f6c6dc7b` | `fb8953c6-c5ef-4943-8939-5dae94bd3bd4` | 1024×1024 | pending review |
| `meadow/props.meadow.restoration.webp` | `props.meadow.restoration` | `props.meadow.restoration.v1` | `b5a39395-de5c-48e6-8bb0-cc3cce10b4d4` | `2bacb937-df09-42e0-97fa-5741590a21f5` | 1024×1024 | pending review |
| `meadow/ui.icons.webp` | `ui.icons` | `ui.icons.v1` | `f53f0460-fdfc-4337-9ef7-36e11a3f4cda` | `6f69d94f-2d8c-4418-989e-11c625e63c88` | 1024×1024 | pending review |

## Known follow-ups before production use

- **Sheets need slicing:** the fox, props and icon sheets hold several items each. They need cutting into one file per pose or item, with logical ids such as `companion.fox.idle`.
- **Fox edge and shadow:** the fox cutout keeps a faint white edge. Trim it by one or two pixels, and draw a soft ground shadow in code so the fox sits in the grass.
- **Before/after alignment:** the damaged and restored Meadow scenes share a layout but are not pixel-aligned. Restoration needs the layered scene from the art bible, not a cross-fade between these two images.
- **Facts:** species facts need a recorded source before any Field Guide text uses them.
