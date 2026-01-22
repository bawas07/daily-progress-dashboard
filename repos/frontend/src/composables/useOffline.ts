/**
 * useOffline Composable
 * Provides offline state management and sync functionality for Vue components
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ComputedRef } from 'vue'
import type { SyncActionType, SyncStatusInfo } from '@/shared/types/offline'

// ============================================================================
// Types
// ============================================================================

export interface UseOfflineReturn {
  // State (readonly computed)
  isOnline: ComputedRef<boolean>
  isSyncing: ComputedRef<boolean>
  pendingCount: ComputedRef<number>
  lastSyncTime: ComputedRef<Date | null>
  syncError: ComputedRef<string | null>

  // Actions
  syncNow: () => Promise<void>
  refreshStatus: () => Promise<void>
  enqueueSync: (entity: string, action: SyncActionType, data: Record<string, unknown>) => Promise<string>
}

// ============================================================================
// State
// ============================================================================

// Refs for reactive state
const isOnlineRef = ref(true)
const isSyncingRef = ref(false)
const pendingCountRef = ref(0)
const lastSyncTimeRef = ref<Date | null>(null)
const syncErrorRef = ref<string | null>(null)

// Event handler references for cleanup
let onlineHandler: (() => void) | null = null
let offlineHandler: (() => void) | null = null

// ============================================================================
// Service References (injected/imported in real implementation)
// ============================================================================

// These would be imported from services in the actual implementation
let syncQueueService: {
  enqueue: (entity: string, action: SyncActionType, data: Record<string, unknown>) => Promise<string>
  processQueue: () => Promise<void>
  startAutoSync: () => void
  stopAutoSync: () => void
  getStatus: () => SyncStatusInfo
} | null = null

let databaseService: {
  getStats: () => Promise<{ pendingSyncCount: number }>
} | null = null

/**
 * Initialize the offline composable with required services
 * Called once at app startup
 */
export function initOfflineServices(
  syncQueue: (entity: string, action: SyncActionType, data: Record<string, unknown>) => Promise<string>,
  db: { getStats: () => Promise<{ pendingSyncCount: number }> }
): void {
  syncQueueService = {
    enqueue: async (entity, action, data) => await syncQueue(entity, action, data),
    processQueue: async () => {},
    startAutoSync: () => {},
    stopAutoSync: () => {},
    getStatus: () => ({ isSyncing: false, pendingCount: 0, lastSyncTime: null, online: true, error: null }),
  }
  databaseService = db
}

// ============================================================================
// Event Handlers
// ============================================================================

function handleOnline(): void {
  isOnlineRef.value = true
  // Trigger sync when coming back online
  if (syncQueueService) {
    syncQueueService.processQueue().catch(console.error)
  }
}

function handleOffline(): void {
  isOnlineRef.value = false
}

// ============================================================================
// Core Composable
// ============================================================================

/**
 * Vue composable for managing offline state and sync operations
 *
 * @example
 * ```typescript
 * const { isOnline, isSyncing, pendingCount, syncNow, enqueueSync } = useOffline()
 *
 * // Use in template
 * <div v-if="!isOnline">You are offline</div>
 * <button @click="syncNow">Sync Now</button>
 * ```
 */
export function useOffline(): UseOfflineReturn {
  // Ensure services are initialized
  if (!syncQueueService || !databaseService) {
    console.warn('useOffline: Services not initialized. Call initOfflineServices() first.')
  }

  // =========================================================================
  // Computed State
  // =========================================================================

  /**
   * Whether the browser is currently online
   * Reflects navigator.onLine status
   */
  const isOnline = computed(() => isOnlineRef.value)

  /**
   * Whether a sync operation is currently in progress
   */
  const isSyncing = computed(() => isSyncingRef.value)

  /**
   * Number of pending sync items in the queue
   */
  const pendingCount = computed(() => pendingCountRef.value)

  /**
   * Timestamp of the last successful sync
   */
  const lastSyncTime = computed(() => lastSyncTimeRef.value)

  /**
   * Current sync error message, if any
   */
  const syncError = computed(() => syncErrorRef.value)

  // =========================================================================
  // Actions
  // =========================================================================

  /**
   * Trigger an immediate sync of all pending items
   */
  async function syncNow(): Promise<void> {
    if (!syncQueueService) {
      throw new Error('Sync queue service not initialized')
    }

    try {
      isSyncingRef.value = true
      syncErrorRef.value = null
      await syncQueueService.processQueue()
      lastSyncTimeRef.value = new Date()
    } catch (error) {
      syncErrorRef.value = error instanceof Error ? error.message : 'Sync failed'
      throw error
    } finally {
      isSyncingRef.value = false
    }
  }

  /**
   * Refresh all status values from services
   */
  async function refreshStatus(): Promise<void> {
    if (!databaseService) {
      return
    }

    try {
      const stats = await databaseService.getStats()
      pendingCountRef.value = stats.pendingSyncCount
    } catch (error) {
      console.error('Failed to refresh status:', error)
    }
  }

  /**
   * Add an item to the sync queue
   *
   * @param entity - The entity type (e.g., 'progressItems', 'commitments')
   * @param action - The action type ('create', 'update', 'delete')
   * @param data - The data to sync
   * @returns The generated queue item ID
   */
  async function enqueueSync(
    entity: string,
    action: SyncActionType,
    data: Record<string, unknown>
  ): Promise<string> {
    if (!syncQueueService) {
      throw new Error('Sync queue service not initialized')
    }

    const id = await syncQueueService.enqueue(entity, action, data)
    pendingCountRef.value++
    return id
  }

  // =========================================================================
  // Lifecycle
  // =========================================================================

  onMounted(() => {
    // Initialize online state
    isOnlineRef.value = navigator.onLine

    // Register event listeners
    onlineHandler = handleOnline
    offlineHandler = handleOffline
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)

    // Start auto-sync
    if (syncQueueService) {
      syncQueueService.startAutoSync()
    }

    // Initial status refresh
    refreshStatus()
  })

  onUnmounted(() => {
    // Remove event listeners
    if (onlineHandler) {
      window.removeEventListener('online', onlineHandler)
    }
    if (offlineHandler) {
      window.removeEventListener('offline', offlineHandler)
    }

    // Stop auto-sync
    if (syncQueueService) {
      syncQueueService.stopAutoSync()
    }
  })

  return {
    // State (readonly computed)
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncError,

    // Actions
    syncNow,
    refreshStatus,
    enqueueSync,
  }
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Check if the browser is currently online
 * Can be used outside of Vue components
 */
export function checkOnlineStatus(): boolean {
  return navigator.onLine
}

/**
 * Register a callback for online/offline events
 * Can be used outside of Vue components
 */
export function registerNetworkListener(callback: (online: boolean) => void): () => void {
  const handler = () => callback(navigator.onLine)
  window.addEventListener('online', handler)
  window.addEventListener('offline', handler)

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handler)
    window.removeEventListener('offline', handler)
  }
}
