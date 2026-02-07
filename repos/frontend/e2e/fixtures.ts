/**
 * E2E Test Fixtures and Utilities
 *
 * Shared utilities for authentication E2E tests
 */

/**
 * Test user credentials
 */
export const TEST_USER = {
    email: 'test@example.com',
    password: 'TestPassword123',
    name: 'Test User',
}

/**
 * Generate a unique test email for registration tests
 */
export function generateTestEmail(): string {
    const timestamp = Date.now()
    return `test-${timestamp}@example.com`
}

/**
 * Auth route paths
 */
export const ROUTES = {
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/',
} as const

/**
 * Selectors for common elements
 */
export const SELECTORS = {
    // Login form
    EMAIL_INPUT: '#email',
    PASSWORD_INPUT: '#password',
    SUBMIT_BUTTON: 'button[type="submit"]',
    ERROR_MESSAGE: '.text-red-500',

    // Register form
    NAME_INPUT: '#name',
    CONFIRM_PASSWORD_INPUT: '#confirmPassword',

    // Dashboard
    DASHBOARD_HEADING: 'h1:has-text("Dashboard")',
    LOGOUT_BUTTON: '[data-testid="logout-button"]',
} as const

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
} as const
