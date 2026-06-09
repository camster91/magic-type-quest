## 2025-05-14 - Stored XSS via localStorage Sync Data
**Vulnerability:** User-controlled data (student names, avatars, and garden words) fetched from `localStorage` (which mirrors cloud sync data) was injected into the DOM using `.innerHTML` without sanitization. This allowed persistent execution of malicious scripts (Stored XSS) every time the Teacher Dashboard or Garden screen was viewed.

**Learning:** The application follows an "offline-first" sync pattern where classroom data is often sourced from local storage. Because this data is intended to be "synced" from other users (students), it must be treated as untrusted, even if it appears to be "local."

**Prevention:** Always use a sanitization utility like `escapeHTML` when rendering strings that could have originated from user input. Prefer `textContent` over `innerHTML` for simple text, but when template literals are necessary for complex HTML structures, ensure every interpolated variable is escaped.

## 2025-05-15 - Stored XSS via Numeric Field Poisoning
**Vulnerability:** Malicious strings (e.g., `<img src=x onerror=...>`) were provided in fields intended for numeric statistics (stars, words, score). When these were interpolated into `innerHTML` templates without coercion or escaping, they allowed XSS execution. Additionally, they poisoned summary calculations (e.g., `0 + "<img>"` results in `"0<img>"`).

**Learning:** Data intended to be numeric is not inherently safe if it originates from user-controlled storage (like `localStorage`). `Number()` coercion is an effective "fail-secure" mechanism that converts malicious strings to `NaN`, preventing DOM injection.

**Prevention:** Apply explicit numeric coercion (e.g., `Number(val) || 0`) for all statistics fetched from untrusted sources before rendering or using them in arithmetic operations.
