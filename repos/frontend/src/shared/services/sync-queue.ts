/**
 * Sync Queue Service
 * Manages offline-to-online synchronization queue for PWA functionality
 */

import { api } from './api'
import { getDatabase, type OfflineDatabase } from './offline-db'
import type { SyncQueueItem, SyncQueueConfig, SyncActionType } from '@/shared/types/offline'

// ============================================================================
// Constants
// ============================================================================

const MAX_RETRIES = 3
const SYNC_INTERVAL = 30000 // 30 seconds

// ============================================================================
// Types
// ============================================================================

export interface SyncResult {
  success: boolean
  itemId: string
  error?: string
  serverId?: string
}

export interface SyncStatusInfo {
  isSyncing: boolean
  pendingCount: number
  lastSyncTime: Date | null
  online: boolean
  error: string | null
}

// ============================================================================
// Sync Queue Service
// ============================================================================

export class SyncQueueService {
  private isSyncing: boolean = false
  private boundHandleOnline: (() => Promise<void>) | null = null
  private boundHandleOffline: (() => Promise<void>) | null = null
  private syncIntervalId: ReturnType<typeof setInterval> | null = null
  private lastSyncTime: Date | null = null
  private config: SyncQueueConfig
  private dbInstance: OfflineDatabase | null = null
  private mockDb: {
    syncQueue: {
      add: (item: Omit<SyncQueueItem, 'id'>) => Promise<string>
      get: (id: string) => Promise<SyncQueueItem | undefined>
      put: (item: SyncQueueItem) => Promise<number>
      delete: (id: string) => Promise<number>
      where: (key: string) => { equals: (value: string) => { toArray: () => Promise<SyncQueueItem[]>; count: () => Promise<number>; delete: () => Promise<number> } }
      clear: () => Promise<void>
    }
  } | null = null

  constructor(config?: Partial<SyncQueueConfig>) {
    this.config = {
      maxRetries: MAX_RETRIES,
      retryDelay: 5000,
      batchSize: 10,
      autoSyncInterval: SYNC_INTERVAL,
      enableAutoSync: false,
      ...config,
    }
  }

  /**
   * Set a mock database for testing
   */
  setMockDatabase(mockDb: {
    syncQueue: {
      add: (item: Omit<SyncQueueItem, 'id'>) => Promise<string>
      get: (id: string) => Promise<SyncQueueItem | undefined>
      put: (item: SyncQueueItem) => Promise<number>
      delete: (id: string) => Promise<number>
      where: (key: string) => { equals: (value: string) => { toArray: () => Promise<SyncQueueItem[]>; count: () => Promise<number>; delete: () => Promise<number> } }
      clear: () => Promise<void>
    }
  }): void {
    this.mockDb = mockDb
  }

  /**
   * Get the database instance
   */
  private getDb(): OfflineDatabase {
    if (!this.dbInstance) {
      this.dbInstance = getDatabase()
    }
    return this.dbInstance
  }

  /**
   * Enqueue an entity operation for sync
   */
  async enqueue(
    entity: string,
    action: SyncActionType,
    data: Record<string, unknown>,
    localId?: string
  ): Promise<string> {
    const generatedLocalId = localId || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    const queueItem: Omit<SyncQueueItem, 'id'> = {
      localId: generatedLocalId,
      entityType: entity,
      action,
      data,
      status: 'pending',
      retryCount: 0,
      error: null,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
    }

    // Use mock database if set, otherwise use real database
    if (this.mockDb) {
      const queueId = await this.mockDb.syncQueue.add(queueItem)
      // Trigger sync if online
      if (navigator.onLine) {
        this.processQueue().catch(console.error)
      }
      return queueId
    }

    const db = this.getDb()
    const queueId = await db.syncQueue.add(queueItem as unknown as SyncQueueItem) as string

    // Trigger sync if online
    if (navigator.onLine) {
      this.processQueue().catch(console.error)
    }

    return queueId
  }

  /**
   * Process all pending items in the sync queue
   */
  async processQueue(): Promise<SyncResult[]> {
    // Prevent concurrent sync operations
    if (this.isSyncing) {
      return []
    }

    // Check if online
    if (!navigator.onLine) {
      return []
    }

    this.isSyncing = true
    const results: SyncResult[] = []

    try {
      // Use mock database if set, otherwise use real database
      let pendingItems: SyncQueueItem[]

      if (this.mockDb) {
        pendingItems = await this.mockDb.syncQueue
          .where('status')
          .equals('pending')
          .toArray()
      } else {
        const db = this.getDb()
        pendingItems = await db.syncQueue
          .where('status')
          .equals('pending')
          .toArray()
      }

      if (pendingItems.length === 0) {
        return results
      }

      // Process items in batches
      const batchSize = this.config.batchSize
      const batches = this.chunkArray(pendingItems, batchSize)

      for (const batch of batches) {
        const batchResults = await Promise.all(
          batch.map((item) => this.syncItem(item))
        )
        results.push(...batchResults)
      }

      // Clear synced items after processing
      await this.clearSyncedItems()

      this.lastSyncTime = new Date()
    } finally {
      this.isSyncing = false
    }

    return results
  }

