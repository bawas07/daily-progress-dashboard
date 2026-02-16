import { httpClient } from '@/shared/utils/http-client'
import type { ApiSuccessResponse } from '@/shared/types'
import type { DashboardData } from '../types/dashboard.types'

/**
 * Dashboard API Client
 * Handles dashboard data fetching
 */
export const dashboardApi = {
    /**
     * Get dashboard data for a specific date
     * GET /api/dashboard?date=YYYY-MM-DD
     *
     * @param date - Date string in YYYY-MM-DD format
     * @returns Promise<DashboardData>
     */
    async getDashboard(date: string): Promise<DashboardData> {
        const response = await httpClient.get<ApiSuccessResponse<DashboardData>>(
            '/dashboard',
            { params: { date } }
        )
        return response.data.data
    },
}
