# Curriculum audit — #157 and #139

Generated from the versioned `LESSONS` definitions and the historical `ALL_WORDS` / `ALL_SENTENCES` arrays on 2026-09-24. Reproduce the counts with `node --experimental-strip-types --input-type=module` importing `getLegacyContentAudit` from `src/v2/curriculum/legacyAdapter.ts`; `npm run validate:curriculum` checks the contracts and prevents increases to the historical rejection counts. The v2 test runs every authored item in EN, FR and ES through every assessment mode (lesson, practice, daily, drill, review). All 9 lessons × 3 locales × 5 modes pass. `auditCurriculum()` and `auditBiomeMapping()` return no failures.

| Lesson | Biome | Introduced | Review | Allowed assessed | Prerequisite | EN / FR / ES |
| --- | --- | --- | --- | --- | --- | --- |
| `meadow-fj` | Meadow Base | f j | — | f j | — | pass / pass / pass |
| `meadow-growth` | Meadow Base | a s d k l Space | f j | f j a s d k l Space | `meadow-fj`; f j | pass / pass / pass |
| `meadow-review` | Meadow Base | g h | f j a s d k l Space | all home letters + Space | `meadow-growth`; prior home keys | pass / pass / pass |
| `forest-upper` | Forest Trail | q w e r t y u i o p | home + Space | home + Space + upper | `meadow-review`; home + Space | pass / pass / pass |
| `wetlands-lower` | Wetlands | z x c v b n m | home + Space + upper | all lowercase + Space | `forest-upper`; upper | pass / pass / pass |
| `river-shift` | River & Coast | Shift | all lowercase + Space | lowercase + Space + Shift | `wetlands-lower`; lower | pass / pass / pass |
| `mountain-numbers` | Mountain Research Station | 1–0 | lowercase + Space + Shift | prior + 1–0 | `river-shift`; Shift | pass / pass / pass |
| `mountain-punctuation` | Mountain Research Station | comma period semicolon ? ! | prior keys | prior + punctuation | `mountain-numbers`; digits + Shift | pass / pass / pass |
| `reserve-fluency` | Wildlife Reserve | — | all prior keys | all taught keys | `mountain-punctuation`; punctuation | pass / pass / pass |

Each row has stable id, display content key, ordered introduced/review/allowed keys, prerequisites, item source and length bounds, Shift/capital, number, punctuation, locale and completion rules, and version 1. Capitals require Shift. `?` and `!` require Shift. Accents are not assessed until a locale-specific keyboard and character rule is reviewed. EN words and locale-neutral patterns are distinct item kinds; FR/ES currently get reviewed patterns only. This is a deliberate limited fallback, not a translation claim. The v2 completion selector will use the `familiar` minimum state from #158. `getNextLesson` currently accepts completed lesson IDs supplied by that later selector; callers must not treat a scene flag as mastery evidence.

## Historical v1 bank audit

The historical arrays are retained for rollback. Runtime `getLessonByLevel()` filters assessed output before lesson, practice and Daily Moment play. Drill and spaced review also filter candidates to the learner's unlocked level. The values below are **rejected / total**. A rejected item is not presented for assessment.

| Level | Words | Sentences | Practice patterns |
| --- | ---: | ---: | ---: |
| 1 | 111 / 117 | 19 / 19 | 0 / 9 |
| 2 | 87 / 218 | 19 / 20 | 0 / 6 |
| 3 | 78 / 308 | 19 / 20 | 1 / 6 |
| 4 | 0 / 594 | 0 / 20 | 0 / 5 |
| 5 | 0 / 504 | 0 / 20 | 0 / 9 |
| 6 | 164 / 405 | 1 / 21 | 0 / 5 |
| 7 | 0 / 646 | 0 / 20 | 0 / 0 |
| 8 | 1 / 546 | 0 / 20 | 0 / 0 |
| 9 | 0 / 551 | 0 / 24 | 0 / 0 |
| 10 | 60 / 2040 | 0 / 32 | 0 / 0 |

V1 explicitly introduces semicolon at Level 1, unlike v2, where punctuation belongs to Mountain. V1 Level 4 now explicitly introduces the previously omitted g/h before all-letter words. V1 Level 5 teaches capitals via Shift after lowercase; Level 6 adds digits. Other punctuation and accents are not in the v1 assessed-key contract and remain filtered. Display translations change metadata only; they do not substitute unchecked assessed content. `src/lessons.js` is an inactive legacy structure with no imports in the shipped runtime, retained for recovery. Do not use its raw word lists as a new assessment source.

## Adding a lesson or item

1. Add a stable `LessonId` and a `LessonDefinition` in `src/v2/curriculum/domain.ts`. Specify taught/review/assessed keys, prerequisites, source item type, locale coverage, Shift/punctuation/number rules, completion contract and content version.
2. Add exactly one mapping in `biomeMapping.ts`. The biome must follow the curriculum; it cannot authorize extra keys.
3. Use `validatePracticeItem(item, lessonId, locale, mode)` for any authored or adaptive item. Add reviewed locale content before claiming translated vocabulary. A pattern is labeled as a pattern, not as a word.
4. Run `npm run validate:curriculum`, `npm run typecheck:v2`, the full suite and browser journeys. New v1 authored material should call `assertLegacyContentAllowed`; the historical compatibility filter does not excuse new violations.

The tests include negative examples for future letters, Shift, numbers, punctuation and undocumented accents. Representative browser navigation checks first Level 1 assessment and the Level 4 g/h transition. The legacy source arrays still contain excluded vocabulary; a future editorial pass may replace those banks without changing the guarded learning path.
