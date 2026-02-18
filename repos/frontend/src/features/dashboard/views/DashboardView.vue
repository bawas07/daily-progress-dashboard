<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useDashboard } from '../composables/useDashboard'
import { Button, Spinner } from '@/components/ui'
import TimelineSection from '../components/TimelineSection.vue'
import EisenhowerMatrix from '../components/EisenhowerMatrix.vue'
import CommitmentsSection from '../components/CommitmentsSection.vue'
import type { DashboardCommitment } from '../types/dashboard.types'

const router = useRouter()
const authStore = useAuthStore()
const {
  dashboardData,
  loading,
  error,
  formattedDate,
  isToday,
  fetchDashboard,
  refresh,
  goToToday,
} = useDashboard()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function handleCommitmentToggle(commitment: DashboardCommitment) {
  // TODO: Wire to commitment log API in task 3.3
  console.log('Toggle commitment:', commitment.id)
}

onMounted(() => {
  fetchDashboard()
})
</script>

<template>
  <div class="dashboard-view min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900" data-testid="dashboard-title">
            Dashboard
          </h1>
          <p class="text-sm text-gray-500 mt-1" data-testid="dashboard-date">
            {{ formattedDate }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Navigation Links -->
          <nav class="hidden md:flex items-center gap-2">
            <router-link
              to="/progress"
              class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
            >
              Progress Items
            </router-link>
            <router-link
              to="/commitments"
              class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
            >
              Commitments
            </router-link>
            <router-link
              to="/timeline"
              class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
            >
              Timeline
            </router-link>
            <router-link
              to="/history"
              class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
            >
              History
            </router-link>
            <router-link
              to="/settings"
              class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
            >
              Settings
            </router-link>
          </nav>

          <Button
            v-if="!isToday"
            data-testid="today-button"
            variant="ghost"
            size="sm"
            @click="goToToday(); fetchDashboard()"
          >
            Today
          </Button>
          <Button
            data-testid="refresh-button"
            variant="secondary"
            size="sm"
            :disabled="loading"
            @click="refresh"
          >
            ↻ Refresh
          </Button>
          <Button
            data-testid="logout-button"
            variant="primary"
            size="sm"
            @click="handleLogout"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main>
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

        <!-- Loading State -->
        <div
          v-if="loading && !dashboardData"
          class="flex items-center justify-center py-16"
          data-testid="dashboard-loading"
        >
          <div class="text-center">
            <Spinner size="lg" label="Loading dashboard" />
            <p class="mt-3 text-sm text-neutral-500">Loading dashboard...</p>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="flex items-center justify-center py-16"
          data-testid="dashboard-error"
        >
          <div class="text-center">
            <p class="text-red-600 text-base font-medium">{{ error }}</p>
            <Button
              data-testid="retry-button"
              variant="primary"
              class="mt-4"
              @click="fetchDashboard"
            >
              Retry
            </Button>
          </div>
        </div>

        <!-- Dashboard Sections -->
        <div v-else-if="dashboardData" class="space-y-4" data-testid="dashboard-sections">
          <TimelineSection :events="dashboardData.timeline.events" />
          <EisenhowerMatrix :progressItems="dashboardData.progressItems" />
          <CommitmentsSection
            :commitments="dashboardData.commitments"
            @toggle="handleCommitmentToggle"
          />
        </div>
      </div>
    </main>
  </div>
</template>
