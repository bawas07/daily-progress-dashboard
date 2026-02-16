import { describe, it, expect, beforeEach } from 'vitest';
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
import { CommitmentRepository } from '../../../../src/modules/commitment/repositories/commitment.repository';
import { CommitmentLogRepository } from '../../../../src/modules/commitment/repositories/commitment-log.repository';
import { CommitmentService } from '../../../../src/modules/commitment/services/commitment.service';
import { TimelineEventRepository } from '../../../../src/modules/timeline-events/repositories/timeline-event.repository';
import { TimelineEventService } from '../../../../src/modules/timeline-events/services/timeline-event.service';
import { DashboardService } from '../../../../src/modules/dashboard/dashboard.service';

// Mock DatabaseService
class MockDatabaseService {
    public client: any;

    constructor() {
        this.client = createMockPrismaClient();
    }

    async connect() { return Promise.resolve(); }
    async disconnect() { return Promise.resolve(); }
}

describe('Dashboard Integration Tests', () => {
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

    const mockDate = new Date('2024-01-15T00:00:00Z'); // Monday

    const mockTimelineEvent = {
        id: 'event-123',
        userId: 'user-123',
        title: 'Morning Standup',
        startTime: new Date('2024-01-15T09:00:00Z'),
        durationMinutes: 30,
        recurrencePattern: 'daily',
        daysOfWeek: null,
        status: 'active',
        createdAt: mockDate,
        updatedAt: mockDate,
    };

    const mockProgressItem = {
        id: 'item-123',
        userId: 'user-123',
        title: 'Complete project proposal',
        importance: 'high',
        urgency: 'high',
        activeDays: ['mon', 'wed', 'fri'],
        deadline: null,
        status: 'active',
        createdAt: mockDate,
        updatedAt: mockDate,
    };

    const mockCommitment = {
        id: 'commitment-123',
        userId: 'user-123',
        title: 'Exercise',
        scheduledDays: ['mon', 'wed', 'fri'],
        createdAt: mockDate,
        updatedAt: mockDate,
        logs: [],
    };

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

        const jwtService = new JwtService();
        token = jwtService.sign({ sub: mockUser.id, email: mockUser.email });
    });

    describe('GET /api/dashboard', () => {
        it('should return aggregated dashboard data for a specific date', async () => {
            mockPrisma.timelineEvent.findMany.mockResolvedValue([mockTimelineEvent]);
            mockPrisma.progressItem.findMany.mockResolvedValue([mockProgressItem]);
            mockPrisma.progressItem.count.mockResolvedValue(1);
            mockPrisma.commitment.findMany.mockResolvedValue([mockCommitment]);

            const res = await app.request('/api/dashboard?date=2024-01-15', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.code).toBe('S001');
            expect(body.data).toHaveProperty('timeline');
            expect(body.data).toHaveProperty('progressItems');
            expect(body.data).toHaveProperty('commitments');
        });

        it('should return 401 without authentication', async () => {
            const res = await app.request('/api/dashboard?date=2024-01-15', {
                method: 'GET',
            });

            expect(res.status).toBe(401);
        });

        it('should return 400 with missing date parameter', async () => {
            const res = await app.request('/api/dashboard', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(400);
        });

        it('should return 400 with invalid date format', async () => {
            const res = await app.request('/api/dashboard?date=invalid-date', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(400);
        });
    });
});
