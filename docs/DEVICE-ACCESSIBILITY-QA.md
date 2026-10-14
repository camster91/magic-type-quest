# Physical-device accessibility QA

Use this protocol to close the physical-device gate in
`docs/LAUNCH-READINESS.md`. Automated Playwright and axe checks do not replace
this review. A run passes only when every required path has named evidence and
no unresolved critical barrier.

## Safety and scope

- Test an exact approved candidate URL and commit. Record both before starting;
  do not infer the revision from `latest` or a mutable image tag.
- Keep cloud sync disabled unless the privacy and Supabase gates are separately
  approved. Use a fictional learner alias and no real student information.
- Use school-representative settings, including browser zoom, text size, screen
  reader, motion preference, and the on-screen keyboard.
- Stop for data exposure, access outside the intended class, unrecoverable
  progress loss, learner distress, or a critical task that cannot be completed.
- Do not mark a step passed from screenshots alone. Record the observed result
  and reviewer identity.

## Required matrix

Run both rows. Add additional school-managed devices without replacing either
baseline.

| Path | Minimum device and browser | Assistive technology | Input |
|---|---|---|---|
| iOS/iPadOS | Named supported iPhone or iPad, current Safari | VoiceOver | Touch keyboard; external keyboard if the school uses one |
| Android | Named supported phone or tablet, current Chrome | TalkBack | Touch keyboard; external keyboard if the school uses one |

For each row record device model, OS version, browser version, viewport
orientation, keyboard, assistive-technology version/settings, network, exact
candidate commit, URL, date, and reviewer.

## Setup

1. Clear site data and remove any previous installed BloomType app.
2. Enable the platform screen reader and confirm its standard navigation and
   activation gestures work in another trusted app.
3. Enable reduced motion at OS level. Set browser or OS text size to 200% where
   the platform permits it without page-specific overrides.
4. Open the exact candidate URL on a stable network. Confirm HTTPS is trusted
   and the learner home loads without a blank screen or horizontal page scroll.
5. Record the starting screen, installed-app state, and whether the browser
   offered installation.

## Required task script

Record `Pass`, `Fail`, or `Blocked` plus a short observation for every step.

### A. Navigation and first start

1. Navigate the learner home using only screen-reader gestures. Confirm the
   page title, primary start action, Daily Moment, lessons, practice, garden,
   profile, parent guidance, and school link have understandable names and a
   sensible order.
2. Activate the primary start action, choose the first available lesson, and
   complete the tutorial. Confirm focus does not disappear behind a dialog and
   instructions can be dismissed without sight.
3. Pause and resume gameplay. Confirm the modal is announced, focus remains
   inside it, and focus returns to a useful gameplay control afterward.
4. Quit to the menu and reopen the lesson. Confirm the current state is
   understandable and no stale modal remains active.

### B. Touch keyboard and gameplay

1. Start a lesson with the platform touch keyboard. Confirm the keyboard opens,
   the typing field has an accessible name, the current word remains perceivable,
   and the layout is not obscured in portrait or landscape.
2. Type a correct word, an incorrect character, Backspace, and an uppercase
   character in a Shift lesson where available. Confirm feedback is not conveyed
   by color alone and screen-reader output is useful rather than excessively
   repetitive.
3. Complete one lesson and a Daily Moment. Confirm results expose score,
   accuracy, words, and WPM in a stable reading order.
4. Increase text size and repeat the result, profile, and lesson-selection
   screens. Confirm controls remain operable and essential text is not clipped.

### C. Profile, progress, and deletion

1. Open Profile. Change the fictional alias, language, voice preference, and
   avatar; save and reload. Confirm labels, state, and focus are announced.
2. Navigate the achievements region and any overflow content without a pointer.
   Confirm locked and unlocked states are understandable without reduced text
   contrast.
3. Export local progress and confirm the browser communicates the download.
   Do not upload the export to an unapproved location.
4. Delete the local profile through its confirmation flow. Confirm cancellation
   preserves data and confirmation clears the fictional learner data.

### D. Install, offline, update, and recovery

