import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { LoginData, RegisterData, AuthResult, LoginResult } from '../../../src/modules/auth/services/auth.service';
import type { User, UserPreferences } from '@prisma/client';
import type { Context } from 'hono';

// Mock container for controller tests
interface MockAuthService {
  login: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
  getProfile: ReturnType<typeof vi.fn>;
}

interface MockContext {
  req: {
    json: () => Promise<Record<string, unknown>>;
    header: (name: string) => string | undefined;
  };
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  json: ReturnType<typeof vi.fn>;
  status: number;
  _setStatus: (status: number) => void;
}

function createMockContext(body: Record<string, unknown> | null = null, headers: Record<string, string> = {}): MockContext & { _setStatus: (status: number) => void } {
  let status = 200;
  return {
    req: {
      json: async () => body || {},
      header: (name: string) => headers[name] || headers[name.toLowerCase()] || undefined,
    },
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    json: vi.fn().mockImplementation((data, statusCode) => {
      status = statusCode || 200;
      return { data, status };
    }),
    _setStatus: (s: number) => { status = s; },
    get status() { return status; },
  };
}

async function importAuthController() {
  const module = await import('../../../src/modules/auth/auth.controller');
  return { AuthController: module.AuthController };
}

describe('Auth Controller', () => {
  let mockAuthService: MockAuthService;
  let mockContext: MockContext;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
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
    // Reset mocks
    mockAuthService = {
      login: vi.fn(),
      register: vi.fn(),
      getProfile: vi.fn(),
    };

    mockContext = createMockContext(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /login', () => {
    it('should return 200 with token for valid credentials', async () => {
      const { AuthController } = await importAuthController();


      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'CorrectP@ss123',
      };

      const loginResult: LoginResult = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
          lastLogin: mockUser.lastLogin!,
        },
        token: 'valid-jwt-token',
      };

      mockContext = createMockContext(loginData);
      mockAuthService.login.mockResolvedValue(loginResult);

      const authController = new AuthController(mockAuthService as any);
      await authController.login()(mockContext);

      expect(mockContext.status).toBe(200);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: 'user-123',
              email: 'test@example.com',
            }),
            token: 'valid-jwt-token',
          }),
          code: 'S001',
          message: 'Login successful',
        }),
        200
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
    });

    it('should return 400 when email is missing', async () => {
      const { AuthController } = await importAuthController();


      const loginData = {
        password: 'CorrectP@ss123',
      };

      mockContext = createMockContext(loginData);

      const authController = new AuthController(mockAuthService as any);
      await authController.login()(mockContext);

      expect(mockContext.status).toBe(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E001',
          message: 'Validation failed',
          data: expect.objectContaining({
            details: expect.objectContaining({
              email: expect.arrayContaining(['Required']),
            }),
          }),
        }),
        400
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should return 400 when email format is invalid', async () => {
      const { AuthController } = await importAuthController();


      const loginData = {
        email: 'not-an-email',
        password: 'CorrectP@ss123',
      };

      mockContext = createMockContext(loginData);

      const authController = new AuthController(mockAuthService as any);
      await authController.login()(mockContext);

      expect(mockContext.status).toBe(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E001',
        }),
        400
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should return 400 when password is missing', async () => {
      const { AuthController } = await importAuthController();


      const loginData = {
        email: 'test@example.com',
      };

      mockContext = createMockContext(loginData);

      const authController = new AuthController(mockAuthService as any);
      await authController.login()(mockContext);

      expect(mockContext.status).toBe(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E001',
        }),
        400
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should return 401 with code E001 for invalid password', async () => {
      const { AuthController } = await importAuthController();


      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'WrongPassword123',
      };

      mockContext = createMockContext(loginData);
      mockAuthService.login.mockRejectedValue(new Error('Invalid email or password'));

      const authController = new AuthController(mockAuthService as any);
      await authController.login()(mockContext);

      expect(mockContext.status).toBe(401);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E001',
          message: 'Invalid email or password',
        }),
        401
      );
    });

    it('should return 401 with code E001 for non-existent user', async () => {
      const { AuthController } = await importAuthController();


      const loginData: LoginData = {
        email: 'nonexistent@example.com',
        password: 'CorrectP@ss123',
      };

      mockContext = createMockContext(loginData);
      mockAuthService.login.mockRejectedValue(new Error('Invalid email or password'));

      const authController = new AuthController(mockAuthService as any);
      await authController.login()(mockContext);

      expect(mockContext.status).toBe(401);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E001',
          message: 'Invalid email or password',
        }),
        401
      );
    });

    it('should normalize email to lowercase before login', async () => {
      const { AuthController } = await importAuthController();


      const loginData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'CorrectP@ss123',
      };

      const loginResult: LoginResult = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
          lastLogin: mockUser.lastLogin!,
        },
        token: 'valid-jwt-token',
      };

      mockContext = createMockContext(loginData);
      mockAuthService.login.mockResolvedValue(loginResult);

      const authController = new AuthController(mockAuthService as any);
      await authController.login()(mockContext);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        })
      );
    });

    it('should handle empty request body gracefully', async () => {
      const { AuthController } = await importAuthController();


      mockContext = createMockContext({});

      const authController = new AuthController(mockAuthService as any);
      await authController.login()(mockContext);

      expect(mockContext.status).toBe(400);
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should ignore extra fields in request body', async () => {
      const { AuthController } = await importAuthController();


      const loginData = {
        email: 'test@example.com',
        password: 'CorrectP@ss123',
        extraField: 'should be ignored',
        anotherField: 123,
      };

      const loginResult: LoginResult = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
          lastLogin: mockUser.lastLogin!,
        },
        token: 'valid-jwt-token',
      };

      mockContext = createMockContext(loginData);
      mockAuthService.login.mockResolvedValue(loginResult);

      const authController = new AuthController(mockAuthService as any);
      await authController.login()(mockContext);

      expect(mockContext.status).toBe(200);
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'CorrectP@ss123',
      });
    });
  });

  describe('POST /register', () => {
    it('should return 201 with user and preferences for valid data', async () => {
      const { AuthController } = await importAuthController();


      const registerData: RegisterData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'SecurePass123',
      };

      const authResult: AuthResult = {
        user: {
          id: 'new-user-123',
          email: 'new@example.com',
          name: 'New User',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: null,
        },
        preferences: {
          defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          theme: 'auto',
          timezone: 'UTC',
          enableNotifications: true,
        },
      };

      mockContext = createMockContext(registerData);
      mockAuthService.register.mockResolvedValue(authResult);

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      expect(mockContext.status).toBe(201);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: 'new-user-123',
              email: 'new@example.com',
              name: 'New User',
            }),
            preferences: expect.objectContaining({
              theme: 'auto',
              timezone: 'UTC',
            }),
          }),
          code: 'S002',
          message: 'Registration successful',
        }),
        201
      );
      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
    });

    it('should return 400 when name is missing', async () => {
      const { AuthController } = await importAuthController();

      const registerData = {
        email: 'new@example.com',
        password: 'SecurePass123',
      };

      mockContext = createMockContext(registerData);

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      expect(mockContext.status).toBe(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E001',
          data: expect.objectContaining({
            details: expect.objectContaining({
              name: expect.arrayContaining(['Required']),
            }),
          }),
        }),
        400
      );
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should return 400 when name is too short (less than 2 characters)', async () => {
      const { AuthController } = await importAuthController();

      const registerData = {
        name: 'A',
        email: 'new@example.com',
        password: 'SecurePass123',
      };

      mockContext = createMockContext(registerData);

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      expect(mockContext.status).toBe(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E001',
          data: expect.objectContaining({
            details: expect.objectContaining({
              name: expect.arrayContaining([expect.stringContaining('2')]),
            }),
          }),
        }),
        400
      );
    });

    it('should return 400 when email format is invalid', async () => {
      const { AuthController } = await importAuthController();

      const registerData = {
        name: 'New User',
        email: '',
        password: 'CorrectP@ss123',
      };

      mockContext = createMockContext(registerData);

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      expect(mockContext.status).toBe(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E001',
        }),
        400
      );
    });

    it('should return 400 when password is too short (less than 8 characters)', async () => {
      const { AuthController } = await importAuthController();

      const registerData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'Short1',
      };

      mockContext = createMockContext(registerData);

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      expect(mockContext.status).toBe(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E001',
          data: expect.objectContaining({
            details: expect.objectContaining({
              password: expect.arrayContaining([expect.stringContaining('8')]),
            }),
          }),
        }),
        400
      );
    });

    it('should return 400 when password lacks uppercase letter', async () => {
      const { AuthController } = await importAuthController();

      const registerData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'lowercase123',
      };

      mockContext = createMockContext(registerData);

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      expect(mockContext.status).toBe(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E001',
          data: expect.objectContaining({
            details: expect.objectContaining({
              password: expect.arrayContaining([expect.stringContaining('uppercase')]),
            }),
          }),
        }),
        400
      );
    });

    it('should return 400 when password lacks number', async () => {
      const { AuthController } = await importAuthController();

      const registerData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'NoNumbersHere',
      };

      mockContext = createMockContext(registerData);

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      expect(mockContext.status).toBe(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E001',
          data: expect.objectContaining({
            details: expect.objectContaining({
              password: expect.arrayContaining([expect.stringContaining('number')]),
            }),
          }),
        }),
        400
      );
    });

    it('should return 400 with code E002 for duplicate email', async () => {
      const { AuthController } = await importAuthController();

      const registerData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'SecurePass123',
      };

      mockContext = createMockContext(registerData);
      mockAuthService.register.mockRejectedValue(new Error('Email already registered'));

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      expect(mockContext.status).toBe(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E002',
          message: 'Email already registered',
        }),
        400
      );
    });

    it('should normalize email to lowercase before registration', async () => {
      const { AuthController } = await importAuthController();

      const registerData = {
        name: 'New User',
        email: 'NEW@EXAMPLE.COM',
        password: 'SecurePass123',
      };

      const authResult: AuthResult = {
        user: {
          id: 'new-user-123',
          email: 'new@example.com',
          name: 'New User',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: null,
        },
        preferences: {
          defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          theme: 'auto',
          timezone: 'UTC',
          enableNotifications: true,
        },
      };

      mockContext = createMockContext(registerData);
      mockAuthService.register.mockResolvedValue(authResult);

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
        })
      );
    });

    it('should handle empty request body gracefully', async () => {
      const { AuthController } = await importAuthController();

      mockContext = createMockContext({});

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      expect(mockContext.status).toBe(400);
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });
  });

  describe('GET /me (protected endpoint)', () => {
    it('should return 401 when userId is missing from context', async () => {
      const { AuthController } = await importAuthController();

      // No user in context
      mockContext = createMockContext(null, {});
      mockContext.get = vi.fn().mockReturnValue(undefined);

      const authController = new AuthController(mockAuthService as any);
      await authController.getMe()(mockContext);

      expect(mockContext.status).toBe(401);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E004',
          message: 'Unauthorized',
        }),
        401
      );
    });

    it('should return user data when token is valid', async () => {
      const { AuthController } = await importAuthController();




      const userPayload = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
          lastLogin: mockUser.lastLogin!,
        },
      };

      mockContext = createMockContext(null, {
        'Authorization': 'Bearer valid-token',
      });

      // Mock the middleware to set user in context
      mockContext.get = vi.fn().mockImplementation((key) => {
        if (key === 'userId') return 'user-123';
        return undefined;
      });

      mockAuthService.getProfile.mockResolvedValue(userPayload);

      const authController = new AuthController(mockAuthService as any);
      await authController.getMe()(mockContext);

      expect(mockContext.status).toBe(200);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: 'user-123',
              email: 'test@example.com',
            }),
          }),
          code: 'S001',
        }),
        200
      );
    });

    it('should return user data from context when user is set by middleware', async () => {
      const { AuthController } = await importAuthController();




      const authenticatedUser = {
        user: {
          id: 'user-456',
          email: 'authenticated@example.com',
          name: 'Authenticated User',
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
          lastLogin: mockUser.lastLogin!,
        }
      };

      mockContext = createMockContext(null, {
        'Authorization': 'Bearer valid-jwt-token',
      });

      // Simulate middleware setting user in context
      mockContext.get = vi.fn().mockImplementation((key: string) => {
        if (key === 'userId') return 'user-456';
        return undefined;
      });

      mockAuthService.getProfile.mockResolvedValue(authenticatedUser);

      const authController = new AuthController(mockAuthService as any);
      await authController.getMe()(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'S001',
          data: expect.objectContaining({
            user: expect.objectContaining({
              id: 'user-456'
            })
          })
        }),
        200
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const { AuthController } = await importAuthController();


      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'CorrectP@ss123',
      };

      mockContext = createMockContext(loginData);
      mockAuthService.login.mockRejectedValue(new Error('Unexpected database error'));

      const authController = new AuthController(mockAuthService as any);
      await authController.login()(mockContext);

      expect(mockContext.status).toBe(500);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'E004',
          message: 'Internal server error',
        }),
        500
      );
    });

    it('should handle validation errors from validation middleware', async () => {
      const { AuthController } = await importAuthController();


      const invalidData = {
        email: '',
        password: '',
      };

      mockContext = createMockContext(invalidData);

      const authController = new AuthController(mockAuthService as any);
      await authController.login()(mockContext);

      expect(mockContext.status).toBe(400);
    });
  });

  describe('Controller Integration Scenarios', () => {
    it('should handle complete login flow with all validation passing', async () => {
      const { AuthController } = await importAuthController();


      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'CorrectP@ss123',
      };

      const loginResult: LoginResult = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
          lastLogin: mockUser.lastLogin!,
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.mock-signature',
      };

      mockContext = createMockContext(loginData);
      mockAuthService.login.mockResolvedValue(loginResult);

      const authController = new AuthController(mockAuthService as any);
      await authController.login()(mockContext);

      // Verify service was called
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);

      // Verify response structure
      const responseCall = (mockContext.json as any).mock.calls[0];
      const responseBody = responseCall[0];

      expect(responseBody.code).toBe('S001');
      expect(responseBody.message).toBe('Login successful');
      expect(responseBody.data.user).not.toHaveProperty('password');
      expect(responseBody.data.token).toBeDefined();
      expect(responseBody.data.token.split('.')).toHaveLength(3); // JWT format
    });

    it('should handle complete register flow with all validation passing', async () => {
      const { AuthController } = await importAuthController();


      const registerData: RegisterData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123',
      };

      const authResult: AuthResult = {
        user: {
          id: 'new-user-789',
          email: 'john.doe@example.com',
          name: 'John Doe',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: null,
        },
        preferences: {
          defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          theme: 'auto',
          timezone: 'America/New_York',
          enableNotifications: true,
        },
      };

      mockContext = createMockContext(registerData);
      mockAuthService.register.mockResolvedValue(authResult);

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      // Verify service was called
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);

      // Verify response
      const responseCall = (mockContext.json as any).mock.calls[0];
      const responseBody = responseCall[0];

      expect(responseBody.code).toBe('S002');
      expect(responseBody.message).toBe('Registration successful');
      expect(responseBody.data.user.id).toBe('new-user-789');
      expect(responseBody.data.preferences.timezone).toBe('America/New_York');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long name in registration', async () => {
      const { AuthController } = await importAuthController();


      const registerData = {
        name: 'A'.repeat(101),  // 101 characters to exceed max of 100
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      mockContext = createMockContext(registerData);

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      // Should fail validation due to name being too long
      expect(mockContext.status).toBe(400);
    });

    it('should handle special characters in name', async () => {
      const { AuthController } = await importAuthController();


      const registerData = {
        name: "John O'Brien-Smith Jr.",
        email: 'test@example.com',
        password: 'SecurePass123',
      };

      const authResult: AuthResult = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: "John O'Brien-Smith Jr.",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: null,
        },
        preferences: mockPreferences,
      };

      mockContext = createMockContext(registerData);
      mockAuthService.register.mockResolvedValue(authResult);

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      expect(mockContext.status).toBe(201);
      expect(mockAuthService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "John O'Brien-Smith Jr.",
        })
      );
    });

    it('should handle email with unusual TLDs', async () => {
      const { AuthController } = await importAuthController();


      const registerData = {
        name: 'Test User',
        email: 'test@domain.co.uk',
        password: 'SecurePass123',
      };

      const authResult: AuthResult = {
        user: {
          id: 'user-123',
          email: 'test@domain.co.uk',
          name: 'Test User',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: null,
        },
        preferences: mockPreferences,
      };

      mockContext = createMockContext(registerData);
      mockAuthService.register.mockResolvedValue(authResult);

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      expect(mockContext.status).toBe(201);
    });

    it('should handle password with maximum allowed length', async () => {
      const { AuthController } = await importAuthController();


      const longPassword = 'A'.repeat(128) + '1';
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: longPassword,
      };

      const authResult: AuthResult = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: null,
        },
        preferences: mockPreferences,
      };

      mockContext = createMockContext(registerData);
      mockAuthService.register.mockResolvedValue(authResult);

      const authController = new AuthController(mockAuthService as any);
      await authController.register()(mockContext);

      // Should pass password length validation
      expect(mockContext.status).toBe(201);
    });

    it('should handle multiple simultaneous login requests', async () => {
      const { AuthController } = await importAuthController();


      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'CorrectP@ss123',
      };

      const loginResult: LoginResult = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
          lastLogin: mockUser.lastLogin!,
        },
        token: 'valid-jwt-token',
      };

      mockAuthService.login.mockResolvedValue(loginResult);

      // Create multiple contexts
      const contexts = [
        createMockContext({ ...loginData }),
        createMockContext({ ...loginData }),
        createMockContext({ ...loginData }),
      ];

      const authController = new AuthController(mockAuthService as any);

      // Execute concurrently
      await Promise.all(
        contexts.map(ctx => authController.login()(ctx))
      );

      // All should succeed
      contexts.forEach(ctx => {
        expect(ctx.status).toBe(200);
      });

      // All should call service
      expect(mockAuthService.login).toHaveBeenCalledTimes(3);
    });
  });
});
