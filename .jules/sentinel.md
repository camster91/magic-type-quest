## 2025-05-14 - Stored XSS via localStorage Sync Data
**Vulnerability:** User-controlled data (student names, avatars, and garden words) fetched from `localStorage` (which mirrors cloud sync data) was injected into the DOM using `.innerHTML` without sanitization. This allowed persistent execution of malicious scripts (Stored XSS) every time the Teacher Dashboard or Garden screen was viewed.

**Learning:** The application follows an "offline-first" sync pattern where classroom data is often sourced from local storage. Because this data is intended to be "synced" from other users (students), it must be treated as untrusted, even if it appears to be "local."

**Prevention:** Always use a sanitization utility like `escapeHTML` when rendering strings that could have originated from user input. Prefer `textContent` over `innerHTML` for simple text, but when template literals are necessary for complex HTML structures, ensure every interpolated variable is escaped.

## 2025-05-15 - Stored XSS via "Numeric" Sync Fields
**Vulnerability:** Statistical fields (stars, words typed, level) sourced from `localStorage` or cloud sync were assumed to be safe numbers and injected into `innerHTML`. However, these fields are strings in storage and can be manipulated to contain malicious script tags.

**Learning:** Data types in serialized storage (JSON/localStorage) do not guarantee safety. Even if a field is logically a number, it must be treated as a string and escaped if rendered via `innerHTML`.

**Prevention:** Apply `escapeHTML()` to all interpolated variables in template literals used with `innerHTML`, regardless of their expected data type.
