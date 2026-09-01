import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const deploymentFiles = [
  'index.html',
  'landing.html',
  'parents.html',
  'teacher.html',
  'src/assets.js',
  'src/gameEngine.js',
  'src/lessons.js',
  'src/main.js',
];

describe('deployment base paths', () => {
  it.each(deploymentFiles)('%s does not reference assets from the domain root', (file) => {
    const source = readFileSync(resolve(root, file), 'utf8');
    expect(source).not.toMatch(/["'=(]\/assets\//);
  });

  it('the landing page manifest is relative to the configured Vite base', () => {
    const source = readFileSync(resolve(root, 'landing.html'), 'utf8');
    expect(source).toContain('rel="manifest" href="manifest.json"');
    expect(source).not.toContain('href="/manifest.json"');
  });

  it('the installed PWA starts inside the repository deployment scope', () => {
    const manifest = JSON.parse(readFileSync(resolve(root, 'public/manifest.json'), 'utf8'));
    expect(manifest.start_url).toBe('./');
  });

  it('the production container serves the configured deployment scope', () => {
    const dockerfile = readFileSync(resolve(root, 'Dockerfile'), 'utf8');
    const dockerignore = readFileSync(resolve(root, '.dockerignore'), 'utf8');
    const nginx = readFileSync(resolve(root, 'deploy/nginx.conf'), 'utf8');
    const compose = readFileSync(resolve(root, 'deploy/docker-compose.production.yml'), 'utf8');

    expect(dockerfile).toContain('npm ci --ignore-scripts');
    expect(dockerfile).toMatch(/FROM node:24-alpine@sha256:[a-f0-9]{64}/);
    expect(dockerfile).toMatch(/FROM nginx:1\.30-alpine@sha256:[a-f0-9]{64}/);
    expect(dockerfile).toContain('COPY deploy/nginx.conf');
    expect(dockerignore).toContain('!deploy/nginx.conf');
    expect(dockerfile).toContain('http://127.0.0.1/healthz');
    expect(nginx).toContain('return 302 /magic-type-quest/');
    expect(nginx).toContain('absolute_redirect off');
    expect(nginx).toContain('location /magic-type-quest/');
    expect(nginx).toContain('rewrite ^/magic-type-quest/(.*)$ /$1 break');
    expect(compose).toContain('healthcheck:');
    expect(compose).toContain('http://127.0.0.1/healthz');
  });

  it('lets mutable PWA files revalidate while caching fingerprinted bundles', () => {
    const nginx = readFileSync(resolve(root, 'deploy/nginx.conf'), 'utf8');

    expect(nginx).toMatch(/\(manifest\\\.json\|sw\\\.js\)[\s\S]*?expires -1/);
    expect(nginx).toMatch(/\(index\|landing\|parents\|teacher\)\\\.html[\s\S]*?expires -1/);
    expect(nginx).toMatch(/assets\/[\s\S]*?Cache-Control "public, immutable"/);
    expect(nginx).toMatch(/location = \/healthz[\s\S]*?Cache-Control "no-store"/);
  });
});
