import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApiClient } from '@/shared/api/client'
import type { User, LoginRequest, RegisterRequest, AuthResponse, ApiSuccessResponse } from '@/shared/types'

export const useAuthStore = defineStore('auth', () => {
    // State
    const user = ref<User | null>(null)
    const token = ref<string | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const isAuthenticated = computed(() => !!token.value)

    // Actions
    async function login(credentials: LoginRequest) {
        isLoading.value = true
        error.value = null

        try {
            const apiClient = useApiClient()
            const response = await apiClient.post<ApiSuccessResponse<AuthResponse>>('/auth/login', credentials)

            user.value = response.data.data.user
            token.value = response.data.data.token

            // Store token in localStorage
            localStorage.setItem('auth_token', response.data.data.token)
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Login failed'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function register(data: RegisterRequest) {
        isLoading.value = true
        error.value = null

        try {
            const apiClient = useApiClient()
            const response = await apiClient.post<ApiSuccessResponse<AuthResponse>>('/auth/register', data)

            user.value = response.data.data.user
            token.value = response.data.data.token

            // Store token in localStorage
            localStorage.setItem('auth_token', response.data.data.token)
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Registration failed'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    function logout() {
        user.value = null
        token.value = null
        error.value = null

        // Remove token from localStorage
        localStorage.removeItem('auth_token')
    }

    function initialize() {
        // Restore token from localStorage
        const storedToken = localStorage.getItem('auth_token')
        if (storedToken) {
            token.value = storedToken
        }
    }

    return {
        // State
        user,
        token,
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
