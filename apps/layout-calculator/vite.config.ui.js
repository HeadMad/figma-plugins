import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  root: path.resolve(__dirname, 'src/ui'),
  plugins: [
    svelte({ compilerOptions: { css: 'injected' } }),
    viteSingleFile(),
  ],
  resolve: {
    alias: {
      '@pkg/styles': path.resolve(repoRoot, 'packages/styles/src/index.js'),
      '@pkg/ui': path.resolve(repoRoot, 'packages/ui/src'),
      '@pkg/utils': path.resolve(repoRoot, 'packages/utils/src'),
      '@pkg/icons': path.resolve(repoRoot, 'packages/icons/src'),
      '@pkg/code': path.resolve(repoRoot, 'packages/code/src'),
    },
  },
  build: {
    emptyOutDir: false,
    outDir: path.resolve(__dirname, 'dist'),
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
