import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WeeklyHistoryView from './WeeklyHistoryView.vue'
import type { WeeklyHistoryData } from '../types/history.types'

const mockData: WeeklyHistoryData = {
  weeklyData: {
    '2026-02-16': {
      progressLogs: [
        {
          id: 'p1',
          progressItemId: 'item-1',
          loggedAt: '2026-02-16T09:00:00.000Z',
          note: null,
          isOffDay: true,
          progressItem: {
            id: 'item-1',
            title: 'Deep work',
          },
        },
      ],
      commitmentLogs: [],
    },
  },
  summary: {
    totalProgressLogs: 1,
    totalCommitmentLogs: 0,
  },
}

describe('WeeklyHistoryView', () => {
  it('renders weekly summary and grouped day cards', () => {
    const wrapper = mount(WeeklyHistoryView, {
      props: {
        data: mockData,
      },
    })

    expect(wrapper.find('[data-testid="weekly-history-summary"]').text()).toContain('1 progress logs and 0 commitments this week')
    expect(wrapper.findAll('[data-testid="weekly-history-day"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Deep work')
    expect(wrapper.text()).toContain('(off-day)')
  })
})
