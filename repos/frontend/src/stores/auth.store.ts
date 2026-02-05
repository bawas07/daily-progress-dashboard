import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApiClient, transformApiError } from '@/shared/api'
import type { User, LoginRequest, RegisterRequest, ApiSuccessResponse, UserPreferences } from '@/shared/types'

const AUTH_TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export const useAuthStore = defineStore('auth', () => {
    // Create API client once at store level
    const apiClient = useApiClient()

    // State
    const user = ref<User | null>(null)
    const token = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const isAuthenticated = computed(() => !!token.value)

    // Actions
    async function login(credentials: LoginRequest) {
        isLoading.value = true
        error.value = null

        try {
            const response = await apiClient.post<ApiSuccessResponse<{
                user: User
                token: string
                refreshToken: string
            }>>('/auth/login', credentials)

            user.value = response.data.data.user
            token.value = response.data.data.token
            refreshToken.value = response.data.data.refreshToken

            // Store tokens in localStorage
            localStorage.setItem(AUTH_TOKEN_KEY, response.data.data.token)
            localStorage.setItem(REFRESH_TOKEN_KEY, response.data.data.refreshToken)
        } catch (err) {
            const apiError = transformApiError(err as any)
            error.value = apiError.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function register(data: RegisterRequest) {
        isLoading.value = true
        error.value = null

        try {
            const response = await apiClient.post<ApiSuccessResponse<{
                user: User
                preferences: UserPreferences
            }>>('/auth/register', data)

            user.value = response.data.data.user
            // Note: Registration doesn't authenticate - user must login separately
        } catch (err) {
            const apiError = transformApiError(err as any)
            error.value = apiError.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    function logout() {
        user.value = null
        token.value = null
        refreshToken.value = null
        error.value = null

        // Remove tokens from localStorage
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
    }

    function initialize() {
        // Restore tokens from localStorage
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

        if (storedToken) {
            token.value = storedToken
        }
        if (storedRefreshToken) {
            refreshToken.value = storedRefreshToken
        }
    }

    return {
        // State
        user,
        token,
        refreshToken,
        isLoading,
        error,
        // Getters
        isAuthenticated,
        // Actions
        login,
        register,
        logout,
        initialize,
    }
})
