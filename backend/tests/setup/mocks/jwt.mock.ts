import { vi } from 'vitest';

/**
 * Mock JWT Service for unit testing
 */
export function createMockJwtService() {
  return {
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
    signWithExpiry: vi.fn().mockReturnValue('mock-jwt-token-with-expiry'),
    verify: vi.fn().mockReturnValue({
      sub: 'test-user-id',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    }),
    decode: vi.fn().mockReturnValue({
      sub: 'test-user-id',
      email: 'test@example.com',
    }),
  };
}

/**
 * Mock JWT payload for testing
 */
export const mockJwtPayload = {
  sub: 'test-user-id',
  email: 'test@example.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
};

/**
 * Mock JWT token for testing
 */
export const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token-signature';

/**
 * Create an expired JWT token for testing
 */
export function createExpiredJwtToken(): string {
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired-token';
}
