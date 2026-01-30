import { httpClient } from '@/shared/utils/http-client'
import type { UserPreferences, ApiSuccessResponse, UpdatePreferencesData } from '@/shared/types'

/**
 * User Preferences API Client
 * Handles all user preferences related API calls
 *
 * This client uses the backend's standardized API response format:
 * { data: T, message: string, code: string }
 */
export const userPreferencesApi = {
  /**
   * Get user preferences
   * GET /api/user/preferences
   *
   * @returns Promise<UserPreferences> - User preferences object
   * @throws Error - If the request fails
   */
  async getPreferences(): Promise<UserPreferences> {
    const response = await httpClient.get<ApiSuccessResponse<UserPreferences>>(
      '/user/preferences'
    )
    return response.data.data
  },

  /**
   * Update user preferences
   * PUT /api/user/preferences
   *
   * @param data - Partial preferences object with fields to update
   * @returns Promise<UserPreferences> - Updated preferences object
   * @throws Error - If the request fails
   */
  async updatePreferences(
    data: UpdatePreferencesData
  ): Promise<UserPreferences> {
    const response = await httpClient.put<ApiSuccessResponse<UserPreferences>>(
      '/user/preferences',
      data
    )
    return response.data.data
  },
}

// Re-export types for convenience
export type { UpdatePreferencesData }
