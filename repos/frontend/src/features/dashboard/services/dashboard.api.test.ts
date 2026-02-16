import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dashboardApi } from './dashboard.api'
import { httpClient } from '@/shared/utils/http-client'
import type { DashboardData } from '../types/dashboard.types'

vi.mock('@/shared/utils/http-client', () => ({
    httpClient: {
        get: vi.fn(),
    },
}))

const mockDashboardData: DashboardData = {
    timeline: {
        events: [
            {
                id: 'evt-1',
                title: 'Morning standup',
                startTime: '2026-02-17T09:00:00Z',
                durationMinutes: 15,
            },
        ],
    },
    progressItems: {
        important: {
            urgent: [
                {
                    id: 'pi-1',
                    title: 'Fix critical bug',
                    importance: 'high',
                    urgency: 'high',
                    activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
                    deadline: '2026-02-18',
                    status: 'active',
                },
            ],
            notUrgent: [],
        },
        notImportant: {
            urgent: [],
            notUrgent: [],
        },
    },
    commitments: [
        {
            id: 'com-1',
            title: 'Exercise',
            scheduledDays: ['mon', 'wed', 'fri'],
            completedToday: false,
            completionCount: 0,
        },
    ],
}

describe('dashboardApi', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getDashboard', () => {
        it('calls the dashboard endpoint with date param', async () => {
            const mockGet = vi.mocked(httpClient.get)
            mockGet.mockResolvedValue({
                data: {
                    data: mockDashboardData,
                    message: 'Dashboard data retrieved',
                    code: 'S003',
                },
            })

            await dashboardApi.getDashboard('2026-02-17')

            expect(mockGet).toHaveBeenCalledWith('/dashboard', {
                params: { date: '2026-02-17' },
            })
        })

        it('returns extracted dashboard data', async () => {
            const mockGet = vi.mocked(httpClient.get)
            mockGet.mockResolvedValue({
                data: {
                    data: mockDashboardData,
                    message: 'Dashboard data retrieved',
                    code: 'S003',
                },
            })

            const result = await dashboardApi.getDashboard('2026-02-17')

            expect(result).toEqual(mockDashboardData)
        })

        it('propagates errors from httpClient', async () => {
            const mockGet = vi.mocked(httpClient.get)
            mockGet.mockRejectedValue(new Error('Network error'))

            await expect(dashboardApi.getDashboard('2026-02-17')).rejects.toThrow(
                'Network error'
            )
        })
    })
})
