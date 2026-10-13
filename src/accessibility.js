/**
 * BloomType — reading and play settings
 * Easy-read fonts, high contrast and a relaxed mode with no time pressure.
 * Saved in the child's profile and applied to the whole page.
 */

export const FONT_CHOICES = ['default', 'readable', 'dyslexic'];

function systemPrefersMoreContrast() {
  try {
    return Boolean(globalThis.matchMedia?.('(prefers-contrast: more)').matches);
  } catch {
    return false;
  }
}

/** Settings for a profile, with safe defaults for older profiles. */
export function accessibilitySettings(profile = {}, prefersMoreContrast = systemPrefersMoreContrast()) {
  return {
    font: FONT_CHOICES.includes(profile.font) ? profile.font : 'default',
    // Until the child chooses, follow the device's "more contrast" setting.
    highContrast: typeof profile.highContrast === 'boolean' ? profile.highContrast : prefersMoreContrast,
    relaxed: profile.relaxed === true,
  };
}

/** Relaxed mode: words never fall and the Daily Moment has no clock. */
export function isRelaxed(profile) {
  return accessibilitySettings(profile).relaxed;
}

/** Put the settings on <html> so CSS can style every screen. */
export function applyAccessibility(profile, root = globalThis.document?.documentElement) {
  if (!root) return;
  const settings = accessibilitySettings(profile);
  if (settings.font === 'default') root.removeAttribute('data-font');
  else root.setAttribute('data-font', settings.font);
  root.classList.toggle('high-contrast', settings.highContrast);
  root.classList.toggle('relaxed', settings.relaxed);
}
