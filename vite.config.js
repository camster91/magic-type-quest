import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  base: '/magic-type-quest/',
  build: {
    manifest: mode === 'v2-preview',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        parents: resolve(import.meta.dirname, 'parents.html'),
        teacher: resolve(import.meta.dirname, 'teacher.html'),
        landing: resolve(import.meta.dirname, 'landing.html'),
        ...(mode === 'v2-preview' ? { v2: resolve(import.meta.dirname, 'v2/index.html') } : {}),
      },
    },
  },
}));
