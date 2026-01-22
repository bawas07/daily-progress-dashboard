/**
 * Offline Types Tests
 * Tests for type definitions correctness and validation
 */

import { describe, it, expect } from 'vitest'
import type {
  SyncActionType,
  SyncStatus,
  ConflictResolution,
  SyncQueueItem,
  LocalEntity,
  EntityTypes,
  OfflinePreferences,
  DashboardCache,
  DatabaseConfig,
  ApiSyncResponse,
  ApiSyncRequest,
  SyncQueueConfig,
  SyncEvent,
  OfflineEvent,
  DatabaseStats,
  EntityOperationResult,
  UserPreferencesData,
} from '@/shared/types/offline'
import { DEFAULT_SYNC_CONFIG } from '@/shared/types/offline'

// ============================================================================
// Type Validation Tests
// ============================================================================

describe('Offline Type Definitions', () => {
  // =========================================================================
  // Sync Action Type Tests
  // =========================================================================
  
  describe('SyncActionType', () => {
    it('should accept valid action types', () => {
      const validActions: SyncActionType[] = ['create', 'update', 'delete']
      
      expect(validActions).toContain('create')
      expect(validActions).toContain('update')
      expect(validActions).toContain('delete')
    })
    
    it('should not accept invalid action types', () => {
      // This test validates that only valid types are accepted
      const isValidAction = (action: string): action is SyncActionType => {
        return ['create', 'update', 'delete'].includes(action)
      }
      
      expect(isValidAction('create')).toBe(true)
      expect(isValidAction('update')).toBe(true)
      expect(isValidAction('delete')).toBe(true)
      expect(isValidAction('invalid')).toBe(false)
    })
  })
  
  // =========================================================================
  // Sync Status Type Tests
  // =========================================================================
  
  describe('SyncStatus', () => {
    it('should accept valid status values', () => {
      const validStatuses: SyncStatus[] = ['pending', 'syncing', 'synced', 'failed']
      
      expect(validStatuses).toContain('pending')
      expect(validStatuses).toContain('syncing')
      expect(validStatuses).toContain('synced')
      expect(validStatuses).toContain('failed')
    })
    
    it('should correctly identify terminal states', () => {
      const isTerminalState = (status: SyncStatus): boolean => {
        return status === 'synced' || status === 'failed'
      }
      
      expect(isTerminalState('synced')).toBe(true)
      expect(isTerminalState('failed')).toBe(true)
      expect(isTerminalState('pending')).toBe(false)
      expect(isTerminalState('syncing')).toBe(false)
    })
  })
  
  // =========================================================================
  // Conflict Resolution Type Tests
  // =========================================================================
  
  describe('ConflictResolution', () => {
    it('should accept valid conflict resolution strategies', () => {
      const validResolutions: ConflictResolution[] = ['local', 'remote', 'merge']
      
      expect(validResolutions).toContain('local')
      expect(validResolutions).toContain('remote')
      expect(validResolutions).toContain('merge')
    })
  })
  
  // =========================================================================
  // SyncQueueItem Structure Tests
  // =========================================================================
  
  describe('SyncQueueItem', () => {
    it('should have all required properties', () => {
      const item: SyncQueueItem = {
        id: 'test-id',
        localId: 'local-123',
        entityType: 'progressItems',
        action: 'create',
        data: { title: 'Test' },
        status: 'pending',
        retryCount: 0,
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncedAt: null,
      }
      
      expect(item.id).toBe('test-id')
      expect(item.localId).toBe('local-123')
      expect(item.status).toBe('pending')
      expect(item.retryCount).toBe(0)
    })
    
    it('should allow optional syncedAt when not synced', () => {
      const pendingItem: SyncQueueItem = {
        id: 'test-id',
        localId: 'local-123',
        entityType: 'progressItems',
        action: 'create',
        data: {},
        status: 'pending',
        retryCount: 0,
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncedAt: null,
      }
      
      expect(pendingItem.syncedAt).toBeNull()
    })
    
    it('should have syncedAt when status is synced', () => {
      const syncedItem: SyncQueueItem = {
        id: 'test-id',
        localId: 'local-123',
        entityType: 'progressItems',
        action: 'create',
        data: {},
        status: 'synced',
        retryCount: 0,
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncedAt: new Date(),
      }
      
      expect(syncedItem.syncedAt).toBeInstanceOf(Date)
    })
    
    it('should allow error message when failed', () => {
      const failedItem: SyncQueueItem = {
        id: 'test-id',
        localId: 'local-123',
        entityType: 'progressItems',
        action: 'create',
        data: {},
        status: 'failed',
        retryCount: 3,
        error: 'Network timeout',
        createdAt: new Date(),
        updatedAt: new Date(),
        syncedAt: null,
      }
      
      expect(failedItem.error).toBe('Network timeout')
    })
  })
  
  // =========================================================================
  // LocalEntity Structure Tests
  // =========================================================================
  
  describe('LocalEntity', () => {
    it('should have all required properties', () => {
      const entity: LocalEntity = {
        id: 'entity-123',
        localId: 'local-456',
        entityType: 'progressItems',
        data: { title: 'Test' },
        syncStatus: 'pending',
        lastModified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        needsSync: true,
      }
      
      expect(entity.id).toBe('entity-123')
      expect(entity.localId).toBe('local-456')
      expect(entity.needsSync).toBe(true)
    })
    
    it('should work with typed data', () => {
      interface ProgressItemData {
        id: string
        title: string
        importance: 'high' | 'low'
      }
      
      const entity: LocalEntity<ProgressItemData> = {
        id: 'entity-123',
        localId: 'local-456',
        entityType: 'progressItems',
        data: {
          id: 'progress-1',
          title: 'Test Item',
          importance: 'high',
        },
        syncStatus: 'synced',
        lastModified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        needsSync: false,
      }
      
      expect(entity.data.importance).toBe('high')
    })
  })
  
  // =========================================================================
  // Entity Types Tests
  // =========================================================================
  
  describe('EntityTypes', () => {
    it('should accept valid entity type strings', () => {
      const validTypes: EntityTypes[] = [
        'progressItems',
        'commitments',
        'timelineEvents',
        'settings',
        'user',
      ]
      
      expect(validTypes).toContain('progressItems')
      expect(validTypes).toContain('commitments')
      expect(validTypes).toContain('timelineEvents')
      expect(validTypes).toContain('settings')
      expect(validTypes).toContain('user')
    })
  })
  
  // =========================================================================
  // Offline Preferences Tests
  // =========================================================================
  
  describe('OfflinePreferences', () => {
    it('should have correct structure', () => {
      const prefs: OfflinePreferences = {
        lastSynced: new Date(),
        theme: 'dark',
        offlineMode: false,
        autoSync: true,
        syncOnConnection: true,
      }
      
      expect(prefs.theme).toBe('dark')
      expect(prefs.autoSync).toBe(true)
    })
    
    it('should allow null lastSynced', () => {
      const prefs: OfflinePreferences = {
        lastSynced: null,
        theme: 'auto',
        offlineMode: false,
        autoSync: false,
        syncOnConnection: false,
      }
      
      expect(prefs.lastSynced).toBeNull()
    })
  })
  
  // =========================================================================
  // Dashboard Cache Tests
  // =========================================================================
  
  describe('DashboardCache', () => {
    it('should have correct structure', () => {
      const cache: DashboardCache = {
        id: 'cache-2024-01-15',
        date: '2024-01-15',
        data: {
          timelineEvents: [],
          progressItems: [],
          commitments: [],
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }
      
      expect(cache.id).toBe('cache-2024-01-15')
      expect(cache.data.progressItems).toEqual([])
    })
    
    it('should work with typed data', () => {
      interface TypedCacheData {
        timelineEvents: Array<{ id: string }>
        progressItems: Array<{ id: string; title: string }>
        commitments: Array<{ id: string }>
      }
      
      const cache: DashboardCache<TypedCacheData> = {
        id: 'test',
        date: '2024-01-15',
        data: {
          timelineEvents: [{ id: 'event-1' }],
          progressItems: [{ id: 'progress-1', title: 'Test' }],
          commitments: [{ id: 'commitment-1' }],
        },
        createdAt: new Date(),
        expiresAt: new Date(),
      }
      
      expect(cache.data.progressItems[0].title).toBe('Test')
    })
  })
  
  // =========================================================================
  // Database Configuration Tests
  // =========================================================================
  
  describe('DatabaseConfig', () => {
    it('should define database configuration', () => {
      const config: DatabaseConfig = {
        name: 'DailyProgressDB',
        version: 1,
        stores: [
          {
            name: 'syncQueue',
            indexes: ['status', 'entityType', 'createdAt'],
            primaryKey: 'id',
          },
          {
            name: 'localEntities',
            indexes: ['entityType', 'localId', 'needsSync'],
            primaryKey: 'id',
          },
          {
            name: 'preferences',
            indexes: [],
            primaryKey: 'id',
          },
          {
            name: 'dashboardCache',
            indexes: ['date', 'expiresAt'],
            primaryKey: 'id',
          },
        ],
      }
      
      expect(config.name).toBe('DailyProgressDB')
      expect(config.stores).toHaveLength(4)
      expect(config.stores[0].name).toBe('syncQueue')
    })
  })
  
  // =========================================================================
  // API Sync Types Tests
  // =========================================================================
  
  describe('ApiSyncResponse', () => {
    it('should represent successful sync response', () => {
      const successResponse: ApiSyncResponse = {
        success: true,
        data: { id: 'remote-123' },
      }
      
      expect(successResponse.success).toBe(true)
    })
    
    it('should represent failed sync response', () => {
      const errorResponse: ApiSyncResponse = {
        success: false,
        error: 'Server error',
      }
      
      expect(errorResponse.success).toBe(false)
      expect(errorResponse.error).toBe('Server error')
    })
    
    it('should represent conflict response', () => {
      const conflictResponse: ApiSyncResponse = {
        success: false,
        conflict: {
          local: { title: 'Local Title' },
          remote: { title: 'Remote Title' },
          resolution: 'merge',
        },
      }
      
      expect(conflictResponse.success).toBe(false)
      expect(conflictResponse.conflict).toBeDefined()
      expect(conflictResponse.conflict?.resolution).toBe('merge')
    })
  })
  
  describe('ApiSyncRequest', () => {
    it('should have correct structure', () => {
      const request: ApiSyncRequest = {
        localId: 'local-123',
        action: 'create',
        entityType: 'progressItems',
        data: { title: 'Test' },
        timestamp: new Date(),
      }
      
      expect(request.localId).toBe('local-123')
      expect(request.action).toBe('create')
    })
  })
  
  // =========================================================================
  // Sync Queue Config Tests
  // =========================================================================
  
  describe('SyncQueueConfig', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_SYNC_CONFIG.maxRetries).toBe(3)
      expect(DEFAULT_SYNC_CONFIG.retryDelay).toBe(5000)
      expect(DEFAULT_SYNC_CONFIG.batchSize).toBe(10)
      expect(DEFAULT_SYNC_CONFIG.autoSyncInterval).toBe(30000)
      expect(DEFAULT_SYNC_CONFIG.enableAutoSync).toBe(true)
    })
    
    it('should be usable as config type', () => {
      const customConfig: SyncQueueConfig = {
        maxRetries: 5,
        retryDelay: 10000,
        batchSize: 20,
        autoSyncInterval: 60000,
        enableAutoSync: false,
      }
      
      expect(customConfig.maxRetries).toBe(5)
      expect(customConfig.enableAutoSync).toBe(false)
    })
  })
  
  // =========================================================================
  // Event Types Tests
  // =========================================================================
  
  describe('SyncEvent', () => {
    it('should have correct structure', () => {
      const event: SyncEvent = {
        type: 'sync_complete',
        timestamp: new Date(),
        payload: { syncedCount: 5 },
      }
      
      expect(event.type).toBe('sync_complete')
      expect(event.payload).toEqual({ syncedCount: 5 })
    })
    
    it('should support all event types', () => {
      const events: SyncEvent[] = [
        { type: 'sync_start', timestamp: new Date() },
        { type: 'sync_complete', timestamp: new Date() },
        { type: 'sync_error', timestamp: new Date(), payload: { error: 'Test' } },
        { type: 'item_synced', timestamp: new Date(), payload: { localId: '123' } },
        { type: 'queue_empty', timestamp: new Date() },
      ]
      
      expect(events).toHaveLength(5)
    })
  })
  
  describe('OfflineEvent', () => {
    it('should have correct structure', () => {
      const event: OfflineEvent = {
        type: 'offline',
        timestamp: new Date(),
        previousState: true,
      }
      
      expect(event.type).toBe('offline')
      expect(event.previousState).toBe(true)
    })
  })
  
  // =========================================================================
  // Database Stats Tests
  // =========================================================================
  
  describe('DatabaseStats', () => {
    it('should have correct structure', () => {
      const stats: DatabaseStats = {
        pendingSyncCount: 10,
        syncedCount: 100,
        failedCount: 2,
        localEntitiesCount: 150,
        lastSyncTime: new Date(),
        databaseSize: 1024 * 1024, // 1MB
      }
      
      expect(stats.pendingSyncCount).toBe(10)
      expect(stats.databaseSize).toBe(1048576)
    })
    
    it('should allow null lastSyncTime', () => {
      const stats: DatabaseStats = {
        pendingSyncCount: 0,
        syncedCount: 0,
        failedCount: 0,
        localEntitiesCount: 0,
        lastSyncTime: null,
        databaseSize: 0,
      }
      
      expect(stats.lastSyncTime).toBeNull()
    })
  })
  
  // =========================================================================
  // Entity Operation Result Tests
  // =========================================================================
  
  describe('EntityOperationResult', () => {
    it('should represent successful operation', () => {
      const successResult: EntityOperationResult<string> = {
        success: true,
        data: 'entity-id-123',
      }
      
      expect(successResult.success).toBe(true)
      expect(successResult.data).toBe('entity-id-123')
    })
    
    it('should represent failed operation', () => {
      const errorResult: EntityOperationResult = {
        success: false,
        error: 'Database error',
      }
      
      expect(errorResult.success).toBe(false)
      expect(errorResult.error).toBe('Database error')
    })
    
    it('should work with void type', () => {
      const voidResult: EntityOperationResult<void> = {
        success: true,
      }
      
      expect(voidResult.data).toBeUndefined()
    })
  })
  
  // =========================================================================
  // UserPreferencesData Tests
  // =========================================================================
  
  describe('UserPreferencesData', () => {
    it('should have correct structure', () => {
      const prefs: UserPreferencesData = {
        id: 'prefs-123',
        userId: 'user-456',
        defaultActiveDays: ['Mon', 'Wed', 'Fri'],
        theme: 'dark',
        timezone: 'America/New_York',
        enableNotifications: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      expect(prefs.theme).toBe('dark')
      expect(prefs.defaultActiveDays).toEqual(['Mon', 'Wed', 'Fri'])
    })
    
    it('should accept valid theme values', () => {
      const validThemes: Array<UserPreferencesData['theme']> = ['auto', 'light', 'dark']
      
      expect(validThemes).toContain('auto')
      expect(validThemes).toContain('light')
      expect(validThemes).toContain('dark')
    })
  })
})
