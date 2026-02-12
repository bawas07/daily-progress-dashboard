import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { container } from '../../src/shared/container';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests-min-32-chars!';
process.env.LOG_LEVEL = 'error';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Mock Date for consistent timestamp testing
beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

// Clean up after each test
afterEach(() => {
  vi.restoreAllMocks();

  // Reset container between tests for isolation
  container.clear();

  // Clear any mocked timers
  vi.clearAllTimers();
});

// Global test utilities
global.describe = describe;
global.it = it;
global.test = test;
global.expect = expect;

// Suppress console logs during tests unless debugging
if (process.env.DEBUG !== 'true') {
  vi.spyOn(console, 'log').mockImplementation(() => { });
  vi.spyOn(console, 'info').mockImplementation(() => { });
  vi.spyOn(console, 'debug').mockImplementation(() => { });
}
