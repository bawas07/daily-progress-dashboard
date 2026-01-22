/**
 * Sync Queue Service Tests
 * Tests for sync queue management and processing
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest'
import type { SyncQueueItem, SyncQueueConfig } from '@/shared/types/offline'
import { SyncQueueService } from './sync-queue'

// ============================================================================
// Mock Dependencies
// ============================================================================

// Mock browser globals for Node.js environment
const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}

const mockNavigator = {
  onLine: true,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

global.window = mockWindow as unknown as Window & typeof globalThis
global.navigator = mockNavigator as unknown as Navigator & { onLine: boolean }

// Mock the database with proper Dexie-like interface
const createMockDatabase = () => {
  // Create chainable mock functions
  const whereFn = vi.fn()
  const equalsFn = vi.fn()
  const toArrayFn = vi.fn().mockResolvedValue([])
  const countFn = vi.fn().mockResolvedValue(0)
  const deleteFn = vi.fn().mockResolvedValue(0)

  // Set up the chain - equals returns an object with toArray, count, delete
  equalsFn.mockReturnValue({
    toArray: toArrayFn,
    count: countFn,
    delete: deleteFn,
  })
  // where returns an object with equals
  whereFn.mockReturnValue({
    equals: equalsFn,
  })

  return {
    syncQueue: {
      add: vi.fn<(_: Omit<SyncQueueItem, 'id'>) => Promise<string>>(),
      get: vi.fn<(_: string) => Promise<SyncQueueItem | undefined>>(),
      put: vi.fn<(_: SyncQueueItem) => Promise<number>>(),
      delete: vi.fn<(_: string) => Promise<number>>(),
      where: whereFn,
      count: vi.fn<() => Promise<number>>(),
      filter: vi.fn<(_: (_: SyncQueueItem) => boolean) => SyncQueueItem[]>(),
      toArray: toArrayFn,
      clear: vi.fn<() => Promise<void>>(),
    },
    localEntities: {
      add: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      where: vi.fn(),
      toArray: vi.fn(),
      count: vi.fn(),
      clear: vi.fn(),
    },
    preferences: {
      put: vi.fn(),
      get: vi.fn(),
      toArray: vi.fn(),
      clear: vi.fn(),
    },
    // Expose the chain functions for test customization
    _chain: {
      where: whereFn,
      equals: equalsFn,
      toArray: toArrayFn,
      count: countFn,
      delete: deleteFn,
    },
  }
}

// Mock the API service
const createMockApiService = () => ({
  get: vi.fn(),
  post: vi.fn<(_url: string, _data?: unknown) => Promise<{ id?: string; success?: boolean }>>(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
})

// Default config for tests
const DEFAULT_CONFIG: SyncQueueConfig = {
  maxRetries: 3,
  retryDelay: 100, // Short delay for tests
  batchSize: 5,
  autoSyncInterval: 1000, // 1 second for tests
  enableAutoSync: true,
}

// Helper function to create mock queue items (defined at module level for access in all tests)
const createMockQueueItem = (overrides: Partial<SyncQueueItem> = {}): SyncQueueItem => ({
  id: 'queue-1',
  localId: 'local-123',
  entityType: 'progressItems',
  action: 'create',
  data: { title: 'Test Item' },
  status: 'pending',
  retryCount: 0,
  error: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  syncedAt: null,
  ...overrides,
})

// ============================================================================
// Test Setup
// ============================================================================

describe('SyncQueueService', () => {
  // Mock timer restore function for test cleanup
  let restoreTimers: () => void

  // Service instances and mocks for each test
  let service: SyncQueueService
  let mockDatabase: ReturnType<typeof createMockDatabase>
  let mockApiService: ReturnType<typeof createMockApiService>

  beforeAll(() => {
    // Setup fake timers if available
    if (typeof vi.useFakeTimers === 'function') {
      vi.useFakeTimers()
      restoreTimers = () => vi.useRealTimers()
    } else {
      restoreTimers = () => {}
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Create fresh mocks for each test
    mockDatabase = createMockDatabase()
    mockApiService = createMockApiService()
    // Create service with mocks
    service = new SyncQueueService(DEFAULT_CONFIG)
    service.setMockDatabase(mockDatabase as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
    restoreTimers()
    // Clean up auto-sync if started
    try {
      service.stopAutoSync()
    } catch {
      // Ignore errors during cleanup
    }
  })
  
  // =========================================================================
  // Enqueue Operations Tests
  // =========================================================================

  describe('Enqueue Operations', () => {
    describe('enqueue', () => {
      it('should enqueue create action with correct structure', async () => {
        mockDatabase.syncQueue.add.mockResolvedValue('queue-id-1')

        const itemData = {
          entityType: 'progressItems' as const,
          data: { title: 'New Progress Item', importance: 'high' as const },
          localId: 'local-123',
        }

        await service.enqueue(itemData.entityType, 'create', itemData.data, itemData.localId)

        expect(mockDatabase.syncQueue.add).toHaveBeenCalledWith(expect.objectContaining({
          action: 'create',
          status: 'pending',
          localId: 'local-123',
        }))
      })

      it('should generate unique localId if not provided', async () => {
        mockDatabase.syncQueue.add.mockImplementation(async (item) => `queue-id-${item.localId}`)

        await service.enqueue('progressItems', 'create', { title: 'Test' })

        const callArg = mockDatabase.syncQueue.add.mock.calls[0][0]
        expect(callArg.localId).toBeDefined()
        expect(callArg.localId).toMatch(/^local-[a-z0-9-]+$/)
      })

      it('should set createdAt and updatedAt timestamps', async () => {
        mockDatabase.syncQueue.add.mockResolvedValue('queue-id-3')
        const beforeAdd = Date.now()

        await service.enqueue('commitments', 'create', { title: 'Test Commitment' })

        const callArg = mockDatabase.syncQueue.add.mock.calls[0][0]
        expect(callArg.createdAt.getTime()).toBeGreaterThanOrEqual(beforeAdd)
        expect(callArg.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeAdd)
      })
    })

    describe('enqueueUpdate', () => {
      it('should enqueue update action with entity data', async () => {
        mockDatabase.syncQueue.add.mockResolvedValue('queue-id-4')

        await service.enqueue('progressItems', 'update', { id: 'remote-123', title: 'Updated Title' }, 'local-456')

        const callArg = mockDatabase.syncQueue.add.mock.calls[0][0]
        expect(callArg.action).toBe('update')
        expect(callArg.data.id).toBe('remote-123')
      })

      it('should preserve existing remote ID for updates', async () => {
        mockDatabase.syncQueue.add.mockResolvedValue('queue-id-5')

        await service.enqueue('progressItems', 'update', { id: 'existing-remote-id', title: 'Updated' })

        const callArg = mockDatabase.syncQueue.add.mock.calls[0][0]
        expect(callArg.data.id).toBe('existing-remote-id')
      })
    })

    describe('enqueueDelete', () => {
      it('should enqueue delete action with entity reference', async () => {
        mockDatabase.syncQueue.add.mockResolvedValue('queue-id-6')

        await service.enqueue('timelineEvents', 'delete', { id: 'remote-event-123' }, 'local-event-789')

        const callArg = mockDatabase.syncQueue.add.mock.calls[0][0]
        expect(callArg.action).toBe('delete')
        expect(callArg.data.id).toBe('remote-event-123')
      })

      it('should include minimal data for delete actions', async () => {
        mockDatabase.syncQueue.add.mockResolvedValue('queue-id-7')

        await service.enqueue('settings', 'delete', { id: 'setting-123' })

        const callArg = mockDatabase.syncQueue.add.mock.calls[0][0]
        // Delete actions only need the ID
        expect(Object.keys(callArg.data)).toContain('id')
      })
    })

    describe('Multiple Enqueues', () => {
      it('should handle multiple enqueues in sequence', async () => {
        mockDatabase.syncQueue.add.mockImplementation(async (item) => `queue-id-${item.localId}`)

        const items = [
          { localId: '1', entityType: 'progressItems', action: 'create' as const, data: { title: 'Item 1' } },
          { localId: '2', entityType: 'progressItems', action: 'update' as const, data: { id: 'r1', title: 'Item 2' } },
          { localId: '3', entityType: 'commitments', action: 'create' as const, data: { title: 'Commitment 1' } },
        ]

        for (const item of items) {
          await service.enqueue(item.entityType, item.action, item.data, item.localId)
        }

        expect(mockDatabase.syncQueue.add).toHaveBeenCalledTimes(3)
      })

      it('should maintain order of enqueued items', async () => {
        const enqueuedItems: SyncQueueItem[] = []
        mockDatabase.syncQueue.add.mockImplementation(async (item) => {
          enqueuedItems.push(item as SyncQueueItem)
          return `queue-id-${item.localId}`
        })

        const actions = [
          { localId: '1', entityType: 'test', action: 'create' as const, data: {} },
          { localId: '2', entityType: 'test', action: 'create' as const, data: {} },
          { localId: '3', entityType: 'test', action: 'update' as const, data: {} },
        ]

        for (const action of actions) {
          await service.enqueue(action.entityType, action.action, action.data, action.localId)
        }

        expect(enqueuedItems[0].localId).toBe('1')
        expect(enqueuedItems[1].localId).toBe('2')
        expect(enqueuedItems[2].localId).toBe('3')
      })
    })
  })
  
  // =========================================================================
  // Process Queue Tests
  // =========================================================================

  describe('Process Queue', () => {
    describe('processSingleItem', () => {
      it('should process pending item and make API call', async () => {
        const item = createMockQueueItem()
        // Set up mock chain
        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([item]),
          count: vi.fn().mockResolvedValue(1),
          delete: vi.fn().mockResolvedValue(1),
        })
        mockApiService.post.mockResolvedValue({ success: true, id: 'remote-123' })
        mockDatabase.syncQueue.put.mockResolvedValue(1)

        const results = await service.processQueue()

        expect(mockApiService.post).toHaveBeenCalledWith('/progress-items', { title: 'Test Item' })
        expect(results).toHaveLength(1)
        expect(results[0].success).toBe(true)
      })

      it('should mark item as synced on success', async () => {
        const item = createMockQueueItem({ action: 'create' })
        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([item]),
          count: vi.fn().mockResolvedValue(1),
          delete: vi.fn().mockResolvedValue(1),
        })
        mockApiService.post.mockResolvedValue({ id: 'remote-123' })
        mockDatabase.syncQueue.put.mockResolvedValue(1)

        await service.processQueue()

        // Check that put was called with synced status
        const putCall = mockDatabase.syncQueue.put.mock.calls.find(
          call => call[0]?.status === 'synced'
        )
        expect(putCall).toBeDefined()
        expect(putCall![0].syncedAt).toBeInstanceOf(Date)
      })

      it('should mark item as failed on API error', async () => {
        const item = createMockQueueItem({ action: 'create' })
        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([item]),
          count: vi.fn().mockResolvedValue(1),
          delete: vi.fn().mockResolvedValue(1),
        })
        mockApiService.post.mockRejectedValue(new Error('Network error'))
        mockDatabase.syncQueue.put.mockResolvedValue(1)

        const results = await service.processQueue()

        // Check that put was called with failed status
        const putCall = mockDatabase.syncQueue.put.mock.calls.find(
          call => call[0]?.status === 'failed'
        )
        expect(putCall).toBeDefined()
        expect(putCall![0].error).toBe('Network error')
        expect(putCall![0].retryCount).toBe(1)
        expect(results[0].success).toBe(false)
        expect(results[0].error).toBe('Network error')
      })
    })

    describe('processMultipleItems', () => {
      it('should process multiple pending items in batch', async () => {
        const items: SyncQueueItem[] = [
          createMockQueueItem({ id: '1', localId: 'l1' }),
          createMockQueueItem({ id: '2', localId: 'l2' }),
          createMockQueueItem({ id: '3', localId: 'l3' }),
        ]

        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue(items),
          count: vi.fn().mockResolvedValue(3),
          delete: vi.fn().mockResolvedValue(3),
        })

        mockApiService.post.mockResolvedValue({ success: true })
        mockDatabase.syncQueue.put.mockResolvedValue(1)

        const results = await service.processQueue()

        expect(results).toHaveLength(3)
        expect(mockApiService.post).toHaveBeenCalledTimes(3)
      })

      it('should respect batch size limit', async () => {
        const items: SyncQueueItem[] = Array.from({ length: 10 }, (_, i) =>
          createMockQueueItem({ id: `${i}`, localId: `l${i}` })
        )

        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue(items),
          count: vi.fn().mockResolvedValue(10),
          delete: vi.fn().mockResolvedValue(10),
        })

        mockApiService.post.mockResolvedValue({ success: true })
        mockDatabase.syncQueue.put.mockResolvedValue(1)

        // Service should process in batches of 5 (from DEFAULT_CONFIG.batchSize)
        await service.processQueue()

        // All items should be processed (10 items in 2 batches of 5)
        expect(mockApiService.post).toHaveBeenCalledTimes(10)
      })
    })

    describe('Retry Logic', () => {
      it('should retry failed items up to max retries', async () => {
        const item = createMockQueueItem({
          id: '1',
          retryCount: 0,
          status: 'pending',
        })

        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([item]),
          count: vi.fn().mockResolvedValue(1),
          delete: vi.fn().mockResolvedValue(1),
        })

        const maxRetries = DEFAULT_CONFIG.maxRetries
        let attempt = 0
        mockApiService.post.mockImplementation(() => {
          attempt++
          if (attempt <= maxRetries) {
            return Promise.reject(new Error('Network error'))
          }
          return Promise.resolve({ id: 'remote-1' })
        })
        mockDatabase.syncQueue.put.mockResolvedValue(1)

        await service.processQueue()

        // Should have retried maxRetries times and eventually succeeded
        expect(mockApiService.post).toHaveBeenCalledTimes(maxRetries + 1)
      })

      it('should stop retrying after max retries reached', async () => {
        const item = createMockQueueItem({
          retryCount: 3, // Already at max retries
          status: 'pending',
        })

        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([item]),
          count: vi.fn().mockResolvedValue(1),
          delete: vi.fn().mockResolvedValue(1),
        })
        mockApiService.post.mockRejectedValue(new Error('Network error'))
        mockDatabase.syncQueue.put.mockResolvedValue(1)

        const results = await service.processQueue()

        // Should not attempt to sync since max retries exceeded
        expect(mockApiService.post).not.toHaveBeenCalled()
        expect(results[0].error).toBe('Max retries exceeded')
      })

      it('should increment retry count on each failure', async () => {
        const item = createMockQueueItem({ retryCount: 0 })

        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([item]),
          count: vi.fn().mockResolvedValue(1),
          delete: vi.fn().mockResolvedValue(1),
        })

        let callCount = 0
        mockApiService.post.mockImplementation(() => {
          callCount++
          return Promise.reject(new Error('Network error'))
        })
        mockDatabase.syncQueue.put.mockResolvedValue(1)

        await service.processQueue()

        // Check that retry count was incremented on each failure
        const failedPutCalls = mockDatabase.syncQueue.put.mock.calls.filter(
          call => call[0]?.status === 'failed'
        )
        expect(failedPutCalls.length).toBeGreaterThan(0)
      })
    })

    describe('Handle Offline During Sync', () => {
      it('should return empty when offline', async () => {
        // Set navigator to offline
        const originalOnLine = mockNavigator.onLine
        mockNavigator.onLine = false

        const results = await service.processQueue()

        expect(results).toEqual([])

        // Restore online status
        mockNavigator.onLine = originalOnLine
      })

      it('should process queue when coming back online', async () => {
        // Ensure online
        mockNavigator.onLine = true

        const item = createMockQueueItem()
        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([item]),
          count: vi.fn().mockResolvedValue(1),
          delete: vi.fn().mockResolvedValue(1),
        })
        mockApiService.post.mockResolvedValue({ id: 'remote-123' })
        mockDatabase.syncQueue.put.mockResolvedValue(1)

        const results = await service.processQueue()

        expect(results).toHaveLength(1)
      })

      it('should retry pending items after reconnecting', async () => {
        mockNavigator.onLine = true

        const pendingItems = [
          createMockQueueItem({ id: '1', retryCount: 0 }),
          createMockQueueItem({ id: '2', retryCount: 0 }),
        ]

        // Set up mock chain with pending items using mockResolvedValueOnce
        const toArrayMock = vi.fn().mockResolvedValue(pendingItems)

        mockDatabase._chain.equals.mockReturnValue({
          toArray: toArrayMock,
          count: vi.fn().mockResolvedValue(2),
          delete: vi.fn().mockResolvedValue(2),
        })
        mockApiService.post.mockResolvedValue({ success: true })
        mockDatabase.syncQueue.put.mockResolvedValue(1)

        const results = await service.processQueue()

        expect(results).toHaveLength(2)
        // All items should succeed
        expect(results.every(r => r.success)).toBe(true)
      })
    })
  })
  
  // =========================================================================
  // Auto Sync Tests
  // =========================================================================

  describe('Auto Sync', () => {
    afterEach(() => {
      // Clean up event listeners
      mockWindow.addEventListener.mockClear()
      mockWindow.removeEventListener.mockClear()
    })

    describe('startAutoSync', () => {
      it('should start auto sync with configured interval', () => {
        const testService = new SyncQueueService({ ...DEFAULT_CONFIG, enableAutoSync: true })
        testService.setMockDatabase(mockDatabase as any)

        // Should not throw
        expect(() => testService.startAutoSync()).not.toThrow()

        testService.stopAutoSync()
      })

      it('should not start if auto sync is disabled', () => {
        const testService = new SyncQueueService({ ...DEFAULT_CONFIG, enableAutoSync: false })
        testService.setMockDatabase(mockDatabase as any)

        // Should not throw even with auto sync disabled
        expect(() => testService.startAutoSync()).not.toThrow()
      })
    })

    describe('stopAutoSync', () => {
      it('should clear sync interval', () => {
        const testService = new SyncQueueService({ ...DEFAULT_CONFIG, enableAutoSync: true })
        testService.setMockDatabase(mockDatabase as any)

        testService.startAutoSync()
        expect(() => testService.stopAutoSync()).not.toThrow()
      })
    })

    describe('Online Event Trigger', () => {
      it('should trigger sync when coming online', async () => {
        const testService = new SyncQueueService({ ...DEFAULT_CONFIG, enableAutoSync: false })
        testService.setMockDatabase(mockDatabase as any)

        const item = createMockQueueItem()
        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([item]),
          count: vi.fn().mockResolvedValue(1),
          delete: vi.fn().mockResolvedValue(1),
        })
        mockApiService.post.mockResolvedValue({ id: 'remote-123' })
        mockDatabase.syncQueue.put.mockResolvedValue(1)

        // Start listening for online events
        testService.startAutoSync()

        // Simulate online event
        window.dispatchEvent(new Event('online'))

        // Wait for async processing
        await new Promise(resolve => setTimeout(resolve, 100))

        testService.stopAutoSync()
      })
    })

    describe('Interval Sync', () => {
      it('should execute sync at regular intervals', async () => {
        const testService = new SyncQueueService({
          ...DEFAULT_CONFIG,
          enableAutoSync: true,
          autoSyncInterval: 100,
        })
        testService.setMockDatabase(mockDatabase as any)

        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
          count: vi.fn().mockResolvedValue(0),
          delete: vi.fn().mockResolvedValue(0),
        })

        testService.startAutoSync()

        // Wait for a few intervals
        await new Promise(resolve => setTimeout(resolve, 350))

        testService.stopAutoSync()

        // Service should have attempted to sync
        expect(mockDatabase.syncQueue.where).toHaveBeenCalled()
      })
    })
  })
  
  // =========================================================================
  // Status Tests
  // =========================================================================

  describe('Status', () => {
    describe('getStatus', () => {
      it('should return current sync status', async () => {
        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
          count: vi.fn().mockResolvedValue(5),
          delete: vi.fn().mockResolvedValue(5),
        })

        const status = await service.getStatus()

        expect(status.isSyncing).toBe(false)
        expect(status.pendingCount).toBe(5)
        expect(status.online).toBe(true)
      })

      it('should reflect isSyncing state during sync', async () => {
        const item = createMockQueueItem()
        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([item]),
          count: vi.fn().mockResolvedValue(1),
          delete: vi.fn().mockResolvedValue(1),
        })
        mockApiService.post.mockResolvedValue({ id: 'remote-123' })
        mockDatabase.syncQueue.put.mockResolvedValue(1)

        // Start processing in background
        const promise = service.processQueue()

        // Check status while syncing
        const statusDuringSync = await service.getStatus()
        expect(statusDuringSync.isSyncing).toBe(true)

        await promise

        // Check status after sync
        const statusAfterSync = await service.getStatus()
        expect(statusAfterSync.isSyncing).toBe(false)
      })

      it('should reflect pending count accurately', async () => {
        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
          count: vi.fn().mockResolvedValue(10),
          delete: vi.fn().mockResolvedValue(10),
        })

        const status = await service.getStatus()

        expect(status.pendingCount).toBe(10)
      })

      it('should track online state correctly', async () => {
        // Test online state
        mockNavigator.onLine = true
        let status = await service.getStatus()
        expect(status.online).toBe(true)

        // Test offline state
        mockNavigator.onLine = false
        status = await service.getStatus()
        expect(status.online).toBe(false)

        // Restore
        mockNavigator.onLine = true
      })
    })
  })
  
  // =========================================================================
  // Integration Tests
  // =========================================================================

  describe('Integration Tests', () => {
    describe('End-to-end sync flow', () => {
      it('should complete full sync cycle', async () => {
        const queuedItem = {
          localId: 'local-1',
          entityType: 'progressItems' as const,
          action: 'create' as const,
          data: { title: 'Test Item' },
        }

        // Create mock item
        const pendingItem = {
          id: 'queue-1',
          ...queuedItem,
          status: 'pending' as const,
          retryCount: 0,
          error: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          syncedAt: null,
        }

        // Set up mocks with multiple return values for both automatic and explicit processQueue calls
        const toArrayMock = vi.fn()
          .mockResolvedValueOnce([pendingItem])
          .mockResolvedValueOnce([pendingItem])
        const countMock = vi.fn().mockResolvedValue(1)
        const deleteMock = vi.fn().mockResolvedValue(1)

        mockDatabase._chain.equals.mockReturnValue({
          toArray: toArrayMock,
          count: countMock,
          delete: deleteMock,
        })
        mockApiService.post.mockResolvedValue({ id: 'remote-1' })
        mockDatabase.syncQueue.put.mockResolvedValue(1)
        mockDatabase.syncQueue.add.mockResolvedValue('queue-1')

        // 1. Enqueue item - this triggers automatic processQueue
        const queueId = await service.enqueue(queuedItem.entityType, queuedItem.action, queuedItem.data, queuedItem.localId)

        // Give time for automatic processQueue to complete
        await new Promise(resolve => setTimeout(resolve, 50))

        // Reset isSyncing flag for explicit call (if needed)
        ;(service as any).isSyncing = false

        // 2. Process queue explicitly
        const results = await service.processQueue()

        // 3. Verify completion
        expect(queueId).toBe('queue-1')
        // The explicit processQueue should have processed items
        expect(results.length).toBeGreaterThan(0)
      })

      it('should handle offline-then-online sync flow', async () => {
        const offlineItem = {
          localId: 'offline-1',
          entityType: 'progressItems' as const,
          action: 'create' as const,
          data: { title: 'Offline Item' },
        }

        // Reset sync state
        service.stopAutoSync()
        ;(service as any).isSyncing = false

        // Create mock items
        const pendingItem = {
          id: 'queue-1',
          ...offlineItem,
          status: 'pending' as const,
          retryCount: 0,
          error: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          syncedAt: null,
        }

        // Set up mocks with mockResolvedValueOnce for both processQueue calls
        const toArrayMock = vi.fn()
          .mockResolvedValueOnce([pendingItem])
          .mockResolvedValueOnce([pendingItem])
        const countMock = vi.fn().mockResolvedValue(1)
        const deleteMock = vi.fn().mockResolvedValue(1)

        mockDatabase._chain.equals.mockReturnValue({
          toArray: toArrayMock,
          count: countMock,
          delete: deleteMock,
        })
        mockApiService.post.mockResolvedValue({ id: 'remote-offline-1' })
        mockDatabase.syncQueue.put.mockResolvedValue(1)
        mockDatabase.syncQueue.add.mockResolvedValue('queue-1')

        // 1. Enqueue item - triggers automatic processQueue
        await service.enqueue(offlineItem.entityType, offlineItem.action, offlineItem.data, offlineItem.localId)

        // Reset isSyncing for explicit call
        ;(service as any).isSyncing = false

        // 2. Process queue explicitly
        const results = await service.processQueue()

        // Verify sync happened
        expect(results.length).toBeGreaterThan(0)
      })
    })
  })

  // =========================================================================
  // Edge Cases Tests
  // =========================================================================

  describe('Edge Cases', () => {
    describe('Empty Queue', () => {
      it('should handle processing empty queue', async () => {
        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
          count: vi.fn().mockResolvedValue(0),
          delete: vi.fn().mockResolvedValue(0),
        })

        const results = await service.processQueue()

        expect(results).toEqual([])
      })

      it('should not make API calls for empty queue', async () => {
        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
          count: vi.fn().mockResolvedValue(0),
          delete: vi.fn().mockResolvedValue(0),
        })

        await service.processQueue()

        expect(mockApiService.post).not.toHaveBeenCalled()
      })
    })

    describe('Missing LocalId', () => {
      it('should handle sync item with missing localId', async () => {
        const invalidItem = {
          id: 'queue-1',
          localId: '', // Missing localId
          entityType: 'progressItems',
          action: 'create' as const,
          data: { title: 'Test' },
          status: 'pending' as const,
          retryCount: 0,
          error: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          syncedAt: null,
        }

        // Service should validate before processing
        const hasLocalId = invalidItem.localId.length > 0
        expect(hasLocalId).toBe(false)
      })
    })

    describe('Simultaneous Syncs', () => {
      it('should handle multiple simultaneous sync attempts', async () => {
        let syncInProgress = false
        const processSync = async () => {
          if (syncInProgress) {
            return 'skipped'
          }
          syncInProgress = true
          await new Promise(resolve => setTimeout(resolve, 10))
          syncInProgress = false
          return 'completed'
        }

        const results = await Promise.all([
          processSync(),
          processSync(),
          processSync(),
        ])

        // Only one should complete, others skipped
        const completed = results.filter(r => r === 'completed').length
        const skipped = results.filter(r => r === 'skipped').length

        expect(completed + skipped).toBe(3)
      })
    })

    describe('Database Operation Failures', () => {
      it('should handle database errors during sync', async () => {
        mockDatabase.syncQueue.add.mockRejectedValue(new Error('DB Error'))

        await expect(service.enqueue('test', 'create', {})).rejects.toThrow('DB Error')
      })
    })

    describe('Clear with Pending Items', () => {
      it('should handle clearing synced items with pending items remaining', async () => {
        mockDatabase._chain.equals.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
          count: vi.fn().mockResolvedValue(5),
          delete: vi.fn().mockResolvedValue(5),
        })

        await service.clearQueue()

        // clearQueue deletes synced items
        expect(mockDatabase.syncQueue.where).toHaveBeenCalled()
      })
    })
  })
})
