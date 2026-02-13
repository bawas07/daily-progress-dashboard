import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimelineEventService } from '../../../../src/modules/timeline-events/services/timeline-event.service';
import { Container } from '../../../../src/shared/container';

describe('TimelineEventService', () => {
    let service: TimelineEventService;
    let mockTimelineEventRepository: any;

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
        mockTimelineEventRepository = {
            create: vi.fn(),
            findByUserId: vi.fn(),
            findById: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            occursOnDate: vi.fn(),
        };

        const mockContainer = {
            resolve: vi.fn((name: string) => {
                if (name === 'TimelineEventRepository') return mockTimelineEventRepository;
                return null;
            }),
        };

        service = new TimelineEventService(mockContainer as unknown as Container);
    });

    describe('create', () => {
        it('should create a one-time event with valid data', async () => {
            const userId = 'user-123';
            const input = {
                title: 'Doctor Appointment',
                startTime: '2024-01-20T14:00:00Z',
                durationMinutes: 60,
            };

            const expectedOutput = {
                id: 'event-new',
                userId,
                title: input.title,
                startTime: new Date(input.startTime),
                durationMinutes: input.durationMinutes,
                recurrencePattern: null,
                daysOfWeek: null,
                status: 'active',
                createdAt: mockDate,
                updatedAt: mockDate,
            };

            mockTimelineEventRepository.create.mockResolvedValue(expectedOutput);

            const result = await service.create(userId, input);

            expect(mockTimelineEventRepository.create).toHaveBeenCalledWith({
                userId,
                title: input.title,
                startTime: new Date(input.startTime),
                durationMinutes: input.durationMinutes,
            });
            expect(result).toEqual(expectedOutput);
        });

        it('should create a daily recurring event with valid data', async () => {
            const userId = 'user-123';
            const input = {
                title: 'Morning Exercise',
                startTime: '2024-01-15T06:00:00Z',
                durationMinutes: 45,
                recurrencePattern: 'daily',
            };

            const expectedOutput = {
                id: 'event-new',
                userId,
                title: input.title,
                startTime: new Date(input.startTime),
                durationMinutes: input.durationMinutes,
                recurrencePattern: 'daily',
                daysOfWeek: null,
                status: 'active',
                createdAt: mockDate,
                updatedAt: mockDate,
            };

            mockTimelineEventRepository.create.mockResolvedValue(expectedOutput);

            const result = await service.create(userId, input);

            expect(mockTimelineEventRepository.create).toHaveBeenCalledWith({
                userId,
                title: input.title,
                startTime: new Date(input.startTime),
                durationMinutes: input.durationMinutes,
                recurrencePattern: 'daily',
            });
            expect(result).toEqual(expectedOutput);
        });

        it('should create a weekly recurring event with valid days of week', async () => {
            const userId = 'user-123';
            const input = {
                title: 'Team Retro',
                startTime: '2024-01-15T16:00:00Z',
                durationMinutes: 90,
                recurrencePattern: 'weekly',
                daysOfWeek: ['mon', 'fri'],
            };

            const expectedOutput = {
                id: 'event-new',
                userId,
                title: input.title,
                startTime: new Date(input.startTime),
                durationMinutes: input.durationMinutes,
                recurrencePattern: 'weekly',
                daysOfWeek: ['mon', 'fri'],
                status: 'active',
                createdAt: mockDate,
                updatedAt: mockDate,
            };

            mockTimelineEventRepository.create.mockResolvedValue(expectedOutput);

            const result = await service.create(userId, input);

            expect(mockTimelineEventRepository.create).toHaveBeenCalledWith({
                userId,
                title: input.title,
                startTime: new Date(input.startTime),
                durationMinutes: input.durationMinutes,
                recurrencePattern: 'weekly',
                daysOfWeek: ['mon', 'fri'],
            });
            expect(result).toEqual(expectedOutput);
        });

        describe('validation errors', () => {
            it('should throw error for invalid recurrence pattern', async () => {
                const userId = 'user-123';
                const input = {
                    title: 'Invalid Event',
                    startTime: '2024-01-15T10:00:00Z',
                    durationMinutes: 30,
                    recurrencePattern: 'invalid-pattern',
                };

                await expect(service.create(userId, input as any)).rejects.toThrow('Invalid recurrence pattern');
            });

            it('should throw error when daysOfWeek is provided without weekly recurrence', async () => {
                const userId = 'user-123';
                const input = {
                    title: 'Invalid Event',
                    startTime: '2024-01-15T10:00:00Z',
                    durationMinutes: 30,
                    recurrencePattern: 'daily',
                    daysOfWeek: ['mon'],
                };

                await expect(service.create(userId, input as any)).rejects.toThrow('daysOfWeek can only be provided with weekly recurrence');
            });

            it('should throw error when weekly recurrence is missing daysOfWeek', async () => {
                const userId = 'user-123';
                const input = {
                    title: 'Invalid Event',
                    startTime: '2024-01-15T10:00:00Z',
                    durationMinutes: 30,
                    recurrencePattern: 'weekly',
                };

                await expect(service.create(userId, input as any)).rejects.toThrow('daysOfWeek is required for weekly recurrence');
            });

            it('should throw error for invalid daysOfWeek values', async () => {
                const userId = 'user-123';
                const input = {
                    title: 'Invalid Event',
                    startTime: '2024-01-15T10:00:00Z',
                    durationMinutes: 30,
                    recurrencePattern: 'weekly',
                    daysOfWeek: ['not-a-day'],
                };

                await expect(service.create(userId, input as any)).rejects.toThrow('Invalid day names in daysOfWeek');
            });

            it('should throw error for empty daysOfWeek array', async () => {
                const userId = 'user-123';
                const input = {
                    title: 'Invalid Event',
                    startTime: '2024-01-15T10:00:00Z',
                    durationMinutes: 30,
                    recurrencePattern: 'weekly',
                    daysOfWeek: [],
                };

                await expect(service.create(userId, input as any)).rejects.toThrow('daysOfWeek must contain at least one day');
            });

            it('should throw error for invalid title (too short)', async () => {
                const userId = 'user-123';
                const input = {
                    title: '',
                    startTime: '2024-01-15T10:00:00Z',
                    durationMinutes: 30,
                };

                await expect(service.create(userId, input)).rejects.toThrow('Title is required');
            });

            it('should throw error for invalid duration (negative)', async () => {
                const userId = 'user-123';
                const input = {
                    title: 'Invalid Event',
                    startTime: '2024-01-15T10:00:00Z',
                    durationMinutes: -10,
                };

                await expect(service.create(userId, input)).rejects.toThrow('Duration must be positive');
            });

            it('should throw error for invalid date format', async () => {
                const userId = 'user-123';
                const input = {
                    title: 'Invalid Event',
                    startTime: 'not-a-date',
                    durationMinutes: 30,
                };

                await expect(service.create(userId, input as any)).rejects.toThrow('Invalid start time');
            });
        });
    });

    describe('getEventsForDate', () => {
        it('should return events occurring on the specified date, sorted by start time', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';
            const targetDate = new Date(date);

            const events = [
                { ...mockTimelineEvent, id: 'event-1', startTime: new Date('2024-01-15T16:00:00Z') },
                { ...mockTimelineEvent, id: 'event-2', startTime: new Date('2024-01-15T09:00:00Z') },
                { ...mockTimelineEvent, id: 'event-3', startTime: new Date('2024-01-15T11:00:00Z') },
            ];

            mockTimelineEventRepository.findByUserId.mockResolvedValue(events);

            mockTimelineEventRepository.occursOnDate
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(true);

            const result = await service.getEventsForDate(userId, date);

            expect(mockTimelineEventRepository.findByUserId).toHaveBeenCalledWith(userId);
            expect(mockTimelineEventRepository.occursOnDate).toHaveBeenCalledTimes(3);
            expect(result).toEqual([
                events[1], // 09:00
                events[2], // 11:00
                events[0], // 16:00
            ]);
        });

        it('should filter events by those occurring on the date', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';
            const targetDate = new Date(date);

            const events = [
                { ...mockTimelineEvent, id: 'event-1', startTime: new Date('2024-01-15T09:00:00Z') },
                { ...mockTimelineEvent, id: 'event-2', startTime: new Date('2024-01-20T14:00:00Z') }, // Different day
                { ...mockTimelineEvent, id: 'event-3', startTime: new Date('2024-01-15T11:00:00Z') },
            ];

            mockTimelineEventRepository.findByUserId.mockResolvedValue(events);

            mockTimelineEventRepository.occursOnDate
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true);

            const result = await service.getEventsForDate(userId, date);

            expect(result).toEqual([
                events[0],
                events[2],
            ]);
        });

        it('should return empty array when no events occur on the date', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            mockTimelineEventRepository.findByUserId.mockResolvedValue([
                { ...mockTimelineEvent, id: 'event-1' },
            ]);

            mockTimelineEventRepository.occursOnDate.mockReturnValue(false);

            const result = await service.getEventsForDate(userId, date);

            expect(result).toEqual([]);
        });

        it('should return empty array when user has no events', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            mockTimelineEventRepository.findByUserId.mockResolvedValue([]);

            const result = await service.getEventsForDate(userId, date);

            expect(result).toEqual([]);
            expect(mockTimelineEventRepository.occursOnDate).not.toHaveBeenCalled();
        });

        it('should call occursOnDate with correct date from repository', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            const events = [{ ...mockTimelineEvent }];
            mockTimelineEventRepository.findByUserId.mockResolvedValue(events);
            mockTimelineEventRepository.occursOnDate.mockReturnValue(true);

            await service.getEventsForDate(userId, date);

            const targetDate = new Date(date);
            expect(mockTimelineEventRepository.occursOnDate).toHaveBeenCalledWith(events[0], targetDate);
        });
    });

    describe('update', () => {
        it('should update event with valid changes', async () => {
            const userId = 'user-123';
            const eventId = 'event-123';
            const input = {
                title: 'Updated Standup',
                durationMinutes: 45,
            };

            const existingEvent = { ...mockTimelineEvent, userId };
            const updatedEvent = { ...existingEvent, ...input };

            mockTimelineEventRepository.findById.mockResolvedValue(existingEvent);
            mockTimelineEventRepository.update.mockResolvedValue(updatedEvent);

            const result = await service.update(userId, eventId, input);

            expect(mockTimelineEventRepository.findById).toHaveBeenCalledWith(eventId);
            expect(mockTimelineEventRepository.update).toHaveBeenCalledWith(eventId, input);
            expect(result).toEqual(updatedEvent);
        });

        describe('validation errors', () => {
            it('should throw error for invalid recurrence pattern', async () => {
                const userId = 'user-123';
                const eventId = 'event-123';
                const input = {
                    recurrencePattern: 'invalid-pattern',
                };

                const existingEvent = { ...mockTimelineEvent, userId };
                mockTimelineEventRepository.findById.mockResolvedValue(existingEvent);

                await expect(service.update(userId, eventId, input as any)).rejects.toThrow('Invalid recurrence pattern');
            });

            it('should throw error when daysOfWeek is provided without weekly recurrence', async () => {
                const userId = 'user-123';
                const eventId = 'event-123';
                const input = {
                    recurrencePattern: 'daily',
                    daysOfWeek: ['mon'],
                };

                const existingEvent = { ...mockTimelineEvent, userId };
                mockTimelineEventRepository.findById.mockResolvedValue(existingEvent);

                await expect(service.update(userId, eventId, input as any)).rejects.toThrow('daysOfWeek can only be provided with weekly recurrence');
            });

            it('should throw error when weekly recurrence is missing daysOfWeek', async () => {
                const userId = 'user-123';
                const eventId = 'event-123';
                const input = {
                    recurrencePattern: 'weekly',
                };

                const existingEvent = { ...mockTimelineEvent, userId };
                mockTimelineEventRepository.findById.mockResolvedValue(existingEvent);

                await expect(service.update(userId, eventId, input as any)).rejects.toThrow('daysOfWeek is required for weekly recurrence');
            });

            it('should throw error for invalid daysOfWeek values', async () => {
                const userId = 'user-123';
                const eventId = 'event-123';
                const input = {
                    recurrencePattern: 'weekly',
                    daysOfWeek: ['not-a-day'],
                };

                const existingEvent = { ...mockTimelineEvent, userId };
                mockTimelineEventRepository.findById.mockResolvedValue(existingEvent);

                await expect(service.update(userId, eventId, input as any)).rejects.toThrow('Invalid day names in daysOfWeek');
            });

            it('should throw error for invalid duration (negative)', async () => {
                const userId = 'user-123';
                const eventId = 'event-123';
                const input = {
                    durationMinutes: -10,
                };

                const existingEvent = { ...mockTimelineEvent, userId };
                mockTimelineEventRepository.findById.mockResolvedValue(existingEvent);

                await expect(service.update(userId, eventId, input)).rejects.toThrow('Duration must be positive');
            });
        });

        describe('authorization errors', () => {
            it('should throw error when event does not exist', async () => {
                const userId = 'user-123';
                const eventId = 'non-existent';
                const input = { title: 'Updated' };

                mockTimelineEventRepository.findById.mockResolvedValue(null);

                await expect(service.update(userId, eventId, input)).rejects.toThrow('Timeline event not found');
            });

            it('should throw error when event belongs to different user', async () => {
                const userId = 'user-123';
                const eventId = 'event-456';
                const input = { title: 'Updated' };

                const otherUsersEvent = { ...mockTimelineEvent, userId: 'other-user' };
                mockTimelineEventRepository.findById.mockResolvedValue(otherUsersEvent);

                await expect(service.update(userId, eventId, input)).rejects.toThrow('Timeline event not found');
            });
        });
    });

    describe('delete', () => {
        it('should delete event successfully', async () => {
            const userId = 'user-123';
            const eventId = 'event-123';

            const existingEvent = { ...mockTimelineEvent, userId };
            mockTimelineEventRepository.findById.mockResolvedValue(existingEvent);
            mockTimelineEventRepository.delete.mockResolvedValue({ id: eventId });

            await service.delete(userId, eventId);

            expect(mockTimelineEventRepository.findById).toHaveBeenCalledWith(eventId);
            expect(mockTimelineEventRepository.delete).toHaveBeenCalledWith(eventId);
        });

        it('should throw error when event does not exist', async () => {
            const userId = 'user-123';
            const eventId = 'non-existent';

            mockTimelineEventRepository.findById.mockResolvedValue(null);

            await expect(service.delete(userId, eventId)).rejects.toThrow('Timeline event not found');
        });

        it('should throw error when event belongs to different user', async () => {
            const userId = 'user-123';
            const eventId = 'event-456';

            const otherUsersEvent = { ...mockTimelineEvent, userId: 'other-user' };
            mockTimelineEventRepository.findById.mockResolvedValue(otherUsersEvent);

            await expect(service.delete(userId, eventId)).rejects.toThrow('Timeline event not found');
        });
    });

    describe('occursOnDate logic', () => {
        it('should delegate to repository occursOnDate method', async () => {
            const event = { ...mockTimelineEvent };
            const date = new Date('2024-01-15');

            mockTimelineEventRepository.occursOnDate.mockReturnValue(true);

            const result = service.occursOnDate(event, date);

            expect(mockTimelineEventRepository.occursOnDate).toHaveBeenCalledWith(event, date);
            expect(result).toBe(true);
        });
    });
});
