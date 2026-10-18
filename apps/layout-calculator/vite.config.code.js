import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@code': path.resolve(__dirname, '../../packages/code/src'),
      '@utils': path.resolve(__dirname, '../../packages/utils/src'),
    },
  },
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    rollupOptions: {
      input: { code: 'src/code/main.js' },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
        name: 'PluginCode',
      },
    },
  },
});
