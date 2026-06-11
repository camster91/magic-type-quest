## 2025-05-14 - Stored XSS via localStorage Sync Data
**Vulnerability:** User-controlled data (student names, avatars, and garden words) fetched from `localStorage` (which mirrors cloud sync data) was injected into the DOM using `.innerHTML` without sanitization. This allowed persistent execution of malicious scripts (Stored XSS) every time the Teacher Dashboard or Garden screen was viewed.

**Learning:** The application follows an "offline-first" sync pattern where classroom data is often sourced from local storage. Because this data is intended to be "synced" from other users (students), it must be treated as untrusted, even if it appears to be "local."

**Prevention:** Always use a sanitization utility like `escapeHTML` when rendering strings that could have originated from user input. Prefer `textContent` over `innerHTML` for simple text, but when template literals are necessary for complex HTML structures, ensure every interpolated variable is escaped.

## 2025-05-15 - Falsy Sanitization Bypass and Numeric XSS
**Vulnerability:** Numeric fields (words, score, level) were treated as "inherently safe" from XSS and injected via `innerHTML`. Additionally, the `escapeHTML` utility had a bug where it returned an empty string for the number `0` due to a loose falsy check (`!str`), causing data loss for legitimate zero values.

**Learning:** "Numbers" in web applications are often strings in disguise when coming from `localStorage` or JSON APIs. Never assume a field's type guarantees its safety if it is being interpolated into HTML. Furthermore, sanitization functions must use explicit checks (e.g., `str === null`) to avoid accidentally stripping valid falsy data like `0` or `false`.

**Prevention:** Apply `escapeHTML` to all user-provided data regardless of expected type. Use explicit `null`/`undefined` checks in utility functions to preserve valid falsy values.
