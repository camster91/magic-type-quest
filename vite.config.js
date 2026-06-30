import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/magic-type-quest/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        parents: resolve(__dirname, 'parents.html'),
        teacher: resolve(__dirname, 'teacher.html'),
        landing: resolve(__dirname, 'landing.html'),
      },
    },
  },
});
