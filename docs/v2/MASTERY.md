# Mastery domain — #158

`src/v2/mastery/engine.ts` owns scored key evidence, label derivation, lesson completion and biome gates. Phaser scenes render selector output; they do not assign mastery labels or unlock biomes. A typing service may call `recordAttempt` after verifying the curriculum target. The engine also rejects a target outside the lesson's allowed assessed keys. Touch and guided input introduce a key for instruction but do not count as proof of physical-keyboard mastery.

| State | Default evidence threshold | Additional condition |
| --- | --- | --- |
| new | no introduction | no meaningful evidence |
| learning | introduced | below familiar threshold |
| familiar | 12 scored exposures, rolling accuracy ≥80% | — |
| strong | 25 scored exposures, rolling accuracy ≥90% | last 10 stable at ≥90%; conservative 12-second median ceiling |
| mastered | 40 scored exposures, rolling accuracy ≥95% | at least two sessions, last 10 stable at ≥95%, no failed due review, same conservative latency ceiling |

The defaults are in `DEFAULT_MASTERY_CONFIG`; adjust through a versioned curriculum decision rather than duplicating numbers in scenes. Recent accuracy and latency samples are bounded to 40; only booleans and numeric latencies are stored, not typed text. One error does not demote an attained label. Three errors in the last 10 or a failed due review can lower it by at most one step per update. Accurate slower work retains its attained label. First-attempt correctness, recent errors, median latency, consecutive success, last practice and due timestamp are available as evidence. WPM is not part of a gate.

A lesson session must have at least 12 scored attempts and ≥80% accuracy, zero unintroduced-key violations, and each introduced key at the lesson's minimum state (`familiar` in the initial curriculum). A review/practice/drill/daily activity cannot mark a new lesson complete. `completeLesson` checks prerequisites and is idempotent. Biomes require completion of all earlier lessons and continued prerequisite-key familiarity. No selector reads stars, XP, currency, streaks or WPM. `getNextMasteryGoal` and `inspectMastery` explain a blocked key/lesson to QA; do not show the inspector string to children.

Example fixed traces from `test/v2-mastery.test.js`:

| Trace | Derived result |
| --- | --- |
| F introduced, 11/11 scored | learning |
| J 10/12, first session | familiar |
| F 36/36 across two sessions, stable recent 10 | strong (below 40 samples) |
| J 52/52 across two sessions, stable recent 10 | mastered |
| F 40/40 in one session | strong until another session |
| F mastered, one error | mastered |
| F sustained errors, then failed due review | strong, then familiar |
| F correct touch input only | learning, zero scored exposure |

Debug fixture: `f: mastered (40 scored, 100% accuracy, 0 recent errors, 2 sessions, due 86440000); next meadow-fj: complete an accurate lesson session`. This is a text-only dev inspector; no child UI is attached in #158.

## V1 import contract for #162

`mapLegacyMasteryEvidence` reads a copy of completed v1 levels and aggregate `keyAccuracy` if available. It marks historically introduced keys as `learning`; a key with at least 12 measured attempts and ≥80% accuracy may start at `familiar`, never higher. Legacy semicolon and Shift remain `learning` because their teaching order differs in v2. A v1 completion never becomes a v2 completed lesson and never directly unlocks a biome. In the absence of key evidence, the learner retains an introduced/learning starting point and receives rapid reassessment. #162 will make this pure mapping an idempotent, versioned, non-destructive storage import while retaining all original v1 data.

The current engine is domain-only. #159–#166 will connect it to the input and encounter services; no v2 scene currently writes evidence. The threshold defaults are initial product values and require supervised calibration before a production claim of age suitability.
