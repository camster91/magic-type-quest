## 2025-05-15 - [Broken Sanitization for Zero Values]
**Vulnerability:** The `escapeHTML` utility incorrectly returned an empty string for the numeric value `0`.
**Learning:** Using `!val` or `if (!val) return ''` in a sanitization utility can lead to data loss or UI bugs for valid falsy values like `0`.
**Prevention:** Always use explicit null/undefined checks (`val == null`) or check for empty strings specifically when building sanitization helpers.

## 2025-05-15 - [Local Storage as XSS Vector in Teacher Dashboard]
**Vulnerability:** Peer-to-peer "sync" via `localStorage` (used for the classroom feature) allowed student names and stats to act as Stored XSS vectors when viewed by the teacher.
**Learning:** Developers often treat `localStorage` as "private" or "trusted," forgetting that in shared environments or sync-heavy apps, it can contain data from other users.
**Prevention:** Treat all data retrieved from `localStorage` as untrusted user input, especially if it's rendered into the DOM.
