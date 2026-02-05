import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './auth.store';

// Mock the API client
const mockPost = vi.fn();
const mockGet = vi.fn();

vi.mock('@/shared/api/client', () => ({
    useApiClient: () => ({
        post: mockPost,
        get: mockGet,
    }),
}));

describe('Auth Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('initializes with default state', () => {
        const store = useAuthStore();
        expect(store.user).toBeNull();
        expect(store.token).toBeNull();
        expect(store.isAuthenticated).toBe(false);
        expect(store.isLoading).toBe(false);
        expect(store.error).toBeNull();
    });

    it('login action updates state and stores token', async () => {
        const store = useAuthStore();
        const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
        const mockToken = 'mock-jwt-token';
        const mockRefreshToken = 'mock-refresh-token';
        const mockResponse = {
            data: {
                data: {
                    user: mockUser,
                    token: mockToken,
                    refreshToken: mockRefreshToken
                },
                code: 'S001',
                message: 'Login successful'
            }
        };

        mockPost.mockResolvedValue(mockResponse);

        await store.login({ email: 'test@example.com', password: 'password123' });

        expect(mockPost).toHaveBeenCalledWith('/auth/login', {
            email: 'test@example.com',
            password: 'password123',
        });
        expect(store.user).toEqual(mockUser);
        expect(store.token).toBe(mockToken);
        expect(store.refreshToken).toBe(mockRefreshToken);
        expect(store.isAuthenticated).toBe(true);
        expect(store.error).toBeNull();
        expect(localStorage.getItem('auth_token')).toBe(mockToken);
        expect(localStorage.getItem('refresh_token')).toBe(mockRefreshToken);
    });

    it('handles login failure', async () => {
        const store = useAuthStore();
        const mockError = new Error('Invalid credentials');
        mockPost.mockRejectedValue(mockError);

        await expect(store.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow();

        expect(store.user).toBeNull();
        expect(store.token).toBeNull();
        expect(store.isAuthenticated).toBe(false);
        expect(store.error).toBe('Invalid credentials');
    });

    it('register action updates state and stores token', async () => {
        const store = useAuthStore();
        const mockUser = { id: '2', email: 'new@example.com', name: 'New User' };
        const mockPreferences = {
            theme: 'auto',
            timezone: 'UTC',
            defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
            enableNotifications: true
        };
        const mockResponse = {
            data: {
                data: {
                    user: mockUser,
                    preferences: mockPreferences
                },
                code: 'S002',
                message: 'Registration successful'
            }
        };

        mockPost.mockResolvedValue(mockResponse);

        await store.register({
            name: 'New User',
            email: 'new@example.com',
            password: 'password123',
        });

        expect(mockPost).toHaveBeenCalledWith('/auth/register', {
            name: 'New User',
            email: 'new@example.com',
            password: 'password123',
        });
        expect(store.user).toEqual(mockUser);
        // Registration doesn't set token - user must login separately
        expect(store.token).toBeNull();
        expect(store.isAuthenticated).toBe(false);
    });

    it('logout action clears state and removes token', () => {
        const store = useAuthStore();
        store.token = 'existing-token';
        store.refreshToken = 'existing-refresh-token';
        store.user = { id: '1', email: 'test@example.com', name: 'Test' };
        localStorage.setItem('auth_token', 'existing-token');
        localStorage.setItem('refresh_token', 'existing-refresh-token');

        store.logout();

        expect(store.user).toBeNull();
        expect(store.token).toBeNull();
        expect(store.refreshToken).toBeNull();
        expect(store.isAuthenticated).toBe(false);
        expect(localStorage.getItem('auth_token')).toBeFalsy();
        expect(localStorage.getItem('refresh_token')).toBeFalsy();
    });

    it('initialize action restores token from local storage', () => {
        const store = useAuthStore();
        localStorage.setItem('auth_token', 'stored-token');
        localStorage.setItem('refresh_token', 'stored-refresh-token');

        store.initialize();

        expect(store.token).toBe('stored-token');
        expect(store.refreshToken).toBe('stored-refresh-token');
        // Note: We might want initialize to also fetch user profile if token exists
        // For now, checking token restoration is enough for the first pass
    });
});
