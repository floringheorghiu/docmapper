import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/plugin/index.ts'),
      formats: ['es'],
      fileName: 'plugin'
    },
    rollupOptions: {
      external: ['react', 'react-dom']
    },
    target: 'es2017',
    minify: false
  }
});