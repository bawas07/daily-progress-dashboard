import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware } from '../../../../src/shared/middleware/auth.middleware';
import { JwtService } from '../../../../src/shared/jwt/jwt.service';
import { Container } from '../../../../src/shared/container';

describe('authMiddleware', () => {
  let jwtService: JwtService;
  let validToken: string;
  let expiredToken: string;
  let invalidToken: string;
  let container: Container;

  beforeEach(() => {
    // Create a fresh container for each test
    container = new Container();
    jwtService = new JwtService();
    jwtService.container = container;
    container.register('JwtService', jwtService);

    // Generate test tokens
    validToken = jwtService.sign({
      sub: 'user-123',
      email: 'test@example.com',
    });

    // Generate expired token (using a very short expiration)
    expiredToken = jwtService.signWithExpiry(
      {
        sub: 'user-456',
        email: 'expired@example.com',
      },
      '0s' // Expires immediately
    );

    // Invalid token (malformed JWT)
    invalidToken = 'invalid.token.here';
  });

  describe('valid token', () => {
    it('should attach userId and userEmail to context and proceed', async () => {
      const app = new Hono();

      app.use('/protected', authMiddleware(container));
      app.get('/protected', (c) => {
        const userId = c.get('userId');
        const userEmail = c.get('userEmail');
        return c.json({ userId, userEmail });
      });

      const response = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.userId).toBe('user-123');
      expect(json.userEmail).toBe('test@example.com');
    });
  });

  describe('missing Authorization header', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const app = new Hono();

      app.use('/protected', authMiddleware(container));
      app.get('/protected', (c) => c.json({ message: 'Should not reach here' }));

      const response = await app.request('/protected');

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.code).toBe('E002');
      expect(json.message).toBe('Authorization header is required');
    });
  });

  describe('invalid token format', () => {
    it('should return 401 when Authorization header does not start with "Bearer "', async () => {
      const app = new Hono();

      app.use('/protected', authMiddleware(container));
      app.get('/protected', (c) => c.json({ message: 'Should not reach here' }));

      const response = await app.request('/protected', {
        headers: {
          Authorization: validToken, // Missing "Bearer " prefix
        },
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.code).toBe('E002');
      expect(json.message).toBe('Invalid authorization format. Use: Bearer <token>');
    });

    it('should return 401 when token is empty after "Bearer "', async () => {
      const app = new Hono();

      app.use('/protected', authMiddleware(container));
      app.get('/protected', (c) => c.json({ message: 'Should not reach here' }));

      const response = await app.request('/protected', {
        headers: {
          Authorization: 'Bearer ', // Empty token
        },
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.code).toBe('E002');
      expect(json.message).toBe('Invalid authorization format. Use: Bearer <token>');
    });

    it('should return 401 when token is only whitespace', async () => {
      const app = new Hono();

      app.use('/protected', authMiddleware(container));
      app.get('/protected', (c) => c.json({ message: 'Should not reach here' }));

      const response = await app.request('/protected', {
        headers: {
          Authorization: 'Bearer   ', // Whitespace token
        },
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.code).toBe('E002');
      expect(json.message).toBe('Invalid authorization format. Use: Bearer <token>');
    });
  });

  describe('invalid token', () => {
    it('should return 401 when token is malformed', async () => {
      const app = new Hono();

      app.use('/protected', authMiddleware(container));
      app.get('/protected', (c) => c.json({ message: 'Should not reach here' }));

      const response = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${invalidToken}`,
        },
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.code).toBe('E002');
      expect(json.message).toBe('Invalid token');
    });

    it('should return 401 when token has invalid signature', async () => {
      // Take a valid token and modify it to break signature
      const tamperedToken = validToken.slice(0, -5) + '12345';

      const app = new Hono();

      app.use('/protected', authMiddleware(container));
      app.get('/protected', (c) => c.json({ message: 'Should not reach here' }));

      const response = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${tamperedToken}`,
        },
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.code).toBe('E002');
      expect(json.message).toBe('Invalid token');
    });
  });

  describe('expired token', () => {
    it('should return 401 when token has expired', async () => {
      const app = new Hono();

      app.use('/protected', authMiddleware(container));
      app.get('/protected', (c) => c.json({ message: 'Should not reach here' }));

      const response = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${expiredToken}`,
        },
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.code).toBe('E002');
      expect(json.message).toBe('Token has expired');
    });
  });

  describe('edge cases', () => {
    it('should handle case where Bearer prefix has mixed case', async () => {
      const app = new Hono();

      app.use('/protected', authMiddleware(container));
      app.get('/protected', (c) => c.json({ message: 'Should not reach here' }));

      // Test lowercase "bearer"
      const response1 = await app.request('/protected', {
        headers: {
          Authorization: `bearer ${validToken}`,
        },
      });

      expect(response1.status).toBe(401);
      const json1 = await response1.json();
      expect(json1.message).toBe('Invalid authorization format. Use: Bearer <token>');

      // Test mixed case "BeArEr"
      const response2 = await app.request('/protected', {
        headers: {
          Authorization: `BeArEr ${validToken}`,
        },
      });

      expect(response2.status).toBe(401);
      const json2 = await response2.json();
      expect(json2.message).toBe('Invalid authorization format. Use: Bearer <token>');
    });

    it('should handle extra spaces in Bearer prefix', async () => {
      const app = new Hono();

      app.use('/protected', authMiddleware(container));
      app.get('/protected', (c) => {
        const userId = c.get('userId');
        return c.json({ userId });
      });

      // Extra space after "Bearer"
      const response = await app.request('/protected', {
        headers: {
          Authorization: `Bearer  ${validToken}`, // Two spaces
        },
      });

      // Should still work - token extraction handles leading whitespace
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.userId).toBe('user-123');
    });

    it('should work with different user IDs and emails', async () => {
      const customToken = jwtService.sign({
        sub: 'custom-user-789',
        email: 'custom@test.com',
      });

      const app = new Hono();

      app.use('/protected', authMiddleware(container));
      app.get('/protected', (c) => {
        const userId = c.get('userId');
        const userEmail = c.get('userEmail');
        return c.json({ userId, userEmail });
      });

      const response = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${customToken}`,
        },
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.userId).toBe('custom-user-789');
      expect(json.userEmail).toBe('custom@test.com');
    });
  });

  describe('integration with Hono app', () => {
    it('should work with multiple middleware', async () => {
      const app = new Hono();

      // Custom middleware that runs before auth
      app.use('*', async (c, next) => {
        c.set('preAuth', 'executed');
        await next();
      });

      app.use('/protected', authMiddleware(container));

      // Custom middleware that runs after auth
      app.use('/protected', async (c, next) => {
        const userId = c.get('userId');
        c.set('postAuth', `user-${userId}`);
        await next();
      });

      app.get('/protected', (c) => {
        return c.json({
          preAuth: c.get('preAuth'),
          postAuth: c.get('postAuth'),
          userId: c.get('userId'),
        });
      });

      const response = await app.request('/protected', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.preAuth).toBe('executed');
      expect(json.postAuth).toBe('user-user-123');
      expect(json.userId).toBe('user-123');
    });

    it('should not affect unprotected routes', async () => {
      const app = new Hono();

      app.use('/protected', authMiddleware(container));
      app.get('/protected', (c) => c.json({ message: 'Protected' }));

      app.get('/public', (c) => c.json({ message: 'Public' }));

      // Public route should work without auth
      const publicResponse = await app.request('/public');
      expect(publicResponse.status).toBe(200);
      const publicJson = await publicResponse.json();
      expect(publicJson.message).toBe('Public');

      // Protected route should require auth
      const protectedResponse = await app.request('/protected');
      expect(protectedResponse.status).toBe(401);
    });
  });
});
