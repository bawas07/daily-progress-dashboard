import { Context } from 'hono';
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
} from '../../shared/response/response.helper';
import { ResponseCodes } from '../../shared/response/response.types';

export class HistoryController {
    private historyService: any;

    constructor(historyService: any) {
        this.historyService = historyService;
    }

    /**
     * GET /api/history/today?date=YYYY-MM-DD
     * Get today's progress and commitment logs
     */
    getTodayHistory() {
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

                const data = await this.historyService.getTodayHistory(userId, date);
                return c.json(createSuccessResponse(ResponseCodes.SUCCESS, 'History retrieved successfully', data));
            } catch (error) {
                if (error instanceof Error && error.message === 'Invalid date') {
                    return c.json(
                        createErrorResponse(ResponseCodes.VALIDATION_ERROR, error.message),
                        400
                    );
                }
                return c.json(serverError('Internal server error'), 500);
            }
        };
    }

    /**
     * GET /api/history/week?date=YYYY-MM-DD
     * Get weekly history grouped by day
     */
    getWeeklyHistory() {
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

                const data = await this.historyService.getWeeklyHistory(userId, date);
                return c.json(createSuccessResponse(ResponseCodes.SUCCESS, 'Weekly history retrieved successfully', data));
            } catch (error) {
                if (error instanceof Error && error.message === 'Invalid date') {
                    return c.json(
                        createErrorResponse(ResponseCodes.VALIDATION_ERROR, error.message),
                        400
                    );
                }
                return c.json(serverError('Internal server error'), 500);
            }
        };
    }

    /**
     * GET /api/history/month?date=YYYY-MM-DD
     * Get monthly history grouped by day
     */
    getMonthlyHistory() {
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

                const data = await this.historyService.getMonthlyHistory(userId, date);
                return c.json(createSuccessResponse(ResponseCodes.SUCCESS, 'Monthly history retrieved successfully', data));
            } catch (error) {
                if (error instanceof Error && error.message === 'Invalid date') {
                    return c.json(
                        createErrorResponse(ResponseCodes.VALIDATION_ERROR, error.message),
                        400
                    );
                }
                return c.json(serverError('Internal server error'), 500);
            }
        };
    }

    /**
     * GET /api/items/all?date=YYYY-MM-DD
     * Get all active progress items and commitments
     */
    getAllActiveItems() {
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
                const date = query.date; // Optional

                const data = await this.historyService.getAllActiveItems(userId, date);
                return c.json(createSuccessResponse(ResponseCodes.SUCCESS, 'All active items retrieved successfully', data));
            } catch (error) {
                return c.json(serverError('Internal server error'), 500);
            }
        };
    }
}
