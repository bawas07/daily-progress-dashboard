import { vi } from 'vitest';

/**
 * Mock ModuleContainer for isolated unit testing.
 * Allows registering mock services and resetting between tests.
 */
export class MockContainer {
  private services = new Map<string, any>();
  private instances = new Map<string, any>();

  static create(): MockContainer {
    return new MockContainer();
  }

  /**
   * Register a mock service
   */
  register<T>(serviceName: string, mock: T): void {
    this.services.set(serviceName, mock);
  }

  /**
   * Get a registered mock or create a spy
   */
  get<T>(serviceName: string): T {
    if (!this.instances.has(serviceName)) {
      const mock = this.services.get(serviceName);
      if (mock) {
        this.instances.set(serviceName, mock);
      } else {
        // Create a spy function for unregistered services
        this.instances.set(serviceName, vi.fn());
      }
    }
    return this.instances.get(serviceName);
  }

  /**
   * Check if a service is registered
   */
  has(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  /**
   * Clear all mocks
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();
  }

  /**
   * Reset all mock functions
   */
  reset(): void {
    this.services.forEach((mock) => {
      if (typeof mock === 'function' && vi.isMockFunction(mock)) {
        mock.mockReset();
      }
    });
    this.instances.forEach((instance) => {
      if (typeof instance === 'object') {
        Object.values(instance).forEach((value) => {
          if (vi.isMockFunction(value)) {
            value.mockReset();
          }
        });
      }
    });
  }
}

/**
 * Create a mock container with pre-registered database mock
 */
export function createMockedContainer(): MockContainer {
  const mockContainer = MockContainer.create();
  
  // Register common mocks
  mockContainer.register('DatabaseService', {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    client: {
      // Mock Prisma client
      user: { findUnique: vi.fn(), create: vi.fn() },
      progressItem: { findMany: vi.fn(), create: vi.fn() },
      progressLog: { create: vi.fn(), findMany: vi.fn() },
      commitment: { findMany: vi.fn(), create: vi.fn() },
      commitmentLog: { create: vi.fn(), findMany: vi.fn() },
      timelineEvent: { findMany: vi.fn(), create: vi.fn() },
    },
  });

  mockContainer.register('JwtService', {
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
    verify: vi.fn().mockReturnValue({ sub: 'user-123', email: 'test@test.com' }),
    decode: vi.fn().mockReturnValue({ sub: 'user-123' }),
  });

  mockContainer.register('LoggerService', {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  });

  return mockContainer;
}
