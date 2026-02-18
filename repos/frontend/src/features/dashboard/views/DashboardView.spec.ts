import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import DashboardView from './DashboardView.vue'
import { dashboardApi } from '../services/dashboard.api'
import type { DashboardData } from '../types/dashboard.types'

vi.mock('../services/dashboard.api', () => ({
    dashboardApi: {
        getDashboard: vi.fn(),
    },
}))

vi.mock('@/stores/auth.store', () => ({
    useAuthStore: () => ({
        logout: vi.fn().mockResolvedValue(undefined),
        isAuthenticated: true,
        user: { id: 'user-1', name: 'Test User', email: 'test@test.com' },
    }),
}))

const router = createRouter({
    history: createMemoryHistory(),
    routes: [
        { path: '/', component: DashboardView },
        { path: '/login', component: { template: '<div>Login</div>' } },
        { path: '/history', component: { template: '<div>History</div>' } },
        { path: '/settings', component: { template: '<div>Settings</div>' } },
    ],
})

const mockDashboardData: DashboardData = {
    timeline: {
        events: [
            {
                id: 'evt-1',
                title: 'Morning standup',
                startTime: '2026-02-17T09:00:00Z',
                endTime: '2026-02-17T09:15:00Z',
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
                    activeDays: ['mon', 'tue'],
                    deadline: '2026-02-18',
                    status: 'active',
                },
            ],
            notUrgent: [],
        },
        notImportant: { urgent: [], notUrgent: [] },
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

function mountComponent() {
    return mount(DashboardView, {
        global: {
            plugins: [createPinia(), router],
            stubs: {
                DailyFlowWidget: true,
            },
        },
    })
}

describe('DashboardView', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        setActivePinia(createPinia())
    })

    it('renders page header with title and subtitle', async () => {
        vi.mocked(dashboardApi.getDashboard).mockResolvedValue(mockDashboardData)
        const wrapper = mountComponent()
        await flushPromises()

        expect(wrapper.find('[data-testid="dashboard-header"]').exists()).toBe(true)
        expect(wrapper.text()).toContain("Today's Awareness")
    })

    it('shows loading indicator while fetching', async () => {
        let resolvePromise: (value: DashboardData) => void
        vi.mocked(dashboardApi.getDashboard).mockReturnValue(
            new Promise((resolve) => {
                resolvePromise = resolve
            })
        )

        const wrapper = mountComponent()
        await wrapper.vm.$nextTick()
        await wrapper.vm.$nextTick()

        expect(wrapper.find('[data-testid="dashboard-loading"]').exists()).toBe(true)

        resolvePromise!(mockDashboardData)
        await flushPromises()

        expect(wrapper.find('[data-testid="dashboard-loading"]').exists()).toBe(false)
    })

    it('renders dashboard sections (matrix, timeline, commitments) after data loads', async () => {
        vi.mocked(dashboardApi.getDashboard).mockResolvedValue(mockDashboardData)
        const wrapper = mountComponent()
        await flushPromises()

        expect(wrapper.find('[data-testid="dashboard-sections"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="matrix-section"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="timeline-section"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="commitments-section"]').exists()).toBe(true)
    })

    it('shows error state with retry button on API failure', async () => {
        vi.mocked(dashboardApi.getDashboard).mockRejectedValue(new Error('Network error'))
        const wrapper = mountComponent()
        await flushPromises()

        expect(wrapper.find('[data-testid="dashboard-error"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('Network error')
        expect(wrapper.find('[data-testid="retry-button"]').exists()).toBe(true)
    })

    it('retries fetching when retry button is clicked', async () => {
        const mockGetDashboard = vi.mocked(dashboardApi.getDashboard)
        mockGetDashboard.mockRejectedValueOnce(new Error('Network error'))

        const wrapper = mountComponent()
        await flushPromises()

        mockGetDashboard.mockResolvedValueOnce(mockDashboardData)

        await wrapper.find('[data-testid="retry-button"]').trigger('click')
        await flushPromises()

        expect(wrapper.find('[data-testid="dashboard-sections"]').exists()).toBe(true)
        expect(mockGetDashboard).toHaveBeenCalledTimes(2)
    })

    it('has a Log Progress button', async () => {
        vi.mocked(dashboardApi.getDashboard).mockResolvedValue(mockDashboardData)
        const wrapper = mountComponent()
        await flushPromises()

        expect(wrapper.find('[data-testid="log-progress-button"]').exists()).toBe(true)
    })
})
