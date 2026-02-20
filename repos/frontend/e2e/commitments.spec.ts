import { expect, test, type Page } from '@playwright/test'
import { STORAGE_KEYS } from './fixtures'

type CommitmentRecord = {
  id: string
  userId: string
  title: string
  scheduledDays: string[]
  completedToday: boolean
  status: 'active'
  createdAt: string
  updatedAt: string
}

async function authenticate(page: Page) {
  await page.goto('/login')
  await page.evaluate((keys) => {
    localStorage.setItem(keys.ACCESS_TOKEN, 'mock-access-token')
    localStorage.setItem(keys.REFRESH_TOKEN, 'mock-refresh-token')
  }, STORAGE_KEYS)
}

test.describe('Commitment Lifecycle E2E', () => {
  test('creates, logs activity, and deletes a commitment', async ({ page }) => {
    await authenticate(page)

    const commitments: CommitmentRecord[] = []
    const logsByCommitment: Record<string, Array<{ id: string; commitmentId: string; completedAt: string; note: string | null }>> = {}

    await page.route('**/api/commitments/*/logs', async (route) => {
      const method = route.request().method()
      const url = new URL(route.request().url())
      const parts = url.pathname.split('/')
      const commitmentId = parts[parts.length - 2]

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'S001',
            message: 'Logs retrieved',
            data: logsByCommitment[commitmentId] || [],
          }),
        })
        return
      }

      if (method === 'POST') {
        const body = route.request().postDataJSON() as { note?: string }
        const log = {
          id: `log-${Date.now()}`,
          commitmentId,
          completedAt: new Date().toISOString(),
          note: body.note ?? null,
        }
        logsByCommitment[commitmentId] = [log, ...(logsByCommitment[commitmentId] || [])]
        const commitment = commitments.find((item) => item.id === commitmentId)
        if (commitment) {
          commitment.completedToday = true
          commitment.updatedAt = new Date().toISOString()
        }

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'S002',
            message: 'Commitment log created',
            data: log,
          }),
        })
        return
      }

      await route.fallback()
    })

    await page.route('**/api/commitments**', async (route) => {
      const url = new URL(route.request().url())
      if (!url.pathname.endsWith('/api/commitments')) {
        await route.fallback()
        return
      }

      const method = route.request().method()

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'S001',
            message: 'Commitments retrieved',
            data: commitments,
          }),
        })
        return
      }

      if (method === 'POST') {
        const body = route.request().postDataJSON() as { title: string; scheduledDays: string[] }
        const now = new Date().toISOString()
        const created: CommitmentRecord = {
          id: `commitment-${commitments.length + 1}`,
          userId: 'user-1',
          title: body.title,
          scheduledDays: body.scheduledDays,
          completedToday: false,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        }
        commitments.unshift(created)

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'S002',
            message: 'Commitment created',
            data: created,
          }),
        })
        return
      }

      await route.fallback()
    })

    await page.route('**/api/commitments/*', async (route) => {
      if (route.request().method() !== 'DELETE') {
        await route.fallback()
        return
      }

      const id = route.request().url().split('/').pop() || ''
      const idx = commitments.findIndex((item) => item.id === id)
      if (idx >= 0) commitments.splice(idx, 1)
      delete logsByCommitment[id]

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'S004',
          message: 'Commitment deleted',
          data: { id },
        }),
      })
    })

    await page.goto('/commitments')

    await page.getByTestId('commitment-create-button').click()
    await page.getByTestId('commitment-title-input').fill('Daily Reflection')
    await page.getByTestId('commitment-form-submit').click()

    await expect(page.getByTestId('commitments-list')).toContainText('Daily Reflection')

    await page.getByTestId('commitment-card').first().click()
    await expect(page).toHaveURL(/\/commitments\/commitment-/)

    await page.getByTestId('commitment-log-button').click()
    await page.getByTestId('commitment-log-note').fill('Completed reflection after standup.')
    await page.getByTestId('commitment-log-submit').click()

    await expect(page.getByText('No activity logged yet. Click "Log Activity" to start tracking!')).toHaveCount(0)

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByTestId('commitment-delete-button').click()
    await expect(page).toHaveURL('/commitments')
  })
})
