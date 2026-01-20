import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Auto-import test globals (describe, it, expect, vi, etc.)
    globals: true,
    
    // Node.js environment for backend tests
    environment: 'node',
    
    // Test file patterns
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/*.d.ts',
        'src/shared/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Setup files
    setupFiles: ['tests/setup/test.setup.ts'],
    
    // Run in CI without watch mode
    run: false,
  },
  
  // TypeScript aliases for clean imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
