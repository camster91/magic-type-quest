import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { validateAssets } from './validate-v2-assets.mjs';
import { createTransferBudgetReport, assertTransferBudgets } from './v2-asset-policy.mjs';
export { LIMITS } from './v2-asset-policy.mjs';

const root = resolve(import.meta.dirname, '..', 'dist');
const manifest = JSON.parse(readFileSync(resolve(root, '.vite/manifest.json'), 'utf8'));
function filesFor(key, includeDynamic = false, seen = new Set()) {
  if (seen.has(key)) return new Set(); seen.add(key);
  const entry = manifest[key]; if (!entry) throw new Error(`Missing build manifest entry ${key}`);
  const files = new Set([entry.file, ...(entry.css ?? []), ...(entry.assets ?? [])]);
  for (const child of [...entry.imports ?? [], ...(includeDynamic ? entry.dynamicImports ?? [] : [])]) {
    for (const path of filesFor(child, includeDynamic, seen)) files.add(path);
  }
  return files;
}
function gzipBytes(files, html) {
  return [...files, html].reduce((sum, path) => sum + gzipSync(readFileSync(resolve(root, path)), { level: 9 }).length, 0);
}
const shell = filesFor('v2/index.html');
const meadow = filesFor('v2/index.html', true);
const v1 = filesFor('index.html');
const shellBytes = gzipBytes(shell, 'v2/index.html');
const firstPlayableBytes = gzipBytes(meadow, 'v2/index.html');
const { packSizes } = await validateAssets();
const report = { ...createTransferBudgetReport({
  v1DefaultShellGzipBytes: gzipBytes(v1, 'index.html'), v2ShellGzipBytes: shellBytes,
  v2FirstPlayableCodeGzipBytes: firstPlayableBytes, packSizes,
}), v2ShellFiles: [...shell].sort(), v2AdditionalCodeFiles: [...meadow].filter((path) => !shell.has(path)).sort() };
console.log(JSON.stringify(report, null, 2));
assertTransferBudgets(report);
