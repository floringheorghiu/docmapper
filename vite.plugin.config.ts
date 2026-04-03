import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/plugin/index.ts'),
      formats: ['iife'],
      name: 'PluginCode',
      fileName: () => 'plugin.js'
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true
      }
    },
    target: 'es2017',
    minify: false
  }
});