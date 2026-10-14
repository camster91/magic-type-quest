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

## Claude pre-review pass (2026-10-13)

This was a full French and Spanish pass on the game, parent and teacher
screens, done before the fluent-reviewer matrix above. It does **not**
replace that matrix: the gate stays open until both fluent reviewers sign.
The pass removes the mechanical and obvious wording problems so the human
reviewers can spend their time on meaning and tone.

- Setup: branch `i18n/fr-es-qa`, local `vite build` + `vite preview`,
  headless Chromium, cloud disabled, fictional profile ("Alexandrine").
- Locales: Canadian French (`tu` for children, `vous` for adults on the
  teacher and parent pages) and neutral Latin American Spanish.

### Automated checks (now in `test/translation-quality.test.js`)

| Check | Result |
|---|---|
| Every English key exists in `fr` and `es` (game `src/i18n.js` and page `src/pageTranslations.js`), with no extra keys | Pass: 0 missing, 0 extra |
| `{placeholder}` sets match English in every string | Pass: 0 mismatches |
| No empty or still-English strings (allowlist for real cognates: Score, Parents, Aster, Date, Minutes, Source, Local, PIN, OpenDyslexic, `:`) | Pass |
| Rich HTML strings keep the same tag structure as English | Pass |
| Every `data-i18n*` key in `index.html` exists | Pass |
| No English-only `aria-label` left on game controls in `index.html` | Pass |
| The English parent privacy copy contains every section of the static page | Pass (it failed before this pass; see below) |
| Lesson, chapter, quest and achievement content has the same entries and placeholders in `fr` and `es` | Pass |

### Rendered checks

96 screens were rendered and checked:

- Screens: menu, lesson picker, practice, profile (all hidden sections
  shown), garden, game HUD, pause, level complete, game over, tutorial,
  chapter intro, evolution, finger guide, parents page and teacher page.
- Languages: `fr`, `es` and `en`.
- Sizes: 360×740 (phone) and 1280×800 (desktop).

A script also flagged clipped text, off-screen buttons and horizontal page
scroll. The final run found 0 issues.

### Findings fixed

| Severity | Lang | Surface | Problem | Fix |
|---|---|---|---|---|
| Critical | en/fr/es | Parent privacy | At runtime the dictionary replaced the static privacy section with an older copy. That copy had no "Download progress" section and an out-of-date cloud-deletion paragraph. | Dictionary text brought in line with `parents.html` in all 3 languages; test added |
| Major | fr/es | Lesson picker | On locked cards, the lesson description was cut mid-line and the unlock hint was cut off | `.level-card-sub` shows 2 full lines; grid rows size to their content |
| Major | fr/es | Practice | "⚡ 0 MPM 🎯 0 % Précision" ran off the right edge on phones | Stats wrap and centre; the % sign uses the locale format |
| Major | fr/es | Home | The unlock hint was squeezed into a one-word column, and the Daily Moment button wrapped | Progress row wraps; shorter "Moment quotidien de 60 s" / "Momento diario de 60 s" |
| Major | all | Home | The pet greeting said "Hi! I'm 🌸 🌸" (an emoji where the name should be) | Uses "Bloom" |
| Major | fr/es | Game | The combo pop-up was hard-coded as "COMBO x5! 🔥" | Uses `game.combo` |
| Major | fr/es | Game, practice | "WPM", "Lv" and "SPACE" were hard-coded | `metric.wpm` (MPM/PPM), `hud.levelShort`, `key.space` |
| Major | fr/es | Screen reader | These were English-only: menu dock buttons, the schools link, avatar buttons, pet images, evolution dots, the pause button tooltip, the achievements list and the page title | Routed through i18n (`data-i18n-aria-label`, new `data-i18n-title` and `data-i18n-alt`, `a11y.selectAvatar`, `a11y.petAlt`, `app.title`) |
| Major | es | Fingers | "corazón izquierdo/derecho" (reads as "left/right heart") | "dedo medio izquierdo/derecho" |
| Major | fr | Teacher page | The teacher was addressed with a mix of `tu` and `vous` (Crée, Colle…) | `vous` throughout |
| Major | fr/es | Home | "Maîtrise jardin de la…" had no article, and level names were lowercased | The level name is quoted: « Jardin de la rangée de repos 🌸 » |
| Minor | fr | Game | Awkward or literal wording: "Quitter vers le menu", "Pouvoir de pratique", "Nous t’encouragerons", "ne sont pas pareils", "trop vieux", "Moment du jour" (inconsistent term) | "Retour au menu", "À toi de t’entraîner !", "On t’encourage !", "ne correspondent pas", "Il a peut-être expiré", "Moment quotidien" |
| Minor | fr | Results | No space before the colon ("Score final: 0") | `common.colon` gives "Score final : 0" |
| Minor | es | Game and pages | Words from Spain rather than Latin America: añadir, pulsa, introduce, apunta, ordenadores, portátiles, deberes, alumnado, en directo, cifras, ajustes, contacta con, jugar a | agregar, presiona/toca, ingresa, anota, computadoras, laptops, tareas, estudiantes, en vivo, dígitos, configuración, comunícate con, jugar |
| Minor | es | Home | "Pide a tu docente" here, but "tu maestro" everywhere else | "Pídele a tu maestro" |
| Minor | fr/es | Quests, achievements | Some titles were violent or odd for children: "Démon/Demonio de vitesse", "Tireur/Tirador précis", "Infierno" | "As de la vitesse"/"Rayo veloz", "Œil de lynx"/"Ojo de águila", "Fuego total" |
| Minor | fr/es | Home | The "Practice class words" button had lost its verb | "Pratiquer les mots de la classe" / "Practicar palabras de clase" |

