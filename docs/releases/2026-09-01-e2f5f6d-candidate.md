# Release candidate `e2f5f6d`

## Status

Verified candidate only. This artifact has not been approved, promoted, or deployed. Production remains on `1091e0d`.

## Exact artifact

- Commit: `e2f5f6dd3782a8702e639162e74502f2e2befd3f`
- Image: `ghcr.io/camster91/magic-type-quest:main-e2f5f6d`
- Multi-platform index digest: `sha256:c8c627ae1713653989ef586c2c2113e875a5ad2e2f3d2f4a96b517bea954e8a4`
- Linux/amd64 runtime manifest: `sha256:4c3c4a0b8c64cda42dcba3b46e569d75ed1e1350211f1eb0fdd64a14093806e4`
- Attestation manifest: `sha256:ce9b907a70040dd989115b35390c0ecbe9895a433ea25ea7731626fe4f09e49e`

## Scope since candidate `b87884e`

- Removed the unused `class_wpm_trends` and `red_flag_students` Supabase analytics RPCs.
- Added idempotent `drop function` statements so applying the schema also retires the redundant endpoints from an existing project.
- Added regression coverage proving neither RPC is recreated or called by the browser application.

The teacher dashboard already derives summaries from its RLS-filtered roster. Cloud sync remains disabled in the public deployment, and no production or cloud data was accessed or migrated.

## Verification evidence

- Local gate: 269 tests across 33 files, lint, Vite production build, local-only bundle verification across 13 text artifacts, 10 Playwright end-to-end tests, and `npm audit` with zero known vulnerabilities.
- Ashbi VPS CI: [GitHub Actions run 33502757034](https://github.com/camster91/magic-type-quest/actions/runs/33502757034) passed the exact commit.
- Ashbi VPS image build: [GitHub Actions run 33502757016](https://github.com/camster91/magic-type-quest/actions/runs/33502757016) passed and published the exact image above with SBOM and provenance attestations.
- Repository state at verification: zero open issues and zero open pull requests.

## Residual gates

- Revoke or rotate the removed Google API key at the provider and record non-secret evidence.
- Approve and provision Supabase, then run cross-account isolation, export, learning-data deletion, identity-account deletion, and backup-expiry drills.
- Complete physical-device and screen-reader QA, fluent French and Spanish review, and the supervised school pilot.
- Obtain explicit approval for this exact artifact before any production promotion.

## Rollback

If this candidate is later approved and promoted, the immediate rollback target is current production:

- Commit: `1091e0d3c4be1772694f2fc9eb90f3355703bf06`
- Image tag: `1091e0d`
- Image ID: `sha256:75a5c60817ae1c52170cac9d8e7f4673a8d6397a2abf14e05334c4331212b32e`

The secondary rollback target is image tag `5d00b77`, image ID `sha256:f70fddb56f093913a8fa4c7168f7f4bc88f09f76f0c381880fabef1d2e0cb4f9`.
