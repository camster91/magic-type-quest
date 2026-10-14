// Records the teacher demo video for the For Schools page (landing.html):
// create a class, print the join cards, then open the class report.
//
//   npm run build && npx vite preview --host 127.0.0.1 --port 4670 --strictPort
//   node scripts/record-teacher-demo.mjs [baseURL] [outDir] [chromiumPath]
//
// It writes raw.webm plus cuts.json (seconds to keep). The students are the
// made-up demo names from the e2e tests (Ava, Ben); never use real data.
// Encode the kept parts with ffmpeg, for example with cuts [[0, 10.7], [15.73, 23.2]]:
//   ffmpeg -i raw.webm -filter_complex "[0:v]trim=0:10.7,setpts=PTS-STARTPTS[a];
//     [0:v]trim=15.73:23.2,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0,fps=24,format=yuv420p[v]"
//     -map "[v]" -an -c:v libx264 -preset slow -crf 30 -tune stillimage -movflags +faststart
//     public/media/teacher-demo.mp4
// Then update the caption timings in public/media/teacher-demo.*.vtt.
import { chromium } from '@playwright/test';
import { mkdir, readdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const baseURL = process.argv[2] || 'http://127.0.0.1:4670/magic-type-quest/';
const outDir = process.argv[3] || 'demo-recording';
const executablePath = process.argv[4] || undefined;
const size = { width: 1280, height: 720 };

const today = new Date();
const day = (offset) => {
  const d = new Date(today);
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const demoStudent = (uuid, name, avatar, wpm, accuracy, levels, minutes, weak) => ({
  uuid, name, avatar, tutorialSeen: true, totalWords: levels.length * 60, totalStars: levels.length * 3,
  completedLevels: levels,
  levelStats: Object.fromEntries(levels.map((level) => [level, { wpm, accuracy }])),
  practiceLog: { [day(0)]: Math.ceil(minutes / 2), [day(1)]: Math.floor(minutes / 2) },
  minutesPractised: minutes,
  keySR: Object.fromEntries([...'asdfjkl'].map((k) => [k, { correct: 12, wrong: 0 }]).concat(weak.map((k) => [k, { correct: 1, wrong: 4 }]))),
  lastPlayed: today.toISOString(),
});
const STUDENTS = [
  demoStudent('demo-ava', 'Ava', '🦊', 14, 94, [1, 2], 24, ['q', 'p']),
  demoStudent('demo-ben', 'Ben', '🐢', 9, 88, [1], 16, ['z', 'x']),
];

const pause = (page, ms) => page.waitForTimeout(ms);
async function typeSlowly(locator, text) {
  await locator.click();
  await locator.pressSequentially(text, { delay: 90 });
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath });
const context = await browser.newContext({ viewport: size, recordVideo: { dir: outDir, size }, baseURL, reducedMotion: 'reduce' });
await context.addInitScript(() => {
  // The print dialog cannot be filmed; the script shows the print layout instead.
  window.print = () => {};
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.clear();
});
const page = await context.newPage();
const start = Date.now();
const now = () => (Date.now() - start) / 1000;
const keep = [];
let from = 0;

// 1. Create a class.
await page.goto('teacher.html');
await pause(page, 800);
await typeSlowly(page.locator('#pin-input'), '2468');
await typeSlowly(page.locator('#pin-confirm'), '2468');
await page.locator('#btn-unlock').click();
await page.locator('#teacher-dashboard').waitFor();
await pause(page, 900);
await typeSlowly(page.locator('#new-class-name'), 'Room 12');
await pause(page, 300);
await page.locator('#new-class-form button[type="submit"]').click();
const code = (await page.locator('#settings-class-code').textContent()).trim();
await pause(page, 1800);

// 2. Print the join cards (shown as the print preview).
await page.locator('#btn-print-cards').click();
await page.emulateMedia({ media: 'print' });
await pause(page, 3500);
await page.emulateMedia({ media: 'screen' });
await pause(page, 600);
keep.push([from, now()]);

// Off camera: two demo students join the class on this device.
for (const student of STUDENTS) {
  await page.evaluate((profile) => localStorage.setItem('bloomtype-profile', JSON.stringify(profile)), student);
  await page.goto('');
  await page.locator('#btn-profile').click();
  await page.locator('#player-name').fill(student.name);
  await page.locator('#class-code').fill(code);
  await page.locator('#btn-save-profile').click();
  await pause(page, 400);
}

// 3. Open the class report.
await page.goto('teacher.html');
await page.locator('#teacher-dashboard').waitFor();
from = now();
await pause(page, 900);
await page.locator(`.class-chip[data-code="${code}"]`).click();
await page.locator('#student-body tr', { hasText: 'Ava' }).waitFor();
await pause(page, 1200);
await page.locator('#stats-grid').scrollIntoViewIfNeeded();
await page.mouse.wheel(0, 260);
await pause(page, 1500);
await page.locator('#student-body tr', { hasText: 'Ava' }).hover();
await pause(page, 1800);
await page.locator('#student-body tr', { hasText: 'Ben' }).hover();
await pause(page, 1800);
keep.push([from, now()]);

await context.close();
await browser.close();
const [video] = (await readdir(outDir)).filter((name) => name.endsWith('.webm') && name !== 'raw.webm');
await rename(join(outDir, video), join(outDir, 'raw.webm'));
await writeFile(join(outDir, 'cuts.json'), JSON.stringify(keep.map(([a, b]) => [Number(a.toFixed(2)), Number(b.toFixed(2))])));
console.log('kept', keep);
