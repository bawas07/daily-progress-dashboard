import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { authGuard } from './guards/auth.guard'

// Lazy-loaded route components
const LoginView = () => import('@/features/auth/views/LoginView.vue')
const RegisterView = () => import('@/features/auth/views/RegisterView.vue')
const DashboardView = () => import('@/features/dashboard/views/DashboardView.vue')
const HistoryView = () => import('@/features/history/views/HistoryView.vue')
const SettingsView = () => import('@/features/settings/views/SettingsView.vue')
const ProgressItemsView = () => import('@/features/progress/views/ProgressItemsView.vue')
const CommitmentsView = () => import('@/features/commitments/views/CommitmentsView.vue')
const TimelineView = () => import('@/features/timeline/views/TimelineView.vue')
const TestComponents = () => import('@/components/ui/TestComponents.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryView,
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/progress',
    name: 'progress',
    component: ProgressItemsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/commitments',
    name: 'commitments',
    component: CommitmentsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/timeline',
    name: 'timeline',
    component: TimelineView,
    meta: { requiresAuth: true },
  },
  {
    path: '/test-components',
    name: 'test-components',
    component: TestComponents,
    meta: { requiresAuth: false },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/features/common/views/NotFoundView.vue'),
    meta: { requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard
router.beforeEach(authGuard)

export default router

