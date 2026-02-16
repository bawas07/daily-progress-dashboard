import type { Context } from 'hono';
import type { AuthService, LoginData, RegisterData, LoginResult, AuthResult } from './services/auth.service';
import { createSuccessResponse, createErrorResponse, serverError } from '../../shared/response/response.helper';

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
        // Get validated data from middleware, or parse body for backward compatibility
        let body = c.get('validatedData') as { email: string; password: string };
        if (!body) {
          body = await c.req.json();
        }

        const loginData: LoginData = {
          email: body.email.toLowerCase().trim(),
          password: body.password,
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
        throw error; // Let global error handler handle it
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
        // Get validated data from middleware, or parse body for backward compatibility
        let body = c.get('validatedData') as { name: string; email: string; password: string };
        if (!body) {
          body = await c.req.json();
        }

        const registerData: RegisterData = {
          name: body.name,
          email: body.email.toLowerCase().trim(),
          password: body.password,
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
        throw error; // Let global error handler handle it
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
        // Get validated data from middleware, or parse body for backward compatibility
        let body = c.get('validatedData') as { refreshToken: string };
        if (!body) {
          body = await c.req.json();
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
        throw error; // Let global error handler handle it
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
        // Get validated data from middleware, or parse body for backward compatibility
        let body = c.get('validatedData') as { refreshToken: string };
        if (!body) {
          body = await c.req.json();
        }

        await this.authService.revokeToken(body.refreshToken);

        return c.json(
          createSuccessResponse('S001', 'Token revoked successfully', {}),
          200
        );
      } catch (error) {
        throw error; // Let global error handler handle it
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
        throw error; // Let global error handler handle it
      }
    };
  }

}

// Export singleton instance for convenience

