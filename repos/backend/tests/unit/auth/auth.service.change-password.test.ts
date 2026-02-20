import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AuthService,
  AuthenticationError,
  ValidationError,
} from '../../../src/modules/auth/services/auth.service'
import { UserRepository } from '../../../src/modules/auth/repositories/user.repository'
import { UserPreferencesRepository } from '../../../src/modules/auth/repositories/user.preferences.repository'
import { PasswordService } from '../../../src/modules/auth/services/password.service'
import { RefreshTokenService } from '../../../src/modules/auth/services/refresh-token.service'
import { JwtService } from '../../../src/shared/jwt/jwt.service'
import { User } from '@prisma/client'

describe('AuthService - Change Password', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    name: 'Test User',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    lastLogin: null,
  }

  let authService: AuthService
  const mockUserRepository = {
    findById: vi.fn(),
    updatePasswordHash: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    updateLastLogin: vi.fn(),
    delete: vi.fn(),
  }
  const mockPreferencesRepository = {
    create: vi.fn(),
  }
  const mockPasswordService = {
    hash: vi.fn(),
    compare: vi.fn(),
    validateStrength: vi.fn(),
  }
  const mockJwtService = {
    sign: vi.fn(),
    verify: vi.fn(),
    decode: vi.fn(),
  }
  const mockRefreshTokenService = {
    generateRefreshToken: vi.fn(),
    rotateRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    validateRefreshToken: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    authService = new AuthService(
      mockUserRepository as unknown as UserRepository,
      mockPreferencesRepository as unknown as UserPreferencesRepository,
      mockPasswordService as unknown as PasswordService,
      mockJwtService as unknown as JwtService,
      mockRefreshTokenService as unknown as RefreshTokenService
    )
  })

  it('updates password when current password is valid and new password is strong', async () => {
    mockUserRepository.findById.mockResolvedValue(mockUser)
    mockPasswordService.compare.mockResolvedValue(true)
    mockPasswordService.validateStrength.mockReturnValue({ valid: true, errors: [] })
    mockPasswordService.hash.mockResolvedValue('new-hash')
    mockUserRepository.updatePasswordHash.mockResolvedValue({ ...mockUser, passwordHash: 'new-hash' })

    await authService.changePassword('user-123', 'CurrentPass1!', 'UpdatedPass1!')

    expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123')
    expect(mockPasswordService.compare).toHaveBeenCalledWith('CurrentPass1!', mockUser.passwordHash)
    expect(mockPasswordService.validateStrength).toHaveBeenCalledWith('UpdatedPass1!')
    expect(mockPasswordService.hash).toHaveBeenCalledWith('UpdatedPass1!')
    expect(mockUserRepository.updatePasswordHash).toHaveBeenCalledWith('user-123', 'new-hash')
  })

  it('throws when user does not exist', async () => {
    mockUserRepository.findById.mockResolvedValue(null)

    await expect(
      authService.changePassword('missing-user', 'CurrentPass1!', 'UpdatedPass1!')
    ).rejects.toThrow(AuthenticationError)
  })

  it('throws when current password is incorrect', async () => {
    mockUserRepository.findById.mockResolvedValue(mockUser)
    mockPasswordService.compare.mockResolvedValue(false)

    await expect(
      authService.changePassword('user-123', 'WrongPass1!', 'UpdatedPass1!')
    ).rejects.toThrow(AuthenticationError)
    expect(mockUserRepository.updatePasswordHash).not.toHaveBeenCalled()
  })

  it('throws validation error when new password is weak', async () => {
    mockUserRepository.findById.mockResolvedValue(mockUser)
    mockPasswordService.compare.mockResolvedValue(true)
    mockPasswordService.validateStrength.mockReturnValue({
      valid: false,
      errors: ['Password must contain at least one number'],
    })

    await expect(
      authService.changePassword('user-123', 'CurrentPass1!', 'weakpass')
    ).rejects.toThrow(ValidationError)
    expect(mockUserRepository.updatePasswordHash).not.toHaveBeenCalled()
  })
})

