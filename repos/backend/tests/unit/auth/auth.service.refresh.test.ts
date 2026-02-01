import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService, AuthenticationError } from '../../../src/modules/auth/services/auth.service';
import { UserRepository } from '../../../src/modules/auth/repositories/user.repository';
import { UserPreferencesRepository } from '../../../src/modules/auth/repositories/user.preferences.repository';
import { PasswordService } from '../../../src/modules/auth/services/password.service';
import { JwtService } from '../../../src/shared/jwt/jwt.service';
import { RefreshTokenService } from '../../../src/modules/auth/services/refresh-token.service';

describe('AuthService - Refresh Token', () => {
    let authService: AuthService;
    let mockRefreshTokenService: any;
    let mockJwtService: any;
    let mockUserRepository: any;

    // Mock data
    const userId = 'user-123';
    const email = 'test@example.com';
    const oldRefreshToken = 'valid-old-refresh-token';
    const newRefreshToken = 'valid-new-refresh-token';
    const newAccessToken = 'new-access-token';

    beforeEach(() => {
        mockUserRepository = {
            findById: vi.fn(),
        };

        mockRefreshTokenService = {
            validateRefreshToken: vi.fn(),
            rotateRefreshToken: vi.fn(),
            generateRefreshToken: vi.fn(),
            delete: vi.fn(), // If needed, or maybe revoke logic uses repository directly? 
            // Wait, RefreshTokenService should have a revoke method or we use repository?
            // Task says "Implement logout with refresh token revocation" in 2.8.
            // Ideally RefreshTokenService should expose revoke.
            // For now assuming we might add revoke method to RefreshTokenService or access repo.
            // Let's assume we add revoke to RefreshTokenService or just use delete.
            // RefreshTokenService has delete? No, it has rotateRefreshToken which calls delete.
            // We should add revoke (delete) to RefreshTokenService.
            revokeRefreshToken: vi.fn(),
        };

        mockJwtService = {
            sign: vi.fn(),
        };

        // We only need these for the constructor
        const mockPreferencesRepository = {} as any;
        const mockPasswordService = {} as any;

        authService = new AuthService(
            mockUserRepository,
            mockPreferencesRepository,
            mockPasswordService,
            mockJwtService,
            mockRefreshTokenService // We will inject this
        );
    });

    describe('refreshToken', () => {
        it('should rotate refresh token and return new pair', async () => {
            // Setup
            mockRefreshTokenService.rotateRefreshToken.mockResolvedValue(newRefreshToken);
            mockRefreshTokenService.validateRefreshToken.mockResolvedValue({ userId, tokenHash: 'hash', expiresAt: new Date() });
            mockJwtService.sign.mockReturnValue(newAccessToken);
            mockUserRepository.findById.mockResolvedValue({ id: userId, email });

            // Execute
            const result = await authService.refreshToken(oldRefreshToken);

            // Verify
            expect(mockRefreshTokenService.rotateRefreshToken).toHaveBeenCalledWith(oldRefreshToken);
            expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: userId, email });
            expect(result).toEqual({
                token: newAccessToken,
                refreshToken: newRefreshToken
            });
        });

        it('should throw error if refresh token is invalid', async () => {
            // Mock validation failing (return null)
            mockRefreshTokenService.validateRefreshToken.mockResolvedValue(null);

            await expect(authService.refreshToken('invalid-token'))
                .rejects.toThrow('Invalid refresh token');
        });

        it('should throw error if user not found', async () => {
            mockRefreshTokenService.validateRefreshToken.mockResolvedValue({ userId: 'missing-user', tokenHash: 'hash', expiresAt: new Date() });
            mockUserRepository.findById.mockResolvedValue(null);

            await expect(authService.refreshToken('valid-token'))
                .rejects.toThrow('User not found');
        });
    });

    describe('revokeToken', () => {
        it('should revoke the refresh token', async () => {
            mockRefreshTokenService.revokeRefreshToken.mockResolvedValue(undefined);

            await authService.revokeToken(oldRefreshToken);

            expect(mockRefreshTokenService.revokeRefreshToken).toHaveBeenCalledWith(oldRefreshToken);
        });
    });
});
