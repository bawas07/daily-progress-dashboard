import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import EisenhowerMatrix from './EisenhowerMatrix.vue'
import type { DashboardProgressQuadrants } from '../types/dashboard.types'

const router = createRouter({
    history: createMemoryHistory(),
    routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/history', component: { template: '<div />' } },
    ],
})

const emptyItems: DashboardProgressQuadrants = {
    important: { urgent: [], notUrgent: [] },
    notImportant: { urgent: [], notUrgent: [] },
}

const populatedItems: DashboardProgressQuadrants = {
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
        notUrgent: [
            {
                id: 'pi-2',
                title: 'Plan architecture',
                importance: 'high',
                urgency: 'low',
                activeDays: ['mon', 'wed', 'fri'],
                deadline: null,
                status: 'active',
            },
        ],
    },
    notImportant: {
        urgent: [
            {
                id: 'pi-3',
                title: 'Reply to emails',
                importance: 'low',
                urgency: 'high',
                activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
                deadline: null,
                status: 'active',
            },
        ],
        notUrgent: [],
    },
}

function mountComponent(props: { progressItems: DashboardProgressQuadrants }) {
    return mount(EisenhowerMatrix, {
        props,
        global: {
            plugins: [router],
        },
    })
}

describe('EisenhowerMatrix', () => {
    it('renders section header', () => {
        const wrapper = mountComponent({ progressItems: populatedItems })

        expect(wrapper.find('[data-testid="matrix-header"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('Progress Items')
    })

    it('renders four quadrant labels', () => {
        const wrapper = mountComponent({ progressItems: populatedItems })

        expect(wrapper.text()).toContain('Important & Urgent')
        expect(wrapper.text()).toContain('Important & Not Urgent')
        expect(wrapper.text()).toContain('Not Important & Urgent')
        expect(wrapper.text()).toContain('Not Important & Not Urgent')
    })

    it('places items in correct quadrants', () => {
        const wrapper = mountComponent({ progressItems: populatedItems })

        const urgentQuadrant = wrapper.find('[data-testid="quadrant-important-urgent"]')
        expect(urgentQuadrant.text()).toContain('Fix critical bug')

        const notUrgentQuadrant = wrapper.find('[data-testid="quadrant-important-not-urgent"]')
        expect(notUrgentQuadrant.text()).toContain('Plan architecture')

        const notImportantUrgent = wrapper.find('[data-testid="quadrant-not-important-urgent"]')
        expect(notImportantUrgent.text()).toContain('Reply to emails')
    })

    it('shows deadline when present', () => {
        const wrapper = mountComponent({ progressItems: populatedItems })
        const deadlineEl = wrapper.find('[data-testid="item-deadline"]')
        expect(deadlineEl.exists()).toBe(true)
        expect(deadlineEl.text()).toContain('Feb 18')
    })

    it('shows overdue visual indicator for past deadlines', () => {
        const overdueItems: DashboardProgressQuadrants = {
            important: {
                urgent: [
                    {
                        id: 'pi-overdue',
                        title: 'Overdue task',
                        importance: 'high',
                        urgency: 'high',
                        activeDays: ['mon'],
                        deadline: '2020-01-01',
                        status: 'active',
                    },
                ],
                notUrgent: [],
            },
            notImportant: { urgent: [], notUrgent: [] },
        }

        const wrapper = mountComponent({ progressItems: overdueItems })
        const deadlineEl = wrapper.find('[data-testid="item-deadline"]')
        expect(deadlineEl.text()).toContain('Overdue')
        expect(deadlineEl.classes()).toContain('text-red-600')
    })

    it('shows empty state when no items', () => {
        const wrapper = mountComponent({ progressItems: emptyItems })

        expect(wrapper.find('[data-testid="matrix-empty"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('Your weekday items are taking a break')
        expect(wrapper.text()).toContain('View all items in History')
    })

    it('collapses and expands on header click', async () => {
        const wrapper = mountComponent({ progressItems: populatedItems })

        expect(wrapper.find('[data-testid="matrix-content"]').exists()).toBe(true)

        await wrapper.find('[data-testid="matrix-header"]').trigger('click')
        expect(wrapper.find('[data-testid="matrix-content"]').exists()).toBe(false)

        await wrapper.find('[data-testid="matrix-header"]').trigger('click')
        expect(wrapper.find('[data-testid="matrix-content"]').exists()).toBe(true)
    })
})
