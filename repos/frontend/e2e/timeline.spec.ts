import { test, expect, type Page } from '@playwright/test'
import { STORAGE_KEYS } from './fixtures'

async function authenticate(page: Page) {
  await page.goto('/login')
  await page.evaluate((keys) => {
    localStorage.setItem(keys.ACCESS_TOKEN, 'mock-access-token')
    localStorage.setItem(keys.REFRESH_TOKEN, 'mock-refresh-token')
  }, STORAGE_KEYS)
}

test.describe('Timeline Management E2E', () => {
  test('creates and deletes a timeline event', async ({ page }) => {
    await authenticate(page)

    const events: Array<Record<string, unknown>> = []

    await page.route('**/api/timeline-events**', async (route) => {
      const method = route.request().method()

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: events,
            message: 'Timeline events retrieved',
            code: 'S001',
          }),
        })
        return
      }

      if (method === 'POST') {
        const body = route.request().postDataJSON() as Record<string, unknown>
        const created = {
          id: `event-${events.length + 1}`,
          userId: 'user-1',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          daysOfWeek: null,
          ...body,
        }
        events.push(created)

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            data: created,
            message: 'Timeline event created',
            code: 'S002',
          }),
        })
        return
      }

      if (method === 'DELETE') {
        const id = route.request().url().split('/').pop()
        const index = events.findIndex((event) => event.id === id)
        if (index >= 0) {
          events.splice(index, 1)
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { id },
            message: 'Timeline event deleted',
            code: 'S004',
          }),
        })
        return
      }

      await route.fallback()
    })

    await page.goto('/timeline')

    await page.getByTestId('timeline-create-button').click()
    await page.getByTestId('timeline-title-input').fill('Deep Work Block')
    await page.getByTestId('timeline-date-input').fill('2026-02-19')
    await page.getByTestId('timeline-time-input').fill('10:00')
    await page.getByTestId('timeline-duration-input').fill('90')
    await page.getByTestId('timeline-create-submit').click()

    await expect(page.getByTestId('timeline-events-list')).toContainText('Deep Work Block')

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Delete' }).first().click()

    await expect(page.getByTestId('timeline-empty-state')).toBeVisible()
  })
})
