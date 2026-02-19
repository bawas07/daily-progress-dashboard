import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HistoryTabs from './HistoryTabs.vue'

describe('HistoryTabs', () => {
  it('renders all tabs', () => {
    const wrapper = mount(HistoryTabs, {
      props: {
        modelValue: 'today',
      },
    })

    expect(wrapper.find('[data-testid="history-tab-today"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="history-tab-week"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="history-tab-month"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="history-tab-all"]').exists()).toBe(true)
  })

  it('emits update:modelValue when a tab is clicked', async () => {
    const wrapper = mount(HistoryTabs, {
      props: {
        modelValue: 'today',
      },
    })

    await wrapper.find('[data-testid="history-tab-week"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['week']])
  })
})
