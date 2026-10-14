import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { criticalCss } from './scripts/critical-css.mjs';
import { pilotCsp } from './scripts/pilot-csp.mjs';

export default defineConfig(({ mode }) => ({
  base: '/magic-type-quest/',
  // pilotCsp changes nothing in the public build (no cloud flag set).
  plugins: [criticalCss(), pilotCsp(loadEnv(mode, import.meta.dirname, ''))],
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
