/**
 * Vitest Setup File
 * Configures global test environment, mocks, and utilities
 */

import { vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

// Extend expect with testing-library matchers
expect.extend(matchers as unknown as TestingLibraryMatchers<unknown>)

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
class ResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserver,
})

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

// Mock localStorage with actual storage behavior
const createStorageMock = () => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
}

const localStorageMock = createStorageMock()
Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock,
})

// Mock sessionStorage with actual storage behavior
const sessionStorageMock = createStorageMock()
Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: sessionStorageMock,
})

// Mock navigator.onLine
const initialOnlineStatus = true
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  configurable: true,
  value: initialOnlineStatus,
})

// Mock window events
const eventListeners: Map<string, Set<Function>> = new Map()

const originalAddEventListener = window.addEventListener.bind(window)
const originalRemoveEventListener = window.removeEventListener.bind(window)

Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: vi.fn().mockImplementation((event: string, handler: EventListener) => {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set())
    }
    eventListeners.get(event)!.add(handler)
    originalAddEventListener(event, handler)
  }),
})

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: vi.fn().mockImplementation((event: string, handler: EventListener) => {
    eventListeners.get(event)?.delete(handler)
    originalRemoveEventListener(event, handler)
  }),
})

// Helper function to simulate window events
export function simulateEvent(event: string, data?: unknown): void {
  const listeners = eventListeners.get(event)
  if (listeners) {
    const customEvent = new CustomEvent(event, { detail: data })
    listeners.forEach((handler) => handler(customEvent))
  }
}

// Set online status
export function setOnlineStatus(isOnline: boolean): void {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: isOnline,
  })
  if (isOnline) {
    simulateEvent('online')
  } else {
    simulateEvent('offline')
  }
}

// Clear all event listeners (useful for cleanup)
export function clearEventListeners(): void {
  eventListeners.clear()
}

// Cleanup after each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear?.()
  sessionStorageMock.clear?.()
  setOnlineStatus(true)
})

// Global test timeout
vi.setConfig({
  testTimeout: 10000,
})

// Re-export commonly used utilities from vitest
export { vi, beforeEach, afterEach, beforeAll, afterAll }
