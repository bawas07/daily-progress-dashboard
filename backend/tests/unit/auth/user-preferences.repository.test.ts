import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserPreferencesRepository } from '../../../src/modules/auth/repositories/user.preferences.repository';
import { Prisma, UserPreferences } from '@prisma/client';
import { createMockPrismaClient, MockPrismaClient } from '../../../tests/setup/mocks/database.mock';
import { Container } from '../../../src/shared/container';

interface UpdatePreferencesData {
  defaultActiveDays?: string[];
  theme?: string;
  timezone?: string;
  enableNotifications?: boolean;
}

interface MockContainer {
  resolve: (name: string) => { client: MockPrismaClient } | null;
}

describe('UserPreferencesRepository', () => {
  let mockPrisma: MockPrismaClient;
  let repository: UserPreferencesRepository;

  const mockPreferences: UserPreferences = {
    id: 'pref-123',
    userId: 'user-123',
    defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    theme: 'auto',
    timezone: 'UTC',
    enableNotifications: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    const mockContainer: MockContainer = {
      resolve: vi.fn((name: string) => {
        if (name === 'DatabaseService') {
          return { client: mockPrisma };
        }
        return null;
      }),
    };
    repository = new UserPreferencesRepository(mockContainer as unknown as Container);
  });

  describe('findByUserId', () => {
    it('should return preferences when user exists', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue(mockPreferences);

      const result = await repository.findByUserId('user-123');

      expect(result).toEqual(mockPreferences);
      expect(mockPrisma.userPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should return null when preferences do not exist', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue(null);

      const result = await repository.findByUserId('non-existent-user');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create default preferences for user', async () => {
      const createdPreferences: UserPreferences = {
        id: 'pref-new',
        userId: 'user-new',
        defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        theme: 'auto',
        timezone: 'UTC',
        enableNotifications: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      mockPrisma.userPreferences.create.mockResolvedValue(createdPreferences);

      const result = await repository.create('user-new');

      expect(result).toEqual(createdPreferences);
      expect(mockPrisma.userPreferences.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-new',
          defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          theme: 'auto',
          timezone: 'UTC',
          enableNotifications: true,
        },
      });
    });
  });

  describe('update', () => {
    it('should update preferences with provided data', async () => {
      const updateData: UpdatePreferencesData = {
        theme: 'dark',
        timezone: 'America/New_York',
      };

      const updatedPreferences: UserPreferences = {
        ...mockPreferences,
        theme: updateData.theme!,
        timezone: updateData.timezone!,
      };

      mockPrisma.userPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await repository.update('user-123', updateData);

      expect(result).toEqual(updatedPreferences);
      expect(mockPrisma.userPreferences.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: {
          theme: 'dark',
          timezone: 'America/New_York',
        },
      });
    });

    it('should update enableNotifications flag', async () => {
      const updateData: UpdatePreferencesData = {
        enableNotifications: false,
      };

      const updatedPreferences: UserPreferences = {
        ...mockPreferences,
        enableNotifications: false,
      };

      mockPrisma.userPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await repository.update('user-123', updateData);

      expect(result.enableNotifications).toBe(false);
      expect(mockPrisma.userPreferences.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: { enableNotifications: false },
      });
    });

    it('should update defaultActiveDays', async () => {
      const updateData: UpdatePreferencesData = {
        defaultActiveDays: ['mon', 'wed', 'fri'],
      };

      const updatedPreferences: UserPreferences = {
        ...mockPreferences,
        defaultActiveDays: ['mon', 'wed', 'fri'],
      };

      mockPrisma.userPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await repository.update('user-123', updateData);

      expect(result.defaultActiveDays).toEqual(['mon', 'wed', 'fri']);
    });
  });

  describe('error handling', () => {
    it('should throw error when updating non-existent user preferences', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record to update does not exist',
        'P2025',
        '1.0'
      );
      mockPrisma.userPreferences.update.mockRejectedValue(prismaError);

      await expect(repository.update('non-existent', { theme: 'dark' }))
        .rejects.toThrow('Database error updating preferences for user non-existent');
    });

    it('should throw error on duplicate preferences (unique constraint)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        'P2002',
        '1.0'
      );
      mockPrisma.userPreferences.create.mockRejectedValue(prismaError);

      await expect(repository.create('existing-user'))
        .rejects.toThrow('Database error creating preferences for user existing-user');
    });

    it('should throw error on database failure', async () => {
      mockPrisma.userPreferences.findUnique.mockRejectedValue(new Error('DB connection lost'));

      await expect(repository.findByUserId('user-123')).rejects.toThrow('Database error finding preferences for user user-123');
    });
  });
});
