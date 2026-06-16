## 2025-05-14 - Stored XSS via localStorage Sync Data
**Vulnerability:** User-controlled data (student names, avatars, and garden words) fetched from `localStorage` (which mirrors cloud sync data) was injected into the DOM using `.innerHTML` without sanitization. This allowed persistent execution of malicious scripts (Stored XSS) every time the Teacher Dashboard or Garden screen was viewed.

**Learning:** The application follows an "offline-first" sync pattern where classroom data is often sourced from local storage. Because this data is intended to be "synced" from other users (students), it must be treated as untrusted, even if it appears to be "local."

**Prevention:** Always use a sanitization utility like `escapeHTML` when rendering strings that could have originated from user input. Prefer `textContent` over `innerHTML` for simple text, but when template literals are necessary for complex HTML structures, ensure every interpolated variable is escaped.

## 2025-05-15 - CSV Injection in Data Exports
**Vulnerability:** User-provided data (student names) containing spreadsheet formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) was exported directly to CSV files without sanitization. This allowed for potential Formula Injection attacks when the CSV was opened in spreadsheet software like Excel.

**Learning:** Data exported from a web application to a CSV format must be sanitized specifically for that format. Standard HTML escaping is insufficient for CSVs, which have their own injection vectors (formulas).

**Prevention:** Sanitize every field in a CSV export by prepending a single quote (`'`) to any string starting with formula trigger characters. Additionally, ensure proper CSV structure by escaping double quotes (doubling them) and wrapping fields containing delimiters in double quotes.
