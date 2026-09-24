# Nature Quest v2 product contract

Status: governing product contract for v2, under [issue #153](https://github.com/camster91/magic-type-quest/issues/153). The existing BloomType product remains the recoverable v1 experience during the migration. Implementation details and thresholds belong to their linked issues; this contract does not replace them.

## Product statement

**Nature Quest is a browser-first typing adventure for children where demonstrated typing mastery restores habitats and unlocks real wildlife discoveries.**

The learner promise is: **My typing helps this habitat come back to life.**

## Primary learner

The core child flow serves approximately ages 6–10, with short language and clear actions suitable for an early independent reader. A local session begins without an account, email, purchase, installation, teacher setup, or parent intervention. Parent and teacher functions remain separate from the child's first play.

## Core experience

Arrive → see one objective → learn/review exact keys → guided practice → habitat task → visible restoration → wildlife/plant discovery → mastery saved → Continue / Finish for now.

- A normal encounter targets **2–5 minutes**.
- The first meaningful keystroke targets **within 20 seconds** of first opening the interactive experience.
- The current objective and immediate next action are always clear. Typing progress causes a visible, meaningful change in the habitat; discovery follows demonstrated learning.

## Theme boundaries

Allowed framing and actions: nature, wildlife, ecosystems, gardening, conservation, exploration, field research, observation, repair, cleanup, planting, growing, identifying, tracking, building simple habitat supports, rivers, forests, wetlands, coast, mountains, and science stations. Wildlife is observed and documented as wild, not collected as pets. Content must not suggest unsafe contact with animals or habitats.

Prohibited framing and mechanics: magic, spells, witchcraft, wizard or witch imagery, sorcery, potions, occult symbolism, supernatural rituals, mystical runes, enchanted objects, supernatural powers, or unexplained supernatural forces driving restoration. Synonyms such as “enchantment”, “mystic energy”, “arcane”, “spellbook”, and “mana” do not evade this rule. Existing v1 history is retained for migration and is not v2 creative direction.

**Theme decision test:** A proposed feature is on-theme only if a child can explain its cause in terms of typing practice and a grounded habitat action or wildlife observation. Reject supernatural explanations even when their graphics resemble nature. Also reject decorative rewards that do not reflect learning or restoration. Curriculum rules override themed vocabulary: no mission tests an unintroduced key just to use a fitting nature word.

## Learning principles

- Typing skill is the progression gate. Never test an unintroduced key, including in review or adaptive content.
- Mistakes are information, not punishment. Give calm correction and another supported attempt; do not remove lives or hearts for ordinary typing errors or use a normal-error game over.
- Accuracy comes before speed for early learners. WPM may be measured but is not the primary early child-facing success signal. Avoid countdown pressure in foundational lessons.
- Weak keys return through supportive spaced review. Struggle prompts clearer key/finger guidance and easier unscored practice rather than increased difficulty.
- The world reacts to meaningful typing progress. The child always knows the immediate next action.
- Any later approved challenge mode is separate from required learning.

## Progression language

The canonical mastery labels, in order, are `new → learning → familiar → strong → mastered`. These are product labels only. [Issue #158](https://github.com/camster91/magic-type-quest/issues/158) defines evidence and numeric thresholds; scenes cannot set mastery directly.

The canonical world order is **Meadow Base → Forest Trail → Wetlands → River & Coast → Mountain Research Station → Wildlife Reserve**. The curriculum determines introduced and assessed keys, and mastery determines unlocks. [Issue #157](https://github.com/camster91/magic-type-quest/issues/157) defines the curriculum contract. The world art adapts to it.

## Reward hierarchy

Primary rewards are habitat restoration, discoveries of real animals and plants, Field Guide entries, companion relationship or evolution only at meaningful mastery milestones, and visible before/after habitat improvement. Badges may be secondary rewards for meaningful milestones. Do not add coins, gems, loot boxes, purchasable energy, arbitrary XP, multiple currencies, or star-first progression. Wildlife discoveries are not pet inventory.

## Child-facing information architecture

- **Continue / current biome** is the dominant action.
- **World Map**, **Field Guide**, and **Companion** are child destinations.
- **Profile/Settings** is secondary navigation.
- Parent and teacher views are separate and do not compete visually with the child's main action.

The first-run flow introduces the first key through play, not a feature tour. The companion is initially one grounded red fox guide, with calm, occasional guidance rather than constant chatter or maintenance demands.

## Tone

Use short, concrete, encouraging language without talking down to children. Never shame errors or praise every keystroke extravagantly. Name real animals and habitats accurately; facts require a recorded source and review path before production use. Avoid fear-based environmental messaging. Restoration is hopeful and caused by the learner's typing practice.

## Browser-first rule

The canonical action is **Play/Continue in browser**. Installation is optional and may appear only in secondary Settings/Help. No install prompt interrupts first run and no install is required to play. Local-first play is available without production cloud or classroom setup. The accessible DOM owns semantic instructions and controls; the game world can respond visually without hiding essential information in Canvas.

## Implementation references

- [#153 governing epic](https://github.com/camster91/magic-type-quest/issues/153) defines the backlog and gates.
- [#155 architecture](https://github.com/camster91/magic-type-quest/issues/155), [#156 migration](https://github.com/camster91/magic-type-quest/issues/156), and [#167 Meadow slice](https://github.com/camster91/magic-type-quest/issues/167) govern implementation, rollback, and proof before expansion.
- `npm run check:v2-theme` checks v2 child-facing source/content. Historical v1 files and these decision documents are deliberately outside its scan roots. Any exception needs an exact file/term and a reason in `scripts/v2-theme-allowlist.json`.
