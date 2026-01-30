import axios, { type AxiosInstance, type AxiosError } from 'axios'
import type { ApiError } from '@/shared/types'

/**
 * Create and configure axios instance for API calls
 */
export function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor: Add auth token if available
  client.interceptors.request.use(
    (config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor: Handle common errors
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Handle 401 unauthorized - clear token and redirect to login
      if (error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          // Only redirect if we're not already on login/register page
          if (!window.location.pathname.match(/\/(login|register)/)) {
            window.location.href = '/login'
          }
        }
      }

      return Promise.reject(error)
    }
  )

  return client
}

/**
 * Default axios instance
 */
export const httpClient = createHttpClient()

/**
 * Extract error message from Axios error
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; details?: Array<{ message: string }> } | undefined
    
    // Check for details array (validation errors)
    if (data?.details && Array.isArray(data.details) && data.details.length > 0) {
      return data.details.map((d) => d.message).join(', ')
    }
    
    // Check for message
    if (data?.message) {
      return data.message
    }
    
    // Check for status text
    if (error.response?.statusText) {
      return error.response.statusText
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

/**
 * Type guard to check if error is ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
}
