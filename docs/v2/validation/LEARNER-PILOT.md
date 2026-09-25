# Nature Quest v2 supervised learner pilot

Status: **DRAFT PREPARATION — NOT APPROVED, NOT RUN**.
No participants, observations, measurements, or decision are represented by this packet.

## Authority and scope

Specification: [#186](https://github.com/camster91/magic-type-quest/issues/186), under
[#153](https://github.com/camster91/magic-type-quest/issues/153). Required candidate evidence:
[#167 Meadow](https://github.com/camster91/magic-type-quest/issues/167),
[#174 accessibility](https://github.com/camster91/magic-type-quest/issues/174), and
[#177 quality](https://github.com/camster91/magic-type-quest/issues/177).

This is a small product/usability check, not a clinical study, effectiveness study,
representative survey, or evidence for marketing claims. Preparation does not close
#186. Actual learner observations and a dated authorized decision are still required.

Retain [privacy operations](../../PRIVACY-OPERATIONS.md),
[launch readiness](../../LAUNCH-READINESS.md), and
[physical-device QA](../../DEVICE-ACCESSIBILITY-QA.md). Their historical v1 results
are not v2 evidence. The legacy [#136](https://github.com/camster91/magic-type-quest/issues/136)
two-week pilot remains separate; this packet neither changes its cadence nor closes it.

## Readiness before any participation

Every row must have an actual owner, dated approval and evidence in the approved
private evidence location. Blank or unrecorded means blocked. An implementation
agent may prepare this packet but may not recruit, contact families/schools, approve
consent, conduct sessions, or supply an approval on someone's behalf.

| Gate | Current state | Evidence to obtain |
| --- | --- | --- |
| Product owner and pilot lead assigned | UNRECORDED | Responsible adults and scope |
| Setting-specific privacy/consent process approved | NOT APPROVED | Owner/privacy lead approval; guardian/school requirements as applicable |
| Individual participation permitted | UNRECORDED | Consent and the child's willingness checked privately before each session |
| Data handling approved | NOT APPROVED | Allowed fields, access, private location, retention/deletion date, incident owner |
| Exact candidate approved for supervised use | UNRECORDED | Full commit SHA, lockfile identity, pack versions, candidate URL and rollback target |
| #167 engineering slice evidence | NOT VERIFIED | Three missions, restoration, discoveries, save/reload, offline and performance evidence |
| #174 critical paths | NOT VERIFIED | Applicable automated and actual device/assistive-technology evidence |
| #177 candidate quality evidence | NOT VERIFIED | Exact-head checks and unresolved-blocker review |
| Pilot protocol and proposed metric definitions | NOT APPROVED | Dated owner approval, including cohort, accommodations and return-session plan |

The #167 engineering evidence permits consideration of a pilot; its learner
validation requirement is fulfilled only through actual #186 evidence, not a
circular claim that both issues are already complete. Missing engineering or
critical safety/access evidence prevents participant sessions.

Any candidate change must be identified and re-reviewed. Do not silently pool
results across different builds. Approving a pilot is not approving deployment,
production cloud, a public-route switch, or later-biome expansion.

## Cohort and environment proposal

Subject to owner approval: 5–12 learners, approximately ages 6–10, with a mix of
typing familiarity where practical, in supervised sessions. Do not use the agent
to locate or contact participants. The authorized pilot lead controls recruitment.

Use local-only play on the exact approved candidate. Record device model (not
serial number), OS/browser versions, physical/touch input, locale, network condition,
text size, motion settings, and relevant assistive-technology configuration.
Do not ask for diagnoses or other unnecessary personal details.

Use a dedicated approved browser profile and learner alias. Do not clear an
existing learner's data or unrelated v1 storage to obtain a clean start. A return
session uses the same approved local profile unless recovery itself is being
observed and documented. Never enable production cloud or add telemetry for this pilot.

## Data and recording boundary

This repository is public. It may contain these blank templates and an explicitly
reviewed, de-identified aggregate summary, not completed per-child forms, aliases
linked to a roster, consent documents, raw exports, screenshots containing names,
contact details, precise locations, school identifiers, audio, or video of children.

Store completed observation forms only in the owner-approved private location.
Use an alias there, keep any identity mapping separately, and retain/delete it on
the approved schedule. An alias does not make a record safe for public posting.
No recording is authorized by this packet. Recording or testimonials require
separate explicit approval and the appropriate consent. Collect manual measures
only; do not collect raw typing transcripts or free-form child content in the app.

## Session 1 script

Before the session, confirm private participation authorization and willingness,
verify the candidate, and open a blank copy of [the observation form](OBSERVATION-FORM.md).
Explain neutrally: “We are trying the game, not testing you. You can pause or stop.”
Do not coach task answers. Give necessary safety/access support immediately and
record it; never withhold accommodation to improve a metric.

| Step | Observe | Record |
| --- | --- | --- |
| 1 | Open the approved browser URL | Launch and interactive-ready timing, errors |
| 2 | Identify what to do | First intended action, confusion, help |
| 3 | Reach the first meaningful key | Time from interactive readiness, source of feedback |
| 4 | Use finger guidance | Learner's understanding and any UI-caused confusion |
| 5 | Complete onboarding and Mission A | Independent/assisted/incomplete/blocked; local result aggregates |
| 6 | Recover from an ordinary typing error, if one occurs | Retry understanding, feedback, task takeovers; otherwise not observed |
| 7 | Understand the habitat change | Observed action, neutral description, cause/effect understanding |
| 8 | Find and understand the first discovery, if reached | Observed/not reached; no assumed success |
| 9 | Pause, resume or finish | Keyboard/focus behaviour and voluntary choice |
| 10 | Describe the game in their own words | Optional private quote, not a facilitator paraphrase presented as a quote |

Do not introduce an unapproved key just to provoke an error or obtain a data point.
A normal mistake is not a safety incident or a failed learner. No lives, punishments,
forced repeat, or pressure to continue may be added for testing.

Use neutral prompts only as needed: “What do you think you're supposed to do?”,
“What changed?”, “What would you do next?”, “Was anything confusing?”, and
“What part did you like using?” Record the prompt and whether it changed task support.
Do not ask leading questions such as whether the learner loved a particular feature.

## Session 2 / return

When another approved session is feasible, reuse the recorded candidate and local
profile. Observe reopening/resuming, recognition of Continue, retained understanding,
the next mission/review, and voluntary continue/finish choice. Record actual return
opportunity, attendance and starting separately; an unavailable session is not a
successful return. Record voluntary withdrawal without pressure or unnecessary detail.

Do not invent a session date, send invitations, or substitute an automated browser
run for a supervised return. Scope and scheduling require the authorized pilot lead.

## Measures and decision rules

Use the definitions and blank table in [the decision record](DECISION-RECORD.md).
Approve them before collection; log any later change and do not rewrite gates to
fit observations. Keep physical and touch results identifiable as different input
paths. Touch practice must not be presented as evidence of physical-key mastery.

Record observed fact, learner quote, facilitator interpretation and proposed
product change in separate columns. Record task takeovers separately from normal
access setup/accommodation. Preserve real product-caused failures in the summary;
missing observations remain missing, not zero or pass. Link findings to concrete
issues, with severity, owner, fix commit, and retest evidence when available.

## Stop and response

Stop the session for learner distress, guardian/school withdrawal, a privacy
incident, an inaccessible critical path, serious data loss, or repeated product-caused
input failure. Respect any request to stop. Do not repeatedly retry with the child
to obtain a passing result. Stop further use of the affected candidate, notify the
assigned incident/pilot owner through the approved private process, and record the
minimum necessary facts. Public issues must contain sanitized reproduction details,
not child data. Resumption requires owner review, a fix where needed, and approved
retest; a synthetic technical retest is not proof of learner comprehension.

A completed human review concludes with exactly one of **GO**, **REPAIR**, or **HOLD**.
Before that review the status is **NOT RUN / NO DECISION**, not an implied HOLD
finding and never an automatic GO. Threshold success cannot override a safety,
privacy or critical accessibility blocker. A #186 GO informs but does not itself
supply #178's explicit expansion decision or #187's production authorization.
