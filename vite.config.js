import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { contentPlugin } from './scripts/render.mjs';

const page = (file) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  plugins: [contentPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: page('index.html'),
        live: page('live.html'),
        ctrlBuild: page('ctrl-build.html'),
        sponsors: page('sponsors.html'),
      },
    },
  },
});
