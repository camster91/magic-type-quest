import { defineConfig } from 'vite';
import { resolve } from 'path';
import { criticalCss } from './scripts/critical-css.mjs';
import { swLocaleChunks } from './scripts/sw-locale-chunks.mjs';

export default defineConfig({
  base: '/magic-type-quest/',
  plugins: [criticalCss(), swLocaleChunks()],
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
});
