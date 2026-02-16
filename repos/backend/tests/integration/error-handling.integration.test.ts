import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../../src/app';
import { container } from '../../src/shared/container';
import { createMockPrismaClient } from '../setup/mocks/database.mock';
import { JwtService } from '../../src/shared/jwt/jwt.service';
import { PasswordService } from '../../src/modules/auth/services/password.service';
import { AuthService } from '../../src/modules/auth/services/auth.service';
import { UserPreferencesService } from '../../src/modules/user-preferences/services/user.preferences.service';
import { UserRepository } from '../../src/modules/auth/repositories/user.repository';
import { UserPreferencesRepository } from '../../src/modules/auth/repositories/user.preferences.repository';
import { RefreshTokenRepository } from '../../src/modules/auth/repositories/refresh-token.repository';
import { RefreshTokenService } from '../../src/modules/auth/services/refresh-token.service';
import { ProgressItemRepository } from '../../src/modules/progress-items/repositories/progress-item.repository';
import { ProgressLogRepository } from '../../src/modules/progress-items/repositories/progress-log.repository';
import { ProgressItemService } from '../../src/modules/progress-items/services/progress-item.service';
import { CommitmentRepository } from '../../src/modules/commitment/repositories/commitment.repository';
import { CommitmentLogRepository } from '../../src/modules/commitment/repositories/commitment-log.repository';
import { CommitmentService } from '../../src/modules/commitment/services/commitment.service';
import { TimelineEventRepository } from '../../src/modules/timeline-events/repositories/timeline-event.repository';
import { TimelineEventService } from '../../src/modules/timeline-events/services/timeline-event.service';
import { DashboardService } from '../../src/modules/dashboard/dashboard.service';

// Mock DatabaseService
class MockDatabaseService {
  public client: any;

  constructor() {
    this.client = createMockPrismaClient();
  }

  async connect() { return Promise.resolve(); }
  async disconnect() { return Promise.resolve(); }
}

