import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createHistoryRoutes } from '../../src/modules/history/history.routes';
import { registerServices, container } from '../../src/shared/registry';
import { DatabaseService } from '../../src/shared/database/database.service';
import { JwtService } from '../../src/shared/jwt/jwt.service';
import { PrismaClient } from '@prisma/client';

describe.skip('History API Integration Tests', () => {
    let app: Hono;
    let dbService: DatabaseService;
    let prisma: PrismaClient;
    let jwtService: JwtService;
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
        // Register services
        registerServices();

        // Resolve services
        dbService = container.resolve<DatabaseService>('DatabaseService');
        jwtService = container.resolve<JwtService>('JwtService');
        prisma = dbService.client;

        // Setup test app
        app = new Hono();
        app.route('/api/history', createHistoryRoutes());
        app.route('/api/items', createHistoryRoutes()); // For /api/items/all route

        // Create test user and get auth token
        const user = await prisma.user.create({
            data: {
                email: 'history-test@example.com',
                passwordHash: 'hash',
            },
        });
        userId = user.id;
        authToken = jwtService.generateAccessToken(userId);
    });

    afterAll(async () => {
        // Cleanup
        await prisma.progressLog.deleteMany({});
        await prisma.progressItem.deleteMany({});
        await prisma.commitmentLog.deleteMany({});
        await prisma.commitment.deleteMany({});
        await prisma.user.deleteMany({});
        await dbService.disconnect();
    });

    beforeEach(async () => {
        // Clean up test data before each test
        await prisma.progressLog.deleteMany({});
        await prisma.progressItem.deleteMany({});
        await prisma.commitmentLog.deleteMany({});
        await prisma.commitment.deleteMany({});
    });

    describe('GET /api/history/today', () => {
        it('should return today progress and commitment logs', async () => {
            // Create test data
            const progressItem = await prisma.progressItem.create({
                data: {
                    userId,
                    title: 'Test Item',
                    importance: 'high',
                    urgency: 'high',
                    activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
                    status: 'active',
                },
            });

            await prisma.progressLog.create({
                data: {
                    progressItemId: progressItem.id,
                    loggedAt: new Date(),
                    note: 'Test progress',
                    isOffDay: false,
                },
            });

            const commitment = await prisma.commitment.create({
                data: {
                    userId,
                    title: 'Test Commitment',
                    scheduledDays: ['mon', 'wed', 'fri'],
                },
            });

            await prisma.commitmentLog.create({
                data: {
                    commitmentId: commitment.id,
                    completedAt: new Date(),
                    note: 'Test completion',
                },
            });

            // Make request
            const response = await app.request('/api/history/today?date=2024-01-15', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.code).toBe('S001');
            expect(data.data).toHaveProperty('progressLogs');
            expect(data.data).toHaveProperty('commitmentLogs');
            expect(data.data).toHaveProperty('summary');
            expect(data.data.summary.progressLogCount).toBeGreaterThan(0);
            expect(data.data.summary.commitmentLogCount).toBeGreaterThan(0);
        });

        it('should return empty data when no logs exist', async () => {
            const response = await app.request('/api/history/today?date=2024-01-15', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.progressLogs).toEqual([]);
            expect(data.data.commitmentLogs).toEqual([]);
            expect(data.data.summary.progressLogCount).toBe(0);
            expect(data.data.summary.commitmentLogCount).toBe(0);
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/history/today?date=2024-01-15');

            expect(response.status).toBe(401);
        });

        it('should validate date parameter', async () => {
            const response = await app.request('/api/history/today', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/history/week', () => {
        it('should return weekly history grouped by day', async () => {
            // Create test data for multiple days
            const progressItem = await prisma.progressItem.create({
                data: {
                    userId,
                    title: 'Test Item',
                    importance: 'high',
                    urgency: 'high',
                    activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
                    status: 'active',
                },
            });

            // Create logs for Monday and Tuesday
            await prisma.progressLog.create({
                data: {
                    progressItemId: progressItem.id,
                    loggedAt: new Date('2024-01-15T10:00:00Z'), // Monday
                    note: 'Monday progress',
                    isOffDay: false,
                },
            });

            await prisma.progressLog.create({
                data: {
                    progressItemId: progressItem.id,
                    loggedAt: new Date('2024-01-16T10:00:00Z'), // Tuesday
                    note: 'Tuesday progress',
                    isOffDay: false,
                },
            });

            const response = await app.request('/api/history/week?date=2024-01-15', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.code).toBe('S001');
            expect(data.data).toHaveProperty('weeklyData');
            expect(data.data).toHaveProperty('summary');
            expect(Object.keys(data.data.weeklyData).length).toBeGreaterThan(0);
        });

        it('should handle week at month boundary', async () => {
            const response = await app.request('/api/history/week?date=2024-01-31', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(data.data).toHaveProperty('weeklyData');
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/history/week?date=2024-01-15');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/history/month', () => {
        it('should return monthly history grouped by day', async () => {
            const progressItem = await prisma.progressItem.create({
                data: {
                    userId,
                    title: 'Test Item',
                    importance: 'high',
                    urgency: 'high',
                    activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
                    status: 'active',
                },
            });

            await prisma.progressLog.create({
                data: {
                    progressItemId: progressItem.id,
                    loggedAt: new Date('2024-01-15T10:00:00Z'),
                    note: 'Test progress',
                    isOffDay: false,
                },
            });

            const response = await app.request('/api/history/month?date=2024-01-15', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.code).toBe('S001');
            expect(data.data).toHaveProperty('monthlyData');
            expect(data.data).toHaveProperty('summary');
        });

        it('should handle leap year for February', async () => {
            const response = await app.request('/api/history/month?date=2024-02-15', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            expect(response.status).toBe(200);
            expect(data.data).toHaveProperty('monthlyData');
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/history/month?date=2024-01-15');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/items/all', () => {
        it('should return all active progress items and commitments', async () => {
            // Create test items
            await prisma.progressItem.create({
                data: {
                    userId,
                    title: 'Active Item 1',
                    importance: 'high',
                    urgency: 'high',
                    activeDays: ['mon', 'wed', 'fri'],
                    status: 'active',
                },
            });

            await prisma.progressItem.create({
                data: {
                    userId,
                    title: 'Active Item 2',
                    importance: 'low',
                    urgency: 'low',
                    activeDays: ['tue', 'thu'],
                    status: 'active',
                },
            });

            await prisma.commitment.create({
                data: {
                    userId,
                    title: 'Test Commitment',
                    scheduledDays: ['mon', 'wed', 'fri'],
                },
            });

            const response = await app.request('/api/items/all', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.code).toBe('S001');
            expect(data.data).toHaveProperty('progressItems');
            expect(data.data).toHaveProperty('commitments');
            expect(data.data.progressItems.length).toBe(2);
            expect(data.data.commitments.length).toBe(1);
        });

        it('should include isActiveToday flag for progress items', async () => {
            await prisma.progressItem.create({
                data: {
                    userId,
                    title: 'Monday Item',
                    importance: 'high',
                    urgency: 'high',
                    activeDays: ['mon', 'wed', 'fri'],
                    status: 'active',
                },
            });

            const response = await app.request('/api/items/all?date=2024-01-15', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.progressItems[0]).toHaveProperty('isActiveToday');
            expect(typeof data.data.progressItems[0].isActiveToday).toBe('boolean');
        });

        it('should include isScheduledToday flag for commitments', async () => {
            await prisma.commitment.create({
                data: {
                    userId,
                    title: 'Test Commitment',
                    scheduledDays: ['mon', 'wed', 'fri'],
                },
            });

            const response = await app.request('/api/items/all?date=2024-01-15', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.commitments[0]).toHaveProperty('isScheduledToday');
            expect(typeof data.data.commitments[0].isScheduledToday).toBe('boolean');
        });

        it('should include lastProgressAt for progress items', async () => {
            const item = await prisma.progressItem.create({
                data: {
                    userId,
                    title: 'Test Item',
                    importance: 'high',
                    urgency: 'high',
                    activeDays: ['mon', 'wed', 'fri'],
                    status: 'active',
                },
            });

            await prisma.progressLog.create({
                data: {
                    progressItemId: item.id,
                    loggedAt: new Date('2024-01-15T10:00:00Z'),
                    note: 'Test progress',
                    isOffDay: false,
                },
            });

            const response = await app.request('/api/items/all', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.progressItems[0]).toHaveProperty('lastProgressAt');
            expect(data.data.progressItems[0].lastProgressAt).not.toBeNull();
        });

        it('should show null for lastProgressAt when no logs exist', async () => {
            await prisma.progressItem.create({
                data: {
                    userId,
                    title: 'Test Item',
                    importance: 'high',
                    urgency: 'high',
                    activeDays: ['mon', 'wed', 'fri'],
                    status: 'active',
                },
            });

            const response = await app.request('/api/items/all', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.progressItems[0]).toHaveProperty('lastProgressAt');
            expect(data.data.progressItems[0].lastProgressAt).toBeNull();
        });

        it('should only show active status items', async () => {
            // Create active and settled items
            await prisma.progressItem.create({
                data: {
                    userId,
                    title: 'Active Item',
                    importance: 'high',
                    urgency: 'high',
                    activeDays: ['mon', 'wed', 'fri'],
                    status: 'active',
                },
            });

            await prisma.progressItem.create({
                data: {
                    userId,
                    title: 'Settled Item',
                    importance: 'low',
                    urgency: 'low',
                    activeDays: ['mon', 'wed', 'fri'],
                    status: 'settled',
                },
            });

            const response = await app.request('/api/items/all', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.progressItems.length).toBe(1);
            expect(data.data.progressItems[0].status).toBe('active');
        });

        it('should require authentication', async () => {
            const response = await app.request('/api/items/all');

            expect(response.status).toBe(401);
        });

        it('should only return items for authenticated user', async () => {
            // Create another user
            const otherUser = await prisma.user.create({
                data: {
                    email: 'other@example.com',
                    passwordHash: 'hash',
                },
            });

            // Create items for other user
            await prisma.progressItem.create({
                data: {
                    userId: otherUser.id,
                    title: 'Other User Item',
                    importance: 'high',
                    urgency: 'high',
                    activeDays: ['mon'],
                    status: 'active',
                },
            });

            // Create items for current user
            await prisma.progressItem.create({
                data: {
                    userId,
                    title: 'My Item',
                    importance: 'high',
                    urgency: 'high',
                    activeDays: ['mon'],
                    status: 'active',
                },
            });

            const response = await app.request('/api/items/all', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.progressItems.length).toBe(1);
            expect(data.data.progressItems[0].title).toBe('My Item');
        });
    });
});
