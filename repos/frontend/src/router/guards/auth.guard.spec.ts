import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { authGuard, isAuthRoute } from './auth.guard'
import { useAuthStore } from '@/stores/auth.store'

// Mock the API client
vi.mock('@/shared/api/client', () => ({
    useApiClient: () => ({
        post: vi.fn(),
        get: vi.fn(),
    }),
}))

describe('authGuard', () => {
    let mockNext: NavigationGuardNext

    beforeEach(() => {
        setActivePinia(createPinia())
        mockNext = vi.fn()
    })

    const createRoute = (overrides: Partial<RouteLocationNormalized> = {}): RouteLocationNormalized => ({
        path: '/',
        name: 'dashboard',
        params: {},
        query: {},
        hash: '',
        fullPath: '/',
        matched: [],
        meta: { requiresAuth: true },
        redirectedFrom: undefined,
        ...overrides,
    })

    describe('when user is not authenticated', () => {
        it('redirects to login with redirect query when accessing protected route', () => {
            const to = createRoute({
                path: '/settings',
                name: 'settings',
                fullPath: '/settings',
                meta: { requiresAuth: true }
            })
            const from = createRoute()

            authGuard(to, from, mockNext)

            expect(mockNext).toHaveBeenCalledWith({
                name: 'login',
                query: { redirect: '/settings' }
            })
        })

        it('allows access to public routes', () => {
            const to = createRoute({
                path: '/login',
                name: 'login',
                meta: { requiresAuth: false }
            })
            const from = createRoute()

            authGuard(to, from, mockNext)

            expect(mockNext).toHaveBeenCalledWith()
        })
    })

    describe('when user is authenticated', () => {
        beforeEach(() => {
            const authStore = useAuthStore()
            authStore.token = 'test-token'
        })

        it('redirects from login page to dashboard', () => {
            const to = createRoute({
                path: '/login',
                name: 'login',
                meta: { requiresAuth: false }
            })
            const from = createRoute()

            authGuard(to, from, mockNext)

            expect(mockNext).toHaveBeenCalledWith({ name: 'dashboard' })
        })

        it('redirects from register page to dashboard', () => {
            const to = createRoute({
                path: '/register',
                name: 'register',
                meta: { requiresAuth: false }
            })
            const from = createRoute()

            authGuard(to, from, mockNext)

            expect(mockNext).toHaveBeenCalledWith({ name: 'dashboard' })
        })

        it('allows access to protected routes', () => {
            const to = createRoute({
                path: '/settings',
                name: 'settings',
                meta: { requiresAuth: true }
            })
            const from = createRoute()

            authGuard(to, from, mockNext)

            expect(mockNext).toHaveBeenCalledWith()
        })
    })
})

describe('isAuthRoute', () => {
    const createRoute = (name: string): RouteLocationNormalized => ({
        path: '/',
        name,
        params: {},
        query: {},
        hash: '',
        fullPath: '/',
        matched: [],
        meta: {},
        redirectedFrom: undefined,
    })

    it('returns true for login route', () => {
        expect(isAuthRoute(createRoute('login'))).toBe(true)
    })

    it('returns true for register route', () => {
        expect(isAuthRoute(createRoute('register'))).toBe(true)
    })

    it('returns false for other routes', () => {
        expect(isAuthRoute(createRoute('dashboard'))).toBe(false)
        expect(isAuthRoute(createRoute('settings'))).toBe(false)
    })
})
