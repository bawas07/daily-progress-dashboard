import { test, expect } from '@playwright/test'
import { ROUTES, SELECTORS, STORAGE_KEYS, generateTestEmail } from './fixtures'

test.describe('Authentication E2E Tests', () => {
    test.describe('Login Flow', () => {
        test('should display login form', async ({ page }) => {
            await page.goto(ROUTES.LOGIN)

            await expect(page.locator('h1')).toContainText('Sign in')
            await expect(page.locator(SELECTORS.EMAIL_INPUT)).toBeVisible()
            await expect(page.locator(SELECTORS.PASSWORD_INPUT)).toBeVisible()
            await expect(page.locator(SELECTORS.SUBMIT_BUTTON)).toBeVisible()
        })

        test('should show validation error for empty form submission', async ({ page }) => {
            await page.goto(ROUTES.LOGIN)

            await page.click(SELECTORS.SUBMIT_BUTTON)

            await expect(page.locator(SELECTORS.ERROR_MESSAGE)).toBeVisible()
        })

        test('should show error for invalid credentials', async ({ page }) => {
            await page.goto(ROUTES.LOGIN)

            await page.fill(SELECTORS.EMAIL_INPUT, 'invalid@example.com')
            await page.fill(SELECTORS.PASSWORD_INPUT, 'wrongpassword')
            await page.click(SELECTORS.SUBMIT_BUTTON)

            // Wait for the error message to appear
            await expect(page.locator(SELECTORS.ERROR_MESSAGE)).toBeVisible({ timeout: 10000 })
        })

        test('should have link to registration page', async ({ page }) => {
            await page.goto(ROUTES.LOGIN)

            const registerLink = page.locator('a[href="/register"]')
            await expect(registerLink).toBeVisible()

            await registerLink.click()
            await expect(page).toHaveURL(ROUTES.REGISTER)
        })
    })

    test.describe('Registration Flow', () => {
        test('should display registration form', async ({ page }) => {
            await page.goto(ROUTES.REGISTER)

            await expect(page.locator('h1')).toContainText('Create your account')
            await expect(page.locator(SELECTORS.NAME_INPUT)).toBeVisible()
            await expect(page.locator(SELECTORS.EMAIL_INPUT)).toBeVisible()
            await expect(page.locator(SELECTORS.PASSWORD_INPUT)).toBeVisible()
            await expect(page.locator(SELECTORS.SUBMIT_BUTTON)).toBeVisible()
        })

        test('should show validation error for empty form submission', async ({ page }) => {
            await page.goto(ROUTES.REGISTER)

            await page.click(SELECTORS.SUBMIT_BUTTON)

            await expect(page.locator(SELECTORS.ERROR_MESSAGE)).toBeVisible()
        })

        test('should validate password complexity', async ({ page }) => {
            await page.goto(ROUTES.REGISTER)

            await page.fill(SELECTORS.NAME_INPUT, 'Test User')
            await page.fill(SELECTORS.EMAIL_INPUT, 'test@example.com')

            // Test no uppercase
            await page.fill(SELECTORS.PASSWORD_INPUT, 'test1234')
            await page.click(SELECTORS.SUBMIT_BUTTON)
            await expect(page.getByText('Password must contain at least one uppercase letter')).toBeVisible()

            // Test no lowercase
            await page.fill(SELECTORS.PASSWORD_INPUT, 'TEST1234')
            await page.click(SELECTORS.SUBMIT_BUTTON)
            await expect(page.getByText('Password must contain at least one lowercase letter')).toBeVisible()

            // Test no number
            await page.fill(SELECTORS.PASSWORD_INPUT, 'TestPassword')
            await page.click(SELECTORS.SUBMIT_BUTTON)
            await expect(page.getByText('Password must contain at least one number')).toBeVisible()
        })

        test('should have link to login page', async ({ page }) => {
            await page.goto(ROUTES.REGISTER)

            const loginLink = page.locator('a[href="/login"]')
            await expect(loginLink).toBeVisible()

            await loginLink.click()
            await expect(page).toHaveURL(ROUTES.LOGIN)
        })
    })

    test.describe('Route Protection', () => {
        test('should redirect unauthenticated user to login when accessing dashboard', async ({ page }) => {
            // Clear any stored tokens
            await page.goto(ROUTES.LOGIN)
            await page.evaluate((keys) => {
                localStorage.removeItem(keys.ACCESS_TOKEN)
                localStorage.removeItem(keys.REFRESH_TOKEN)
            }, STORAGE_KEYS)

            // Try to access dashboard
            await page.goto(ROUTES.DASHBOARD)

            // Should be redirected to login
            await expect(page).toHaveURL(/\/login/)
        })

        test('should preserve redirect URL when redirecting to login', async ({ page }) => {
            // Clear any stored tokens
            await page.goto(ROUTES.LOGIN)
            await page.evaluate((keys) => {
                localStorage.removeItem(keys.ACCESS_TOKEN)
                localStorage.removeItem(keys.REFRESH_TOKEN)
            }, STORAGE_KEYS)

            // Try to access a protected route
            await page.goto('/history')

            // Should be redirected to login with redirect query param
            await expect(page).toHaveURL(/\/login\?redirect=/)
        })

        test('should redirect authenticated user away from login page', async ({ page }) => {
            // Set mock tokens in localStorage
            await page.goto(ROUTES.LOGIN)
            await page.evaluate((keys) => {
                localStorage.setItem(keys.ACCESS_TOKEN, 'mock-access-token')
                localStorage.setItem(keys.REFRESH_TOKEN, 'mock-refresh-token')
            }, STORAGE_KEYS)

            // Try to visit login page
            await page.goto(ROUTES.LOGIN)

            // Should be redirected to dashboard
            await expect(page).toHaveURL(ROUTES.DASHBOARD)
        })
    })

    test.describe('Session Persistence', () => {
        test('should persist authentication state on page reload', async ({ page }) => {
            // Set mock tokens in localStorage
            await page.goto(ROUTES.LOGIN)
            await page.evaluate((keys) => {
                localStorage.setItem(keys.ACCESS_TOKEN, 'mock-access-token')
                localStorage.setItem(keys.REFRESH_TOKEN, 'mock-refresh-token')
            }, STORAGE_KEYS)

            // Navigate to dashboard
            await page.goto(ROUTES.DASHBOARD)
            await expect(page.locator(SELECTORS.DASHBOARD_HEADING)).toBeVisible()

            // Reload the page
            await page.reload()

            // Should still be on dashboard
            await expect(page.locator(SELECTORS.DASHBOARD_HEADING)).toBeVisible()
        })

        test('should store tokens in localStorage after mock login', async ({ page }) => {
            await page.goto(ROUTES.LOGIN)

            // Check that localStorage can store tokens
            const result = await page.evaluate((keys) => {
                localStorage.setItem(keys.ACCESS_TOKEN, 'test-token')
                return localStorage.getItem(keys.ACCESS_TOKEN)
            }, STORAGE_KEYS)

            expect(result).toBe('test-token')
        })
    })

    test.describe('Logout Flow', () => {
        test('should display logout button on dashboard', async ({ page }) => {
            // Set mock tokens to access dashboard
            await page.goto(ROUTES.LOGIN)
            await page.evaluate((keys) => {
                localStorage.setItem(keys.ACCESS_TOKEN, 'mock-access-token')
                localStorage.setItem(keys.REFRESH_TOKEN, 'mock-refresh-token')
            }, STORAGE_KEYS)

            await page.goto(ROUTES.DASHBOARD)
            await expect(page.locator(SELECTORS.LOGOUT_BUTTON)).toBeVisible()
        })

        test('should clear tokens and redirect to login on logout', async ({ page }) => {
            // Mock endpoints to prevent unexpected token operations
            await page.route('**/auth/revoke', route => route.fulfill({ status: 200 }))
            await page.route('**/auth/refresh', route => route.fulfill({ status: 400 }))

            // Set mock tokens to access dashboard
            await page.goto(ROUTES.LOGIN)
            await page.evaluate((keys) => {
                localStorage.setItem(keys.ACCESS_TOKEN, 'mock-access-token')
                localStorage.setItem(keys.REFRESH_TOKEN, 'mock-refresh-token')
            }, STORAGE_KEYS)


            await page.goto(ROUTES.DASHBOARD)

            // Click logout
            await page.click(SELECTORS.LOGOUT_BUTTON)

            // Wait for navigation to complete
            await page.waitForURL(/\/login/)

            // Tokens should be cleared (use polling to wait for async storage updates)
            await expect.poll(async () => {
                return await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.ACCESS_TOKEN)
            }).toBeNull()

            await expect.poll(async () => {
                return await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.REFRESH_TOKEN)
            }).toBeNull()
        })

        test('should not be able to access dashboard after logout', async ({ page }) => {
            // Set mock tokens to access dashboard
            await page.goto(ROUTES.LOGIN)
            await page.evaluate((keys) => {
                localStorage.setItem(keys.ACCESS_TOKEN, 'mock-access-token')
                localStorage.setItem(keys.REFRESH_TOKEN, 'mock-refresh-token')
            }, STORAGE_KEYS)

            await page.goto(ROUTES.DASHBOARD)

            // Click logout
            await page.click(SELECTORS.LOGOUT_BUTTON)
            await expect(page).toHaveURL(ROUTES.LOGIN)

            // Try to access dashboard again
            await page.goto(ROUTES.DASHBOARD)

            // Should be redirected to login
            await expect(page).toHaveURL(/\/login/)
        })
    })
})
