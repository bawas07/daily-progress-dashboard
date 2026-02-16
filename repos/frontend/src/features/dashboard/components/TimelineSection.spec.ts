import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimelineSection from './TimelineSection.vue'
import type { DashboardTimelineEvent } from '../types/dashboard.types'

const mockEvents: DashboardTimelineEvent[] = [
    {
        id: 'evt-1',
        title: 'Morning standup',
        startTime: '2026-02-17T09:00:00Z',
        durationMinutes: 15,
    },
    {
        id: 'evt-2',
        title: 'Team lunch',
        startTime: '2026-02-17T12:00:00Z',
        durationMinutes: 60,
    },
    {
        id: 'evt-3',
        title: 'Code review',
        startTime: '2026-02-17T14:30:00Z',
        durationMinutes: 45,
    },
]

describe('TimelineSection', () => {
    it('renders section header', () => {
        const wrapper = mount(TimelineSection, {
            props: { events: mockEvents },
        })

        expect(wrapper.find('[data-testid="timeline-header"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('Timeline')
    })

    it('renders events with title, time, and duration', () => {
        const wrapper = mount(TimelineSection, {
            props: { events: mockEvents },
        })

        const eventItems = wrapper.findAll('[data-testid="timeline-event"]')
        expect(eventItems).toHaveLength(3)

        expect(wrapper.text()).toContain('Morning standup')
        expect(wrapper.text()).toContain('Team lunch')
        expect(wrapper.text()).toContain('Code review')
    })

    it('shows duration in readable format', () => {
        const wrapper = mount(TimelineSection, {
            props: { events: mockEvents },
        })

        expect(wrapper.text()).toContain('15min')
        expect(wrapper.text()).toContain('1h')
        expect(wrapper.text()).toContain('45min')
    })

    it('shows empty state when no events', () => {
        const wrapper = mount(TimelineSection, {
            props: { events: [] },
        })

        expect(wrapper.find('[data-testid="timeline-empty"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('No events scheduled today')
    })

    it('collapses and expands on header click', async () => {
        const wrapper = mount(TimelineSection, {
            props: { events: mockEvents },
        })

        // Initially expanded
        expect(wrapper.find('[data-testid="timeline-content"]').exists()).toBe(true)

        // Click to collapse
        await wrapper.find('[data-testid="timeline-header"]').trigger('click')
        expect(wrapper.find('[data-testid="timeline-content"]').exists()).toBe(false)

        // Click to expand
        await wrapper.find('[data-testid="timeline-header"]').trigger('click')
        expect(wrapper.find('[data-testid="timeline-content"]').exists()).toBe(true)
    })
})
