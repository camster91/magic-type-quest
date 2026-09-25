# Local asset and world lifecycle addendum (#165)

Scope: PR #199 on the isolated v2 issue branch. This supplements
[ADR-001](ADR-001-browser-game-stack.md); it does not change the approved stack
or authorize production promotion. Full browser acceptance is still pending.

## Local Blob decoding policy

The approved pack loader fetches same-origin, manifest-selected assets, then owns
Blob URLs for the current/core resources. Phaser subsequently reads those URLs
through its existing image/SVG loading paths. The v2 HTML document now explicitly
allows `blob:` in `img-src` and `connect-src` for this established architecture.
The change applies only to `v2/index.html`, not v1 or a production route switch.

`default-src`, `script-src`, `style-src`, and `font-src` remain `'self'`.
No external host, wildcard, unsafe-inline or unsafe-eval source is added. Existing
image `data:` support remains. This is the application's document policy; no
browser-managed, operating-system, account or environment policy is modified.
Runtime asset selection still requires approved provenance/licence. No arbitrary
asset upload or URL input is introduced.

The CSP scheme matching rationale is described in the
[W3C CSP Level 3 working draft](https://www.w3.org/TR/CSP3/).
The encoded document-policy tests verify the exact directives, not browser
execution. The real Blob/SVG and failure paths are covered by newly authored
Playwright tests, which must pass in a permitted browser before acceptance.

## Required texture readiness and ownership

A loader queue finishing is not proof that every image was successfully decoded.
`BootScene.create` checks all supplied required resource IDs in the Texture
Manager before notifying the DOM shell. Failure uses a typed error callback;
the shell suspends input, disconnects its resize observer, detaches the failed
world, releases its biome resources and exposes its existing recovery control.
It does not save an encounter or pretend the mission started successfully.

The scene registers shutdown and destroy cleanup during preload, not after
create. Already-present textures are borrowed and are neither requeued nor
removed by this scene. Keys newly queued by the scene are owned and removed on
shutdown or destruction if present. Cue tweens and scene graphics are released;
only the pack loader revokes its Blob URLs. Scene reuse resets readiness for
each cycle, without transferring learner progress into the scene.

Readiness/failure handling in the shell is deferred to a microtask after the
engine callback and checked against the current visit token. An old cancelled
load cannot mount a new world or enable typing. A load completing while a modal
is open keeps input suspended and restores the modal's focus rather than
starting typing behind the dialog.

## Deferred Game destruction

The exact pinned upstream source documents that
[`Game.destroy`](https://github.com/phaserjs/phaser/blob/v4.2.1/src/core/Game.js)
sets a flag consumed on the next game step.
[`TimeStep.wake`](https://github.com/phaserjs/phaser/blob/v4.2.1/src/core/TimeStep.js)
can synchronously tick a started sleeping loop. The DOM boundary therefore
requests destruction first, then wakes only a started, sleeping loop. It does
not call the private `runDestroy` method or start an unbooted loop prematurely.
An already-running loop handles its normal next step. An unstarted game retains
the destruction request for its normal boot. Repeat disposal is idempotent.

`noReturn` remains false so another shell may be created on the page. The test
must observe the actual Game `destroy` event before claiming engine teardown;
calling `destroy` or removing a canvas is not sufficient evidence.

## Remaining upstream and browser constraints

The pinned upstream
[`VisibilityHandler`](https://github.com/phaserjs/phaser/blob/v4.2.1/src/core/VisibilityHandler.js)
registers a document visibility listener and assigns window focus/blur handlers
without a matching cleanup in that function. This continuation does not claim
to remove that upstream global retention or fully certify repeated whole-shell
mount/unmount. It does not monkey-patch browser globals or fork Phaser. One Game
per live shell still bounds ordinary home/scene visits; actual global listener
and final-disposal evidence remains an acceptance item, not a passed check.

The new source-mode browser suite inspects actual scene textures, resize/lifecycle
listeners, tweens and the pinned Clock's three timer queues over five visits.
Its private queue inspection is test-only and fails if the engine contract
changes instead of substituting zero. It also verifies image failure, cancelled
module loads and modal focus. Existing production-preview performance, axe,
persistence, v1 and local-only build gates remain required and unchanged.

## Rollback and data impact

Revert the runtime continuation commit on the issue branch to restore its parent.
Revert the separate scoped CI trigger commit independently if needed. Neither
change performs learner-data conversion, deletion, cloud access or a production
operation. Old learner stores and v1 routes are preserved. Do not close #165 or
merge its draft PR from isolated tests alone.
