import { defineConfig } from 'vite';

import { PRODUCTION_ORIGIN } from './src/config/api';

export default defineConfig({
  root: './',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    open: true,
    proxy: {
      '/api': {
        target: PRODUCTION_ORIGIN,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
