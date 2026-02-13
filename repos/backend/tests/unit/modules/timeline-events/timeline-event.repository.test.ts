import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimelineEventRepository } from '../../../../src/modules/timeline-events/repositories/timeline-event.repository';
import { createMockPrismaClient, MockPrismaClient } from '../../../setup/mocks/database.mock';
import { Container } from '../../../../src/shared/container';

interface MockContainer {
    resolve: (name: string) => { client: MockPrismaClient } | null;
}

describe('TimelineEventRepository', () => {
    let mockPrisma: MockPrismaClient;
    let repository: TimelineEventRepository;

    const mockDate = new Date('2024-01-15T00:00:00Z');

    const mockTimelineEvent: any = {
        id: 'event-123',
        userId: 'user-123',
        title: 'Daily Standup',
        startTime: new Date('2024-01-15T09:00:00Z'),
        durationMinutes: 30,
        recurrencePattern: 'daily',
        daysOfWeek: null,
        status: 'active',
        createdAt: mockDate,
        updatedAt: mockDate,
    };

    beforeEach(() => {
        mockPrisma = createMockPrismaClient();
        const mockContainer: MockContainer = {
            resolve: vi.fn((name: string) => {
                if (name === 'DatabaseService') {
                    return { client: mockPrisma };
                }
                return null;
            }),
        };
        repository = new TimelineEventRepository(mockContainer as unknown as Container);
    });

    describe('create', () => {
        it('should create a one-time timeline event without recurrence pattern', async () => {
            const createData = {
                userId: 'user-123',
                title: 'One-time Meeting',
                startTime: new Date('2024-01-20T14:00:00Z'),
                durationMinutes: 60,
            };

            const createdEvent: any = {
                id: 'event-new',
                ...createData,
                recurrencePattern: null,
                daysOfWeek: null,
                status: 'active',
                createdAt: mockDate,
                updatedAt: mockDate,
            };

            mockPrisma.timelineEvent.create.mockResolvedValue(createdEvent);

            const result = await repository.create(createData);

            expect(result).toEqual(createdEvent);
            expect(mockPrisma.timelineEvent.create).toHaveBeenCalledWith({
                data: {
                    userId: createData.userId,
                    title: createData.title,
                    startTime: createData.startTime,
                    durationMinutes: createData.durationMinutes,
                    status: 'active',
                },
            });
        });

        it('should create a timeline event with daily recurrence pattern', async () => {
            const createData = {
                userId: 'user-123',
                title: 'Daily Standup',
                startTime: new Date('2024-01-15T09:00:00Z'),
                durationMinutes: 30,
                recurrencePattern: 'daily',
            };

            const createdEvent: any = {
                id: 'event-new',
                ...createData,
                daysOfWeek: null,
                status: 'active',
                createdAt: mockDate,
                updatedAt: mockDate,
            };

            mockPrisma.timelineEvent.create.mockResolvedValue(createdEvent);

            const result = await repository.create(createData);

            expect(result).toEqual(createdEvent);
            expect(mockPrisma.timelineEvent.create).toHaveBeenCalledWith({
                data: {
                    userId: createData.userId,
                    title: createData.title,
                    startTime: createData.startTime,
                    durationMinutes: createData.durationMinutes,
                    recurrencePattern: createData.recurrencePattern,
                    daysOfWeek: null,
                    status: 'active',
                },
            });
        });

        it('should create a timeline event with weekly recurrence pattern and days of week', async () => {
            const createData = {
                userId: 'user-123',
                title: 'Weekly Review',
                startTime: new Date('2024-01-15T16:00:00Z'),
                durationMinutes: 60,
                recurrencePattern: 'weekly',
                daysOfWeek: ['mon', 'fri'],
            };

            const createdEvent: any = {
                id: 'event-new',
                ...createData,
                status: 'active',
                createdAt: mockDate,
                updatedAt: mockDate,
            };

            mockPrisma.timelineEvent.create.mockResolvedValue(createdEvent);

            const result = await repository.create(createData);

            expect(result).toEqual(createdEvent);
            expect(mockPrisma.timelineEvent.create).toHaveBeenCalledWith({
                data: {
                    userId: createData.userId,
                    title: createData.title,
                    startTime: createData.startTime,
                    durationMinutes: createData.durationMinutes,
                    recurrencePattern: createData.recurrencePattern,
                    daysOfWeek: createData.daysOfWeek,
                    status: 'active',
                },
            });
        });
    });

    describe('findById', () => {
        it('should return event when it exists', async () => {
            mockPrisma.timelineEvent.findUnique.mockResolvedValue(mockTimelineEvent);

            const result = await repository.findById('event-123');

            expect(result).toEqual(mockTimelineEvent);
            expect(mockPrisma.timelineEvent.findUnique).toHaveBeenCalledWith({
                where: { id: 'event-123' },
            });
        });

        it('should return null when event does not exist', async () => {
            mockPrisma.timelineEvent.findUnique.mockResolvedValue(null);

            const result = await repository.findById('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('findByUserId', () => {
        it('should return multiple events for a user', async () => {
            const events = [
                mockTimelineEvent,
                { ...mockTimelineEvent, id: 'event-456', title: 'Weekly Planning' },
            ];

            mockPrisma.timelineEvent.findMany.mockResolvedValue(events);

            const result = await repository.findByUserId('user-123');

            expect(result).toEqual(events);
            expect(mockPrisma.timelineEvent.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-123' },
                orderBy: { startTime: 'asc' },
            });
        });

        it('should return empty array when user has no events', async () => {
            mockPrisma.timelineEvent.findMany.mockResolvedValue([]);

            const result = await repository.findByUserId('user-123');

            expect(result).toEqual([]);
        });
    });

    describe('update', () => {
        it('should update event title', async () => {
            const updatedEvent = { ...mockTimelineEvent, title: 'Updated Standup' };
            mockPrisma.timelineEvent.update.mockResolvedValue(updatedEvent);

            const result = await repository.update('event-123', { title: 'Updated Standup' });

            expect(result).toEqual(updatedEvent);
            expect(mockPrisma.timelineEvent.update).toHaveBeenCalledWith({
                where: { id: 'event-123' },
                data: { title: 'Updated Standup' },
            });
        });

        it('should update event startTime', async () => {
            const newStartTime = new Date('2024-01-20T10:00:00Z');
            const updatedEvent = { ...mockTimelineEvent, startTime: newStartTime };
            mockPrisma.timelineEvent.update.mockResolvedValue(updatedEvent);

            const result = await repository.update('event-123', { startTime: newStartTime });

            expect(result).toEqual(updatedEvent);
            expect(mockPrisma.timelineEvent.update).toHaveBeenCalledWith({
                where: { id: 'event-123' },
                data: { startTime: newStartTime },
            });
        });

        it('should update recurrence pattern from daily to weekly with days', async () => {
            const updateData = {
                recurrencePattern: 'weekly',
                daysOfWeek: ['tue', 'thu'],
            };
            const updatedEvent = {
                ...mockTimelineEvent,
                recurrencePattern: 'weekly',
                daysOfWeek: ['tue', 'thu'],
            };
            mockPrisma.timelineEvent.update.mockResolvedValue(updatedEvent);

            const result = await repository.update('event-123', updateData);

            expect(result).toEqual(updatedEvent);
            expect(mockPrisma.timelineEvent.update).toHaveBeenCalledWith({
                where: { id: 'event-123' },
                data: updateData,
            });
        });

        it('should update duration minutes', async () => {
            const updatedEvent = { ...mockTimelineEvent, durationMinutes: 45 };
            mockPrisma.timelineEvent.update.mockResolvedValue(updatedEvent);

            const result = await repository.update('event-123', { durationMinutes: 45 });

            expect(result).toEqual(updatedEvent);
            expect(mockPrisma.timelineEvent.update).toHaveBeenCalledWith({
                where: { id: 'event-123' },
                data: { durationMinutes: 45 },
            });
        });
    });

    describe('delete', () => {
        it('should delete an event', async () => {
            const deletedEvent = { id: 'event-123' };
            mockPrisma.timelineEvent.delete.mockResolvedValue(deletedEvent);

            const result = await repository.delete('event-123');

            expect(result).toEqual(deletedEvent);
            expect(mockPrisma.timelineEvent.delete).toHaveBeenCalledWith({
                where: { id: 'event-123' },
            });
        });

        it('should throw error when deleting non-existent event', async () => {
            const error = new Error('Record to delete not found.');
            mockPrisma.timelineEvent.delete.mockRejectedValue(error);

            await expect(repository.delete('non-existent')).rejects.toThrow();
        });
    });

    describe('occursOnDate', () => {
        const monday2024_01_15 = new Date('2024-01-15T00:00:00Z'); // Monday
        const tuesday2024_01_16 = new Date('2024-01-16T00:00:00Z'); // Tuesday
        const friday2024_01_19 = new Date('2024-01-19T00:00:00Z'); // Friday

        describe('daily recurrence pattern', () => {
            it('should return true for any date when event has daily recurrence', () => {
                const dailyEvent = {
                    ...mockTimelineEvent,
                    recurrencePattern: 'daily',
                    status: 'active',
                };

                const resultMonday = repository.occursOnDate(dailyEvent, monday2024_01_15);
                const resultTuesday = repository.occursOnDate(dailyEvent, tuesday2024_01_16);
                const resultFriday = repository.occursOnDate(dailyEvent, friday2024_01_19);

                expect(resultMonday).toBe(true);
                expect(resultTuesday).toBe(true);
                expect(resultFriday).toBe(true);
            });

            it('should return false for settled events with daily recurrence', () => {
                const settledDailyEvent = {
                    ...mockTimelineEvent,
                    recurrencePattern: 'daily',
                    status: 'settled',
                };

                const result = repository.occursOnDate(settledDailyEvent, monday2024_01_15);

                expect(result).toBe(false);
            });
        });

        describe('weekly recurrence pattern', () => {
            it('should return true only for matching days of week', () => {
                const weeklyEvent = {
                    ...mockTimelineEvent,
                    recurrencePattern: 'weekly',
                    daysOfWeek: ['mon', 'wed', 'fri'],
                    status: 'active',
                };

                const resultMonday = repository.occursOnDate(weeklyEvent, monday2024_01_15);
                const resultTuesday = repository.occursOnDate(weeklyEvent, tuesday2024_01_16);
                const resultFriday = repository.occursOnDate(weeklyEvent, friday2024_01_19);

                expect(resultMonday).toBe(true);
                expect(resultTuesday).toBe(false);
                expect(resultFriday).toBe(true);
            });

            it('should handle case-insensitive day names', () => {
                const weeklyEvent = {
                    ...mockTimelineEvent,
                    recurrencePattern: 'weekly',
                    daysOfWeek: ['MON', 'FRI'],
                    status: 'active',
                };

                const resultMonday = repository.occursOnDate(weeklyEvent, monday2024_01_15);
                const resultFriday = repository.occursOnDate(weeklyEvent, friday2024_01_19);

                expect(resultMonday).toBe(true);
                expect(resultFriday).toBe(true);
            });

            it('should return false for settled events with weekly recurrence', () => {
                const settledWeeklyEvent = {
                    ...mockTimelineEvent,
                    recurrencePattern: 'weekly',
                    daysOfWeek: ['mon', 'wed', 'fri'],
                    status: 'settled',
                };

                const result = repository.occursOnDate(settledWeeklyEvent, monday2024_01_15);

                expect(result).toBe(false);
            });
        });

        describe('no recurrence (one-time) pattern', () => {
            it('should return true only for exact date match', () => {
                const oneTimeEventDate = new Date('2024-01-15T09:00:00Z');
                const oneTimeEvent = {
                    ...mockTimelineEvent,
                    startTime: oneTimeEventDate,
                    recurrencePattern: null,
                    status: 'active',
                };

                const resultSameDay = repository.occursOnDate(oneTimeEvent, monday2024_01_15);
                const resultDifferentDay = repository.occursOnDate(oneTimeEvent, tuesday2024_01_16);

                expect(resultSameDay).toBe(true);
                expect(resultDifferentDay).toBe(false);
            });

            it('should return false for settled one-time events', () => {
                const oneTimeEventDate = new Date('2024-01-15T09:00:00Z');
                const settledOneTimeEvent = {
                    ...mockTimelineEvent,
                    startTime: oneTimeEventDate,
                    recurrencePattern: null,
                    status: 'settled',
                };

                const result = repository.occursOnDate(settledOneTimeEvent, monday2024_01_15);

                expect(result).toBe(false);
            });
        });

        describe('date boundaries and timezone handling', () => {
            it('should handle date at midnight boundary', () => {
                const dailyEvent = {
                    ...mockTimelineEvent,
                    recurrencePattern: 'daily',
                    status: 'active',
                };

                const midnightDate = new Date('2024-01-15T00:00:00Z');
                const result = repository.occursOnDate(dailyEvent, midnightDate);

                expect(result).toBe(true);
            });

            it('should handle dates with different timezones', () => {
                const oneTimeEvent = {
                    ...mockTimelineEvent,
                    startTime: new Date('2024-01-15T09:00:00Z'),
                    recurrencePattern: null,
                    status: 'active',
                };

                const sameDateDifferentTimezone = new Date('2024-01-15T23:59:59Z');
                const result = repository.occursOnDate(oneTimeEvent, sameDateDifferentTimezone);

                expect(result).toBe(true);
            });
        });

        describe('empty or invalid states', () => {
            it('should return false when daysOfWeek is null for weekly pattern', () => {
                const weeklyEventNoDays = {
                    ...mockTimelineEvent,
                    recurrencePattern: 'weekly',
                    daysOfWeek: null,
                    status: 'active',
                };

                const result = repository.occursOnDate(weeklyEventNoDays, monday2024_01_15);

                expect(result).toBe(false);
            });

            it('should return false when daysOfWeek is empty array for weekly pattern', () => {
                const weeklyEventEmptyDays = {
                    ...mockTimelineEvent,
                    recurrencePattern: 'weekly',
                    daysOfWeek: [],
                    status: 'active',
                };

                const result = repository.occursOnDate(weeklyEventEmptyDays, monday2024_01_15);

                expect(result).toBe(false);
            });

            it('should handle Sunday correctly', () => {
                const sunday2024_01_14 = new Date('2024-01-14T00:00:00Z');
                const weeklyEvent = {
                    ...mockTimelineEvent,
                    recurrencePattern: 'weekly',
                    daysOfWeek: ['sun'],
                    status: 'active',
                };

                const result = repository.occursOnDate(weeklyEvent, sunday2024_01_14);

                expect(result).toBe(true);
            });

            it('should handle Saturday correctly', () => {
                const saturday2024_01_20 = new Date('2024-01-20T00:00:00Z');
                const weeklyEvent = {
                    ...mockTimelineEvent,
                    recurrencePattern: 'weekly',
                    daysOfWeek: ['sat'],
                    status: 'active',
                };

                const result = repository.occursOnDate(weeklyEvent, saturday2024_01_20);

                expect(result).toBe(true);
            });
        });
    });
});
