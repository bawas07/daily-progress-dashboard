
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RefreshTokenRepository } from '../../../src/modules/auth/repositories/refresh-token.repository';
// @ts-ignore - MockPrismaClient might verify against real client but we generated it
import { createMockPrismaClient, MockPrismaClient } from '../../setup/mocks/database.mock';
import { Container } from '../../../src/shared/container';

interface MockContainer {
    resolve: (name: string) => { client: MockPrismaClient } | null;
}

describe('RefreshTokenRepository', () => {
    let repository: RefreshTokenRepository;
    let mockPrisma: any;

    const mockUserId = 'user-123';
    const mockTokenHash = 'hash-123';
    // Use a fixed date for consistency
    const now = new Date('2024-01-01T00:00:00Z');
    const mockExpiresAt = new Date('2024-01-02T00:00:00Z');

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(now);

        mockPrisma = createMockPrismaClient();
        const mockContainer: MockContainer = {
            resolve: vi.fn((name: string) => {
                if (name === 'DatabaseService') {
                    return { client: mockPrisma };
                }
                return null;
            }),
        };

        // We need to assume the repository exists or will exist logic
        // Since we are TDDing, the file doesn't exist yet, so we can't import it really
        // But in strict TDD, we write the test then the code.
        // However, TS will complain if I import something that doesn't exist.
        // I created the placeholder test file, but I haven't created the repository file yet.
        // So I must create the repository file (empty shell) FIRST or else this test file won't even compile/run (TS error).
        // But let's write the test content assuming it exists, and I will create the file immediately after.

        repository = new RefreshTokenRepository(mockContainer as unknown as Container);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('create', () => {
        it('should create a refresh token with correct data', async () => {
            const expectedToken = {
                id: 'token-123',
                userId: mockUserId,
                tokenHash: mockTokenHash,
                expiresAt: mockExpiresAt,
                createdAt: now,
            };

            mockPrisma.refreshToken.create.mockResolvedValue(expectedToken);

            const result = await repository.create(mockUserId, mockTokenHash, mockExpiresAt);

            expect(result).toEqual(expectedToken);
            expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
                data: {
                    userId: mockUserId,
                    tokenHash: mockTokenHash,
                    expiresAt: mockExpiresAt,
                },
            });
        });
    });

    describe('findByTokenHash', () => {
        it('should return token when found', async () => {
            const expectedToken = {
                id: 'token-123',
                userId: mockUserId,
                tokenHash: mockTokenHash,
                expiresAt: mockExpiresAt,
                createdAt: now,
            };

            mockPrisma.refreshToken.findUnique.mockResolvedValue(expectedToken);

            const result = await repository.findByTokenHash(mockTokenHash);

            expect(result).toEqual(expectedToken);
            expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
                where: { tokenHash: mockTokenHash },
            });
        });

        it('should return null when not found', async () => {
            mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

            const result = await repository.findByTokenHash('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('delete', () => {
        it('should delete token by id', async () => {
            // Prisma delete returns the deleted object
            const deletedToken = { id: 'token-123' };
            mockPrisma.refreshToken.delete.mockResolvedValue(deletedToken);

            await repository.delete('token-123');

            expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
                where: { id: 'token-123' },
            });
        });
    });

    describe('deleteAllForUser', () => {
        it('should delete all tokens for user', async () => {
            mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

            await repository.deleteAllForUser(mockUserId);

            expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { userId: mockUserId },
            });
        });
    });

    describe('deleteExpired', () => {
        it('should delete expired tokens', async () => {
            mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 10 });

            await repository.deleteExpired();

            expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: {
                    expiresAt: {
                        lt: now,
                    },
                },
            });
        });
    });
});
