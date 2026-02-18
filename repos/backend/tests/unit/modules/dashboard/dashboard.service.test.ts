import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardService } from '../../../../src/modules/dashboard/dashboard.service';
import { Container } from '../../../../src/shared/container';

describe('DashboardService', () => {
    let dashboardService: DashboardService;
    let mockTimelineEventService: any;
    let mockProgressItemService: any;
    let mockCommitmentService: any;

    const mockDate = new Date('2024-01-15T00:00:00Z'); // Monday

    const mockTimelineEvent = {
        id: 'event-123',
        title: 'Morning Standup',
        startTime: new Date('2024-01-15T09:00:00Z'),
        durationMinutes: 30,
        recurrencePattern: 'daily',
    };

    const mockProgressItem = {
        id: 'item-123',
        title: 'Complete project proposal',
        importance: 'high',
        urgency: 'high',
        activeDays: ['mon', 'wed', 'fri'],
        deadline: null,
        status: 'active',
        logs: [],
    };

    const mockCommitment = {
        id: 'commitment-123',
        title: 'Exercise',
        scheduledDays: ['mon', 'wed', 'fri'],
        logs: [],
    };

    beforeEach(() => {
        mockTimelineEventService = {
            getEventsForDate: vi.fn(),
        };

        mockProgressItemService = {
            getAll: vi.fn(),
        };

        mockCommitmentService = {
            getCommitments: vi.fn(),
        };

        const mockContainer = {
            resolve: vi.fn((name: string) => {
                if (name === 'TimelineEventService') return mockTimelineEventService;
                if (name === 'ProgressItemService') return mockProgressItemService;
                if (name === 'CommitmentService') return mockCommitmentService;
                return null;
            }),
        };

        dashboardService = new DashboardService(mockContainer as unknown as Container);
    });

    describe('getDashboardData', () => {
        it('should aggregate timeline events, progress items, and commitments for a given date', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            mockTimelineEventService.getEventsForDate.mockResolvedValue([mockTimelineEvent]);
            mockProgressItemService.getAll.mockResolvedValue({
                data: [mockProgressItem],
                pagination: { total: 1, perPage: 10, currentPage: 1, lastPage: 1 },
            });
            mockCommitmentService.getCommitments.mockResolvedValue([mockCommitment]);

            const result = await dashboardService.getDashboardData(userId, date);

            expect(result).toHaveProperty('timeline');
            expect(result).toHaveProperty('progressItems');
            expect(result).toHaveProperty('commitments');
            expect(result.timeline.events).toHaveLength(1);
            expect(result.progressItems.important.urgent).toHaveLength(1);
            expect(result.commitments).toHaveLength(1);
        });

        it('should compute endTime from startTime + durationMinutes on timeline events', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            const event = {
                id: 'event-1',
                title: 'Deep Work Session',
                startTime: new Date('2024-01-15T09:00:00Z'),
                durationMinutes: 120,
                description: 'Focusing on architecture',
                recurrencePattern: null,
            };

            mockTimelineEventService.getEventsForDate.mockResolvedValue([event]);
            mockProgressItemService.getAll.mockResolvedValue({
                data: [],
                pagination: { total: 0, perPage: 10, currentPage: 1, lastPage: 1 },
            });
            mockCommitmentService.getCommitments.mockResolvedValue([]);

            const result = await dashboardService.getDashboardData(userId, date);

            expect(result.timeline.events).toHaveLength(1);
            const enrichedEvent = result.timeline.events[0];
            expect(enrichedEvent.endTime).toEqual(new Date('2024-01-15T11:00:00Z'));
            expect(enrichedEvent.durationMinutes).toBe(120);
            expect(enrichedEvent.description).toBe('Focusing on architecture');
        });

        it('should set description to null when event has no description', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            mockTimelineEventService.getEventsForDate.mockResolvedValue([mockTimelineEvent]);
            mockProgressItemService.getAll.mockResolvedValue({
                data: [],
                pagination: { total: 0, perPage: 10, currentPage: 1, lastPage: 1 },
            });
            mockCommitmentService.getCommitments.mockResolvedValue([]);

            const result = await dashboardService.getDashboardData(userId, date);

            expect(result.timeline.events[0].description).toBeNull();
            expect(result.timeline.events[0]).toHaveProperty('endTime');
        });

        it('should filter progress items by activeDays matching current day (Monday)', async () => {
            const userId = 'user-123';
            const date = '2024-01-15'; // Monday

            const itemWithMon = { ...mockProgressItem, id: 'item-1', activeDays: ['mon', 'wed'] };
            const itemWithoutMon = { ...mockProgressItem, id: 'item-2', activeDays: ['tue', 'thu'] };

            mockTimelineEventService.getEventsForDate.mockResolvedValue([]);
            mockProgressItemService.getAll.mockResolvedValue({
                data: [itemWithMon, itemWithoutMon],
                pagination: { total: 2, perPage: 10, currentPage: 1, lastPage: 1 },
            });
            mockCommitmentService.getCommitments.mockResolvedValue([]);

            const result = await dashboardService.getDashboardData(userId, date);

            // Should receive items with 'mon' in activeDays from repository
            expect(mockProgressItemService.getAll).toHaveBeenCalledWith(userId, { activeDay: 'mon' });
        });

        it('should filter commitments by scheduledDays matching current day', async () => {
            const userId = 'user-123';
            const date = '2024-01-15'; // Monday

            const commitmentWithMon = { ...mockCommitment, id: 'commit-1', scheduledDays: ['mon', 'wed'] };
            const commitmentWithoutMon = { ...mockCommitment, id: 'commit-2', scheduledDays: ['tue', 'thu'] };

            mockTimelineEventService.getEventsForDate.mockResolvedValue([]);
            mockProgressItemService.getAll.mockResolvedValue({
                data: [],
                pagination: { total: 0, perPage: 10, currentPage: 1, lastPage: 1 },
            });
            mockCommitmentService.getCommitments.mockResolvedValue([commitmentWithMon, commitmentWithoutMon]);

            const result = await dashboardService.getDashboardData(userId, date);

            // Should only include commitments with 'mon' in scheduledDays
            expect(result.commitments).toHaveLength(1);
            expect(result.commitments[0].id).toBe('commit-1');
        });

        it('should group progress items by Eisenhower Matrix quadrants', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            const item1 = { ...mockProgressItem, id: 'item-1', importance: 'high', urgency: 'high' };
            const item2 = { ...mockProgressItem, id: 'item-2', importance: 'high', urgency: 'low' };
            const item3 = { ...mockProgressItem, id: 'item-3', importance: 'low', urgency: 'high' };
            const item4 = { ...mockProgressItem, id: 'item-4', importance: 'low', urgency: 'low' };

            mockTimelineEventService.getEventsForDate.mockResolvedValue([]);
            mockProgressItemService.getAll.mockResolvedValue({
                data: [item1, item2, item3, item4],
                pagination: { total: 4, perPage: 10, currentPage: 1, lastPage: 1 },
            });
            mockCommitmentService.getCommitments.mockResolvedValue([]);

            const result = await dashboardService.getDashboardData(userId, date);

            expect(result.progressItems.important.urgent).toHaveLength(1);
            expect(result.progressItems.important.urgent[0].id).toBe('item-1');
            expect(result.progressItems.important.notUrgent).toHaveLength(1);
            expect(result.progressItems.important.notUrgent[0].id).toBe('item-2');
            expect(result.progressItems.notImportant.urgent).toHaveLength(1);
            expect(result.progressItems.notImportant.urgent[0].id).toBe('item-3');
            expect(result.progressItems.notImportant.notUrgent).toHaveLength(1);
            expect(result.progressItems.notImportant.notUrgent[0].id).toBe('item-4');
        });

        it('should return empty arrays when no data exists', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            mockTimelineEventService.getEventsForDate.mockResolvedValue([]);
            mockProgressItemService.getAll.mockResolvedValue({
                data: [],
                pagination: { total: 0, perPage: 10, currentPage: 1, lastPage: 1 },
            });
            mockCommitmentService.getCommitments.mockResolvedValue([]);

            const result = await dashboardService.getDashboardData(userId, date);

            expect(result.timeline.events).toEqual([]);
            expect(result.progressItems.important.urgent).toEqual([]);
            expect(result.progressItems.important.notUrgent).toEqual([]);
            expect(result.progressItems.notImportant.urgent).toEqual([]);
            expect(result.progressItems.notImportant.notUrgent).toEqual([]);
            expect(result.commitments).toEqual([]);
        });

        it('should include commitment completion status', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            const commitmentWithLogs = {
                ...mockCommitment,
                id: 'commit-1',
                logs: [
                    { id: 'log-1', completedAt: new Date('2024-01-15T10:00:00Z') },
                    { id: 'log-2', completedAt: new Date('2024-01-15T14:00:00Z') },
                ],
            };

            mockTimelineEventService.getEventsForDate.mockResolvedValue([]);
            mockProgressItemService.getAll.mockResolvedValue({
                data: [],
                pagination: { total: 0, perPage: 10, currentPage: 1, lastPage: 1 },
            });
            mockCommitmentService.getCommitments.mockResolvedValue([commitmentWithLogs]);

            const result = await dashboardService.getDashboardData(userId, date);

            expect(result.commitments).toHaveLength(1);
            expect(result.commitments[0].completedToday).toBe(true);
            expect(result.commitments[0].completionCount).toBe(2);
        });

        it('should show commitment as not completed when no logs for today', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            const commitmentWithOldLogs = {
                ...mockCommitment,
                id: 'commit-1',
                logs: [
                    { id: 'log-1', completedAt: new Date('2024-01-14T10:00:00Z') }, // Yesterday
                ],
            };

            mockTimelineEventService.getEventsForDate.mockResolvedValue([]);
            mockProgressItemService.getAll.mockResolvedValue({
                data: [],
                pagination: { total: 0, perPage: 10, currentPage: 1, lastPage: 1 },
            });
            mockCommitmentService.getCommitments.mockResolvedValue([commitmentWithOldLogs]);

            const result = await dashboardService.getDashboardData(userId, date);

            expect(result.commitments).toHaveLength(1);
            expect(result.commitments[0].completedToday).toBe(false);
            expect(result.commitments[0].completionCount).toBe(1);
        });

        it('should throw error for invalid date format', async () => {
            const userId = 'user-123';
            const date = 'invalid-date';

            await expect(dashboardService.getDashboardData(userId, date)).rejects.toThrow('Invalid date');
        });

        it('should convert date string to day of week correctly', async () => {
            const userId = 'user-123';

            // Monday
            mockTimelineEventService.getEventsForDate.mockResolvedValue([]);
            mockProgressItemService.getAll.mockResolvedValue({
                data: [],
                pagination: { total: 0, perPage: 10, currentPage: 1, lastPage: 1 },
            });
            mockCommitmentService.getCommitments.mockResolvedValue([]);

            await dashboardService.getDashboardData(userId, '2024-01-15'); // Monday
            expect(mockProgressItemService.getAll).toHaveBeenCalledWith(userId, { activeDay: 'mon' });

            await dashboardService.getDashboardData(userId, '2024-01-16'); // Tuesday
            expect(mockProgressItemService.getAll).toHaveBeenCalledWith(userId, { activeDay: 'tue' });

            await dashboardService.getDashboardData(userId, '2024-01-17'); // Wednesday
            expect(mockProgressItemService.getAll).toHaveBeenCalledWith(userId, { activeDay: 'wed' });
        });

        it('should handle different days of the week correctly', async () => {
            const userId = 'user-123';

            const testCases = [
                { date: '2024-01-14', expectedDay: 'sun' }, // Sunday
                { date: '2024-01-15', expectedDay: 'mon' }, // Monday
                { date: '2024-01-16', expectedDay: 'tue' }, // Tuesday
                { date: '2024-01-17', expectedDay: 'wed' }, // Wednesday
                { date: '2024-01-18', expectedDay: 'thu' }, // Thursday
                { date: '2024-01-19', expectedDay: 'fri' }, // Friday
                { date: '2024-01-20', expectedDay: 'sat' }, // Saturday
            ];

            for (const testCase of testCases) {
                mockTimelineEventService.getEventsForDate.mockResolvedValue([]);
                mockProgressItemService.getAll.mockResolvedValue({
                    data: [],
                    pagination: { total: 0, perPage: 10, currentPage: 1, lastPage: 1 },
                });
                mockCommitmentService.getCommitments.mockResolvedValue([]);

                await dashboardService.getDashboardData(userId, testCase.date);

                expect(mockProgressItemService.getAll).toHaveBeenCalledWith(userId, { activeDay: testCase.expectedDay });
            }
        });

        it('should handle weekend days correctly (Saturday)', async () => {
            const userId = 'user-123';
            const date = '2024-01-20'; // Saturday

            mockTimelineEventService.getEventsForDate.mockResolvedValue([]);
            mockProgressItemService.getAll.mockResolvedValue({
                data: [],
                pagination: { total: 0, perPage: 10, currentPage: 1, lastPage: 1 },
            });
            mockCommitmentService.getCommitments.mockResolvedValue([]);

            await dashboardService.getDashboardData(userId, date);

            expect(mockProgressItemService.getAll).toHaveBeenCalledWith(userId, { activeDay: 'sat' });
        });

        it('should handle weekend days correctly (Sunday)', async () => {
            const userId = 'user-123';
            const date = '2024-01-21'; // Sunday

            mockTimelineEventService.getEventsForDate.mockResolvedValue([]);
            mockProgressItemService.getAll.mockResolvedValue({
                data: [],
                pagination: { total: 0, perPage: 10, currentPage: 1, lastPage: 1 },
            });
            mockCommitmentService.getCommitments.mockResolvedValue([]);

            await dashboardService.getDashboardData(userId, date);

            expect(mockProgressItemService.getAll).toHaveBeenCalledWith(userId, { activeDay: 'sun' });
        });

        it('should propagate errors from dependent services', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            mockTimelineEventService.getEventsForDate.mockRejectedValue(new Error('Database error'));

            await expect(dashboardService.getDashboardData(userId, date)).rejects.toThrow('Database error');
        });
    });
});
