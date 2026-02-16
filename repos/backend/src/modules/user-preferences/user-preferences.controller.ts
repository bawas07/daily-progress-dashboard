import type { Context } from 'hono';
import type { UserPreferencesService, UserPreferencesData, UpdateUserPreferencesData } from './services/user.preferences.service';
import { createSuccessResponse, createErrorResponse, serverError } from '../../shared/response/response.helper';


/**
 * UserPreferencesController handles user preferences HTTP endpoints
 */
export class UserPreferencesController {
  private userPreferencesService: UserPreferencesService;

  constructor(userPreferencesService: UserPreferencesService) {
    this.userPreferencesService = userPreferencesService;
  }

  /**
   * GET /api/user/preferences - Get user preferences
   * Protected by auth middleware
   */
  getPreferences() {
    return async (c: Context): Promise<Response> => {
      try {
        // Get userId from context (set by authMiddleware)
        const userId = c.get('userId') as string;

        // Resolve service and get preferences
        const preferences = await this.userPreferencesService.getPreferences(userId);

        return c.json(
          createSuccessResponse('S001', 'Preferences retrieved successfully', preferences),
          200
        );
      } catch (error) {
        throw error; // Let global error handler handle it
      }
    };
  }

  /**
   * PUT /api/user/preferences - Update user preferences
   * Protected by auth middleware
   */
  updatePreferences() {
    return async (c: Context): Promise<Response> => {
      try {
        // Get userId from context (set by authMiddleware)
        const userId = c.get('userId');

        if (!userId) {
          return c.json(
            createErrorResponse('E002', 'Unauthorized'),
            401
          );
        }

        // Get validated data from middleware, or parse body for backward compatibility
        let body = c.get('validatedData') as UpdateUserPreferencesData;
        if (!body) {
          body = await c.req.json();
        }

        // Resolve service and update preferences
        const updatedPreferences = await this.userPreferencesService.updatePreferences(
          userId,
          body
        );

        return c.json(
          createSuccessResponse('S002', 'Preferences updated successfully', updatedPreferences),
          200
        );
      } catch (error) {
        // Handle validation errors from service
        if (error instanceof Error && error.name === 'ValidationError') {
          return c.json(
            createErrorResponse('E003', error.message),
            400
          );
        }

        throw error; // Let global error handler handle it
      }
    };
  }
}

// Export singleton instance for convenience

