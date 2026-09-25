import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

// One source for the existing #165 limits; no budget increase is implied.
export const LIMITS = Object.freeze({ shell: 2_500_000, meadowPack: 8_000_000, laterPack: 12_000_000, raster: 1_500_000 });
export function assetPackLimit(packId) {
  return packId === 'shell' ? LIMITS.shell : packId === 'biomes.meadow-base' ? LIMITS.meadowPack : LIMITS.laterPack;
}

function byteCount(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label}: expected a non-negative safe integer byte count`);
  return value;
}

/** Core art loads on Start, so it belongs in the additional first-play transfer. */
export function createTransferBudgetReport({ v1DefaultShellGzipBytes, v2ShellGzipBytes, v2FirstPlayableCodeGzipBytes, packSizes }) {
  for (const [label, value] of Object.entries({ v1DefaultShellGzipBytes, v2ShellGzipBytes, v2FirstPlayableCodeGzipBytes })) byteCount(value, label);
  if (v2FirstPlayableCodeGzipBytes < v2ShellGzipBytes) throw new Error('First-play code cannot be smaller than its initial shell');
  for (const [packId, bytes] of packSizes) byteCount(bytes, packId);
  const coreAssetBytes = packSizes.get('shell') ?? 0;
  const meadowAssetBytes = packSizes.get('biomes.meadow-base') ?? 0;
  const additionalMeadowCodeGzipBytes = v2FirstPlayableCodeGzipBytes - v2ShellGzipBytes;
  const additionalMeadowTotalBytes = byteCount(additionalMeadowCodeGzipBytes + coreAssetBytes + meadowAssetBytes, 'Additional first-play transfer');
  return { limits: LIMITS, v1DefaultShellGzipBytes, v2ShellGzipBytes, v2FirstPlayableCodeGzipBytes,
    additionalMeadowCodeGzipBytes, coreAssetBytes, meadowAssetBytes, additionalMeadowTotalBytes };
}

export function assertTransferBudgets(report) {
  if (report.v2ShellGzipBytes > LIMITS.shell) throw new Error(`v2 shell ${report.v2ShellGzipBytes} exceeds ${LIMITS.shell} compressed bytes`);
  if (report.additionalMeadowTotalBytes > LIMITS.meadowPack) {
    throw new Error(`Meadow code, shared core and assets total ${report.additionalMeadowTotalBytes} exceeds ${LIMITS.meadowPack} first-pack bytes`);
  }
}

/** A source may also be its optimized output; inspect and count that path once. */
export function assetFilePaths(asset) {
  return [...new Set([asset.sourcePath, ...asset.outputs.map((variant) => variant.path)])];
}

function svgDimensions(text) {
  const root = /<svg\b([^>]*)>/u.exec(text.replace(/<!--[\s\S]*?-->/gu, ''));
  if (!root) return null;
  const attribute = (name) => {
    const matches = [...root[1].matchAll(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, 'gsu'))];
    if (matches.length > 1) throw new Error(`Duplicate SVG ${name} attribute`);
    return matches[0]?.[2];
  };
  const rawBox = attribute('viewBox');
  const box = rawBox?.trim().split(/[\s,]+/u).map(Number);
  if (box && (box.length !== 4 || !box.every(Number.isFinite) || box[2] <= 0 || box[3] <= 0)) return null;
  const length = (value) => {
    if (value === undefined) return undefined;
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:px)?$/iu.test(value.trim())) return null;
    const parsed = Number(value.trim().replace(/px$/iu, ''));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };
  const width = length(attribute('width')); const height = length(attribute('height'));
  if (width === null || height === null) return null;
  if (width !== undefined && height !== undefined) return { width, height };
  if (!box) return null;
  if (width !== undefined) return { width, height: width * box[3] / box[2] };
  if (height !== undefined) return { width: height * box[2] / box[3], height };
  return { width: box[2], height: box[3] };
}

/** Header inspection, not a substitute for browser image-decode verification. */
export function inspectDimensions(path) {
  const data = readFileSync(path); const ext = extname(path).toLowerCase();
  let dimensions = null;
  if (ext === '.png' && data.length >= 24 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    && data.toString('ascii', 12, 16) === 'IHDR') {
    dimensions = { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  if (ext === '.webp' && data.length >= 25 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') {
    const kind = data.toString('ascii', 12, 16);
    if (kind === 'VP8X' && data.length >= 30) dimensions = { width: 1 + data.readUIntLE(24, 3), height: 1 + data.readUIntLE(27, 3) };
    if (kind === 'VP8 ' && data.length >= 30) dimensions = { width: data.readUInt16LE(26) & 0x3fff, height: data.readUInt16LE(28) & 0x3fff };
    if (kind === 'VP8L') dimensions = { width: 1 + (((data[22] & 0x3f) << 8) | data[21]), height: 1 + (((data[24] & 0x0f) << 10) | (data[23] << 2) | ((data[22] & 0xc0) >> 6)) };
  }
  if (ext === '.svg') dimensions = svgDimensions(data.toString('utf8'));
  if (dimensions && [dimensions.width, dimensions.height].every((value) => Number.isFinite(value) && value > 0)) return dimensions;
  throw new Error(`Cannot inspect ${path}; provide valid supported PNG/WebP/SVG dimensions before approval`);
}
