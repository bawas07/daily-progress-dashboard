import { ref, computed, type Ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/shared/types'

// Auth Store using composition API pattern
export const useAuthStore = defineStore('auth', () => {
  // State
  const user: Ref<User | null> = ref(null)
  const token: Ref<string | null> = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)

  // Actions
  function setUser(userData: User) {
    user.value = userData
  }

  function setToken(tokenData: string) {
    token.value = tokenData
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', tokenData)
    }
  }

  function logout() {
    user.value = null
    token.value = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  function initialize() {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        token.value = storedToken
      }
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    setUser,
    setToken,
    logout,
    initialize,
  }
})

// Dashboard Store (placeholder for future)
export const useDashboardStore = defineStore('dashboard', () => {
  const data: Ref<unknown> = ref(null)
  const loading: Ref<boolean> = ref(false)
  const error: Ref<string | null> = ref(null)

  return {
    data,
    loading,
    error,
  }
})

// Export user preferences store
export { useUserPreferencesStore } from './user-preferences.store'
