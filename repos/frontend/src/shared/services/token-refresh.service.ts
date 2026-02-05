import axios, { type AxiosInstance } from 'axios'
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/shared/constants'

// Module-level state for deduplication
let refreshPromise: Promise<string | null> | null = null

/**
 * Create a simple axios instance for refresh requests
 * This avoids circular dependency with the main API client
 */
function createRefreshClient(): AxiosInstance {
    return axios.create({
        baseURL: import.meta.env.VITE_API_URL || '/api',
        headers: {
            'Content-Type': 'application/json',
        },
    })
}

/**
 * Refresh the access token using the stored refresh token
 *
 * This function handles deduplication - if a refresh is already in progress,
 * subsequent calls will return the same promise instead of making multiple requests.
 *
 * @returns The new access token if successful, null if refresh failed or no refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
    // If a refresh is already in progress, return the existing promise
    if (refreshPromise) {
        return refreshPromise
    }

    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    // No refresh token available
    if (!storedRefreshToken) {
        return null
    }

    // Create and store the refresh promise for deduplication
    refreshPromise = performRefresh(storedRefreshToken)

    try {
        return await refreshPromise
    } finally {
        // Clear the promise after completion (success or failure)
        refreshPromise = null
    }
}

/**
 * Perform the actual refresh request
 */
async function performRefresh(storedRefreshToken: string): Promise<string | null> {
    try {
        const client = createRefreshClient()
        const response = await client.post<{
            data: {
                token: string
                refreshToken: string
            }
        }>('/auth/refresh', {
            refreshToken: storedRefreshToken,
        })

        const { token, refreshToken } = response.data.data

        // Update localStorage with new tokens
        localStorage.setItem(AUTH_TOKEN_KEY, token)
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)

        return token
    } catch {
        // Refresh failed - clear tokens
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        return null
    }
}

/**
 * Check if a token refresh is currently in progress
 */
export function isRefreshing(): boolean {
    return refreshPromise !== null
}

/**
 * Get the current refresh promise if one is in progress
 * Useful for waiting on an existing refresh from other parts of the app
 */
export function getRefreshPromise(): Promise<string | null> | null {
    return refreshPromise
}

/**
 * Reset the refresh state (for testing purposes)
 */
export function resetRefreshState(): void {
    refreshPromise = null
}
