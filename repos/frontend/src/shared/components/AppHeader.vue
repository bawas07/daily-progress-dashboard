<script setup lang="ts">
/**
 * AppHeader Component
 *
 * Reusable header component with navigation and user actions.
 * Used across all main pages of the application.
 */
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useDashboard } from '@/features/dashboard/composables/useDashboard'

interface Props {
  title?: string
  subtitle?: string
  showRefresh?: boolean
  showToday?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Dashboard',
  subtitle: '',
  showRefresh: false,
  showToday: false,
})

const router = useRouter()
const authStore = useAuthStore()
const {
  loading: dashboardLoading,
  formattedDate,
  isToday,
  fetchDashboard,
  refresh,
  goToToday,
} = useDashboard()

// Navigation links
const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/progress', label: 'Progress Items' },
  { to: '/commitments', label: 'Commitments' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
]

// Get current route for active state
const currentPath = window.location.pathname

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

async function handleRefresh() {
  if (currentPath === '/') {
    await fetchDashboard()
  }
}

async function handleGoToToday() {
  if (currentPath === '/') {
    await goToToday()
    await fetchDashboard()
  }
}
</script>

<template>
  <header class="bg-white shadow">
    <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">{{ title }}</h1>
        <p v-if="subtitle" class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
        <p v-else-if="currentPath === '/'" class="text-sm text-gray-500 mt-1">{{ formattedDate }}</p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Navigation Links -->
        <nav class="hidden md:flex items-center gap-2">
          <router-link
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-3 py-2 text-sm font-medium rounded-md transition-colors"
            :class="currentPath === link.to
              ? 'text-primary-600 bg-gray-100'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'"
            :aria-current="currentPath === link.to ? 'page' : undefined"
          >
            {{ link.label }}
          </router-link>
        </nav>

        <!-- Dashboard Actions -->
        <Button
          v-if="showToday && !isToday && currentPath === '/'"
          variant="ghost"
          size="sm"
          :disabled="dashboardLoading"
          @click="handleGoToToday"
        >
          Today
        </Button>

        <Button
          v-if="showRefresh && currentPath === '/'"
          variant="secondary"
          size="sm"
          :disabled="dashboardLoading"
          @click="handleRefresh"
        >
          ↻ Refresh
        </Button>

        <!-- Slot for custom actions -->
        <slot name="actions" />

        <Button
          variant="primary"
          size="sm"
          @click="handleLogout"
        >
          Logout
        </Button>
      </div>
    </div>
  </header>
</template>
