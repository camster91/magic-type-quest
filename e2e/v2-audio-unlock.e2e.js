import { expect, test } from '@playwright/test';

test('browser audio adapter waits for a trusted gesture and tolerates rejected playback', async ({ page }) => {
  await page.goto('landing.html');
  const before = await page.evaluate(async () => {
    const { AudioCueService } = await import('/magic-type-quest/src/v2/audio/AudioCueService.ts');
    const { audioById } = await import('/magic-type-quest/src/v2/audio/manifest.ts');
    const original = audioById.get('audio.ui.confirm');
    audioById.set('audio.ui.confirm', { ...original, status: 'implemented', durationMs: 80,
      sources: [{ path: 'public/assets/v2/audio/confirm.webm', format: 'webm', bytes: 100 }],
      provenance: { origin: 'manual', licence: 'owned', referenceId: 'fixture' } });
    let plays = 0;
    const createMedia = () => {
      const media = new window.Audio();
      media.play = async () => { plays++; throw new window.DOMException('gesture refused', 'NotAllowedError'); };
      return media;
    };
    const service = new AudioCueService(createMedia, () => true);
    const result = await service.play('audio.ui.confirm');
    const button = document.createElement('button'); button.textContent = 'Unlock sound'; document.body.append(button);
    button.addEventListener('click', () => {
      service.unlock();
      void service.play('audio.ui.confirm').then((played) => { window.__audioFixture = { played, plays }; service.dispose(); audioById.set('audio.ui.confirm', original); });
    });
    return { result, plays };
  });
  expect(before).toEqual({ result: false, plays: 0 });
  await page.getByRole('button', { name: 'Unlock sound' }).click();
  await expect.poll(() => page.evaluate(() => window.__audioFixture)).toEqual({ played: false, plays: 1 });
});
