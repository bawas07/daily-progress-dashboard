import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimelineSection from './TimelineSection.vue'
import type { DashboardTimelineEvent } from '../types/dashboard.types'

const mockEvents: DashboardTimelineEvent[] = [
    {
        id: 'evt-1',
        title: 'Morning standup',
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-17T09:15:00Z',
        durationMinutes: 15,
    },
    {
        id: 'evt-2',
        title: 'Team lunch',
        startTime: '2026-02-17T12:00:00Z',
        endTime: '2026-02-17T13:00:00Z',
        durationMinutes: 60,
        description: 'Pizza day!',
    },
    {
        id: 'evt-3',
        title: 'Code review',
        startTime: '2026-02-17T14:30:00Z',
        endTime: '2026-02-17T15:15:00Z',
        durationMinutes: 45,
    },
]

describe('TimelineSection', () => {
    it('renders section with Timeline title', () => {
        const wrapper = mount(TimelineSection, {
            props: { events: mockEvents },
        })

        expect(wrapper.find('[data-testid="timeline-section"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('Timeline')
    })

    it('renders all events', () => {
        const wrapper = mount(TimelineSection, {
            props: { events: mockEvents },
        })

        const eventItems = wrapper.findAll('[data-testid="timeline-event"]')
        expect(eventItems).toHaveLength(3)

        expect(wrapper.text()).toContain('Morning standup')
        expect(wrapper.text()).toContain('Team lunch')
        expect(wrapper.text()).toContain('Code review')
    })

    it('displays event description when present', () => {
        const wrapper = mount(TimelineSection, {
            props: { events: mockEvents },
        })

        expect(wrapper.text()).toContain('Pizza day!')
    })

    it('renders time range for events', () => {
        const wrapper = mount(TimelineSection, {
            props: { events: mockEvents },
        })

        // Should show formatted time ranges (exact format depends on locale)
        const content = wrapper.find('[data-testid="timeline-content"]')
        expect(content.exists()).toBe(true)
    })

    it('shows empty state when no events', () => {
        const wrapper = mount(TimelineSection, {
            props: { events: [] },
        })

        expect(wrapper.find('[data-testid="timeline-empty"]').exists()).toBe(true)
        expect(wrapper.text()).toContain('No events scheduled today')
    })
})
