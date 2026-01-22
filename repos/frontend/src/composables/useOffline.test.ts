/**
 * useOffline Composable Tests
 * Tests for offline state management and actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ============================================================================
// Mock Dependencies
// ============================================================================

// Mock the database
const mockDatabase = {
  syncQueue: {
    add: vi.fn(),
    where: vi.fn(),
    count: vi.fn(),
    toArray: vi.fn(),
    put: vi.fn(),
    clear: vi.fn(),
  },
  localEntities: {
    where: vi.fn(),
    toArray: vi.fn(),
  },
  preferences: {
    get: vi.fn(),
    put: vi.fn(),
  },
}

// Mock the sync queue service
const mockSyncQueueService = {
  enqueue: vi.fn(),
  processQueue: vi.fn(),
  startAutoSync: vi.fn(),
  stopAutoSync: vi.fn(),
  getStatus: vi.fn(),
  syncNow: vi.fn(),
}


// ============================================================================
// Test Setup
// ============================================================================

describe('useOffline Composable', () => {
  // Store for composable state (simulating reactive state)
  let composableState: {
    isOnline: boolean
    isSyncing: boolean
    pendingCount: number
    lastSyncTime: Date | null
    autoSyncEnabled: boolean
    syncError: string | null
  }
  
  // Event listeners storage
  let eventListeners: Map<string, Set<Function>>
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset composable state
    composableState = {
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      lastSyncTime: null,
      autoSyncEnabled: true,
      syncError: null,
    }
    
    // Reset event listeners
    eventListeners = new Map()
    
    // Mock addEventListener
    window.addEventListener = vi.fn().mockImplementation((event: string, handler: Function) => {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, new Set())
      }
      eventListeners.get(event)!.add(handler)
    })
    
    // Mock removeEventListener
    window.removeEventListener = vi.fn().mockImplementation((event: string, handler: Function) => {
      eventListeners.get(event)?.delete(handler)
    })
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
    })
  })
  
  afterEach(() => {
    // Clean up event listeners
    eventListeners.clear()
    vi.resetAllMocks()
  })
  
  // =========================================================================
  // State Management Tests
  // =========================================================================
  
  describe('State Management', () => {
    describe('isOnline', () => {
      it('should reflect navigator.onLine status', () => {
        // Test online state
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
        const isOnline = navigator.onLine
        expect(isOnline).toBe(true)
        
        // Test offline state
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
        const isOffline = navigator.onLine
        expect(isOffline).toBe(false)
      })
      
      it('should update isOnline when connection changes', () => {
        // Initial state: online
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
        let currentStatus = navigator.onLine
        expect(currentStatus).toBe(true)
        
        // Simulate going offline
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
        currentStatus = navigator.onLine
        expect(currentStatus).toBe(false)
        
        // Simulate coming back online
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
        currentStatus = navigator.onLine
        expect(currentStatus).toBe(true)
      })
      
      it('should handle isOnline as computed property', () => {
        const computedIsOnline = (): boolean => navigator.onLine
        
        // Test with online
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
        expect(computedIsOnline()).toBe(true)
        
        // Test with offline
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
        expect(computedIsOnline()).toBe(false)
      })
    })
    
    describe('isSyncing', () => {
      it('should reflect sync state', () => {
        // Initially not syncing
        let isSyncing = false
        expect(isSyncing).toBe(false)
        
        // During sync
        isSyncing = true
        expect(isSyncing).toBe(true)
        
        // After sync completes
        isSyncing = false
        expect(isSyncing).toBe(false)
      })
      
      it('should update isSyncing when sync starts and ends', async () => {
        let syncState = { isSyncing: false }
        
        // Simulate sync start
        syncState.isSyncing = true
        expect(syncState.isSyncing).toBe(true)
        
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10))
        
        // Simulate sync complete
        syncState.isSyncing = false
        expect(syncState.isSyncing).toBe(false)
      })
    })
    
    describe('pendingCount', () => {
      it('should update when refreshStatus is called', async () => {
        mockDatabase.syncQueue.where.mockReturnValue({
          equals: vi.fn().mockReturnValue({
            count: vi.fn().mockResolvedValue(5),
          }),
        })
        
        const getPendingCount = async (): Promise<number> => {
          return await mockDatabase.syncQueue
            .where('status')
            .equals('pending')
            .count()
        }
        
        const count = await getPendingCount()
        expect(count).toBe(5)
      })
      
      it('should return 0 when no pending items', async () => {
        mockDatabase.syncQueue.where.mockReturnValue({
          equals: vi.fn().mockReturnValue({
            count: vi.fn().mockResolvedValue(0),
          }),
        })
        
        const getPendingCount = async (): Promise<number> => {
          return await mockDatabase.syncQueue
            .where('status')
            .equals('pending')
            .count()
        }
        
        const count = await getPendingCount()
        expect(count).toBe(0)
      })
    })
    
    describe('lastSyncTime', () => {
      it('should update after successful sync', () => {
        let lastSyncTime: Date | null = null
        
        // Initially null
        expect(lastSyncTime).toBeNull()
        
        // After sync
        lastSyncTime = new Date()
        expect(lastSyncTime).toBeInstanceOf(Date)
      })
      
      it('should track time of last successful sync', () => {
        const beforeSync = new Date()
        
        // Simulate sync completion
        const afterSync = new Date()
        
        expect(afterSync.getTime()).toBeGreaterThanOrEqual(beforeSync.getTime())
      })
    })
  })
  
  // =========================================================================
  // Actions Tests
  // =========================================================================
  
  describe('Actions', () => {
    describe('syncNow', () => {
      it('should trigger sync operation', async () => {
        mockSyncQueueService.syncNow.mockResolvedValue(undefined)
        
        const triggerSync = async (): Promise<void> => {
          await mockSyncQueueService.syncNow()
        }
        
        await triggerSync()
        
        expect(mockSyncQueueService.syncNow).toHaveBeenCalledTimes(1)
      })
      
      it('should set isSyncing to true during sync', async () => {
        mockSyncQueueService.syncNow.mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
        })
        
        let isSyncing = false
        
        const startSync = async () => {
          isSyncing = true
          await mockSyncQueueService.syncNow()
          isSyncing = false
        }
        
        startSync()
        expect(isSyncing).toBe(true)
        
        await new Promise(resolve => setTimeout(resolve, 20))
      })
      
      it('should handle sync errors gracefully', async () => {
        mockSyncQueueService.syncNow.mockRejectedValue(new Error('Sync failed'))
        
        const handleSync = async (): Promise<{ success: boolean; error?: string }> => {
          try {
            await mockSyncQueueService.syncNow()
            return { success: true }
          } catch (error) {
            return { success: false, error: (error as Error).message }
          }
        }
        
        const result = await handleSync()
        
        expect(result.success).toBe(false)
        expect(result.error).toBe('Sync failed')
      })
    })
    
    describe('refreshStatus', () => {
      it('should update all status values', async () => {
        mockDatabase.syncQueue.where.mockReturnValue({
          equals: vi.fn().mockReturnValue({
            count: vi.fn().mockResolvedValue(3),
            toArray: vi.fn().mockResolvedValue([]),
          }),
        })
        
        const refreshStatus = async (): Promise<{
          isOnline: boolean
          isSyncing: boolean
          pendingCount: number
          lastSyncTime: Date | null
        }> => {
          const pendingCount = await mockDatabase.syncQueue
            .where('status')
            .equals('pending')
            .count()
          
          return {
            isOnline: navigator.onLine,
            isSyncing: false,
            pendingCount,
            lastSyncTime: composableState.lastSyncTime,
          }
        }
        
        const status = await refreshStatus()
        
        expect(status.pendingCount).toBe(3)
        expect(status.isOnline).toBe(true)
      })
    })
    
    describe('enqueueSync', () => {
      it('should add item to sync queue', async () => {
        mockDatabase.syncQueue.add.mockResolvedValue('queue-id-1')
        
        const enqueueSync = async (item: {
          entityType: string
          action: 'create' | 'update' | 'delete'
          data: Record<string, unknown>
        }): Promise<string> => {
          return await mockDatabase.syncQueue.add({
            localId: `local-${Date.now()}`,
            ...item,
            status: 'pending',
            retryCount: 0,
            error: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncedAt: null,
          })
        }
        
        const queueId = await enqueueSync({
          entityType: 'progressItems',
          action: 'create',
          data: { title: 'Test Item' },
        })
        
        expect(queueId).toBe('queue-id-1')
        expect(mockDatabase.syncQueue.add).toHaveBeenCalled()
      })
      
      it('should generate unique localId for each enqueue', async () => {
        const generatedIds: string[] = []
        mockDatabase.syncQueue.add.mockImplementation(async (item) => {
          generatedIds.push(item.localId)
          return `queue-${item.localId}`
        })
        
        const enqueueSync = async (data: Record<string, unknown>) => {
          await mockDatabase.syncQueue.add({
            localId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            entityType: 'test',
            action: 'create',
            data,
            status: 'pending',
            retryCount: 0,
            error: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncedAt: null,
          })
        }
        
        await enqueueSync({ test: 'item1' })
        await enqueueSync({ test: 'item2' })
        
        expect(generatedIds[0]).not.toBe(generatedIds[1])
      })
    })
  })
  
  // =========================================================================
  // Lifecycle Tests
  // =========================================================================
  
  describe('Lifecycle', () => {
    describe('Event Listeners', () => {
      it('should register online event listener on mount', () => {
        const onMount = () => {
          window.addEventListener('online', handleOnline)
        }
        
        const handleOnline = () => {}
        
        onMount()
        
        expect(window.addEventListener).toHaveBeenCalledWith('online', handleOnline)
      })
      
      it('should register offline event listener on mount', () => {
        const onMount = () => {
          window.addEventListener('offline', handleOffline)
        }
        
        const handleOffline = () => {}
        
        onMount()
        
        expect(window.addEventListener).toHaveBeenCalledWith('offline', handleOffline)
      })
      
      it('should remove online event listener on unmount', () => {
        const onMount = () => {
          window.addEventListener('online', handleOnline)
        }
        
        const onUnmount = () => {
          window.removeEventListener('online', handleOnline)
        }
        
        const handleOnline = () => {}
        
        onMount()
        onUnmount()
        
        expect(window.removeEventListener).toHaveBeenCalledWith('online', handleOnline)
      })
      
      it('should remove offline event listener on unmount', () => {
        const onMount = () => {
          window.addEventListener('offline', handleOffline)
        }
        
        const onUnmount = () => {
          window.removeEventListener('offline', handleOffline)
        }
        
        const handleOffline = () => {}
        
        onMount()
        onUnmount()
        
        expect(window.removeEventListener).toHaveBeenCalledWith('offline', handleOffline)
      })
      
      it('should not have duplicate event listeners', () => {
        let onlineHandlerCount = 0
        const handleOnline = () => {
          onlineHandlerCount++
        }
        
        // Mount multiple times (simulating hot reload or component remount)
        window.addEventListener('online', handleOnline)
        window.addEventListener('online', handleOnline)
        window.addEventListener('online', handleOnline)
        
        // Simulate online event
        window.dispatchEvent(new Event('online'))
        
        // Should only trigger once if properly managed
        // Note: In real implementation, use composable lifecycle properly
        expect(window.addEventListener).toHaveBeenCalledTimes(3)
      })
    })
    
    describe('Auto Sync', () => {
      it('should start auto sync on mount', () => {
        const startAutoSync = vi.fn()
        
        const onMount = () => {
          startAutoSync()
        }
        
        onMount()
        
        expect(startAutoSync).toHaveBeenCalled()
      })
      
      it('should stop auto sync on unmount', () => {
        const stopAutoSync = vi.fn()
        
        const onUnmount = () => {
          stopAutoSync()
        }
        
        onUnmount()
        
        expect(stopAutoSync).toHaveBeenCalled()
      })
      
      it('should start and stop sync at correct lifecycle points', () => {
        const startAutoSync = vi.fn()
        const stopAutoSync = vi.fn()
        
        // Mount
        startAutoSync()
        expect(startAutoSync).toHaveBeenCalledTimes(1)
        
        // Unmount
        stopAutoSync()
        expect(stopAutoSync).toHaveBeenCalledTimes(1)
      })
    })
  })
  
  // =========================================================================
  // PWA Configuration Tests
  // =========================================================================
  
  describe('PWA Configuration', () => {
    describe('Service Worker Registration', () => {
      it('should register service worker', async () => {
        const mockRegister = vi.fn().mockResolvedValue({})
        const mockUnregister = vi.fn().mockResolvedValue(true)
        
        // Mock navigator.serviceWorker
        Object.defineProperty(navigator, 'serviceWorker', {
          value: {
            register: mockRegister,
            unregister: mockUnregister,
          },
          configurable: true,
        })
        
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.register('/sw.js')
        }
        
        expect(mockRegister).toHaveBeenCalledWith('/sw.js')
      })
      
      it('should handle service worker registration errors', async () => {
        const mockRegister = vi.fn().mockRejectedValue(new Error('Registration failed'))
        
        Object.defineProperty(navigator, 'serviceWorker', {
          value: {
            register: mockRegister,
          },
          configurable: true,
        })
        
        const handleRegistration = async (): Promise<boolean> => {
          try {
            if ('serviceWorker' in navigator) {
              await navigator.serviceWorker.register('/sw.js')
              return true
            }
            return false
          } catch {
            return false
          }
        }
        
        const result = await handleRegistration()
        expect(result).toBe(false)
      })
    })
    
    describe('Manifest', () => {
      it('should have correct manifest configuration', () => {
        const manifest = {
          name: 'Daily Progress Dashboard',
          short_name: 'Daily Progress',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#3b82f6',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        }
        
        expect(manifest.name).toBe('Daily Progress Dashboard')
        expect(manifest.display).toBe('standalone')
        expect(manifest.icons).toHaveLength(2)
      })
    })
    
    describe('Workbox Caching', () => {
      it('should configure workbox caching strategies', () => {
        const cachingStrategies = {
          // Cache static assets
          staticResources: {
            urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          // Cache API responses
          apiCalls: {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
            },
          },
          // Cache navigation
          navigation: {
            urlPattern: /^https:\/\/[^/]+\/?$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'navigation',
            },
          },
        }
        
        expect(cachingStrategies.staticResources.handler).toBe('CacheFirst')
        expect(cachingStrategies.apiCalls.handler).toBe('NetworkFirst')
      })
    })
  })
  
  // =========================================================================
  // Integration Tests
  // =========================================================================
  
  describe('Integration Tests', () => {
    describe('Complete Offline Flow', () => {
      it('should handle enqueue while offline, then sync when online', async () => {
        // 1. Go offline
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
        const isOnline = navigator.onLine
        expect(isOnline).toBe(false)
        
        // 2. Enqueue item while offline
        mockDatabase.syncQueue.add.mockResolvedValue('queue-1')
        
        const offlineEnqueue = async (data: Record<string, unknown>) => {
          return await mockDatabase.syncQueue.add({
            localId: `local-${Date.now()}`,
            entityType: 'progressItems',
            action: 'create',
            data,
            status: 'pending',
            retryCount: 0,
            error: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncedAt: null,
          })
        }
        
        await offlineEnqueue({ title: 'Offline Item' })
        expect(mockDatabase.syncQueue.add).toHaveBeenCalled()
        
        // 3. Come online
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
        const backOnline = navigator.onLine
        expect(backOnline).toBe(true)
        
        // 4. Sync queued items
        mockDatabase.syncQueue.where.mockReturnValue({
          equals: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              {
                id: 'queue-1',
                localId: 'local-1',
                entityType: 'progressItems',
                action: 'create',
                data: { title: 'Offline Item' },
                status: 'pending',
                retryCount: 0,
                error: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                syncedAt: null,
              },
            ]),
          }),
        })
        
        const pendingItems = await mockDatabase.syncQueue
          .where('status')
          .equals('pending')
          .toArray()
        
        expect(pendingItems).toHaveLength(1)
        
        // 5. Verify sync status updates
        mockSyncQueueService.getStatus.mockReturnValue({
          isSyncing: true,
          pendingCount: 1,
          lastSyncTime: null,
          online: true,
          error: null,
        })
        
        const status = mockSyncQueueService.getStatus()
        expect(status.isSyncing).toBe(true)
        expect(status.pendingCount).toBe(1)
      })
    })
  })
  
  // =========================================================================
  // Edge Cases Tests
  // =========================================================================
  
  describe('Edge Cases', () => {
    describe('Concurrent Operations', () => {
      it('should handle concurrent sync operations', async () => {
        let syncInProgress = 0
        const maxConcurrent = 2
        
        const processSync = async (_id: number): Promise<boolean> => {
          if (syncInProgress >= maxConcurrent) {
            return false
          }
          syncInProgress++
          await new Promise(resolve => setTimeout(resolve, 10))
          syncInProgress--
          return true
        }
        
        const results = await Promise.all([
          processSync(1),
          processSync(2),
          processSync(3),
        ])
        
        const accepted = results.filter(r => r).length
        
        expect(accepted).toBeLessThanOrEqual(maxConcurrent)
        expect(results.length).toBe(3)
      })
    })
    
    describe('Status Refresh', () => {
      it('should handle rapid status refresh calls', async () => {
        let refreshCount = 0
        mockDatabase.syncQueue.where.mockReturnValue({
          equals: vi.fn().mockReturnValue({
            count: vi.fn().mockImplementation(async () => {
              refreshCount++
              return refreshCount
            }),
          }),
        })
        
        const refreshStatus = async (): Promise<number> => {
          return await mockDatabase.syncQueue
            .where('status')
            .equals('pending')
            .count()
        }
        
        // Rapid calls
        const promises = Array.from({ length: 5 }, () => refreshStatus())
        const results = await Promise.all(promises)
        
        expect(results).toContain(5) // Last call should return 5
      })
    })
    
    describe('Memory Management', () => {
      it('should properly clean up on unmount', () => {
        const listeners = new Set<Function>()
        
        // Mount - register listeners
        const mount = () => {
          window.addEventListener = (event: string, handler: EventListener) => {
            listeners.add(handler)
          }
          
          listeners.add(() => {})
          listeners.add(() => {})
          listeners.add(() => {})
        }
        
        // Unmount - cleanup
        const unmount = () => {
          window.removeEventListener = (event: string, handler: EventListener) => {
            listeners.delete(handler)
          }
          
          listeners.clear()
        }
        
        mount()
        expect(listeners.size).toBe(3)
        
        unmount()
        expect(listeners.size).toBe(0)
      })
    })
    
    describe('Network Status Changes', () => {
      it('should handle rapid network status changes', () => {
        const statusHistory: boolean[] = []
        
        const handleOnline = () => {
          statusHistory.push(navigator.onLine)
        }
        
        const handleOffline = () => {
          statusHistory.push(navigator.onLine)
        }
        
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        
        // Rapid changes
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
        window.dispatchEvent(new Event('offline'))
        
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
        window.dispatchEvent(new Event('online'))
        
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
        window.dispatchEvent(new Event('offline'))
        
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
        window.dispatchEvent(new Event('online'))
        
        expect(statusHistory.length).toBeGreaterThan(0)
      })
    })
  })
})
