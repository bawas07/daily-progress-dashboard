import { Context, Next } from 'hono';

/**
 * Auth Middleware for JWT verification
 *
 * Extracts and validates Bearer tokens from Authorization header,
 * verifies JWT signatures and expiration, and sets user context on
 * successful authentication.
 */

export interface AuthContext {
  user: { sub: string; email: string } | null;
  authValid: boolean;
  authReason?: 'expired' | 'invalid' | 'missing' | 'error';
}

/**
 * Extract and parse the user from an Authorization header
 */
export function extractUserFromToken(authHeader: string | null): {
  valid: boolean;
  user?: { sub: string; email: string };
  reason?: 'missing' | 'invalid_format' | 'expired' | 'invalid' | 'error';
} {
  // Check if header is missing or null
  if (!authHeader) {
    return { valid: false, reason: 'missing' };
  }

  // Check Bearer format
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!bearerMatch) {
    return { valid: false, reason: 'invalid_format' };
  }

  const token = bearerMatch[1];

  // Check if token is empty
  if (!token || token.trim() === '') {
    return { valid: false, reason: 'invalid_format' };
  }

  return { valid: false, reason: 'invalid' };
}

/**
 * Create the auth middleware function
 * Takes a verify function (for dependency injection in tests)
 */
export function authMiddleware(verify: (token: string) => { valid: boolean; payload?: { sub: string; email: string }; reason?: string }) {
  return async (c: Context, next: Next): Promise<void> => {
    const authHeader = c.req.header('Authorization');

    // Check if Authorization header exists
    if (!authHeader) {
      c.json({
        code: 'E004',
        message: 'Authorization header is required',
        data: { details: {} },
      }, 401);
      return;
    }

    // Check Bearer format
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!bearerMatch) {
      c.json({
        code: 'E004',
        message: 'Invalid authorization format. Use: Bearer <token>',
        data: { details: {} },
      }, 401);
      return;
    }

    const token = bearerMatch[1];

    // Check if token is empty
    if (!token || token.trim() === '') {
      c.json({
        code: 'E004',
        message: 'Invalid or expired token',
        data: { details: {} },
      }, 401);
      return;
    }

    // Verify the token
    const result = verify(token);

    if (!result.valid) {
      // Handle different error cases
      let message = 'Invalid or expired token';

      if (result.reason === 'expired') {
        message = 'Token has expired';
      } else if (result.reason === 'invalid') {
        message = 'Invalid token';
      }

      c.json({
        code: 'E004',
        message,
        data: { details: {} },
      }, 401);
      return;
    }

    // Token is valid - set user context
    if (result.payload) {
      // Map sub to id for downstream handlers (tests expect 'id')
      c.set('user', {
        id: result.payload.sub,
        email: result.payload.email,
      });
    }
    c.set('authValid', true);

    await next();
  };
}

/**
 * Create auth middleware using the container's JwtService
 * Use this in production code
 */
export function createAuthMiddleware() {
  const { container } = require('./container');
  const { JwtService } = require('./jwt/jwt.service');

  // Ensure JwtService is registered
  if (!container.has('JwtService')) {
    container.register('JwtService', JwtService);
  }

  type JwtServiceVerify = (token: string) => { valid: boolean; payload?: { sub: string; email: string }; reason?: string };
  const jwtService = container.resolve('JwtService') as { verify: JwtServiceVerify };

  return authMiddleware(jwtService.verify.bind(jwtService));
}

// Extend Hono's ContextVariableMap for type safety
declare module 'hono' {
  interface ContextVariableMap {
    user: { id: string; email: string };
    authValid: boolean;
  }
}
