import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'

// Export auth store from features
export { useAuthStore } from '@/stores/auth.store'

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
