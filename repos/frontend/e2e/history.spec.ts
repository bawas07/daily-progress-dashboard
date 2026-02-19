import { test, expect, type Page } from '@playwright/test'
import { STORAGE_KEYS } from './fixtures'

async function authenticate(page: Page) {
  await page.goto('/login')
  await page.evaluate((keys) => {
    localStorage.setItem(keys.ACCESS_TOKEN, 'mock-access-token')
    localStorage.setItem(keys.REFRESH_TOKEN, 'mock-refresh-token')
  }, STORAGE_KEYS)
}

test.describe('History Navigation E2E', () => {
  test('switches tabs and renders corresponding history data', async ({ page }) => {
    await authenticate(page)

    await page.route('**/api/history/today**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'S001',
          message: 'History retrieved successfully',
          data: {
            progressLogs: [
              {
                id: 'p1',
                progressItemId: 'item-1',
                loggedAt: '2026-02-19T10:00:00.000Z',
                note: 'Completed first milestone',
                isOffDay: false,
                progressItem: {
                  id: 'item-1',
                  title: 'Write spec',
                },
              },
            ],
            commitmentLogs: [],
            summary: {
              progressLogCount: 1,
              commitmentLogCount: 0,
            },
          },
        }),
      })
    })

    await page.route('**/api/history/week**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'S001',
          message: 'Weekly history retrieved successfully',
          data: {
            weeklyData: {
              '2026-02-17': {
                progressLogs: [],
                commitmentLogs: [],
              },
            },
            summary: {
              totalProgressLogs: 4,
              totalCommitmentLogs: 3,
            },
          },
        }),
      })
    })

    await page.route('**/api/history/month**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'S001',
          message: 'Monthly history retrieved successfully',
          data: {
            monthlyData: {
              '2026-02-01': {
                progressLogs: [],
                commitmentLogs: [],
              },
            },
            summary: {
              totalProgressLogs: 12,
              totalCommitmentLogs: 7,
            },
          },
        }),
      })
    })

    await page.route('**/api/items/all**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'S001',
          message: 'All active items retrieved successfully',
          data: {
            progressItems: [
              {
                id: 'item-1',
                title: 'Write spec',
                activeDays: ['mon', 'wed', 'fri'],
                isActiveToday: true,
                lastProgressAt: null,
              },
            ],
            commitments: [
              {
                id: 'commit-1',
                title: 'Evening walk',
                scheduledDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
                isScheduledToday: false,
              },
            ],
          },
        }),
      })
    })

    await page.goto('/history')

    await expect(page.getByTestId('today-history-summary')).toContainText('1 progress logs and 0 commitments completed')
    await expect(page.getByText('Completed first milestone')).toBeVisible()

    await page.getByTestId('history-tab-week').click()
    await expect(page.getByTestId('weekly-history-summary')).toContainText('4 progress logs and 3 commitments this week')

    await page.getByTestId('history-tab-month').click()
    await expect(page.getByTestId('monthly-history-summary')).toContainText('12 progress logs and 7 commitments this month')

    await page.getByTestId('history-tab-all').click()
    await expect(page.getByTestId('all-items-view')).toContainText('Write spec')
    await expect(page.getByTestId('all-items-view')).toContainText('Evening walk')
  })
})
