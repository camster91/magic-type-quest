# Listing screenshots

Screenshots of BloomType for directory and marketplace listings (see [DIRECTORY-LISTINGS.md](../DIRECTORY-LISTINGS.md) once it is merged). They live under `docs/`, so they are not part of the built app.

All data in them is made up: the player is "Demo", the teacher's class is "Room 12", and the students are Ava, Ben, Cleo, Dev and Mia. No real children, schools or accounts appear anywhere.

## Regenerate

```sh
npm run build
npm run screenshots                 # writes to docs/growth/screenshots/
npm run screenshots -- --png-all    # every shot as PNG (large; don't commit)
npm run screenshots -- some/dir     # write somewhere else
```

The script (`scripts/capture-screenshots.mjs`) serves `dist/` with `vite preview` on a free port, seeds `localStorage` with the demo profile, and closes the server when it is done. Animations, sound and the fox voice are turned off and toasts are hidden so the shots are stable. If Playwright's bundled browser is missing, point it at another Chromium with `CHROMIUM_PATH=/path/to/chrome`.

Dates in the garden, teacher table and homeschool record are relative to the day you run it, so re-run before a submission if the dates matter.

## Sizes and formats

| Name part | Pixels | Use |
|---|---|---|
| `desktop` | 1280×800 | Chrome Web Store, Google Workspace Marketplace, most directories |
| `phone` | 1080×1920 (360×640 at 3x) | Phone/portrait slots, app directories, social |
| `small` | 640×400 | Chrome Web Store small size |

**PNG vs WebP.** The Chrome Web Store and Google Workspace Marketplace only accept PNG or JPEG, so the four shots most likely to go there (three at 1280×800, one at 640×400) are committed as PNG. Everything else is WebP to keep the folder small (about 4.7 MB in total). If a form needs PNG or JPEG for a WebP file, convert a copy (for example `ffmpeg -i in.webp out.png`, or open and export in any image editor), or re-run with `--png-all` into another folder.

## Files

### English, desktop (1280×800)

| File | Format | Size | Shows | Suits |
|---|---|---|---|---|
| `en-desktop-home.png` | PNG | ~1.0 MB | Home screen in the Meadow: progress card, sleeping fox, "Type to plant", menu dock | Chrome Web Store, Workspace Marketplace, any directory hero |
| `en-desktop-gameplay.png` | PNG | ~1.3 MB | Level 1 being played, a word half typed, finger hint and on-screen keyboard | Chrome Web Store, Workspace Marketplace, Common Sense / edtech directories |
| `en-desktop-level-complete.webp` | WebP | ~140 KB | "Meadow restored!" level-complete card with three stars and a new Field Guide card (Monarch butterfly) | All directories (convert to PNG for Google stores) |
| `en-desktop-world-map.webp` | WebP | ~70 KB | Lessons screen: world map of five habitats and the level cards | All directories |
| `en-desktop-garden-field-guide.webp` | WebP | ~80 KB | My Garden: plants grown, Field Guide (3 of 4 cards found), flowers planted | All directories |
| `en-desktop-accessibility.webp` | WebP | ~30 KB | Profile with easy-read font, high contrast and relaxed mode turned on | Accessibility sections, ClassLink/Clever, school directories |
| `en-desktop-parents.webp` | WebP | ~30 KB | Parents page: this week's card for the demo child (minutes, days, WPM, keys to practise) | Homeschool and family directories |
| `en-desktop-homeschool-record.webp` | WebP | ~20 KB | Print layout of the homeschool typing record | Homeschool directories |
| `en-desktop-teacher-class-setup.webp` | WebP | ~40 KB | Teacher page: "Room 12" class with its code, printable cards, assignment and spelling words | Teacher/school directories, ClassLink/Clever |
| `en-desktop-teacher-dashboard.png` | PNG | ~125 KB | Teacher class report for "Room 12": totals and the student table with demo students | Chrome Web Store, Workspace Marketplace, teacher/school directories |
| `en-desktop-landing-hero.webp` | WebP | ~50 KB | Landing page hero | Website-style listings, press kits |

### English, phone (1080×1920)

| File | Shows | Suits |
|---|---|---|
| `en-phone-home.webp` | Home screen with the fox | Phone/portrait slots, app directories |
| `en-phone-gameplay.webp` | Level 1 being played, a word half typed | Phone/portrait slots |
| `en-phone-level-complete.webp` | "Meadow restored!" card | Phone/portrait slots |
| `en-phone-world-map.webp` | World map | Phone/portrait slots |
| `en-phone-field-guide.webp` | Field Guide cards | Phone/portrait slots |
| `en-phone-garden.webp` | Field Guide and flowers planted | Phone/portrait slots |
| `en-phone-accessibility.webp` | Reading and play settings in high contrast | Accessibility sections |
| `en-phone-parents.webp` | Parents page weekly card | Family/homeschool directories |
| `en-phone-landing-hero.webp` | Landing page hero on a phone | Website-style listings |

All phone shots are WebP, 50–150 KB each.

### English, small (640×400)

| File | Format | Shows | Suits |
|---|---|---|---|
| `en-small-home.png` | PNG | Home screen (top half: progress card and fox) | Chrome Web Store small size |

### French and Spanish

The interface is translated; the typing words themselves are English in every language today, so the gameplay shots show English words with French or Spanish hints and labels.

| File | Size | Shows |
|---|---|---|
| `fr-desktop-home.webp` | 1280×800 | Home screen in French |
| `fr-desktop-gameplay.webp` | 1280×800 | Gameplay in French |
| `fr-phone-home.webp` | 1080×1920 | Home screen in French |
| `fr-phone-gameplay.webp` | 1080×1920 | Gameplay in French |
| `es-desktop-home.webp` | 1280×800 | Home screen in Spanish |
| `es-desktop-gameplay.webp` | 1280×800 | Gameplay in Spanish |
| `es-phone-home.webp` | 1080×1920 | Home screen in Spanish |
| `es-phone-gameplay.webp` | 1080×1920 | Gameplay in Spanish |

Use these for "one French and one Spanish screen" and for Canadian (FR) or Spanish-language directory entries.

## Not covered yet

- 1920×1080 shots. Some directories ask for them; add a `wide` size to `SIZES` in the script if needed.
- The landing page still shows older wording ("grades 2-6"). Re-run after the landing page copy is updated, before listing.
