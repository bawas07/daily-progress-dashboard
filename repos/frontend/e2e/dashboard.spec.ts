import { expect, test, type Page } from '@playwright/test'
import { STORAGE_KEYS } from './fixtures'

async function authenticate(page: Page) {
  await page.goto('/login')
  await page.evaluate((keys) => {
    localStorage.setItem(keys.ACCESS_TOKEN, 'mock-access-token')
    localStorage.setItem(keys.REFRESH_TOKEN, 'mock-refresh-token')
  }, STORAGE_KEYS)
}

test.describe('Dashboard E2E', () => {
  test('renders dashboard data and supports date navigation', async ({ page }) => {
    await authenticate(page)

    const requestedDates: string[] = []

    await page.route('**/api/dashboard**', async (route) => {
      const url = new URL(route.request().url())
      requestedDates.push(url.searchParams.get('date') || '')

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'S001',
          message: 'Dashboard retrieved',
          data: {
            timeline: {
              events: [
                {
                  id: 'timeline-1',
                  title: 'Morning Planning',
                  startTime: '2026-02-19T08:00:00.000Z',
                  endTime: '2026-02-19T08:30:00.000Z',
                  durationMinutes: 30,
                },
              ],
            },
            progressItems: {
              important: {
                urgent: [
                  {
                    id: 'progress-1',
                    title: 'Finish dashboard polish',
                    importance: 'high',
                    urgency: 'high',
                    activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
                    deadline: null,
                    status: 'active',
                  },
                ],
                notUrgent: [],
              },
              notImportant: {
                urgent: [],
                notUrgent: [],
              },
            },
            commitments: [
              {
                id: 'commitment-1',
                title: 'Meditation',
                scheduledDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
                completedToday: false,
                completionCount: 0,
              },
            ],
          },
        }),
      })
    })

    await page.goto('/')

    await expect(page.getByTestId('dashboard-sections')).toBeVisible()
    await expect(page.getByText('Morning Planning')).toBeVisible()
    await expect(page.getByText('Finish dashboard polish')).toBeVisible()

    await page.getByTestId('dashboard-date-input').fill('2026-02-18')
    await page.getByTestId('dashboard-date-input').dispatchEvent('change')

    await expect.poll(() => requestedDates.includes('2026-02-18')).toBe(true)

    await page.getByTestId('log-progress-button').click()
    await expect(page).toHaveURL('/progress')
  })
})

