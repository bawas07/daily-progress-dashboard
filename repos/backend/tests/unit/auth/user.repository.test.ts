import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRepository } from '../../../src/modules/auth/repositories/user.repository';
import { Prisma, PrismaClient, User } from '@prisma/client';
import { createMockPrismaClient, MockPrismaClient } from '../../../tests/setup/mocks/database.mock';
import { Container } from '../../../src/shared/container';

interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
}

interface MockContainer {
  resolve: (name: string) => { client: MockPrismaClient } | null;
}

describe('UserRepository', () => {
  let mockPrisma: MockPrismaClient;
  let repository: UserRepository;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    name: 'Test User',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    lastLogin: null,
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
    repository = new UserRepository(mockContainer as unknown as Container);
  });

  describe('findById', () => {
    it('should return user when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findById('user-123');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should return null when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when user exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user does not exist', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user with all required fields', async () => {
      const createData: CreateUserData = {
        email: 'new@example.com',
        passwordHash: 'new-hashed-password',
        name: 'New User',
      };

      const createdUser: User = {
        id: 'user-new',
        email: createData.email,
        passwordHash: createData.passwordHash,
        name: createData.name,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        lastLogin: null,
      };

      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await repository.create(createData);

      expect(result).toEqual(createdUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: createData.email,
          passwordHash: createData.passwordHash,
          name: createData.name,
        },
      });
    });
  });

  describe('updateLastLogin', () => {
    it('should update lastLogin timestamp', async () => {
      const updatedUser: User = {
        ...mockUser,
        lastLogin: new Date('2024-01-02T00:00:00Z'),
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await repository.updateLastLogin('user-123');

      expect(result).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { lastLogin: expect.any(Date) },
      });
      expect(result.lastLogin).toBeInstanceOf(Date);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      mockPrisma.user.delete.mockResolvedValue(mockUser);

      const result = await repository.delete('user-123');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });
  });

  describe('error handling', () => {
    it('should throw error when deleting non-existent user', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record to delete does not exist',
        'P2025',
        '1.0'
      );
      mockPrisma.user.delete.mockRejectedValue(prismaError);

      await expect(repository.delete('non-existent')).rejects.toThrow('Database error deleting user non-existent');
    });

    it('should throw error when updating non-existent user', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record to update does not exist',
        'P2025',
        '1.0'
      );
      mockPrisma.user.update.mockRejectedValue(prismaError);

      await expect(repository.updateLastLogin('non-existent')).rejects.toThrow('Database error updating last login for user non-existent');
    });

    it('should throw error on duplicate email', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        'P2002',
        '1.0'
      );
      mockPrisma.user.create.mockRejectedValue(prismaError);

      await expect(repository.create({
        email: 'existing@example.com',
        passwordHash: 'hash',
        name: 'Test'
      })).rejects.toThrow('Database error creating user existing@example.com');
    });

    it('should throw error on database connection failure', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Connection failed'));

      await expect(repository.findById('user-123')).rejects.toThrow('Database error finding user user-123');
    });
  });
});
