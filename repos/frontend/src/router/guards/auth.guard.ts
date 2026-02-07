import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Navigation guard for authentication
 * - Redirects unauthenticated users to login for protected routes
 * - Redirects authenticated users away from auth pages to dashboard
 */
export function authGuard(
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
) {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        // Protected route but not authenticated - redirect to login with return URL
        next({ name: 'login', query: { redirect: to.fullPath } })
    } else if (isAuthRoute(to) && authStore.isAuthenticated) {
        // Already authenticated but trying to visit auth page - go to dashboard
        next({ name: 'dashboard' })
    } else {
        // Allow navigation
        next()
    }
}

/**
 * Check if route is an authentication page (login/register)
 */
export function isAuthRoute(route: RouteLocationNormalized): boolean {
    return route.name === 'login' || route.name === 'register'
}
