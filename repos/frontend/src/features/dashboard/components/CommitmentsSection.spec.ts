import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CommitmentsSection from './CommitmentsSection.vue'
import type { DashboardCommitment } from '../types/dashboard.types'

const mockCommitments: DashboardCommitment[] = [
    {
        id: 'com-1',
        title: 'Exercise',
        scheduledDays: ['mon', 'wed', 'fri'],
        completedToday: false,
        completionCount: 5,
    },
    {
        id: 'com-2',
        title: 'Read for 30 minutes',
        scheduledDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        completedToday: true,
        completionCount: 12,
    },
    {
        id: 'com-3',
        title: 'Meditate',
        scheduledDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        completedToday: false,
        completionCount: 3,
    },
]

describe('CommitmentsSection', () => {
    it('renders section with Daily Commitments title', () => {
        const wrapper = mount(CommitmentsSection, {
            props: { commitments: mockCommitments },
        })

        expect(wrapper.find('[data-testid="commitments-section"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('Daily Commitments')
    })

    it('renders all commitment cards', () => {
        const wrapper = mount(CommitmentsSection, {
            props: { commitments: mockCommitments },
        })

        const items = wrapper.findAll('[data-testid="commitment-item"]')
        expect(items).toHaveLength(3)

        expect(wrapper.text()).toContain('Exercise')
        expect(wrapper.text()).toContain('Read for 30 minutes')
        expect(wrapper.text()).toContain('Meditate')
    })

    it('shows Completed label for completed commitments', () => {
        const wrapper = mount(CommitmentsSection, {
            props: { commitments: mockCommitments },
        })

        // "Read for 30 minutes" is completedToday
        expect(wrapper.text()).toContain('Completed')
    })

    it('emits toggle event when action button is clicked', async () => {
        const wrapper = mount(CommitmentsSection, {
            props: { commitments: mockCommitments },
        })

        // Find action buttons and click the first one
        const buttons = wrapper.findAll('[data-testid="commitment-item"] button')
        await buttons[0].trigger('click')

        expect(wrapper.emitted('toggle')).toBeTruthy()
        expect(wrapper.emitted('toggle')![0]).toEqual([mockCommitments[0]])
    })

    it('is hidden when no commitments', () => {
        const wrapper = mount(CommitmentsSection, {
            props: { commitments: [] },
        })

        expect(wrapper.find('[data-testid="commitments-section"]').exists()).toBe(false)
        expect(wrapper.html()).toBe('<!--v-if-->')
    })

    it('renders Moment of Calm widget', () => {
        const wrapper = mount(CommitmentsSection, {
            props: { commitments: mockCommitments },
        })

        expect(wrapper.text()).toContain('Moment of Calm')
    })
})
