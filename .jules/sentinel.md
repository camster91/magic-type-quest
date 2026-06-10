## 2025-05-14 - Stored XSS via localStorage Sync Data
**Vulnerability:** User-controlled data (student names, avatars, and garden words) fetched from `localStorage` (which mirrors cloud sync data) was injected into the DOM using `.innerHTML` without sanitization. This allowed persistent execution of malicious scripts (Stored XSS) every time the Teacher Dashboard or Garden screen was viewed.

**Learning:** The application follows an "offline-first" sync pattern where classroom data is often sourced from local storage. Because this data is intended to be "synced" from other users (students), it must be treated as untrusted, even if it appears to be "local."

**Prevention:** Always use a sanitization utility like `escapeHTML` when rendering strings that could have originated from user input. Prefer `textContent` over `innerHTML` for simple text, but when template literals are necessary for complex HTML structures, ensure every interpolated variable is escaped.

## 2025-05-15 - Hardening escapeHTML and Numeric Stats
**Vulnerability:** The `escapeHTML` utility used `if (!str) return ''`, which caused the number `0` (a valid statistic) to be rendered as an empty string. Additionally, statistics like `totalStars` were vulnerable to string-concatenation-based XSS if the `localStorage` value was a malicious string.

**Learning:** Sanitization utilities must distinguish between truly missing values (`null`/`undefined`) and valid falsy values like `0`. When performing arithmetic on untrusted data, explicit numeric coercion (e.g., `Number(val) || 0`) is required before any DOM injection to prevent `NaN` propagation or string-based injection.

**Prevention:** Use `str === null || str === undefined` checks in sanitization helpers. Always wrap untrusted numeric inputs in `Number()` and provide a fallback before adding them to totals or rendering them.
