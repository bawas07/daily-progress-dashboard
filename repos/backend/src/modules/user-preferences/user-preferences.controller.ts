import type { Context } from 'hono';
import type { UserPreferencesService, UserPreferencesData, UpdateUserPreferencesData } from './services/user.preferences.service';
import { createSuccessResponse, createErrorResponse, validationError, serverError } from '../../shared/response/response.helper';
import { updatePreferencesSchema } from '../../shared/validation/validation.schemas';


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
        console.error('Error getting preferences:', error);
        return c.json(serverError('Internal server error'), 500);
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

        // Parse request body
        const body = await c.req.json();

        // Validate request body
        const validationResult = updatePreferencesSchema.safeParse(body);
        if (!validationResult.success) {
          const errors: Record<string, string[]> = {};
          const fieldErrors = validationResult.error.flatten().fieldErrors;
          for (const [key, value] of Object.entries(fieldErrors)) {
            errors[key] = Array.isArray(value) ? value : [];
          }
          return c.json(validationError(errors), 400);
        }

        // Resolve service and update preferences
        // Zod already validated the type, no need for type assertion
        const updatedPreferences = await this.userPreferencesService.updatePreferences(
          userId,
          validationResult.data
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

        console.error('Error updating preferences:', error);
        return c.json(serverError('Internal server error'), 500);
      }
    };
  }
}

// Export singleton instance for convenience

