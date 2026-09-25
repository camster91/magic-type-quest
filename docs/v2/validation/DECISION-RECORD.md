# Blank cohort summary and human decision

Status: **NOT RUN / NO DECISION**. This is a template, not a result or approval.
Follow [the protocol](LEARNER-PILOT.md). Store private evidence separately. A public
summary needs explicit privacy review; a small cohort can remain identifiable
from combinations of attributes even without names.

## Candidate and authorization

| Field | Value |
| --- | --- |
| Full candidate SHA / lockfile identity / asset pack versions | UNRECORDED |
| Approved candidate URL / environment / rollback target | UNRECORDED |
| Protocol version / pre-collection approval reference | UNRECORDED |
| #167 / #174 / #177 evidence references | UNRECORDED |
| Authorized pilot lead / product owner / privacy reviewer | UNRECORDED |
| Collection window and input/device paths | UNRECORDED |
| Consent and data-handling approval references (private) | UNRECORDED |
| Actual learner/session counts and missing-data reasons | UNRECORDED |
| Private observation evidence location and retention owner | UNRECORDED |

## Proposed metric definitions

These implement #186's proposed gates; owner approval is still required. State
numerators, denominators, missing values and candidate versions. Do not pool
incompatible builds or claim representativeness, efficacy, or general learning gains.

| Metric | Definition | Proposed gate | Actual numerator / denominator or sample size | Actual result | Outcome |
| --- | --- | --- | --- | --- | --- |
| Independent activation | Session-1 learners who finish onboarding + Mission A without facilitator task takeover / all learners who started Session 1 | >=80% | UNRECORDED | UNRECORDED | NOT RUN |
| First meaningful key | Per learner, elapsed seconds from interactive shell readiness to first accepted curriculum-permitted practice key that produces intended game feedback; URL-to-ready tracked separately | Median <=20 seconds | UNRECORDED | UNRECORDED | NOT RUN |
| Post-onboarding accuracy | Per learner, scored correct attempts / all scored attempts in the approved post-onboarding window, then cohort median; unscored teaching excluded, input source retained | Median >=85% | UNRECORDED | UNRECORDED | NOT RUN |
| Supervised return | Learners actually starting/attempting Session 2 / Session-1 learners offered a feasible, approved second-session opportunity | >=70% when return testing is available | UNRECORDED | UNRECORDED | NOT RUN |
| Facilitator task takeover | Count continuous episodes where facilitator performs/directs the learner's task beyond approved neutral/access support; median across learner-sessions | Median <=1 | UNRECORDED | UNRECORDED | NOT RUN |
| Critical accessibility tasks | Successfully completed assigned critical paths / all assigned critical paths; record any blocked/unperformed path, device and assistive technology | 100% | UNRECORDED | UNRECORDED | NOT RUN |
| Privacy/safety incidents | Actual recorded incidents across the approved sessions, with owner-reviewed incident logs | Zero | UNRECORDED | UNRECORDED | NOT RUN |

For medians, sort valid observations and use the middle value, or the average of
the two middle values for an even count. Report the valid sample size and missing
count. Never insert zeros for missing timing, accuracy, interventions or incidents.
Report learners who never reach a meaningful key or fail to finish separately;
they do not become successful activations or disappear from the activation denominator.

Record how many Session-1 learners were not offered a feasible return and why at
an aggregate level. Do not narrow the denominator after seeing who returned.
When return testing is unavailable, label it NOT TESTED, explain why, and leave
any exception/conditional decision to the authorized owner. No automatic pass.
Any consent withdrawal is handled under the approved data-retention process;
record only permissible aggregate missingness, not private reasons.

Accessibility support is not automatically a task takeover. Predefine permissible
accommodations, distinguish access setup from solving the task, and never withhold
necessary help for a better number. A failed critical path remains a blocker even
when other paths pass. Touch results do not establish physical-key mastery.

## Observations and repair tracking

Use de-identified aggregate facts here. Keep per-child quotes/rows private unless
separate appropriate publication approval exists; no testimonial permission is implied.

| Observed fact | Learner quote evidence (private reference only) | Interpretation | Proposed change | Sanitized issue / severity / owner | Fix commit and retest evidence |
| --- | --- | --- | --- | --- | --- |
| UNRECORDED | UNRECORDED | UNRECORDED | UNRECORDED | UNRECORDED | UNRECORDED |

Summarize confusion, UI-caused repeated errors, understandable finger guidance,
restoration cause/effect, delight, animation distraction, voluntary continue/finish,
return understanding, accessibility, crashes/performance and save/resume separately.
A favorable quote cannot erase a blocking observation. Preserve failed candidate
records and identify a revised candidate for retest.

## Human decision — leave unselected until evidence exists

Decision: **UNRECORDED**.
Permitted completed decisions: exactly one of **GO**, **REPAIR**, **HOLD**.

- GO: actual evidence supports the Meadow direction, with all applicable gates
  addressed, no unresolved safety/privacy/critical-accessibility blockers, and
  explicit owner sign-off. This is not a claim of educational effectiveness.
- REPAIR: concrete product/process findings require fixes and approved retesting;
  link issues, owners, candidate revisions and required evidence.
- HOLD: the concept/flow or validation conditions need larger reconsideration;
  state the unresolved question and permitted next action.

| Decision record | Value |
| --- | --- |
| Evidence-based rationale and scope | UNRECORDED |
| Gate failures, missing evidence and any owner-reviewed limitations | UNRECORDED |
| Findings/issues and permitted next actions | UNRECORDED |
| Pilot lead sign-off/date | UNRECORDED |
| Product owner decision/date | UNRECORDED |
| Privacy review of any publishable summary/date | UNRECORDED |
| Accessibility review and unresolved blockers | UNRECORDED |
| Retention/deletion follow-through owner and due date | UNRECORDED |

A blank record, synthetic fixture, CI run, internal walkthrough, or template
check is not learner evidence. #186 remains open without actual completion evidence.
A #186 GO does not substitute for #178's explicit expansion GO, authorize production
work on #179–#183 by itself, or authorize #187 deployment/public cutover/cloud activation.
