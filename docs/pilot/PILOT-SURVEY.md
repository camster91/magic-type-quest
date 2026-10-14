# Pilot survey and pilot summary

BloomType's pilot tools are for **grown-ups**: teachers and parents. Children
never see or answer them. No data leaves the device unless a grown-up sends it
to us themselves. There is no network call, no analytics and no tracking.

## 1. Pilot survey (teachers and parents)

**Where:** the "Pilot feedback" section on `teacher.html` (after the PIN) and
on `parents.html`.

**Opt-in:** the survey is closed by default. Its questions only appear when a
grown-up opens "Answer the pilot survey". Nothing is stored until they press
**Save answers**.

**Questions** (1–5 scale unless noted):

| Key | Question |
| --- | --- |
| `setupEase` | How easy was BloomType to set up? |
| `childEnjoyment` | How much did the children enjoy it? |
| `typingImprovement` | How much did their typing improve? |
| `minutesPerWeek` | About how many minutes a week did each child play? (choice: `under30`, `30to60`, `60to120`, `over120`) |
| `wouldRecommend` | How likely are you to recommend BloomType to others? |
| `comments` | Anything else? Optional free text, up to 1,000 characters |

**Where it is stored:** in this browser's `localStorage` under
`bloomtype-pilot-survey`, with one entry per role (teacher, parent).
**Delete my answers** removes it. "Clear All" on the teacher page does not
touch it, because it is the teacher's own feedback, not student data.

**What is exported:** exactly this, and nothing else:

```json
{
  "type": "bloomtype-pilot-feedback",
  "version": 1,
  "role": "teacher",
  "language": "en",
  "savedOn": "2026-10-13",
  "answers": {
    "setupEase": 4,
    "childEnjoyment": 5,
    "typingImprovement": 3,
    "minutesPerWeek": "30to60",
    "wouldRecommend": 5,
    "comments": "The meadow kept them going."
  }
}
```

The export has no names, class codes, device or profile ids, emails or
time of day. Unknown fields are dropped and out-of-range answers become
`null`. The comment box asks people not to write children's names. We cannot
check free text, so read comments before you publish any of them.

**How to send it:**

1. Press **Save answers**.
2. Press **Copy feedback** and paste it into an email, or press
   **Download feedback (.json)** and attach the file.
3. Send it to the pilot contact who invited you.

## 2. Pilot summary (teachers)

**Where:** the "Pilot feedback" section on `teacher.html`, under the
student table. **Download pilot summary (.json)** summarises the students on
screen: one class, or "All Students" on this device.

This adds to the existing per-student CSV and JSON exports and the homeschool
record. It does not replace them. Those name students and stay with the
teacher. The pilot summary is the only one meant for sharing.

**What is exported** (class-level numbers only):

```json
{
  "type": "bloomtype-pilot-summary",
  "version": 1,
  "generatedOn": "2026-10-13",
  "dateRange": { "from": "2026-09-01", "to": "2026-10-13" },
  "studentCount": 24,
  "wpm": { "median": 11, "average": 11.8, "studentsCounted": 22 },
  "accuracyPercent": { "median": 91, "average": 89.4, "studentsCounted": 22 },
  "minutes": {
    "last7Days": 310.5,
    "last28Days": 1204,
    "studentsCounted7Days": 24,
    "studentsCounted28Days": 24,
    "activeStudentsLast7Days": 19
  },
  "levelsReached": { "0": 2, "1": 3, "2": 5, "3": 6, "4": 4, "5": 2, "6": 1, "7": 1, "8": 0, "9": 0, "10": 0 }
}
```

- **WPM** is each student's best speed; **accuracy** is each student's average
  across levels. Students with no score yet are left out, and
  `studentsCounted` says how many were used.
- **Minutes** add up the practice log. Class snapshots only carry a 7-day
  total, so a student without a full log counts toward the 7-day figure but not
  the 28-day one.
- **levelsReached** counts how many students have finished 0, 1, … 10 levels.
- **dateRange** runs from the first to the last day with practice on record.

There are no names, avatars, class codes or ids in it. With very small groups
(fewer than 5 students), the numbers can still point to one child. Only share
those summaries with the pilot team, and never publish them.

**How to send it:** download the file and attach it to an email to your pilot
contact, along with your survey if you filled it in.

## For developers

- Code: `src/pilot.js` (`createSurveyExport`, `createPilotSummary`,
  `mountPilotSurvey`). Tests: `test/pilot.test.js`, `e2e/pilot.e2e.js`.
- Text: `pilot.*` keys in `src/pageTranslations.js` (en, fr, es).
- Any new field must stay non-identifying. Add it to the tests that check
  exports for names and ids.
- Turning the exports into the 6-week report: `npm run pilot:report -- <folder>`;
  see [PILOT-REPORT-TEMPLATE.md](PILOT-REPORT-TEMPLATE.md). A change to either
  export format needs the same change in `scripts/pilot-report.mjs`.
