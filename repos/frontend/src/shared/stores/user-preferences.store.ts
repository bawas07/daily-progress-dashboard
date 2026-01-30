import { ref, computed, type Ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserPreferences, UpdatePreferencesData } from '@/shared/types'
import { userPreferencesApi } from '@/shared/api/user-preferences.api'
import { getStorage, setStorage, removeStorage } from '@/shared/utils'

const STORAGE_KEY = 'user_preferences'

/**
 * User Preferences Store
 * Manages user preferences state with localStorage persistence
 */
export const useUserPreferencesStore = defineStore('userPreferences', () => {
  // State
  const preferences: Ref<UserPreferences | null> = ref(null)
  const loading: Ref<boolean> = ref(false)
  const error: Ref<string | null> = ref(null)

  // Getters
  const theme = computed(() => preferences.value?.theme ?? 'auto')
  
  const timezone = computed(() => preferences.value?.timezone ?? 'UTC')
  
  const defaultActiveDays = computed(
    () => preferences.value?.defaultActiveDays ?? ['mon', 'tue', 'wed', 'thu', 'fri']
  )
  
  const enableNotifications = computed(
    () => preferences.value?.enableNotifications ?? false
  )

  const isInitialized = computed(() => preferences.value !== null)

  // Actions

  /**
   * Initialize preferences from localStorage
   * Returns true if preferences were loaded from storage
   */
  function initializeFromStorage(): boolean {
    if (typeof window === 'undefined') return false

    const stored = getStorage<UserPreferences | null>(STORAGE_KEY, null)
    if (stored) {
      preferences.value = stored
      return true
    }
    return false
  }

  /**
   * Fetch user preferences from API
   */
  async function fetchPreferences(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = await userPreferencesApi.getPreferences()
      preferences.value = data
      // Persist to localStorage
      setStorage(STORAGE_KEY, data)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch preferences'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user preferences
   */
  async function updatePreferences(
    data: UpdatePreferencesData
  ): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const updated = await userPreferencesApi.updatePreferences(data)
      preferences.value = updated
      // Persist to localStorage
      setStorage(STORAGE_KEY, updated)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update preferences'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Set theme (local only, persists until next sync)
   */
  function setTheme(theme: 'auto' | 'light' | 'dark'): void {
    if (preferences.value) {
      preferences.value.theme = theme
      setStorage(STORAGE_KEY, preferences.value)
    }
  }

  /**
   * Clear error state
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * Clear preferences (e.g., on logout)
   */
  function clearPreferences(): void {
    preferences.value = null
    removeStorage(STORAGE_KEY)
  }

  return {
    // State
    preferences,
    loading,
    error,
    
    // Getters
    theme,
    timezone,
    defaultActiveDays,
    enableNotifications,
    isInitialized,
    
    // Actions
    initializeFromStorage,
    fetchPreferences,
    updatePreferences,
    setTheme,
    clearError,
    clearPreferences,
  }
})
