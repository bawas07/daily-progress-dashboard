import { describe, it, expect, beforeEach, vi } from 'vitest'
import { userPreferencesApi } from './user-preferences.api'
import { httpClient } from '@/shared/utils/http-client'
import type { UserPreferences } from '@/shared/types'

// Mock HTTP client
vi.mock('@/shared/utils/http-client', () => ({
  httpClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

const mockPreferences: UserPreferences = {
  id: '123',
  userId: 'user-1',
  theme: 'dark',
  timezone: 'America/New_York',
  defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  enableNotifications: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('userPreferencesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPreferences', () => {
    it('should fetch user preferences', async () => {
      vi.mocked(httpClient.get).mockResolvedValue({
        data: {
          data: mockPreferences,
        },
      })

      const result = await userPreferencesApi.getPreferences()

      expect(httpClient.get).toHaveBeenCalledWith('/user/preferences')
      expect(result).toEqual(mockPreferences)
    })

    it('should handle API errors', async () => {
      const error = new Error('Network error')
      vi.mocked(httpClient.get).mockRejectedValue(error)

      await expect(userPreferencesApi.getPreferences()).rejects.toThrow(
        'Network error'
      )
    })
  })

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const updateData = {
        theme: 'light' as const,
        timezone: 'Europe/London',
      }

      const updatedPrefs = {
        ...mockPreferences,
        theme: 'light' as const,
        timezone: 'Europe/London',
      }

      vi.mocked(httpClient.put).mockResolvedValue({
        data: {
          data: updatedPrefs,
        },
      })

      const result = await userPreferencesApi.updatePreferences(updateData)

      expect(httpClient.put).toHaveBeenCalledWith(
        '/user/preferences',
        updateData
      )
      expect(result).toEqual(updatedPrefs)
    })

    it('should handle partial updates', async () => {
      const updateData = {
        enableNotifications: false,
      }

      const updatedPrefs = {
        ...mockPreferences,
        enableNotifications: false,
      }

      vi.mocked(httpClient.put).mockResolvedValue({
        data: {
          data: updatedPrefs,
        },
      })

      const result = await userPreferencesApi.updatePreferences(updateData)

      expect(httpClient.put).toHaveBeenCalledWith(
        '/user/preferences',
        updateData
      )
      expect(result.enableNotifications).toBe(false)
    })

    it('should handle update errors', async () => {
      const error = new Error('Update failed')
      vi.mocked(httpClient.put).mockRejectedValue(error)

      await expect(
        userPreferencesApi.updatePreferences({ theme: 'light' })
      ).rejects.toThrow('Update failed')
    })
  })
})
