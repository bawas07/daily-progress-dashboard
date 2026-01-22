/**
 * Offline Database Service
 * IndexedDB wrapper using Dexie.js for offline-first data persistence
 */

import Dexie, { type Table } from 'dexie'
import type {
  SyncQueueItem,
  LocalEntity,
  UserPreferencesData,
  DashboardCache,
  DatabaseStats,
  SyncActionType,
  SyncStatus,
} from '@/shared/types/offline'

/**
 * Dexie.js Database Class
 * Extends Dexie to provide typed tables for offline storage
 */
export class OfflineDatabase extends Dexie {
  syncQueue!: Table<SyncQueueItem, string>
  localEntities!: Table<LocalEntity, string>
  preferences!: Table<UserPreferencesData, string>
  dashboardCache!: Table<DashboardCache, string>

  constructor() {
    super('DailyProgressDB')
    this.version(1).stores({
      syncQueue: '++id, localId, entityType, status, createdAt',
      localEntities: '++id, localId, entityType, syncStatus',
      preferences: 'id',
      dashboardCache: 'id, date, createdAt',
    })
  }
}

// Create singleton instance
let dbInstance: OfflineDatabase | null = null

/**
 * Get or create the database instance
 */
export function getDatabase(): OfflineDatabase {
  if (!dbInstance) {
    dbInstance = new OfflineDatabase()
  }
  return dbInstance
}

/**
 * Offline Database Service
 * Provides async operations for all offline storage needs
 */
export class OfflineDatabaseService {
  private db: OfflineDatabase

  constructor() {
    this.db = getDatabase()
  }

