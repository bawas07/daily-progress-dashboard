import type { Context } from 'hono';
import type { AuthService, LoginData, RegisterData, LoginResult, AuthResult } from './services/auth.service';
import { createSuccessResponse, createErrorResponse, validationError, serverError } from '../../shared/response/response.helper';
import { loginSchema, registerSchema } from '../../shared/validation/validation.schemas';

/**
 * Auth Controller handles authentication-related HTTP endpoints
 */
export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Login handler - authenticates user and returns JWT token
   * POST /api/auth/login
   */
  login() {
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

        const result: LoginResult = await this.authService.login(loginData);

        return c.json(
          createSuccessResponse('S001', 'Login successful', {
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken,
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
  register() {
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

        const result: AuthResult = await this.authService.register(registerData);

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
   * Refresh token handler - rotates refresh token and issues new access token
   * POST /api/auth/refresh
   */
  refresh() {
    return async (c: Context): Promise<Response> => {
      try {
        const body = await c.req.json();

        if (!body.refreshToken || typeof body.refreshToken !== 'string') {
          return c.json(
            createErrorResponse('E001', 'Validation failed', {
              refreshToken: ['Required string']
            }),
            400
          );
        }

        const result = await this.authService.refreshToken(body.refreshToken);

        return c.json(
          createSuccessResponse('S001', 'Token refreshed', result),
          200
        );
      } catch (error) {
        if (error instanceof Error && error.message === 'Invalid refresh token') {
          return c.json(
            createErrorResponse('E001', 'Invalid refresh token'),
            401
          );
        }
        if (error instanceof Error && error.message === 'User not found') {
          return c.json(
            createErrorResponse('E004', 'User not found'),
            404
          );
        }
        return c.json(serverError('Internal server error'), 500);
      }
    };
  }

  /**
   * Revoke token handler - logs user out by invalidating refresh token
   * POST /api/auth/revoke
   */
  revoke() {
    return async (c: Context): Promise<Response> => {
      try {
        const body = await c.req.json();

        if (!body.refreshToken || typeof body.refreshToken !== 'string') {
          return c.json(
            createErrorResponse('E001', 'Validation failed', {
              refreshToken: ['Required string']
            }),
            400
          );
        }

        await this.authService.revokeToken(body.refreshToken);

        return c.json(
          createSuccessResponse('S001', 'Token revoked successfully', {}),
          200
        );
      } catch (error) {
        return c.json(serverError('Internal server error'), 500);
      }
    };
  }

  /**
   * Get current user handler - returns authenticated user data
   * GET /api/auth/me (protected)
   */
  getMe() {
    return async (c: Context): Promise<Response> => {
      try {
        const userId = c.get('userId');

        if (!userId) {
          return c.json(
            createErrorResponse('E004', 'Unauthorized'),
            401
          );
        }

        const result = await this.authService.getProfile(userId);

        return c.json(
          createSuccessResponse('S001', 'User retrieved successfully', {
            user: result.user,
          }),
          200
        );
      } catch (error) {
        if (error instanceof Error && error.message === 'User not found') {
          return c.json(
            createErrorResponse('E004', 'User not found'),
            404
          );
        }
        return c.json(serverError('Internal server error'), 500);
      }
    };
  }

}

// Export singleton instance for convenience

