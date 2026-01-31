
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RefreshTokenService } from '../../../src/modules/auth/services/refresh-token.service';
import { RefreshTokenRepository } from '../../../src/modules/auth/repositories/refresh-token.repository';
// @ts-ignore
import { createMockPrismaClient } from '../../setup/mocks/database.mock';
import { Container } from '../../../src/shared/container';

describe('RefreshTokenService', () => {
    let service: RefreshTokenService;
    let mockRepo: any; // Mock the repository class

    const mockUserId = 'user-123';

    beforeEach(() => {
        vi.useFakeTimers();

        // Mock Repository
        mockRepo = {
            create: vi.fn(),
            findByTokenHash: vi.fn(),
            delete: vi.fn(),
            deleteAllForUser: vi.fn(),
            deleteExpired: vi.fn(),
        };

        // Mock Container
        const mockContainer = {
            resolve: vi.fn((name: string) => {
                if (name === 'RefreshTokenRepository') {
                    return mockRepo;
                }
                return null;
            }),
        };

        service = new RefreshTokenService(mockContainer as unknown as Container);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('generateRefreshToken', () => {
        it('should generate a token and save hash', async () => {
            const mockSavedToken = { id: 'token-123' };
            mockRepo.create.mockResolvedValue(mockSavedToken);

            const token = await service.generateRefreshToken(mockUserId);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(20); // Should be a long random string

            expect(mockRepo.create).toHaveBeenCalledWith(
                mockUserId,
                expect.any(String), // Hash
                expect.any(Date)    // Expiry
            );
        });
    });

    describe('validateRefreshToken', () => {
        it('should return token record if valid', async () => {
            const token = 'valid-token';
            // We need to know how the service hashes it to mock the Repo call correctly?
            // Or we just expect findByTokenHash to be called.

            const mockTokenRecord = {
                id: 'token-123',
                userId: mockUserId,
                expiresAt: new Date(Date.now() + 10000), // Valid
            };
            mockRepo.findByTokenHash.mockResolvedValue(mockTokenRecord);

            const result = await service.validateRefreshToken(token);

            expect(result).toEqual(mockTokenRecord);
            expect(mockRepo.findByTokenHash).toHaveBeenCalled();
        });

        it('should return null if not found', async () => {
            mockRepo.findByTokenHash.mockResolvedValue(null);
            const result = await service.validateRefreshToken('invalid');
            expect(result).toBeNull();
        });

        it('should return null if expired', async () => {
            const mockTokenRecord = {
                id: 'token-123',
                userId: mockUserId,
                expiresAt: new Date(Date.now() - 10000), // Expired
            };
            mockRepo.findByTokenHash.mockResolvedValue(mockTokenRecord);

            const result = await service.validateRefreshToken('expired');
            expect(result).toBeNull();
        });
    });

    describe('rotateRefreshToken', () => {
        it('should validate, delete old, and generate new token', async () => {
            const oldToken = 'old-token';
            const mockOldRecord = {
                id: 'token-123',
                userId: mockUserId,
                expiresAt: new Date(Date.now() + 10000),
            };

            // Mock validation (reusing logic from validateRefreshToken implementation implicitly)
            // But verify methods are called
            mockRepo.findByTokenHash.mockResolvedValue(mockOldRecord);
            mockRepo.create.mockResolvedValue({ id: 'new-token-id' });

            const newToken = await service.rotateRefreshToken(oldToken);

            // 1. Check delete old
            expect(mockRepo.delete).toHaveBeenCalledWith('token-123');

            // 2. Check generate new
            expect(newToken).toBeDefined();
            expect(newToken).not.toBe(oldToken);
        });

        it('should throw error if token invalid during rotation', async () => {
            mockRepo.findByTokenHash.mockResolvedValue(null);

            await expect(service.rotateRefreshToken('invalid')).rejects.toThrow('Invalid refresh token');

            expect(mockRepo.delete).not.toHaveBeenCalled();
            expect(mockRepo.create).not.toHaveBeenCalled();
        });
    });
});
