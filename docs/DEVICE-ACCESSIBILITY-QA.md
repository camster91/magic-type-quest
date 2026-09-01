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
