import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import { createHttpClient, getErrorMessage } from './http-client'

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
    isAxiosError: vi.fn(() => true),
  },
}))

describe('HTTP Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createHttpClient', () => {
    it('should create axios instance with correct config', () => {
      const client = createHttpClient()

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: '/api',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(client).toBeDefined()
    })

    it('should use custom base URL from env', () => {
      const originalEnv = import.meta.env.VITE_API_BASE_URL
      // @ts-ignore - testing env var
      import.meta.env.VITE_API_BASE_URL = 'https://api.example.com'

      createHttpClient()

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.example.com',
        })
      )

      // @ts-ignore
      import.meta.env.VITE_API_BASE_URL = originalEnv
    })
  })

  describe('getErrorMessage', () => {
    it('should extract message from validation error details', () => {
      const error = {
        response: {
          data: {
            details: [
              { message: 'Email is required' },
              { message: 'Password is too short' },
            ],
          },
        },
      }

      const message = getErrorMessage(error)

      expect(message).toBe('Email is required, Password is too short')
    })

    it('should extract message from error response', () => {
      const error = {
        response: {
          data: {
            message: 'Unauthorized access',
          },
          statusText: 'Unauthorized',
        },
      }

      const message = getErrorMessage(error)

      expect(message).toBe('Unauthorized access')
    })

    it('should use status text if no message', () => {
      const error = {
        response: {
          statusText: 'Not Found',
        },
      }

      const message = getErrorMessage(error)

      expect(message).toBe('Not Found')
    })

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong')

      const message = getErrorMessage(error)

      expect(message).toBe('Something went wrong')
    })

    it('should handle unknown errors', () => {
      const message = getErrorMessage('string error')

      expect(message).toBe('An unexpected error occurred')
    })

    it('should handle errors with no response data', () => {
      const error = {
        response: {},
      }

      const message = getErrorMessage(error)

      expect(message).toBe('An unexpected error occurred')
    })
  })
})
