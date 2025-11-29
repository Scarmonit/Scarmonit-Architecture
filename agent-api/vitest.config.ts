import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      lines: 70,
      statements: 70,
      branches: 70,
      functions: 70,
    },
  },
});
