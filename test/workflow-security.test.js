import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const imageWorkflow = readFileSync(resolve(root, '.github/workflows/build-and-push.yml'), 'utf8');
const ciWorkflow = readFileSync(resolve(root, '.github/workflows/ci.yml'), 'utf8');
const codeqlWorkflow = readFileSync(resolve(root, '.github/workflows/codeql.yml'), 'utf8');
const autoMergeWorkflow = readFileSync(resolve(root, '.github/workflows/auto-merge.yml'), 'utf8');
const staleWorkflow = readFileSync(resolve(root, '.github/workflows/stale-issues.yml'), 'utf8');
const workflows = [imageWorkflow, ciWorkflow, codeqlWorkflow, autoMergeWorkflow, staleWorkflow];

describe('container publication trust boundary', () => {
  it('accepts only protected push and version-tag events', () => {
    expect(imageWorkflow).toMatch(/on:\s*\n\s+push:/);
    expect(imageWorkflow).not.toMatch(/^\s+pull_request:/m);
    expect(imageWorkflow).not.toMatch(/^\s+workflow_call:/m);
    expect(imageWorkflow).not.toContain('refs/pull/');
  });

  it('skips privileged image publication for documentation-only branch pushes', () => {
    expect(imageWorkflow).toMatch(/paths-ignore:\s*\n\s+- ['"]\*\*\/\*\.md['"]/);
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

  it('pins every third-party action to an immutable commit', () => {
    for (const workflow of workflows) {
      const actionReferences = [...workflow.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)/gm)];
      for (const [, reference] of actionReferences) {
        expect(reference).toMatch(/@[a-f0-9]{40}$/);
      }
    }
  });

  it('keeps repository housekeeping off the privileged Ashbi runner', () => {
    expect(autoMergeWorkflow).toContain('runs-on: ubuntu-latest');
    expect(staleWorkflow).toContain('runs-on: ubuntu-latest');
    expect(autoMergeWorkflow).not.toContain('self-hosted');
    expect(staleWorkflow).not.toContain('self-hosted');
    expect(staleWorkflow).toContain('pull-requests: read');
    expect(staleWorkflow).toContain('days-before-pr-stale: -1');
  });
});
