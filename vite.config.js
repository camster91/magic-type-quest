import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { criticalCss } from './scripts/critical-css.mjs';
import { pilotCsp } from './scripts/pilot-csp.mjs';
import { swLocaleChunks } from './scripts/sw-locale-chunks.mjs';

export default defineConfig(({ mode }) => ({
  // GitHub Pages is served under /magic-type-quest/. Cloudflare Pages
  // (bloomtype.pages.dev and bloomtype.ashbi.ca) set BLOOMTYPE_BASE=/.
  base: process.env.BLOOMTYPE_BASE || '/magic-type-quest/',
  // pilotCsp changes nothing in the public build (no cloud flag set).
  plugins: [criticalCss(), swLocaleChunks(), pilotCsp(loadEnv(mode, import.meta.dirname, ''))],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        parents: resolve(import.meta.dirname, 'parents.html'),
        teacher: resolve(import.meta.dirname, 'teacher.html'),
        landing: resolve(import.meta.dirname, 'landing.html'),
      },
    },
  },
}));
