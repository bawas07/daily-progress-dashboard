import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PreferencesForm from './PreferencesForm.vue'
import { useUserPreferencesStore } from '@/shared/stores/user-preferences.store'

describe('PreferencesForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function mountComponent() {
    const pinia = createPinia()
    setActivePinia(pinia)

    const store = useUserPreferencesStore()
    store.preferences = {
      id: 'pref-1',
      userId: 'user-1',
      defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      theme: 'auto',
      timezone: 'UTC',
      enableNotifications: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }

    return mount(PreferencesForm, {
      global: {
        plugins: [pinia],
      },
    })
  }

  it('renders all preference sections', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('[data-testid="default-active-days-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="theme-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="timezone-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="notifications-section"]').exists()).toBe(true)
  })

  it('emits preview when theme changes', async () => {
    const wrapper = mountComponent()

    await wrapper.get('[data-testid="theme-radio-dark"]').trigger('change')
    const emitted = wrapper.emitted('preview')

    expect(emitted).toBeTruthy()
    expect(emitted?.[0]).toEqual([{ theme: 'dark' }])
  })

  it('emits save with preferences payload on submit', async () => {
    const wrapper = mountComponent()

    await wrapper.get('[data-testid="theme-radio-light"]').trigger('change')
    await wrapper.get('[data-testid="timezone-select"]').setValue('America/New_York')
    await wrapper.get('[data-testid="notifications-toggle"]').setValue(false)
    await wrapper.get('form').trigger('submit')

    const emitted = wrapper.emitted('save')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toMatchObject({
      theme: 'light',
      timezone: 'America/New_York',
      enableNotifications: false,
    })
  })

  it('does not allow removing the final active day', async () => {
    const wrapper = mountComponent()

    await wrapper.get('[data-testid="day-button-mon"]').trigger('click')
    await wrapper.get('[data-testid="day-button-tue"]').trigger('click')
    await wrapper.get('[data-testid="day-button-wed"]').trigger('click')
    await wrapper.get('[data-testid="day-button-thu"]').trigger('click')
    await wrapper.get('[data-testid="day-button-fri"]').trigger('click')

    await wrapper.get('form').trigger('submit')
    const payload = wrapper.emitted('save')?.[0]?.[0] as { defaultActiveDays: string[] } | undefined

    expect(payload?.defaultActiveDays.length).toBeGreaterThanOrEqual(1)
  })

  it('emits cancel when cancel button is clicked', async () => {
    const wrapper = mountComponent()

    await wrapper.get('[data-testid="cancel-button"]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
