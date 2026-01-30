import type { Context, Next } from 'hono';
import { JwtService } from '../jwt/jwt.service';
import { Container, resolveService } from '../container';
import { createErrorResponse } from '../response/response.helper';

/**
 * Authentication Middleware
 *
 * Validates JWT tokens and attaches user information to the request context.
 *
 * Usage:
 *   app.use('/api/protected', authMiddleware);
 *
 * Expected Authorization header format:
 *   Authorization: Bearer <token>
 *
 * On success: Sets c.set('userId', userId) and c.set('userEmail', email)
 * On failure: Returns 401 with standardized error response
 */

/**
 * Creates an authentication middleware instance
 *
 * @param container - Dependency injection container (optional, uses global if not provided)
 * @returns Hono middleware function
 */
export function authMiddleware(container?: Container) {
  return async (c: Context, next: Next) => {
    // Extract Authorization header
    const authHeader = c.req.header('Authorization');

    // Check if Authorization header exists
    if (!authHeader) {
      return c.json(
        createErrorResponse('E002', 'Authorization header is required'),
        401
      );
    }

    // Check if header follows "Bearer <token>" format
    if (!authHeader.startsWith('Bearer ')) {
      return c.json(
        createErrorResponse('E002', 'Invalid authorization format. Use: Bearer <token>'),
        401
      );
    }

    // Extract token
    const token = authHeader.substring(7);

    // Check if token is empty
    if (!token || token.trim() === '') {
      return c.json(
        createErrorResponse('E002', 'Invalid authorization format. Use: Bearer <token>'),
        401
      );
    }

    // Verify token
    const jwtService = resolveService<JwtService>('JwtService', container);
    const result = jwtService.verify(token);

    // Handle verification failures
    if (!result.valid) {
      if (result.reason === 'expired') {
        return c.json(
          createErrorResponse('E002', 'Token has expired'),
          401
        );
      }

      if (result.reason === 'invalid') {
        return c.json(
          createErrorResponse('E002', 'Invalid token'),
          401
        );
      }

      // Unexpected error
      return c.json(
        createErrorResponse('E002', 'Token verification failed'),
        401
      );
    }

    // Token is valid - attach user info to context
    const userId = result.payload.sub;
    const userEmail = result.payload.email;

    c.set('userId', userId);
    c.set('userEmail', userEmail);

    // Continue to next middleware/handler
    await next();
  };
}

/**
 * Type extension for Hono context to include auth data
 *
 * Usage in route handlers:
 *   const userId = c.get('userId'); // string
 *   const userEmail = c.get('userEmail'); // string
 */
export type AuthContext = Context & {
  get: (key: 'userId' | 'userEmail') => string;
};
