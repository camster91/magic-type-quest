import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import {
  createLinkCode, formatLinkCode, linkThisDevice, mergeLinkedProgress, normalizeLinkCode, refreshLinkedProgress,
} from '../src/cloudLogin.js';

const ADA = 'aaaaaaaa-0000-0000-0000-000000000000';

function linkClient({ session = { user: { id: 'u2' } }, rpcResults = {}, signInError = null } = {}) {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session } }),
      signInAnonymously: vi.fn().mockResolvedValue({ error: signInError }),
    },
    rpc: vi.fn(async (name) => rpcResults[name] ?? { data: null, error: null }),
  };
}

const on = (sb, extra = {}) => ({ enabled: true, getClient: async () => sb, online: () => true, ...extra });

describe('linking a child\'s devices', () => {
  it('reads link codes the way children type them', () => {
    expect(normalizeLinkCode('n6qj-79kd-n3q9')).toBe('N6QJ79KDN3Q9');
    expect(normalizeLinkCode('N6QJ 79KD N3Q9')).toBe('N6QJ79KDN3Q9');
    expect(normalizeLinkCode('O1IL-0000-0000')).toBe('0111' + '00000000');
    expect(normalizeLinkCode('ABCD-EFGH')).toBeNull();
    expect(normalizeLinkCode('ABCD-EFGH-IJKU')).toBeNull(); // U is not in the alphabet
    // A 16-character save code is never mistaken for a link code.
    expect(normalizeLinkCode('ABCD-EFGH-JKMN-PQRS')).toBeNull();
    expect(formatLinkCode('N6QJ79KDN3Q9')).toBe('N6QJ-79KD-N3Q9');
  });

  it('keeps the best of every device and never lowers progress', () => {
    const profile = { completedLevels: [1, 3], totalWords: 200, totalStars: 5, highScore: 900, classCode: null };
    const changed = mergeLinkedProgress(profile, [
      { completed_levels: [1, 2], total_words: 150, total_stars: 40, high_score: 100, class_code: 'ABC123' },
      { completed_levels: [4], total_words: 10, total_stars: 1, high_score: 50, class_code: null },
    ]);
    expect(changed).toBe(true);
    expect(profile).toMatchObject({ completedLevels: [1, 2, 3, 4], totalWords: 200, totalStars: 40, highScore: 900, classCode: 'ABC123' });
    expect(mergeLinkedProgress(profile, [{ completed_levels: [1], total_words: 1 }])).toBe(false);
  });

  it('does nothing while cloud classes are switched off', async () => {
    const getClient = vi.fn();
    expect(await createLinkCode({ enabled: false, getClient })).toEqual({ reason: 'disabled' });
    expect(await linkThisDevice({}, 'N6QJ79KDN3Q9', { enabled: false, getClient })).toEqual({ linked: false, reason: 'disabled' });
    expect(await refreshLinkedProgress({}, { enabled: false, getClient })).toBe(false);
    expect(getClient).not.toHaveBeenCalled();
  });

  it('makes a link code only for a device that already joined online', async () => {
    expect(await createLinkCode(on(linkClient({ session: null })))).toEqual({ reason: 'not-joined' });
    const sb = linkClient({ rpcResults: { create_link_code: { data: 'N6QJ79KDN3Q9', error: null } } });
    expect(await createLinkCode(on(sb))).toEqual({ code: 'N6QJ-79KD-N3Q9' });
    expect(sb.rpc).toHaveBeenCalledWith('create_link_code');
    expect(await createLinkCode(on(sb, { online: () => false }))).toEqual({ reason: 'offline' });
  });

  it('links a new device, brings the progress across and saves it', async () => {
    const sb = linkClient({
      session: null,
      rpcResults: {
        link_device: { data: ADA, error: null },
        student_profiles: { data: [{ completed_levels: [1, 2], total_words: 300, class_code: 'ABC123' }], error: null },
      },
    });
    const sync = vi.fn().mockResolvedValue(true);
    const profile = { completedLevels: [], totalWords: 0 };
    expect(await linkThisDevice(profile, 'n6qj-79kd-n3q9', on(sb, { sync }))).toEqual({ linked: true });
    expect(sb.auth.signInAnonymously).toHaveBeenCalledOnce();
    expect(sb.rpc).toHaveBeenCalledWith('link_device', { p_code: 'N6QJ79KDN3Q9' });
    expect(profile).toMatchObject({ completedLevels: [1, 2], totalWords: 300, classCode: 'ABC123' });
    expect(sync).toHaveBeenCalledWith(profile);
  });

  it('refuses wrong codes without touching the cloud, and reports server refusals', async () => {
    const getClient = vi.fn();
    expect(await linkThisDevice({}, 'nope', { enabled: true, getClient })).toEqual({ linked: false, reason: 'bad-link' });
    expect(getClient).not.toHaveBeenCalled();
    const sb = linkClient({ rpcResults: { link_device: { data: null, error: null } } });
    expect(await linkThisDevice({}, 'N6QJ79KDN3Q9', on(sb))).toEqual({ linked: false, reason: 'bad-link' });
  });

  it('does not say linked when the cloud save fails', async () => {
    const sb = linkClient({ rpcResults: { link_device: { data: ADA, error: null }, student_profiles: { data: [], error: null } } });
    expect(await linkThisDevice({}, 'N6QJ79KDN3Q9', on(sb, { sync: vi.fn().mockResolvedValue(false) })))
      .toEqual({ linked: false, reason: 'sign-in-failed' });
  });

  it('pulls in progress from the other devices on start-up', async () => {
    const sb = linkClient({ rpcResults: { student_profiles: { data: [{ completed_levels: [5], total_words: 9 }], error: null } } });
    const profile = { completedLevels: [1], totalWords: 3 };
    expect(await refreshLinkedProgress(profile, on(sb))).toBe(true);
    expect(profile.completedLevels).toEqual([1, 5]);
    expect(await refreshLinkedProgress(profile, on(linkClient({ session: null })))).toBe(false);
  });

  it('keeps the link controls hidden in the shipped page', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toMatch(/<div[^>]*id="link-code-box"[^>]*\shidden>/);
    const main = readFileSync('src/main.js', 'utf8');
    expect(main).toMatch(/link-code-box'\)\.hidden = import\.meta\.env\.VITE_CLOUD_CLASS_LOGIN !== 'true'/);
  });
});
