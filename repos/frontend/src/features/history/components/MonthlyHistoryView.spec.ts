import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MonthlyHistoryView from './MonthlyHistoryView.vue'
import type { MonthlyHistoryData } from '../types/history.types'

const mockData: MonthlyHistoryData = {
  monthlyData: {
    '2026-02-01': {
      progressLogs: [],
      commitmentLogs: [],
    },
    '2026-02-02': {
      progressLogs: [
        {
          id: 'p1',
          progressItemId: 'item-1',
          loggedAt: '2026-02-02T10:00:00.000Z',
          note: 'Solid progress',
          isOffDay: false,
          progressItem: {
            id: 'item-1',
            title: 'Ship feature',
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

describe('MonthlyHistoryView', () => {
  it('renders monthly summary and day cards', () => {
    const wrapper = mount(MonthlyHistoryView, {
      props: {
        data: mockData,
      },
    })

    expect(wrapper.find('[data-testid="monthly-history-summary"]').text()).toContain('1 progress logs and 0 commitments this month')
    expect(wrapper.findAll('[data-testid="monthly-history-day"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('No activity')
  })
})
