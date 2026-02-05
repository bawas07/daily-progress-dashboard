import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import axios from 'axios'

// Mock axios
vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => ({
            post: vi.fn(),
        })),
    },
}))

// Import after mock setup
import {
    refreshAccessToken,
    isRefreshing,
    getRefreshPromise,
    resetRefreshState,
} from './token-refresh.service'

describe('TokenRefreshService', () => {
    const mockAxiosPost = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        resetRefreshState()

        // Setup axios mock to return a client with post method
        const mockClient = { post: mockAxiosPost }
        vi.mocked(axios.create).mockReturnValue(mockClient as any)
    })

    afterEach(() => {
        resetRefreshState()
    })

    describe('refreshAccessToken', () => {
        it('should return null when no refresh token is available', async () => {
            // No refresh token in localStorage
            const result = await refreshAccessToken()
            expect(result).toBeNull()
            expect(mockAxiosPost).not.toHaveBeenCalled()
        })

        it('should call refresh endpoint with refresh token', async () => {
            localStorage.setItem('refresh_token', 'valid-refresh-token')

            const newAccessToken = 'new-access-token'
            const newRefreshToken = 'new-refresh-token'
            mockAxiosPost.mockResolvedValue({
                data: {
                    data: {
                        token: newAccessToken,
                        refreshToken: newRefreshToken,
                    },
                },
            })

            const result = await refreshAccessToken()

            expect(mockAxiosPost).toHaveBeenCalledWith('/auth/refresh', {
                refreshToken: 'valid-refresh-token',
            })
            expect(result).toBe(newAccessToken)
        })

        it('should update localStorage with new tokens on success', async () => {
            localStorage.setItem('refresh_token', 'old-refresh-token')
            localStorage.setItem('auth_token', 'old-access-token')

            const newAccessToken = 'new-access-token'
            const newRefreshToken = 'new-refresh-token'
            mockAxiosPost.mockResolvedValue({
                data: {
                    data: {
                        token: newAccessToken,
                        refreshToken: newRefreshToken,
                    },
                },
            })

            await refreshAccessToken()

            expect(localStorage.getItem('auth_token')).toBe(newAccessToken)
            expect(localStorage.getItem('refresh_token')).toBe(newRefreshToken)
        })

        it('should return null when refresh endpoint fails', async () => {
            localStorage.setItem('refresh_token', 'expired-refresh-token')

            mockAxiosPost.mockRejectedValue(new Error('Refresh token expired'))

            const result = await refreshAccessToken()

            expect(result).toBeNull()
        })

        it('should clear tokens when refresh fails', async () => {
            localStorage.setItem('refresh_token', 'expired-refresh-token')
            localStorage.setItem('auth_token', 'old-access-token')

            mockAxiosPost.mockRejectedValue(new Error('Refresh token expired'))

            await refreshAccessToken()

            expect(localStorage.getItem('auth_token')).toBeNull()
            expect(localStorage.getItem('refresh_token')).toBeNull()
        })

        it('should deduplicate concurrent refresh requests', async () => {
            localStorage.setItem('refresh_token', 'valid-refresh-token')

            const newAccessToken = 'new-access-token'
            const newRefreshToken = 'new-refresh-token'

            // Create a delayed response to simulate network latency
            mockAxiosPost.mockImplementation(
                () =>
                    new Promise((resolve) =>
                        setTimeout(
                            () =>
                                resolve({
                                    data: {
                                        data: {
                                            token: newAccessToken,
                                            refreshToken: newRefreshToken,
                                        },
                                    },
                                }),
                            100
                        )
                    )
            )

            // Start multiple concurrent refresh requests
            const promise1 = refreshAccessToken()
            const promise2 = refreshAccessToken()
            const promise3 = refreshAccessToken()

            const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

            // All should return the same token
            expect(result1).toBe(newAccessToken)
            expect(result2).toBe(newAccessToken)
            expect(result3).toBe(newAccessToken)

            // But only one actual API call should have been made
            expect(mockAxiosPost).toHaveBeenCalledTimes(1)
        })
    })

    describe('isRefreshing', () => {
        it('should return false initially', () => {
            expect(isRefreshing()).toBe(false)
        })

        it('should return true during refresh', async () => {
            localStorage.setItem('refresh_token', 'valid-refresh-token')

            let resolvePromise: (value: any) => void
            mockAxiosPost.mockImplementation(
                () =>
                    new Promise((resolve) => {
                        resolvePromise = resolve
                    })
            )

            const refreshPromise = refreshAccessToken()

            // During refresh, isRefreshing should be true
            expect(isRefreshing()).toBe(true)

            // Complete the refresh
            resolvePromise!({
                data: {
                    data: {
                        token: 'new-token',
                        refreshToken: 'new-refresh-token',
                    },
                },
            })

            await refreshPromise

            // After refresh, isRefreshing should be false
            expect(isRefreshing()).toBe(false)
        })
    })

    describe('getRefreshPromise', () => {
        it('should return null when not refreshing', () => {
            expect(getRefreshPromise()).toBeNull()
        })

        it('should return the current refresh promise during refresh', async () => {
            localStorage.setItem('refresh_token', 'valid-refresh-token')

            let resolvePromise: (value: any) => void
            mockAxiosPost.mockImplementation(
                () =>
                    new Promise((resolve) => {
                        resolvePromise = resolve
                    })
            )

            const refreshPromise = refreshAccessToken()

            // During refresh, getRefreshPromise should return the promise
            const currentPromise = getRefreshPromise()
            expect(currentPromise).not.toBeNull()
            expect(currentPromise).toBe(getRefreshPromise()) // Same promise instance

            // Complete the refresh
            resolvePromise!({
                data: {
                    data: {
                        token: 'new-token',
                        refreshToken: 'new-refresh-token',
                    },
                },
            })

            await refreshPromise

            // After refresh, getRefreshPromise should return null
            expect(getRefreshPromise()).toBeNull()
        })
    })
})
