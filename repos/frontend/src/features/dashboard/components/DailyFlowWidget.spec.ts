import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DailyFlowWidget from './DailyFlowWidget.vue'
import type { DashboardCommitment, DashboardProgressQuadrants } from '../types/dashboard.types'

const emptyProgressItems: DashboardProgressQuadrants = {
    important: { urgent: [], notUrgent: [] },
    notImportant: { urgent: [], notUrgent: [] },
}

const noCommitments: DashboardCommitment[] = []

const someCommitments: DashboardCommitment[] = [
    {
        id: 'com-1',
        title: 'Exercise',
        scheduledDays: ['mon', 'wed', 'fri'],
        completedToday: true,
        completionCount: 5,
    },
    {
        id: 'com-2',
        title: 'Read',
        scheduledDays: ['mon', 'tue'],
        completedToday: false,
        completionCount: 2,
    },
]

const allCompleted: DashboardCommitment[] = [
    {
        id: 'com-1',
        title: 'Exercise',
        scheduledDays: ['mon'],
        completedToday: true,
        completionCount: 5,
    },
]

describe('DailyFlowWidget', () => {
    it('renders the widget with Daily Flow label', () => {
        const wrapper = mount(DailyFlowWidget, {
            props: {
                commitments: someCommitments,
                progressItems: emptyProgressItems,
            },
        })

        expect(wrapper.find('[data-testid="daily-flow-widget"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('Daily Flow')
    })

    it('shows summary message when no commitments', () => {
        const wrapper = mount(DailyFlowWidget, {
            props: {
                commitments: noCommitments,
                progressItems: emptyProgressItems,
            },
        })

        expect(wrapper.text()).toContain('Add some commitments to start tracking your flow')
    })

    it('shows encouraging message when some commitments are completed', () => {
        const wrapper = mount(DailyFlowWidget, {
            props: {
                commitments: someCommitments,
                progressItems: emptyProgressItems,
            },
        })

        expect(wrapper.text()).toContain('progress is steady')
    })

    it('shows celebration message when all commitments are completed', () => {
        const wrapper = mount(DailyFlowWidget, {
            props: {
                commitments: allCompleted,
                progressItems: emptyProgressItems,
            },
        })

        expect(wrapper.text()).toContain('All commitments completed')
    })
})