1. Install using Add to Home Screen on iOS/iPadOS or the Chrome install flow on
   Android. Launch from the home-screen icon and confirm the expected standalone
   scope, name, icon, and start page.
2. While online, complete enough activity to create local progress. Close the
   installed app, disable the network, and relaunch. Confirm the shell loads,
   saved progress remains, and an offline lesson can be entered and exited.
3. Restore the network and reload. Confirm recovery requires no data reset and
   no duplicate or regressed local progress appears.
4. With the release operator, move the test endpoint from the recorded old
   candidate to a separately recorded new candidate. Reload twice or fully
   close and reopen as directed by the platform. Confirm the new revision is
   served, the app remains operable, and progress survives the service-worker
   update.
5. Roll the endpoint back to the recorded old candidate and repeat recovery.
   Confirm the rollback loads without a cache loop or blank screen. Production
   promotion or rollback still requires its own explicit approval.

## Severity and decision

- **Critical:** a required task cannot be completed; focus is trapped or lost;
  essential content is unavailable to the screen reader; data crosses users or
  classes; progress is unrecoverably lost; install/update produces a persistent
  blank or unsafe state.
- **Major:** a required task is technically possible only with substantial
  workaround, important state is misleading, or touch/zoom makes a control
  effectively unusable.
- **Minor:** non-blocking verbosity, ordering, presentation, or discoverability
  issue with a reliable workaround.

The gate passes only when both required matrix rows complete every task, there
are no unresolved Critical or Major findings, Minor findings have owners, and
the accessibility reviewer signs the decision. `Blocked` is not a pass.

## Automated / virtual screen-reader pass — 2026-10-14

Done by Claude on branch `a11y/screen-reader-pass`. This is everything short
of a real screen reader: it does **not** replace the manual NVDA and VoiceOver
passes below, and it does not close this gate.

**How.** `@guidepup/virtual-screen-reader` (a devDependency) was loaded into the
built app in Chromium and walked every screen in reading order, recording what
it would say. Playwright's accessibility snapshot (`locator.ariaSnapshot()`)
was used to check names, roles and live regions. Screens walked: home, lessons
and world map, practice, garden, profile (players, save code, grown-up lock),
game HUD, pause, level complete, game over, chapter card, finger guide,
evolution card, parents page, and teacher page locked and unlocked.

**Locked in by tests.** `e2e/screen-reader.e2e.js` (virtual screen-reader
walks, live-region announcements, focus return, accessible names) and
`test/screen-reader.test.js` (markup contracts, `announce()`, Esc on game
cards). The axe tests in `e2e/accessibility.e2e.js` and
`e2e/a11y-every-screen.e2e.js` stay green.

### Findings

