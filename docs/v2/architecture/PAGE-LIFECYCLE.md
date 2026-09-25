# Page lifetime and history return (#165)

Scope: v2 preview only, under the existing Phaser/DOM/local-first ADR. This is a
correctness repair, not a claim of browser-cache eligibility or offline readiness.

The prior entry disposed its shell on every pagehide using a once-only listener.
For a retained back/forward-cache document this cleared the root that the browser
could later restore, with no new entry execution to mount it again.

`bindPageDisposal` keeps the same shell when `pagehide.persisted === true`.
It does not mount another shell, recreate a learner, replay an encounter, reload
the page, reopen a database, or change history. A final non-persisted pagehide
still removes the listener and invokes existing shell disposal exactly once.
Explicit disposal has the same idempotent behaviour. A cached departure must
not consume the final-exit listener, so the binding is intentionally not once-only.

This follows the distinction in the official [pagehide documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event)
and [pageshow documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event).
The browser may retain a document with its DOM and JavaScript heap, pause its
tasks and later resume it. A persisted pagehide indicates intent, not a guarantee
of caching; the browser may instead discard that document. See the
[browser-cache lifecycle guidance](https://web.dev/articles/bfcache).

Only one existing shell is retained for that document. The browser controls cache
admission, freezing and eviction. Existing visibility handling remains responsible
for game/audio visibility. This change adds no unload/beforeunload handler, browser
policy override, network request, analytics, asset prefetch, or new cloud operation.
It does not turn the history cache into a service-worker/offline cache.

## Data and limitations

The persistence implementation is unchanged. The repository's encounter transaction
continues to validate the profile and idempotency before writing; its existing
versionchange handler closes the connection. This repair does not attempt to
optimise IndexedDB connection handling for cache admission or add cross-tab state
reconciliation. Some browsers may decline caching because of open connections or
in-flight operations. Actual browser eligibility and storage resumption must be
recorded, not inferred from the synthetic event tests.

Retaining a document avoids introducing a second overlapping profile initialization.
No source file in persistence, curriculum, mastery, settings or v1 is modified.
Existing save/reload, import, reset, corruption recovery and local-only gates remain
required. Evicted-document/offline return remains #176/#167 work, not a pass here.

## Evidence and rollback

See [the page-return evidence](../evidence/165-page-return-2026-09-25.md).
The browser tests distinguish injected persisted events from real history
navigation. Native Back records whether pageshow actually reported a cached return;
a reload path is not presented as proof that native cache restoration ran.

Revert the page-return commit to restore its parent. The separate global-event
ownership fix remains intact. No learner data should be cleared during rollback.
