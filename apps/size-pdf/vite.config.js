import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        css: 'injected',
      },
    }),
    viteSingleFile(),
  ],
  resolve: {
    alias: {
      '@pkg/styles': path.resolve(__dirname, '../../packages/styles/src/index.js'),
      '@pkg/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@pkg/utils': path.resolve(__dirname, '../../packages/js-utils/src'),
      '@pkg/code': path.resolve(__dirname, '../../packages/figma-utils/src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
