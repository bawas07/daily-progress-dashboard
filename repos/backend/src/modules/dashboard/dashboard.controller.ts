import { Context } from 'hono';
import {
    createSuccessResponse,
    createErrorResponse,
    serverError,
    createAuthErrorResponse,
} from '../../shared/response/response.helper';
import { ResponseCodes } from '../../shared/response/response.types';

export class DashboardController {
    private dashboardService: any;

    constructor(dashboardService: any) {
        this.dashboardService = dashboardService;
    }

    /**
     * GET /api/dashboard?date=YYYY-MM-DD
     * Get aggregated dashboard data for a specific date
     */
    getDashboard() {
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

                const data = await this.dashboardService.getDashboardData(userId, date);
                return c.json(createSuccessResponse(ResponseCodes.SUCCESS, 'Dashboard data retrieved', data));
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
}
