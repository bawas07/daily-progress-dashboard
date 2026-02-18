import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EisenhowerMatrix from './EisenhowerMatrix.vue'
import type { DashboardProgressQuadrants } from '../types/dashboard.types'

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
    return mount(EisenhowerMatrix, { props })
}

describe('EisenhowerMatrix', () => {
    it('renders section with Eisenhower Matrix title', () => {
        const wrapper = mountComponent({ progressItems: populatedItems })

        expect(wrapper.find('[data-testid="matrix-section"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('Eisenhower Matrix')
    })

    it('renders four quadrant cards', () => {
        const wrapper = mountComponent({ progressItems: populatedItems })

        expect(wrapper.find('[data-testid="quadrant-do-now"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="quadrant-schedule"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="quadrant-delegate"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="quadrant-eliminate"]').exists()).toBe(true)
    })

    it('renders four themed quadrant labels', () => {
        const wrapper = mountComponent({ progressItems: populatedItems })

        expect(wrapper.text()).toContain('Do Now')
        expect(wrapper.text()).toContain('Schedule')
        expect(wrapper.text()).toContain('Delegate')
        expect(wrapper.text()).toContain('Eliminate')
    })

    it('places items in correct quadrants', () => {
        const wrapper = mountComponent({ progressItems: populatedItems })

        expect(wrapper.find('[data-testid="quadrant-do-now"]').text()).toContain('Fix critical bug')
        expect(wrapper.find('[data-testid="quadrant-schedule"]').text()).toContain('Plan architecture')
        expect(wrapper.find('[data-testid="quadrant-delegate"]').text()).toContain('Reply to emails')
    })

    it('shows progress items as cards', () => {
        const wrapper = mountComponent({ progressItems: populatedItems })

        const items = wrapper.findAll('[data-testid="progress-item"]')
        expect(items.length).toBe(3)
    })

    it('shows empty state text in empty quadrants', () => {
        const wrapper = mountComponent({ progressItems: emptyItems })

        // Eliminate quadrant shows a calm message
        expect(wrapper.find('[data-testid="quadrant-eliminate"]').text()).toContain('Clear any distractions')
    })
})
