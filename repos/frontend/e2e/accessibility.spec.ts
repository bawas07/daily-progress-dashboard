import { expect, test, type Page } from '@playwright/test'
import { STORAGE_KEYS } from './fixtures'

async function authenticate(page: Page) {
  await page.goto('/login')
  await page.evaluate((keys) => {
    localStorage.setItem(keys.ACCESS_TOKEN, 'mock-access-token')
    localStorage.setItem(keys.REFRESH_TOKEN, 'mock-refresh-token')
  }, STORAGE_KEYS)
}

async function mockDashboard(page: Page) {
  await page.route('**/api/dashboard**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'S001',
        message: 'Dashboard retrieved',
        data: {
          timeline: { events: [] },
          progressItems: {
            important: { urgent: [], notUrgent: [] },
            notImportant: { urgent: [], notUrgent: [] },
          },
          commitments: [],
        },
      }),
    })
  })
}

test.describe('Responsive and Accessibility E2E', () => {
  test('supports mobile navigation and keyboard skip links', async ({ page }) => {
    await authenticate(page)
    await mockDashboard(page)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const sidebar = page.getByTestId('app-sidebar')
    await expect(page.getByTestId('mobile-menu-toggle')).toBeVisible()

    await page.getByTestId('mobile-menu-toggle').click()
    await expect(page.getByTestId('sidebar-link-settings')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect.poll(async () => sidebar.evaluate((node) => node.className.includes('-translate-x-full'))).toBe(true)

    const skipLink = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skipLink).toHaveAttribute('href', '#main-content')
  })
})
