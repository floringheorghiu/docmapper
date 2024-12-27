import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/tests/setup.ts']
    },
    include: ['src/tests/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});