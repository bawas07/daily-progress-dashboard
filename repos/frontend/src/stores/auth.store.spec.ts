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
        const mockResponse = { data: { data: { user: mockUser, token: mockToken }, code: 'S001', message: 'Login successful' } };

        mockPost.mockResolvedValue(mockResponse);

        await store.login({ email: 'test@example.com', password: 'password123' });

        expect(mockPost).toHaveBeenCalledWith('/auth/login', {
            email: 'test@example.com',
            password: 'password123',
        });
        expect(store.user).toEqual(mockUser);
        expect(store.token).toBe(mockToken);
        expect(store.isAuthenticated).toBe(true);
        expect(store.error).toBeNull();
        expect(localStorage.getItem('auth_token')).toBe(mockToken);
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
        const mockToken = 'new-mock-jwt-token';
        const mockResponse = { data: { data: { user: mockUser, token: mockToken }, code: 'S002', message: 'Registration successful' } };

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
        expect(store.token).toBe(mockToken);
        expect(store.isAuthenticated).toBe(true);
    });

    it('logout action clears state and removes token', () => {
        const store = useAuthStore();
        store.token = 'existing-token';
        store.user = { id: '1', email: 'test@example.com', name: 'Test' };
        localStorage.setItem('auth_token', 'existing-token');

        store.logout();

        expect(store.user).toBeNull();
        expect(store.token).toBeNull();
        expect(store.isAuthenticated).toBe(false);
        expect(localStorage.getItem('auth_token')).toBeFalsy();
    });

    it('initialize action restores token from local storage', () => {
        const store = useAuthStore();
        localStorage.setItem('auth_token', 'stored-token');

        store.initialize();

        expect(store.token).toBe('stored-token');
        // Note: We might want initialize to also fetch user profile if token exists
        // For now, checking token restoration is enough for the first pass
    });
});
