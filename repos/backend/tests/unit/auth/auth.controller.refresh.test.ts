import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Context } from 'hono';
import { AuthController } from '../../../src/modules/auth/auth.controller';
import type { AuthService } from '../../../src/modules/auth/services/auth.service';

// Mock types
interface MockAuthService {
    login: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    getProfile: ReturnType<typeof vi.fn>;
    refreshToken: ReturnType<typeof vi.fn>;
    revokeToken: ReturnType<typeof vi.fn>;
}

interface MockContext {
    req: {
        json: () => Promise<unknown>;
        header: (name: string) => string | undefined;
    };
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    json: ReturnType<typeof vi.fn>;
    status: number;
    _setStatus: (status: number) => void;
}

function createMockContext<T = unknown>(body: T | null = null, headers: Record<string, string> = {}): MockContext & { _setStatus: (status: number) => void } {
    let status = 200;
    return {
        req: {
            json: async () => body || {},
            header: (name: string) => headers[name] || headers[name.toLowerCase()] || undefined,
        },
        get: vi.fn().mockReturnValue(undefined),
        set: vi.fn(),
        json: vi.fn().mockImplementation((data, statusCode) => {
            status = statusCode || 200;
            return { data, status };
        }),
        _setStatus: (s: number) => { status = s; },
        get status() { return status; },
    };
}

describe('Auth Controller - Refresh Token Endpoints', () => {
    let mockAuthService: MockAuthService;
    let mockContext: MockContext;

    beforeEach(() => {
        mockAuthService = {
            login: vi.fn(),
            register: vi.fn(),
            getProfile: vi.fn(),
            refreshToken: vi.fn(),
            revokeToken: vi.fn(),
        };
        mockContext = createMockContext(null);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('POST /refresh', () => {
        it('should return 200 with new tokens', async () => {
            const body = { refreshToken: 'valid-refresh-token' };
            const result = {
                token: 'new-access-token',
                refreshToken: 'new-refresh-token'
            };

            mockContext = createMockContext(body);
            mockAuthService.refreshToken.mockResolvedValue(result);

            const authController = new AuthController(mockAuthService as unknown as AuthService);
            await authController.refresh()(mockContext as unknown as Context);

            expect(mockContext.status).toBe(200);
            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'S001',
                    data: result
                }),
                200
            );
            expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
        });

        it('should return 400 if refreshToken is missing', async () => {
            mockContext = createMockContext({}); // Empty body

            const authController = new AuthController(mockAuthService as unknown as AuthService);
            await authController.refresh()(mockContext as unknown as Context);

            expect(mockContext.status).toBe(400);
            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'E001'
                }),
                400
            );
        });

        it('should return 401 if refresh token is invalid', async () => {
            const body = { refreshToken: 'invalid-token' };
            mockContext = createMockContext(body);
            mockAuthService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

            const authController = new AuthController(mockAuthService as unknown as AuthService);
            await authController.refresh()(mockContext as unknown as Context);

            expect(mockContext.status).toBe(401);
            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'E001', // Or E004 Authorization failed?
                    message: 'Invalid refresh token'
                }),
                401
            );
        });
    });

    describe('POST /revoke', () => {
        it('should return 200 on success', async () => {
            const body = { refreshToken: 'valid-refresh-token' };
            mockContext = createMockContext(body);
            mockAuthService.revokeToken.mockResolvedValue(undefined);

            const authController = new AuthController(mockAuthService as unknown as AuthService);
            await authController.revoke()(mockContext as unknown as Context);

            expect(mockContext.status).toBe(200);
            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'S001',
                    message: 'Token revoked successfully'
                }),
                200
            );
            expect(mockAuthService.revokeToken).toHaveBeenCalledWith('valid-refresh-token');
        });

        it('should return 400 if refreshToken is missing', async () => {
            mockContext = createMockContext({}); // Empty body

            const authController = new AuthController(mockAuthService as unknown as AuthService);
            await authController.revoke()(mockContext as unknown as Context);

            expect(mockContext.status).toBe(400);
        });
    });
});
