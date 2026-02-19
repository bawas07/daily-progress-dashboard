import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimelineEvent from './TimelineEvent.vue'
import type { TimelineEvent as TimelineEventModel } from '../types/timeline.types'

const mockEvent: TimelineEventModel = {
  id: 'event-1',
  userId: 'user-1',
  title: 'Morning standup',
  startTime: '2026-02-19T09:00:00.000Z',
  durationMinutes: 30,
  recurrencePattern: 'weekly',
  daysOfWeek: ['mon', 'wed', 'fri'],
  status: 'active',
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
}

describe('TimelineEvent', () => {
  it('renders title and duration', () => {
    const wrapper = mount(TimelineEvent, {
      props: { event: mockEvent },
    })

    expect(wrapper.find('[data-testid="timeline-event-title"]').text()).toBe('Morning standup')
    expect(wrapper.text()).toContain('30m')
  })

  it('shows recurrence label', () => {
    const wrapper = mount(TimelineEvent, {
      props: { event: mockEvent },
    })

    expect(wrapper.find('[data-testid="timeline-event-recurrence"]').text()).toContain('Weekly')
    expect(wrapper.find('[data-testid="timeline-event-recurrence"]').text()).toContain('MON')
  })

  it('emits delete event when delete is clicked', async () => {
    const wrapper = mount(TimelineEvent, {
      props: { event: mockEvent },
    })

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')

    expect(wrapper.emitted('delete')).toEqual([['event-1']])
  })
})