| # | Issue found | Screen | Fix | Test |
|---|---|---|---|---|
| 1 | No `main` landmark in the game; no landmarks on the teacher page; none on the parents page. | All, parents, teacher | One `<main>` holds every game screen; the dock is a `<nav>` ("Other screens"). Parents: `header`, `main`, `footer`. Teacher: `main` (print cards stay outside it). | e2e home / parents / teacher walks; unit "one main landmark", "grown-up pages markup" |
| 2 | Only the hidden menu had an `h1`, so lessons, practice, garden, profile and the game started at `h2` or had no heading; the finger guide used `h3` in a dialog. | Lessons, practice, garden, profile, game | Each screen has one `h1`; sections are `h2` (habitats, world map, players, save code, grown-up lock, plants, field guide); field-guide cards `h3`; the game has a visually hidden "Typing game" `h1`; every game dialog starts with `h2`. | e2e "one h1, no skipped headings"; unit heading outline |
| 3 | Emoji and arrows read aloud: "books, Pick Your Adventure", "left arrow Back", "cherry blossom 0". | Headings, Back buttons, menu stats, HUD, profile stats, parents cards | Decorative emoji wrapped in `aria-hidden`; menu stats get hidden words ("Stars 9", "Best Score 0", "Words 40"). | e2e `emojiOnly` checks on every walk; unit "decorative emoji", "menu stats" |
| 4 | The two on-screen keyboard pictures put 54 non-working keys in the Tab order, each read as "Q, left pinky". | Practice, game | Keyboards are `aria-hidden`, keys have no `tabindex`; the practice keyboard is copied from the game one at start-up (this also takes about 2 KB off the home page). | e2e `keyboardKeys` checks; unit "hides the keyboard pictures" |
| 5 | The target word was a live region rebuilt on every key, so it was re-read letter by letter after each key; the finger hint and live HUD were live regions too. | Game | No per-key live regions. One polite `#sr-announcer` region; the word is read whole (hidden full-word text, letters hidden). | e2e "reads the whole word"; unit "keeps per-keystroke text out of live regions" |
| 6 | Nothing announced a new word, a finished word, a wrong key, or a finished level. | Game, practice | `announce()` says "Type: fig", "Well done: fig. 1 of 10. Type: hill", "Try again! f", "Level 1 Complete! 3 of 3 stars". Practice says the typed and next word, and the expected key after a mistake. | e2e "typing a word, a wrong key and finishing a level are announced politely"; unit `announce` |
| 7 | Toasts (achievements, quests, drill, Daily Moment, practice) were never announced. | Game, menu, practice | Every toast also goes to the polite announcer. | e2e "achievement toasts are announced" |
| 8 | Closing pause always sent focus to the game area, even when the pause button opened it. | Pause | Focus returns to whatever opened pause (the button, or the game for Esc). Tab stays inside the card. | e2e "pause returns focus to whatever opened it" |
| 9 | Esc did nothing on the chapter card, finger guide and evolution card. | Game cards | Esc presses the card's own button. Level-complete and game-over cards still need a choice. | e2e "Esc closes the finger guide and the chapter card"; unit "Escape in game dialogs" |
| 10 | NVDA and JAWS browse mode would take letter keys as shortcuts (H = next heading) instead of typing. | Game, practice | The game area and a new practice typing area (`#practice-area`) are `role="application"`, so screen readers switch to focus mode and pass keys through. Practice focuses that area, named by what to type. | e2e "typing areas are applications" |
| 11 | The Daily Moment "60s" pill sat inside an `aria-hidden` row: focusable but silent. | Home | Only the decorative bar is hidden. | e2e home walk |
| 12 | Labels on plain `div`s were ignored (progress card, pet, keys learned); the learned-key labels were on plain spans. | Home | `role="group"` on the card, pet and key strip; each key is `role="img"` ("Q learning"). | e2e home walk |
| 13 | Finished and locked lessons showed ✅ and the unlock hint only visually. | Lessons | The card name ends "Level 1 Complete!" or "Complete level 2 to unlock". | e2e "locked and finished lessons say so" |
| 14 | Name field named only by its placeholder; "Class Code" label not tied to its field; chosen avatar shown only by colour. | Profile | `aria-label` on the name, `for` on the label, `aria-pressed` on avatars. | e2e "profile controls expose their names" |
| 15 | Locked achievements said only "🔒". | Profile | Emoji hidden; hidden word "Locked". | e2e profile walk |
| 16 | Focus fell to the page after setting, unlocking, locking or removing the grown-up PIN (the focused control disappeared). | Profile | Focus moves to Lock after set/unlock, and to the PIN field after Lock/Remove. | e2e "profile controls…" |
| 17 | After unlocking the teacher page focus fell to `body`. | Teacher | Focus moves to the "My classes" heading. | e2e teacher test |
| 18 | Level-complete and game-over dialogs had a name but no description. | Level complete, game over | `aria-describedby` on the subtitle and message. | e2e `toHaveAccessibleDescription` |
| 19 | Practice toast said "You typed" with the *next* word, not the one just typed (visible bug too). | Practice | Uses the typed word. | covered by the practice announcement code |

### Left for the manual pass (not fixed here)

- **Voice Narration and a screen reader both say the new word.** Voice
  Narration (on by default) uses the browser's speech. Check whether this is
  annoying; a screen-reader user can switch it off in Profile.
