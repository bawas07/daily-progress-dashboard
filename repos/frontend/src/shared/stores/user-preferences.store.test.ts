import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserPreferencesStore } from './user-preferences.store'
import * as api from '@/shared/api/user-preferences.api'
import type { UserPreferences, UpdatePreferencesData } from '@/shared/types'

// Mock the API
vi.mock('@/shared/api/user-preferences.api', () => ({
  userPreferencesApi: {
    getPreferences: vi.fn(),
    updatePreferences: vi.fn(),
  },
}))

// Mock localStorage utilities
vi.mock('@/shared/utils', () => ({
  getStorage: vi.fn(),
  setStorage: vi.fn(),
  removeStorage: vi.fn(),
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

describe('useUserPreferencesStore', () => {
  let store: ReturnType<typeof useUserPreferencesStore>

  beforeEach(() => {
    // Create fresh pinia instance
    setActivePinia(createPinia())
    store = useUserPreferencesStore()
    
    // Clear all mocks
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      expect(store.preferences).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should provide default values from getters when no preferences are set', () => {
      expect(store.theme).toBe('auto')
      expect(store.timezone).toBe('UTC')
      expect(store.defaultActiveDays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri'])
      expect(store.enableNotifications).toBe(false)
      expect(store.isInitialized).toBe(false)
    })
  })

  describe('initializeFromStorage', () => {
    const { getStorage } = vi.mocked(require('@/shared/utils'))

    it('should load preferences from localStorage', () => {
      getStorage.mockReturnValue(mockPreferences)

      const result = store.initializeFromStorage()

      expect(result).toBe(true)
      expect(store.preferences).toEqual(mockPreferences)
      expect(getStorage).toHaveBeenCalledWith('user_preferences', null)
    })

    it('should return false when no preferences in storage', () => {
      getStorage.mockReturnValue(null)

      const result = store.initializeFromStorage()

      expect(result).toBe(false)
      expect(store.preferences).toBeNull()
    })

    it('should update getters after loading from storage', () => {
      getStorage.mockReturnValue(mockPreferences)

      store.initializeFromStorage()

      expect(store.theme).toBe('dark')
      expect(store.timezone).toBe('America/New_York')
      expect(store.defaultActiveDays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri'])
      expect(store.enableNotifications).toBe(true)
      expect(store.isInitialized).toBe(true)
    })
  })

  describe('fetchPreferences', () => {
    const { getPreferences } = vi.mocked(api)
    const { setStorage } = vi.mocked(require('@/shared/utils'))

    it('should fetch preferences from API successfully', async () => {
      getPreferences.mockResolvedValue(mockPreferences)

      await store.fetchPreferences()

      expect(getPreferences).toHaveBeenCalledTimes(1)
      expect(store.preferences).toEqual(mockPreferences)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(setStorage).toHaveBeenCalledWith('user_preferences', mockPreferences)
    })

    it('should handle API errors', async () => {
      const error = new Error('Network error')
      getPreferences.mockRejectedValue(error)

      await expect(store.fetchPreferences()).rejects.toThrow('Network error')

      expect(store.loading).toBe(false)
      expect(store.error).toBe('Network error')
    })

    it('should set loading state during fetch', async () => {
      getPreferences.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockPreferences), 100)
          })
      )

      const fetchPromise = store.fetchPreferences()
      expect(store.loading).toBe(true)

      await fetchPromise
      expect(store.loading).toBe(false)
    })
  })

  describe('updatePreferences', () => {
    const { updatePreferences } = vi.mocked(api)
    const { setStorage } = vi.mocked(require('@/shared/utils'))

    it('should update preferences successfully', async () => {
      const updatedPrefs = { ...mockPreferences, theme: 'light' as const }
      updatePreferences.mockResolvedValue(updatedPrefs)

      await store.updatePreferences({ theme: 'light' })

      expect(updatePreferences).toHaveBeenCalledWith({ theme: 'light' })
      expect(store.preferences).toEqual(updatedPrefs)
      expect(store.theme).toBe('light')
      expect(setStorage).toHaveBeenCalledWith('user_preferences', updatedPrefs)
    })

    it('should handle partial updates', async () => {
      const updatedPrefs = { ...mockPreferences, enableNotifications: false }
      updatePreferences.mockResolvedValue(updatedPrefs)

      await store.updatePreferences({ enableNotifications: false })

      expect(updatePreferences).toHaveBeenCalledWith({ enableNotifications: false })
      expect(store.enableNotifications).toBe(false)
    })

    it('should handle update errors', async () => {
      const error = new Error('Update failed')
      updatePreferences.mockRejectedValue(error)

      await expect(
        store.updatePreferences({ theme: 'light' })
      ).rejects.toThrow('Update failed')

      expect(store.error).toBe('Update failed')
    })
  })

  describe('setTheme', () => {
    const { setStorage } = vi.mocked(require('@/shared/utils'))

    it('should set theme when preferences exist', () => {
      store.preferences = mockPreferences

      store.setTheme('light')

      expect(store.preferences.theme).toBe('light')
      expect(setStorage).toHaveBeenCalledWith('user_preferences', mockPreferences)
    })

    it('should not set theme when preferences are null', () => {
      store.preferences = null

      store.setTheme('light')

      expect(store.preferences).toBeNull()
      expect(setStorage).not.toHaveBeenCalled()
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      store.error = 'Some error'

      store.clearError()

      expect(store.error).toBeNull()
    })
  })

  describe('clearPreferences', () => {
    const { removeStorage } = vi.mocked(require('@/shared/utils'))

    it('should clear preferences and storage', () => {
      store.preferences = mockPreferences

      store.clearPreferences()

      expect(store.preferences).toBeNull()
      expect(removeStorage).toHaveBeenCalledWith('user_preferences')
    })
  })

  describe('getters reactivity', () => {
    it('should react to preferences changes', () => {
      expect(store.theme).toBe('auto')

      store.preferences = mockPreferences

      expect(store.theme).toBe('dark')
      expect(store.timezone).toBe('America/New_York')
      expect(store.defaultActiveDays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri'])
      expect(store.enableNotifications).toBe(true)
    })
  })
})
