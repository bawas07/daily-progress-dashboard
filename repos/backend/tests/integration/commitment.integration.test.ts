import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createApp } from '../../src/app';
import { container } from '../../src/shared/container';
import { createMockPrismaClient } from '../setup/mocks/database.mock';
import { JwtService } from '../../src/shared/jwt/jwt.service';
import { PasswordService } from '../../src/modules/auth/services/password.service';
import { AuthService } from '../../src/modules/auth/services/auth.service';
import { UserPreferencesService } from '../../src/modules/user-preferences/services/user.preferences.service';
import { UserRepository } from '../../src/modules/auth/repositories/user.repository';
import { UserPreferencesRepository } from '../../src/modules/auth/repositories/user.preferences.repository';
import { CommitmentRepository } from '../../src/modules/commitment/repositories/commitment.repository';
import { CommitmentLogRepository } from '../../src/modules/commitment/repositories/commitment-log.repository';
import { CommitmentService } from '../../src/modules/commitment/services/commitment.service';
import { RefreshTokenRepository } from '../../src/modules/auth/repositories/refresh-token.repository';
import { RefreshTokenService } from '../../src/modules/auth/services/refresh-token.service';
import { ProgressItemRepository } from '../../src/modules/progress-items/repositories/progress-item.repository';
import { ProgressLogRepository } from '../../src/modules/progress-items/repositories/progress-log.repository';
import { ProgressItemService } from '../../src/modules/progress-items/services/progress-item.service';

// Mock DatabaseService
class MockDatabaseService {
    public client: any;

    constructor() {
        this.client = createMockPrismaClient();
    }

    async connect() { return Promise.resolve(); }
    async disconnect() { return Promise.resolve(); }
}

describe('Commitment Integration Tests', () => {
    let app: any;
    let mockPrisma: any; // ReturnType<typeof createMockPrismaClient>;

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hash',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
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

        // Progress items (needed for routes.ts)
        container.register('ProgressItemRepository', ProgressItemRepository);
        container.register('ProgressLogRepository', ProgressLogRepository);
        container.register('ProgressItemService', ProgressItemService);

        // Commitment services
        container.register('CommitmentRepository', CommitmentRepository);
        container.register('CommitmentLogRepository', CommitmentLogRepository);
        container.register('CommitmentService', CommitmentService);

        // 4. Create app
        app = createApp();
    });

    describe('Commitment Flow', () => {
        it('should create, log, and retrieve commitments', async () => {
            // Mock User existence for verifyUser middleware if any, 
            // but authMiddleware uses JwtService verify, which doesn't hit DB unless it checks user existence.
            // Our authMiddleware usually just verifies token. 
            // Wait, authMiddleware extracts userId from token.
            // But if we use 'getMe' it hits DB.
            // Here we use commitment endpoints.

            // 1. Generate Token
            const jwtService = new JwtService();
            const token = jwtService.sign({ sub: mockUser.id, email: mockUser.email });
            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

            // 2. Create Commitment
            const commitmentData = {
                title: 'Early Morning Run',
                scheduledDays: ['mon', 'wed', 'fri']
            };

            const createdCommitment = {
                id: 'c-1',
                userId: mockUser.id,
                ...commitmentData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.commitment.create.mockResolvedValue(createdCommitment);

            const createRes = await app.request('/api/commitments', {
                method: 'POST',
                headers,
                body: JSON.stringify(commitmentData)
            });

            expect(createRes.status).toBe(201);
            const createBody = await createRes.json();
            expect(createBody.data.id).toBe('c-1');

            // 3. Log Commitment
            const logData = { note: 'Done' };
            const createdLog = {
                id: 'l-1',
                commitmentId: 'c-1',
                completedAt: new Date(),
                note: 'Done'
            };

            // Mock findById for validation
            mockPrisma.commitment.findUnique.mockResolvedValue(createdCommitment);
            mockPrisma.commitmentLog.create.mockResolvedValue(createdLog);

            const logRes = await app.request('/api/commitments/c-1/logs', {
                method: 'POST',
                headers,
                body: JSON.stringify(logData)
            });

            expect(logRes.status).toBe(201);
            const logBody = await logRes.json();
            expect(logBody.data.note).toBe('Done');

            // 4. Get Commitments
            mockPrisma.commitment.findMany.mockResolvedValue([createdCommitment]);
            // Mock count for "completedToday"
            mockPrisma.commitmentLog.count.mockResolvedValue(1);

            const getRes = await app.request('/api/commitments', {
                method: 'GET',
                headers
            });

            expect(getRes.status).toBe(200);
            const getBody = await getRes.json();
            expect(getBody.data).toHaveLength(1);
            expect(getBody.data[0].id).toBe('c-1');
            expect(getBody.data[0].completedToday).toBe(true);
        });
    });
});
