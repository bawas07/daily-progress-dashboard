import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboard } from './useDashboard'
import { dashboardApi } from '../services/dashboard.api'
import type { DashboardData } from '../types/dashboard.types'

vi.mock('../services/dashboard.api', () => ({
    dashboardApi: {
        getDashboard: vi.fn(),
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

describe('useDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('initializes with correct default state', () => {
        const { dashboardData, loading, error } = useDashboard()

        expect(dashboardData.value).toBeNull()
        expect(loading.value).toBe(false)
        expect(error.value).toBeNull()
    })

    it('selectedDate defaults to today', () => {
        const { selectedDate } = useDashboard()
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')

        expect(selectedDate.value).toBe(`${year}-${month}-${day}`)
    })

    it('formattedDate returns a human-readable date string', () => {
        const { formattedDate, setDate } = useDashboard()
        setDate('2026-02-17')

        // The exact format depends on locale, but it should contain key parts
        expect(formattedDate.value).toContain('2026')
        expect(formattedDate.value).toContain('February')
        expect(formattedDate.value).toContain('17')
        expect(formattedDate.value).toContain('Tuesday')
    })

    describe('fetchDashboard', () => {
        it('sets loading state during fetch', async () => {
            const mockGetDashboard = vi.mocked(dashboardApi.getDashboard)
            let resolvePromise: (value: DashboardData) => void
            mockGetDashboard.mockReturnValue(
                new Promise((resolve) => {
                    resolvePromise = resolve
                })
            )

            const { fetchDashboard, loading } = useDashboard()

            const fetchPromise = fetchDashboard()
            expect(loading.value).toBe(true)

            resolvePromise!(mockDashboardData)
            await fetchPromise
            expect(loading.value).toBe(false)
        })

        it('stores fetched data', async () => {
            const mockGetDashboard = vi.mocked(dashboardApi.getDashboard)
            mockGetDashboard.mockResolvedValue(mockDashboardData)

            const { fetchDashboard, dashboardData } = useDashboard()
            await fetchDashboard()

            expect(dashboardData.value).toEqual(mockDashboardData)
        })

        it('passes selectedDate to API', async () => {
            const mockGetDashboard = vi.mocked(dashboardApi.getDashboard)
            mockGetDashboard.mockResolvedValue(mockDashboardData)

            const { fetchDashboard, setDate } = useDashboard()
            setDate('2026-03-01')
            await fetchDashboard()

            expect(mockGetDashboard).toHaveBeenCalledWith('2026-03-01')
        })

        it('handles API errors gracefully', async () => {
            const mockGetDashboard = vi.mocked(dashboardApi.getDashboard)
            mockGetDashboard.mockRejectedValue(new Error('Network error'))

            const { fetchDashboard, error, dashboardData, loading } = useDashboard()
            await fetchDashboard()

            expect(error.value).toBe('Network error')
            expect(dashboardData.value).toBeNull()
            expect(loading.value).toBe(false)
        })

        it('clears previous error on new fetch', async () => {
            const mockGetDashboard = vi.mocked(dashboardApi.getDashboard)
            mockGetDashboard.mockRejectedValueOnce(new Error('Network error'))
            mockGetDashboard.mockResolvedValueOnce(mockDashboardData)

            const { fetchDashboard, error } = useDashboard()

            await fetchDashboard()
            expect(error.value).toBe('Network error')

            await fetchDashboard()
            expect(error.value).toBeNull()
        })
    })

    describe('refresh', () => {
        it('re-fetches dashboard data', async () => {
            const mockGetDashboard = vi.mocked(dashboardApi.getDashboard)
            mockGetDashboard.mockResolvedValue(mockDashboardData)

            const { fetchDashboard, refresh, dashboardData } = useDashboard()
            await fetchDashboard()
            expect(mockGetDashboard).toHaveBeenCalledTimes(1)

            await refresh()
            expect(mockGetDashboard).toHaveBeenCalledTimes(2)
            expect(dashboardData.value).toEqual(mockDashboardData)
        })
    })

    describe('setDate', () => {
        it('updates selectedDate', () => {
            const { selectedDate, setDate } = useDashboard()
            setDate('2026-03-15')
            expect(selectedDate.value).toBe('2026-03-15')
        })
    })

    describe('goToToday', () => {
        it('resets selectedDate to today', () => {
            const { selectedDate, setDate, goToToday } = useDashboard()
            setDate('2026-03-15')
            goToToday()

            const today = new Date()
            const year = today.getFullYear()
            const month = String(today.getMonth() + 1).padStart(2, '0')
            const day = String(today.getDate()).padStart(2, '0')

            expect(selectedDate.value).toBe(`${year}-${month}-${day}`)
        })
    })

    describe('isToday', () => {
        it('returns true when selectedDate is today', () => {
            const { isToday } = useDashboard()
            expect(isToday.value).toBe(true)
        })

        it('returns false when selectedDate is not today', () => {
            const { isToday, setDate } = useDashboard()
            setDate('2020-01-01')
            expect(isToday.value).toBe(false)
        })
    })
})