### Still open for the fluent reviewers

- Spanish uses `tú` with parents and teachers. That is common in Latin
  American apps, but a reviewer may prefer `usted` on the teacher page.
- The French and Spanish lesson names (« Jardin de la rangée de repos »,
  "Fila guía") and Bloom's gender (`Réveille-le`, `Despiértalo`) need a
  fluent reviewer's choice.
- The weak-key drill lesson in `src/drills.js` still has an English name,
  subtitle and description. No current screen shows them.
- `landing.html` (the For Schools page) is now translated; see the
  section below. It still needs the fluent reviewers' sign-off.
- The human reviewers still need to run the full A–F journey matrix
  (live gameplay, deletion, offline and 200% zoom).

## Claude pre-review pass: For Schools page (2026-10-14)

`landing.html` now opens in French or Spanish, using the same system as the
parent and teacher pages. This is a **pre-review only**: a fluent French
reviewer and a fluent Spanish reviewer still have to sign it off, and the
language gate stays open until they do.

- Setup: branch `i18n/landing-fr-es`, local `vite build` + `vite preview`,
  headless Chromium with the browser language set to `fr-CA` and `es-MX`.
- Locales and audience: the page is for adults (teachers, principals, IT
  staff). Canadian French uses `vous`; neutral Latin American Spanish uses
  `usted`. Product names (BloomType, Chromebook, Ashbi Design) and prices
  ($0, $10) are unchanged.
- How it works: every visible string has a `landing.*` key in
  `src/pageTranslations.js` (95 keys per language). `src/landing.js` picks
  the saved profile language, else the browser language. English visitors
  download no dictionaries, because the static page is already English.
  There is no language switcher on this page.
- Strings that are not in `data-page-i18n*` attributes are set by
  `src/landing.js`: the meta description, the "Most popular" badge, and the
  two chips drawn on the demo canvas.

### Automated checks (in `test/translation-quality.test.js`)

| Check | Result |
|---|---|
| Every `data-page-i18n*` key in `landing.html` exists in `en`, `fr` and `es` | Pass |
| The English dictionary matches the static page word for word | Pass |
| No visible text with letters is left outside a translated element (except the name BloomType) | Pass |
| Key, placeholder and HTML-structure parity, and no still-English strings | Pass |

### Rendered checks

- `en`, `fr` and `es` at 360×800 and 1280×800: no horizontal scroll, no
  clipped or off-screen text, and no console errors.
- The demo canvas chips are now right-aligned, so a longer label stays on
  the canvas. The English "Class rank #2" chip used to run 24 px past the
  right edge.

### For the fluent reviewers

- French: "dactylo" for typing, "compagnon" for the pet (as in the game),
  "conseil scolaire" for district, "infonuagique" for cloud, "session" for
  term. Please confirm these suit a Canadian school audience.
- Spanish: "panel docente" (as on the teacher page), "compañero" for the
  pet, "periodo escolar" for term, "padres de familia".
- Demo canvas chips: French uses "Série : {count} j" and Spanish uses
  "Racha: {count}". Both avoid a wrong plural when the count is 0 or 1, and
  both fit a 360 px phone.
- The words that fall in the demo canvas (garden, bloom, …) stay in English.
