import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TodayHistoryView from './TodayHistoryView.vue'
import type { TodayHistoryData } from '../types/history.types'

const mockData: TodayHistoryData = {
  progressLogs: [
    {
      id: 'p1',
      progressItemId: 'item-1',
      loggedAt: '2026-02-19T09:00:00.000Z',
      note: 'Finished draft',
      isOffDay: false,
      progressItem: {
        id: 'item-1',
        title: 'Write proposal',
      },
    },
  ],
  commitmentLogs: [
    {
      id: 'c1',
      commitmentId: 'commit-1',
      completedAt: '2026-02-19T07:00:00.000Z',
      note: '30 min walk',
      commitment: {
        id: 'commit-1',
        title: 'Morning walk',
      },
    },
  ],
  summary: {
    progressLogCount: 1,
    commitmentLogCount: 1,
  },
}

describe('TodayHistoryView', () => {
  it('renders summary and logs', () => {
    const wrapper = mount(TodayHistoryView, {
      props: {
        data: mockData,
      },
    })

    expect(wrapper.find('[data-testid="today-history-summary"]').text()).toContain('1 progress logs and 1 commitments completed')
    expect(wrapper.findAll('[data-testid="today-progress-log"]')).toHaveLength(1)
    expect(wrapper.findAll('[data-testid="today-commitment-log"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Finished draft')
    expect(wrapper.text()).toContain('30 min walk')
  })

  it('shows empty state when no logs exist', () => {
    const wrapper = mount(TodayHistoryView, {
      props: {
        data: {
          progressLogs: [],
          commitmentLogs: [],
          summary: {
            progressLogCount: 0,
            commitmentLogCount: 0,
          },
        },
      },
    })

    expect(wrapper.find('[data-testid="today-history-empty"]').exists()).toBe(true)
  })
})
