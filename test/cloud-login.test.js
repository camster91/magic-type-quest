import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { isCloudClassLoginEnabled, joinClassOnline, normalizeClassCode } from '../src/cloudLogin.js';

function fakeClient({ session = null, exists = true, signInError = null } = {}) {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session } }),
      signInAnonymously: vi.fn().mockResolvedValue({ error: signInError }),
    },
    rpc: vi.fn().mockResolvedValue({ data: exists, error: null }),
  };
}

const base = (sb, extra = {}) => ({
  enabled: true, getClient: async () => sb, online: () => true, sync: vi.fn().mockResolvedValue(undefined), ...extra,
});

describe('cloud class login (off by default)', () => {
  it('is off unless the build flag is exactly "true"', () => {
    expect(isCloudClassLoginEnabled({})).toBe(false);
    expect(isCloudClassLoginEnabled({ VITE_CLOUD_CLASS_LOGIN: '1' })).toBe(false);
    expect(isCloudClassLoginEnabled({ VITE_CLOUD_CLASS_LOGIN: 'true' })).toBe(true);
    expect(isCloudClassLoginEnabled()).toBe(false);
  });

  it('does nothing at all while switched off', async () => {
    const getClient = vi.fn();
    const result = await joinClassOnline({}, 'ABC123', { enabled: false, getClient });
    expect(result).toEqual({ joined: false, reason: 'disabled' });
    expect(getClient).not.toHaveBeenCalled();
  });

  it('normalizes and validates class codes', () => {
    expect(normalizeClassCode(' abc123 ')).toBe('ABC123');
    expect(normalizeClassCode('a b')).toBeNull();
    expect(normalizeClassCode('')).toBeNull();
  });

  it('signs in anonymously and joins a real class', async () => {
    const sb = fakeClient();
    const opts = base(sb);
    const profile = { name: 'Ada' };
    await expect(joinClassOnline(profile, 'abc123', opts)).resolves.toEqual({ joined: true });
    expect(sb.auth.signInAnonymously).toHaveBeenCalledOnce();
    expect(sb.rpc).toHaveBeenCalledWith('class_code_exists', { code: 'ABC123' });
    expect(profile.classCode).toBe('ABC123');
    expect(opts.sync).toHaveBeenCalledWith(profile);
  });

  it('reuses an existing session', async () => {
    const sb = fakeClient({ session: { user: { id: 'u1' } } });
    await joinClassOnline({}, 'ABC123', base(sb));
    expect(sb.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('refuses a class no teacher owns and leaves the profile alone', async () => {
    const profile = { classCode: 'OLD1' };
    const result = await joinClassOnline(profile, 'NOPE99', base(fakeClient({ exists: false })));
    expect(result).toEqual({ joined: false, reason: 'unknown-class' });
    expect(profile.classCode).toBe('OLD1');
  });

  it('reports offline and sign-in failures', async () => {
    await expect(joinClassOnline({}, 'ABC123', base(fakeClient(), { online: () => false })))
      .resolves.toEqual({ joined: false, reason: 'offline' });
    await expect(joinClassOnline({}, 'ABC123', base(fakeClient({ signInError: { message: 'x' } }))))
      .resolves.toEqual({ joined: false, reason: 'sign-in-failed' });
  });

  it('is loaded only behind a static build flag so production bundles drop it', () => {
    const main = readFileSync('src/main.js', 'utf8');
    expect(main).not.toMatch(/^import[^\n]*cloudLogin/m);
    expect(main).toContain("if (import.meta.env.VITE_CLOUD_CLASS_LOGIN === 'true') {");
    expect(main).toContain("await import('./cloudLogin.js')");
  });

  it('keeps the join button hidden in the shipped page', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toMatch(/<button[^>]*id="btn-join-class-online"[^>]*\shidden>/);
  });
});
