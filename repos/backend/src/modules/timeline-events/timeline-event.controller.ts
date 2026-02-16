import { Context } from 'hono';
import { TimelineEventService } from './services/timeline-event.service';
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    notFound
} from '../../shared/response/response.helper';
import { ResponseCodes } from '../../shared/response/response.types';

export class TimelineEventController {
    private timelineEventService: TimelineEventService;

    constructor(timelineEventService: TimelineEventService) {
        this.timelineEventService = timelineEventService;
    }

    /**
     * GET /timeline-events?date=YYYY-MM-DD
     * Get events for a specific date
     */
    getEvents() {
        return async (c: Context) => {
            try {
                const userId = c.get('userId');

                if (!userId) {
                    return c.json(
                        createErrorResponse(ResponseCodes.AUTH_ERROR, 'Authentication required'),
                        401
                    );
                }

                const query = c.req.query();
                const date = query.date;

                if (!date) {
                    return c.json(
                        createErrorResponse(ResponseCodes.VALIDATION_ERROR, 'Date query parameter is required'),
                        400
                    );
                }

                // Validate date format before passing to service
                const targetDate = new Date(date);
                if (isNaN(targetDate.getTime())) {
                    return c.json(
                        createErrorResponse(ResponseCodes.VALIDATION_ERROR, 'Invalid date'),
                        400
                    );
                }

                const events = await this.timelineEventService.getEventsForDate(userId, date);
                return c.json(createSuccessResponse('S001', 'Timeline events retrieved', events));
            } catch (error) {
                if (error instanceof Error && error.message === 'Invalid date') {
                    return c.json(
                        createErrorResponse(ResponseCodes.VALIDATION_ERROR, error.message),
                        400
                    );
                }
                throw error; // Let global error handler handle it
            }
        };
    }

    /**
     * GET /timeline-events/:id
     * Get a single event by ID
     */
    getById() {
        return async (c: Context) => {
            try {
                const userId = c.get('userId');
                const eventId = c.req.param('id');

                if (!userId) {
                    return c.json(
                        createErrorResponse(ResponseCodes.AUTH_ERROR, 'Authentication required'),
                        401
                    );
                }

                const event = await this.timelineEventService.getById(userId, eventId);

                if (!event) {
                    return c.json(notFound('Timeline event not found'), 404);
                }

                return c.json(createSuccessResponse('S001', 'Timeline event retrieved', event));
            } catch (error) {
                throw error; // Let global error handler handle it
            }
        };
    }

    /**
     * POST /timeline-events
     * Create a new timeline event
     */
    create() {
        return async (c: Context) => {
            try {
                const userId = c.get('userId');

                if (!userId) {
                    return c.json(
                        createErrorResponse(ResponseCodes.AUTH_ERROR, 'Authentication required'),
                        401
                    );
                }

                // Get validated data from middleware, or parse body for backward compatibility
                let body = c.get('validatedData');
                if (!body) {
                    body = await c.req.json();
                }

                const event = await this.timelineEventService.create(userId, body);
                return c.json(createSuccessResponse('S002', 'Timeline event created', event), 201);
            } catch (error) {
                if (error instanceof Error) {
                    if (
                        error.message === 'Invalid recurrence pattern' ||
                        error.message === 'daysOfWeek can only be provided with weekly recurrence' ||
                        error.message === 'daysOfWeek must contain at least one day' ||
                        error.message === 'Invalid day names in daysOfWeek' ||
                        error.message === 'Title is required' ||
                        error.message === 'Duration must be positive' ||
                        error.message === 'Invalid start time' ||
                        error.message === 'daysOfWeek is required for weekly recurrence'
                    ) {
                        return c.json(createErrorResponse(ResponseCodes.VALIDATION_ERROR, error.message), 400);
                    }
                }
                throw error; // Let global error handler handle it
            }
        };
    }

    /**
     * PUT /timeline-events/:id
     * Update an existing timeline event
     */
    update() {
        return async (c: Context) => {
            try {
                const userId = c.get('userId');
                const eventId = c.req.param('id');

                if (!userId) {
                    return c.json(
                        createErrorResponse(ResponseCodes.AUTH_ERROR, 'Authentication required'),
                        401
                    );
                }

                // Get validated data from middleware, or parse body for backward compatibility
                let body = c.get('validatedData');
                if (!body) {
                    body = await c.req.json();
                }

                const event = await this.timelineEventService.update(userId, eventId, body);
                return c.json(createSuccessResponse('S003', 'Timeline event updated', event));
            } catch (error) {
                if (error instanceof Error) {
                    if (error.message === 'Timeline event not found') {
                        return c.json(notFound('Timeline event not found'), 404);
                    }
                    if (
                        error.message === 'Invalid recurrence pattern' ||
                        error.message === 'daysOfWeek can only be provided with weekly recurrence' ||
                        error.message === 'daysOfWeek must contain at least one day' ||
                        error.message === 'Invalid day names in daysOfWeek' ||
                        error.message === 'Duration must be positive' ||
                        error.message === 'Invalid start time' ||
                        error.message === 'daysOfWeek is required for weekly recurrence'
                    ) {
                        return c.json(createErrorResponse(ResponseCodes.VALIDATION_ERROR, error.message), 400);
                    }
                }
                throw error; // Let global error handler handle it
            }
        };
    }

    /**
     * DELETE /timeline-events/:id
     * Delete a timeline event
     */
    delete() {
        return async (c: Context) => {
            try {
                const userId = c.get('userId');
                const eventId = c.req.param('id');

                if (!userId) {
                    return c.json(
                        createErrorResponse(ResponseCodes.AUTH_ERROR, 'Authentication required'),
                        401
                    );
                }

                await this.timelineEventService.delete(userId, eventId);
                return c.json(createSuccessResponse('S004', 'Timeline event deleted', { id: eventId }));
            } catch (error) {
                if (error instanceof Error && error.message === 'Timeline event not found') {
                    return c.json(notFound('Timeline event not found'), 404);
                }
                throw error; // Let global error handler handle it
            }
        };
    }
}
