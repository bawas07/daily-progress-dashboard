/**
 * Offline Storage Type Definitions
 * Types for IndexedDB storage, sync queue, and offline-first functionality
 */

// ============================================================================
// Sync Types
// ============================================================================

export type SyncActionType = 'create' | 'update' | 'delete'

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed'

export type ConflictResolution = 'local' | 'remote' | 'merge'

export interface SyncQueueItem {
  id: string
  localId: string
  entityType: string
  action: SyncActionType
  data: Record<string, unknown>
  status: SyncStatus
  retryCount: number
  error: string | null
  createdAt: Date
  updatedAt: Date
  syncedAt: Date | null
}

export interface SyncStatusInfo {
  isSyncing: boolean
  pendingCount: number
  lastSyncTime: Date | null
  online: boolean
  error: string | null
}

// ============================================================================
// Local Entity Types
// ============================================================================

export interface LocalEntity<T = Record<string, unknown>> {
  id: string
  localId: string
  entityType: string
  data: T
  syncStatus: SyncStatus
  lastModified: Date
  createdAt: Date
  updatedAt: Date
  needsSync: boolean
}

export type EntityTypes = 
  | 'progressItems'
  | 'commitments'
  | 'timelineEvents'
  | 'settings'
  | 'user'

// ============================================================================
// Preferences Types
// ============================================================================

export interface UserPreferencesData {
  id: string
  userId: string
  defaultActiveDays: string[]
  theme: 'auto' | 'light' | 'dark'
  timezone: string
  enableNotifications: boolean
  createdAt: string
  updatedAt: string
}

export interface OfflinePreferences {
  lastSynced: Date | null
  theme: 'auto' | 'light' | 'dark'
  offlineMode: boolean
  autoSync: boolean
  syncOnConnection: boolean
}

// ============================================================================
// Dashboard Cache Types
// ============================================================================

export interface DashboardCache {
  id: string
  date: string
  data: DashboardCacheData
  createdAt: Date
  expiresAt: Date
}

export interface DashboardCacheData {
  timelineEvents: unknown[]
  progressItems: unknown[]
  commitments: unknown[]
}

// ============================================================================
// Database Configuration
// ============================================================================

export interface DatabaseConfig {
  name: string
  version: number
  stores: DatabaseStore[]
}

export interface DatabaseStore {
  name: string
  indexes: string[]
  primaryKey: string
}

// ============================================================================
// API Sync Types
// ============================================================================

export interface ApiSyncResponse {
  success: boolean
  data?: unknown
  error?: string
  conflict?: {
    local: Record<string, unknown>
    remote: Record<string, unknown>
    resolution: ConflictResolution
  }
}

export interface ApiSyncRequest {
  localId: string
  action: SyncActionType
  entityType: string
  data: Record<string, unknown>
  timestamp: Date
}

// ============================================================================
// Sync Queue Configuration
// ============================================================================

export interface SyncQueueConfig {
  maxRetries: number
  retryDelay: number
  batchSize: number
  autoSyncInterval: number
  enableAutoSync: boolean
}

export const DEFAULT_SYNC_CONFIG: SyncQueueConfig = {
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  batchSize: 10,
  autoSyncInterval: 30000, // 30 seconds
  enableAutoSync: true,
}

// ============================================================================
// Event Types
// ============================================================================

export interface SyncEvent {
  type: 'sync_start' | 'sync_complete' | 'sync_error' | 'item_synced' | 'queue_empty'
  timestamp: Date
  payload?: unknown
}

export interface OfflineEvent {
  type: 'offline' | 'online'
  timestamp: Date
  previousState?: boolean
}

// ============================================================================
// Utility Types
// ============================================================================

export interface DatabaseStats {
  pendingSyncCount: number
  syncedCount: number
  failedCount: number
  localEntitiesCount: number
  lastSyncTime: Date | null
  databaseSize: number
}

export interface EntityOperationResult<T = void> {
  success: boolean
  data?: T
  error?: string
}
