import { expect, test, type Page } from '@playwright/test'
import { STORAGE_KEYS } from './fixtures'

async function authenticate(page: Page) {
  await page.goto('/login')
  await page.evaluate((keys) => {
    localStorage.setItem(keys.ACCESS_TOKEN, 'mock-access-token')
    localStorage.setItem(keys.REFRESH_TOKEN, 'mock-refresh-token')
  }, STORAGE_KEYS)
}

test.describe('Settings Management E2E', () => {
  test('updates preferences and changes password', async ({ page }) => {
    await authenticate(page)

    let updatedPreferencesPayload: Record<string, unknown> | null = null
    let changedPasswordPayload: Record<string, unknown> | null = null

    await page.route('**/api/user/preferences', async (route) => {
      const method = route.request().method()

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'S001',
            message: 'Preferences retrieved',
            data: {
              id: 'pref-1',
              userId: 'user-1',
              defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
              theme: 'auto',
              timezone: 'UTC',
              enableNotifications: true,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          }),
        })
        return
      }

      if (method === 'PUT') {
        updatedPreferencesPayload = route.request().postDataJSON() as Record<string, unknown>
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'S001',
            message: 'Preferences updated',
            data: {
              id: 'pref-1',
              userId: 'user-1',
              defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
              theme: updatedPreferencesPayload.theme || 'auto',
              timezone: updatedPreferencesPayload.timezone || 'UTC',
              enableNotifications:
                typeof updatedPreferencesPayload.enableNotifications === 'boolean'
                  ? updatedPreferencesPayload.enableNotifications
                  : true,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-02T00:00:00.000Z',
            },
          }),
        })
        return
      }

      await route.fallback()
    })

    await page.route('**/api/auth/change-password', async (route) => {
      changedPasswordPayload = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'S001',
          message: 'Password updated successfully',
          data: {},
        }),
      })
    })

    await page.goto('/settings')

    await expect(page.getByTestId('settings-view')).toBeVisible()
    await expect(page.getByTestId('default-active-days-section')).toBeVisible()
    await expect(page.getByTestId('account-settings-title')).toBeVisible()

    await page.getByTestId('theme-radio-dark').check()
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true)

    await page.getByTestId('save-button').click()
    await expect.poll(() => updatedPreferencesPayload).not.toBeNull()
    expect(updatedPreferencesPayload?.theme).toBe('dark')

    await page.getByTestId('current-password-input').fill('CurrentPass1!')
    await page.getByTestId('new-password-input').fill('UpdatedPass1!')
    await page.getByTestId('confirm-password-input').fill('UpdatedPass1!')
    await page.getByTestId('change-password-button').click()

    await expect.poll(() => changedPasswordPayload).not.toBeNull()
    expect(changedPasswordPayload).toEqual({
      currentPassword: 'CurrentPass1!',
      newPassword: 'UpdatedPass1!',
    })
    await expect(page.getByTestId('account-settings-success')).toContainText('Password updated successfully.')
  })
})

