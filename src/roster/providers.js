/**
 * BloomType — roster providers behind one interface:
 *   { id, requiresPartner, isConfigured(), listClasses(), fetchRoster(id, extra) }
 * listClasses() → [{ externalClassId, name }]
 * fetchRoster() → { provider, externalClassId, students: [...] }, which
 * normalizeRosterImport() then cleans before anything is saved.
 */
import { csvAdapter } from './csv.js';
import { createGoogleClassroomAdapter } from './googleClassroom.js';
import { createClassLinkAdapter } from './oneRosterClassLink.js';
import { createCleverAdapter } from './clever.js';

/** In the order schools are expected to need them. */
export const PROVIDER_ORDER = ['google', 'csv', 'classlink', 'clever'];

export function createRosterProvider(id, options = {}) {
  switch (id) {
    case 'google': return createGoogleClassroomAdapter(options);
    case 'csv': return csvAdapter;
    case 'classlink': return createClassLinkAdapter(options);
    case 'clever': return createCleverAdapter(options);
    default: throw new Error(`Unknown roster provider: ${id}`);
  }
}
