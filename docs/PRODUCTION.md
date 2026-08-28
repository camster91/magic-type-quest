# Production deployment

BloomType is hosted at `https://bloomtype.ashbi.ca/magic-type-quest/` on the
Ashbi VPS. The checked-in production definitions are:

- `deploy/docker-compose.production.yml` — the application container, bound to
  loopback port 3055.
- `deploy/traefik-bloomtype.yml` — HTTPS routing and security headers.

Do not execute a release until the applicable approval and evidence fields in
`docs/LAUNCH-READINESS.md` are complete.

## Deploy

After the `Build and Push Image` workflow succeeds, copy the definitions to the
VPS and apply them:

```sh
scp deploy/docker-compose.production.yml root@vps.ashbi.ca:/opt/bloomtype/docker-compose.yml
scp deploy/traefik-bloomtype.yml root@vps.ashbi.ca:/opt/traefik/dynamic/bloomtype.yml
ssh root@vps.ashbi.ca 'cd /opt/bloomtype && docker compose up -d --pull always'
```

Traefik watches its dynamic directory, so the route does not require a proxy
restart. Verify TLS and then run the browser suite against production:

```sh
curl --fail --silent --show-error --location --head \
  https://bloomtype.ashbi.ca/magic-type-quest/
PLAYWRIGHT_BASE_URL=https://bloomtype.ashbi.ca/magic-type-quest/ \
  npx playwright test
```

## Roll back

Immutable images are also tagged with the seven-character commit SHA. Replace
`main` in `/opt/bloomtype/docker-compose.yml` with the last known-good tag, then
run:

```sh
cd /opt/bloomtype
docker compose up -d --pull always
```

Confirm the image and health with `docker compose ps` and rerun the production
browser suite. Removing `/opt/traefik/dynamic/bloomtype.yml` disables public
routing without deleting the application container.
