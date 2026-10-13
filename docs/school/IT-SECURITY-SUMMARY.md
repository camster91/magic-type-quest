# BloomType: one-page summary for school IT

> **Draft for owner review.** Facts here are checked against the repository; confirm the live headers after each release.

## What it is

A web app (PWA) for typing practice. It runs in any modern browser, including managed Chromebooks, and works offline after the first visit. Nothing needs installing.

## Address to allow

- `https://bloomtype.ashbi.ca/magic-type-quest/`, served over HTTPS.
- The app loads **nothing from other domains**: no CDNs, fonts, analytics or ads. Its Content-Security-Policy only allows `'self'`.

## Data flow

- **Public version:** all student data stays in the browser's `localStorage` on that device. The app makes no network calls with student data. A build check (`npm run verify:local-only-build`) fails any release that contains cloud code.
- **Optional cloud sync:** prepared but switched off. See the [privacy summary](PRIVACY-SUMMARY.md).

## Storage keys (localStorage)

| Key | Contents |
|---|---|
| `bloomtype-profile` | The active player's profile |
| `bloomtype_profile_<name>` | A saved copy of each player on the device (used for switching players and the teacher/parent pages) |
| `bloomtype-class-<CODE>` | Class roster summaries for the teacher page on this device |
| `bloomtype-classes` | The teacher's classes, assignments and spelling words |

Clearing site data for the domain removes everything. Chromebooks that wipe storage between users will also wipe progress. Students can carry it with a **save code** (the restore-code feature, once merged) or, later, the cloud class login.

## Security controls

_The headers and teacher PIN below arrive with PR #210; confirm them on the live site after it is released._

- **HTTPS only**, with HSTS.
- **Content-Security-Policy:** `default-src 'self'`, `frame-ancestors 'none'`, no third-party script, style or connect sources.
- **Other headers:** `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` (camera, microphone and location off), `X-Frame-Options: DENY`.
- **Teacher page PIN:** a hashed PIN (PBKDF2), with a lock-out after repeated wrong tries.
- **Updates:** a service worker keeps the app working offline and fetches updates on the next visit.
- **Build and release:** CI runs lint, unit tests, browser tests (including automated accessibility checks) and a dependency audit on every change. Production images are built from pinned base images.
- **No live AI** and no user-generated content shared between students.

## Device needs

Any browser released in the last 3 years, a physical keyboard (typing practice), and about 5 MB of storage. Sound is optional.

## Contact

Security reports: cameron@ashbi.ca
