# BloomType: the road to 100/100

**Goal:** become the default choice for typing in homeschools, public schools and families: free and ad-free for families, with paid adult tools for schools (see [GO-TO-MARKET.md](GO-TO-MARKET.md)).

**How to use this list:**
- Work top to bottom. Each phase builds on the one before.
- "Who" says who does it: **Claude** (code, art, docs) or **Owner** (accounts, money, signatures, people).
- Tick an item only when its "Done when" is true and has proof (a test, a score, a link).

## Scorecard

Lighthouse scores were measured on 2026-10-13 on a local production build (phone settings), before and after #216. The other scores are honest estimates; each phase below raises them.

| Area | Now | Target | What "100" means here |
|---|---|---|---|
| **Speed: game home page** | 32 → **99** (measured, #216) | 100 | Lighthouse Performance 100 on a phone profile |
| **Speed: teacher, parent and landing pages** | 100 / 100 / 73 → **100 / 100 / 100** (#216) | 100 | Same |
| **Accessibility** | 100 / 100 / 96 / 98 → **100 on all pages** (#216); axe 0 errors | 100 | Lighthouse 100, axe 0, plus a real screen-reader and keyboard-only pass |
| **SEO and best practices** | 90–100 → **100 on all pages** (#216) | 100 | Lighthouse 100 on all 4 pages |
| **UI (looks)** | ~65 (estimate) | 100 | Every child-facing screen uses the Meadow art style; no leftover v1 art |
| **UX: children** | ~60 (estimate) | 100 | A 6-year-old can start playing alone in under 30 s; 3 of 4 test children ask to play again |
| **UX: teachers** | ~45 (estimate) | 100 | A teacher sets up a class and reads a report in under 5 minutes, without help |
| **UX: parents** | ~50 (estimate) | 100 | A parent sees what their child learned this week in one screen |
| **Frontend code quality** | ~75 (estimate) | 100 | Fully tested; works offline; works on Chromebook, iPad and phone; no errors in the console |
| **Backend and cloud** | ~40 (estimate) | 100 | Cloud class sync live behind signed privacy agreements, with tests run against the real database |
| **Learning results** | not measured | 100 | Pilot data shows speed and accuracy gains over 6 weeks |
| **School trust** | ~30 (estimate) | 100 | Signed SDPC agreement, Common Sense privacy rating, public privacy page |
| **Market position** | ~10 (estimate) | 100 | 100 schools and 1,000 homeschool families actively using it |

---

## Phase 0 — Merge what's done (this week)

- [ ] **Owner:** merge the open PRs in this order:
  - #207 game bug fixes
  - #209 Meadow art
  - #215 Meadow play screen
  - #210 security
  - #211 offline updates
  - #212 plans and this list
  - #213 save codes
  - #214 cloud prep, which stays switched off
- [ ] **Owner:** revoke the leaked Google key ([GOOGLE-KEY-INCIDENT.md](GOOGLE-KEY-INCIDENT.md)).
- [ ] **Owner:** in GitHub, require approval before outside contributors' workflows run.
- [ ] **Owner:** check the Higgsfield usage you don't recognize (about 106 credits).
- [ ] **Claude:** fix `npm audit` and the flaky accessibility test on `main` itself. Today these fixes ride along in each PR. **Done when:** main CI is green on its own.

## Phase 1 — Fast, polished, and fun (next 2–3 weeks)

### Speed (home page 32 → 100)
- [x] **Claude:** stop loading the old garden art ✅ #216 (home page 8 MB → ~100 KB). (about 5 MB of PNGs) that the play screen no longer shows. **Done when:** the home page downloads under 500 KB before the first tap.
- [x] **Claude:** convert the remaining pet, particle and level PNGs to WebP ✅ #216 (pets 28.9 MB → 0.8 MB). at their display size. The particle sprite is 1.2 MB and is drawn at 20 px. **Done when:** no image over 150 KB loads on the home screen.
- [x] **Claude:** load the game code only after the menu shows ✅ (`perf/critical-css`: Lighthouse phone **100** in 5 of 5 local runs, FCP 0.79 s, LCP 1.81 s, TBT 0 ms; it was 98 with FCP 1.69 s and LCP 2.14 s). The build inlines only the menu's CSS (`scripts/critical-css.mjs`), and the full stylesheet and the app code load once the menu has painted. A tap made before then is held and replayed. Inactive screens use `content-visibility: hidden`. Preloading the Meadow art on the menu was left out: its six layers are about 3.5 MB, far over the 500 KB home-page budget. The home page sits about 2 KB under that budget. **Done when:** Lighthouse Performance is 100 on the phone profile, and Total Blocking Time is under 200 ms.
- [x] **Claude:** add a Lighthouse check to CI ✅ #216, as a page-weight budget e2e test (500 KB per page, 150 KB per image). that fails below 95 on any page. **Done when:** a PR that adds a 2 MB image fails CI.

### Looks (UI)
- [x] **Claude:** a "Meadow restored!" level-complete celebration ✅ #217.: the whole scene glows, the fox dances, and stars count up.
- [x] **Claude:** a Meadow home screen ✅ #217., with the scene and the fox behind the menu instead of plain purple.
- [ ] **Claude (Higgsfield):** remake the 10 level tiles, the pets and the achievement badges in the Meadow painted style. **Done when:** no v1 3D-render art remains on a child-facing screen.
- [x] **Claude:** on phones, shrink the pet bubble ✅ #217. so the meadow and the word have room.
- [x] **Claude:** one design system (colors, type, spacing, buttons) written down and used on all 4 pages ✅ #230 #231 (`docs/DESIGN-SYSTEM.md`; every colour on all four pages comes from tokens, guarded by `test/css-tokens.test.js` and `test/page-tokens.test.js`).

### Fun (game mechanics)
- [x] **Claude:** no dead time between words (#215).
- [x] **Claude:** every word visibly restores the meadow (#215).
- [x] **Claude:** a Field Guide: ✅ #219 (4 cards; sources to confirm in `docs/v2/FIELD-GUIDE-FACTS.md`). each restored meadow unlocks a wildlife card (monarch, bee, bluebird) with one fact a child can read.
- [x] **Claude:** a world map with 5 habitats (Meadow, Pond, Forest, Shore, Mountain), one per pair of levels, using the same restoration idea. ✅ On the Lessons screen (`src/habitats.js`); placeholder CSS art until the painted scenes land.
- [x] **Claude:** gentle streaks and a "plant of the day" in place of punishments ✅ (plants only grow; no red warnings, no "keep me" pet). No hearts and no losing (v2 product contract).
- [x] **Claude:** sound: soft nature ambience and a pleasant chime per word, with a mute button that is remembered. ✅ #219 (mute, gentle tones) and #224 (breeze and birdsong).
- [ ] **Claude:** the fox speaks short encouragement with a pre-recorded voice in EN, FR and ES, made once (no live AI with children).

## Phase 2 — Teachers and parents love it (weeks 3–6)

### Teachers
- [x] **Claude:** a 3-step class setup ✅ #220 (still needs a timed usability test with a real teacher).: name the class, get a code, print student cards. **Done when:** a new teacher finishes it in under 2 minutes in a usability test.
- [x] **Claude:** a class report showing ✅ #220 (CSV done; PDF via the browser's print). each student's speed, accuracy, weak keys, minutes practised and trend, with CSV and PDF export.
- [x] **Claude:** an assignments feature ✅ #220.: "do 10 minutes of Level 3 by Friday", with a done/not-done view.
- [x] **Claude:** spelling-list lessons ✅ #220.: a teacher pastes a word list and it becomes a typing lesson. The word filter keeps it safe.
- [x] **Claude:** save codes on the teacher roster, so a teacher can rescue a student who forgot theirs (builds on #213) ✅ ("Save code" column, CSV column and "Print save codes" cards).
- [x] **Claude:** a standards map ✅ draft in #222. showing which levels match ISTE and Common Core keyboarding expectations by grade.

### Parents and homeschool
- [x] **Claude:** a weekly "what my child learned" card ✅ #221. on the parent page: minutes, keys mastered, speed trend.
- [x] **Claude:** multiple children on one device ✅ #221., with a simple profile picker.
- [x] **Claude:** a printable homeschool record ✅ #221. (a certificate plus a log of hours), which many US states ask homeschoolers to keep.
- [x] **Claude:** a parent PIN for settings, like the teacher PIN in #210 ✅ (grown-up lock on the profile screen).

### Everyone
- [ ] **Claude:** an accessibility pass with a real screen reader (dyslexia-friendly font, high contrast and relaxed mode ✅ #223; manual screen-reader pass still to do) (NVDA and VoiceOver), keyboard-only play, a dyslexia-friendly font option and high-contrast mode. **Done when:** checked in [DEVICE-ACCESSIBILITY-QA.md](DEVICE-ACCESSIBILITY-QA.md).
- [ ] **Claude:** a full French and Spanish pass on the new screens (Claude pre-review pass ✅ recorded in LANGUAGE-QA.md; still needs sign-off from a fluent French and a fluent Spanish reviewer). **Done when:** checked in [LANGUAGE-QA.md](LANGUAGE-QA.md).
- [ ] **Owner:** test on real devices: a school Chromebook, an iPad, an Android phone and an old Windows laptop. Record the results.

## Phase 3 — Ready for schools to buy (weeks 6–12)

### Backend and cloud (switch on only after privacy approvals)
- [ ] **Owner:** finish the privacy approvals (#132): DPA template, parental-consent wording and a retention policy.
- [ ] **Owner:** create the Supabase project (#133), in a Canadian region for Ontario boards.
- [ ] **Claude:** run `supabase/schema.sql` and the cloud drill against the real project. **Done when:** every check in [CLOUD-CLASS-LOGIN.md](CLOUD-CLASS-LOGIN.md) passes on the live project.
- [ ] **Claude:** switch on class login for pilot schools only, using a pilot build. The public site stays local-only.
- [ ] **Claude:** a teacher sign-in (Google), a multi-class dashboard and a school admin view.
- [ ] **Claude:** Google Classroom roster import, then ClassLink, then Clever.
- [ ] **Claude:** backups, uptime monitoring and an incident runbook. **Done when:** a restore drill works and is written down.
- [ ] **Claude:** billing for schools (invoice / purchase order first, card payment later). **Owner:** pick the payment provider. invoice/PO path ✅ (templates + calculator); Owner: confirm prices, fill business details, pick a card provider. See [PRICING-AND-ORDERING.md](school/PRICING-AND-ORDERING.md) and [PAYMENT-PROVIDER-OPTIONS.md](school/PAYMENT-PROVIDER-OPTIONS.md).

### Trust paperwork
- [ ] **Owner:** sign the SDPC National Data Privacy Agreement.
- [x] **Claude:** a plain-language privacy page and a one-page security summary ✅ drafts in #222. for IT staff. **Owner** approves both.
- [ ] **Owner:** request a Common Sense Privacy evaluation, and consider iKeepSafe COPPA certification.
- [x] **Claude:** an accessibility conformance report (VPAT) ✅ draft in #222 (manual screen-reader pass still needed). that school buyers can download.

## Phase 4 — Prove it works and grow (months 3–6)

### Pilots and proof
- [ ] **Owner:** recruit 5 pilot classrooms and 20 homeschool families.
- [x] **Claude:** add an opt-in, anonymous pilot survey, and local-only progress summaries that teachers can export. No tracking of children. ✅ survey on the teacher and parent pages, plus an anonymised pilot summary export; see docs/pilot/PILOT-SURVEY.md.
- [ ] **Claude:** write a 6-week pilot report: speed and accuracy gains, minutes used, teacher quotes. **Done when:** it's published on the landing page.

### Getting found
- [ ] **Claude:** a landing page with a 30-second Meadow trailer (Higgsfield), a teacher demo video, the free-for-families promise and the school price list. Lighthouse 100.
- [x] **Claude:** homeschool curriculum guides, plus a "Typing Week" classroom event kit (certificates and posters) ✅ (`docs/homeschool/CURRICULUM-GUIDE.md`, `docs/school/TYPING-WEEK-KIT.md`, printable poster and certificate linked from the teacher page).
- [ ] **Owner:** list it in homeschool directories, state ESA (education savings account) approved-vendor lists, the Google for Education marketplace, ClassLink and Clever.
- [ ] **Owner:** contact homeschool influencers and co-ops.
- [ ] **Owner:** go to one teacher conference (ISTE, or a provincial one), with materials made by Claude.

### Success targets
- [ ] 1,000 homeschool families active monthly.
- [ ] 100 schools using it; 10 paying.
- [ ] A 4.5+ rating in reviews, and a Common Sense "Pass" privacy rating.

## Always on (every change)

- Lint, unit tests, browser tests, accessibility checks, the local-only build check and the v2 theme guard all pass in CI.
- No new feature sends child data anywhere without the privacy approvals in #132.
- No ads, no data selling, and no live AI with children.
- Every child-facing screen is checked in EN, FR and ES and at 320 px wide.
