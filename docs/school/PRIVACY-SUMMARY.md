# BloomType privacy summary (plain language)

> **Draft.** The owner and a privacy or legal reviewer must approve this before it is published or sent to a school.

## The short version

- **No accounts, no ads, no tracking.** Children play without signing up.
- **Progress stays on the device.** In the public version, everything a child does is saved in that browser only. It is never sent to BloomType, Ashbi or anyone else.
- **No AI talks to children.** The pictures and sounds were made once, in advance, and ship with the game.
- **Families and schools stay in control.** Progress can be downloaded or deleted from the Profile screen at any time.

## What is saved, and where

Everything below is stored in the browser's local storage on the device the child uses.

| What | Why | Where |
|---|---|---|
| Display name the child types (a first name or nickname) | Shows on the profile, the teacher roster and the parent page | This browser |
| Avatar picture choice | Shows the child's pet | This browser |
| Levels completed, stars, words typed, best speed and accuracy per level | Progress and rewards | This browser |
| Which keys are hard and which are learned | Picks practice words | This browser |
| Minutes practised per day | Parent page, teacher report and homeschool record | This browser |
| Garden flowers and Field Guide cards found | Rewards | This browser |
| Class code (only if a teacher gives one) | Groups students for the teacher page on the same device | This browser |
| Teacher's classes, assignments and spelling words | Teacher tools | The teacher's browser |
| Language, sound and voice settings | Preferences | This browser |

## What BloomType never collects

Email addresses, birth dates, home addresses, phone numbers, photos, voice recordings, precise location, contacts, advertising IDs, or anything typed outside the game's word lists. There are no third-party analytics or advertising scripts.

## Deleting and downloading

- **Delete:** Profile → *Delete local progress*. This removes the child's profile, progress and class membership from that browser. Clearing the browser's site data also removes everything.
- **Download:** Profile → *Download local progress* saves the child's data as a file.
- **Teachers:** the teacher page can export a class report (CSV) and clear all BloomType data on that device.

## Optional school cloud sync (switched off)

A school version with cloud class sync is prepared but **turned off**. It will only be switched on for a school after:
1. a signed data-privacy agreement with that school or district;
2. parent notice and consent where the law requires it;
3. a retention and deletion schedule;
4. security checks on the hosted database.

Students never make an account or type an email. Each device signs in anonymously. A child who uses two devices (for example a class Chromebook and a home tablet) links them with a 12-character link code made on the first device. The code works for 14 days, and the server stores only a scrambled (hashed) copy of it. Linked devices count as one student on the teacher's list.

When it is on, the extra data stored is listed in [`docs/PRIVACY-OPERATIONS.md`](../PRIVACY-OPERATIONS.md) and the school's agreement. Hosting in Canada is planned for Canadian boards.

## Laws and frameworks this is designed for

BloomType is designed to make approval easy under COPPA (US), FERPA (US), state student-privacy laws, Ontario's MFIPPA and Bill 194, and GDPR-K/the UK Children's Code. **This is a design goal, not a legal opinion or certification.** A signed SDPC National Data Privacy Agreement and a Common Sense privacy evaluation are planned (see `docs/TODO-100.md`).

## Contact

Privacy questions: cameron@ashbi.ca
