import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  resolve: {
    alias: {
      '@pkg/code': path.resolve(repoRoot, 'packages/code/src'),
      '@pkg/utils': path.resolve(repoRoot, 'packages/utils/src'),
    },
  },
  build: {
    emptyOutDir: false,
    outDir: path.resolve(__dirname, 'dist'),
    rollupOptions: {
      input: { code: path.resolve(__dirname, 'src/code/main.js') },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
        name: 'PluginCode',
      },
    },
  },
});
