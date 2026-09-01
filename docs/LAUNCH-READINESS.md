# Launch readiness control

Status: **public local-only release verified; school launch not approved**

Last reconciled: **2026-09-01** against released revision `1091e0d`

This is the operating register for moving BloomType from a technically verified
candidate to an approved, supervised school pilot. `ROADMAP.md` remains the
priority source; this document defines the evidence and owner actions required
to close its launch gates. Blank evidence or ownership means the gate fails.

## Evidence snapshot

| Control | State | Current evidence |
|---|---|---|
| Local and remote quality gates | Verified | 272 unit tests across 34 files, 17 Playwright journeys including five rendered WCAG A/AA scans and two enlarged French/Spanish layout checks, ESLint, Vite build, local-only artifact verification, and zero-vulnerability audit |
| Ashbi CI | Verified | [CI run 33507519787](https://github.com/camster91/magic-type-quest/actions/runs/33507519787) passed exact candidate `8520de2`; runner `ashbi-vps-magic-type-quest`; protected `main` strictly requires the GitHub Actions `ci` context |
| Candidate container | Verified, not released | [Image run 33507519949](https://github.com/camster91/magic-type-quest/actions/runs/33507519949), tag `main-8520de2`, index digest `sha256:7ec57e26f169bc57d246ffec67f437aa7c79dc1ad829c7244be14e28e728e3d9`; see `docs/releases/2026-09-01-8520de2-candidate.md` |
| Repository housekeeping | Verified | [Stale Issues run 33500055154](https://github.com/camster91/magic-type-quest/actions/runs/33500055154) passed on GitHub-hosted Ubuntu 24.04; no third-party housekeeping action ran on Ashbi |
| Production operation and rollback | Verified | `docs/releases/2026-09-01-1091e0d.md`; previous `5d00b77` image and server definitions retained |
| Repository security | Source fixed; external closure pending | Four validated findings fixed at `ee9d5f2`; unused analytics RPCs retired; GitHub enforces full-SHA workflow action references; the removed Google credential still requires provider-side revocation or rotation |
| Cloud privacy boundary | Implemented, not approved | `docs/PRIVACY-OPERATIONS.md`; production cloud variables remain unset |
| Real-user evidence | Missing | No consented school pilot, retention result, or classroom usability evidence |

## Gate register

| Gate | Acceptance evidence | Owner | State |
|---|---|---|---|
| Privacy and school approval | Every activation row in `PRIVACY-OPERATIONS.md` has an owner, approval date, evidence, and approved result | Product owner + participating school | Not approved |
| Production Supabase | Approved region/project, applied schema revision, MFA/recovery evidence, and no committed secret | Product owner | Not provisioned |
| Exposed provider credential | Complete `GOOGLE-KEY-INCIDENT.md`: provider evidence proves the removed Google key is deleted, exposure-window usage is reviewed, replacement restrictions are recorded if applicable, and no replacement secret is committed | Product owner | Playbook ready; provider action not started |
| Account isolation | Separate teacher/student accounts prove cross-class denial plus approved export/deletion paths | Product owner + QA operator | Source export/deletion paths verified; live drill not run |
| Physical-device accessibility | Named iOS Safari and Android Chrome devices complete the touch-keyboard, screen-reader, install, update, offline, and recovery protocol in `DEVICE-ACCESSIBILITY-QA.md` | Accessibility reviewer | Protocol ready; human runs not started |
| Language review | Fluent French and Spanish reviewers separately complete `LANGUAGE-QA.md`, close Critical/Major findings, and sign the learner, parent, and teacher journeys | Language reviewers | Protocol ready; human reviews not started |
| Supervised pilot | Approved protocol below, consented cohort, completed observation log, and pass/stop decision | School pilot lead | Not run |
| Public local-only release approval | Named approver records candidate SHA, evidence, rollback tag, decision, and date | Product owner | Approved 2026-09-01 for `1091e0d` |

## Access register

| Capability | Availability | Required action | Risk / approval |
|---|---|---|---|
| Repository and GitHub Actions | Available | Maintain repository-scoped Ashbi runner | Docker access is privileged; do not run untrusted forks |
| GHCR candidate images | Available | Record immutable SHA before any release | Production release needs explicit approval |
| Google Cloud credential administration | Unavailable | Assign an authorized administrator and execute `GOOGLE-KEY-INCIDENT.md` | Potential quota/billing exposure remains until closed |
| Ashbi production host | Operator-controlled | Use `PRODUCTION.md` only after approval | Customer-visible and reversible by prior image tag |
| Supabase production project | Unavailable | Provision only after privacy owners approve region and controls | May contain student data; approval required |
| Teacher/student test accounts | Unavailable | Create isolated non-student QA accounts after Supabase approval | Credentials must not enter the repository or logs |
| Physical iOS/Android devices | Unconfirmed | Assign devices and reviewers, then execute `DEVICE-ACCESSIBILITY-QA.md` | Human accessibility evidence required |
| Fluent French/Spanish review | Unassigned | Assign named reviewers, select intended locales, and execute `LANGUAGE-QA.md` | Human-language quality cannot be inferred from parity tests |
| Pilot cohort and school contact | Unassigned | Recruit through an approved, consented school process | External communication and consent require owner approval |

## Proposed supervised-pilot protocol

These thresholds are **proposed for owner and school approval**, not validated
customer results. The pilot must remain local-only unless the privacy and cloud
gates are separately approved.

- Cohort: 5–12 consented learners in the intended age range, one teacher or
  facilitator, two supervised sessions per week for two weeks.
- Devices: at least one school-managed laptop or Chromebook plus one supported
  touch device; record browser, OS, input method, and assistive technology.
- Data handling: use learner aliases, collect only the manual measures below,
  store the worksheet where the school approves, and delete it on the approved
  schedule. Do not add product analytics for the pilot.
- Session script: discovery, first start, tutorial, first completed lesson,
  pause/recovery, Daily Moment, local progress return, teacher review/export,
  and local deletion.

Proposed go criteria:

| Measure | Definition and source | Proposed threshold |
|---|---|---|
| First-session activation | Learner completes tutorial and one lesson; facilitator observation | At least 80% without task takeover |
| Typing accuracy | Correct keystrokes / total keystrokes from local result/export | Cohort median at least 85% after onboarding |
| Return | Learner starts a second supervised session | At least 70% |
| Teacher setup | Time from opening dashboard to usable class/export | Median under 10 minutes |
| Support burden | Facilitator interventions that take over a task | No more than 1 per learner-session median |
| Accessibility | Critical task completion on assigned assistive/device paths | 100%; no unresolved critical barrier |
| Safety and privacy | Exposure, cross-account access, unapproved collection, or loss | Zero incidents |

Stop immediately for exposed student data, access outside the intended class,
loss of recorded progress affecting multiple learners, an unresolved critical
accessibility barrier, learner distress, or a school/guardian withdrawal. A
stop result is evidence to repair the product or process, not a failed learner.

## Release decision record

Before any production change, copy this checklist into a dated release record:

- Candidate commit and immutable image digest:
- Included scope and acceptance criteria:
- CI and image workflow links:
- Privacy/security review result:
- Accessibility/device result:
- Migration or data impact:
- Monitoring and support owner:
- Rollback image tag and operator:
- Approver, decision, and timestamp:
- Post-release verification result:

Until every applicable field is complete, the candidate may be **implemented**
and **verified**, but it is not **released**, **school-approved**, or
**customer-validated**.
