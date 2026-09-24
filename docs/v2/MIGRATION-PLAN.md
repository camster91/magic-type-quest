# Nature Quest v2 migration and coexistence plan

Status: development integration contract under [#156](https://github.com/camster91/magic-type-quest/issues/156). This plan does not authorize a production release.

## Branch and route model

| State | Source and route | Learner data | Release rule |
| --- | --- | --- | --- |
| v1 stable | Protected `main`; default `/magic-type-quest/` | Existing `bloomtype-*` local keys | Existing v1 release process; current production remains v1 |
| v2 development | Long-lived `nature-quest-v2`; feature branches target it; intentional `/magic-type-quest/v2/` preview | Versioned IndexedDB `naturequest:v2:progress`; only the active learner pointer uses the `naturequest:v2:` localStorage namespace | Use `npm run build:v2` for a preview artifact, never deploy it as production default |
| v2 promoted | Exact approved artifact from #187 after gates | Versioned, copied v1 import under #162; original v1 storage retained | Requires explicit cutover and rollback approval |

The normal `npm run build` includes only the v1 HTML entries. `npm run build:v2` uses Vite's local `v2-preview` mode to add the v2 entry; no remote flag service is used. In development, visit the explicit `/magic-type-quest/v2/` URL. The preview links back to the v1 root and can dispose its Phaser stage without changing v1 state. Do not change protected-main settings in this migration issue. A feature PR targets `nature-quest-v2` and should not be retargeted to `main` as a shortcut. The integration branch is not a production deployment source.

## Data stages and namespace

1. **Preserve:** v1 continues to own `bloomtype-profile` and its named profile/class keys. Entering v2 does not call v1 state modules or write any learner key.
2. **Snapshot:** `readV1ActiveProfileSnapshot` returns a detached intermediate value with `importVersion: 0`, source key, and parsed payload. It reads only, does not cache raw keystroke transcripts, and fails closed on malformed JSON. It is not invoked by the boot scene. Named profiles/class data and schema validation remain for #162.
3. **Validate and map (#162):** validate the legacy shapes, copy useful evidence to the versioned v2 IndexedDB schema, and record source/import versions in the `migrations` store. The old `naturequest:v2:migration-version` constant remains reserved, but the database marker is canonical. Never overwrite or delete the original v1 keys. Make import idempotent and test repeat/reload/failure paths before first learner write. See [PERSISTENCE.md](PERSISTENCE.md).
4. **Coexist:** v1 remains accessible during development. V2 must not write incompatible values to v1 keys; a learner/QA operator can return to v1 without a reverse migration.
5. **Promote (#187 only):** dry-run the exact importer, back up/release the known-good v1 artifact, and switch the public default only after explicit approval. Keep the v1 local keys and rollback route during the defined release window.

#162 subsequently implemented a guarded first-run copy/import and the final local schema. The v1 storage remains byte-for-byte untouched; migration metadata stores source key/version and a local learner ID, never class IDs or raw typing text.

## Shared code and change resolution

V1 gameplay, shell, local storage, optional cloud, and service-worker files remain frozen for v2 aesthetic work. Shared configuration, build files, and CI are changed only as needed for coexistence. Import v1 curriculum logic through small typed adapters until #157 deliberately extracts a framework-independent domain; do not import v1 UI or game-engine modules into Phaser scenes. If a v1 curriculum fix lands on `main`, merge/rebase it into the integration branch, run both suites, then update the adapter and its fixtures before changing any v2 lesson. Resolve semantic conflicts in favour of introduced-key correctness and existing learner-data safety, with an explicit issue/PR record.

## CI evidence and rollback

The existing `ci` job independently runs v1 lint/unit/build/local-only artifact/audit and v1 Playwright journeys. A separate `v2` job runs strict TypeScript, theme guard, v2 preview build/local-only check, and coexistence browser smoke. Both jobs trigger for `main` and `nature-quest-v2` PRs/pushes; a passing v1 job cannot hide a failing v2 job. The v2 browser test verifies the canvas/DOM lifecycle, reduced-motion boot, return to v1, and no change to a seeded v1 profile key.

Rollback in development: remove the v2 build mode/preview entry or revert the integration commits; continue serving the unchanged v1 build from `main`. V1 data never depends on v2. A production rollback requires #187's artifact/cache plan; this document does not delete v1 presentation code. Such deletion needs a separate post-cutover issue after the rollback window and data validation have passed.
