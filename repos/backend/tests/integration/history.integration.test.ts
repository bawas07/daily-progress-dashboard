import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createHistoryRoutes, createItemsRoutes } from '../../src/modules/history/history.routes';
import { container } from '../../src/shared/registry';
import { JwtService } from '../../src/shared/jwt/jwt.service';
import { createMockPrismaClient } from '../setup/mocks/database.mock';
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
import { HistoryService } from '../../src/modules/history/history.service';

// Mock DatabaseService
class MockDatabaseService {
    public client: any;

    constructor() {
        this.client = createMockPrismaClient();
    }

    async connect() { return Promise.resolve(); }
    async disconnect() { return Promise.resolve(); }
}

describe('History API Integration Tests', () => {
    let app: Hono;
    let mockPrisma: any;
    let jwtService: JwtService;
    let authToken: string;
    let userId: string = 'user-123';

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
        container.register('HistoryService', HistoryService);

        jwtService = new JwtService();
        app = new Hono();
        app.route('/api/history', createHistoryRoutes(jwtService));
        app.route('/api/items', createItemsRoutes(jwtService));

        authToken = jwtService.sign({
            sub: userId,
            email: 'history-test@example.com',
        });
    });

    describe('GET /api/history/today', () => {
        it('should return today progress and commitment logs', async () => {
            mockPrisma.progressLog.findMany.mockResolvedValue([{
                id: 'log-1',
                progressItemId: 'item-1',
                loggedAt: new Date(),
                note: 'Test progress',
                isOffDay: false,
                progressItem: { title: 'Test Item' }
            }]);

            mockPrisma.commitmentLog.findMany.mockResolvedValue([{
                id: 'clog-1',
                commitmentId: 'commit-1',
                completedAt: new Date(),
                note: 'Test completion',
                commitment: { title: 'Test Commitment' }
            }]);

            const response = await app.request('/api/history/today?date=2024-01-15', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.code).toBe('S001');
            expect(data.data.progressLogs).toHaveLength(1);
            expect(data.data.commitmentLogs).toHaveLength(1);
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/history/today?date=2024-01-15');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/items/all', () => {
        it('should return all active progress items and commitments', async () => {
            mockPrisma.progressItem.findMany.mockResolvedValue([{
                id: 'item-1',
                userId,
                title: 'Active Item 1',
                importance: 'high',
                urgency: 'high',
                activeDays: ['mon', 'wed', 'fri'],
                status: 'active',
                logs: []
            }]);

            mockPrisma.commitment.findMany.mockResolvedValue([{
                id: 'commit-1',
                userId,
                title: 'Test Commitment',
                scheduledDays: ['mon', 'wed', 'fri'],
            }]);

            const response = await app.request('/api/items/all?date=2024-01-15', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            if (response.status !== 200) {
                console.error('Response Error:', data);
            }

            expect(response.status).toBe(200);
            expect(data.code).toBe('S001');
            expect(data.data.progressItems).toHaveLength(1);
            expect(data.data.commitments).toHaveLength(1);
        });
    });
});
