import type { Context } from 'hono';
import { ProgressItemService, ValidationError, NotFoundError } from './services/progress-item.service';
import { createSuccessResponse, createErrorResponse, createPaginatedResponse, serverError } from '../../shared/response/response.helper';
import { ResponseCodes } from '../../shared/response/response.types';
import { logger } from '../../shared/logger/logger.service';

export class ProgressItemsController {
    private progressItemService: ProgressItemService;

    constructor(progressItemService: ProgressItemService) {
        this.progressItemService = progressItemService;
    }

    /**
     * POST /api/progress-items
     * Create a new progress item
     */
    create() {
        return async (c: Context): Promise<Response> => {
            try {
                const userId = c.get('userId') as string;
                // Get validated data from middleware, or parse body for backward compatibility
                let body = c.get('validatedData');
                if (!body) {
                    body = await c.req.json();
                }

                const item = await this.progressItemService.create(userId, body);

                return c.json(
                    createSuccessResponse(ResponseCodes.SUCCESS, 'Progress item created', item),
                    201
                );
            } catch (error) {
                if (error instanceof ValidationError) {
                    return c.json(
                        createErrorResponse(ResponseCodes.NOT_FOUND, error.message),
                        400
                    );
                }
                throw error; // Let global error handler handle it
            }
        };
    }

    /**
     * POST /api/progress-items/:id/logs
     * Log progress for an item
     */
    logProgress() {
        return async (c: Context): Promise<Response> => {
            try {
                const userId = c.get('userId') as string;
                const itemId = c.req.param('id');
                // Get validated data from middleware, or parse body for backward compatibility
                let body = c.get('validatedData');
                if (!body) {
                    body = await c.req.json();
                }

                const log = await this.progressItemService.logProgress(userId, itemId, body);

                return c.json(
                    createSuccessResponse(ResponseCodes.SUCCESS, 'Progress logged', log),
                    201
                );
            } catch (error) {
                if (error instanceof ValidationError) {
                    return c.json(
                        createErrorResponse(ResponseCodes.NOT_FOUND, error.message),
                        400
                    );
                }
                if (error instanceof NotFoundError) {
                    return c.json(
                        createErrorResponse(ResponseCodes.NOT_FOUND, error.message),
                        404
                    );
                }
                throw error; // Let global error handler handle it
            }
        };
    }

    /**
     * GET /api/progress-items
     * List progress items with pagination
     */
    getAll() {
        return async (c: Context): Promise<Response> => {
            try {
                const userId = c.get('userId') as string;
                const query = c.get('validatedQuery') as { page: number; limit: number } || { page: 1, limit: 10 };
                const activeDay = c.req.query().activeDay;

                const result = await this.progressItemService.getAll(userId, { ...query, activeDay });

                return c.json(
                    createPaginatedResponse(
                        ResponseCodes.SUCCESS,
                        'Progress items retrieved',
                        result.items,
                        {
                            total: result.total,
                            perPage: query.limit,
                            currentPage: query.page,
                            lastPage: Math.ceil(result.total / query.limit)
                        }
                    ),
                    200
                );
            } catch (error) {
                throw error; // Let global error handler handle it
            }
        };
    }

    /**
     * PUT /api/progress-items/:id
     * Update a progress item
     */
    update() {
        return async (c: Context): Promise<Response> => {
            try {
                const userId = c.get('userId') as string;
                const itemId = c.req.param('id');
                // Get validated data from middleware, or parse body for backward compatibility
                let body = c.get('validatedData');
                if (!body) {
                    body = await c.req.json();
                }

                const item = await this.progressItemService.update(userId, itemId, body);

                return c.json(
                    createSuccessResponse(ResponseCodes.SUCCESS, 'Progress item updated', item),
                    200
                );
            } catch (error) {
                if (error instanceof ValidationError) {
                    return c.json(createErrorResponse(ResponseCodes.VALIDATION_ERROR, error.message), 400);
                }
                if (error instanceof NotFoundError) {
                    return c.json(createErrorResponse(ResponseCodes.NOT_FOUND, error.message), 404);
                }
                throw error; // Let global error handler handle it
            }
        };
    }

    /**
     * PUT /api/progress-items/:id/settle
     * Settle a progress item
     */
    settle() {
        return async (c: Context): Promise<Response> => {
            try {
                const userId = c.get('userId') as string;
                const itemId = c.req.param('id');

                const item = await this.progressItemService.settle(userId, itemId);

                return c.json(
                    createSuccessResponse(ResponseCodes.SUCCESS, 'Progress item settled', item),
                    200
                );
            } catch (error) {
                if (error instanceof NotFoundError) {
                    return c.json(createErrorResponse(ResponseCodes.NOT_FOUND, error.message), 404);
                }
                throw error; // Let global error handler handle it
            }
        };
    }

    /**
     * GET /api/progress-items/:id/logs
     * Get progress logs for an item with pagination
     */
    getLogs() {
        return async (c: Context): Promise<Response> => {
            try {
                const userId = c.get('userId') as string;
                const itemId = c.req.param('id');
                const query = c.get('validatedQuery') as { page: number; limit: number } || { page: 1, limit: 10 };

                const result = await this.progressItemService.getLogs(userId, itemId, query);

                return c.json(
                    createPaginatedResponse(
                        ResponseCodes.SUCCESS,
                        'Progress logs retrieved',
                        result.logs,
                        {
                            total: result.total,
                            perPage: query.limit,
                            currentPage: query.page,
                            lastPage: Math.ceil(result.total / query.limit)
                        }
                    ),
                    200
                );
            } catch (error) {
                if (error instanceof NotFoundError) {
                    return c.json(createErrorResponse(ResponseCodes.NOT_FOUND, error.message), 404);
                }
                throw error; // Let global error handler handle it
            }
        };
    }
}
