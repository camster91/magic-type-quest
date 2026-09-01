import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const imageWorkflow = readFileSync(resolve(root, '.github/workflows/build-and-push.yml'), 'utf8');

describe('container publication trust boundary', () => {
  it('accepts only protected push and version-tag events', () => {
    expect(imageWorkflow).toMatch(/on:\s*\n\s+push:/);
    expect(imageWorkflow).not.toMatch(/^\s+pull_request:/m);
    expect(imageWorkflow).not.toMatch(/^\s+workflow_call:/m);
    expect(imageWorkflow).not.toContain('refs/pull/');
  });

  it('keeps package publication and latest out of pull-request context', () => {
    expect(imageWorkflow).toContain('packages: write');
    expect(imageWorkflow).toContain('push: true');
    expect(imageWorkflow).toContain('${{ steps.meta.outputs.image }}:latest');
    expect(imageWorkflow).not.toContain('github.event.pull_request');
  });

  it('publishes a run command that maps a host port to nginx port 80', () => {
    expect(imageWorkflow).toContain('docker run -d -p 8080:80');
    expect(imageWorkflow).not.toContain('3000:3000');
  });
});
