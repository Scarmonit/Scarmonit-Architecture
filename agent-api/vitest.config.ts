import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      lines: 80,
      statements: 80,
      branches: 75,
      functions: 80,
    },
  },
});
