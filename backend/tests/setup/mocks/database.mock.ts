import { vi } from 'vitest';

/**
 * Mock Prisma Client for unit testing
 * Provides spy functions for all Prisma operations
 */
export function createMockPrismaClient() {
  return {
    // User model
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    
    // UserPreferences model
    userPreferences: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    
    // ProgressItem model
    progressItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    
    // ProgressLog model
    progressLog: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    
    // Commitment model
    commitment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    
    // CommitmentLog model
    commitmentLog: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    
    // TimelineEvent model
    timelineEvent: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    
    // Connection methods
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    
    // Transaction
    $transaction: vi.fn(async (callback) => callback(prisma)),
  };
}

/**
 * Create a typed mock Prisma client
 */
export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>;

/**
 * Default mock Prisma client instance
 */
export const mockPrismaClient = createMockPrismaClient();
