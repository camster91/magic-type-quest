import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

describe('launch readiness controls', () => {
  it('keeps the roadmap and operator documents linked to one gate register', () => {
    for (const path of ['ROADMAP.md', 'docs/PRIVACY-OPERATIONS.md', 'docs/PRODUCTION.md']) {
      expect(read(path), path).toContain('docs/LAUNCH-READINESS.md');
    }
  });

  it('does not represent missing school approval or pilot evidence as complete', () => {
    const readiness = read('docs/LAUNCH-READINESS.md');
    expect(readiness).toContain('school launch not approved');
    expect(readiness).toContain('No consented school pilot');
    expect(readiness).toContain('Do not add product analytics for the pilot');
    expect(readiness).toContain('Stop immediately for exposed student data');
  });

  it('requires accountable release and rollback evidence', () => {
    const readiness = read('docs/LAUNCH-READINESS.md');
    expect(readiness).toContain('Candidate commit and immutable image digest:');
    expect(readiness).toContain('Rollback image tag and operator:');
    expect(readiness).toContain('Approver, decision, and timestamp:');
  });
});
