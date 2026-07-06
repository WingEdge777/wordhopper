import { defineConfig, type Plugin } from 'vite';

import { PRODUCTION_ORIGIN } from './src/config/api';

function htmlDeployCachePlugin(): Plugin {
  return {
    name: 'wordhopper-html-deploy-cache',
    transformIndexHtml: {
      order: 'pre',
      handler(_html, ctx) {
        if (ctx.server) return;
        const buildId =
          process.env.GITHUB_SHA?.slice(0, 12)
          ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        return [
          {
            tag: 'meta',
            injectTo: 'head-prepend',
            attrs: { 'http-equiv': 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
          },
          {
            tag: 'meta',
            injectTo: 'head-prepend',
            attrs: { 'http-equiv': 'Pragma', content: 'no-cache' },
          },
          {
            tag: 'script',
            injectTo: 'head-prepend',
            children: `(function(){try{var v="${buildId}",k="word-hopper-build",p=localStorage.getItem(k);if(p&&p!==v){localStorage.setItem(k,v);location.reload();return}localStorage.setItem(k,v)}catch(e){}})();`,
          },
        ];
      },
    },
  };
}

export default defineConfig({
  root: './',
  base: './',
  plugins: [htmlDeployCachePlugin()],
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
