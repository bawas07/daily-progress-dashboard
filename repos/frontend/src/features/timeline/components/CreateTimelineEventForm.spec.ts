import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CreateTimelineEventForm from './CreateTimelineEventForm.vue'

describe('CreateTimelineEventForm', () => {
  it('renders required fields', () => {
    const wrapper = mount(CreateTimelineEventForm)

    expect(wrapper.find('[data-testid="timeline-title-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="timeline-date-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="timeline-time-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="timeline-duration-input"]').exists()).toBe(true)
  })

  it('shows weekly day selector when recurrence is weekly', async () => {
    const wrapper = mount(CreateTimelineEventForm)

    expect(wrapper.find('[data-testid="timeline-weekly-days"]').exists()).toBe(false)

    await wrapper.find('[data-testid="timeline-recurrence-select"]').setValue('weekly')

    expect(wrapper.find('[data-testid="timeline-weekly-days"]').exists()).toBe(true)
  })

  it('emits success with one-time payload', async () => {
    const wrapper = mount(CreateTimelineEventForm)

    await wrapper.find('[data-testid="timeline-title-input"]').setValue('Daily planning')
    await wrapper.find('[data-testid="timeline-date-input"]').setValue('2026-02-19')
    await wrapper.find('[data-testid="timeline-time-input"]').setValue('09:00')
    await wrapper.find('[data-testid="timeline-duration-input"]').setValue('45')

    await wrapper.find('form').trigger('submit.prevent')

    const emitted = wrapper.emitted('success')
    expect(emitted).toBeTruthy()

    const payload = emitted?.[0]?.[0]
    expect(payload.title).toBe('Daily planning')
    expect(payload.durationMinutes).toBe(45)
    expect(payload.recurrencePattern).toBeUndefined()
    expect(new Date(payload.startTime).toString()).not.toBe('Invalid Date')
  })

  it('emits success with weekly payload and selected days', async () => {
    const wrapper = mount(CreateTimelineEventForm)

    await wrapper.find('[data-testid="timeline-title-input"]').setValue('Sprint retro')
    await wrapper.find('[data-testid="timeline-date-input"]').setValue('2026-02-20')
    await wrapper.find('[data-testid="timeline-time-input"]').setValue('15:00')
    await wrapper.find('[data-testid="timeline-recurrence-select"]').setValue('weekly')

    const dayButtons = wrapper.findAll('[data-testid="timeline-weekly-days"] button')
    await dayButtons[1].trigger('click')

    await wrapper.find('form').trigger('submit.prevent')

    const payload = wrapper.emitted('success')?.[0]?.[0]
    expect(payload.recurrencePattern).toBe('weekly')
    expect(payload.daysOfWeek).toContain('mon')
    expect(payload.daysOfWeek).toContain('tue')
  })
})
