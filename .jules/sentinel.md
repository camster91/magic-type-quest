## 2025-05-14 - Stored XSS via localStorage Sync Data
**Vulnerability:** User-controlled data (student names, avatars, and garden words) fetched from `localStorage` (which mirrors cloud sync data) was injected into the DOM using `.innerHTML` without sanitization. This allowed persistent execution of malicious scripts (Stored XSS) every time the Teacher Dashboard or Garden screen was viewed.

**Learning:** The application follows an "offline-first" sync pattern where classroom data is often sourced from local storage. Because this data is intended to be "synced" from other users (students), it must be treated as untrusted, even if it appears to be "local."

**Prevention:** Always use a sanitization utility like `escapeHTML` when rendering strings that could have originated from user input. Prefer `textContent` over `innerHTML` for simple text, but when template literals are necessary for complex HTML structures, ensure every interpolated variable is escaped.

## 2025-05-15 - XSS via Malicious Numeric Data
**Vulnerability:** Fields assumed to be numeric (total stars, level, score) were injected into `.innerHTML` without escaping. A malicious actor could provide strings containing script tags for these fields in `localStorage`.

**Learning:** "Numeric" data in JSON/localStorage is not inherently safe if the structure is not enforced. Casting to `Number()` and escaping the result is necessary for defense in depth.

**Prevention:** Coerce untrusted numeric input using `Number(val) || 0` and always wrap the output in `escapeHTML()` when rendering to HTML.
