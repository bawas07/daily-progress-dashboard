import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService, RegisterData, ValidationError, DuplicateEmailError } from '../../../src/modules/auth/services/auth.service';
import { UserRepository } from '../../../src/modules/auth/repositories/user.repository';
import { UserPreferencesRepository } from '../../../src/modules/auth/repositories/user.preferences.repository';
import { PasswordService } from '../../../src/modules/auth/services/password.service';
import { RefreshTokenService } from '../../../src/modules/auth/services/refresh-token.service';
import { JwtService } from '../../../shared/jwt/jwt.service';
import { User, UserPreferences } from '@prisma/client';

interface MockUserRepository {
  findByEmail: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
}

interface MockPreferencesRepository {
  create: ReturnType<typeof vi.fn>;
}

describe('AuthService - Registration', () => {
  let mockUserRepository: MockUserRepository;
  let mockPreferencesRepository: MockPreferencesRepository;
  let mockPasswordService: PasswordService;
  let mockJwtService: JwtService;
  let mockRefreshTokenService: RefreshTokenService;
  let authService: AuthService;

  const mockCreatedUser: User = {
    id: 'user-new-123',
    email: 'newuser@example.com',
    passwordHash: 'hashed-password-value',
    name: 'New User',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    lastLogin: null,
  };

  const mockPreferences: UserPreferences = {
    id: 'pref-123',
    userId: 'user-new-123',
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
      sign: vi.fn(),
      verify: vi.fn(),
      decode: vi.fn(),
    } as unknown as JwtService;
    mockRefreshTokenService = {
      generateRefreshToken: vi.fn(),
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

  describe('register with valid data', () => {
    it('should register user successfully', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        password: 'StrongP@ss123',
        name: 'New User',
      };

      mockPasswordService.validateStrength.mockReturnValue({ valid: true });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue('hashed-password-value');
      mockUserRepository.create.mockResolvedValue(mockCreatedUser);
      mockPreferencesRepository.create.mockResolvedValue(mockPreferences);

      const result = await authService.register(registerData);

      expect(result.user.id).toBe('user-new-123');
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.name).toBe('New User');
      expect(result.preferences.theme).toBe('auto');
      expect(result.preferences.timezone).toBe('UTC');
    });

    it('should call passwordService.validateStrength with the password', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        password: 'StrongP@ss123',
        name: 'New User',
      };

      mockPasswordService.validateStrength.mockReturnValue({ valid: true });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue('hashed-password-value');
      mockUserRepository.create.mockResolvedValue(mockCreatedUser);
      mockPreferencesRepository.create.mockResolvedValue(mockPreferences);

      await authService.register(registerData);

      expect(mockPasswordService.validateStrength).toHaveBeenCalledWith('StrongP@ss123');
    });

    it('should hash password before saving', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        password: 'StrongP@ss123',
        name: 'New User',
      };

      mockPasswordService.validateStrength.mockReturnValue({ valid: true });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue('hashed-password-value');
      mockUserRepository.create.mockResolvedValue(mockCreatedUser);
      mockPreferencesRepository.create.mockResolvedValue(mockPreferences);

      await authService.register(registerData);

      expect(mockPasswordService.hash).toHaveBeenCalledWith('StrongP@ss123');
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newuser@example.com',
          passwordHash: 'hashed-password-value',
          name: 'New User',
        })
      );
    });

    it('should create default preferences for new user', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        password: 'StrongP@ss123',
        name: 'New User',
      };

      mockPasswordService.validateStrength.mockReturnValue({ valid: true });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue('hashed-password-value');
      mockUserRepository.create.mockResolvedValue(mockCreatedUser);
      mockPreferencesRepository.create.mockResolvedValue(mockPreferences);

      await authService.register(registerData);

      expect(mockPreferencesRepository.create).toHaveBeenCalledWith('user-new-123');
    });

    it('should not return password in response', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        password: 'StrongP@ss123',
        name: 'New User',
      };

      mockPasswordService.validateStrength.mockReturnValue({ valid: true });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue('hashed-password-value');
      mockUserRepository.create.mockResolvedValue(mockCreatedUser);
      mockPreferencesRepository.create.mockResolvedValue(mockPreferences);

      const result = await authService.register(registerData);

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should include lastLogin (null for new user)', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        password: 'StrongP@ss123',
        name: 'New User',
      };

      mockPasswordService.validateStrength.mockReturnValue({ valid: true });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue('hashed-password-value');
      mockUserRepository.create.mockResolvedValue(mockCreatedUser);
      mockPreferencesRepository.create.mockResolvedValue(mockPreferences);

      const result = await authService.register(registerData);

      expect(result.user.lastLogin).toBeNull();
    });
  });

  describe('register with weak password', () => {
    it('should fail when password is weak', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        password: 'weak',
        name: 'New User',
      };

      mockPasswordService.validateStrength.mockReturnValue({
        valid: false,
        errors: ['Password must be at least 8 characters long'],
      });
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.register(registerData)).rejects.toThrow(ValidationError);
      await expect(authService.register(registerData)).rejects.toThrow(
        'Password validation failed: Password must be at least 8 characters long'
      );
    });

    it('should not create user when password is weak', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        password: 'weak',
        name: 'New User',
      };

      mockPasswordService.validateStrength.mockReturnValue({
        valid: false,
        errors: ['Password must be at least 8 characters long'],
      });

      await expect(authService.register(registerData)).rejects.toThrow();

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('register with duplicate email', () => {
    it('should fail when email already exists', async () => {
      const registerData: RegisterData = {
        email: 'existing@example.com',
        password: 'StrongP@ss123',
        name: 'New User',
      };

      mockPasswordService.validateStrength.mockReturnValue({ valid: true });
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
        passwordHash: 'existing-hash',
        name: 'Existing User',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      });

      await expect(authService.register(registerData)).rejects.toThrow(DuplicateEmailError);
      await expect(authService.register(registerData)).rejects.toThrow(
        'Email already registered'
      );
    });

    it('should not create duplicate user', async () => {
      const registerData: RegisterData = {
        email: 'existing@example.com',
        password: 'StrongP@ss123',
        name: 'New User',
      };

      mockPasswordService.validateStrength.mockReturnValue({ valid: true });
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
        passwordHash: 'existing-hash',
        name: 'Existing User',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      });

      await expect(authService.register(registerData)).rejects.toThrow(DuplicateEmailError);

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });
});
