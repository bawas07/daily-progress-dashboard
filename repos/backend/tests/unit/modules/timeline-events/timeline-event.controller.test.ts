import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimelineEventController } from '../../../../src/modules/timeline-events/timeline-event.controller';
import { TimelineEventService } from '../../../../src/modules/timeline-events/services/timeline-event.service';
import type { Context } from 'hono';

function createMockContext(body: any = null, param: any = null, query: any = null) {
    let status = 200;
    return {
        req: {
            json: async () => body || {},
            param: (key: string) => param ? param[key] : undefined,
            query: () => query || {},
        },
        get: vi.fn().mockReturnValue('user-123'),
        json: vi.fn().mockImplementation((data, statusCode) => {
            status = statusCode || 200;
            return { data, status };
        }),
        status: (s: number) => { status = s; return { json: vi.fn() } },
    } as unknown as Context;
}

describe('TimelineEventController', () => {
    let controller: TimelineEventController;
    let mockTimelineEventService: any;

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
        mockTimelineEventService = {
            create: vi.fn(),
            getEventsForDate: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        };
        controller = new TimelineEventController(mockTimelineEventService as unknown as TimelineEventService);
    });

    describe('getEvents', () => {
        it('should return events for the specified date', async () => {
            const date = '2024-01-15';
            const events = [
                mockTimelineEvent,
                { ...mockTimelineEvent, id: 'event-456', startTime: new Date('2024-01-15T16:00:00Z') },
            ];

            mockTimelineEventService.getEventsForDate.mockResolvedValue(events);

            const ctx = createMockContext(null, null, { date });
            await controller.getEvents()(ctx);

            expect(mockTimelineEventService.getEventsForDate).toHaveBeenCalledWith('user-123', date);
            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'S001',
                    data: events,
                })
            );
        });

        it('should return empty array when no events for date', async () => {
            const date = '2024-01-15';

            mockTimelineEventService.getEventsForDate.mockResolvedValue([]);

            const ctx = createMockContext(null, null, { date });
            await controller.getEvents()(ctx);

            expect(mockTimelineEventService.getEventsForDate).toHaveBeenCalledWith('user-123', date);
            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'S001',
                    data: [],
                })
            );
        });

        it('should handle date parsing errors', async () => {
            const invalidDate = 'not-a-valid-date';

            const ctx = createMockContext(null, null, { date: invalidDate });

            await controller.getEvents()(ctx);

            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'E001',
                    message: expect.stringContaining('Invalid date'),
                }),
                400
            );
        });

        it('should require authentication', async () => {
            const ctx = createMockContext(null, null, { date: '2024-01-15' });
            ctx.get = vi.fn().mockReturnValue(null);

            await controller.getEvents()(ctx);

            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'E002',
                }),
                401
            );
        });
    });

    describe('getById', () => {
        it('should return event when found and belongs to user', async () => {
            const eventId = 'event-123';

            mockTimelineEventService.getById = vi.fn().mockResolvedValue(mockTimelineEvent);

            const ctx = createMockContext(null, { id: eventId });
            await controller.getById()(ctx);

            expect(mockTimelineEventService.getById).toHaveBeenCalledWith('user-123', eventId);
            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'S001',
                    data: mockTimelineEvent,
                })
            );
        });

        it('should return not found when event does not exist', async () => {
            const eventId = 'non-existent';

            mockTimelineEventService.getById = vi.fn().mockResolvedValue(null);

            const ctx = createMockContext(null, { id: eventId });
            await controller.getById()(ctx);

            expect(mockTimelineEventService.getById).toHaveBeenCalledWith('user-123', eventId);
            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'E003',
                }),
                404
            );
        });

        it('should return not found when event belongs to different user', async () => {
            const eventId = 'event-456';

            mockTimelineEventService.getById = vi.fn().mockResolvedValue(null);

            const ctx = createMockContext(null, { id: eventId });
            await controller.getById()(ctx);

            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'E003',
                }),
                404
            );
        });
    });

    describe('create', () => {
        it('should create a one-time event with valid data', async () => {
            const input = {
                title: 'Doctor Appointment',
                startTime: '2024-01-20T14:00:00Z',
                durationMinutes: 60,
            };

            mockTimelineEventService.create.mockResolvedValue({ ...mockTimelineEvent, ...input });

            const ctx = createMockContext(input);
            await controller.create()(ctx);

            expect(mockTimelineEventService.create).toHaveBeenCalledWith('user-123', input);
            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'S002',
                    data: expect.objectContaining(input),
                }),
                201
            );
        });

        it('should create a daily recurring event with valid data', async () => {
            const input = {
                title: 'Morning Exercise',
                startTime: '2024-01-15T06:00:00Z',
                durationMinutes: 45,
                recurrencePattern: 'daily',
            };

            mockTimelineEventService.create.mockResolvedValue({ ...mockTimelineEvent, ...input });

            const ctx = createMockContext(input);
            await controller.create()(ctx);

            expect(mockTimelineEventService.create).toHaveBeenCalledWith('user-123', input);
            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'S002',
                }),
                201
            );
        });

        it('should create a weekly recurring event with valid days of week', async () => {
            const input = {
                title: 'Team Retro',
                startTime: '2024-01-15T16:00:00Z',
                durationMinutes: 90,
                recurrencePattern: 'weekly',
                daysOfWeek: ['mon', 'fri'],
            };

            mockTimelineEventService.create.mockResolvedValue({ ...mockTimelineEvent, ...input });

            const ctx = createMockContext(input);
            await controller.create()(ctx);

            expect(mockTimelineEventService.create).toHaveBeenCalledWith('user-123', input);
            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'S002',
                }),
                201
            );
        });

        describe('validation errors', () => {
            it('should return validation error for missing title', async () => {
                const input = {
                    startTime: '2024-01-20T14:00:00Z',
                    durationMinutes: 60,
                };

                const ctx = createMockContext(input);
                await controller.create()(ctx);

                expect(ctx.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        code: 'E001',
                        data: expect.objectContaining({
                            details: expect.any(Object),
                        }),
                    }),
                    400
                );
            });

            it('should return validation error for invalid title type', async () => {
                const input = {
                    title: 123,
                    startTime: '2024-01-20T14:00:00Z',
                    durationMinutes: 60,
                };

                const ctx = createMockContext(input);
                await controller.create()(ctx);

                expect(ctx.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        code: 'E001',
                    }),
                    400
                );
            });

            it('should return validation error for invalid recurrence pattern', async () => {
                const input = {
                    title: 'Invalid Event',
                    startTime: '2024-01-15T10:00:00Z',
                    durationMinutes: 30,
                    recurrencePattern: 'invalid-pattern',
                };

                mockTimelineEventService.create.mockRejectedValue(new Error('Invalid recurrence pattern'));

                const ctx = createMockContext(input);
                await controller.create()(ctx);

                expect(ctx.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        code: 'E001',
                    }),
                    400
                );
            });

            it('should return validation error for invalid days of week', async () => {
                const input = {
                    title: 'Invalid Event',
                    startTime: '2024-01-15T10:00:00Z',
                    durationMinutes: 30,
                    recurrencePattern: 'weekly',
                    daysOfWeek: ['not-a-day'],
                };

                mockTimelineEventService.create.mockRejectedValue(new Error('Invalid day names in daysOfWeek'));

                const ctx = createMockContext(input);
                await controller.create()(ctx);

                expect(ctx.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        code: 'E001',
                    }),
                    400
                );
            });

            it('should return validation error for empty days of week', async () => {
                const input = {
                    title: 'Invalid Event',
                    startTime: '2024-01-15T10:00:00Z',
                    durationMinutes: 30,
                    recurrencePattern: 'weekly',
                    daysOfWeek: [],
                };

                mockTimelineEventService.create.mockRejectedValue(new Error('daysOfWeek must contain at least one day'));

                const ctx = createMockContext(input);
                await controller.create()(ctx);

                expect(ctx.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        code: 'E001',
                    }),
                    400
                );
            });

            it('should return validation error for negative duration', async () => {
                const input = {
                    title: 'Invalid Event',
                    startTime: '2024-01-15T10:00:00Z',
                    durationMinutes: -10,
                };

                mockTimelineEventService.create.mockRejectedValue(new Error('Duration must be positive'));

                const ctx = createMockContext(input);
                await controller.create()(ctx);

                expect(ctx.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        code: 'E001',
                    }),
                    400
                );
            });

            it('should return validation error for missing startTime', async () => {
                const input = {
                    title: 'Invalid Event',
                    durationMinutes: 30,
                };

                const ctx = createMockContext(input);
                await controller.create()(ctx);

                expect(ctx.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        code: 'E001',
                    }),
                    400
                );
            });

            it('should return validation error for invalid startTime format', async () => {
                const input = {
                    title: 'Invalid Event',
                    startTime: 'not-a-date',
                    durationMinutes: 30,
                };

                mockTimelineEventService.create.mockRejectedValue(new Error('Invalid start time'));

                const ctx = createMockContext(input);
                await controller.create()(ctx);

                expect(ctx.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        code: 'E001',
                    }),
                    400
                );
            });
        });

        it('should require authentication', async () => {
            const input = {
                title: 'Test Event',
                startTime: '2024-01-20T14:00:00Z',
                durationMinutes: 60,
            };

            const ctx = createMockContext(input);
            ctx.get = vi.fn().mockReturnValue(null);

            await controller.create()(ctx);

            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'E002',
                }),
                401
            );
        });
    });

    describe('update', () => {
        it('should update event with valid changes', async () => {
            const eventId = 'event-123';
            const input = {
                title: 'Updated Standup',
                durationMinutes: 45,
            };

            const updatedEvent = { ...mockTimelineEvent, ...input };
            mockTimelineEventService.update.mockResolvedValue(updatedEvent);

            const ctx = createMockContext(input, { id: eventId });
            await controller.update()(ctx);

            expect(mockTimelineEventService.update).toHaveBeenCalledWith('user-123', eventId, input);
            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'S003',
                    data: updatedEvent,
                })
            );
        });

        it('should update recurrence pattern', async () => {
            const eventId = 'event-123';
            const input = {
                recurrencePattern: 'weekly',
                daysOfWeek: ['tue', 'thu'],
            };

            const updatedEvent = { ...mockTimelineEvent, ...input };
            mockTimelineEventService.update.mockResolvedValue(updatedEvent);

            const ctx = createMockContext(input, { id: eventId });
            await controller.update()(ctx);

            expect(mockTimelineEventService.update).toHaveBeenCalledWith('user-123', eventId, input);
            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'S003',
                })
            );
        });

        describe('validation errors', () => {
            it('should return validation error for invalid recurrence pattern', async () => {
                const eventId = 'event-123';
                const input = {
                    recurrencePattern: 'invalid-pattern',
                };

                mockTimelineEventService.update.mockRejectedValue(new Error('Invalid recurrence pattern'));

                const ctx = createMockContext(input, { id: eventId });
                await controller.update()(ctx);

                expect(ctx.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        code: 'E001',
                    }),
                    400
                );
            });

            it('should return validation error for invalid days of week', async () => {
                const eventId = 'event-123';
                const input = {
                    recurrencePattern: 'weekly',
                    daysOfWeek: ['not-a-day'],
                };

                mockTimelineEventService.update.mockRejectedValue(new Error('Invalid day names in daysOfWeek'));

                const ctx = createMockContext(input, { id: eventId });
                await controller.update()(ctx);

                expect(ctx.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        code: 'E001',
                    }),
                    400
                );
            });

            it('should return validation error for negative duration', async () => {
                const eventId = 'event-123';
                const input = {
                    durationMinutes: -10,
                };

                mockTimelineEventService.update.mockRejectedValue(new Error('Duration must be positive'));

                const ctx = createMockContext(input, { id: eventId });
                await controller.update()(ctx);

                expect(ctx.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        code: 'E001',
                    }),
                    400
                );
            });
        });

        describe('authorization errors', () => {
            it('should return not found when event does not exist', async () => {
                const eventId = 'non-existent';
                const input = { title: 'Updated' };

                mockTimelineEventService.update.mockRejectedValue(new Error('Timeline event not found'));

                const ctx = createMockContext(input, { id: eventId });
                await controller.update()(ctx);

                expect(ctx.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        code: 'E003',
                    }),
                    404
                );
            });

            it('should return not found when event belongs to different user', async () => {
                const eventId = 'event-456';
                const input = { title: 'Updated' };

                mockTimelineEventService.update.mockRejectedValue(new Error('Timeline event not found'));

                const ctx = createMockContext(input, { id: eventId });
                await controller.update()(ctx);

                expect(ctx.json).toHaveBeenCalledWith(
                    expect.objectContaining({
                        code: 'E003',
                    }),
                    404
                );
            });
        });
    });

    describe('delete', () => {
        it('should delete event successfully', async () => {
            const eventId = 'event-123';

            mockTimelineEventService.delete.mockResolvedValue(undefined);

            const ctx = createMockContext(null, { id: eventId });
            await controller.delete()(ctx);

            expect(mockTimelineEventService.delete).toHaveBeenCalledWith('user-123', eventId);
            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'S004',
                })
            );
        });

        it('should return not found when event does not exist', async () => {
            const eventId = 'non-existent';

            mockTimelineEventService.delete.mockRejectedValue(new Error('Timeline event not found'));

            const ctx = createMockContext(null, { id: eventId });
            await controller.delete()(ctx);

            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'E003',
                }),
                404
            );
        });

        it('should return not found when event belongs to different user', async () => {
            const eventId = 'event-456';

            mockTimelineEventService.delete.mockRejectedValue(new Error('Timeline event not found'));

            const ctx = createMockContext(null, { id: eventId });
            await controller.delete()(ctx);

            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'E003',
                }),
                404
            );
        });
    });
});
