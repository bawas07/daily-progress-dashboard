import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService, LoginData, AuthenticationError } from '../../../src/modules/auth/services/auth.service';
import { UserRepository } from '../../../src/modules/auth/repositories/user.repository';
import { UserPreferencesRepository } from '../../../src/modules/auth/repositories/user.preferences.repository';
import { PasswordService } from '../../../src/modules/auth/services/password.service';
import { RefreshTokenService } from '../../../src/modules/auth/services/refresh-token.service';
import { JwtService } from '../../../src/shared/jwt/jwt.service';
import { User, UserPreferences } from '@prisma/client';

interface MockUserRepository {
  findByEmail: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  updateLastLogin: ReturnType<typeof vi.fn>;
}

interface MockPreferencesRepository {
  create: ReturnType<typeof vi.fn>;
}

describe('AuthService - Login', () => {
  let mockUserRepository: MockUserRepository;
  let mockPreferencesRepository: MockPreferencesRepository;
  let mockPasswordService: PasswordService;
  let mockJwtService: JwtService;
  let mockRefreshTokenService: RefreshTokenService;
  let authService: AuthService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password-value',
    name: 'Test User',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    lastLogin: new Date('2024-01-01T00:00:00Z'),
  };

  const mockPreferences: UserPreferences = {
    id: 'pref-123',
    userId: 'user-123',
    defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    theme: 'auto',
    timezone: 'UTC',
    enableNotifications: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      updateLastLogin: vi.fn(),
    };
    mockPreferencesRepository = {
      create: vi.fn(),
    };
    mockPasswordService = {
      hash: vi.fn(),
      compare: vi.fn(),
      validateStrength: vi.fn(),
    } as unknown as PasswordService;
    mockJwtService = {
      sign: vi.fn().mockReturnValue('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.signature'),
      verify: vi.fn(),
      decode: vi.fn(),
    } as unknown as JwtService;
    mockRefreshTokenService = {
      generateRefreshToken: vi.fn().mockResolvedValue('refresh-token-123'),
      rotateRefreshToken: vi.fn(),
      revokeRefreshToken: vi.fn(),
      validateRefreshToken: vi.fn(),
    } as unknown as RefreshTokenService;

    authService = new AuthService(
      mockUserRepository as unknown as UserRepository,
      mockPreferencesRepository as unknown as UserPreferencesRepository,
      mockPasswordService,
      mockJwtService,
      mockRefreshTokenService
    );
  });

  describe('login with valid credentials', () => {
    it('should login user successfully', async () => {
      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'CorrectP@ss123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue({
        ...mockUser,
        lastLogin: new Date(),
      });

      const result = await authService.login(loginData);

      expect(result.user.id).toBe('user-123');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test User');
      expect(result.token).toBeDefined();
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).toBe('refresh-token-123');
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).toBe('refresh-token-123');
    });

    it('should generate JWT token', async () => {
      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'CorrectP@ss123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue({
        ...mockUser,
        lastLogin: new Date(),
      });

      const result = await authService.login(loginData);

      expect(result.token).toBeDefined();
      // JWT format: header.payload.signature
      expect(result.token.split('.')).toHaveLength(3);
    });

    it('should update lastLogin on successful login', async () => {
      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'CorrectP@ss123',
      };

      const updatedUser = {
        ...mockUser,
        lastLogin: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue(updatedUser);

      await authService.login(loginData);

      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith('user-123');
    });

    it('should not return password in user response', async () => {
      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'CorrectP@ss123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue({
        ...mockUser,
        lastLogin: new Date(),
      });

      const result = await authService.login(loginData);

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should return user with updated lastLogin date', async () => {
      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'CorrectP@ss123',
      };

      const newLastLogin = new Date('2024-02-01T12:00:00Z');

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockUserRepository.updateLastLogin.mockResolvedValue({
        ...mockUser,
        lastLogin: newLastLogin,
      });

      const result = await authService.login(loginData);

      expect(result.user.lastLogin).toEqual(newLastLogin);
    });
  });

  describe('login with invalid email', () => {
    it('should fail when email does not exist', async () => {
      const loginData: LoginData = {
        email: 'nonexistent@example.com',
        password: 'CorrectP@ss123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow(AuthenticationError);
      await expect(authService.login(loginData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should not update lastLogin for non-existent user', async () => {
      const loginData: LoginData = {
        email: 'nonexistent@example.com',
        password: 'CorrectP@ss123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow(AuthenticationError);

      expect(mockUserRepository.updateLastLogin).not.toHaveBeenCalled();
    });
  });

  describe('login with invalid password', () => {
    it('should fail when password is incorrect', async () => {
      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'WrongP@ss123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow(AuthenticationError);
      await expect(authService.login(loginData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should not update lastLogin when password is incorrect', async () => {
      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'WrongP@ss123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow(AuthenticationError);

      expect(mockUserRepository.updateLastLogin).not.toHaveBeenCalled();
    });
  });
});
