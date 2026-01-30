/**
 * useServiceWorker Composable
 * Provides service worker update management for PWA functionality
 */

import { ref, computed, onMounted } from 'vue'
import type { ComputedRef } from 'vue'

// ============================================================================
// Types
// ============================================================================

export interface UseServiceWorkerReturn {
  // State
  needRefresh: ComputedRef<boolean>
  offlineReady: ComputedRef<boolean>
  registrationError: ComputedRef<Error | null>

  // Actions
  updateServiceWorker: () => Promise<void>
  closePrompt: () => void
}

// ============================================================================
// State
// ============================================================================

const needRefreshRef = ref(false)
const offlineReadyRef = ref(false)
const registrationErrorRef = ref<Error | null>(null)

let updateSWFunction: ((reloadPage?: boolean) => Promise<void>) | null = null

// ============================================================================
// Event Handlers
// ============================================================================

function handleNeedRefresh() {
  needRefreshRef.value = true
}

function handleOfflineReady() {
  offlineReadyRef.value = true
  console.log('App is ready to work offline')
}

function handleRegistered(registration: ServiceWorkerRegistration | undefined) {
  console.log('Service worker registered:', registration)

  // Check for updates every hour
  if (registration) {
    setInterval(() => {
      registration.update().catch((error) => {
        console.error('Service worker update check failed:', error)
      })
    }, 60 * 60 * 1000)
  }
}

function handleRegisterError(error: Error) {
  console.error('Service worker registration failed:', error)
  registrationErrorRef.value = error
}

// ============================================================================
// Core Composable
// ============================================================================

/**
 * Vue composable for managing service worker updates and PWA functionality
 *
 * @example
 * ```typescript
 * const { needRefresh, updateServiceWorker, closePrompt } = useServiceWorker()
 *
 * // Use in template
 * <div v-if="needRefresh" class="update-banner">
 *   <p>A new version is available!</p>
 *   <button @click="updateServiceWorker">Update</button>
 *   <button @click="closePrompt">Dismiss</button>
 * </div>
 * ```
 */
export function useServiceWorker(): UseServiceWorkerReturn {
  // =========================================================================
  // Computed State
  // =========================================================================

  /**
   * Whether a new service worker version is waiting to be activated
   */
  const needRefresh = computed(() => needRefreshRef.value)

  /**
   * Whether the app is ready to work offline
   */
  const offlineReady = computed(() => offlineReadyRef.value)

  /**
   * Any error that occurred during service worker registration
   */
  const registrationError = computed(() => registrationErrorRef.value)

  // =========================================================================
  // Actions
  // =========================================================================

  /**
   * Trigger the service worker update and reload the page
   */
  async function updateServiceWorker(): Promise<void> {
    if (!updateSWFunction) {
      console.warn('Service worker update function not available')
      return
    }

    try {
      await updateSWFunction(true)
      needRefreshRef.value = false
    } catch (error) {
      console.error('Failed to update service worker:', error)
      throw error
    }
  }

  /**
   * Dismiss the update prompt (hides the banner until next update)
   */
  function closePrompt(): void {
    needRefreshRef.value = false
  }

  // =========================================================================
  // Lifecycle
  // =========================================================================

  onMounted(async () => {
    // Import registerSW dynamically to avoid issues with SSR/build
    try {
      const { registerSW } = await import('virtual:pwa-register')

      updateSWFunction = registerSW({
        onNeedRefresh: handleNeedRefresh,
        onOfflineReady: handleOfflineReady,
        onRegistered: handleRegistered,
        onRegisterError: handleRegisterError,
      })
    } catch (error) {
      console.error('Failed to register service worker:', error)
      registrationErrorRef.value = error as Error
    }
  })

  return {
    // State
    needRefresh,
    offlineReady,
    registrationError,

    // Actions
    updateServiceWorker,
    closePrompt,
  }
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Get the current service worker registration
 * Can be used outside of Vue components
 */
export async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    return registration ?? null
  } catch (error) {
    console.error('Failed to get service worker registration:', error)
    return null
  }
}

/**
 * Manually trigger a service worker update check
 * Can be used outside of Vue components
 */
export async function checkForUpdates(): Promise<boolean> {
  const registration = await getSWRegistration()

  if (!registration) {
    return false
  }

  try {
    await registration.update()
    return true
  } catch (error) {
    console.error('Failed to check for updates:', error)
    return false
  }
}
