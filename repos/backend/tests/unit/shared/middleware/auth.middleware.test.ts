import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createMockJwtService, mockJwtPayload, mockJwtToken } from '../../../setup/mocks/jwt.mock';
import type { JwtPayload, JwtVerifyResult } from '../../../src/shared/jwt/jwt.service';

/**
 * Auth Middleware Tests
 *
 * Tests the JWT authentication middleware that:
 * - Extracts and validates Bearer tokens from Authorization header
 * - Verifies JWT signatures and expiration
 * - Sets user context on successful authentication
 * - Returns 401 for invalid/expired/missing tokens
 */

// Mock Hono context for testing
interface MockContext {
  req: {
    header: (name?: string) => string | undefined;
    parse: () => { Authorization?: string };
  };
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  next: () => Promise<void>;
  json: (data: unknown, status?: number) => { data: unknown; status: number };
  status(code: number): MockContext;
  status: number;
}

function createMockContext(headers: Record<string, string> = {}): MockContext {
  let currentStatus = 200;
  const context: MockContext = {
    req: {
      header: (name?: string) => {
        if (!name) return undefined;
        return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()] || undefined;
      },
      parse: () => ({ Authorization: headers['Authorization'] || headers['authorization'] }),
    },
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    next: vi.fn().mockResolvedValue(undefined),
    json: vi.fn().mockImplementation((data, status) => {
      currentStatus = status || 200;
      context.status = currentStatus;
      return { data, status: currentStatus };
    }),
    status(code: number) {
      currentStatus = code;
      this.status = code;
      return this;
    },
    status: 200,
  };
  return context;
}

// Import the middleware function (will be created in the implementation)
// Using dynamic import to test the middleware
async function importAuthMiddleware() {
  const module = await import('../../../../src/shared/middleware/auth.middleware');
  return module.authMiddleware;
}

