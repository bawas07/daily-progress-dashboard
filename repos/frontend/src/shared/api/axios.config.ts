import axios, { type AxiosInstance, type AxiosError } from 'axios'
import type { ApiError } from '@/shared/types'

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
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor to handle common errors
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.response?.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('auth_token')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
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