  // ============================================================================
  // Sync Queue Operations
  // ============================================================================

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(
    entity: string,
    action: SyncActionType,
    data: Record<string, unknown>,
  ): Promise<string> {
    const now = new Date()
    const item: Omit<SyncQueueItem, 'id'> = {
      localId: crypto.randomUUID(),
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

    return await this.db.syncQueue.add(item as unknown as SyncQueueItem) as string
  }

  /**
   * Get all pending queue items sorted by creation time
   */
  async getPendingQueueItems(): Promise<SyncQueueItem[]> {
    return await this.db.syncQueue
      .where('status')
      .equals('pending' as SyncStatus)
      .sortBy('createdAt')
  }

  /**
   * Mark queue item as synced
   */
  async markQueueItemSynced(id: string, _serverId?: string): Promise<void> {
    const item = await this.db.syncQueue.get(id)
    if (!item) {
      throw new Error(`Queue item with id ${id} not found`)
    }

    await this.db.syncQueue.update(id, {
      status: 'synced',
      syncedAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Mark queue item as failed and increment retry count
   */
  async markQueueItemFailed(id: string, error: string): Promise<void> {
    const item = await this.db.syncQueue.get(id)
    if (!item) {
      throw new Error(`Queue item with id ${id} not found`)
    }

    await this.db.syncQueue.update(id, {
      status: 'failed',
      error,
      retryCount: item.retryCount + 1,
      updatedAt: new Date(),
    })
  }

  /**
   * Delete all synced items from queue
   */
  async clearSyncedItems(): Promise<number> {
    return await this.db.syncQueue
      .where('status')
      .equals('synced' as SyncStatus)
      .delete()
  }

  /**
   * Get count of pending items
   */
  async getPendingCount(): Promise<number> {
    return await this.db.syncQueue
      .where('status')
      .equals('pending' as SyncStatus)
      .count()
  }

  // ============================================================================
  // Local Entity Operations
  // ============================================================================

  /**
   * Save entity to local storage
   */
  async saveLocalEntity(
    entity: string,
    data: Record<string, unknown>,
  ): Promise<string> {
    const now = new Date()
    const localId = crypto.randomUUID()

    const entityRecord: Omit<LocalEntity, 'id'> = {
      localId,
      entityType: entity,
      data,
      syncStatus: 'pending',
      lastModified: now,
      createdAt: now,
      updatedAt: now,
      needsSync: true,
    }

    return await this.db.localEntities.add(entityRecord as unknown as LocalEntity) as string
  }

  /**
   * Update existing local entity
   */
  async updateLocalEntity(
    localId: string,
    data: Partial<Record<string, unknown>>,
  ): Promise<LocalEntity> {
    const entity = await this.db.localEntities.get(localId)
    if (!entity) {
      throw new Error(`Entity with localId ${localId} not found`)
    }

    const now = new Date()
    const updatedEntity: LocalEntity = {
      ...entity,
      data: { ...entity.data, ...data },
      updatedAt: now,
      lastModified: now,
      needsSync: true,
      syncStatus: 'pending',
    }

    await this.db.localEntities.put(updatedEntity)
    return updatedEntity
  }

  /**
   * Get all entities of a specific type
   */
  async getLocalEntities(entity: string): Promise<LocalEntity[]> {
    return await this.db.localEntities
      .where('entityType')
      .equals(entity)
      .toArray()
  }

  /**
   * Delete local entity
   */
  async deleteLocalEntity(localId: string): Promise<void> {
    await this.db.localEntities.delete(localId)
  }

  // ============================================================================
  // Preferences Operations
  // ============================================================================

  /**
   * Save or update preferences
   */
  async savePreferences(prefs: UserPreferencesData): Promise<void> {
    await this.db.preferences.put({
      ...prefs,
      updatedAt: new Date().toISOString(),
    })
  }

  /**
   * Get preferences
   */
  async getPreferences(): Promise<UserPreferencesData | undefined> {
    const prefs = await this.db.preferences.get('user-prefs')
    return prefs as UserPreferencesData | undefined
  }

  // ============================================================================
  // Dashboard Cache Operations
  // ============================================================================

  /**
   * Cache dashboard data for a specific date
   */
  async cacheDashboardData(
    date: string,
    data: DashboardCache['data'],
  ): Promise<void> {
    const now = new Date()
    const cacheEntry: DashboardCache = {
      id: `dashboard-${date}`,
      date,
      data,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes
    }

    await this.db.dashboardCache.put(cacheEntry)
  }

  /**
   * Get cached dashboard data
   */
  async getCachedDashboardData(
    date: string,
  ): Promise<DashboardCache['data'] | undefined> {
    const cache = await this.db.dashboardCache.get(`dashboard-${date}`)
    if (!cache) {
      return undefined
    }

    // Return null if cache expired
    if (cache.expiresAt < new Date()) {
      return undefined
    }

    return cache.data
  }

  /**
   * Clear all dashboard cache
   */
  async clearDashboardCache(): Promise<void> {
    await this.db.dashboardCache.clear()
  }

  // ============================================================================
  // Utility Operations
  // ============================================================================

  /**
   * Clear all data from all tables
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.db.syncQueue.clear(),
      this.db.localEntities.clear(),
      this.db.preferences.clear(),
      this.db.dashboardCache.clear(),
    ])
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<DatabaseStats> {
    const pendingCount = await this.getPendingCount()
    const localEntitiesCount = await this.db.localEntities.count()
    const syncedCount = await this.db.syncQueue
      .where('status')
      .equals('synced' as SyncStatus)
      .count()
    const failedCount = await this.db.syncQueue
      .where('status')
      .equals('failed' as SyncStatus)
      .count()

    const prefs = await this.getPreferences()
    const lastSyncTime = prefs?.updatedAt
      ? new Date(prefs.updatedAt)
      : null

    return {
      pendingSyncCount: pendingCount,
      syncedCount,
      failedCount,
      localEntitiesCount,
      lastSyncTime,
      databaseSize: 0, // IndexedDB doesn't provide size easily
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.db.close()
    dbInstance = null
  }

  /**
   * Delete database
   */
  async delete(): Promise<void> {
    await this.db.delete()
    dbInstance = null
  }
}

// Export singleton instance
export const offlineDb = new OfflineDatabaseService()
