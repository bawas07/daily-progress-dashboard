import type { Context } from 'hono';
import type { AuthService, LoginData, RegisterData, LoginResult, AuthResult } from './services/auth.service';
import { createSuccessResponse, createErrorResponse, validationError, serverError } from '../../shared/response/response.helper';
import { loginSchema, registerSchema } from '../../shared/validation/validation.schemas';

/**
 * Auth Controller handles authentication-related HTTP endpoints
 */
export class AuthController {
  /**
   * Login handler - authenticates user and returns JWT token
   * POST /api/auth/login
   */
  login(authService: AuthService) {
    return async (c: Context): Promise<Response> => {
      try {
        const body = await c.req.json();

        // Validate request body
        const validationResult = loginSchema.safeParse(body);
        if (!validationResult.success) {
          const errors: Record<string, string[]> = {};
          const fieldErrors = validationResult.error.flatten().fieldErrors;
          for (const [key, value] of Object.entries(fieldErrors)) {
            errors[key] = Array.isArray(value) ? value : [];
          }
          return c.json(validationError(errors), 400);
        }

        const loginData: LoginData = {
          email: validationResult.data.email.toLowerCase().trim(),
          password: validationResult.data.password,
        };

        const result: LoginResult = await authService.login(loginData);

        return c.json(
          createSuccessResponse('S001', 'Login successful', {
            user: result.user,
            token: result.token,
          }),
          200
        );
      } catch (error) {
        if (error instanceof Error && error.message === 'Invalid email or password') {
          return c.json(
            createErrorResponse('E001', 'Invalid email or password'),
            401
          );
        }
        return c.json(serverError('Internal server error'), 500);
      }
    };
  }

  /**
   * Register handler - creates new user with default preferences
   * POST /api/auth/register
   */
  register(authService: AuthService) {
    return async (c: Context): Promise<Response> => {
      try {
        const body = await c.req.json();

        // Validate request body
        const validationResult = registerSchema.safeParse(body);
        if (!validationResult.success) {
          const errors: Record<string, string[]> = {};
          const fieldErrors = validationResult.error.flatten().fieldErrors;
          for (const [key, value] of Object.entries(fieldErrors)) {
            errors[key] = Array.isArray(value) ? value : [];
          }
          return c.json(validationError(errors), 400);
        }

        const registerData: RegisterData = {
          name: validationResult.data.name,
          email: validationResult.data.email.toLowerCase().trim(),
          password: validationResult.data.password,
        };

        const result: AuthResult = await authService.register(registerData);

        return c.json(
          createSuccessResponse('S002', 'Registration successful', {
            user: result.user,
            preferences: result.preferences,
          }),
          201
        );
      } catch (error) {
        if (error instanceof Error && error.message === 'Email already registered') {
          return c.json(
            createErrorResponse('E002', 'Email already registered'),
            400
          );
        }
        return c.json(serverError('Internal server error'), 500);
      }
    };
  }

  /**
   * Get current user handler - returns authenticated user data
   * GET /api/auth/me (protected)
   */
  getMe(_authService: AuthService) {
    return async (c: Context): Promise<Response> => {
      try {
        const authHeader = c.req.header('Authorization');

        if (!authHeader) {
          return c.json(
            createErrorResponse('E004', 'Authorization header is required'),
            401
          );
        }

        if (!authHeader.startsWith('Bearer ')) {
          return c.json(
            createErrorResponse('E004', 'Invalid authorization format. Use: Bearer <token>'),
            401
          );
        }

        const token = authHeader.substring(7);

        if (!token) {
          return c.json(
            createErrorResponse('E004', 'Invalid authorization format. Use: Bearer <token>'),
            401
          );
        }

        const user = c.get('user');

        if (!user) {
          return c.json(
            createErrorResponse('E004', 'Invalid or expired token'),
            401
          );
        }

        return c.json(
          createSuccessResponse('S001', 'User retrieved successfully', {
            user,
          }),
          200
        );
      } catch (error) {
        return c.json(serverError('Internal server error'), 500);
      }
    };
  }

}

// Export singleton instance for convenience
export const authController = new AuthController();
