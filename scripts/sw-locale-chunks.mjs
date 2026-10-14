// Offline language switching (public/sw.js).
//
// French and Spanish are separate chunks that load only when a player picks
// them (src/i18n.js), so their fingerprinted names are not known when
// public/sw.js is written. After the build, this plugin writes those names
// into dist/sw.js so the service worker caches them when it installs. The
// service worker's downloads are not part of the page's first load.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LOCALE_MODULE = /[\\/]src[\\/]lang[\\/][a-z]{2}\.js$/;
const PLACEHOLDER = 'const LOCALE_CHUNKS = [];';

/** The locale chunks in a Rollup bundle, plus any chunks they import. */
export function localeChunkFiles(bundle) {
  const files = new Set();
  const add = (fileName) => {
    if (files.has(fileName)) return;
    files.add(fileName);
    for (const imported of bundle[fileName]?.imports || []) add(imported);
  };
  for (const chunk of Object.values(bundle)) {
    if (chunk.type === 'chunk' && LOCALE_MODULE.test(chunk.facadeModuleId || '')) add(chunk.fileName);
  }
  return [...files].sort();
}

/** Fills the service worker's LOCALE_CHUNKS list. */
export function injectLocaleChunks(source, files) {
  if (!source.includes(PLACEHOLDER)) throw new Error(`sw-locale-chunks: "${PLACEHOLDER}" not found in sw.js`);
  if (files.length === 0) throw new Error('sw-locale-chunks: no locale chunks in the bundle');
  return source.replace(PLACEHOLDER, `const LOCALE_CHUNKS = ${JSON.stringify(files)};`);
}

/** Vite plugin: applies injectLocaleChunks to the built sw.js. */
export function swLocaleChunks() {
  let outDir = 'dist';
  let files = [];
  return {
    name: 'bloomtype-sw-locale-chunks',
    apply: 'build',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir); },
    generateBundle(_options, bundle) { files = localeChunkFiles(bundle); },
    closeBundle() {
      const path = resolve(outDir, 'sw.js');
      writeFileSync(path, injectLocaleChunks(readFileSync(path, 'utf8'), files));
    },
  };
}
