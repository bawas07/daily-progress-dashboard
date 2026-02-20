import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore, useUserPreferencesStore } from '@/shared/stores'
import { applyTheme } from '@/composables/useTheme'
import './index.css'

// Register service worker for PWA
import { registerSW } from 'virtual:pwa-register'

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined

if (import.meta.env.PROD) {
  updateSW = registerSW({
    onNeedRefresh() {
      // Service worker update available
      // Show a notification to the user
      if (confirm('A new version is available. Reload to update?')) {
        updateSW?.(true)
      }
    },
    onOfflineReady() {
      // App is ready to work offline
      console.log('App is ready to work offline')
    },
    onRegistered(registration) {
      // Service worker registered successfully
      console.log('Service worker registered:', registration)

      // Check for updates every hour
      if (registration) {
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error('Service worker registration failed:', error)
    }
  })
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth store once at app startup
const authStore = useAuthStore()
authStore.initialize()

// Restore preferences + theme before initial render
const preferencesStore = useUserPreferencesStore()
preferencesStore.initializeFromStorage()
applyTheme(preferencesStore.theme)

app.mount('#app')
