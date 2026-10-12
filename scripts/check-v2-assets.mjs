import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const ASSET_ROOT = 'assets/v2';
const IMAGE_EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.avif', '.svg']);
const TYPES = new Set(['background', 'sprite', 'prop', 'icon', 'card']);
const APPROVAL = new Set(['approved', 'pending', 'rejected']);
const ID_PATTERN = /^[a-z][a-z0-9]*(?:\.[a-z0-9-]+)+$/;
// Size budgets per asset type, in bytes. Issue #165 owns the final budgets.
export const BUDGETS = { background: 1_600_000, sprite: 200_000, prop: 200_000, icon: 120_000, card: 200_000 };
const MAX_SPRITE_EDGE = 1024;

/** Read width, height and alpha from a WebP header without decoding it. */
export function readWebpInfo(buffer) {
  if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('not a WebP file');
  }
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
      alpha: (buffer[20] & 0x10) !== 0,
    };
  }
  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff), alpha: ((bits >> 28) & 1) === 1 };
  }
  if (chunk === 'VP8 ') {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff, alpha: false };
  }
  throw new Error(`unknown WebP chunk ${chunk}`);
}

function imagesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink in v2 assets: ${path}`);
    if (entry.isDirectory()) return imagesUnder(path);
    return entry.isFile() && IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase()) ? [path] : [];
  });
}

export function checkAssets(root = projectRoot) {
  const assetDir = join(root, ASSET_ROOT);
  const errors = [];
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(join(assetDir, 'manifest.json'), 'utf8'));
  } catch (error) {
    return [`${ASSET_ROOT}/manifest.json: ${error.message}`];
  }
  if (!Array.isArray(manifest.assets)) return [`${ASSET_ROOT}/manifest.json: assets must be an array`];

  const ids = new Set();
  const referenced = new Set();
  for (const asset of manifest.assets) {
    const label = asset?.id ?? '(no id)';
    if (typeof asset?.id !== 'string' || !ID_PATTERN.test(asset.id)) errors.push(`${label}: id must be a dotted logical id`);
    if (ids.has(asset.id)) errors.push(`${label}: duplicate id`);
    ids.add(asset.id);
    if (!TYPES.has(asset.type)) errors.push(`${label}: unknown type ${asset.type}`);
    if (!APPROVAL.has(asset.approval)) errors.push(`${label}: approval must be approved, pending or rejected`);
    if (typeof asset.preloadGroup !== 'string' || !asset.preloadGroup) errors.push(`${label}: missing preloadGroup`);
    if (typeof asset.decorative !== 'boolean') errors.push(`${label}: decorative must be true or false`);
    // Meaningful art takes its accessible name from content, never from the image.
    if (asset.decorative === false && (typeof asset.altKey !== 'string' || !asset.altKey)) errors.push(`${label}: non-decorative asset needs an altKey`);
    for (const field of ['tool', 'model', 'promptId', 'sourceJob', 'generated']) {
      if (typeof asset.provenance?.[field] !== 'string' || !asset.provenance[field]) errors.push(`${label}: provenance.${field} is required`);
    }
    if (typeof asset.licence !== 'string' || !asset.licence) errors.push(`${label}: licence is required`);

    if (typeof asset.file !== 'string' || asset.file.includes('..') || asset.file.startsWith('/')) {
      errors.push(`${label}: file must be a relative path inside ${ASSET_ROOT}`);
      continue;
    }
    const path = join(assetDir, asset.file);
    referenced.add(path);
    let buffer;
    try {
      buffer = readFileSync(path);
    } catch {
      errors.push(`${label}: missing file ${asset.file}`);
      continue;
    }
    if (extname(path) !== '.webp') {
      errors.push(`${label}: runtime assets must be WebP`);
      continue;
    }
    let info;
    try {
      info = readWebpInfo(buffer);
    } catch (error) {
      errors.push(`${label}: ${error.message}`);
      continue;
    }
    if (info.width !== asset.width || info.height !== asset.height) {
      errors.push(`${label}: manifest says ${asset.width}x${asset.height}, file is ${info.width}x${info.height}`);
    }
    if (info.alpha !== asset.transparent) errors.push(`${label}: manifest transparent=${asset.transparent}, file alpha=${info.alpha}`);
    if (asset.type !== 'background' && Math.max(info.width, info.height) > MAX_SPRITE_EDGE) {
      errors.push(`${label}: longest edge ${Math.max(info.width, info.height)}px is over ${MAX_SPRITE_EDGE}px`);
    }
    const budget = BUDGETS[asset.type];
    if (budget && statSync(path).size > budget) {
      errors.push(`${label}: ${statSync(path).size} bytes is over the ${asset.type} budget of ${budget}`);
    }
  }

  for (const path of imagesUnder(assetDir)) {
    if (!referenced.has(path)) errors.push(`${relative(root, path)}: not listed in manifest.json`);
  }
  return errors;
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const errors = checkAssets();
  if (errors.length) {
    console.error(`V2 asset check failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
    process.exit(1);
  }
  console.log('V2 asset check passed.');
}
