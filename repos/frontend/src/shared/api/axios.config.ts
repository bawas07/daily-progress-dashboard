import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/shared/types'
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/shared/constants'
import { refreshAccessToken } from '@/shared/services/token-refresh.service'

// Extend the config type to include our retry flag
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

/**
 * Create and configure axios instance for API calls
 */
export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      // Get token from localStorage
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor to handle errors
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined

      // Handle 401 Unauthorized - token expired or invalid
      if (error.response?.status === 401 && originalRequest) {
        // Don't attempt refresh if:
        // 1. Already on login/register page
        // 2. Already tried to retry this request
        const isAuthPage = window.location.pathname.match(/\/(login|register)/)
        if (isAuthPage || originalRequest._retry) {
          return Promise.reject(error)
        }

        // Mark this request as retried to prevent infinite loops
        originalRequest._retry = true

        // Attempt to refresh the token
        const newAccessToken = await refreshAccessToken()

        if (newAccessToken) {
          // Update the authorization header and retry
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return client(originalRequest)
        }

        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        window.location.href = '/login'
      }

      return Promise.reject(error)
    }
  )

  return client
}

/**
 * Convert Axios error to ApiError format
 */
export function transformApiError(error: AxiosError): ApiError {
  if (error.response) {
    // Server responded with error
    const data = error.response.data as any
    return {
      code: data?.code || 'E004',
      message: data?.message || 'An error occurred',
      details: data?.data?.details,
    }
  } else if (error.request) {
    // Request made but no response
    return {
      code: 'E004',
      message: 'Network error. Please check your connection.',
    }
  } else {
    // Error setting up request
    return {
      code: 'E004',
      message: error.message || 'An unexpected error occurred',
    }
  }
}

// Create singleton instance
export const apiClient = createApiClient()
