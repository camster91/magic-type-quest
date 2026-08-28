# Ashbi VPS CI runner

BloomType CI runs on the repository-scoped self-hosted runner
`ashbi-vps-magic-type-quest` at `vps.ashbi.ca`.

## Runner configuration

- GitHub labels: `self-hosted`, `Linux`, `X64`, `ashbi-vps`,
  `magic-type-quest`
- Host service user: `magicci`
- Runner directory: `/opt/actions-runner`
- Work directory: `/opt/actions-runner/_work`
- systemd service:
  `actions.runner.camster91-magic-type-quest.ashbi-vps-magic-type-quest.service`
- CI container: `mcr.microsoft.com/playwright:v1.62.0-noble`, pinned by digest
  in the workflow

The runner user is intentionally separate from application services. It belongs
to the host's `docker` group so GitHub Actions can create the fixed Playwright
job container. Docker-group access is root-equivalent, so this runner must stay
repository-scoped and must not execute untrusted fork pull requests.

The CI workflow enforces that boundary with a job condition: pushes run, and
pull requests run only when their head repository is this repository. Keep that
condition in place whenever editing `.github/workflows/ci.yml`.

## Routine checks

Run these on the VPS as an administrator:

```bash
systemctl status actions.runner.camster91-magic-type-quest.ashbi-vps-magic-type-quest.service
journalctl -u actions.runner.camster91-magic-type-quest.ashbi-vps-magic-type-quest.service -n 100
docker image inspect mcr.microsoft.com/playwright:v1.62.0-noble
```

The runner can also be checked from an authenticated workstation:

```bash
gh api repos/camster91/magic-type-quest/actions/runners \
  --jq '.runners[] | {name,status,busy,labels:[.labels[].name]}'
```

## Upgrades

GitHub normally self-updates the runner. If a manual reinstall is necessary,
download the current Linux x64 runner from the official `actions/runner`
release, verify its published SHA-256 digest, stop the service, and replace the
runner files without deleting `.runner`, `.credentials`, or `_work`.

The VPS has `/opt/package.json` configured for ES modules. The runner therefore
requires `/opt/actions-runner/package.json` with `"type": "commonjs"`; preserve
that file during upgrades or the systemd service will fail at startup.

Update the Playwright container tag together with the `playwright` and
`@playwright/test` package versions so browser binaries and the test library
remain compatible.

## Removal

Removal is intentionally an operator action. Stop and uninstall the systemd
service, obtain a short-lived removal token from GitHub, run `config.sh remove`
as `magicci`, and only then remove `/opt/actions-runner`. Do not delete the
directory while a job is active.
