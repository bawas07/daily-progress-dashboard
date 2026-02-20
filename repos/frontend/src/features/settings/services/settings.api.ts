import { apiClient } from '@/shared/api'
import { API_ENDPOINTS } from '@/shared/services/endpoints'

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export const settingsApi = {
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload)
  },
}
