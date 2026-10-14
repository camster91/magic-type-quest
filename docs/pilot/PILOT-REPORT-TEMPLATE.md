# 6-week pilot report: template and how to run it

`npm run pilot:report` turns the files pilot teachers and parents send us into
a Markdown draft of the 6-week pilot report. This page shows the layout of that
draft and how to make it. The exports themselves are described in
[PILOT-SURVEY.md](PILOT-SURVEY.md).

> **Publishing needs owner approval.** The draft is for the owner only. Nothing
> from it goes on the landing page until the owner has checked every number
> and has written permission for every quote.

## How to run it

1. Make a folder outside version control, for example `pilot-data/` at the
   repo root (it is in `.gitignore`).
2. Give each class or homeschool family its own subfolder with a neutral code,
   for example `pilot-data/class-01/`. **Never** use a school, teacher or child
   name. Put all of that class's pilot summaries
   (`bloomtype-pilot-summary-YYYY-MM-DD.json`) in it. Ask teachers to download
   one in week 1 and one in week 6: the earliest file is "start", the latest
   is "end".
3. Put the survey files (`bloomtype-pilot-feedback-YYYY-MM-DD.json`) anywhere
   in the folder, for example `pilot-data/surveys/`. A survey someone pasted
   into an email can be saved as a `.json` or `.txt` file.
4. Run:

   ```sh
   npm run pilot:report -- pilot-data
   ```

   The draft is written to `docs/pilot/PILOT-REPORT-DRAFT.md` (also in
   `.gitignore`, because it holds unreviewed quotes). Use
   `-- pilot-data --out some/other/file.md` to write it somewhere else.

Files that are not a version 1 BloomType export are skipped and counted.
Only known fields are read, so anything extra someone typed into a file is
ignored. Folder and file names never appear in the draft.

## Rules the script follows

- **Small groups are suppressed.** A class or family with fewer than 5
  students shows "suppressed" and is left out of **every** total, median and
  count of students, so its figures can't be worked out by subtracting the
  visible classes from a total.
- **Every figure needs 5 contributors.** Inside a bigger class, each metric
  is checked on its own contributor count: WPM and accuracy need 5 students
  with a score (`studentsCounted`); minutes need 5 students who practised in
  the last 7 days (and, for the 28-day figure, a full practice log for every
  counted student). A figure that fails is shown as "suppressed" and left out
  of the totals. So a class of 10 where one child played shows nothing about
  that child.
- **Surveys.** A role (teachers or parents) with fewer than 5 responses is
  suppressed. If one role has 1 to 4 responses, the combined table is
  suppressed too, so it can't be worked out by subtraction.
- **Significance.** With fewer than 30 students (overall or in the
  before/after comparison), the draft says the results are not statistically
  significant. The exports are class-level (one median per class), so no
  significance test is possible at all; quartiles are across classes.
- **Start vs. week 6.** Start is each class's earliest summary, end its
  latest. Pairs 35 days or more apart count as 6 weeks; pairs 7 to 34 days
  apart are used only if no 6-week pair exists, and the draft says so. A class
  with one export appears only in the snapshot. If no class has two exports,
  the draft says the data can't support a before/after comparison.
- **WPM and accuracy** are "to date" values: each student's best WPM and
  average accuracy, summarised by the class median.
- **Minutes** come from each class's latest export, which only looks back 7
  and 28 days. Per student per week = 28-day minutes ÷ students counted ÷ 4
  (or the 7-day figure if there is no 28-day log). There is no true 6-week
  total in the exports.
- **Quotes** are listed for owner review, each marked "needs permission before
  publishing". Emails, links, long numbers and capitalised words in the middle
  of a sentence (likely names) are hidden automatically. That is a safety net:
  a name at the start of a sentence can slip through, so read every quote.

## Report layout

The draft has these sections, in this order:

1. **Read this first**: privacy and significance warnings that apply.
2. **Who took part**: classes or families that sent a summary, students
   (counts only), teacher surveys, parent surveys (families), skipped files.
3. **Speed and accuracy: start vs. week 6**: classes and students compared;
   median and interquartile range (across classes) of the class median WPM and
   accuracy at start and end, and the change per class.
   - *Latest snapshot*: the same figures from each class's latest export.
4. **Minutes used**: total minutes in the last 28 and 7 days, median (and IQR)
   minutes per student per week, share of students active in the last 7 days.
   - *By class*: one row per class, labelled Group A, B, … (not real names).
5. **Survey ratings**: for teachers, parents and all grown-ups, the count of
   each 1–5 answer, "no answer" and the median for every rating question, plus
   the minutes-per-week bands.
6. **Quotes for owner review**: every comment, with role and language, each
   marked **needs permission before publishing**.
7. **Before publishing**: the owner's checklist.

## From draft to landing page

- [ ] Owner checks every number against the exports.
- [ ] Every quote has the writer's written permission and names no child.
- [ ] Keep the "not statistically significant" wording next to any number it
      applies to.
- [ ] Owner approves the final text, then it can go on the landing page.
