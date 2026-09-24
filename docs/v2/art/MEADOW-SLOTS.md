# Meadow Base art slot checklist

These are slots for #167, not finished assets. All have `status: planned` in the typed manifest. Approve a coherent Meadow slice before generating later biome packs. The current BootScene geometry is a temporary rendering proof.

| Order/layer | Logical IDs | Stage/use | Acceptance check |
| --- | --- | --- | --- |
| 1 Sky/background | `biomes.meadow.background.sky` | all stages; minimum pack | 1920×1080 master, quiet crop, left daylight |
| 2 Far scenery | `biomes.meadow.far.ridgeline` | all stages | transparent plane, same horizon |
| 3 Midground | `biomes.meadow.mid.grasses` | sparse and restored | depth without hiding action |
| 4 Habitat plane | `biomes.meadow.habitat.sparse` | baseline stage 0 | open patches visibly distinct |
| 5 Restoration props | `biomes.meadow.restoration.plantingSpots`, `biomes.meadow.restoration.flowers`, `biomes.meadow.restoration.restored` | missions A, B, C | matched camera, clear non-colour before/after change |
| 6 Wildlife | `wildlife.monarch.idle` | candidate discovery in mission C | approved reference/anatomy, DOM description; fact remains pending |
| 7 Foreground | `biomes.meadow.foreground.stems` | optional | frames scene without obscuring target |
| 8 Effects | `biomes.meadow.effects.pollen` | optional | removable in reduced motion; never sole completion cue |
| 9 Highlights | `biomes.meadow.highlights.planting` | mission interaction | visible with reduced motion and no colour-only instruction |
| Guide/companion/UI | `plants.yarrow.card`, `companion.fox.guide`, `ui.map.meadow.badge`, `ui.mastery.keycap` | Field Guide, guide, map and key help | reviewed subject/fox consistency, semantic DOM labels |

Production handoff for each slot: approved source master; optimized desktop/tablet/mobile variants; dimensions and byte sizes; transparent/opaque and safe crop; licence/provenance log; prompt/reference ID; edit/reviewer/date; meaningful DOM description key or decorative empty description; manifest status updated; validator passes. A planned slot is never requested by the loader. The first minimum pack can omit optional foreground/effects until input, restoration and discovery remain understandable.
