## 2025-05-14 - Stored XSS via localStorage Sync Data
**Vulnerability:** User-controlled data (student names, avatars, and garden words) fetched from `localStorage` (which mirrors cloud sync data) was injected into the DOM using `.innerHTML` without sanitization. This allowed persistent execution of malicious scripts (Stored XSS) every time the Teacher Dashboard or Garden screen was viewed.

**Learning:** The application follows an "offline-first" sync pattern where classroom data is often sourced from local storage. Because this data is intended to be "synced" from other users (students), it must be treated as untrusted, even if it appears to be "local."

**Prevention:** Always use a sanitization utility like `escapeHTML` when rendering strings that could have originated from user input. Prefer `textContent` over `innerHTML` for simple text, but when template literals are necessary for complex HTML structures, ensure every interpolated variable is escaped.

## 2025-05-15 - Falsy Bypasses in Sanitization Utilities
**Vulnerability:** The `escapeHTML` utility used for XSS prevention had a flaw where it returned an empty string for the numeric input `0` (due to `!str` check). This caused legitimate numeric data (like a score of 0 or level 0) to be swallowed or omitted from the UI, while also highlighting how "smart" sanitizers can introduce logic bugs if they don't explicitly handle valid falsy values.

**Learning:** When writing security utilities, avoid broad falsy checks (`if (!val)`) if the data type could legitimately be `0`. Security and data integrity are linked; if a security fix breaks data rendering, developers are tempted to bypass it.

**Prevention:** Use explicit checks (e.g., `str === null || str === undefined`) or ensure that `0` is handled as a valid value before returning a default. In this codebase, the fix was to check `if (str === 0) return "0";` at the start of the utility.
