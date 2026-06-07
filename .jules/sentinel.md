## 2025-05-14 - Stored XSS via localStorage Sync Data
**Vulnerability:** User-controlled data (student names, avatars, and garden words) fetched from `localStorage` (which mirrors cloud sync data) was injected into the DOM using `.innerHTML` without sanitization. This allowed persistent execution of malicious scripts (Stored XSS) every time the Teacher Dashboard or Garden screen was viewed.

**Learning:** The application follows an "offline-first" sync pattern where classroom data is often sourced from local storage. Because this data is intended to be "synced" from other users (students), it must be treated as untrusted, even if it appears to be "local."

**Prevention:** Always use a sanitization utility like `escapeHTML` when rendering strings that could have originated from user input. Prefer `textContent` over `innerHTML` for simple text, but when template literals are necessary for complex HTML structures, ensure every interpolated variable is escaped.

## 2026-06-07 - Numeric Stats as XSS Vectors
**Vulnerability:** Fields expected to be numeric (e.g., `level`, `stars`, `total_words`) were interpolated directly into `innerHTML` strings. Attackers could poison `localStorage` with malicious strings (e.g., `"<img src=x onerror=alert(1)>"`) in these fields, bypassing basic assumptions that "stats" are safe.

**Learning:** Never assume a data field is numeric just because of its name or intended use. In an offline-first app where `localStorage` can be manually manipulated or synced from a malicious client, every field used in a DOM-injection context must be either escaped as a string or explicitly coerced using `Number()`.

**Prevention:** Use `escapeHTML()` for all interpolated values in template literals. For arithmetic operations on synced data, use `Number(val) || 0` to ensure numeric integrity and prevent string-based logic bypasses.
