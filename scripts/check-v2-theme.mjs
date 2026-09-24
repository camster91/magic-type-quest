import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const SCAN_ROOTS = ['src/v2', 'public/v2', 'public/assets/v2', 'assets/v2', 'content/v2'];
const TEXT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.html', '.css', '.svg', '.txt', '.md', '.yaml', '.yml']);
export const PROHIBITED = /\b(?:spell(?:s|book|books|casting)?|magic(?:al)?|witch(?:es|craft)?|wizard(?:s|ry)?|sorcery|potion(?:s)?|mana|rune(?:s)?|enchanted|enchantment|arcane|mystic(?:al)?|occult)\b/giu;

function filesUnder(root) {
  if (!statExists(root)) return [];
  if (!statSync(root).isDirectory()) throw new Error(`Expected a directory: ${root}`);
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink in v2 content: ${path}`);
    if (entry.isDirectory()) return filesUnder(path);
    return entry.isFile() && TEXT_EXTENSIONS.has(extname(entry.name).toLowerCase()) ? [path] : [];
  });
}

function statExists(path) {
  try { statSync(path); return true; } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function validateAllowlist(entries) {
  if (!Array.isArray(entries)) throw new Error('Theme allowlist must contain an entries array.');
  const seen = new Set();
  for (const entry of entries) {
    if (typeof entry.path !== 'string' || !SCAN_ROOTS.some((root) => entry.path.startsWith(`${root}/`)) || entry.path.includes('..') || entry.path.includes('\\')) {
      throw new Error(`Invalid v2 allowlist path: ${entry.path}`);
    }
    if (typeof entry.term !== 'string' || !new RegExp(`^(?:${PROHIBITED.source})$`, 'iu').test(entry.term) || typeof entry.reason !== 'string' || !entry.reason.trim()) {
      throw new Error(`Theme exception needs a prohibited term and rationale: ${entry.path}`);
    }
    const key = `${entry.path}\0${entry.term.toLowerCase()}`;
    if (seen.has(key)) throw new Error(`Duplicate theme exception: ${entry.path} ${entry.term}`);
    seen.add(key);
  }
}

export function scanTheme(root, entries = []) {
  validateAllowlist(entries);
  const exceptions = new Set(entries.map(({ path, term }) => `${path}\0${term.toLowerCase()}`));
  const violations = [];
  for (const scanRoot of SCAN_ROOTS) {
    for (const path of filesUnder(resolve(root, scanRoot))) {
      const file = relative(root, path).replaceAll('\\', '/');
      for (const [index, line] of readFileSync(path, 'utf8').split(/\r?\n/u).entries()) {
        for (const match of line.matchAll(PROHIBITED)) {
          if (!exceptions.has(`${file}\0${match[0].toLowerCase()}`)) {
            violations.push(`${file}:${index + 1}: prohibited v2 theme term "${match[0]}"`);
          }
        }
      }
    }
  }
  return violations;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { entries } = JSON.parse(readFileSync(resolve(projectRoot, 'scripts/v2-theme-allowlist.json'), 'utf8'));
    const violations = scanTheme(projectRoot, entries);
    if (violations.length) {
      console.error(violations.join('\n'));
      process.exitCode = 1;
    } else console.log('V2 child-facing theme check passed.');
  } catch (error) {
    console.error(`V2 theme check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
