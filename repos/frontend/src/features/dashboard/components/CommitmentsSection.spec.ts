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
    it('renders section header', () => {
        const wrapper = mount(CommitmentsSection, {
            props: { commitments: mockCommitments },
        })

        expect(wrapper.find('[data-testid="commitments-header"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('Commitments')
    })

    it('renders all commitments', () => {
        const wrapper = mount(CommitmentsSection, {
            props: { commitments: mockCommitments },
        })

        const items = wrapper.findAll('[data-testid="commitment-item"]')
        expect(items).toHaveLength(3)

        expect(wrapper.text()).toContain('Exercise')
        expect(wrapper.text()).toContain('Read for 30 minutes')
        expect(wrapper.text()).toContain('Meditate')
    })

    it('shows checked checkbox for completed commitments', () => {
        const wrapper = mount(CommitmentsSection, {
            props: { commitments: mockCommitments },
        })

        const checkboxes = wrapper.findAll('[data-testid="commitment-checkbox"]')
        const completedCheckbox = checkboxes[1] // "Read for 30 minutes" is completed
        const incompleteCheckbox = checkboxes[0] // "Exercise" is not completed

        expect((completedCheckbox.element as HTMLInputElement).checked).toBe(true)
        expect((incompleteCheckbox.element as HTMLInputElement).checked).toBe(false)
    })

    it('shows "Done today" badge for completed commitments', () => {
        const wrapper = mount(CommitmentsSection, {
            props: { commitments: mockCommitments },
        })

        const badges = wrapper.findAll('[data-testid="commitment-completed-badge"]')
        expect(badges).toHaveLength(1)
        expect(badges[0].text()).toContain('Done today')
    })

    it('emits toggle event on checkbox change', async () => {
        const wrapper = mount(CommitmentsSection, {
            props: { commitments: mockCommitments },
        })

        const firstCheckbox = wrapper.findAll('[data-testid="commitment-checkbox"]')[0]
        await firstCheckbox.trigger('change')

        expect(wrapper.emitted('toggle')).toBeTruthy()
        expect(wrapper.emitted('toggle')![0]).toEqual([mockCommitments[0]])
    })

    it('is hidden when no commitments', () => {
        const wrapper = mount(CommitmentsSection, {
            props: { commitments: [] },
        })

        expect(wrapper.find('[data-testid="commitments-header"]').exists()).toBe(false)
        expect(wrapper.html()).toBe('<!--v-if-->')
    })

    it('collapses and expands on header click', async () => {
        const wrapper = mount(CommitmentsSection, {
            props: { commitments: mockCommitments },
        })

        expect(wrapper.find('[data-testid="commitments-content"]').exists()).toBe(true)

        await wrapper.find('[data-testid="commitments-header"]').trigger('click')
        expect(wrapper.find('[data-testid="commitments-content"]').exists()).toBe(false)

        await wrapper.find('[data-testid="commitments-header"]').trigger('click')
        expect(wrapper.find('[data-testid="commitments-content"]').exists()).toBe(true)
    })
})
