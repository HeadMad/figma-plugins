import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

export default defineConfig({
  root: 'src/ui',
  plugins: [
    svelte({ compilerOptions: { css: 'injected' } }),
    viteSingleFile(),
  ],
  resolve: {
    alias: {
      '@styles': path.resolve(__dirname, '../../../packages/styles/src/index.js'),
      '@ui': path.resolve(__dirname, '../../../packages/ui/src'),
      '@utils': path.resolve(__dirname, '../../../packages/utils/src'),
      '@icons': path.resolve(__dirname, '../../../packages/icons/src'),
      '@code': path.resolve(__dirname, '../../../packages/code/src'),
    },
  },
  build: {
    emptyOutDir: false,
    outDir: '../../dist',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      input: { ui: path.resolve(__dirname, 'src/ui/ui.html') },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});
