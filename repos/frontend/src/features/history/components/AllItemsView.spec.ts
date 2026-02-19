import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AllItemsView from './AllItemsView.vue'
import type { AllItemsData } from '../types/history.types'

const mockData: AllItemsData = {
  progressItems: [
    {
      id: 'item-1',
      title: 'Learn TypeScript',
      activeDays: ['mon', 'wed', 'fri'],
      isActiveToday: false,
      lastProgressAt: null,
    },
  ],
  commitments: [
    {
      id: 'commit-1',
      title: 'Daily walk',
      scheduledDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      isScheduledToday: true,
    },
  ],
}

describe('AllItemsView', () => {
  it('renders progress items and commitments', () => {
    const wrapper = mount(AllItemsView, {
      props: {
        data: mockData,
      },
    })

    expect(wrapper.findAll('[data-testid="all-items-progress-item"]')).toHaveLength(1)
    expect(wrapper.findAll('[data-testid="all-items-commitment"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Learn TypeScript')
    expect(wrapper.text()).toContain('Daily walk')
    expect(wrapper.text()).toContain('No progress yet')
    expect(wrapper.text()).toContain('(not today)')
  })
})
