/**
 * BloomType — provider-neutral roster importer (pilot builds only).
 *
 * Every roster source (Google Classroom, a CSV file, later ClassLink or
 * Clever) hands this module the same shape:
 *
 *   { provider, externalClassId, students: [{ externalId, displayName }] }
 *
 * and gets back a cleaned import that is safe to store: a short display name
 * (first name and last initial by default) and the provider's opaque id.
 * Emails, photos and anything else a provider sends are dropped here, before
 * the data reaches the network. The database refuses emails a second time.
 */

export const ROSTER_PROVIDERS = ['google', 'classlink', 'clever', 'csv'];
export const MAX_ROSTER_SIZE = 200;
export const MAX_NAME_LENGTH = 40;
export const MAX_EXTERNAL_ID_LENGTH = 128;

export class RosterImportError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'RosterImportError';
    this.code = code;
  }
}

// Control characters and zero-width/bidi marks never belong in a name.
// eslint-disable-next-line no-control-regex
const INVISIBLE = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/gu;

export function looksLikeEmail(value) {
  return String(value ?? '').includes('@');
}

function clean(value) {
  return String(value ?? '').replace(INVISIBLE, '').replace(/\s+/gu, ' ').trim();
}

/**
 * The shortest name a teacher can still recognise: "Ava Thompson" becomes
 * "Ava T.". A given and family name may be passed separately (as providers
 * do) or as one full name. `fullNames: true` keeps the whole name.
 */
export function minimizeDisplayName(given, family = '', { fullNames = false } = {}) {
  let first = clean(given);
  let last = clean(family);
  if (!last && first.includes(' ')) {
    const parts = first.split(' ');
    first = parts.shift();
    last = parts.join(' ');
  }
  if (!first && last) {
    first = last;
    last = '';
  }
  const name = fullNames || !last ? [first, last].filter(Boolean).join(' ') : `${first} ${[...last][0].toUpperCase()}.`;
  return [...name].slice(0, MAX_NAME_LENGTH).join('').trim();
}

function cleanExternalId(value) {
  return clean(value).slice(0, MAX_EXTERNAL_ID_LENGTH);
}

/**
 * Validate and minimise one provider's roster. Returns
 * { provider, externalClassId, students, skipped } where skipped lists
 * { index, reason } for rows that were left out:
 *   missing-name, missing-id, email, duplicate, too-many.
 */
export function normalizeRosterImport(input, { fullNames = false } = {}) {
  const provider = String(input?.provider || '').toLowerCase();
  if (!ROSTER_PROVIDERS.includes(provider)) throw new RosterImportError('unknown-provider');
  const rows = Array.isArray(input?.students) ? input.students : [];
  const externalClassId = input?.externalClassId == null ? null : cleanExternalId(input.externalClassId) || null;

  const students = [];
  const skipped = [];
  const seen = new Set();
  rows.forEach((row, index) => {
    const rawName = row?.displayName ?? '';
    const externalId = cleanExternalId(row?.externalId);
    if (looksLikeEmail(rawName) || looksLikeEmail(row?.givenName) || looksLikeEmail(row?.familyName)) {
      skipped.push({ index, reason: 'email' });
      return;
    }
    if (looksLikeEmail(externalId)) {
      skipped.push({ index, reason: 'email' });
      return;
    }
    const displayName = row?.givenName || row?.familyName
      ? minimizeDisplayName(row.givenName, row.familyName, { fullNames })
      : minimizeDisplayName(rawName, '', { fullNames });
    if (!displayName) {
      skipped.push({ index, reason: 'missing-name' });
      return;
    }
    if (!externalId) {
      skipped.push({ index, reason: 'missing-id' });
      return;
    }
    if (seen.has(externalId)) {
      skipped.push({ index, reason: 'duplicate' });
      return;
    }
    if (students.length >= MAX_ROSTER_SIZE) {
      skipped.push({ index, reason: 'too-many' });
      return;
    }
    seen.add(externalId);
    students.push({ externalId, displayName });
  });

  return { provider, externalClassId, students, skipped };
}

/** The arguments of the import_roster RPC (see supabase/schema.sql). */
export function toImportRosterArgs(classId, normalized) {
  if (!classId) throw new RosterImportError('no-class');
  return {
    p_class_id: classId,
    p_provider: normalized.provider,
    p_external_class_id: normalized.externalClassId,
    // Only the two stored fields cross the network.
    p_students: normalized.students.map(({ externalId, displayName }) => ({ externalId, displayName })),
  };
}

/** Save an import into a class. Returns the number of students saved. */
export async function importRosterToClass(sb, classId, normalized) {
  const { data, error } = await sb.rpc('import_roster', toImportRosterArgs(classId, normalized));
  if (error) throw new RosterImportError('save-failed', error.message);
  return Number(data) || 0;
}

/** Case- and accent-insensitive key for matching a typed name to a roster name. */
export function nameKey(name) {
  return clean(name).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}
