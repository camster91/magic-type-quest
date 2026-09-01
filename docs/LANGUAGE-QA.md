# French and Spanish language QA

Use this protocol to close the human-language gate in
`docs/LAUNCH-READINESS.md`. Automated dictionary parity proves that translated
keys exist; it does not prove meaning, fluency, age appropriateness, or rendered
quality.

## Required reviewers and scope

- Assign one fluent French reviewer and one fluent Spanish reviewer. Each signs
  only the language they personally reviewed.
- Record the intended locale and audience before review (for example,
  Canadian French or a named Spanish-speaking region). Do not silently mix
  regional conventions.
- Review an exact candidate commit and URL. Record both; do not test a mutable
  `latest` tag without resolving it to an immutable digest.
- Use fictional learner and class data only. Keep cloud sync disabled unless
  the privacy and Supabase gates are separately approved.
- Machine translation, automated parity tests, or a reviewer checking only a
  string table cannot pass this gate.

## Review dimensions

Apply every dimension to each required journey.

| Dimension | Pass standard |
|---|---|
| Meaning | The translation preserves the English source meaning and product behavior without omission or invented claims. |
| Fluency | Wording is natural for the recorded locale, with correct grammar, spelling, punctuation, and idiom. |
| Child appropriateness | Learner copy is clear, encouraging, non-shaming, and understandable for the intended age range. |
| Terminology | Lesson, level, key, Shift, accuracy, WPM, score, class, profile, export, deletion, and privacy terms remain consistent across surfaces. |
| Variables and plurals | Names, counts, levels, dates, percentages, WPM, and singular/plural forms render in the correct place and form. |
| Accessibility | Accessible names, instructions, status messages, and dialog announcements convey the same action and state as visible copy. |
| Layout | No required text is clipped, overlapped, hidden, or made unusable at normal and 200% text/zoom where supported. |
| Safety and privacy | Consent, data inventory, export, deletion, failure, and school claims remain accurate and do not promise unimplemented behavior. |

## Setup

1. Record candidate commit, immutable image digest, URL, reviewer, locale,
   browser, OS, viewport, date, and whether cloud features are enabled.
2. Clear site data. Open the English surface in one window and the target
   language in another so meaning can be compared in context.
3. Select the target language through the product control, reload, and confirm
   it persists across learner, parent, and teacher entry points.
4. Repeat rendered checks at a narrow mobile viewport and at 200% browser zoom
   or the closest supported text-scaling setting.

## Required journey matrix

Record `Pass`, `Fail`, or `Blocked` plus an observation for every item. Complete
the entire matrix separately for French and Spanish.

### A. Learner onboarding and navigation

1. Review the document title, navigation, home call to action, Daily Moment,
   streak messaging, lessons, practice, garden, profile, parent guidance, and
   school link.
2. Start as a first-time learner. Review tutorial steps, finger guidance,
   keyboard accessible names, target-key states, Shift/opposite-hand guidance,
   pause/resume/quit dialogs, and error or retry messages.
3. Confirm action labels use consistent verbs and that screen-reader names do
   not contradict the visible target-language label.

### B. Curriculum and gameplay

1. Review all ten lesson names, descriptions, lock requirements, chapter
   titles, completion titles, practice instructions, and level-result states.
2. Exercise a correct word, mistake, missed word, lost heart, paused game,
   failed level, completed level, retry, and next-level path.
3. Review score, accuracy, word count, WPM, best result, singular/plural forms,
   numbered levels, and locale-formatted values.
4. Exercise a Shift lesson, weak-key drill, Daily Moment, and reduced-motion
   path. Confirm technical typing terms are correct and consistent.

### C. Progress, rewards, and profile

1. Review every achievement category and rendered achievement title/description,
   locked/unlocked state, achievement toast, quest, streak, pet personality,
   evolution, garden, and spaced-practice message encountered by the product.
2. Review profile labels, avatar choices, language and narration controls,
   class-code instructions, save state, local export, cloud export availability,
   sign-in/out states, and all success/failure messages.
3. Exercise local deletion, including the initial action, confirmation,
   cancellation, completion, and post-delete state. Confirm the consequence is
   unmistakable and not softened or expanded relative to English.

### D. Parent and privacy surface

1. Read the complete parent page, including learning approach, expectations,
   stress/safety framing, data inventory, local/cloud distinction, export,
   deletion, contact or escalation guidance, and all calls to action.
2. Confirm claims are accurate for the tested candidate and understandable to
   a parent without technical knowledge.
3. Confirm headings, links, buttons, alt/accessibility text, and narrow/zoomed
   layouts remain complete and usable.

### E. Teacher surface

1. Review page title, class-code entry, roster, summary cards, trends, alerts,
   empty/loading/offline/error states, learner detail, and local/cloud status.
2. Exercise create/open local class where available, learner join/leave,
   refresh, CSV/JSON export, and destructive clear-data confirmation.
3. Review generated CSV/JSON-facing labels or values that are intended for
   humans. Confirm spreadsheet-safety behavior does not corrupt accented text.
4. Confirm school, privacy, analytics, and availability wording does not imply
   an approved cloud deployment or validated outcome that does not exist.

### F. Persistence and fallback

1. Reload each entry point and navigate directly to its URL. Confirm the target
   language persists and no mixed-language controls appear.
2. Test offline reload after the candidate has been loaded once. Confirm cached
   learner copy remains in the selected language.
3. Trigger available validation and network-failure states. Record any fallback
   to English; an untranslated required state is a failure unless explicitly
   approved and documented.

## Finding severity and correction loop

- **Critical:** privacy, consent, deletion, safety, or school claim changes
  meaning; a destructive action is misleading; required instructions become
  unsafe; or a critical journey cannot be understood.
- **Major:** incorrect meaning, materially unnatural or age-inappropriate copy,
  inconsistent key terminology, missing translation, broken variable/plural,
  inaccessible label mismatch, or clipping that blocks a required task.
- **Minor:** non-blocking stylistic, punctuation, tone, or layout issue with a
  clear workaround and no change in meaning.

Every finding needs language, surface, exact source and rendered text, expected
wording, severity, owner, and target date. Corrections must pass automated tests,
rendered regression checks, and re-review by the reviewer who owns that language.

The language gate passes only when both language matrices are complete, no
Critical or Major finding remains, Minor findings have owners, and both fluent
reviewers sign their separate decisions. `Blocked` and partial-surface reviews
are not passes.

## Evidence record

Copy this section into one dated file per language under `docs/evidence/`. Do
not include learner information or reviewer contact details the reviewer has
not approved for repository publication.

- Language and intended locale:
- Candidate commit, immutable image digest, URL, and environment:
- Reviewer and date:
- Browser, OS, viewport, zoom/text settings:
- Cloud enabled: Yes / No; approval reference if Yes:
- A1–A3 results and observations:
- B1–B4 results and observations:
- C1–C3 results and observations:
- D1–D3 results and observations:
- E1–E4 results and observations:
- F1–F3 results and observations:
- Findings with severity, owner, and target date:
- Correction and re-review evidence:
- Decision: Pass / Fail / Blocked
- Fluent reviewer sign-off and timestamp:

The overall gate remains open until separate signed French and Spanish records
both pass.
