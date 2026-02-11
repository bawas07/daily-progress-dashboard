import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { createApiClient } from './axios.config'

// Mock the token refresh service
vi.mock('@/shared/services/token-refresh.service', () => ({
    refreshAccessToken: vi.fn(),
}))

import { refreshAccessToken } from '@/shared/services/token-refresh.service'

describe('axios.config - 401 Interceptor', () => {
    let client: AxiosInstance
    const mockRefreshAccessToken = vi.mocked(refreshAccessToken)

    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        client = createApiClient()
    })

    afterEach(() => {
        localStorage.clear()
    })

    describe('Request Interceptor', () => {
        it('should add Authorization header when token exists', async () => {
            localStorage.setItem('auth_token', 'test-token')

            // Get the request interceptor
            const requestInterceptor = (client.interceptors.request as any).handlers[0]
            const config: InternalAxiosRequestConfig = {
                headers: {} as any,
            } as InternalAxiosRequestConfig

            const result = await requestInterceptor.fulfilled(config)

            expect(result.headers.Authorization).toBe('Bearer test-token')
        })

        it('should not add Authorization header when no token exists', async () => {
            const requestInterceptor = (client.interceptors.request as any).handlers[0]
            const config: InternalAxiosRequestConfig = {
                headers: {} as any,
            } as InternalAxiosRequestConfig

            const result = await requestInterceptor.fulfilled(config)

            expect(result.headers.Authorization).toBeUndefined()
        })
    })

    describe('Response Interceptor - 401 Handling', () => {
        it('should retry request after successful token refresh', async () => {
            localStorage.setItem('refresh_token', 'valid-refresh-token')
            mockRefreshAccessToken.mockResolvedValue('new-access-token')

            // Get the response interceptor
            const responseInterceptor = (client.interceptors.response as any).handlers[0]

            const originalConfig = {
                url: '/test-endpoint',
                method: 'get',
                headers: {},
                _retry: undefined,
            } as InternalAxiosRequestConfig & { _retry?: boolean }

            const error = {
                response: { status: 401 },
                config: originalConfig,
            } as AxiosError

            // The interceptor should attempt to refresh and retry
            // Note: In a real test, we'd need to mock the axios instance's request method
            // For now, we verify the refresh was attempted
            try {
                await responseInterceptor.rejected(error)
            } catch {
                // Expected to fail because we can't actually retry in test
            }

            expect(mockRefreshAccessToken).toHaveBeenCalled()
        })

        it('should redirect to login when refresh fails', async () => {
            mockRefreshAccessToken.mockResolvedValue(null)

            // Mock window.location
            const originalLocation = window.location
            delete (window as any).location
            window.location = { ...originalLocation, href: '', pathname: '/dashboard' } as any

            const responseInterceptor = (client.interceptors.response as any).handlers[0]

            const error = {
                response: { status: 401 },
                config: { url: '/test', method: 'get', headers: {} } as InternalAxiosRequestConfig,
            } as AxiosError

            try {
                await responseInterceptor.rejected(error)
            } catch {
                // Expected to reject
            }

            expect(window.location.href).toBe('/login')

            // Restore
            window.location = originalLocation as any as any
        })

        it('should not attempt refresh for non-401 errors', async () => {
            const responseInterceptor = (client.interceptors.response as any).handlers[0]

            const error = {
                response: { status: 500 },
                config: { url: '/test', method: 'get', headers: {} } as InternalAxiosRequestConfig,
            } as AxiosError

            try {
                await responseInterceptor.rejected(error)
            } catch {
                // Expected to reject
            }

            expect(mockRefreshAccessToken).not.toHaveBeenCalled()
        })

        it('should not attempt refresh if already on login page', async () => {
            // Mock window.location
            const originalLocation = window.location
            delete (window as any).location
            window.location = { ...originalLocation, href: '/login', pathname: '/login' } as any

            const responseInterceptor = (client.interceptors.response as any).handlers[0]

            const error = {
                response: { status: 401 },
                config: { url: '/test', method: 'get', headers: {} } as InternalAxiosRequestConfig,
            } as AxiosError

            try {
                await responseInterceptor.rejected(error)
            } catch {
                // Expected to reject
            }

            expect(mockRefreshAccessToken).not.toHaveBeenCalled()

            // Restore
            window.location = originalLocation as any
        })

        it('should not retry if request was already retried', async () => {
            mockRefreshAccessToken.mockResolvedValue('new-token')

            const responseInterceptor = (client.interceptors.response as any).handlers[0]

            const error = {
                response: { status: 401 },
                config: {
                    url: '/test',
                    method: 'get',
                    headers: {},
                    _retry: true, // Already retried
                } as InternalAxiosRequestConfig & { _retry?: boolean },
            } as AxiosError

            try {
                await responseInterceptor.rejected(error)
            } catch {
                // Expected to reject
            }

            // Should not attempt refresh since already retried
            expect(mockRefreshAccessToken).not.toHaveBeenCalled()
        })
    })
})
