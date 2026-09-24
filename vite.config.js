import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/magic-type-quest/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        parents: resolve(import.meta.dirname, 'parents.html'),
        teacher: resolve(import.meta.dirname, 'teacher.html'),
        landing: resolve(import.meta.dirname, 'landing.html'),
        v2: resolve(import.meta.dirname, 'v2/index.html'),
      },
    },
  },
});
