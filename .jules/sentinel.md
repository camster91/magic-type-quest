# Sentinel's Journal - Critical Security Learnings

## 2026-05-30 - [Stored XSS via LocalStorage-to-DOM Injection]
**Vulnerability:** Stored XSS in Teacher Dashboard.
**Learning:** User-provided data stored in `localStorage` (like student names or avatars) was being injected directly into the DOM using `innerHTML` without sanitization. This is a common pattern in "offline-first" apps that trust local data too much.
**Prevention:** Always use `textContent` for dynamic text or apply robust HTML escaping before using `innerHTML`. Never trust data just because it came from the user's own `localStorage`.

## 2026-05-30 - [Vitest and JSDOM Environment Guarding]
**Vulnerability:** N/A (Build/Test failure during security fix)
**Learning:** Adding unit tests for frontend security utilities can fail if those utilities are in files with top-level DOM dependencies. `ReferenceError: document is not defined` occurred during Vitest execution.
**Prevention:** Guard side-effect-heavy code like `document.addEventListener` with `if (typeof document !== 'undefined')` or isolate pure logic (like `escapeHTML`) from DOM-binding code to ensure safe testability.
