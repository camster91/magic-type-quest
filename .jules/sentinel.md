# 🛡️ Sentinel's Journal: Critical Security Learnings

## 2025-05-23 - Stored XSS via Offline-First Sync
**Vulnerability:** Stored Cross-Site Scripting (XSS) via `localStorage` data sync.
**Learning:** The application's "offline-first" sync pattern mirrored `localStorage` data to a shared cloud database (Supabase). This created a vulnerability where data from one user's `localStorage` (like student names or garden words) could be rendered unescaped in another user's view (like the Teacher Dashboard), leading to Stored XSS. `localStorage` should always be treated as untrusted user input.
**Prevention:** Use the shared `escapeHTML` utility in `src/utils.js` for all user-provided data rendered via `innerHTML`. For numeric statistics, cast values to `Number` to prevent malicious string injection in aggregations.
