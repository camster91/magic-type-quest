# Bloomtype on Coolify

Create a private GitHub application from `camster91/magic-type-quest`, branch
`main`, with Docker Compose at `/deploy/coolify.yml`. The image still uses the
existing Dockerfile and its `/healthz` check.

During migration, set `BLOOMTYPE_LOCAL_PORT=13055` and verify the candidate before
stopping the standalone container. At cutover, use port 3055, preserving the
existing shared HTTPS proxy destination for `bloomtype.ashbi.ca`. Do not change
the shared proxy, open public ports or activate cloud providers.

There is no mounted server database or upload volume. Local browser progress
stays on the same public origin. Retain the previous image and private runtime
configuration before cutover. Enable signed GitHub `push` deployment for `main`
after health and public HTTPS verification. To roll back, stop the Coolify app
and restart the retained original container; keep the original source directory.
