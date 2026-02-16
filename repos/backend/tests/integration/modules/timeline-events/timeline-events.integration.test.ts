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

describe('Timeline Events Integration Tests', () => {
    let app: any;
    let mockPrisma: ReturnType<typeof createMockPrismaClient>;
    let token: string;
    let token2: string; // For second user (authorization tests)

    const mockUser1 = {
        id: 'user-123',
        email: 'user1@example.com',
        passwordHash: 'hash',
        name: 'User One',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockUser2 = {
        id: 'user-456',
        email: 'user2@example.com',
        passwordHash: 'hash',
        name: 'User Two',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockDate = new Date('2024-01-15T00:00:00Z');

    const mockOneTimeEvent = {
        id: 'event-123',
        userId: 'user-123',
        title: 'Doctor Appointment',
        startTime: new Date('2024-01-20T14:00:00Z'),
        durationMinutes: 60,
        recurrencePattern: null,
        daysOfWeek: null,
        status: 'active',
        createdAt: mockDate,
        updatedAt: mockDate,
    };

    const mockDailyEvent = {
        id: 'event-456',
        userId: 'user-123',
        title: 'Morning Exercise',
        startTime: new Date('2024-01-15T06:00:00Z'),
        durationMinutes: 30,
        recurrencePattern: 'daily',
        daysOfWeek: null,
        status: 'active',
        createdAt: mockDate,
        updatedAt: mockDate,
    };

    const mockWeeklyEvent = {
        id: 'event-789',
        userId: 'user-123',
        title: 'Team Retro',
        startTime: new Date('2024-01-15T16:00:00Z'),
        durationMinutes: 90,
        recurrencePattern: 'weekly',
        daysOfWeek: ['mon', 'fri'],
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

        // Progress Items Module (needed for routes.ts)
        container.register('ProgressItemRepository', ProgressItemRepository);
        container.register('ProgressLogRepository', ProgressLogRepository);
        container.register('ProgressItemService', ProgressItemService);

        // Commitment Module (needed for routes.ts)
        container.register('CommitmentRepository', CommitmentRepository);
        container.register('CommitmentLogRepository', CommitmentLogRepository);
        container.register('CommitmentService', CommitmentService);

        // Timeline Events Module
        container.register('TimelineEventRepository', TimelineEventRepository);
        container.register('TimelineEventService', TimelineEventService);

        // Dashboard Module (needed for routes.ts)
        container.register('DashboardService', DashboardService);

        // 4. Create app
        app = createApp();

        // 5. Generate Tokens
        const jwtService = new JwtService();
        token = jwtService.sign({ sub: mockUser1.id, email: mockUser1.email });
        token2 = jwtService.sign({ sub: mockUser2.id, email: mockUser2.email });
    });

    describe('POST /api/timeline-events', () => {
        it('should create a one-time timeline event', async () => {
            mockPrisma.timelineEvent.create.mockResolvedValue(mockOneTimeEvent);

            const res = await app.request('/api/timeline-events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Doctor Appointment',
                    startTime: '2024-01-20T14:00:00Z',
                    durationMinutes: 60,
                })
            });

            expect(res.status).toBe(201);
            const body = await res.json();
            expect(body.data.title).toBe(mockOneTimeEvent.title);
            expect(body.data.recurrencePattern).toBeNull();
            expect(mockPrisma.timelineEvent.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    title: 'Doctor Appointment',
                    userId: mockUser1.id,
                })
            });
        });

        it('should create a daily recurring event', async () => {
            mockPrisma.timelineEvent.create.mockResolvedValue(mockDailyEvent);

            const res = await app.request('/api/timeline-events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Morning Exercise',
                    startTime: '2024-01-15T06:00:00Z',
                    durationMinutes: 30,
                    recurrencePattern: 'daily',
                })
            });

            expect(res.status).toBe(201);
            const body = await res.json();
            expect(body.data.title).toBe(mockDailyEvent.title);
            expect(body.data.recurrencePattern).toBe('daily');
            expect(body.data.daysOfWeek).toBeNull();
        });

        it('should create a weekly recurring event with days of week', async () => {
            mockPrisma.timelineEvent.create.mockResolvedValue(mockWeeklyEvent);

            const res = await app.request('/api/timeline-events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Team Retro',
                    startTime: '2024-01-15T16:00:00Z',
                    durationMinutes: 90,
                    recurrencePattern: 'weekly',
                    daysOfWeek: ['mon', 'fri'],
                })
            });

            expect(res.status).toBe(201);
            const body = await res.json();
            expect(body.data.title).toBe(mockWeeklyEvent.title);
            expect(body.data.recurrencePattern).toBe('weekly');
            expect(body.data.daysOfWeek).toEqual(['mon', 'fri']);
        });

        it('should use default duration of 30 minutes when not specified', async () => {
            const eventWithDefaultDuration = {
                ...mockOneTimeEvent,
                durationMinutes: 30,
            };
            mockPrisma.timelineEvent.create.mockResolvedValue(eventWithDefaultDuration);

            const res = await app.request('/api/timeline-events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Quick Meeting',
                    startTime: '2024-01-20T10:00:00Z',
                })
            });

            expect(res.status).toBe(201);
            const body = await res.json();
            expect(body.data.durationMinutes).toBe(30);
        });

        it('should fail without authentication', async () => {
            const res = await app.request('/api/timeline-events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: 'Unauthorized Event',
                    startTime: '2024-01-20T10:00:00Z',
                })
            });

            expect(res.status).toBe(401);
        });

        it('should fail with validation error when title is missing', async () => {
            const res = await app.request('/api/timeline-events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    startTime: '2024-01-20T10:00:00Z',
                })
            });

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.code).toBe('E001');
        });

        it('should fail with validation error when startTime is missing', async () => {
            const res = await app.request('/api/timeline-events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Event without time',
                })
            });

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.code).toBe('E001');
        });

        it('should fail with validation error for invalid recurrence pattern', async () => {
            const res = await app.request('/api/timeline-events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Invalid Event',
                    startTime: '2024-01-20T10:00:00Z',
                    recurrencePattern: 'invalid-pattern',
                })
            });

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.code).toBe('E001');
            expect(body.message).toContain('Invalid recurrence pattern');
        });

        it('should fail with validation error when daysOfWeek provided without weekly recurrence', async () => {
            const res = await app.request('/api/timeline-events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Invalid Event',
                    startTime: '2024-01-20T10:00:00Z',
                    recurrencePattern: 'daily',
                    daysOfWeek: ['mon'],
                })
            });

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.code).toBe('E001');
            expect(body.message).toContain('daysOfWeek can only be provided with weekly recurrence');
        });

        it('should fail with validation error when weekly recurrence missing daysOfWeek', async () => {
            const res = await app.request('/api/timeline-events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Invalid Event',
                    startTime: '2024-01-20T10:00:00Z',
                    recurrencePattern: 'weekly',
                })
            });

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.code).toBe('E001');
            expect(body.message).toContain('daysOfWeek is required for weekly recurrence');
        });

        it('should fail with validation error for invalid day names in daysOfWeek', async () => {
            const res = await app.request('/api/timeline-events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Invalid Event',
                    startTime: '2024-01-20T10:00:00Z',
                    recurrencePattern: 'weekly',
                    daysOfWeek: ['not-a-day'],
                })
            });

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.code).toBe('E001');
            expect(body.message).toContain('Invalid day names in daysOfWeek');
        });
    });

    describe('GET /api/timeline-events?date=YYYY-MM-DD', () => {
        it('should return events for a specific date', async () => {
            const events = [mockDailyEvent, mockWeeklyEvent];
            mockPrisma.timelineEvent.findMany.mockResolvedValue(events);

            const res = await app.request('/api/timeline-events?date=2024-01-15', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.data).toHaveLength(2);
            expect(mockPrisma.timelineEvent.findMany).toHaveBeenCalledWith({
                where: { userId: mockUser1.id },
                orderBy: { startTime: 'asc' },
            });
        });

        it('should return events sorted by start time', async () => {
            const events = [
                { ...mockDailyEvent, startTime: new Date('2024-01-15T16:00:00Z') },
                { ...mockDailyEvent, id: 'event-2', startTime: new Date('2024-01-15T09:00:00Z') },
                { ...mockDailyEvent, id: 'event-3', startTime: new Date('2024-01-15T11:00:00Z') },
            ];
            mockPrisma.timelineEvent.findMany.mockResolvedValue(events);

            const res = await app.request('/api/timeline-events?date=2024-01-15', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.data[0].startTime).toBe('2024-01-15T09:00:00.000Z');
            expect(body.data[1].startTime).toBe('2024-01-15T11:00:00.000Z');
            expect(body.data[2].startTime).toBe('2024-01-15T16:00:00.000Z');
        });

        it('should return empty array when no events for date', async () => {
            mockPrisma.timelineEvent.findMany.mockResolvedValue([]);

            const res = await app.request('/api/timeline-events?date=2024-12-25', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.data).toEqual([]);
        });

        it('should fail without date parameter', async () => {
            const res = await app.request('/api/timeline-events', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.code).toBe('E001');
        });

        it('should fail with invalid date format', async () => {
            const res = await app.request('/api/timeline-events?date=invalid-date', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.code).toBe('E001');
        });

        it('should fail without authentication', async () => {
            const res = await app.request('/api/timeline-events?date=2024-01-15', {
                method: 'GET',
            });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/timeline-events/:id', () => {
        it('should get a single event by id', async () => {
            mockPrisma.timelineEvent.findUnique.mockResolvedValue(mockOneTimeEvent);

            const res = await app.request(`/api/timeline-events/${mockOneTimeEvent.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.data.id).toBe(mockOneTimeEvent.id);
            expect(body.data.title).toBe(mockOneTimeEvent.title);
        });

        it('should return 404 for non-existent event', async () => {
            mockPrisma.timelineEvent.findUnique.mockResolvedValue(null);

            const res = await app.request('/api/timeline-events/non-existent', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(404);
        });

        it('should return 404 when trying to access another users event', async () => {
            const otherUsersEvent = { ...mockOneTimeEvent, userId: 'user-999' };
            mockPrisma.timelineEvent.findUnique.mockResolvedValue(otherUsersEvent);

            const res = await app.request(`/api/timeline-events/${otherUsersEvent.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(404);
        });

        it('should fail without authentication', async () => {
            const res = await app.request(`/api/timeline-events/${mockOneTimeEvent.id}`, {
                method: 'GET',
            });

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/timeline-events/:id', () => {
        it('should update an event', async () => {
            const updatedEvent = { ...mockOneTimeEvent, title: 'Updated Appointment' };
            mockPrisma.timelineEvent.findUnique.mockResolvedValue(mockOneTimeEvent);
            mockPrisma.timelineEvent.update.mockResolvedValue(updatedEvent);

            const res = await app.request(`/api/timeline-events/${mockOneTimeEvent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Updated Appointment',
                })
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.data.title).toBe('Updated Appointment');
        });

        it('should update event duration', async () => {
            const updatedEvent = { ...mockOneTimeEvent, durationMinutes: 90 };
            mockPrisma.timelineEvent.findUnique.mockResolvedValue(mockOneTimeEvent);
            mockPrisma.timelineEvent.update.mockResolvedValue(updatedEvent);

            const res = await app.request(`/api/timeline-events/${mockOneTimeEvent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    durationMinutes: 90,
                })
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.data.durationMinutes).toBe(90);
        });

        it('should return 404 for non-existent event', async () => {
            mockPrisma.timelineEvent.findUnique.mockResolvedValue(null);

            const res = await app.request('/api/timeline-events/non-existent', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Updated',
                })
            });

            expect(res.status).toBe(404);
        });

        it('should return 404 when trying to update another users event', async () => {
            const otherUsersEvent = { ...mockOneTimeEvent, userId: 'user-999' };
            mockPrisma.timelineEvent.findUnique.mockResolvedValue(otherUsersEvent);

            const res = await app.request(`/api/timeline-events/${otherUsersEvent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Hacked',
                })
            });

            expect(res.status).toBe(404);
        });

        it('should fail with validation error for invalid recurrence pattern on update', async () => {
            mockPrisma.timelineEvent.findUnique.mockResolvedValue(mockOneTimeEvent);

            const res = await app.request(`/api/timeline-events/${mockOneTimeEvent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    recurrencePattern: 'invalid-pattern',
                })
            });

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.code).toBe('E001');
        });

        it('should fail without authentication', async () => {
            const res = await app.request(`/api/timeline-events/${mockOneTimeEvent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: 'Unauthorized Update',
                })
            });

            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /api/timeline-events/:id', () => {
        it('should delete an event', async () => {
            mockPrisma.timelineEvent.findUnique.mockResolvedValue(mockOneTimeEvent);
            mockPrisma.timelineEvent.delete.mockResolvedValue({ id: mockOneTimeEvent.id });

            const res = await app.request(`/api/timeline-events/${mockOneTimeEvent.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.data.id).toBe(mockOneTimeEvent.id);
        });

        it('should return 404 for non-existent event', async () => {
            mockPrisma.timelineEvent.findUnique.mockResolvedValue(null);

            const res = await app.request('/api/timeline-events/non-existent', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(404);
        });

        it('should return 404 when trying to delete another users event', async () => {
            const otherUsersEvent = { ...mockOneTimeEvent, userId: 'user-999' };
            mockPrisma.timelineEvent.findUnique.mockResolvedValue(otherUsersEvent);

            const res = await app.request(`/api/timeline-events/${otherUsersEvent.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(404);
        });

        it('should fail without authentication', async () => {
            const res = await app.request(`/api/timeline-events/${mockOneTimeEvent.id}`, {
                method: 'DELETE',
            });

            expect(res.status).toBe(401);
        });
    });

    describe('Authorization - User Isolation', () => {
        it('should not allow user1 to access user2s events', async () => {
            const user2Event = { ...mockOneTimeEvent, userId: mockUser2.id };
            mockPrisma.timelineEvent.findMany.mockResolvedValue([user2Event]);

            // User 1 tries to get User 2's events
            const res = await app.request('/api/timeline-events?date=2024-01-15', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}` // User 1's token
                }
            });

            // The query should filter by user 1's ID, so user 2's events won't be returned
            expect(res.status).toBe(200);
            const body = await res.json();
            // The repository filters by userId, so user2's events won't be in the result
            expect(mockPrisma.timelineEvent.findMany).toHaveBeenCalledWith({
                where: { userId: mockUser1.id },
                orderBy: { startTime: 'asc' },
            });
        });

        it('should isolate events by user on create', async () => {
            const newUserEvent = { ...mockOneTimeEvent, userId: mockUser2.id };
            mockPrisma.timelineEvent.create.mockResolvedValue(newUserEvent);

            // User 2 creates an event
            const res = await app.request('/api/timeline-events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token2}` // User 2's token
                },
                body: JSON.stringify({
                    title: 'User 2 Event',
                    startTime: '2024-01-20T14:00:00Z',
                })
            });

            expect(res.status).toBe(201);
            expect(mockPrisma.timelineEvent.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: mockUser2.id,
                })
            });
        });
    });
});
