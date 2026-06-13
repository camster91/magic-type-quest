## 2025-05-14 - Stored XSS via localStorage Sync Data
**Vulnerability:** User-controlled data (student names, avatars, and garden words) fetched from `localStorage` (which mirrors cloud sync data) was injected into the DOM using `.innerHTML` without sanitization. This allowed persistent execution of malicious scripts (Stored XSS) every time the Teacher Dashboard or Garden screen was viewed.

**Learning:** The application follows an "offline-first" sync pattern where classroom data is often sourced from local storage. Because this data is intended to be "synced" from other users (students), it must be treated as untrusted, even if it appears to be "local."

**Prevention:** Always use a sanitization utility like `escapeHTML` when rendering strings that could have originated from user input. Prefer `textContent` over `innerHTML` for simple text, but when template literals are necessary for complex HTML structures, ensure every interpolated variable is escaped.

## 2025-05-15 - XSS via Aggregated Statistics
**Vulnerability:** Calculating aggregated statistics (like `totalStars` and `totalWords`) by simply adding user-controlled properties can lead to XSS if those properties contain malicious strings instead of numbers. If `total_stars` is `"0<img src=x onerror=alert(1)>"`, the sum becomes a string containing the payload, which is then injected via `innerHTML`.

**Learning:** Mathematical operations on untrusted data can result in string concatenation rather than numeric addition if types are not strictly enforced. This "poisoned math" can carry XSS payloads into parts of the UI that might otherwise seem safe (like a summary total).

**Prevention:** Use explicit numeric coercion (e.g., `Number(val) || 0`) for any untrusted data used in arithmetic. Additionally, always apply `escapeHTML` to the final result of any calculation before inserting it into the DOM via `innerHTML` as part of a defense-in-depth strategy.