describe('Auth Middleware', () => {
  let mockJwtService: ReturnType<typeof createMockJwtService>;
  let mockNext: () => Promise<void>;
  let mockContext: MockContext;

  beforeEach(() => {
    // Create fresh mock for each test
    mockJwtService = createMockJwtService();
    mockNext = vi.fn().mockResolvedValue(undefined);
    mockContext = createMockContext();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Extraction from Authorization Header', () => {
    it('should extract valid Bearer token from Authorization header', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      mockContext = createMockContext({
        'Authorization': `Bearer ${mockJwtToken}`,
      });

      mockJwtService.verify.mockReturnValue({
        valid: true,
        payload: { sub: 'user-123', email: 'test@example.com' },
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockJwtService.verify).toHaveBeenCalledWith(mockJwtToken);
    });

    it('should return 401 when Authorization header is missing', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      mockContext = createMockContext({});

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockContext.status).toBe(401);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E004',
          message: 'Authorization header is required',
        }),
        401
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is not Bearer format', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      mockContext = createMockContext({
        'Authorization': 'Basic some-token',
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockContext.status).toBe(401);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E004',
          message: 'Invalid authorization format. Use: Bearer <token>',
        }),
        401
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is empty Bearer', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      mockContext = createMockContext({
        'Authorization': 'Bearer',
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockContext.status).toBe(401);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E004',
        }),
        401
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for malformed token (not a JWT format)', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      mockContext = createMockContext({
        'Authorization': 'Bearer not-a-valid-jwt',
      });

      mockJwtService.verify.mockReturnValue({
        valid: false,
        reason: 'invalid',
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockContext.status).toBe(401);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E004',
          message: 'Invalid token',
        }),
        401
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('JWT Verification', () => {
    it('should allow request with valid token and call next()', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      const validPayload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      };

      mockContext = createMockContext({
        'Authorization': `Bearer ${mockJwtToken}`,
      });

      mockJwtService.verify.mockReturnValue({
        valid: true,
        payload: validPayload,
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.status).not.toBe(401);
    });

    it('should set user context on successful verification', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      const validPayload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      };

      mockContext = createMockContext({
        'Authorization': `Bearer ${mockJwtToken}`,
      });

      mockJwtService.verify.mockReturnValue({
        valid: true,
        payload: validPayload,
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('user', expect.objectContaining({
        id: 'user-123',
        email: 'test@example.com',
      }));
    });

    it('should return 401 for expired token', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      mockContext = createMockContext({
        'Authorization': 'Bearer expired-token',
      });

      mockJwtService.verify.mockReturnValue({
        valid: false,
        reason: 'expired',
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockContext.status).toBe(401);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E004',
          message: 'Token has expired',
        }),
        401
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid signature/token', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      mockContext = createMockContext({
        'Authorization': 'Bearer invalid-signature-token',
      });

      mockJwtService.verify.mockReturnValue({
        valid: false,
        reason: 'invalid',
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockContext.status).toBe(401);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E004',
          message: 'Invalid token',
        }),
        401
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 on JWT verification error', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      mockContext = createMockContext({
        'Authorization': 'Bearer malformed-token',
      });

      mockJwtService.verify.mockReturnValue({
        valid: false,
        reason: 'error',
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockContext.status).toBe(401);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E004',
        }),
        401
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Middleware Behavior', () => {
    it('should allow request to proceed when token is valid', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      mockContext = createMockContext({
        'Authorization': `Bearer ${mockJwtToken}`,
      });

      mockJwtService.verify.mockReturnValue({
        valid: true,
        payload: { sub: 'user-123', email: 'test@example.com' },
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.set).toHaveBeenCalledWith('user', expect.objectContaining({
        id: 'user-123',
        email: 'test@example.com',
      }));
    });

    it('should return 401 without calling next() for invalid token', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      mockContext = createMockContext({
        'Authorization': 'Bearer invalid-token',
      });

      mockJwtService.verify.mockReturnValue({
        valid: false,
        reason: 'invalid',
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should store user payload in context for downstream handlers', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      const expectedPayload: JwtPayload = {
        sub: 'user-456',
        email: 'john@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockContext = createMockContext({
        'Authorization': 'Bearer valid-token-with-user-456',
      });

      mockJwtService.verify.mockReturnValue({
        valid: true,
        payload: expectedPayload,
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('user', expect.objectContaining({
        id: 'user-456',
        email: 'john@example.com',
      }));
    });

    it('should use error code E004 for authentication failures', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      // Test with missing header
      mockContext = createMockContext({});

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E004',
        }),
        401
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle token with different algorithm', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      mockContext = createMockContext({
        'Authorization': 'Bearer token-with-rs256-algorithm',
      });

      mockJwtService.verify.mockReturnValue({
        valid: false,
        reason: 'invalid',
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockContext.status).toBe(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with future nbf (not before) claim', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      mockContext = createMockContext({
        'Authorization': 'Bearer token-with-future-nbf',
      });

      // JWT with nbf in the future should fail verification
      mockJwtService.verify.mockReturnValue({
        valid: false,
        reason: 'invalid',
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockContext.status).toBe(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle extremely long tokens gracefully', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      const longToken = 'a'.repeat(10000);
      mockContext = createMockContext({
        'Authorization': `Bearer ${longToken}`,
      });

      mockJwtService.verify.mockReturnValue({
        valid: false,
        reason: 'invalid',
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockContext.status).toBe(401);
    });

    it('should handle whitespace-only Bearer prefix', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      mockContext = createMockContext({
        'Authorization': 'Bearer     ',
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockContext.status).toBe(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should be case-insensitive for Authorization header name', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      mockContext = createMockContext({
        'authorization': `Bearer ${mockJwtToken}`,
      });

      mockJwtService.verify.mockReturnValue({
        valid: true,
        payload: { sub: 'user-123', email: 'test@example.com' },
      });

      await authMiddleware(mockJwtService.verify)(mockContext, mockNext);

      expect(mockJwtService.verify).toHaveBeenCalledWith(mockJwtToken);
    });
  });

  describe('Race Conditions and Concurrent Requests', () => {
    it('should handle multiple concurrent requests independently', async () => {
      const authMiddleware = await importAuthMiddleware();
      
      const contexts = [
        createMockContext({ 'Authorization': 'Bearer token-1' }),
        createMockContext({ 'Authorization': 'Bearer token-2' }),
        createMockContext({ 'Authorization': 'Bearer token-3' }),
      ];

      mockJwtService.verify
        .mockReturnValueOnce({ valid: true, payload: { sub: 'user-1', email: 'one@example.com' } })
        .mockReturnValueOnce({ valid: true, payload: { sub: 'user-2', email: 'two@example.com' } })
        .mockReturnValueOnce({ valid: false, reason: 'invalid' });

       const results = await Promise.all(
        contexts.map(ctx => authMiddleware(mockJwtService.verify)(ctx, ctx.next))
      );

      // First two should have called next(), third should have returned 401
      expect(contexts[0].next).toHaveBeenCalled();
      expect(contexts[1].next).toHaveBeenCalled();
      expect(contexts[2].next).not.toHaveBeenCalled();
      expect(contexts[2].status).toBe(401);
    });
  });
});