  /**
   * Sync a single queue item
   */
  private async syncItem(item: SyncQueueItem): Promise<SyncResult> {
    const { localId, action, entityType, data, retryCount } = item

    // Check retry count
    if (retryCount >= this.config.maxRetries) {
      return {
        success: false,
        itemId: localId,
        error: 'Max retries exceeded',
      }
    }

    try {
      // Mark as syncing
      if (this.mockDb) {
        await this.mockDb.syncQueue.put({
          ...item,
          status: 'syncing',
          updatedAt: new Date(),
        })
      } else {
        const db = this.getDb()
        await db.syncQueue.put({
          ...item,
          status: 'syncing',
          updatedAt: new Date(),
        })
      }

      const endpoint = this.getEndpoint(entityType)
      let serverId: string | undefined

      // Perform the appropriate API call based on action
      switch (action) {
        case 'create': {
          const createResponse = await api.post(endpoint, data)
          serverId = (createResponse as { id?: string }).id
          break
        }
        case 'update': {
          const itemId = data.id as string
          await api.put(`${endpoint}/${itemId}`, data)
          break
        }
        case 'delete': {
          const itemId = data.id as string
          await api.delete(`${endpoint}/${itemId}`)
          break
        }
      }

      // Mark as synced
      if (this.mockDb) {
        await this.mockDb.syncQueue.put({
          ...item,
          status: 'synced',
          syncedAt: new Date(),
          updatedAt: new Date(),
        })
      } else {
        const db = this.getDb()
        await db.syncQueue.put({
          ...item,
          status: 'synced',
          syncedAt: new Date(),
          updatedAt: new Date(),
        })
      }

      return {
        success: true,
        itemId: localId,
        serverId,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Update retry count
      const newRetryCount = retryCount + 1
      const isMaxRetries = newRetryCount >= this.config.maxRetries

      if (this.mockDb) {
        await this.mockDb.syncQueue.put({
          ...item,
          status: isMaxRetries ? 'failed' : 'pending',
          retryCount: newRetryCount,
          error: errorMessage,
          updatedAt: new Date(),
        })
      } else {
        const db = this.getDb()
        await db.syncQueue.put({
          ...item,
          status: isMaxRetries ? 'failed' : 'pending',
          retryCount: newRetryCount,
          error: errorMessage,
          updatedAt: new Date(),
        })
      }

      return {
        success: false,
        itemId: localId,
        error: errorMessage,
      }
    }
  }

  /**
   * Map entity type to API endpoint
   */
  private getEndpoint(entityType: string): string {
    const endpointMap: Record<string, string> = {
      progressItems: '/progress-items',
      commitments: '/commitments',
      timelineEvents: '/timeline-events',
      progressLogs: '/progress-items/logs',
      commitmentLogs: '/commitments/logs',
      settings: '/settings',
      user: '/user',
    }

    return endpointMap[entityType] || `/${entityType}`
  }

  /**
   * Clear synced items from the queue
   */
  private async clearSyncedItems(): Promise<void> {
    if (this.mockDb) {
      await this.mockDb.syncQueue
        .where('status')
        .equals('synced')
        .delete()
    } else {
      const db = this.getDb()
      await db.syncQueue
        .where('status')
        .equals('synced')
        .delete()
    }
  }

  /**
   * Start automatic sync
   */
  startAutoSync(): void {
    // Don't start if already running
    if (this.syncIntervalId !== null) {
      return
    }

    // Create bound handlers for proper listener removal
    this.boundHandleOnline = this.handleOnline.bind(this)
    this.boundHandleOffline = this.handleOffline.bind(this)

    // Listen for online/offline events
    window.addEventListener('online', this.boundHandleOnline)
    window.addEventListener('offline', this.boundHandleOffline)

    // Start interval sync if enabled
    if (this.config.enableAutoSync) {
      this.syncIntervalId = setInterval(() => {
        if (navigator.onLine) {
          this.processQueue().catch(() => {}) // Suppress errors
        }
      }, this.config.autoSyncInterval)
    }
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    // Remove event listeners
    if (this.boundHandleOnline) {
      window.removeEventListener('online', this.boundHandleOnline)
      this.boundHandleOnline = null
    }
    if (this.boundHandleOffline) {
      window.removeEventListener('offline', this.boundHandleOffline)
      this.boundHandleOffline = null
    }

    // Clear interval
    if (this.syncIntervalId !== null) {
      clearInterval(this.syncIntervalId)
      this.syncIntervalId = null
    }
  }

  /**
   * Handle online event - trigger sync
   */
  private async handleOnline(): Promise<void> {
    if (navigator.onLine) {
      await this.processQueue()
    }
  }

  /**
   * Handle offline event - could be used for logging or UI updates
   */
  private async handleOffline(): Promise<void> {
    // Currently a no-op, but prepared for future offline state handling
  }

  /**
   * Get current sync status
   */
  async getStatus(): Promise<SyncStatusInfo> {
    let pendingCount: number

    if (this.mockDb) {
      pendingCount = await this.mockDb.syncQueue
        .where('status')
        .equals('pending')
        .count()
    } else {
      const db = this.getDb()
      pendingCount = await db.syncQueue
        .where('status')
        .equals('pending')
        .count()
    }

    return {
      isSyncing: this.isSyncing,
      pendingCount,
      lastSyncTime: this.lastSyncTime,
      online: navigator.onLine,
      error: null,
    }
  }

  /**
   * Clear all synced items from the queue
   */
  async clearQueue(): Promise<void> {
    if (this.mockDb) {
      await this.mockDb.syncQueue
        .where('status')
        .equals('synced')
        .delete()
    } else {
      const db = this.getDb()
      await db.syncQueue
        .where('status')
        .equals('synced')
        .delete()
    }
  }

  /**
   * Utility: Chunk array into smaller batches
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

// ============================================================================
// Export
// ============================================================================

export const syncQueue = new SyncQueueService()
export { MAX_RETRIES, SYNC_INTERVAL }

