# Ashbi VPS CI runner

BloomType CI runs on the repository-scoped self-hosted runner
`ashbi-vps-magic-type-quest` at `vps.ashbi.ca`.

## Runner configuration

- GitHub labels: `self-hosted`, `Linux`, `X64`, `ashbi-vps`,
  `magic-type-quest`
- Host service user: `magicci`
- Host service UID/GID: `986:986` (also used by the CI job container)
- Runner directory: `/opt/actions-runner`
- Work directory: `/opt/actions-runner/_work`
- systemd service:
  `actions.runner.camster91-magic-type-quest.ashbi-vps-magic-type-quest.service`
- CI container: `mcr.microsoft.com/playwright:v1.63.0-noble`, pinned by digest
  in the workflow

The runner user is intentionally separate from application services. It belongs
to the host's `docker` group so GitHub Actions can create the fixed Playwright
job container. Docker-group access is root-equivalent, so this runner must stay
repository-scoped and must not execute untrusted fork pull requests.

Pull request code never runs on this runner. `ci.yml` sends `pull_request` jobs
to GitHub-hosted `ubuntu-latest` runners (free for this public repository) and
uses the VPS runner only for pushes to `main`, which a maintainer has already
merged. `build-and-push.yml` runs only on pushes to `main` and version tags.

A workflow file in a pull request can be edited by that pull request, including
from a fork, so the job routing alone cannot stop a malicious fork from asking
for the VPS labels. The repository must therefore also keep this setting:

- **Settings → Actions → General → Approval for running fork pull request
  workflows from contributors: "Require approval for all external
  contributors".** A maintainer then reads every outside pull request's diff,
  including any workflow changes, before any of its jobs run.

Keep both the job routing and that setting whenever editing
`.github/workflows/ci.yml` or `.github/workflows/build-and-push.yml`.

The image publishing workflow also runs directly on this runner and uses its
Docker daemon to build the multi-architecture GHCR image. Stale-issue and
labeled auto-merge maintenance jobs run on GitHub-hosted `ubuntu-latest`, so
third-party maintenance actions do not execute on the privileged VPS. Core CI
remains isolated inside the digest-pinned Playwright container.

## Routine checks

Run these on the VPS as an administrator:

```bash
systemctl status actions.runner.camster91-magic-type-quest.ashbi-vps-magic-type-quest.service
journalctl -u actions.runner.camster91-magic-type-quest.ashbi-vps-magic-type-quest.service -n 100
docker image inspect mcr.microsoft.com/playwright:v1.63.0-noble
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

The CI container must run with `--user 986:986`. Running it as container root
leaves the shared `_work` checkout root-owned and prevents the following
host-level image workflow from cleaning or checking out the repository.

## Removal

Removal is intentionally an operator action. Stop and uninstall the systemd
service, obtain a short-lived removal token from GitHub, run `config.sh remove`
as `magicci`, and only then remove `/opt/actions-runner`. Do not delete the
directory while a job is active.
