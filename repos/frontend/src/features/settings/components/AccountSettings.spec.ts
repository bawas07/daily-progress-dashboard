import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AccountSettings from './AccountSettings.vue'
import { settingsApi } from '../services/settings.api'

vi.mock('../services/settings.api', () => ({
  settingsApi: {
    changePassword: vi.fn(),
  },
}))

describe('AccountSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders password fields and submit button', () => {
    const wrapper = mount(AccountSettings)

    expect(wrapper.find('[data-testid="current-password-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="new-password-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="confirm-password-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="change-password-button"]').exists()).toBe(true)
  })

  it('shows validation feedback for weak passwords', async () => {
    const wrapper = mount(AccountSettings)

    await wrapper.get('[data-testid="current-password-input"]').setValue('CurrentPass1!')
    await wrapper.get('[data-testid="new-password-input"]').setValue('short')
    await wrapper.get('[data-testid="confirm-password-input"]').setValue('short')

    expect(wrapper.get('[data-testid="account-settings-validation"]').text()).toContain(
      'New password must be at least 8 characters long'
    )
  })

  it('calls API and shows success message for valid form', async () => {
    vi.mocked(settingsApi.changePassword).mockResolvedValue(undefined)
    const wrapper = mount(AccountSettings)

    await wrapper.get('[data-testid="current-password-input"]').setValue('CurrentPass1!')
    await wrapper.get('[data-testid="new-password-input"]').setValue('UpdatedPass1!')
    await wrapper.get('[data-testid="confirm-password-input"]').setValue('UpdatedPass1!')
    await wrapper.get('form').trigger('submit')

    expect(settingsApi.changePassword).toHaveBeenCalledWith({
      currentPassword: 'CurrentPass1!',
      newPassword: 'UpdatedPass1!',
    })
    expect(wrapper.get('[data-testid="account-settings-success"]').text()).toContain(
      'Password updated successfully.'
    )
  })

  it('shows API error message when change password fails', async () => {
    vi.mocked(settingsApi.changePassword).mockRejectedValue({
      response: {
        data: {
          message: 'Current password is incorrect',
        },
      },
    })
    const wrapper = mount(AccountSettings)

    await wrapper.get('[data-testid="current-password-input"]').setValue('WrongCurrent1!')
    await wrapper.get('[data-testid="new-password-input"]').setValue('UpdatedPass1!')
    await wrapper.get('[data-testid="confirm-password-input"]').setValue('UpdatedPass1!')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[data-testid="account-settings-error"]').text()).toContain(
      'Current password is incorrect'
    )
  })
})
