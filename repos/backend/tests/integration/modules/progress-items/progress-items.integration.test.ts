
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createApp } from '../../../../src/app';
import { container } from '../../../../src/shared/container';
import { createMockPrismaClient } from '../../../setup/mocks/database.mock';
import { JwtService } from '../../../../src/shared/jwt/jwt.service';
import { PasswordService } from '../../../../src/modules/auth/services/password.service';
import { UserRepository } from '../../../../src/modules/auth/repositories/user.repository';
import { UserPreferencesRepository } from '../../../../src/modules/auth/repositories/user.preferences.repository';
import { AuthService } from '../../../../src/modules/auth/services/auth.service';
import { UserPreferencesService } from '../../../../src/modules/user-preferences/services/user.preferences.service';
import { ProgressItemRepository } from '../../../../src/modules/progress-items/repositories/progress-item.repository';
import { ProgressLogRepository } from '../../../../src/modules/progress-items/repositories/progress-log.repository';
import { ProgressItemService } from '../../../../src/modules/progress-items/services/progress-item.service';
import { RefreshTokenRepository } from '../../../../src/modules/auth/repositories/refresh-token.repository';
import { RefreshTokenService } from '../../../../src/modules/auth/services/refresh-token.service';

// Mock DatabaseService
class MockDatabaseService {
    public client: any;

    constructor() {
        this.client = createMockPrismaClient();
    }

    async connect() { return Promise.resolve(); }
    async disconnect() { return Promise.resolve(); }
}

describe('Progress Items Integration Tests', () => {
    let app: any;
    let mockPrisma: ReturnType<typeof createMockPrismaClient>;
    let token: string;

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hash',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockDate = new Date('2024-01-01T12:00:00Z');

    const mockItem = {
        id: 'item-123',
        userId: 'user-123',
        title: 'Integration Test Item',
        importance: 'high',
        urgency: 'high',
        activeDays: ['mon', 'wed', 'fri'],
        deadline: null,
        status: 'active',
        createdAt: mockDate,
        updatedAt: mockDate,
    };

    beforeEach(() => {
        // 1. Clear container
        container.clear();

        // 2. Create mock database service instance
        const mockDbService = new MockDatabaseService();
        mockPrisma = mockDbService.client;

        // 3. Register services manually
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

        // Progress Items Module
        container.register('ProgressItemRepository', ProgressItemRepository);
        container.register('ProgressLogRepository', ProgressLogRepository);
        container.register('ProgressItemService', ProgressItemService);

        // 4. Create app
        app = createApp();

        // 5. Generate Token
        const jwtService = new JwtService();
        token = jwtService.sign({ sub: mockUser.id, email: mockUser.email });
    });

    describe('POST /api/progress-items', () => {
        it('should create a progress item', async () => {
            mockPrisma.progressItem.create.mockResolvedValue(mockItem);

            const res = await app.request('/api/progress-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Integration Test Item',
                    importance: 'high',
                    urgency: 'high',
                    activeDays: ['mon', 'wed', 'fri']
                })
            });

            expect(res.status).toBe(201);
            const body = await res.json();
            expect(body.data.title).toBe(mockItem.title);
            expect(mockPrisma.progressItem.create).toHaveBeenCalled();
        });

        it('should fail without auth', async () => {
            const res = await app.request('/api/progress-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: 'Fail Item',
                    importance: 'high',
                    urgency: 'high',
                    activeDays: ['mon']
                })
            });
            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/progress-items', () => {
        it('should list progress items', async () => {
            mockPrisma.progressItem.findMany.mockResolvedValue([mockItem]);
            mockPrisma.progressItem.count.mockResolvedValue(1);

            const res = await app.request('/api/progress-items', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.data.data).toHaveLength(1);
            expect(body.data.data[0].id).toBe(mockItem.id);
        });
    });

    describe('POST /api/progress-items/:id/logs', () => {
        it('should log progress', async () => {
            // Mock findById for validation
            mockPrisma.progressItem.findUnique.mockResolvedValue(mockItem);

            const mockLog = {
                id: 'log-1',
                progressItemId: mockItem.id,
                loggedAt: new Date(),
                note: 'Worked on integration test',
                isOffDay: false,
                createdAt: new Date(),
            };
            mockPrisma.progressLog.create.mockResolvedValue(mockLog);

            const res = await app.request(`/api/progress-items/${mockItem.id}/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    loggedAt: new Date().toISOString(),
                    note: 'Worked on integration test'
                })
            });

            expect(res.status).toBe(201);
            const body = await res.json();
            expect(body.data.id).toBe(mockLog.id);
        });
    });

    describe('GET /api/progress-items/:id/logs', () => {
        it('should get logs history', async () => {
            mockPrisma.progressItem.findUnique.mockResolvedValue(mockItem);
            mockPrisma.progressLog.findMany.mockResolvedValue([]);
            mockPrisma.progressLog.count.mockResolvedValue(0);

            const res = await app.request(`/api/progress-items/${mockItem.id}/logs`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.data.data).toEqual([]);
        });
    });

    describe('PUT /api/progress-items/:id/settle', () => {
        it('should settle item', async () => {
            mockPrisma.progressItem.findUnique.mockResolvedValue(mockItem);
            mockPrisma.progressItem.update.mockResolvedValue({ ...mockItem, status: 'settled' });

            const res = await app.request(`/api/progress-items/${mockItem.id}/settle`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.data.status).toBe('settled');
        });
    });
});
