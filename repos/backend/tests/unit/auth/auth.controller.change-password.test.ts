import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Context } from 'hono'

interface MockContext {
  req: {
    json: () => Promise<unknown>
  }
  get: ReturnType<typeof vi.fn>
  json: ReturnType<typeof vi.fn>
  status: number
}

function createMockContext(
  userId: string | undefined,
  body: { currentPassword: string; newPassword: string }
): MockContext {
  let status = 200

  return {
    req: {
      json: async () => body,
    },
    get: vi.fn((key: string) => {
      if (key === 'userId') return userId
      if (key === 'validatedData') return body
      return undefined
    }),
    json: vi.fn((data: unknown, statusCode?: number) => {
      status = statusCode || 200
      return { data, status }
    }),
    get status() {
      return status
    },
  }
}

describe('AuthController - Change Password', () => {
  const mockAuthService = {
    changePassword: vi.fn(),
  }

  const body = {
    currentPassword: 'CurrentPass1!',
    newPassword: 'UpdatedPass1!',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 for successful password update', async () => {
    const { AuthController } = await import('../../../src/modules/auth/auth.controller')
    const context = createMockContext('user-123', body)
    mockAuthService.changePassword.mockResolvedValue(undefined)

    const controller = new AuthController(mockAuthService as any)
    await controller.changePassword()(context as unknown as Context)

    expect(mockAuthService.changePassword).toHaveBeenCalledWith(
      'user-123',
      body.currentPassword,
      body.newPassword
    )
    expect(context.status).toBe(200)
  })

  it('returns 401 when user is not authenticated', async () => {
    const { AuthController } = await import('../../../src/modules/auth/auth.controller')
    const context = createMockContext(undefined, body)

    const controller = new AuthController(mockAuthService as any)
    await controller.changePassword()(context as unknown as Context)

    expect(context.status).toBe(401)
  })

  it('returns 401 for invalid current password', async () => {
    const { AuthController } = await import('../../../src/modules/auth/auth.controller')
    const context = createMockContext('user-123', body)
    mockAuthService.changePassword.mockRejectedValue(new Error('Current password is incorrect'))

    const controller = new AuthController(mockAuthService as any)
    await controller.changePassword()(context as unknown as Context)

    expect(context.status).toBe(401)
  })
})