- **A word that falls off the bottom** is not announced on its own; the child
  hears the next "Type: …" instead. Hearts are hidden on screen by design.
- **Teacher toolbar buttons** keep their emoji in the name ("floppy disk
  Local"). Minor; left as is because the text is translated with the emoji.
- **Achievements** are one region of text, not a list. Minor.
- **The home pet bubble** is a polite live region, so it speaks when you come
  back to the menu. Check it is pleasant, not noisy.
- Real screen readers differ from the virtual one in verbosity and in how
  quickly they read two messages in a row. Listen for both.

## Manual screen-reader script (NVDA and VoiceOver)

About 30 minutes per screen reader. You do not need to be an expert: follow
the steps, listen, and tick the box only if you hear what is written. Write a
short note for anything else. Use a fictional name ("Ada"), no real child data.

### Before you start (5 minutes)

- [ ] Open a private window on the candidate URL. Note the URL, commit,
      browser and screen-reader versions and the date in the evidence record.
- [ ] **NVDA (Windows, Chrome then Firefox):** start NVDA. Keys you need:
      `Tab` / `Shift+Tab` (move between controls), `H` (next heading),
      `D` (next landmark), `NVDA+F7` (list of headings and landmarks),
      `Enter` (press), `NVDA+Space` (switch browse/focus mode), `Ctrl` (stop
      talking). NVDA key = `Insert` (or `Caps Lock` on laptops).
- [ ] **VoiceOver (macOS, Safari):** `Cmd+F5` to start. `VO` = `Ctrl+Option`.
      Keys: `Tab`, `VO+Cmd+H` (next heading), `VO+U` (rotor: headings,
      landmarks), `VO+Space` (press), `VO+A` (read all).
- [ ] **VoiceOver (iPadOS, Safari):** Settings → Accessibility → VoiceOver
      on. Swipe right/left to move, double-tap to press, two-finger twist for
      the rotor (Headings, Landmarks). Use an external keyboard for the typing
      steps if the school has one; otherwise use the on-screen keyboard.
- [ ] Leave Voice Narration on for the first game (step 4), then switch it
      off in Profile and play once more.

### 1. Home (3 minutes)

- [ ] The page title is read: "BloomType - Garden Typing Adventure".
- [ ] Landmarks list (`NVDA+F7` / rotor) shows **main** and **navigation
      "Other screens"**.
- [ ] Headings list shows one level-1 heading, "BloomType".
- [ ] Tabbing goes: "Start a 60-second Daily Moment" (if shown), "Start typing
      to plant flowers", Lessons, Practice, Garden, Profile, Parents,
      Progress, "BloomType for schools". Every one has a clear name.
- [ ] Reading down (arrow keys / swipe) you hear "Your progress", the level
      line, "Keys you have learned" with keys like "Q learning", the pet, and
      "Stars 9, Best Score 0, Words 40" — numbers always have a word.
- [ ] No emoji names are read on their own ("cherry blossom", "books").

### 2. Lessons and world map (3 minutes)

- [ ] Press Lessons. You hear "Back" (not "left arrow Back") and focus is on
      it.
- [ ] Headings: one level 1 "Pick Your Adventure!", then level 2 "Your world
      map" and one level 2 per place (Meadow, Pond, Forest, Shore, Mountain).
- [ ] World map buttons say the place, its levels and status, e.g. "Pond.
      Levels 3 and 4. Finish level 2 to open". Pressing one moves you to that
      place's heading.
- [ ] A finished lesson ends "Level 1 Complete!"; a locked one ends "Complete
      level 2 to unlock" and is announced as unavailable/dimmed.
- [ ] Press Back: focus returns to "Start typing to plant flowers".

### 3. Practice (3 minutes)

- [ ] Press Practice. You hear "Type: …, Use your left pinky" and
      "application" (NVDA switches to focus mode by itself — listen for the
      focus-mode sound).
- [ ] Type the letters: keys type, they do **not** jump around the page.
- [ ] After a word you hear "You typed "…"! Type: …". After a wrong key you
      hear "Try again!" and the letter to press.
- [ ] You never hear the on-screen keyboard ("Q, left pinky…").
- [ ] `Shift+Tab` reaches "Back"; pressing it returns to the home button.

### 4. Game: play one level (8 minutes)

- [ ] Press "Start typing to plant flowers". Any card (finger guide, chapter)
      is announced with its heading, focus is on its button, and **Esc**
      closes it.
- [ ] In the game you hear "Typing game, application" and then "Type: …".
      NVDA is in focus mode (letters type; `H` does not jump to a heading).
- [ ] Type a word: you hear "Well done: …, 1 of 10. Type: …" — once, not a
      letter-by-letter echo after every key.
- [ ] Press a wrong key: you hear "Try again!" and the right letter.
- [ ] The amount of speech is fine for a child: not chattering after every
      key, not silent. Note if Voice Narration and the screen reader talk over
      each other.
- [ ] Press **Esc**: "Paused, dialog" and focus on "Resume". `Tab` cycles
      only Resume and "Quit to Menu". Esc again resumes and focus goes back to
      the game. Pause with the button, then Resume: focus is back on "Pause
      game".
- [ ] Finish the level: you hear "Meadow restored!, dialog", "Level 1
      Complete!", the stars ("3 of 3 stars"), and focus is on "Next Level".
      The score, words and best combo can be read by arrowing down.
- [ ] An achievement toast, if one appears, is read once.
- [ ] Choose "All Lessons": you land on the lessons screen with focus on Back.

### 5. Garden (2 minutes)

- [ ] Headings: level 1 "My Garden", level 2 "Plants I've grown" and "Field
      Guide", level 3 for each found card.
- [ ] Locked cards say "Finish Level 2 to discover". No bare emoji.

### 6. Profile, save code and grown-up lock (4 minutes)

- [ ] The name field is read "Your Name, edit". Avatar buttons say "Select
      Fox avatar, toggle button"; the chosen one says "pressed".
- [ ] "Class Code" is read as the label of its field.
- [ ] "My Save Code" heading; the code is read; "Copy" works; "Have a code?
      Type it here" is the label of the restore field.
- [ ] Locked achievements say "Locked".
- [ ] Grown-up lock: type a PIN twice and press "Set PIN". The status is read
      ("…unlocked") and focus lands on "Lock". Press Lock: focus goes to the
      PIN field. A wrong PIN reads the error straight away.

### 7. Parents page (2 minutes)

- [ ] Landmarks: banner, main, content information (footer).
- [ ] One level-1 heading; sections are level 2 with level 3 under them.
- [ ] The problem cards and level list do not read emoji names.

### 8. Teacher page (3 minutes)

- [ ] Locked: landmark main; heading "Create a teacher PIN"; focus starts in
      the PIN field; a wrong or mismatched PIN reads its message.
- [ ] After unlocking, focus is on the "My classes" heading (you hear it).
- [ ] The student table is read with column headers ("Student", "Level"…).
- [ ] Press "Lock": focus returns to the PIN field.

### Result

- [ ] NVDA + Chrome done  - [ ] NVDA + Firefox done
- [ ] VoiceOver + macOS Safari done  - [ ] VoiceOver + iPadOS Safari done
- Notes, with screen, step, what you heard, and what you expected:

## Evidence record

Copy this section into a dated file under `docs/evidence/`; do not commit device
identifiers or learner information that the school considers sensitive.

- Candidate commit and immutable image digest:
- Candidate URL and environment:
- Previous revision used for update/rollback:
- Device model, OS, and browser:
- Screen reader and settings:
- Keyboard/input method:
- Network conditions:
- Reviewer and date:
- A1–A4 results and observations:
- B1–B4 results and observations:
- C1–C4 results and observations:
- D1–D5 results and observations:
- Findings with severity, owner, and target date:
- Evidence locations:
- Decision: Pass / Fail / Blocked
- Accessibility reviewer sign-off and timestamp:

Evidence is incomplete until both baseline rows have separate signed records.
