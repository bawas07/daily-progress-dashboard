import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { UserPreferencesController } from '../../../../src/modules/user-preferences/user-preferences.controller';
import { UserPreferencesService } from '../../../../src/modules/user-preferences/services/user.preferences.service';
import { UserPreferencesRepository } from '../../../../src/modules/auth/repositories/user.preferences.repository';
import { authMiddleware } from '../../../../src/shared/middleware/auth.middleware';
import { JwtService } from '../../../../src/shared/jwt/jwt.service';

// Mock the repository
vi.mock('../../../../src/modules/auth/repositories/user.preferences.repository');

describe('UserPreferencesController', () => {
  let jwtService: JwtService;
  let validToken: string;
  let userPreferencesService: UserPreferencesService;
  let mockRepository: UserPreferencesRepository;
  let controller: UserPreferencesController;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Setup JWT service
    jwtService = new JwtService();

    // Generate valid token
    validToken = jwtService.sign({
      sub: 'user-123',
      email: 'test@example.com',
    });

    // Create mock repository
    mockRepository = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    } as unknown as UserPreferencesRepository;

    // Create service with mock repository (constructor injection)
    userPreferencesService = new UserPreferencesService(mockRepository);

    // Create controller with service (constructor injection)
    controller = new UserPreferencesController(userPreferencesService);
  });

  describe('GET /api/user/preferences', () => {
    it('should return user preferences for authenticated user', async () => {
      const app = new Hono();

      // Setup mock repository to return preferences
      (mockRepository.findByUserId as any).mockResolvedValue({
        userId: 'user-123',
        defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        theme: 'dark',
        timezone: 'America/New_York',
        enableNotifications: true,
      });

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.get('/api/user/preferences', controller.getPreferences());

      const response = await app.request('/api/user/preferences', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.code).toBe('S001');
      expect(json.message).toBe('Preferences retrieved successfully');
      expect(json.data).toEqual({
        defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        theme: 'dark',
        timezone: 'America/New_York',
        enableNotifications: true,
      });
    });

    it('should create default preferences if none exist', async () => {
      const app = new Hono();

      // Setup mock to return null first (no existing preferences), then return default preferences
      (mockRepository.findByUserId as any).mockResolvedValue(null);
      (mockRepository.create as any).mockResolvedValue({
        userId: 'user-123',
        defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        theme: 'auto',
        timezone: 'UTC',
        enableNotifications: false,
      });

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.get('/api/user/preferences', controller.getPreferences());

      const response = await app.request('/api/user/preferences', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.code).toBe('S001');
      expect(json.data.theme).toBe('auto');
      expect(mockRepository.create).toHaveBeenCalledWith('user-123');
    });

    it('should return 401 when no token provided', async () => {
      const app = new Hono();

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.get('/api/user/preferences', controller.getPreferences());

      const response = await app.request('/api/user/preferences');

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.code).toBe('E002');
      expect(json.message).toBe('Authorization header is required');
    });

    it('should return 401 when invalid token provided', async () => {
      const app = new Hono();

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.get('/api/user/preferences', controller.getPreferences());

      const response = await app.request('/api/user/preferences', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.code).toBe('E002');
    });

    it('should return 500 when service throws error', async () => {
      const app = new Hono();

      // Setup mock to throw error
      (mockRepository.findByUserId as any).mockRejectedValue(new Error('Database error'));

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.get('/api/user/preferences', controller.getPreferences());

      const response = await app.request('/api/user/preferences', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.code).toBe('E004');
    });
  });

  describe('PUT /api/user/preferences', () => {
    it('should update user preferences with valid data', async () => {
      const app = new Hono();

      const updatedData = {
        defaultActiveDays: ['mon', 'wed', 'fri'],
        theme: 'light' as const,
        timezone: 'America/Los_Angeles',
        enableNotifications: false,
      };

      // Setup mock to return updated preferences
      (mockRepository.update as any).mockResolvedValue({
        userId: 'user-123',
        ...updatedData,
      });

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.put('/api/user/preferences', controller.updatePreferences());

      const response = await app.request('/api/user/preferences', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.code).toBe('S002');
      expect(json.message).toBe('Preferences updated successfully');
      expect(json.data).toEqual(updatedData);
    });

    it('should update partial preferences', async () => {
      const app = new Hono();

      const partialUpdate = {
        theme: 'dark' as const,
      };

      const updatedData = {
        defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        theme: 'dark',
        timezone: 'America/New_York',
        enableNotifications: true,
      };

      // Setup mock to return updated preferences
      (mockRepository.update as any).mockResolvedValue(updatedData);

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.put('/api/user/preferences', controller.updatePreferences());

      const response = await app.request('/api/user/preferences', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partialUpdate),
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.code).toBe('S002');
      expect(json.data.theme).toBe('dark');
    });

    it('should return 400 for invalid theme', async () => {
      const app = new Hono();

      const invalidData = {
        theme: 'invalid-theme',
      };

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.put('/api/user/preferences', controller.updatePreferences());

      const response = await app.request('/api/user/preferences', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      // Schema validation catches invalid enum values (E001)
      expect(json.code).toBe('E001');
    });

    it('should return 400 for invalid defaultActiveDays (empty array)', async () => {
      const app = new Hono();

      const invalidData = {
        defaultActiveDays: [],
      };

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.put('/api/user/preferences', controller.updatePreferences());

      const response = await app.request('/api/user/preferences', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      // Schema validation catches empty arrays (E001), not service validation (E003)
      expect(json.code).toBe('E001');
    });

    it('should return 400 for invalid defaultActiveDays (invalid day)', async () => {
      const app = new Hono();

      const invalidData = {
        defaultActiveDays: ['mon', 'tue', 'invalid-day'],
      };

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.put('/api/user/preferences', controller.updatePreferences());

      const response = await app.request('/api/user/preferences', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      // Schema validation catches invalid enum values (E001)
      expect(json.code).toBe('E001');
    });

    it('should return 400 for invalid timezone', async () => {
      const app = new Hono();

      const invalidData = {
        timezone: 'Invalid/Timezone',
      };

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.put('/api/user/preferences', controller.updatePreferences());

      const response = await app.request('/api/user/preferences', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toBe('E003');
      expect(json.message).toContain('Invalid timezone');
    });

    it('should return 400 for empty timezone', async () => {
      const app = new Hono();

      const invalidData = {
        timezone: '',
      };

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.put('/api/user/preferences', controller.updatePreferences());

      const response = await app.request('/api/user/preferences', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      // Empty string is caught by Zod schema validation (E001), not service validation (E003)
      expect(json.code).toBe('E001');
    });

    it('should return 401 when no token provided', async () => {
      const app = new Hono();

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.put('/api/user/preferences', controller.updatePreferences());

      const response = await app.request('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: 'dark' }),
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.code).toBe('E002');
    });

    it('should return 500 when service throws unexpected error', async () => {
      const app = new Hono();

      // Setup mock to throw unexpected error
      (mockRepository.update as any).mockRejectedValue(new Error('Unexpected error'));

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.put('/api/user/preferences', controller.updatePreferences());

      const response = await app.request('/api/user/preferences', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: 'dark' }),
      });

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.code).toBe('E004');
    });
  });

  describe('validation schema integration', () => {
    it('should validate all optional fields correctly', async () => {
      const app = new Hono();

      const validData = {
        theme: 'auto',
        timezone: 'Europe/London',
        defaultActiveDays: ['sat', 'sun'],
        enableNotifications: true,
      };

      (mockRepository.update as any).mockResolvedValue({
        userId: 'user-123',
        ...validData,
      });

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.put('/api/user/preferences', controller.updatePreferences());

      const response = await app.request('/api/user/preferences', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validData),
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.code).toBe('S002');
    });

    it('should reject invalid boolean value for enableNotifications', async () => {
      const app = new Hono();

      const invalidData = {
        enableNotifications: 'true', // Should be boolean
      };

      app.use('/api/user/preferences', authMiddleware(jwtService));
      app.put('/api/user/preferences', controller.updatePreferences());

      const response = await app.request('/api/user/preferences', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);
    });
  });
});