describe('Error Handling and Validation Integration Tests', () => {
  let app: any;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    container.clear();
    const mockDbService = new MockDatabaseService();
    mockPrisma = mockDbService.client;

    container.register('DatabaseService', class {
      constructor() { return mockDbService; }
    } as any);

    container.register('JwtService', JwtService);
    container.register('PasswordService', PasswordService);
    container.register('UserRepository', UserRepository);
    container.register('UserPreferencesRepository', UserPreferencesRepository);
    container.register('RefreshTokenRepository', RefreshTokenRepository);
    container.register('AuthService', AuthService);
    container.register('UserPreferencesService', UserPreferencesService);
    container.register('RefreshTokenService', RefreshTokenService);
    container.register('ProgressItemRepository', ProgressItemRepository);
    container.register('ProgressLogRepository', ProgressLogRepository);
    container.register('ProgressItemService', ProgressItemService);
    container.register('CommitmentRepository', CommitmentRepository);
    container.register('CommitmentLogRepository', CommitmentLogRepository);
    container.register('CommitmentService', CommitmentService);
    container.register('TimelineEventRepository', TimelineEventRepository);
    container.register('TimelineEventService', TimelineEventService);
    container.register('DashboardService', DashboardService);

    app = createApp();
  });

  describe('Authentication Validation Errors', () => {
    describe('POST /api/auth/login', () => {
      it('should return validation error for missing email', async () => {
        const response = await app.request('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'Password123' }),
        });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.code).toMatch(/^E/);
        expect(json.message).toContain('Validation');
        expect(json.data.details).toBeDefined();
      });

      it('should return validation error for invalid email format', async () => {
        const response = await app.request('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'notanemail', password: 'Password123' }),
        });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.code).toMatch(/^E/);
        expect(json.data.details.email).toBeDefined();
      });

      it('should return validation error for missing password', async () => {
        const response = await app.request('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' }),
        });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.code).toMatch(/^E/);
        expect(json.data.details.password).toBeDefined();
      });

      it('should return validation error for malformed JSON', async () => {
        const response = await app.request('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json',
        });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.code).toMatch(/^E/);
      });
    });

    describe('POST /api/auth/register', () => {
      it('should return validation error for missing name', async () => {
        const response = await app.request('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'Password123',
          }),
        });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.code).toMatch(/^E/);
        expect(json.data.details.name).toBeDefined();
      });

      it('should return validation error for weak password', async () => {
        const response = await app.request('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'weak',
          }),
        });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.code).toMatch(/^E/);
        expect(json.data.details.password).toBeDefined();
      });

      it('should return validation error for password without uppercase', async () => {
        const response = await app.request('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
          }),
        });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.code).toMatch(/^E/);
        expect(json.data.details.password).toBeDefined();
      });

      it('should return validation error for password without number', async () => {
        const response = await app.request('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'Password',
          }),
        });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.code).toMatch(/^E/);
        expect(json.data.details.password).toBeDefined();
      });
    });

    describe('POST /api/auth/refresh', () => {
      it('should return validation error for missing refreshToken', async () => {
        const response = await app.request('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.code).toMatch(/^E/);
        expect(json.data.details.refreshToken).toBeDefined();
      });

      it('should return validation error for non-string refreshToken', async () => {
        const response = await app.request('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: 123 }),
        });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.code).toMatch(/^E/);
      });
    });
  });

  describe('Authorization Errors', () => {
    let validToken: string;

    beforeEach(() => {
      const jwtService = new JwtService();
      validToken = jwtService.sign({ sub: 'user-123', email: 'test@example.com' });
    });

    it('should return 401 for missing token on protected endpoint', async () => {
      const response = await app.request('/api/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });

    it('should return 401 for invalid token on protected endpoint', async () => {
      const response = await app.request('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });

    it('should return 401 for malformed authorization header', async () => {
      const response = await app.request('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'InvalidFormat token',
        },
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });
  });

  describe('Not Found Errors', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const response = await app.request('/api/non-existent', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.code).toBe('E003');
      expect(json.message).toContain('not found');
    });

    it('should return 404 for invalid HTTP method on valid endpoint', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.code).toBe('E003');
    });
  });

  describe('Server Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Mock a database error
      mockPrisma.user.findFirst.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123',
        }),
      });

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
      expect(json.message).toBeDefined();
    });
  });

  describe('Progress Items Validation Errors', () => {
    let validToken: string;

    beforeEach(() => {
      const jwtService = new JwtService();
      validToken = jwtService.sign({ sub: 'user-123', email: 'test@example.com' });
    });

    it('should return validation error for missing title', async () => {
      const response = await app.request('/api/progress-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          importance: 'high',
          urgency: 'high',
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });

    it('should return validation error for invalid importance value', async () => {
      const response = await app.request('/api/progress-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          title: 'Test Item',
          importance: 'invalid',
          urgency: 'high',
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });

    it('should return validation error for invalid urgency value', async () => {
      const response = await app.request('/api/progress-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          title: 'Test Item',
          importance: 'high',
          urgency: 'invalid',
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });
  });

  describe('Commitments Validation Errors', () => {
    let validToken: string;

    beforeEach(() => {
      const jwtService = new JwtService();
      validToken = jwtService.sign({ sub: 'user-123', email: 'test@example.com' });
    });

    it('should return validation error for missing title', async () => {
      const response = await app.request('/api/commitments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          scheduledDays: ['mon', 'wed'],
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });

    it('should return validation error for empty scheduledDays', async () => {
      const response = await app.request('/api/commitments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          title: 'Test Commitment',
          scheduledDays: [],
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });

    it('should return validation error for invalid day in scheduledDays', async () => {
      const response = await app.request('/api/commitments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          title: 'Test Commitment',
          scheduledDays: ['mon', 'invalid-day'],
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });
  });

  describe('Timeline Events Validation Errors', () => {
    let validToken: string;

    beforeEach(() => {
      const jwtService = new JwtService();
      validToken = jwtService.sign({ sub: 'user-123', email: 'test@example.com' });
    });

    it('should return validation error for missing title', async () => {
      const response = await app.request('/api/timeline-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          startTime: '2024-01-15T10:00:00Z',
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });

    it('should return validation error for missing startTime', async () => {
      const response = await app.request('/api/timeline-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          title: 'Test Event',
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });
  });

  describe('User Preferences Validation Errors', () => {
    let validToken: string;

    beforeEach(() => {
      const jwtService = new JwtService();
      validToken = jwtService.sign({ sub: 'user-123', email: 'test@example.com' });
    });

    it('should return validation error for invalid theme', async () => {
      const response = await app.request('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          theme: 'invalid-theme',
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });

    it('should return validation error for empty defaultActiveDays', async () => {
      const response = await app.request('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          defaultActiveDays: [],
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });

    it('should return validation error for invalid day in defaultActiveDays', async () => {
      const response = await app.request('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          defaultActiveDays: ['mon', 'invalid-day'],
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });
  });

  describe('Query Parameter Validation', () => {
    let validToken: string;

    beforeEach(() => {
      const jwtService = new JwtService();
      validToken = jwtService.sign({ sub: 'user-123', email: 'test@example.com' });
    });

    it('should return validation error for invalid pagination parameters', async () => {
      const response = await app.request('/api/progress-items?page=abc&limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });

    it('should return validation error for negative page number', async () => {
      const response = await app.request('/api/progress-items?page=-1&limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });

    it('should return validation error for limit exceeding maximum', async () => {
      const response = await app.request('/api/progress-items?page=1&limit=101', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
        },
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toMatch(/^E/);
    });
  });

  describe('Error Response Format Consistency', () => {
    it('should always return error responses with code, message, and data fields', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid-email' }),
      });

      const json = await response.json();
      expect(json).toHaveProperty('code');
      expect(json).toHaveProperty('message');
      expect(json).toHaveProperty('data');
      expect(json.code).toMatch(/^E/);
    });

    it('should include field-specific error details for validation errors', async () => {
      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'T',
          email: 'notanemail',
          password: 'weak',
        }),
      });

      const json = await response.json();
      expect(json.data.details).toBeDefined();
      expect(typeof json.data.details).toBe('object');
    });
  });

  describe('Content-Type Validation', () => {
    it('should handle requests with missing Content-Type header', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123',
        }),
      });

      // Hono's req.json() can parse JSON even without explicit Content-Type
      // So this should succeed with validation (401 because user doesn't exist in mock)
      expect([200, 400, 401]).toContain(response.status);
    });

    it('should return validation error for unsupported Content-Type', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'email=test@example.com&password=Password123',
      });

      // Should fail validation because the body isn't valid JSON
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
